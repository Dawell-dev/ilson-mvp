---
name: review
description: PR 생성 후 자체 코드 리뷰. 에이전트팀 병렬 호출로 HIGH/MED/LOW 분류. HIGH/MED는 본 PR fix-up 통합 (CLAUDE.md §1 PR 완결 원칙).
---

# /review — 자체 코드 리뷰

## 절차

### Phase 1: 변경 scope 파악
```bash
git diff main..HEAD --stat
git diff main..HEAD --name-only
```

### Phase 2: 에이전트팀 병렬 호출

변경 영역에 따라 선택:

**코드 변경 시 (필수)**:
- `data-integrity-reviewer` — 데이터 정합성 원칙 위반 탐지
- `type-safety-reviewer` — TypeScript 안전성

**UI 변경 포함 시**:
- `ui-convention-reviewer` — UI 컨벤션 (shadcn, 색상, 모바일)

**DB 변경 포함 시**:
- `db-schema-analyst` — view/function/trigger 의존성 직조회

**문서 only PR**:
- `general-purpose` 단일 agent로 doc-review

병렬 호출 (Task 도구):
```
Task(subagent_type="data-integrity-reviewer", prompt="...")
Task(subagent_type="type-safety-reviewer", prompt="...")
Task(subagent_type="ui-convention-reviewer", prompt="...")
```

### Phase 3: 결과 종합

| 등급 | 처리 방법 |
|------|----------|
| HIGH | 본 PR fix-up commit 통합 **필수** (별 PR 금지) |
| MED  | 본 PR 통합 (영역 분리 명확 시만 별 PR) |
| LOW  | 본 PR 통합 또는 즉시 다음 PR, TODO 등록 최후 |
| SAFE | 기록만 |

### Phase 4: fix-up commit

HIGH/MED 모두 처리 후:
```bash
git add -p
git commit -m "fix({영역}): /review HIGH/MED 본 PR fix-up 통합"
git push
```

### Phase 5: PR 코멘트 게시 (선택)

```bash
gh pr comment <PR번호> --body "..."
```

## 출력 형식

```
## /review 결과 (PR #NNN)

### 결과 요약
| 등급 | 개수 |
|------|------|
| HIGH | N |
| MED  | N |
| LOW  | N |
| SAFE | N |

### HIGH (본 PR fix-up 통합 필수)
| 위치 | 내용 | 처리 |
|------|------|------|
| {파일:라인} | {설명} | fix-up commit `{sha}` |

### MED (본 PR 통합)
...

### LOW (본 PR 통합 또는 즉시 다음 PR)
...

### 머지 판정
✅ 머지 가능 / ⚠️ 차단 (사유)
```

## CLAUDE.md 원칙 준수

- §1 PR 완결 원칙: HIGH/MED 별 PR 금지
- §2 미루기 금지: LOW도 통합 시도, TODO 최후
- 본 스킬은 read-only, 분석 후 fix-up commit은 메인 Dev Claude가 수행
