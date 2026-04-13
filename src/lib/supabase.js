import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kvqjtiiahvylfcgxybmq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2cWp0aWlhaHZ5bGZjZ3h5Ym1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNDM3NDksImV4cCI6MjA5MTYxOTc0OX0.PT1RMbOv2ntLBwOC9q3Dj8CyyrIBqRZB8IsNXwDOhmY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
