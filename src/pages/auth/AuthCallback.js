import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // 1. URL에서 code 파라미터 추출
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        const errorParam = url.searchParams.get('error');

        // OAuth 자체 에러 처리 (사용자 취소 등)
        if (errorParam) {
          console.error('OAuth 에러:', errorParam, url.searchParams.get('error_description'));
          navigate('/login');
          return;
        }

        // 2. code가 있으면 세션으로 교환 (PKCE flow)
        if (code) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            console.error('세션 교환 실패:', exchangeError);
            navigate('/login');
            return;
          }

          if (!data.session) {
            console.error('세션이 생성되지 않음');
            navigate('/login');
            return;
          }

          // 3. 세션 확인 후 사용자 분기 (기존 로직)
          const session = data.session;
          const kakaoId = session.user.user_metadata?.provider_id;

          const { data: worker } = await supabase
            .from('workers')
            .select('id')
            .eq('kakao_id', kakaoId)
            .maybeSingle();

          if (worker) {
            navigate('/jobs');
            return;
          }

          // 신규 사용자 - 역할 선택 페이지로
          navigate('/select-role');
          return;
        }

        // 4. code가 없으면 이미 세션 있는지만 확인 (재진입 케이스)
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session) {
          navigate('/login');
          return;
        }

        // 세션은 있지만 분기 미정인 경우
        navigate('/select-role');
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
