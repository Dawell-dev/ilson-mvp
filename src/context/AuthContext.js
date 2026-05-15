import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // 사용자 프로필 가져오기 (workers 또는 employers 테이블에서)
  const fetchUserProfile = async (user) => {
    try {
      const kakaoId = user.user_metadata?.provider_id;
      
      if (!kakaoId) {
        console.warn('kakao_id가 없습니다:', user.user_metadata);
        setUserProfile(null);
        return;
      }

      // workers 테이블 확인 (single() → maybeSingle()로 변경: 없을 때 에러 안 던지게)
      const { data: worker, error: workerError } = await supabase
        .from('workers')
        .select('*')
        .eq('kakao_id', kakaoId)
        .maybeSingle();

      if (workerError) {
        console.error('workers 조회 오류:', workerError);
      }

      if (worker) {
        setUserProfile({ ...worker, type: 'worker' });
        return;
      }

      // employers 테이블 확인
      const { data: employer, error: employerError } = await supabase
        .from('employers')
        .select('*')
        .eq('kakao_id', kakaoId)
        .maybeSingle();

      if (employerError) {
        console.error('employers 조회 오류:', employerError);
      }

      if (employer) {
        setUserProfile({ ...employer, type: 'employer' });
        return;
      }

      // 프로필 없음 (신규 사용자)
      setUserProfile(null);
    } catch (error) {
      console.error('프로필 조회 오류:', error);
      setUserProfile(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    // 현재 세션 확인
    const getSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('세션 조회 오류:', error);
      }

      if (!mounted) return;

      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchUserProfile(session.user);
      }
      
      if (mounted) setLoading(false);
    };

    getSession();

    // 인증 상태 변화 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] 상태 변화:', event, session?.user?.id);
        
        if (!mounted) return;
        
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchUserProfile(session.user);
        } else {
          setUserProfile(null);
        }
        
        if (mounted) setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // 카카오 로그인
  const signInWithKakao = async () => {
    const redirectUrl = `${window.location.origin}/auth/callback`;
    console.log('[Auth] 카카오 로그인 시작, redirectTo:', redirectUrl);
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: redirectUrl,
        scopes: 'profile_nickname profile_image account_email',
      },
    });
    return { data, error };
  };

  // 로그아웃
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      setUserProfile(null);
    }
    return { error };
  };

  const value = {
    user,
    userProfile,
    loading,
    signInWithKakao,
    signOut,
    fetchUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
