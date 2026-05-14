# PredixScore 아키텍처

## 스택
- **Frontend**: Next.js 15 (App Router) + React 19 (client-only `App.tsx`)
- **State**: Zustand (UI/Auth) + TanStack Query (서버 상태)
- **Backend**: Supabase (Postgres + Auth + RLS)
- **DB Access**: `@supabase/supabase-js` 브라우저 직결 (RLS 의존)
- **Future**: Prisma 전환 옵션 (`docs/archive/prisma-migration.md` 참조)

## 디렉토리 구조

```
src/
├── app/
│   ├── layout.tsx        # Providers wrap
│   └── page.tsx          # App entry
├── App.tsx               # 라우터 + 모달 root
├── providers/
│   ├── Providers.tsx     # QueryProvider + AuthProvider
│   ├── QueryProvider.tsx # TanStack Query
│   └── AuthProvider.tsx  # Supabase 세션 → Zustand 동기화
├── store/
│   ├── auth.ts           # useAuthStore (user, session, profile)
│   └── ui.ts             # useUiStore (stack, modals)
├── lib/
│   └── supabase/
│       ├── client.ts     # Browser 클라이언트 (lazy)
│       ├── auth.ts       # signUp/signIn/signOut/getCurrentProfile
│       └── mappers.ts    # DB row → UI 타입 변환
├── hooks/
│   ├── queryKeys.ts      # 표준 query key
│   ├── useExperts.ts
│   ├── usePreds.ts       # + useSubmitPrediction (mutation)
│   ├── useFeed.ts
│   ├── useEvents.ts
│   └── useDMs.ts         # + useSendMessage (mutation)
├── types/
│   ├── index.ts          # 도메인 UI 타입 (기존)
│   └── database.ts       # Supabase 자동 생성 타입
└── components/
    ├── modals/AuthModal.tsx     # 실제 signIn/signUp 호출
    ├── modals/PredictModal.tsx  # useSubmitPrediction
    └── screens/...              # 각 화면이 useQuery 훅 사용
```

## 상태 관리 분리

| 종류 | 도구 | 예시 |
|---|---|---|
| 서버 상태 | TanStack Query | 예측, 전문가, 피드, 이벤트 |
| 클라이언트 UI | Zustand `useUiStore` | 네비게이션 stack, 모달 toggle |
| 인증 (파생) | Zustand `useAuthStore` (AuthProvider 동기화) | user, session, profile |

## 데이터 흐름

```
[Supabase DB]
    ↓ RLS 검사
[supabase-js client]
    ↓ map* 함수
[React Query cache]
    ↓ useXxx hook
[Component]
```

쓰기:
```
[Component] → useMutation → supabase.from(...).insert()
                                        ↓
                                   RLS 검사
                                        ↓
                              onSuccess → invalidateQueries
```

## RLS 정책 요약

| 테이블 | SELECT | INSERT | UPDATE |
|---|---|---|---|
| profiles | 전체 | 본인 | 본인 |
| experts | 전체 | (관리자) | (관리자) |
| predictions | 전체 | (관리자) | (관리자) |
| user_predictions | 본인 | 본인 | ❌ (봉인) |
| feed_items | 전체 | (관리자) | - |
| events | 전체 | (관리자) | - |
| conversations | 본인 참여 | 본인 참여 | - |
| messages | 본인 참여 | 본인 참여 | - |

## 환경 변수

`.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://lljkdjijozfnjqbkntce.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxx
```

## 주요 트리거 (DB)

- `on_auth_user_created`: `auth.users` insert 시 `profiles` 자동 생성 (handle 은 user_metadata 또는 id 기반 자동)
- `trg_user_predictions_count`: `user_predictions` insert 시 `predictions.participants += 1`
- `trg_*_updated_at`: `profiles/experts/predictions` updated_at 자동 갱신
- ⚠️ `trg_auto_confirm_email` (개발 전용): 신규 가입자 이메일 자동 확인. **운영 전환 시 반드시 제거**
  ```sql
  drop trigger if exists trg_auto_confirm_email on auth.users;
  drop function if exists public.dev_auto_confirm_email();
  ```
  대신 Supabase Dashboard > Authentication > Email Templates 에서 도메인 설정.

## 인증 동작 (현재)

- 가입(`signUp`) → `auth.users` insert → 트리거 두 개 동시 실행
  1. `dev_auto_confirm_email`: `email_confirmed_at = now()` (개발 편의)
  2. `handle_new_user`: `public.profiles` row 생성
- 가입 직후 세션 발급 여부는 Supabase Auth 설정의 "Confirm email" 토글에 따라 결정
  - **OFF**: signUp 응답에 session 포함 → 즉시 로그인 상태
  - **ON**: signUp 응답에 user만 (session=null) → AuthModal에 "확인 메일 발송" 안내 출력
- 로그인(`signInWithPassword`) → 세션 쿠키 설정 → `onAuthStateChange` → Zustand 동기화 → React Query "me" 키 invalidate

## 확장 포인트

- **DM**: 현재 `conversations`/`messages` 테이블만 있고 UI는 정적. 실 사용 시 `useDMList`, `useSendMessage` 활용.
- **이벤트 참여**: 현재 `events.experts` JSONB. 정규화 필요 시 `event_experts` 테이블 분리.
- **포인트/지갑**: 별도 테이블 필요 (현재 `profiles.wallet` 만 존재).
