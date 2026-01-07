import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // ganti domain di prod
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // 🔥 HANDLE CORS PREFLIGHT
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    })
  }

  try {
    const { userId } = await req.json()

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId required' }),
        { status: 400, headers: corsHeaders }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 🔥 HAPUS USER DI AUTH
    const { error: authError } = await supabase.auth.admin.deleteUser(userId)
    if (authError) {
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: corsHeaders }
      )
    }

    // 🔥 HAPUS PROFILE
    await supabase.from('profiles').delete().eq('id', userId)

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: corsHeaders }
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: corsHeaders }
    )
  }
})
