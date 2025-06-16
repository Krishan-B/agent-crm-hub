
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { tableName, recordId, fieldName, value } = await req.json();

    if (!tableName || !recordId || !fieldName || !value) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Simple encryption using base64 encoding
    // In production, use proper encryption libraries
    const encryptedValue = btoa(unescape(encodeURIComponent(value)));
    const encryptionKeyId = 'default-key-v1';

    // Store encrypted data
    const { data, error } = await supabase
      .from('encrypted_data')
      .upsert({
        table_name: tableName,
        record_id: recordId,
        field_name: fieldName,
        encrypted_value: encryptedValue,
        encryption_key_id: encryptionKeyId,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'table_name,record_id,field_name'
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    console.log('Encrypted data for:', tableName, recordId, fieldName);

    return new Response(JSON.stringify({
      success: true,
      encryptionKeyId
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    console.error('Error encrypting data:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

serve(handler);
