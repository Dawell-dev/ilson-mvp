# DECISIONS — 일손

> 의사결정 대기 큐. 빠르게 결정해서 큐가 쌓이지 않게 운영.

## 작성 룰

포맷: `[등록일] | 질문 | 차단 PR/작업 | 대기 답변자`

원칙:
- 1일 이상 대기 시 알림 (`/init` 단계)
- 결정 완료 시 archive 섹션으로 이동 + 사유 기록

---

## 대기 중

(없음)

---

## 완료 (최근 30일)

### [2026-06-17] 프레임워크 스택: CRA 유지 vs Next.js 마이그레이션

**결정**: CRA + JavaScript 유지. Next.js + TypeScript 마이그레이션은 백로그.

**배경**: 레포 실제 스택이 문서(Next.js 16 + TS)와 불일치. 실제는 CRA(react-scripts 5.0.1) + JS, React 19, react-router-dom 7, Tailwind 3.4. 이전 개발자가 CRA로 구축.

**사유**:
- 이미 Vercel 배포 + Kakao OAuth(PKCE) 디버깅 완료. 갈아엎으면 라우팅 바뀐 환경에서 재검증 필요 → 손실 큼.
- CRA→Next.js는 가역적 결정. PMF 검증 전 인프라 투자는 순서가 거꾸로.

**반영**:
- CLAUDE.md 스택을 실제 상태로 수정 완료.
- type-safety-reviewer 비활성화. 핵심 데이터 흐름(매칭 로직·Supabase 응답)만 JSDoc 타입 힌트 + ESLint로 방어.

**마이그레이션 트리거** (둘 중 먼저 오는 것):
1. PMF 검증 완료 후 정식 개발 진입
2. SEO 유입 필요 판단 시점

**결정자**: 김주은 (PM)
