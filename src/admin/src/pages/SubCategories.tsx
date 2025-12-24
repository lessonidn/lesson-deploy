import { useEffect, useState } from 'react'
import {
  getCategories,
  getSubCategories,
  createSubCategory,
  updateSubCategory,
  softDeleteSubCategory,
} from '../lib/quizApi'
import { usePreventDoubleClick } from '../lib/usePreventDoubleClick'

type Category = { id: string; name: string }

type SubCategory = {
  id: string
  name: string
  category_id: string
  categories?: { id: string; name: string }   // object tunggal
}

export default function SubCategories() {
  const [cats, setCats] = useState<Category[]>([])
  const [items, setItems] = useState<SubCategory[]>([])
  const [name, setName] = useState('')
  const [catId, setCatId] = useState('')
  const [filterCatId, setFilterCatId] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { canClick } = usePreventDoubleClick()

  async function load(categoryId?: string) {
    const { data: catsData, error: catsError } = await getCategories()
    const { data: subsData, error: subsError } = await getSubCategories(categoryId)

    if (catsError || subsError) {
      setError(catsError?.message || subsError?.message || 'Gagal memuat data')
    } else {
      setError(null)
      setCats(catsData || [])
      setItems((subsData ?? []) as unknown as SubCategory[])
    }
  }

  async function save() {
    if (!name || !catId) return
    if (!canClick()) return

    if (editId) {
      const { error } = await updateSubCategory(editId, { name, category_id: catId })
      if (error) setError(error.message)
      setEditId(null)
    } else {
      const { error } = await createSubCategory({ name, category_id: catId })
      if (error) setError(error.message)
    }

    resetForm()
    await load(filterCatId || undefined)
  }

  async function remove(id: string) {
    const { error } = await softDeleteSubCategory(id)
    if (error) setError(error.message)
    await load(filterCatId || undefined)
  }

  function resetForm() {
    setEditId(null)
    setName('')
    setCatId('')
    setError(null)
  }

  function startEdit(i: SubCategory) {
    setEditId(i.id)
    setName(i.name)
    setCatId(i.category_id)
    // ✅ langsung scroll ke atas agar form terlihat
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  useEffect(() => {
    load(undefined)
  }, [])

  useEffect(() => {
    load(filterCatId || undefined)
  }, [filterCatId])

  const filteredItems = items

  return (
    <div className="space-y-4 bg-gray-50 min-h-screen p-4 sm:p-6">
      <h2 className="text-xl font-semibold">Sub Categories</h2>

      {/* FORM INPUT */}
      <div className="flex gap-2">
        <select
          className="border px-3 py-2 rounded"
          value={catId}
          onChange={e => {
            setCatId(e.target.value)

            // ✅ reset form kalau pindah MAPEL
            setEditId(null)
            setName('')
            setError(null)
          }}
        >
          <option value="">Pilih MAPEL</option>
          {cats.map(c => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <input
          className="border px-3 py-2 rounded w-80"
          placeholder="isi kelas, contoh: KELAS 4"
          value={name}
          onChange={e => setName(e.target.value)}
        />

        <button
          onClick={save}
          className="bg-indigo-600 text-white px-4 py-2 rounded"
        >
          {editId ? 'Update' : 'Tambah'}
        </button>

        {editId && (
          <button
            onClick={resetForm}
            className="bg-gray-400 text-white px-4 py-2 rounded"
          >
            Batal
          </button>
        )}
      </div>

      {/* FILTER MAPEL */}
      <div>
        <select
          className="border px-3 py-2 rounded"
          value={filterCatId}
          onChange={e => {
            setFilterCatId(e.target.value)

            // ✅ reset form kalau ganti filter MAPEL
            setEditId(null)
            setName('')
            setCatId('')
            setError(null)
          }}
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
          <li
            key={i.id}
            className="p-3 flex justify-between hover:bg-yellow-300 transition-colors"
          >
            <span>
              {i.name} -- {i.categories?.name || '-'}
            </span>
            <span className="flex gap-2">
              <button
                onClick={() => startEdit(i)}
                className="px-3 py-1 bg-yellow-500 text-white rounded text-sm"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  if (window.confirm(`Apakah Anda yakin ingin menghapus "${i.name}"?`)) {
                    remove(i.id)
                  }
                }}
                className="px-2 py-1 bg-red-600 text-white rounded text-sm"
              >
                Delete
              </button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}