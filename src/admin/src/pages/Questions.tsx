import { useEffect, useState } from 'react'
import {
  getExamSets,
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from '../lib/quizApi'

type ExamSet = {
  id: string
  title: string
}

type Question = {
  id: string
  text: string
  exam_set_id: string
  exam_title: string
  exam_set?: ExamSet
}

export default function Questions() {
  const [sets, setSets] = useState<ExamSet[]>([])
  const [items, setItems] = useState<Question[]>([])
  const [text, setText] = useState('')
  const [setId, setSetId] = useState('')   // exam yang dipilih
  const [editId, setEditId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    const { data: setsData, error: setsError } = await getExamSets()
    const { data: questionsData, error: questionsError } = await getQuestions()

    if (setsError || questionsError) {
      setError(setsError?.message || questionsError?.message || 'Gagal memuat data')
    } else {
      setSets(setsData || [])
      setItems(questionsData || [])
    }
  }

  async function save() {
    if (!text || !setId) return

    if (editId) {
      const { error } = await updateQuestion(editId, text, setId) // ✅ kirim exam_set_id
      if (error) setError(error.message)
      setEditId(null)
    } else {
      const { error } = await createQuestion(text, setId)
      if (error) setError(error.message)
    }

    setText('')
    load()
  }

  async function remove(id: string) {
    const { error } = await deleteQuestion(id)
    if (error) setError(error.message)
    load()
  }

  function cancelEdit() {
    setEditId(null)
    setText('')
    // exam tetap dipilih agar tidak repot pilih lagi
  }

  useEffect(() => {
    load()
  }, [])

  const filteredItems = setId
    ? items.filter(q => q.exam_set_id === setId)
    : items

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Questions</h2>

      <div className="flex gap-2">
        <select
          className="border px-3 py-2 rounded"
          value={setId}
          onChange={e => setSetId(e.target.value)}
        >
          <option value="">Pilih Lembar Soal</option>
          {sets.map(s => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>

        <input
          className="border px-3 py-2 rounded flex-1"
          placeholder="Soal - Soal"
          value={text}
          onChange={e => setText(e.target.value)}
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

      <table className="w-full border-collapse bg-white border rounded">
        <thead>
          <tr className="bg-gray-100 text-center">
            <th className="p-2 border">Soal - Soal</th>
            <th className="p-2 border">Lembar Soal</th>
            <th className="p-2 border">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {filteredItems.map(q => (
            <tr
              key={q.id}
              className="hover:bg-sky-300 transition-colors" // ✅ hover efek
            >
              <td className="p-2 border">{q.text}</td>
              <td className="p-2 border text-sm text-gray-600 text-center">
                {q.exam_title || '-'}
              </td>
              <td className="p-2 border">
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditId(q.id)
                      setText(q.text)
                      setSetId(q.exam_set_id)
                      window.scrollTo({ top: 0, behavior: 'smooth' }) // ✅ scroll ke atas
                    }}
                    className="px-2 py-1 bg-yellow-500 text-white rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => remove(q.id)}
                    className="px-2 py-1 bg-red-600 text-white rounded"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}