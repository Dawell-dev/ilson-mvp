import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      console.log('[AuthCallback] 시작, URL:', window.location.href);

      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        const errorParam = url.searchParams.get('error');

        // OAuth 자체 에러 (사용자 취소 등)
        if (errorParam) {
          console.error('[AuthCallback] OAuth 에러:', errorParam);
          navigate('/login');
          return;
        }

        // ⭐ 핵심: 먼저 세션 확인 (detectSessionInUrl이 이미 처리했을 수 있음)
        let { data: { session } } = await supabase.auth.getSession();
        console.log('[AuthCallback] 1차 세션 확인:', session?.user?.id);

        // 세션이 없을 때만 명시적으로 code 교환
        if (!session && code) {
          console.log('[AuthCallback] 세션 없음, exchangeCodeForSession 호출');
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            console.error('[AuthCallback] 세션 교환 실패:', exchangeError);
            navigate('/login');
            return;
          }
          session = data.session;
        }

        if (!session) {
          console.error('[AuthCallback] 세션 없음, 로그인으로');
          navigate('/login');
          return;
        }

        console.log('[AuthCallback] 세션 확보:', session.user.id);

        // 사용자 분기
        const kakaoId = session.user.user_metadata?.provider_id;
        console.log('[AuthCallback] kakao_id:', kakaoId);

        if (!kakaoId) {
          console.warn('[AuthCallback] kakao_id 없음, select-role로');
          navigate('/select-role');
          return;
        }

        const { data: worker } = await supabase
          .from('workers')
          .select('id')
          .eq('kakao_id', kakaoId)
          .maybeSingle();

        console.log('[AuthCallback] worker 조회 결과:', worker);

        if (worker) {
          console.log('[AuthCallback] 기존 worker → /jobs');
          navigate('/jobs');
          return;
        }

        console.log('[AuthCallback] 신규 사용자 → /select-role');
        navigate('/select-role');
      } catch (error) {
        console.error('[AuthCallback] 예외:', error);
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
