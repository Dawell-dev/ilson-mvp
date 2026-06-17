---
name: check
description: 커밋 전 사전 검증. TypeScript 컴파일 / Next.js 빌드 / ESLint 결과를 baseline과 비교. 에러 증가 시 차단.
---

# /check — 커밋 전 검증

## 절차

1. **TypeScript 컴파일 검증**
   ```bash
   npx tsc --noEmit 2>&1 | grep "error TS" | wc -l
   ```
   - 결과를 baseline과 비교
   - 신규 에러 0건 = PASS

2. **빌드 검증**
   ```bash
   npx next build 2>&1 | tail -20
   ```
   - "Compiled successfully" 확인
   - 실패 시 즉시 차단

3. **ESLint** (선택)
   ```bash
   npx next lint 2>&1 | grep -E "error|warning"
   ```

4. **변경 파일 요약**
   ```bash
   git diff --stat
   git diff --name-only | head -20
   ```

5. **브랜치 가드** (Worktree 사고 방지)
   ```bash
   git branch --show-current
   ```
   - 예상 브랜치와 다르면 ⚠️ stash 후 복구 권고

## 출력 형식

```
## /check 결과

### TypeScript
- baseline: N개 error
- 현재: N개 error
- 신규: 0건 → ✅ PASS

### Build
- 상태: ✅ Compiled successfully (XXs)

### 변경 파일
- N개 파일 변경
- 주요: {파일1}, {파일2}, {파일3}

### 판정
✅ 커밋 GO / ⚠️ 차단 (사유)
```

## 차단 조건

- TypeScript 신규 에러 1건 이상
- Build 실패
- 브랜치 mismatch (외부 세션 침범)

## CLAUDE.md 원칙 준수

- §5 데이터 정합성: 검증 통과 없이 commit 금지
- 본 스킬은 read-only, 파일 수정 금지
