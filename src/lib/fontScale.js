// 전역 폰트 스케일 관리
// CSS 변수 --font-scale 을 documentElement 에 지정하면
// 모든 텍스트(calc(Npx * var(--font-scale)))가 즉시 반영된다.

const STORAGE_KEY = 'ilson_font_scale';
const DEFAULT_SCALE = 1.3; // 시니어 기본값 (index.css :root 와 동일)

export const FONT_SCALE_OPTIONS = [
  { value: 1.0, label: '보통' },
  { value: 1.15, label: '조금 크게' },
  { value: 1.3, label: '크게' },
  { value: 1.5, label: '아주 크게' },
];

export function getFontScale() {
  try {
    const saved = parseFloat(localStorage.getItem(STORAGE_KEY));
    if (FONT_SCALE_OPTIONS.some((o) => o.value === saved)) return saved;
  } catch {
    // localStorage 접근 불가 환경은 기본값 사용
  }
  return DEFAULT_SCALE;
}

export function setFontScale(value) {
  try {
    localStorage.setItem(STORAGE_KEY, String(value));
  } catch {
    // 저장 실패해도 화면 반영은 진행
  }
  applyFontScale(value);
}

export function applyFontScale(value = getFontScale()) {
  document.documentElement.style.setProperty('--font-scale', String(value));
}
