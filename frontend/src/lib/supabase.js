import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * The "Cloud Brain" connection for FinGuard.
 * Handles:
 * 1. Community Scam Vault (Realtime)
 * 2. User Audit History
 * 3. Secure Login
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
