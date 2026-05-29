import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Warn rather than throw at module level — module-level throws cause
// FUNCTION_INVOCATION_FAILED on Vercel before any request handler runs,
// giving no diagnostic information. Actual failures surface per-request instead.
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('[Supabase] SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
}

// Server-side only — service role key bypasses RLS, never expose to client.
// IMPORTANT: never call .auth.signInWithPassword() on this client — doing so
// mutates its internal session, causing all subsequent .from() queries to use
// the user JWT instead of the service role key (403 on RLS-protected tables).
export const supabaseAdmin = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseServiceKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  }
);

// Export URL and key so auth routes can call Supabase Auth REST directly,
// which never mutates supabaseAdmin's session state.
export const SUPABASE_URL = supabaseUrl;
export const SUPABASE_SERVICE_KEY = supabaseServiceKey;

/**
 * Signs in a user via the Supabase Auth REST API directly.
 * NEVER use supabaseAdmin.auth.signInWithPassword() — it taints the singleton.
 */
export async function supabaseSignIn(email: string, password: string): Promise<{
  accessToken?: string;
  userId?: string;
  userMetadata?: Record<string, any>;
  email?: string;
  error?: string;
}> {
  const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey
    },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { error: err.error_description || err.msg || `Auth failed (HTTP ${res.status})` };
  }
  const data = await res.json();
  return {
    accessToken: data.access_token,
    userId: data.user?.id,
    userMetadata: data.user?.user_metadata ?? {},
    email: data.user?.email
  };
}
