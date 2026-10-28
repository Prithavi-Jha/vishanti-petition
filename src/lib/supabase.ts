import { createClient } from '@supabase/supabase-js';

const getEnvVar = (key: string): string | undefined => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      return import.meta.env[key];
    }
  } catch {}
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch {}
  return undefined;
};

const supabaseUrl =
  getEnvVar('VITE_SUPABASE_URL') || 'https://rxndbgbwwelxhprayupv.supabase.co';
const supabaseAnonKey =
  getEnvVar('VITE_SUPABASE_ANON_KEY') ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4bmRiZ2J3d2VseGhwcmF5dXB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMyMTAyOTQsImV4cCI6MjEwODc4NjI5NH0.8FQqzSQy2h-AYgU0aqHdE9E8LTNeLwdHqrWn6J9MwFE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const isSupabaseConfigured = true;
