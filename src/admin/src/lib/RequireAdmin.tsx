import { Navigate, Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

export default function RequireAdmin() {
  const [allowed, setAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const role = data.session?.user?.app_metadata?.role
      setAllowed(role === 'admin')
    })
  }, [])

  if (allowed === null) return null
  if (!allowed) return <Navigate to="/admin/login" replace />

  return <Outlet />
}
