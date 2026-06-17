# Progress — 일손

> 마지막 업데이트: 2026-06-18

## 📑 최근 세션

## 2026-06-18 — PR #27 머지 (fix/supabase-env)

- Supabase URL/anonKey 하드코딩 제거 → process.env 참조로 변경
- 환경변수 누락 시 throw 추가 (lib/supabase.js)
- Vercel 환경변수 등록: REACT_APP_SUPABASE_URL / ANON_KEY (Production·Preview)
- 검증: Preview·배포본 로그인 정상 (exchangeCodeForSession error: null, SIGNED_IN 확인)
- 머지 후 fix/supabase-env 브랜치 삭제

## 현재 브랜치

`main`

## 열린 PR

없음
