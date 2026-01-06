import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type Profile = {
  full_name: string | null
  membership_type: 'free' | 'paid' | null
  membership_status: 'active' | 'expired' | 'revoked'
  membership_expired_at: string | null
}

export default function MemberDashboard() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      // 🔐 Guard: pastikan session ada
      if (!session) {
        navigate('/login')
        return
      }

      // 🔐 Guard member
      const { data: profileStatus } = await supabase
        .from('profiles')
        .select('membership_status')
        .eq('id', session.user.id)
        .single()

      if (!profileStatus || profileStatus.membership_status !== 'active') {
        navigate('/upgrade')
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select(`
          full_name,
          membership_type,
          membership_status,
          membership_expired_at
        `)
        .eq('id', session.user.id)
        .single()

      if (error) {
        console.error(error)
      }

      setProfile(data)
      setLoading(false)
    }

    load()
  }, [navigate])

  if (loading) {
    return <div className="p-8">Memuat dashboard...</div>
  }

  if (!profile) {
    return <div className="p-8">Profil tidak ditemukan</div>
  }

  const expiredAt = profile.membership_expired_at
    ? new Date(profile.membership_expired_at).toLocaleDateString()
    : null

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">
      {/* ================= HEADER ================= */}
      <section>
        <h1 className="text-2xl font-bold mb-2">
          Selamat Datang{profile.full_name ? `, ${profile.full_name}` : ''}
        </h1>
        <p className="text-gray-600">
          Ini adalah area belajar khusus member.
        </p>
      </section>

      {/* ================= STATUS CARD ================= */}
      <section className="grid md:grid-cols-3 gap-6">
        <div className="bg-white border rounded-xl p-6">
          <h3 className="text-sm text-gray-500 mb-1">Status Member</h3>
          <div className="text-lg font-semibold">
            {profile.membership_type === 'paid' ? 'Member Premium' : 'Member'}
          </div>
        </div>

        <div className="bg-white border rounded-xl p-6">
          <h3 className="text-sm text-gray-500 mb-1">Jenis Akses</h3>
          <div className="text-lg font-semibold">
            {profile.membership_type === 'paid' ? 'Berbayar' : 'Undangan'}
          </div>
        </div>

        <div className="bg-white border rounded-xl p-6">
          <h3 className="text-sm text-gray-500 mb-1">Berlaku Sampai</h3>
          <div className="text-lg font-semibold">
            {expiredAt || 'Tidak terbatas'}
          </div>
        </div>
      </section>

      {/* ================= ACTION ================= */}
      <section className="bg-indigo-50 border border-indigo-200 rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="font-semibold mb-1">Mulai Belajar Sekarang</h3>
          <p className="text-sm text-gray-600">
            Akses seluruh latihan yang tersedia untuk member.
          </p>
        </div>

        <Link
          to="/category"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded"
        >
          Lihat Semua Latihan
        </Link>
      </section>

      {/* ================= UPGRADE CTA ================= */}
      {profile.membership_type === 'free' && (
        <section className="bg-white border rounded-xl p-6">
          <h3 className="font-semibold mb-2">Ingin Akses Lebih Lama?</h3>
          <p className="text-sm text-gray-600 mb-4">
            Upgrade ke Member Premium untuk mendapatkan akses berkelanjutan
            dan fitur tambahan.
          </p>

          <Link
            to="/upgrade"
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded"
          >
            Upgrade Member Premium
          </Link>
        </section>
      )}
    </div>
  )
}