// 카카오톡 공유 (JS SDK v2)
// REACT_APP_KAKAO_JS_KEY 미설정 시 false를 반환해 호출부가 웹 공유로 fallback 한다.

const SDK_URL = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.5/kakao.min.js';
let loadPromise = null;

function loadSdk() {
  if (window.Kakao) return Promise.resolve();
  if (loadPromise) return loadPromise;
  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SDK_URL;
    script.async = true;
    script.onload = resolve;
    script.onerror = () => {
      loadPromise = null; // 실패 시 재시도 허용
      reject(new Error('카카오 SDK 로드 실패'));
    };
    document.head.appendChild(script);
  });
  return loadPromise;
}

// 카톡 공유 시도. 성공적으로 공유 창을 열었으면 true.
export async function shareToKakao({ text, url }) {
  const key = process.env.REACT_APP_KAKAO_JS_KEY;
  if (!key) return false;
  try {
    await loadSdk();
    if (!window.Kakao.isInitialized()) window.Kakao.init(key);
    window.Kakao.Share.sendDefault({
      objectType: 'text',
      text,
      link: { mobileWebUrl: url, webUrl: url },
      buttonTitle: '일손 구경하기',
    });
    return true;
  } catch (e) {
    console.error('카카오 공유 실패:', e);
    return false;
  }
}
