# Prisma 전환 계획

> 현재: Supabase Postgres + supabase-js (브라우저 직결, RLS 의존)
> 목표: Prisma ORM 도입 (서버 측 API 라우트 또는 Server Actions 경유)

## 1. 전환 결정 기준

| 기준 | 현재 (Supabase 직결) | Prisma 전환 시 |
|---|---|---|
| 클라이언트 직결 | ✅ RLS로 충분 | ❌ 서버 경유 필요 |
| 트랜잭션/조인 복잡도 | 단순 | 복잡할수록 유리 |
| 타입 안정성 | 자동 생성 | Prisma Client 더 강력 |
| 마이그레이션 관리 | Supabase MCP | `prisma migrate` |
| 비용 | DB만 | DB + Node 런타임 |

**전환을 미뤄도 되는 경우**: 화면이 거의 단순 CRUD + RLS로 보안 충분. 현재 상태가 그렇습니다.

**전환이 필요한 시그널**:
- 다중 테이블 트랜잭션 (예: `user_predictions` insert + `profiles.preds_count` 증가)
- 검색/집계 쿼리 복잡화
- 서버에서만 가능한 외부 API 호출 (블록체인 봉인 등)
- 어드민 백오피스 분리

## 2. 단계별 전환 가이드

### Phase 1 — Prisma 설치 및 introspection
```bash
npm install -D prisma
npm install @prisma/client
npx prisma init
```

`.env`에 Supabase Postgres connection string 추가:
```
# 직결 (마이그레이션용)
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.lljkdjijozfnjqbkntce.supabase.co:5432/postgres"
# pooled (앱 런타임용)
DATABASE_URL="postgresql://postgres.[ref]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
```

`prisma/schema.prisma`:
```prisma
generator client { provider = "prisma-client-js" }

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

기존 Supabase 스키마 가져오기:
```bash
npx prisma db pull
npx prisma generate
```

### Phase 2 — Prisma Client 래퍼 작성
`src/lib/prisma.ts`:
```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

### Phase 3 — API Route / Server Action 도입
현재 클라이언트 직결인 mutation을 서버로 옮깁니다.

예: `useSubmitPrediction` →
```ts
// src/app/api/predictions/submit/route.ts
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server"; // SSR 클라이언트
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { predictionId, choice } = await req.json();

  const sealed = await prisma.$transaction(async (tx) => {
    const up = await tx.user_predictions.create({
      data: { user_id: user.id, prediction_id: predictionId, choice },
    });
    await tx.predictions.update({
      where: { id: predictionId },
      data: { participants: { increment: 1 } },
    });
    await tx.profiles.update({
      where: { id: user.id },
      data: { preds_count: { increment: 1 } },
    });
    return up;
  });

  return NextResponse.json(sealed);
}
```

클라이언트 hook은 fetch 래퍼로:
```ts
// src/hooks/usePreds.ts
mutationFn: async ({ predictionId, choice }) => {
  const r = await fetch("/api/predictions/submit", {
    method: "POST",
    body: JSON.stringify({ predictionId, choice }),
  });
  if (!r.ok) throw new Error((await r.json()).error);
  return r.json();
},
```

### Phase 4 — Auth 동기화 (Supabase 유지 권장)
**Auth는 계속 Supabase Auth 유지**가 가장 효율적입니다. Prisma는 데이터 액세스만, 세션은 `@supabase/ssr` 로 처리:

```ts
// src/lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cs) => cs.forEach((c) => cookieStore.set(c.name, c.value, c.options)),
      },
    },
  );
}
```

### Phase 5 — RLS 정책 재검토
서버 경유로 바뀌면 RLS는 **방어 심층 (defense-in-depth)** 역할만 남습니다. 다음 중 선택:
1. **유지**: RLS 그대로. 서버에서 `service_role` 키 사용 시 우회 가능.
2. **단순화**: 서버 검증을 신뢰하고 일부 정책 완화.
3. **혼합**: 읽기는 클라이언트 직결 (RLS), 쓰기만 서버 (Prisma).

권장: **3번 혼합 모드**가 점진적 전환에 가장 부드럽습니다.

## 3. 스키마 매핑 표

| Supabase 테이블 | Prisma 모델 | 비고 |
|---|---|---|
| `auth.users` | (Prisma 외부) | Supabase Auth 유지 |
| `profiles` | `Profile` | `id` 는 `users(id)` FK |
| `experts` | `Expert` | `profile_id` optional |
| `predictions` | `Prediction` | `author_expert_id` FK |
| `user_predictions` | `UserPrediction` | unique (user_id, prediction_id) |
| `feed_items` | `FeedItem` | `expert_id` FK |
| `events` | `Event` | jsonb: `experts`, `history` |
| `conversations` | `Conversation` | unique (user_a, user_b) |
| `messages` | `Message` | conversation FK |

ENUM 매핑:
- `grade_key` → `enum GradeKey { candidate forecaster proven seer }`
- `pred_stage` → `enum PredStage { active verify done }`
- `pred_choice` → `enum PredChoice { A B }`
- `event_status` → `enum EventStatus { live upcoming ended }`

## 4. 전환 체크리스트

- [ ] Phase 1: Prisma 설치 + `db pull`
- [ ] Phase 2: `lib/prisma.ts` 싱글톤
- [ ] Phase 3: 첫 mutation 1개를 API Route로 옮기기 (`predictions/submit` 권장)
- [ ] Phase 4: SSR Supabase client (`@supabase/ssr` server side)
- [ ] Phase 5: 모든 mutation 서버 이전 후 RLS 정책 점검
- [ ] Phase 6: read-side도 필요하면 이전 (페이지네이션/검색 시)
- [ ] Phase 7: 시드 스크립트 `prisma/seed.ts` 로 이주
- [ ] Phase 8: 정리 — `.env.example` 갱신, Cl 직결 코드 제거 결정

## 5. 주의사항

- **Connection pool**: Vercel/serverless 에서는 `pgbouncer=true&connection_limit=1` 필수.
- **Prepared statements**: pgbouncer transaction 모드와 충돌. `?pgbouncer=true` 로 비활성화.
- **트리거**: `on_auth_user_created` 같은 DB-side 트리거는 Prisma 인지 못함. 마이그레이션 시 raw SQL로 보존.
- **JSONB 컬럼**: Prisma는 `Json` 타입. 강한 타입 필요시 zod schema 별도 유지.
