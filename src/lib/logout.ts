import { supabase } from './supabase'

export async function logout(
  navigate?: (path: string) => void,
  role?: 'admin' | 'member'
) {
  await supabase.auth.signOut()

  const redirect =
    role === 'admin' ? '/admin/login' : '/'

  if (navigate) {
    navigate(redirect)
  } else {
    window.location.href = redirect
  }
}
