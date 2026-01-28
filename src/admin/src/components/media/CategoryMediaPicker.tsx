import { useEffect, useState } from 'react'
import { supabase } from '../../../../lib/supabase'

type MediaItem = {
  path: string
  publicUrl: string
}

type Props = {
  open: boolean
  onClose: () => void
  onSelect: (path: string) => void
}

export default function CategoryMediaPicker({
  open,
  onClose,
  onSelect,
}: Props) {
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return

    async function load() {
      setLoading(true)

      const { data, error } = await supabase.storage
        .from('media')
        .list('categories', {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' },
        })

      if (!error && data) {
        const mapped = data.map(file => {
          const path = `categories/${file.name}`
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
    }

    load()
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl p-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold">Pilih Gambar Kategori</h2>
          <button onClick={onClose}>✕</button>
        </div>

        {loading && <p className="text-sm text-gray-500">Memuat...</p>}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[60vh] overflow-auto">
          {items.map(item => (
            <button
              key={item.path}
              onClick={() => {
                onSelect(item.path)
                onClose()
              }}
              className="border rounded hover:ring-2 hover:ring-indigo-500 p-2"
            >
              <img
                src={item.publicUrl}
                alt=""
                className="h-28 w-full object-contain"
              />
            </button>
          ))}
        </div>

        {!loading && items.length === 0 && (
          <p className="text-sm text-gray-500 text-center mt-4">
            Belum ada gambar kategori
          </p>
        )}
      </div>
    </div>
  )
}
