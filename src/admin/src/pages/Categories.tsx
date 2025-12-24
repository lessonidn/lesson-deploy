import { useEffect, useState } from 'react'
import {
  getCategories,
  createCategory,
  updateCategory,
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

    const payload = {
      name,
      description,
      banner_image: bannerImage,
    }

    if (editId) {
      const { error } = await updateCategory(editId, payload)
      if (error) setError(error.message)
      setEditId(null)
    } else {
      const { error } = await createCategory(payload)
      if (error) setError(error.message)
    }

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
  async function uploadBanner(file: File) {
    const ext = file.name.split('.').pop()
    const fileName = `${crypto.randomUUID()}.${ext}`
    const filePath = `banners/${fileName}`

    const { error } = await supabase.storage
      .from('categories')
      .upload(filePath, file, { upsert: true })

    if (error) throw error

    const { data } = supabase.storage
      .from('categories')
      .getPublicUrl(filePath)

    return data.publicUrl
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

        <input
          type="file"
          accept="image/*"
          onChange={async e => {
            const file = e.target.files?.[0]
            if (!file) return
            const url = await uploadBanner(file)
            setBannerImage(url)
          }}
        />

        {bannerImage && (
          <img
            src={bannerImage}
            className="h-32 rounded object-cover border"
          />
        )}

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
