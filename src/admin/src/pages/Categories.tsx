import { useEffect, useState } from 'react'
import {
  getCategories,
  createCategory,
  updateCategory,
  softDeleteCategory,
} from '../lib/quizApi'

type Category = {
  id: string
  name: string
  slug: string
}

export default function Categories() {
  const [items, setItems] = useState<Category[]>([])
  const [name, setName] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    setError(null)

    const { data, error } = await getCategories()
    if (error) {
      setError(error.message)
    } else {
      setItems(data || [])
    }

    setLoading(false)
  }

  async function save() {
    if (!name) return

    if (editId) {
      const { error } = await updateCategory(editId, name)
      if (error) setError(error.message)
      setEditId(null)
    } else {
      const { error } = await createCategory(name)
      if (error) setError(error.message)
    }

    setName('')
    load()
  }

  async function remove(id: string) {
    const { error } = await softDeleteCategory(id)
    if (error) setError(error.message)
    load()
  }

  function cancelEdit() {
    setEditId(null)
    setName('')
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Categories</h2>

      <div className="flex gap-2">
        <input
          className="border px-3 py-2 rounded w-64"
          placeholder="Mata Pelajaran"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <button
          onClick={save}
          className="px-4 py-2 bg-indigo-600 text-white rounded"
        >
          {editId ? 'Update' : 'Tambah'}
        </button>
        {editId && (
          <button
            onClick={cancelEdit}
            className="px-4 py-2 bg-gray-400 text-white rounded"
          >
            Batal
          </button>
        )}
      </div>

      {error && <p className="text-red-500">{error}</p>}
      {loading && <p>Loading...</p>}

      <div className="bg-white border rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Slug</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(c => (
              <tr key={c.id} className="border-t">
                <td className="p-3">{c.name}</td>
                <td className="p-3">{c.slug}</td>
                <td className="p-3 flex gap-2">
                  <button
                    onClick={() => {
                      setEditId(c.id)
                      setName(c.name)
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}