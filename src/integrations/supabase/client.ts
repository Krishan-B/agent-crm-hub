
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'
import { env } from '../../config/environment'

const supabaseUrl = env.supabaseUrl
const supabaseAnonKey = env.supabaseAnonKey

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'X-Client-Info': 'plexop-crm@1.0.0'
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})
