import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://miisaqxzjcjvpzpqsmbn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1paXNhcXh6amNqdnB6cHFzbWJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MjMzMDEsImV4cCI6MjA5MTE5OTMwMX0.Na6sfVDJsfkUgDqxAxlHx89mQVxgD4o5qm6_MaZqBLs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
