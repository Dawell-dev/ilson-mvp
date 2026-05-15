import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kvqjtiiahvylfcgxybmq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2cWp0aWlhaHZ5bGZjZ3h5Ym1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNDM3NDksImV4cCI6MjA5MTYxOTc0OX0.PT1RMbOv2ntLBwOC9q3Dj8CyyrIBqRZB8IsNXwDOhmY';

// 방안 B — auth 옵션 명시로 signUp hang/세션 저장 실패 방지
// detectSessionInUrl은 기본값(true) 유지 — 카카오 OAuth가 URL hash에서 세션을 받기 때문
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    flowType: 'pkce',
  },
});
