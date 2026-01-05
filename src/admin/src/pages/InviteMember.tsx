import { useState } from 'react'
import { supabase } from '../../../lib/supabase'

export default function InviteMember() {
  const [email, setEmail] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    setError(null)
    setInviteLink(null)
    setLoading(true)

    const { data, error } = await supabase.rpc(
      'create_member_invite',
      {
        p_email: email,
        p_expires_at: expiresAt
          ? new Date(expiresAt).toISOString()
          : null
      }
    )

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    const token = data?.[0]?.token
    if (!token) {
      setError('Gagal membuat invite')
      return
    }

    setInviteLink(`${window.location.origin}/invite/${token}`)
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-bold mb-4">
        Invite Member Gratis
      </h1>

      <label className="block mb-3">
        Email Siswa
        <input
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full border px-3 py-2 rounded"
        />
      </label>

      <label className="block mb-4">
        Expired (opsional)
        <input
          type="datetime-local"
          value={expiresAt}
          onChange={e => setExpiresAt(e.target.value)}
          className="w-full border px-3 py-2 rounded"
        />
      </label>

      <button
        onClick={handleGenerate}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {loading ? 'Membuat...' : 'Generate Invite'}
      </button>

      {inviteLink && (
        <div className="mt-4 p-3 bg-gray-100 rounded">
          <p className="text-sm mb-1">Link Invite:</p>
          <code className="block break-all text-sm">
            {inviteLink}
          </code>
        </div>
      )}

      {error && (
        <p className="text-red-500 mt-3">{error}</p>
      )}
    </div>
  )
}
