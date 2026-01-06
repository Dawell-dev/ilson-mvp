import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qnqbzhbgfdoveldlsgbu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFucWJ6aGJnZmRvdmVsZGxzZ2J1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwMTcxMTYsImV4cCI6MjA4MTU5MzExNn0.JuYDj9bgZOvZhIcH6kSuFRFjC6zTaTpS8GYfHXmJyJ8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
