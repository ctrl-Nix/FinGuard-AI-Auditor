import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Ultra-Strong Fail-Safe: Validate URL format before calling createClient
const isValidUrl = (url) => {
  try {
    return url && url.startsWith('http');
  } catch (e) {
    return false;
  }
}

const isConfigured = isValidUrl(supabaseUrl) && 
                   supabaseUrl !== 'PASTE_YOUR_PROJECT_URL_HERE' && 
                   supabaseAnonKey && 
                   supabaseAnonKey !== 'PASTE_YOUR_ANON_PUBLIC_KEY_HERE'

/**
 * The "Cloud Brain" connection for FinGuard.
 * Fail-safe wrapper to prevent "Invalid URL" crashes on Vercel.
 */
export const supabase = isConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      auth: { 
        getUser: () => Promise.resolve({ data: { user: null } }), 
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithOtp: () => Promise.resolve({ error: { message: "Supabase not configured" } }),
        signOut: () => Promise.resolve()
      },
      from: () => ({ 
        select: () => ({ order: () => ({ limit: () => Promise.resolve({ data: [], error: null }) }), eq: () => ({ order: () => Promise.resolve({ data: [], error: null }) }) }),
        insert: () => Promise.resolve({ error: null })
      }),
      channel: () => ({ on: () => ({ subscribe: () => {} }) }),
      removeChannel: () => {}
    }
