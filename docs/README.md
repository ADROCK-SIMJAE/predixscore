# PredixScore 문서

> 개발할 때는 여기서 시작한다. 아래 문서만 현재 기준 문서로 본다.

## 현재 기준 문서

1. [`product-plan.md`](./product-plan.md)
   - 제품 정의
   - 유저 플로우
   - Polymarket 사용 범위
   - 가스비 대납 정책
   - Track A / Track B 개발 방향 결정

2. [`implementation-plan.md`](./implementation-plan.md)
   - 실제 개발 순서
   - Track A: 블록체인 없이 Supabase 먼저
   - Track B: Supabase + 가스비 대납 블록체인 먼저
   - QA 시나리오
   - 당장 해야 할 작업

3. [`architecture.md`](./architecture.md)
   - 현재 앱 구조
   - Next.js, Supabase, Zustand, TanStack Query 구조
   - 현재 DB/RLS/Auth 메모

4. [`polymarket-api.md`](./polymarket-api.md)
   - 이 프로젝트에서 쓰는 Polymarket API 참고 문서
   - Gamma API / CLOB API / rate limit / WebSocket 정리

## 뭘 먼저 보면 되나

먼저 [`product-plan.md`](./product-plan.md)를 본다.

핵심 결정은 하나다.

- `Track A`: 블록체인 없이 같은 제품 플로우를 먼저 만든다.
- `Track B`: Supabase + 가스비 대납 onchain commit-reveal을 처음부터 만든다.

기본 권장:

- 빠르게 사용 가능한 MVP가 필요하면 `Track A`.
- 첫 공개 버전부터 가스비 대납 + server-blind 검증이 제품 약속이면 `Track B`.

## 아카이브

예전 기획 문서는 [`archive/`](./archive/)로 옮겼다.

아카이브 문서는 참고용이다. 현재 개발 기준으로 쓰지 않는다.

