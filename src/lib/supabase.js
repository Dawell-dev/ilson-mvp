import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kvqjtiiahvylfcgxybmq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2cWp0aWlhaHZ5bGZjZ3h5Ym1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNDM3NDksImV4cCI6MjA5MTYxOTc0OX0.PT1RMbOv2ntLBwOC9q3Dj8CyyrIBqRZB8IsNXwDOhmY';

// 카카오 OAuth(PKCE flow) - URL의 ?code= 자동 감지하여 세션 교환
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    flowType: 'pkce',
    detectSessionInUrl: true,  // ← 이 한 줄 추가
  },
});
