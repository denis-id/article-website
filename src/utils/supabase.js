import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dqmpgkkclzkbigqjtadq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxbXBna2tjbHprYmlncWp0YWRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MDYxMzIsImV4cCI6MjA5MzM4MjEzMn0.z-XwgDR3ob_FTE6RhjTj-qQPJ_OoutcALNJO_qg0yoo';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);