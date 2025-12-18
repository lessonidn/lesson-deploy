import { useEffect, useState } from 'react'
import {
  getExamSets,
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from '../lib/quizApi'

// Definisikan tipe data
type ExamSet = {
  id: string
  title: string
}

type Question = {
  id: string
  text: string
  exam_set_id: string
  exam_sets?: {
    id: string
    title: string
  }[]   // ✅ array
}

export default function Questions() {
  const [sets, setSets] = useState<ExamSet[]>([])      // ✅ bukan any[]
  const [items, setItems] = useState<Question[]>([])   // ✅ bukan any[]
  const [text, setText] = useState('')
  const [setId, setSetId] = useState('')
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
      const { error } = await updateQuestion(editId, text)
      if (error) setError(error.message)
      setEditId(null)
    } else {
      const { error } = await createQuestion(text, setId)
      if (error) setError(error.message)
    }

    setText('')
    setSetId('')
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
    setSetId('')
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Questions</h2>

      <div className="flex gap-2">
        <select
          className="border px-3 py-2 rounded"
          value={setId}
          onChange={e => setSetId(e.target.value)}
        >
          <option value="">Select Exam</option>
          {sets.map(s => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>

        <input
          className="border px-3 py-2 rounded flex-1"
          placeholder="Question text"
          value={text}
          onChange={e => setText(e.target.value)}
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
        {items.map(q => (
          <li key={q.id} className="p-3 flex justify-between">
            {q.text} — <span className="text-sm text-gray-500">{q.exam_sets?.[0]?.title}</span>
            <span className="flex gap-2">
              <button
                onClick={() => {
                  setEditId(q.id)
                  setText(q.text)
                  setSetId(q.exam_set_id)
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
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}