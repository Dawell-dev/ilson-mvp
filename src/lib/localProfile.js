// 비로그인 상태의 온보딩 결과(동네·좌표·직종)를 브라우저에 보관한다.
// 로그인 시 DB(workers)로 이관되고, 이관 후에도 표시용으로 남겨둔다.

const KEY = 'ilson_local_profile';

export function getLocalProfile() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (!p || typeof p !== 'object') return null;
    return p;
  } catch {
    return null;
  }
}

export function saveLocalProfile(patch) {
  const next = { ...(getLocalProfile() || {}), ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // 저장 실패해도 화면 동작은 유지
  }
  return next;
}

export function clearLocalProfile() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // noop
  }
}

// 온보딩 완료 = 동네와 직종이 모두 설정된 상태
export function isOnboarded() {
  const p = getLocalProfile();
  return !!(p && p.region && Array.isArray(p.jobTypes) && p.jobTypes.length > 0);
}
