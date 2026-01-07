import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 현재 세션 확인
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchUserProfile(session.user);
      }
      setLoading(false);
    };

    getSession();

    // 인증 상태 변화 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchUserProfile(session.user);
        } else {
          setUserProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // 사용자 프로필 가져오기 (workers 또는 employers 테이블에서)
  const fetchUserProfile = async (user) => {
    try {
      // 먼저 workers 테이블에서 확인
      const { data: worker } = await supabase
        .from('workers')
        .select('*')
        .eq('kakao_id', user.user_metadata?.provider_id)
        .single();

      if (worker) {
        setUserProfile({ ...worker, type: 'worker' });
        return;
      }

      // employers 테이블에서 확인
      const { data: employer } = await supabase
        .from('employers')
        .select('*')
        .eq('kakao_id', user.user_metadata?.provider_id)
        .single();

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

  // 카카오 로그인
  const signInWithKakao = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: window.location.origin + '/auth/callback',
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
