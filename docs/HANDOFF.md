# 일손(ILSON) — Claude Code 핸드오프

> **사용법**: Claude Code 새 세션 시작 시 `@HANDOFF.md` 로 참조하거나
> 파일 내용을 첫 메시지에 붙여넣어 컨텍스트 전달.
>
> **최종 업데이트**: 2026-04-21 (경력 바텀시트 모달 완료 + 커밋 반영)

---

## 프로젝트 개요

- **이름**: 일손(ILSON) — 시니어(60~70대) 대상 동네 일자리 매칭 앱
- **로컬 경로**: `c:\Users\jisul\ilson-mvp`
- **배포**: https://ilson-mvp.vercel.app (Vercel)
- **스택**: React + react-router-dom@7.11.0 + Tailwind + Supabase (PostgreSQL/Auth/Storage)
- **DB**: 일손 전용 Supabase 프로젝트 (지수 계정 조직 `glvvxjtkbtmozfsirtof`)
  - ※ 다웰솔루션 DB와 분리됨 (별도 프로젝트)

---

## 현재 상태

### 완료된 작업

- [x] **HomePage.js** — 로그인 → 위치 허용 → 메인(홈/관심/지원내역/내정보) 4-탭 완성
- [x] **JobDetailPage.js** — 전면 개편 완료
  - Supabase Auth 기반 (`localStorage.worker` 제거)
  - `description` + `requirements` + `benefits` + 회사정보 + 지도링크 섹션
  - 중복 지원 체크 (`workerRow.id` + `job_id`, 23505 에러 특수 처리)
  - 지원 확인 바텀시트 모달 (경력 추가 모달과 동일 패턴)
  - 거리 뱃지 (navigator.geolocation + haversine)
  - 카카오맵 검색 URL 새 창
  - `?tab=profile` 딥링크로 리다이렉트 (workers 레코드 없을 때)
- [x] **HomePage.js 업데이트** — `useSearchParams` 연동
  - JobCard 버튼 `"바로 지원하기"` → `"자세히 보기 →"` (`navigate('/jobs/${id}')`)
  - `activeTab` 초기값 쿼리 파라미터에서 읽기 + 탭 전환 시 URL 동기화
  - 세션 있고 `?tab=` 있으면 loading/location 스킵하고 main 바로 진입
- [x] **경력 추가 바텀시트 모달 구현** — `HomePage.js` `ProfileView`
  - 기존 인라인 폼 → z-index 200 바텀시트로 전환 (하단 탭바 위에 오버레이)
  - 시작일/종료일을 년도·월 드롭다운으로 분리 (시니어 친화)
  - "현재 재직 중" 체크박스 → 체크 시 종료일 비활성화
  - `slide-up-sheet` / `overlay-in` 키프레임 `src/index.css` 에 추가

### DB 검증 결과 (Supabase)

- [x] 테이블 4개 존재: `jobs`, `workers`, `applications`, `employers`
- [x] UNIQUE 제약: `applications_job_id_worker_id_key` = `UNIQUE (job_id, worker_id)`
- [x] RLS 활성화: 4개 테이블 모두 `rowsecurity = true`
- [x] RLS 정책 존재: 각 테이블 INSERT/SELECT/UPDATE 정의됨
- [ ] ⚠️ **RLS 정책이 전부 `Anyone can ~` 패턴** → 출시 전 재정의 필수

---

## 다음 할 일 (우선순위 순)

### NEXT (바로 이어서 가능)

1. ~~**경력 추가 바텀시트 모달 구현**~~ ✅ 완료 (위 "완료된 작업" 참조)

2. **지원내역 탭 구현** — `HomePage.js` 의 `HistoryView` (현재 placeholder)
   - `applications` 테이블에서 `worker_id` 기준 조회
   - `jobs` 조인해서 일자리 정보 표시
   - 상태 뱃지: 대기/검토중/합격/불합격

3. **관심 하트 상태 DB 연동** — 현재 local state 만 → 새로고침 시 소실
   - `worker_favorites` 테이블 신규 필요 여부 판단
   - 또는 `workers.favorite_job_ids` 배열 컬럼

### MID (중기)

4. **실제 거리 계산 로직** — 현재 `dist = 0.5 + index * 0.7` 가짜 값
   - GPS + 일자리 주소 geocoding → haversine
5. **LocationContext 리팩터링** — `region` / GPS 좌표 세션 저장
   - 현재 문제: `?tab=` 진입 시 region 빈 문자열, 거리 뱃지 geolocation 중복 호출
6. **경력 정보 Supabase 저장** — `worker_careers` 테이블 신규 + upsert
7. **`triggerSave` debounce 전환** — `useEffect([profile], ...)` 기반, 현재 state 비동기 이슈 있음
8. **한 줄 소개 편집 기능** — 현재 하드코딩

### PRE-LAUNCH (출시 전 필수)

9. **RLS 정책 재정의** — 본인 데이터만 접근하도록
   - `workers`: `auth.uid()` 또는 `kakao_id` 기준 본인 레코드만
   - `applications`: 본인 지원만 SELECT, 본인만 INSERT
   - `jobs`, `employers`: 모두 SELECT 허용, INSERT/UPDATE 는 employer/admin 만
10. **카카오 알림톡 연동** (솔라피) — 헤더 🔔 아이콘 현재 미동작
11. **다웰서비스 내부용 어드민** — 공고 등록 + 지원자 조회 (외부 구인업체 앱은 후순위)

---

## 디자인 토큰

```
메인 오렌지:     #E85C1E
부드러운 오렌지: #FFF5F0
배경:            #F7F5F2
테두리:          #EDE8E2
본문:            #1A1A18
보조:            #888780
카카오 옐로우:   #FEE500
카드 radius:     18px
```

### 시니어 UI 원칙

- 최소 폰트 16px (입력 필드), 본문 15~16px, 보조 13~14px
- 버튼 높이 최소 52px, 터치 영역 44px 이상
- 이모지 사용 (lucide-react 는 JobDetailPage 에서 제거됨, HomePage 는 원래 이모지)
- 둥근 카드, 은은한 그림자

---

## 구조적 결정사항 (건드리지 말 것)

- **구직자 앱과 구인업체 앱은 분리**
  - 현재 `src/pages/worker/` 구조, 향후 `src/pages/employer/` 추가 예정
  - 외부 구인업체 앱보다 **다웰서비스 내부 어드민**이 선순위 (초기 공고 공급)
- **JobCard 버튼 = "자세히 보기"** (지원 아님)
  - 실제 지원은 상세 페이지 하단에서만 → 오지원 방지
- **카카오톡 버튼은 빠른 문의용으로 카드/상세 양쪽에 유지**

---

## 알려진 미해결 이슈

1. `triggerSave()` state 비동기 이슈 — `toggleArr` 직후 호출 시 변경 전 값 저장됨
2. `?tab=profile` 딥링크 진입 시 `region` 빈 문자열 → "위치 동의 후 자동 설정" 표시
3. 거리 뱃지 geolocation 중복 호출 — LocationScreen 이후 재호출되면 권한 프롬프트 재등장 가능
4. Vercel 배포 캐시 — 코드 반영돼도 강제 새로고침(`Ctrl+Shift+R`) 필요한 경우 있음

---

## 파일 인덱스

| 경로 | 역할 |
|---|---|
| `src/App.js` | 라우터 정의 (`/`, `/jobs/:id`, `/register` 등) |
| `src/pages/HomePage.js` | 로그인/위치/메인 4-탭 통합 |
| `src/pages/worker/JobDetailPage.js` | 일자리 상세 + 지원 플로우 |
| `src/lib/supabase.js` | Supabase 클라이언트 |
| `docs/DATABASE_SCHEMA.sql` | 스키마 설계 문서 (실제 DB와 일치 확인됨) |

---

## Claude Code 사용 팁

- 파일 수정 전 `git status` + `git diff` 로 의도치 않은 변경 확인
- `HomePage.js` 는 길어서 여러 컴포넌트 포함 (`LoginScreen`, `LocationScreen`, `MainScreen`, `ListView`, `JobCard`, `ProfileView`, `FavoritesView`, `HistoryView`) — 수정 시 대상 컴포넌트만 정확히 지정
- 스타일은 Tailwind + 인라인 style 혼용 (이 패턴 유지)
- 새 라이브러리 추가 금지 (lucide-react 는 일부러 제거했음 — 이모지로 통일)
- 한국어 UI 문구는 시니어 친화적으로 (격식체, 친근함, 최소 18px 이상 표현)
