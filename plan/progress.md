# Development Progress

> 마지막 갱신: 2026-05-13 17:08 KST

## 현재 트랙

- Track A: 블록체인 없이 Supabase paper trading 먼저

## 현재 단계

- Phase A1: Supabase Paper Trading Core
- Phase A2: Bet UX와 Market Guardrail

## 진행 상태

| 영역 | 상태 | 메모 |
|---|---|---|
| 문서 정리 | 완료 | 기준 문서 4개 + archive 구조로 정리 |
| Supabase migration 확인 | 부분 완료 | API/RPC 호출 기준 테이블/함수 존재 확인됨 |
| paper positions API | 부분 완료 | GET 정상, 비로그인 POST 401 정상, 서버 market/token/price 검증 추가 |
| settlement API | 부분 완료 | pending 없음 기준 POST 정상, service role 미설정이라 실제 정산 적용은 미검증 |
| stats/profile/leaderboard | 부분 완료 | stats/leaderboard API 정상, profile은 데이터 있는 계정으로 추가 검증 필요 |
| Bet UX guardrail | 부분 완료 | token/price/outcome/closed validation을 CTA, modal, 저장 API에 반영. 브라우저 클릭 QA 필요 |

## 이번 작업 목표

1. 현재 코드와 migration 상태를 점검한다. 완료
2. Phase A1에서 바로 막히는 부분을 찾는다. 완료
3. 가능한 경우 paper API end-to-end 검증까지 진행한다. 부분 완료
4. Bet UX guardrail을 반영한다. 완료

## 작업 로그

- 2026-05-13: `plan/` 진행판 생성.
- 2026-05-13: `npm run build` 통과. Tailwind arbitrary duration 경고와 Polymarket data cache 2MB 초과 경고 확인.
- 2026-05-13: `/api/paper/positions` GET 정상, 비로그인 POST 401 정상 확인.
- 2026-05-13: `/api/paper/stats`, `/api/leaderboard`, `/api/paper/settle` empty-case 정상 확인.
- 2026-05-13: `/api/polymarket/markets?limit=3` 정상 확인.
- 2026-05-13: BetModal과 MarketDetailClient에 unsupported market guardrail 추가.
- 2026-05-13: `POST /api/paper/positions`에 서버 측 Polymarket event/market/token/outcome/price 검증 추가.
- 2026-05-13: Tailwind duration 경고 제거.
- 2026-05-13: Polymarket home snapshot page size를 10으로 낮춰 Next data cache 2MB 초과 경고 제거.
- 2026-05-13: `npm run build` 경고 없이 통과.

## 다음 액션

- 로그인 세션으로 `POST /api/paper/positions` 실제 저장 검증
- 저장 후 positions/stats/home portfolio 숫자 일치 확인
- `SUPABASE_SERVICE_ROLE_KEY` 설정 후 settlement 실제 적용 검증
- 브라우저에서 unsupported market CTA disabled 상태 확인
