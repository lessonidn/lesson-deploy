import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../../../lib/supabase'

type MediaItem = {
  path: string
  publicUrl: string
}

type Props = {
  open: boolean
  folder: string
  title?: string
  onClose: () => void
  onSelect: (path: string) => void
}

export default function MediaPicker({
  open,
  folder,
  title = 'Pilih Gambar',
  onClose,
  onSelect,
}: Props) {
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)

    const { data, error } = await supabase.storage
      .from('media')
      .list(folder, {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' },
      })

    if (!error && data) {
      const mapped = data
        .filter(f => f.name && !f.name.startsWith('.'))
        .map(file => {
          const path = `${folder}/${file.name}`
          const { data: url } = supabase.storage
            .from('media')
            .getPublicUrl(path)

          return {
            path,
            publicUrl: url.publicUrl,
          }
        })

      setItems(mapped)
    }

    setLoading(false)
  }, [folder])

  useEffect(() => {
    if (!open) return
    load()
  }, [open, load])

  async function handleDelete(path: string) {
    if (!confirm('Hapus gambar ini dari media?')) return

    setDeleting(path)

    const { error } = await supabase.storage
      .from('media')
      .remove([path])

    if (error) {
      alert(error.message)
    } else {
      setItems(prev => prev.filter(i => i.path !== path))
    }

    setDeleting(null)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl p-4">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold">
            {title} ({folder})
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-black"
          >
            ✕
          </button>
        </div>

        {loading && (
          <p className="text-sm text-gray-500">Memuat gambar…</p>
        )}

        {/* GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[60vh] overflow-auto">
          {items.map(item => (
            <div
              key={item.path}
              className="border rounded p-2 flex flex-col gap-2"
            >
              {/* IMAGE */}
              <button
                onClick={() => {
                  onSelect(item.path)
                  onClose()
                }}
                className="hover:ring-2 hover:ring-indigo-500 rounded"
              >
                <img
                  src={item.publicUrl}
                  alt=""
                  className="h-28 w-full object-contain"
                />
              </button>

              {/* ACTION */}
              <button
                onClick={() => handleDelete(item.path)}
                disabled={deleting === item.path}
                className="
                  text-xs text-red-600
                  hover:underline
                  disabled:opacity-50
                "
              >
                {deleting === item.path ? 'Menghapus…' : '🗑 Hapus'}
              </button>
            </div>
          ))}
        </div>

        {!loading && items.length === 0 && (
          <p className="text-sm text-gray-500 text-center mt-4">
            Belum ada gambar di folder <b>{folder}</b>
          </p>
        )}
      </div>
    </div>
  )
}
