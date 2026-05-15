import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const AuthCallback = () => {
  console.log('🔵 AuthCallback 컴포넌트 렌더링됨');  // ← useEffect 밖!
  
  const navigate = useNavigate();

  useEffect(() => {
    console.log('🟢 AuthCallback useEffect 실행됨');
    
    const handleAuthCallback = async () => {
      console.log('🟡 handleAuthCallback 함수 진입');
      
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        console.log('🟠 code 추출:', code);

        if (!code) {
          console.log('🔴 code 없음');
          navigate('/login');
          return;
        }

        console.log('⚪ exchangeCodeForSession 호출 직전');
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        console.log('🟣 exchangeCodeForSession 응답:', { data, error: exchangeError });

        if (exchangeError) {
          console.error('세션 교환 실패:', exchangeError);
          navigate('/login');
          return;
        }

        const session = data.session;
        if (!session) {
          navigate('/login');
          return;
        }

        const kakaoId = session.user.user_metadata?.provider_id;

        if (!kakaoId) {
          navigate('/select-role');
          return;
        }

        const { data: worker } = await supabase
          .from('workers')
          .select('id')
          .eq('kakao_id', kakaoId)
          .maybeSingle();

        if (worker) {
          navigate('/jobs');
        } else {
          navigate('/select-role');
        }
      } catch (error) {
        console.error('💥 콜백 처리 오류:', error);
        navigate('/login');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">로그인 처리 중...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
