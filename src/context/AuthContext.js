import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // 사용자 프로필 가져오기
  const fetchUserProfile = async (user) => {
    try {
      const { data: worker } = await supabase
        .from('workers')
        .select('*')
        .eq('kakao_id', user.user_metadata?.provider_id)
        .maybeSingle();

      if (worker) {
        setUserProfile({ ...worker, type: 'worker' });
        return;
      }

      const { data: employer } = await supabase
        .from('employers')
        .select('*')
        .eq('kakao_id', user.user_metadata?.provider_id)
        .maybeSingle();

      if (employer) {
        setUserProfile({ ...employer, type: 'employer' });
        return;
      }

      setUserProfile(null);
    } catch (error) {
      console.error('프로필 조회 오류:', error);
      setUserProfile(null);
    }
  };

  useEffect(() => {
    // 현재 세션 확인
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user);  // await 제거
      }
      setLoading(false);
    };

    getSession();

    // 인증 상태 변화 감지 - 콜백이 즉시 끝나도록 await 제거
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {  // async 제거
        console.log('[Auth] 상태 변화:', event, session?.user?.id);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchUserProfile(session.user);  // await 없이 백그라운드 실행
        } else {
          setUserProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // 카카오 로그인
  const signInWithKakao = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: window.location.origin + '/auth/callback',
        // account_email은 비즈 앱 전환 후 동의항목 활성화되면 복원
        scopes: 'profile_nickname profile_image'
      }
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
    fetchUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
