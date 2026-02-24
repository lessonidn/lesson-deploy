import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function LoginMember() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    const userId = data.user?.id
    if (!userId) {
      setError('Login gagal')
      setLoading(false)
      return
    }

    // 🔑 CEK PROFILE (SUMBER KEBENARAN)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('membership_status')
      .eq('id', userId)
      .single()

    setLoading(false)

    if (profileError || !profile) {
      // Login berhasil tapi bukan member
      navigate('/upgrade')
      return
    }

    if (profile.membership_status === 'active') {
      navigate('/mydashboard')
    } else {
      navigate('/upgrade')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white border rounded-xl p-8">
        <h1 className="text-2xl font-bold mb-2 text-center">Masuk Member</h1>
        <p className="text-sm text-gray-600 text-center mb-6">
          Masuk untuk mengakses area belajar member.
        </p>

        {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

        {/* ✅ Bungkus dalam form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <label className="block">
            <span className="text-sm">Email</span>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="mt-1 w-full border px-3 py-2 rounded"
            />
          </label>

          <label className="block">
            <span className="text-sm">Password</span>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="mt-1 w-full border px-3 py-2 rounded"
            />
          </label>

          <button
            type="submit" // ✅ submit form
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded"
          >
            {loading ? 'Masuk...' : 'Masuk'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Belum punya akses member?{' '}
          <Link to="/upgrade" className="text-indigo-600 hover:underline">
            Pelajari Member Premium
          </Link>
        </div>
      </div>
    </div>
  )
}