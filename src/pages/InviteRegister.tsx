import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function InviteRegister() {
  const { token } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  // 1️⃣ validasi token
  useEffect(() => {
    const checkToken = async () => {
      const { data, error } = await supabase.rpc('check_invite_token', {
        p_token: token
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

  // 2️⃣ submit register
  const handleRegister = async () => {
    setError(null)

    const { error } = await supabase.auth.signUp({
      email,
      password
    })

    if (error) {
      setError(error.message)
      return
    }

    // 3️⃣ aktivasi member gratis
    const { error: activateError } = await supabase.rpc(
      'activate_free_member',
      { p_token: token }
    )

    if (activateError) {
      setError(activateError.message)
      return
    }

    navigate('/member/dashboard')
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
