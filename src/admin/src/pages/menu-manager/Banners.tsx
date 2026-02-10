import { useEffect, useState } from 'react'
import { supabase } from '../../../../lib/supabase'
import { uploadImageAsWebP } from '../../hooks/useImageUpload'
import CategoryMediaPicker from '../../components/media/CategoryMediaPicker'

type Banner = {
  id: string
  label: string
  url: string                 // link halaman
  image_url: string | null    // 🔥 gambar banner
  order_index: number
  is_active: boolean
}

type BannerForm = {
  label: string
  url: string              // 🔗 link halaman
  image_url: string        // 🖼️ gambar banner
  order_index: number
  is_active: boolean
}

const emptyBanner: BannerForm = {
  label: '',
  url: '',
  image_url: '',   // 🔥 TAMBAH
  order_index: 1,
  is_active: true,
}

function getPublicImageUrl(path: string) {
  if (!path) return ''
  return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/media/${path}`
}

export default function Banners() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [form, setForm] = useState<BannerForm>(emptyBanner)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [showMediaPicker, setShowMediaPicker] = useState(false)

  useEffect(() => {
    load()
  }, [])

  function generateUUID() {
    return crypto.randomUUID()
  }

  async function load() {
    const { data } = await supabase
      .from('menus')
      .select('id, label, url, image_url, order_index, is_active')
      .eq('position', 'hero')
      .order('order_index')

    setBanners(data || [])
  }

  async function save() {
    if (!form.image_url) {
      alert('URL / gambar wajib diisi')
      return
    }

  const payload = {
    label: form.label,
    url: form.url,                 // 🔗 link halaman
    image_url: form.image_url,     // 🖼️ gambar
    order_index: form.order_index,
    is_active: form.is_active,
    position: 'hero',
    source: 'manual',
    auto_generate: false,
  }

    if (editingId) {
      await supabase
        .from('menus')
        .update(payload)
        .eq('id', editingId)
    } else {
      const { error } = await supabase
        .from('menus')
        .insert({
          id: generateUUID(),
          ...payload,
        })

      if (error) {
        console.error('INSERT MENU ERROR:', error)
        alert(error.message)
        return
      }
    }

    reset()
    load()
  }

  function edit(b: Banner) {
    setEditingId(b.id)
    setForm({
      label: b.label,
      url: b.url,
      image_url: b.image_url || '',
      order_index: b.order_index,
      is_active: b.is_active,
    })
  }


  async function remove(id: string) {
    if (!confirm('Hapus banner ini?')) return
    await supabase.from('menus').delete().eq('id', id)
    load()
  }

  function reset() {
    setEditingId(null)
    setForm(emptyBanner)
  }

  // =========================
  // UPLOAD + AUTO WEBP
  // =========================
  async function handleUpload(file: File) {
    setUploading(true)

    const webpPath = await uploadImageAsWebP(file, 'banners')

    const { data } = supabase.storage
      .from('media')
      .getPublicUrl(webpPath)

    setForm(prev => ({
      ...prev,
      image_url: data.publicUrl,
    }))

    setUploading(false)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Hero Banner Manager</h1>

      {/* FORM */}
      <div className="bg-white p-4 border rounded-xl space-y-3">
        <input
          placeholder="Judul / Alt Banner"
          className="border p-2 w-full rounded"
          value={form.label}
          onChange={e => setForm({ ...form, label: e.target.value })}
        />

        <input
          type="number"
          placeholder="Urutan Slide"
          className="border p-2 w-full rounded"
          value={form.order_index}
          onChange={e =>
            setForm({ ...form, order_index: Number(e.target.value) })
          }
        />

        {/* LINK HALAMAN */}
        <input
          placeholder="Link Halaman (contoh: /category)"
          className="border p-2 w-full rounded"
          value={form.url}
          onChange={e => setForm({ ...form, url: e.target.value })}
        />

        {/* GAMBAR BANNER */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Gambar Banner</label>

          {/* ACTION IMAGE */}
          <div className="flex gap-2">
            {/* Upload baru */}
            <label className="px-3 py-1 rounded bg-gray-200 cursor-pointer text-sm">
              Upload Gambar
              <input
                type="file"
                accept="image/*"
                hidden
                disabled={uploading}
                onChange={e => {
                  if (!e.target.files?.[0]) return
                  handleUpload(e.target.files[0])
                }}
              />
            </label>

            {/* Pilih dari media */}
            <button
              type="button"
              onClick={() => setShowMediaPicker(true)}
              className="px-3 py-1 rounded bg-indigo-600 text-white text-sm"
            >
              Pilih dari Media
            </button>
          </div>

          {/* STATUS */}
          {uploading && (
            <div className="text-xs text-gray-500">
              Mengupload & mengompres gambar…
            </div>
          )}

          {/* PREVIEW */}
          {form.image_url && (
            <img
              src={form.image_url}
              alt="Preview Banner"
              className="h-32 w-full rounded-lg object-cover border"
            />
          )}
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={e =>
              setForm({ ...form, is_active: e.target.checked })
            }
          />
          Aktif
        </label>

        <div className="flex gap-3">
          <button
            onClick={save}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            {editingId ? 'Update' : 'Tambah'}
          </button>

          {editingId && (
            <button onClick={reset} className="px-4 py-2 border rounded">
              Batal
            </button>
          )}
        </div>
      </div>

      {/* LIST BANNERS */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="
          grid grid-cols-12 gap-2 px-4 py-2
          text-xs font-semibold bg-gray-50 border-b
          text-gray-600
        ">
          <div className="col-span-1">No</div>
          <div className="col-span-2">Preview</div>
          <div className="col-span-2">Judul</div>
          <div className="col-span-3">Link Halaman</div>
          <div className="col-span-2">Gambar</div>
          <div className="col-span-1 text-center">Status</div>
          <div className="col-span-1 text-center">Aksi</div>
        </div>

        {banners.length === 0 && (
          <div className="px-4 py-6 text-sm text-gray-500 text-center">
            Belum ada banner hero
          </div>
        )}

        {banners.map((b, i) => (
          <div
            key={b.id}
            className="
              grid grid-cols-12 gap-2 px-4 py-3
              text-sm border-b last:border-b-0
              items-center
            "
          >
            {/* NO */}
            <div className="col-span-1 text-xs text-gray-500">
              {i + 1}
            </div>

            {/* PREVIEW */}
            <div className="col-span-2">
              {b.image_url ? (
                <img
                  src={b.image_url}
                  alt={b.label}
                  className="h-14 w-full object-cover rounded-lg border"
                />
              ) : (
                <div className="h-14 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                  No Image
                </div>
              )}
            </div>

            {/* JUDUL */}
            <div className="col-span-2 font-medium truncate">
              {b.label || '—'}
            </div>

            {/* LINK HALAMAN */}
            <div className="col-span-3 text-xs text-blue-600 truncate">
              {b.url || '—'}
            </div>

            {/* URL GAMBAR */}
            <div className="col-span-2 text-xs text-gray-500 truncate">
              {b.image_url || '—'}
            </div>

            {/* STATUS */}
            <div className="col-span-1 flex justify-center">
              <span
                className={`text-xs px-2 py-1 rounded-full font-medium ${
                  b.is_active
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {b.is_active ? 'Aktif' : 'Off'}
              </span>
            </div>

            {/* AKSI */}
            <div className="col-span-1 flex justify-end gap-2 text-xs">
              <button
                onClick={() => edit(b)}
                className="text-blue-600 hover:underline"
              >
                Edit
              </button>
              <button
                onClick={() => remove(b.id)}
                className="text-red-600 hover:underline"
              >
                Hapus
              </button>
            </div>
          </div>
        ))}
      </div>
      <CategoryMediaPicker
        open={showMediaPicker}
        folder="banners"                 // 🔥 SEKARANG BENAR
        title="Pilih Gambar Banner"
        onClose={() => setShowMediaPicker(false)}
        onSelect={(path) => {
          setForm(prev => ({
            ...prev,
            image_url: getPublicImageUrl(path),
          }))
        }}
      />
    </div>
  )
}