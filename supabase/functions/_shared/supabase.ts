
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const supabaseUrl = 'https://zknyyltinlagwkbbedrx.supabase.co'
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

export const supabase = createClient(supabaseUrl, supabaseServiceKey)
