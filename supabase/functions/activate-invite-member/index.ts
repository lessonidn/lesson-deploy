import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
/// <reference lib="deno.ns" />
Deno.serve(async (req: Request) => {
  // ✅ Handle preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    })
  }

  try {
    const { token, full_name } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      {
        auth: { persistSession: false, autoRefreshToken: false },
      }
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Access-Control-Allow-Origin': '*' },
      })
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid user' }), {
        status: 401,
        headers: { 'Access-Control-Allow-Origin': '*' },
      })
    }

    // 1️⃣ Validasi invite
    const { data: invite } = await supabase
      .from('member_invites')
      .select('*')
      .eq('token', token)
      .eq('is_used', false)
      .single()

    if (!invite) {
      return new Response(JSON.stringify({ error: 'Invite tidak valid' }), {
        status: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
      })
    }

    // 2️⃣ Tandai invite terpakai
    await supabase.from('member_invites').update({ is_used: true }).eq('token', token)

    // 3️⃣ Update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name,
        role: 'member', // 🔑 update role di tabel profiles
        membership_status: 'active',
        membership_type: 'free',
        membership_started_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (profileError) {
      return new Response(JSON.stringify({ error: profileError.message }), {
        status: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
      })
    }

    // 4️⃣ Set role member
    // ✅ simpan status membership di tabel profiles
    await supabase
      .from('profiles')
      .update({
        full_name,
        role: 'member', // ini role di tabel profiles, bukan app_metadata
        membership_status: 'active',
        membership_type: 'free',
        membership_started_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    return new Response(JSON.stringify({ success: true }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  } catch (err) {
    console.error('activate-invite-member error:', err)
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }
})