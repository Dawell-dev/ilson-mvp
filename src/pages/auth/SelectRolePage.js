import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const SelectRolePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // 로그인 안 된 상태면 로그인 페이지로
  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4">
      <div className="max-w-md mx-auto w-full">
        {/* 타이틀 */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            환영합니다! 👋
          </h1>
          <p className="text-gray-600">
            어떤 용도로 일손을 이용하시나요?
          </p>
        </div>

        {/* 역할 선택 카드 */}
        <div className="space-y-4">
          {/* 구직자 */}
          <button
            onClick={() => navigate('/register')}
            className="w-full bg-white p-6 rounded-xl shadow-sm border-2 border-transparent hover:border-blue-500 transition-all text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                👷
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  일자리를 찾고 있어요
                </h3>
                <p className="text-sm text-gray-500">
                  시니어 구직자로 등록하기
                </p>
              </div>
            </div>
          </button>

          {/* 구인처 */}
          <button
            onClick={() => navigate('/employer/signup')}
            className="w-full bg-white p-6 rounded-xl shadow-sm border-2 border-transparent hover:border-green-500 transition-all text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center text-2xl">
                🏢
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  인력을 구하고 있어요
                </h3>
                <p className="text-sm text-gray-500">
                  기업/업체로 등록하기
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* 하단 안내 */}
        <p className="text-center text-xs text-gray-400 mt-8">
          나중에 설정에서 역할을 변경할 수 있어요
        </p>
      </div>
    </div>
  );
};

export default SelectRolePage;
