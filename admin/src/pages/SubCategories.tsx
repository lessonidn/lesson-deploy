import { useEffect, useState } from 'react'
import {
  getCategories,
  getSubCategories,
  createSubCategory,
  updateSubCategory,
  softDeleteSubCategory,
} from '../lib/quizApi'

// Definisikan tipe data
type Category = {
  id: string
  name: string
}

type SubCategory = {
  id: string
  name: string
  category_id: string
  categories?: {
    id: string
    name: string
  }[]   // Supabase default relasi → array
}

export default function SubCategories() {
  const [cats, setCats] = useState<Category[]>([])       // ✅ bukan any[]
  const [items, setItems] = useState<SubCategory[]>([])  // ✅ bukan any[]
  const [name, setName] = useState('')
  const [catId, setCatId] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    const { data: catsData, error: catsError } = await getCategories()
    const { data: subsData, error: subsError } = await getSubCategories()

    if (catsError || subsError) {
      setError(catsError?.message || subsError?.message || 'Gagal memuat data')
    } else {
      setCats(catsData || [])
      setItems(subsData || [])
    }
  }

  async function save() {
    if (!name || !catId) return

    if (editId) {
      const { error } = await updateSubCategory(editId, name)
      if (error) setError(error.message)
      setEditId(null)
    } else {
      const { error } = await createSubCategory(name, catId)
      if (error) setError(error.message)
    }

    setName('')
    setCatId('')
    load()
  }

  async function remove(id: string) {
    const { error } = await softDeleteSubCategory(id)
    if (error) setError(error.message)
    load()
  }

  function cancelEdit() {
    setEditId(null)
    setName('')
    setCatId('')
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Sub Categories</h2>

      <div className="flex gap-2">
        <select
          className="border px-3 py-2 rounded"
          value={catId}
          onChange={e => setCatId(e.target.value)}
        >
          <option value="">Select Category</option>
          {cats.map(c => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <input
          className="border px-3 py-2 rounded"
          placeholder="Sub category name"
          value={name}
          onChange={e => setName(e.target.value)}
        />

        <button
          onClick={save}
          className="bg-indigo-600 text-white px-4 rounded"
        >
          {editId ? 'Update' : 'Add'}
        </button>

        {editId && (
          <button
            onClick={cancelEdit}
            className="bg-gray-400 text-white px-4 rounded"
          >
            Batal
          </button>
        )}
      </div>

      {error && <p className="text-red-500">{error}</p>}

      <ul className="bg-white border rounded divide-y">
        {items.map(i => (
          <li key={i.id} className="p-3 flex justify-between">
            <span>
              {i.name} — <span className="text-sm text-gray-500">{i.categories?.[0]?.name}</span>
            </span>
            <span className="flex gap-2">
              <button
                onClick={() => {
                  setEditId(i.id)
                  setName(i.name)
                  setCatId(i.category_id)
                }}
                className="px-2 py-1 bg-yellow-500 text-white rounded"
              >
                Edit
              </button>
              <button
                onClick={() => remove(i.id)}
                className="px-2 py-1 bg-red-600 text-white rounded"
              >
                Soft Delete
              </button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}