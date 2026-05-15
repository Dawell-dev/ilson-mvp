import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // URL에서 인증 코드 처리
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('인증 오류:', error);
          navigate('/login');
          return;
        }

        if (session) {
          // 카카오 OAuth는 구직자 전용. workers 테이블만 확인.
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
