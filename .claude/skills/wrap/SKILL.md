---
name: wrap
description: 세션 종료 절차. PROGRESS/TODO 자동 업데이트 + 세션 doc 생성 + 후속 PR 자기 검증 (CLAUDE.md §2 미루기 금지 원칙) + worktree 정리 명령 출력.
---

# /wrap — 세션 종료 절차

## 절차

### Phase 1: 세션 doc 작성

`docs/progress/YYYY-MM-DD-session-{topic}.md` 생성:

```markdown
# YYYY-MM-DD — {세션 제목}

> 브랜치: `{브랜치}` / PR #{번호}
> Commits: {sha1} ({내용}) + {sha2} ({내용}) + ...

## Executive Summary

| 항목 | 결과 |
|------|------|
| Feature | {설명} |
| 코드 변경 | {라인 수} |
| 마이그 | {개수} |
| baseline 영향 | 0 / N |
| 운영 영향 | 0 / N |
| 자체 review | HIGH N / MED N / LOW N |
| 별 PR follow-up | N건 |

## 배경

## Phase 1~N

## CLAUDE.md 원칙 적용

- ✅ §1 PR 완결 / §2 미루기 금지 / ... 적용 결과

## 다음 작업
```

### Phase 2: PROGRESS.md 업데이트

상단에 본 세션 entry 추가 (시간 역순):

```markdown
- YYYY-MM-DD — [{세션 제목} PR #{번호}](./docs/progress/...) — `{브랜치}` ({한 줄 요약})
```

### Phase 3: TODO.md 업데이트

- 본 PR 통합으로 해결된 항목 체크 표시
- 신규 follow-up (별 PR 등록된 것만) 태그 부여하여 추가

### Phase 4: ⚠️ 후속 PR 자기 검증 (CLAUDE.md §2)

후속 PR 후보 떠오르면 3조건 체크:

| 후보 | 운영팀 결정? | 의존성? | 1000줄+? | 등록 여부 |
|------|------------|---------|----------|----------|
| 후보1 | ❌ | ❌ | ❌ | 🚫 등록 X (본 PR 통합 또는 누락) |
| 후보2 | ✅ | - | - | ✅ 등록 (운영팀 답변 대기) |

3조건 모두 ❌ = 본 PR 통합 시도, 안 되면 그냥 누락.

### Phase 5: wrap commit

```bash
git add PROGRESS.md TODO.md DECISIONS.md docs/progress/...
git commit -m "docs(progress): 본 세션 wrap"
git push
```

⚠️ wrap commit은 PR 머지 전에 같은 PR에 push (squash merge 시 누락 방지).

### Phase 6: Worktree 정리 명령 출력

쥬니 메인 터미널 실행용:

```powershell
$OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 | Out-Null
cd C:\Users\jooeu\Ilson
git pull
git worktree remove ..\Ilson-{용도}
git push origin --delete {브랜치}
git worktree list
```

## 출력 형식

```
## ✅ 세션 완료 — PR #NNN

### Executive Summary
{표}

### CLAUDE.md 원칙 적용
- ✅ §1 / §2 / §4 / §5 적용 결과

### 후속 PR 자기 검증
- 후보 N건 → 등록 N건 / 누락 N건

### 다음 작업
{P0 TODO 또는 DECISIONS 기준 추천}

### Worktree 정리 (PR 머지 후)
{PowerShell 명령}
```

## CLAUDE.md 원칙 준수

- §1 PR 완결: wrap commit이 PR 머지 전 같은 PR에 포함
- §2 미루기 금지: 후속 PR 등록 자체를 자기 검증
- §3 R-D-B: 다음 작업이 R-D-B 분리 대상인지 평가
