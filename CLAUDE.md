# CLAUDE.md — 일손 프로젝트

## 프로젝트 개요

- **이름**: 일손 (Ilson)
- **목적**: 시니어 채용 플랫폼
- **소속**: 더불어그룹 (다웰솔루션 자매 프로젝트)
- **최종 비전**: 다웰솔루션과 통합되어 Total Workforce OS

## 기술 스택

- CRA (Create React App, react-scripts 5.0.1) + JavaScript
- React 19.2.3 + react-router-dom 7
- Tailwind CSS 3.4
- Supabase (PostgreSQL + Auth) — project_id: `kvqjtiiahvylfcgxybmq`
- Vercel — projectId: `prj_GMvRKbf1M18kobfGVJDEYc7z3Wij` / teamId: `team_c97ik6TrTggeLmgdR9yezVBl`
- GitHub: `Dawell-dev/ilson-mvp`

> 마이그레이션 예정: Next.js + TS 전환은 백로그. 트리거 조건은 DECISIONS.md 참조.

## 핵심 협업자

- 정성욱 (대표이사) — staff_id 미정 (일손 별도 staff 테이블)
- 김주은 (지원본부장/PM) — 쥬니
- 박선희 (운영팀, 합류 예정)
- 이지수 (개발 담당)

---

## 절대 규칙 (위반 금지)

### §1. PR 완결 원칙
- `/review` HIGH = 본 PR fix-up commit 통합 필수 (별 PR 금지)
- `/review` MED = 가능한 본 PR 통합, 영역 분리 필요 시만 별 PR
- `/review` LOW = 본 PR 통합 또는 즉시 다음 PR, TODO 등록 최후 수단

### §2. 미루기 금지 원칙
별 PR / TODO 분리는 3가지 조건만 허용:
1. 운영팀/쥬니 결정 답변 대기 중
2. 다른 PR 의존성 (선행 머지 필요)
3. 1000줄+ 또는 3개 영역 이상 변경

다음은 본 PR 통합 필수:
- baseline 영향 0 + 운영 영향 0 + 단순 cleanup
- rename / 주석 / cosmetic fix

"운영 시작 후"로 미루는 표현 금지 (진짜 트리거 있을 때만).

### §3. R-D-B 사이클
영향 범위 3개 이상 / 1000줄+ / DB+UI 동시 변경 = 분리 필수:
- **Research** (조사) → `docs/investigations/{topic}-{date}.md`
- **Design** (설계) → PR description plan 또는 `docs/architecture/`
- **Build** (구현) → feat/fix 브랜치

조사 PR은 운영팀/쥬니 결정 답변 대기 시에만 분리.
검증 안 된 가정으로 구현 진입 금지.

### §4. DB 검증 우선 원칙
view/function/dependency 판단 시:
1. 코드 grep 결과만으로 판단 금지
2. `information_schema` / `pg_depend` / Supabase MCP 직조회 필수
3. 검증 SQL 결과를 PROGRESS에 기록

### §5. 데이터 정합성 원칙
- DB 확정값이 SSOT (Single Source of Truth)
- 프론트 재계산 금지
- PDF/UI 값은 DB에서 직접 읽고 재계산 안 함
- 추측 금지, 검증 안 된 건 "확인 필요" 명시

---

## 환경 룰

### Windows PowerShell UTF-8 표준
한글 깨짐 방지 절차:

```powershell
$OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 | Out-Null
Get-Content {file} -Raw -Encoding UTF8 | Set-Clipboard
```

### Worktree 사용 (병렬 작업 시)
- 1 worktree = 1 Claude Code 세션
- 메인 폴더는 main 브랜치 전용
- 작업 폴더 패턴: `..\Ilson-{용도}`

```powershell
cd C:\Users\jooeu\Ilson
git fetch origin
git worktree add ..\Ilson-{용도} -b {브랜치} origin/main
cd ..\Ilson-{용도}
claude
```

작업 완료 후:

```powershell
cd C:\Users\jooeu\Ilson
git pull
git worktree remove ..\Ilson-{용도}
git push origin --delete {브랜치}
```

---

## 워크플로우

### 표준 세션 흐름
1. `/init` — 세션 시작, PROGRESS/TODO 자동 로드
2. 조사 또는 구현
3. `/check` — 커밋 전 검증 (tsc / build / lint)
4. commit + push + PR 생성
5. `/review` — 자체 코드 리뷰 (HIGH/MED/LOW 분류)
6. /review HIGH/MED는 본 PR fix-up commit 통합
7. 쥬니가 GitHub에서 직접 머지 (`gh pr merge` 금지)
8. `/wrap` — PROGRESS/TODO 업데이트 + worktree 정리

### 에이전트팀 활용 기준
- 1000줄+ 변경 → 에이전트팀 병렬 호출
- 레이어 3개 이상 → 에이전트팀
- DB + UI 동시 변경 → 에이전트팀
- 단순 작업 → 에이전트 없이 진행

---

## 코드 컨벤션

### 네이밍
- 한국어 라벨 유지 (도메인 용어)
- 기술 식별자는 영어 (camelCase / snake_case)

### UI 컨벤션
- shadcn/ui 컴포넌트 우선
- Tailwind 색상: 직접 hex 금지, Tailwind 토큰 사용
- 모바일 우선 (sm: / md: / lg: breakpoint)

### TypeScript
- `any` 금지 (불가피하면 주석으로 사유 명시)
- `as` 캐스트 최소화

---

## 외부 도구 (MCP)

- **Supabase MCP**: DB 직조회 (apply_migration / execute_sql 구분)
- **Vercel MCP**: 배포 상태, 런타임 로그
- **GitHub**: PR 생성, 머지
- **Slack MCP**: 채널 메시지 (일손 채널 TBD)

---

## 파일 SSOT

- **PROGRESS.md**: 작업 이력 (자동 업데이트 by `/wrap`)
- **TODO.md**: 할 일 (태그 체계: `[영역][중요도][P0/P1/P2]`)
- **DECISIONS.md**: 의사결정 대기 큐
- **docs/progress/**: 세션별 상세 기록
- **docs/investigations/**: 조사 결과

진행 중인 작업/PR 상태는 메모리에 박제하지 말고 이 파일들이 SSOT.
