import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Browser/client-side client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side admin client (bypasses RLS) — only created on the server
export function getSupabaseAdmin() {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
    auth: { persistSession: false }
  });
}

// Legacy export for backwards compatibility in API routes
export const supabaseAdmin = typeof window === 'undefined'
  ? createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey, {
      auth: { persistSession: false }
    })
  : supabase;

// Check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return !!(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== 'https://demo.supabase.co' &&
    !supabaseUrl.includes('demo')
  );
}
