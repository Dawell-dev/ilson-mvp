import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        const errorParam = url.searchParams.get('error');

        if (errorParam) {
          console.error('OAuth 에러:', errorParam);
          navigate('/login');
          return;
        }

        // PKCE 코드를 세션으로 명시적 교환
        if (code) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

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

          // 사용자 분기
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
          return;
        }

        // code가 없는 경우 (직접 진입)
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          navigate('/select-role');
        } else {
          navigate('/login');
        }
      } catch (error) {
        console.error('콜백 처리 오류:', error);
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
