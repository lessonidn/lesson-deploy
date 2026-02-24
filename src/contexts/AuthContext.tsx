import { useState, useEffect, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { Session } from '@supabase/supabase-js'
import { AuthContext, AuthContextType } from './AuthContextBase'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<AuthContextType['profile']>(null)
  const [loading, setLoading] = useState(true)

  async function fetchProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, membership_status, membership_type')
      .eq('id', userId)
      .maybeSingle()

    // ⭐ FIX: profile NULL itu VALID (auth-only user)
    if (!error) {
      setProfile(data ?? null)
    }
  }

  useEffect(() => {
    let active = true

    const init = async () => {
      const { data } = await supabase.auth.getSession()
      if (!active) return

      setSession(data.session)

      // ⭐ FIX: session sudah cukup untuk dianggap login
      if (data.session?.user) {
        fetchProfile(data.session.user.id)
      } else {
        setProfile(null)
      }

      setLoading(false)
    }

    init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!active) return

      setSession(newSession)

      if (newSession?.user) {
        fetchProfile(newSession.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  async function logout() {
    await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        profile, // boleh null → auth-only user
        loading,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}