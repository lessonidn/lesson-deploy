import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function InviteRegister() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  // 1️⃣ VALIDASI TOKEN (BENAR)
  useEffect(() => {
    const checkToken = async () => {
      const { data, error } = await supabase.rpc('check_invite_token', {
        p_token: token,
      })

      if (error || !data || data.length === 0) {
        setError('Link undangan tidak valid atau sudah kedaluwarsa.')
        setLoading(false)
        return
      }

      setEmail(data[0].email)
      setLoading(false)
    }

    checkToken()
  }, [token])

  // 2️⃣ REGISTER FLOW (BENAR & AMAN)
  const handleRegister = async () => {
    setError(null)

    if (!fullName.trim()) {
        setError('Nama wajib diisi')
        return
    }

    // 1. Sign up
    const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
    })
    if (signUpError) {
        setError(signUpError.message)
        return
    }

    // 2. Sign in
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
    })
    if (signInError || !data.session) {
        setError('Gagal login')
        return
    }

    // 3. Aktivasi member via edge function
    const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_FUNCTION_URL}/activate-invite-member`,
        {
            method: 'POST',
            headers: {
            'Authorization': `Bearer ${data.session.access_token}`,
            'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token, full_name: fullName }),
        }
        )

        if (!res.ok) {
        // handle 404/500 safely even if no JSON returned
        let msg = 'Aktivasi gagal'
        try {
            const j = await res.json()
            msg = j.error || msg
        } catch {
          // ignore if response body is not JSON
        }
        setError(msg)
        return
        }

    // 🔁 Refresh JWT supaya role berubah
    await supabase.auth.refreshSession()

    // 4. Redirect
    navigate('/mydashboard')
    }


  if (loading) return <p>Memverifikasi undangan...</p>
  if (error) return <p className="text-red-500">{error}</p>

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-xl font-bold mb-4">
        Pendaftaran Member Khusus
      </h1>

      <label className="block mb-2">
        Email
        <input
          value={email}
          disabled
          className="w-full border px-3 py-2 rounded bg-gray-100"
        />
      </label>

      <label className="block mb-4">
        Nama Lengkap
        <input
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          className="w-full border px-3 py-2 rounded"
          placeholder="Nama siswa"
        />
      </label>

      <label className="block mb-4">
        Password
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full border px-3 py-2 rounded"
        />
      </label>

      <button
        onClick={handleRegister}
        className="w-full bg-blue-600 text-white py-2 rounded"
      >
        Daftar & Masuk Member
      </button>
    </div>
  )
}
