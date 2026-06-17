---
name: init
description: Claude Code 세션 시작 시 프로젝트 상태를 자동 파악. PROGRESS.md / TODO.md / DECISIONS.md / 현재 브랜치 / 열린 PR을 한 번에 확인.
---

# /init — 세션 시작 절차

CLAUDE.md 자동 로드는 Claude Code 기본 기능. 본 스킬은 그 위에 프로젝트 작업 상태를 파악한다.

## 절차

1. **PROGRESS.md 상단 읽기**
   - 마지막 업데이트 라인
   - 최근 세션 3건
   - 현재 브랜치 확인

2. **TODO.md 상단 읽기**
   - P0 항목 (이번 주 작업)
   - 분류 가이드 박스

3. **DECISIONS.md 확인**
   - 대기 중 항목 개수
   - 1일 이상 대기 항목 있으면 ⚠️ 표시

4. **Git 상태 확인**
   ```bash
   git branch --show-current
   git status --short
   git log --oneline -3
   ```

5. **열린 PR 확인** (선택)
   ```bash
   gh pr list --author "@me" --state open
   ```

## 출력 형식

```
## 세션 초기화 완료

### 현재 상태
- 브랜치: {브랜치명}
- 마지막 PR: #{번호} ({상태})
- 작업 디렉토리: clean / N changes

### 작업 큐
- P0 (이번 주): N건
- 대기 중 결정: N건 (1일 이상 N건 ⚠️)

### 최근 세션 (PROGRESS 기준)
- {날짜} — {제목}
- {날짜} — {제목}
- {날짜} — {제목}

### 추천 다음 액션
{TODO P0 또는 DECISIONS 대기 항목 기준 추천}
```

## CLAUDE.md 원칙 준수

- §1 PR 완결 / §2 미루기 금지 / §3 R-D-B / §4 DB 검증 / §5 데이터 정합성
- 본 스킬은 read-only, 파일 수정 금지
