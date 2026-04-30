import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Fail-safe: Only initialize if keys are present and not placeholders
const isConfigured = supabaseUrl && 
                   supabaseUrl !== 'PASTE_YOUR_PROJECT_URL_HERE' && 
                   supabaseAnonKey && 
                   supabaseAnonKey !== 'PASTE_YOUR_ANON_PUBLIC_KEY_HERE'

/**
 * The "Cloud Brain" connection for FinGuard.
 * Fail-safe wrapper to prevent "Blackout" crashes when keys are missing.
 */
export const supabase = isConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      auth: { getUser: () => Promise.resolve({ data: { user: null } }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }) },
      from: () => ({ 
        select: () => ({ order: () => ({ limit: () => Promise.resolve({ data: [], error: null }) }), eq: () => ({ order: () => Promise.resolve({ data: [], error: null }) }) }),
        insert: () => Promise.resolve({ error: null })
      }),
      channel: () => ({ on: () => ({ subscribe: () => {} }) }),
      removeChannel: () => {}
    }
