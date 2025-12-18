import { useEffect, useState } from 'react'
import {
  getSubCategories,
  getExamSets,
  createExamSet,
  updateExamSet,
  softDeleteExamSet,
} from '../lib/quizApi'

// Definisikan tipe data
type SubCategory = {
  id: string
  name: string
}

type ExamSet = {
  id: string
  title: string
  sub_category_id: string
  sub_categories?: {
    id: string
    name: string
  }[]   // ✅ array
}

export default function ExamSets() {
  const [subs, setSubs] = useState<SubCategory[]>([])   // ✅ bukan any[]
  const [items, setItems] = useState<ExamSet[]>([])     // ✅ bukan any[]
  const [title, setTitle] = useState('')
  const [subId, setSubId] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    const { data: subsData, error: subsError } = await getSubCategories()
    const { data: examData, error: examError } = await getExamSets()

    if (subsError || examError) {
      setError(subsError?.message || examError?.message || 'Gagal memuat data')
    } else {
      setSubs(subsData || [])
      setItems(examData || [])
    }
  }

  async function save() {
    if (!title || !subId) return

    if (editId) {
      const { error } = await updateExamSet(editId, title)
      if (error) setError(error.message)
      setEditId(null)
    } else {
      const { error } = await createExamSet(title, subId)
      if (error) setError(error.message)
    }

    setTitle('')
    setSubId('')
    load()
  }

  async function remove(id: string) {
    const { error } = await softDeleteExamSet(id)
    if (error) setError(error.message)
    load()
  }

  function cancelEdit() {
    setEditId(null)
    setTitle('')
    setSubId('')
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Exam Sets</h2>

      <div className="flex gap-2">
        <select
          className="border px-3 py-2 rounded"
          value={subId}
          onChange={e => setSubId(e.target.value)}
        >
          <option value="">Pilih Judul</option>
          {subs.map(s => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <input
          className="border px-3 py-2 rounded flex-1"
          placeholder="Nama Lembar Soal"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />

        <button
          onClick={save}
          className="bg-indigo-600 text-white px-4 rounded"
        >
          {editId ? 'Update' : 'Tambah'}
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
              {i.title} — <span className="text-sm text-gray-500">{i.sub_categories?.[0]?.name}</span>
            </span>
            <span className="flex gap-2">
              <button
                onClick={() => {
                  setEditId(i.id)
                  setTitle(i.title)
                  setSubId(i.sub_category_id)
                }}
                className="px-2 py-1 bg-yellow-500 text-white rounded"
              >
                Edit
              </button>
              <button
                onClick={() => remove(i.id)}
                className="px-2 py-1 bg-red-600 text-white rounded"
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