import { supabase } from './supabase'

export async function logout(navigate?: (path: string) => void) {
  await supabase.auth.signOut()
  if (navigate) {
    navigate('/admin/login')
  } else {
    window.location.href = '/admin/login'
  }
}
