const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../../.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing. Please check your .env file.');
  // throw new Error('Supabase URL or Anon Key is missing.');
}

// Standard client (uses anon key, RLS enforced)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client (uses service role key, bypasses RLS - use with extreme caution)
let supabaseAdmin = null;
if (supabaseServiceRoleKey) {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
} else {
    console.warn('Supabase Service Role Key is missing. Admin operations will not be available.');
}

module.exports = { supabase, supabaseAdmin }; // Export both
