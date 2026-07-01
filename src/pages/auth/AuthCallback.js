import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

// 카카오 로그인 콜백 처리 (루트 ?code= → OAuthInterceptor → 여기로)
const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const code = new URL(window.location.href).searchParams.get('code');
        if (!code) {
          navigate('/');
          return;
        }

        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error || !data.session) {
          navigate('/');
          return;
        }

        const kakaoId = data.session.user.user_metadata?.provider_id;
        if (!kakaoId) {
          navigate('/');
          return;
        }

        const { data: worker } = await supabase
          .from('workers')
          .select('id')
          .eq('kakao_id', kakaoId)
          .maybeSingle();

        // 신규(프로필 없음) → 온보딩, 기존 → 홈(맞춤 추천)
        navigate(worker ? '/' : '/register');
      } catch (e) {
        console.error('로그인 콜백 처리 오류:', e);
        navigate('/');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p className="text-gray-600">로그인 처리 중...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
