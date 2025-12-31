import { useEffect, useState } from 'react'
import { supabase } from '../../../../src/lib/supabase'

type MediaFile = {
  name: string
  path: string
  publicUrl: string
}

const FOLDERS = ['questions', 'categories', 'banners', 'misc']

export default function Media() {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadMedia() {
    setLoading(true)
    setError(null)

    try {
      const allFiles: MediaFile[] = []

      for (const folder of FOLDERS) {
        const { data, error } = await supabase.storage
          .from('media')
          .list(folder, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } })

        if (error) throw error
        if (!data) continue

        for (const file of data) {
          // ✅ Skip folder kosong atau file tanpa nama
          if (!file.name || file.metadata?.size === 0) continue

          const path = folder === '' ? file.name : `${folder}/${file.name}`
          const { data: urlData } = supabase.storage
            .from('media')
            .getPublicUrl(path)
          
          if (urlData?.publicUrl) {
            allFiles.push({
              name: file.name,
              path,
              publicUrl: urlData.publicUrl,
            })
          }
        }
      }

      setFiles(allFiles)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal memuat media')
    } finally {
      setLoading(false)
    }
  }

  async function deleteMedia(path: string) {
    if (!confirm('Yakin ingin menghapus gambar ini?')) return

    const { error } = await supabase.storage.from('media').remove([path])

    if (error) {
      console.error('Delete error:', error)
      alert(`Gagal hapus: ${error.message}`)
    } else {
      setFiles(prev => prev.filter(f => f.path !== path))
    }
  }

  useEffect(() => {
    loadMedia()
    
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Media Library</h1>

      {loading && <p>Memuat media...</p>}
      {error && <p className="text-red-600">{error}</p>}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {files.map(file => (
          <div
            key={file.path}
            className="border rounded bg-white p-2 flex flex-col gap-2"
          >
            <img
              src={file.publicUrl}
              alt={file.name}
              className="object-contain h-32 w-full bg-gray-50"
              onError={e => { e.currentTarget.style.display = 'none' }} // ✅ hide broken image
            />

            <p className="text-xs truncate" title={file.name}>
              {file.name}
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(file.publicUrl)
                  alert('URL disalin')
                }}
                className="flex-1 text-xs bg-indigo-500 text-white rounded px-2 py-1"
              >
                Copy URL
              </button>

              <button
                onClick={() => deleteMedia(file.path)}
                className="flex-1 text-xs bg-red-600 text-white rounded px-2 py-1"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {!loading && files.length === 0 && (
        <p className="text-gray-500">Belum ada media.</p>
      )}
    </div>
  )
}