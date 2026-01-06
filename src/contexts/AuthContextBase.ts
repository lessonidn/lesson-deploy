import { createContext } from 'react'
import type { Session } from '@supabase/supabase-js'

type Profile = {
  id: string
  full_name: string | null
  membership_status: string | null
  membership_type: string | null
}

export type AuthContextType = {
  session: Session | null
  profile: Profile | null
  loading: boolean
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | null>(null)