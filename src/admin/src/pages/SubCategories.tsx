import { useEffect, useState } from 'react'
import {
  getCategories,
  getSubCategories,
  createSubCategory,
  updateSubCategory,
  softDeleteSubCategory,
} from '../lib/quizApi'

type Category = { id: string; name: string }

type SubCategory = {
  id: string
  name: string
  category_id: string
  categories?: { id: string; name: string }[] // hasil embed berupa array
}

export default function SubCategories() {
  const [cats, setCats] = useState<Category[]>([])
  const [items, setItems] = useState<SubCategory[]>([])
  const [name, setName] = useState('')
  const [catId, setCatId] = useState('')
  const [filterCatId, setFilterCatId] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function load(categoryId?: string) {
    const { data: catsData, error: catsError } = await getCategories()
    const { data: subsData, error: subsError } = await getSubCategories(categoryId)

    if (catsError || subsError) {
      setError(catsError?.message || subsError?.message || 'Gagal memuat data')
    } else {
      setError(null)
      setCats(catsData || [])
      setItems(subsData || [])
    }
  }

  async function save() {
    if (!name || !catId) return

    if (editId) {
      const { error } = await updateSubCategory(editId, { name, category_id: catId })
      if (error) setError(error.message)
      setEditId(null)
    } else {
      const { error } = await createSubCategory({ name, category_id: catId })
      if (error) setError(error.message)
    }

    setName('')
    setCatId('')
    await load(filterCatId || undefined)
  }

  async function remove(id: string) {
    const { error } = await softDeleteSubCategory(id)
    if (error) setError(error.message)
    await load(filterCatId || undefined)
  }

  function cancelEdit() {
    setEditId(null)
    setName('')
    setCatId('')
  }

  // ✅ Load awal agar list muncul sebelum filter diubah
  useEffect(() => {
    load(undefined)
  }, [])

  // ✅ Reload saat filter MAPEL berubah (backend filter)
  useEffect(() => {
    load(filterCatId || undefined)
  }, [filterCatId])

  const filteredItems = items

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Sub Categories</h2>

      {/* FORM INPUT */}
      <div className="flex gap-2">
        <select
          className="border px-3 py-2 rounded"
          value={catId}
          onChange={e => setCatId(e.target.value)}
        >
          <option value="">Pilih MAPEL</option>
          {cats.map(c => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <input
          className="border px-3 py-2 rounded"
          placeholder="Nama Judul (contoh: KELAS 4)"
          value={name}
          onChange={e => setName(e.target.value)}
        />

        <button onClick={save} className="bg-indigo-600 text-white px-4 rounded">
          {editId ? 'Update' : 'Tambah'}
        </button>

        {editId && (
          <button onClick={cancelEdit} className="bg-gray-400 text-white px-4 rounded">
            Batal
          </button>
        )}
      </div>

      {/* FILTER MAPEL */}
      <div>
        <select
          className="border px-3 py-2 rounded"
          value={filterCatId}
          onChange={e => setFilterCatId(e.target.value)}
        >
          <option value="">Filter Semua MAPEL</option>
          {cats.map(c => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-red-500">{error}</p>}

      {/* LIST */}
      <ul className="bg-white border rounded divide-y">
        {filteredItems.map(i => (
          <li key={i.id} className="p-3 flex justify-between hover:bg-gray-50 transition-colors">
            <span>
              {i.name} --{' '}
              <span className="text-sm text-gray-600">
                {i.categories?.[0]?.name || '-'}
              </span>
            </span>
            <span className="flex gap-2">
              <button
                onClick={() => {
                  setEditId(i.id)
                  setName(i.name)
                  setCatId(i.category_id)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="px-2 py-1 bg-yellow-500 text-white rounded"
              >
                Edit
              </button>
              <button onClick={() => remove(i.id)} className="px-2 py-1 bg-red-600 text-white rounded">
                Delete
              </button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}