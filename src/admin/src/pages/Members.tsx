import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

type Member = {
  id: string
  full_name: string | null
  membership_type: 'free' | 'paid' | null
  membership_status: 'active' | 'expired' | 'revoked'
  membership_started_at: string | null
  membership_expired_at: string | null
}

export default function Members() {
  const [items, setItems] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  async function load() {
    setLoading(true)

    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        membership_type,
        membership_status,
        membership_started_at,
        membership_expired_at
      `)
      .order('membership_started_at', { ascending: false })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setItems(data as Member[])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function revokeMember(userId: string) {
    if (!window.confirm('Yakin ingin mencabut akses member ini?')) return

    await supabase
      .from('profiles')
      .update({
        membership_status: 'revoked',
        membership_expired_at: new Date().toISOString(),
      })
      .eq('id', userId)

    await supabase.auth.admin.updateUserById(userId, {
      app_metadata: { role: 'public' },
    })

    load()
  }

  async function deleteMember(userId: string) {
    if (!window.confirm('PERINGATAN!\n\nAkun akan DIHAPUS PERMANEN.\nLanjutkan?')) return

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_FUNCTION_URL}/delete-member`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 🔥 WAJIB
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ userId }),
      }
    )

    const result = await res.json()
    if (!res.ok) {
      setError(result.error || 'Gagal menghapus member')
      return
    }

    load()
  }


  const filteredItems = items.filter(m =>
    m.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div>Loading members...</div>
  if (error) return <div className="text-red-500">{error}</div>

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Members</h2>

      <div className="flex items-center gap-2">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari nama member..."
          className="border px-3 py-2 rounded w-64"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="text-gray-500 hover:text-red-500"
          >
            ✖
          </button>
        )}
      </div>

      <div className="bg-white border rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">Nama</th>
              <th className="px-4 py-2">Tipe</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Berlaku</th>
              <th className="px-4 py-2">Aksi</th>
            </tr>
          </thead>

          <tbody>
            {filteredItems.map(m => (
              <tr key={m.id} className="border-t">
                <td className="px-4 py-2">
                  {m.full_name || (
                    <i className="text-gray-400">Tanpa nama</i>
                  )}
                </td>

                <td className="px-4 py-2">
                  {m.membership_type === 'free' && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                      Invite
                    </span>
                  )}
                  {m.membership_type === 'paid' && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                      Paid
                    </span>
                  )}
                </td>

                <td className="px-4 py-2">
                  <span className="text-xs px-2 py-0.5 rounded bg-gray-100">
                    {m.membership_status}
                  </span>
                </td>

                <td className="px-4 py-2">
                  {m.membership_expired_at
                    ? new Date(
                        m.membership_expired_at
                      ).toLocaleDateString()
                    : '-'}
                </td>

                <td className="px-4 py-2 space-x-2">
                  <button
                    onClick={() => revokeMember(m.id)}
                    className="text-xs bg-red-600 text-white px-2 py-1 rounded"
                  >
                    Revoke
                  </button>
                  <button
                    onClick={() => deleteMember(m.id)}
                    className="text-xs bg-gray-800 text-white px-2 py-1 rounded"
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
