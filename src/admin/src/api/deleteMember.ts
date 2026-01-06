// supabase/functions/delete-member/index.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async (req: Request): Promise<Response> => {
  try {
    const { userId } = await req.json()

    // hapus user di Auth
    const { error: authError } = await supabase.auth.admin.deleteUser(userId)
    if (authError) {
      return new Response(JSON.stringify({ error: authError.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // hapus profile
    await supabase.from('profiles').delete().eq('id', userId)

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error'
    return new Response(JSON.stringify({ error: message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
    })
    }
  }