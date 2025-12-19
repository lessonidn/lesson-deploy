import { useEffect, useState } from 'react'
import {
  getSubCategories,
  getExamSets,
  createExamSet,
  updateExamSet,
  softDeleteExamSet,
} from '../lib/quizApi'

// ================= TYPES =================
type SubCategory = {
  id: string
  name: string
}

type ExamSet = {
  id: string
  title: string
  sub_category_id: string
  duration_minutes: number
  sub_categories?: {
    id: string
    name: string
  }[]
}

// ================= COMPONENT =================
export default function ExamSets() {
  const [subs, setSubs] = useState<SubCategory[]>([])
  const [items, setItems] = useState<ExamSet[]>([])
  const [title, setTitle] = useState('')
  const [subId, setSubId] = useState('')
  const [durationMinutes, setDurationMinutes] = useState<number>(30)
  const [editId, setEditId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // ================= LOAD =================
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

  // ================= SAVE =================
  async function save() {
    if (!title || !subId) return

    const payload = {
      title,
      sub_category_id: subId,
      duration_minutes: durationMinutes || 30,
    }

    if (editId) {
      const { error } = await updateExamSet(editId, payload)
      if (error) setError(error.message)
      setEditId(null)
    } else {
      const { error } = await createExamSet(payload)
      if (error) setError(error.message)
    }

    resetForm()
    load()
  }

  // ================= DELETE =================
  async function remove(id: string) {
    const { error } = await softDeleteExamSet(id)
    if (error) setError(error.message)
    load()
  }

  // ================= HELPERS =================
  function resetForm() {
    setTitle('')
    setSubId('')
    setDurationMinutes(30)
    setEditId(null)
  }

  useEffect(() => {
    load()
  }, [])

  // ================= UI =================
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Exam Sets</h2>

      {/* FORM */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <select
          className="border px-3 py-2 rounded"
          value={subId}
          onChange={e => setSubId(e.target.value)}
        >
          <option value="">Pilih Sub Kategori</option>
          {subs.map(s => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <input
          className="border px-3 py-2 rounded"
          placeholder="Nama Lembar Soal"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />

        <input
          type="number"
          min={1}
          className="border px-3 py-2 rounded w-full"
          placeholder="Durasi (menit)"
          value={durationMinutes}
          onChange={e => setDurationMinutes(Number(e.target.value))}
        />

        <div className="flex gap-2">
          <button
            onClick={save}
            className="bg-indigo-600 text-white px-4 rounded"
          >
            {editId ? 'Update' : 'Tambah'}
          </button>

          {editId && (
            <button
              onClick={resetForm}
              className="bg-gray-400 text-white px-4 rounded"
            >
              Batal
            </button>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-500">
        ⏱ Default durasi: <b>30 menit</b>. Bisa diubah (contoh: 45 menit).
      </p>

      {error && <p className="text-red-500">{error}</p>}

      {/* LIST */}
      <ul className="bg-white border rounded divide-y">
        {items.map(i => (
          <li key={i.id} className="p-4 flex justify-between items-center">
            <div>
              <div className="font-medium">{i.title}</div>
              <div className="text-sm text-gray-500">
                {i.sub_categories?.[0]?.name} · ⏱ {i.duration_minutes} menit
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditId(i.id)
                  setTitle(i.title)
                  setSubId(i.sub_category_id)
                  setDurationMinutes(i.duration_minutes || 30)
                }}
                className="px-3 py-1 bg-yellow-500 text-white rounded"
              >
                Edit
              </button>

              <button
                onClick={() => remove(i.id)}
                className="px-3 py-1 bg-red-600 text-white rounded"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
