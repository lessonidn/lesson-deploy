import { useEffect, useState } from 'react'
import {
  getCategories,
  softDeleteCategory,
  togglePublishExamSet,
  reorderCategories,
} from '../lib/quizApi'
import { usePreventDoubleClick } from '../lib/usePreventDoubleClick'
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd'
import { supabase } from '../../../lib/supabase'
import { uploadImageAsWebP } from '../hooks/useImageUpload'
import CategoryMediaPicker from '../components/media/CategoryMediaPicker'

type Category = {
  id: string
  name: string
  slug: string
  description?: string | null
  banner_image?: string | null
  is_published?: boolean
  order_index?: number
}

export default function Categories() {
  const [items, setItems] = useState<Category[]>([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [bannerImage, setBannerImage] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { canClick } = usePreventDoubleClick()
  const [showMediaPicker, setShowMediaPicker] = useState(false)

  /* ================= LOAD ================= */
  async function load() {
    setLoading(true)
    setError(null)

    const { data, error } = await getCategories()
    if (error) {
      setError(error.message)
    } else {
      setItems(
        (data || []).map((c: Category) => ({
          ...c,
          is_published: c.is_published ?? false,
        }))
      )
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  /* ================= SAVE ================= */
  async function save() {
    if (!name) return
    if (!canClick()) return

    const slugValue = slugify(name)

    const payload = {
      name,
      slug: slugValue,
      description: description || null,
      banner_image: bannerImage || null,
      is_deleted: false,
      is_published: true,
    }

    // =========================
    // EDIT MODE (AMAN)
    // =========================
    if (editId) {
      await supabase
        .from('categories')
        .update(payload)
        .eq('id', editId)

      resetForm()
      load()
      return
    }

    // =========================
    // CREATE / RESTORE MODE
    // =========================

    // 1️⃣ cek apakah slug sudah pernah ada
    const { data: existing, error } = await supabase
      .from('categories')
      .select('id, is_deleted')
      .eq('slug', slugValue)
      .maybeSingle()

    if (error) {
      console.error(error)
      return
    }

    // 2️⃣ kalau ada & pernah dihapus → RESTORE
    if (existing && existing.is_deleted) {
      await supabase
        .from('categories')
        .update(payload)
        .eq('id', existing.id)

      resetForm()
      load()
      return
    }

    // 3️⃣ kalau ada & masih aktif → TOLAK
    if (existing && !existing.is_deleted) {
      alert('Kategori dengan nama ini sudah ada')
      return
    }

    // 4️⃣ benar-benar baru → INSERT
    await supabase
      .from('categories')
      .insert(payload)

    resetForm()
    load()
  }

  function resetForm() {
    setName('')
    setDescription('')
    setBannerImage(null)
    setEditId(null)
  }

  async function remove(id: string) {
    const { error } = await softDeleteCategory(id)
    if (error) setError(error.message)
    load()
  }

  /* ================= PUBLISH ================= */
  async function togglePublish(id: string, value: boolean) {
    const { error } = await togglePublishExamSet('categories', id, value)
    if (error) setError(error.message)
    load()
  }

  /* ================= DRAG & DROP ================= */
  async function onDragEnd(result: DropResult) {
    if (!result.destination) return

    const reordered = Array.from(items)
    const [moved] = reordered.splice(result.source.index, 1)
    reordered.splice(result.destination.index, 0, moved)

    const updated = reordered.map((item, index) => ({
      ...item,
      order_index: index + 1,
    }))

    setItems(updated)

    await reorderCategories(
      updated.map(i => ({
        id: i.id,
        order_index: i.order_index!,
      }))
    )
  }

  /* ================= UPLOAD BANNER ================= */
  async function handleUploadBanner(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      // ⬅️ INI YANG SAMA DENGAN QUESTIONS
      const path = await uploadImageAsWebP(file, 'categories')

      // path = "categories/uuid.webp"
      setBannerImage(path)
    } catch (err) {
      console.error('Upload banner gagal:', err)
    } finally {
      e.target.value = ''
    }
  }

  // HELPER PUBLIC URL
  function getPublicImageUrl(path: string) {
    const { data } = supabase.storage
      .from('media')
      .getPublicUrl(path)
    return data.publicUrl
  }

  function slugify(text: string) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
  }



  /* ================= RENDER ================= */
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Categories</h2>

      {/* FORM */}
      <div className="bg-white border rounded p-4 space-y-3">
        <input
          className="border px-3 py-2 rounded w-full"
          placeholder="Nama kategori"
          value={name}
          onChange={e => setName(e.target.value)}
        />

        <textarea
          className="border p-2 w-full rounded"
          placeholder="Deskripsi kategori"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />

        {/* ACTION IMAGE */}
        <div className="flex gap-2 mt-2">
          {/* Upload baru */}
          <label className="px-3 py-1 rounded bg-gray-200 cursor-pointer text-sm">
            Upload Gambar
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={handleUploadBanner}
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

        {/* MEDIA PICKER */}
        <CategoryMediaPicker
          open={showMediaPicker}
          folder="categories"
          title="Pilih Gambar Kategori"
          onClose={() => setShowMediaPicker(false)}
          onSelect={(path) => {
            setBannerImage(path)
          }}
        />

        {/* PREVIEW */}
        {bannerImage && (
          <img
            src={getPublicImageUrl(bannerImage)}
            className="h-32 rounded object-cover border"
          />
        )}

        {/* ACTION BUTTON */}
        <div className="flex gap-2">
          <button
            onClick={save}
            className="px-4 py-2 bg-indigo-600 text-white rounded"
          >
            {editId ? 'Update' : 'Tambah'}
          </button>

          {editId && (
            <button
              onClick={resetForm}
              className="px-4 py-2 bg-gray-400 text-white rounded"
            >
              Batal
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-red-500">{error}</p>}
      {loading && <p>Loading...</p>}

      {/* TABLE + DRAG */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="categories">
          {provided => (
            <table
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="w-full bg-white border rounded text-sm"
            >
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 w-10"></th>
                  <th className="p-3 text-left">Kategori</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {items.map((c, index) => (
                  <Draggable key={c.id} draggableId={c.id} index={index}>
                    {provided => (
                      <tr
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="border-t hover:bg-gray-50"
                      >
                        <td
                          {...provided.dragHandleProps}
                          className="p-3 cursor-move text-center text-gray-400"
                        >
                          ☰
                        </td>
                        <td className="p-3">{c.name}</td>
                        <td className="p-3 text-center">
                          {c.is_published ? 'Published' : 'Hidden'}
                        </td>
                        <td className="p-3 flex gap-2 justify-center">
                          <button
                            onClick={() => togglePublish(c.id, !c.is_published)}
                            className="px-2 py-1 bg-blue-600 text-white rounded"
                          >
                            {c.is_published ? 'Unpublish' : 'Publish'}
                          </button>

                          <button
                            onClick={() => {
                              setEditId(c.id)
                              setName(c.name)
                              setDescription(c.description || '')
                              setBannerImage(c.banner_image || null)
                            }}
                            className="px-2 py-1 bg-yellow-500 text-white rounded"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => remove(c.id)}
                            className="px-2 py-1 bg-red-600 text-white rounded"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </tbody>
            </table>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  )
}
