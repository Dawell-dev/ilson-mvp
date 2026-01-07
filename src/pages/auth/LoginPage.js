import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const { signInWithKakao, loading } = useAuth();

  const handleKakaoLogin = async () => {
    const { error } = await signInWithKakao();
    if (error) {
      console.error('로그인 오류:', error);
      alert('로그인 중 오류가 발생했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* 로고/타이틀 */}
        <h1 className="text-center text-3xl font-bold text-gray-900 mb-2">
          일손
        </h1>
        <p className="text-center text-gray-600 mb-8">
          시니어 일자리 매칭 플랫폼
        </p>

        {/* 로그인 카드 */}
        <div className="bg-white py-8 px-6 shadow rounded-lg">
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                로그인
              </h2>
              <p className="text-sm text-gray-500">
                카카오 계정으로 간편하게 시작하세요
              </p>
            </div>

            {/* 카카오 로그인 버튼 */}
            <button
              onClick={handleKakaoLogin}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg text-black font-medium transition-colors"
              style={{ backgroundColor: '#FEE500' }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 4C7.02944 4 3 7.16 3 11.0909C3 13.5836 4.55833 15.7836 7 17.0545L6.27273 20.3636C6.23636 20.5455 6.45455 20.6909 6.60909 20.5818L10.4727 17.9455C10.9727 18.0182 11.4818 18.0545 12 18.0545C16.9706 18.0545 21 14.8945 21 10.9636C21 7.16 16.9706 4 12 4Z"
                  fill="black"
                />
              </svg>
              카카오로 시작하기
            </button>

            {/* 안내 문구 */}
            <div className="text-center text-xs text-gray-400 mt-4">
              <p>로그인 시 이용약관 및 개인정보처리방침에 동의하게 됩니다.</p>
            </div>
          </div>
        </div>

        {/* 홈으로 돌아가기 */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← 홈으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
