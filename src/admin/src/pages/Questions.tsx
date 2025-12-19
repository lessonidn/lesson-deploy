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
      const { error } = await updateQuestion(editId, text, setId)
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
  }

  useEffect(() => {
    load()
  }, [])

  const filteredItems = setId
    ? items.filter(q => q.exam_set_id === setId)
    : items

  return (
    <div className="space-y-4 bg-gray-50 min-h-screen p-4 sm:p-6">
      <h2 className="text-xl font-semibold">Questions</h2>

      <div className="flex gap-2">
        <select
          className="border px-3 py-2 rounded max-w-xs truncate" // ✅ batasi lebar dropdown
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
          className="bg-indigo-600 text-white px-4 py-2 rounded"
        >
          {editId ? 'Update' : 'Tambah'}
        </button>

        {editId && (
          <button
            onClick={cancelEdit}
            className="bg-gray-400 text-white px-4 py-2 rounded"
          >
            Batal
          </button>
        )}
      </div>

      {error && <p className="text-red-500">{error}</p>}

      {/* ✅ Info jumlah soal */}
      <div className="text-sm text-gray-600">
        {setId
          ? `Jumlah soal di lembar "${sets.find(s => s.id === setId)?.title || '-'}": ${filteredItems.length}`
          : `Total semua soal: ${filteredItems.length}`}
      </div>

      <div className="overflow-x-auto rounded shadow bg-white">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 text-center">
              <th className="p-2 border w-2/3">Soal - Soal</th>
              <th className="p-2 border w-1/3">Lembar Soal</th>
              <th className="p-2 border">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map(q => (
              <tr
                key={q.id}
                className="hover:bg-yellow-300 transition-colors"
              >
                <td className="p-2 border">{q.text}</td>
                <td className="p-2 border text-sm text-gray-600 text-center truncate max-w-[200px]" title={q.exam_title}>
                  <span className="inline-block px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs">
                  {q.exam_title || '-'}
                  </span>
                </td>
                <td className="p-2 border">
                  <div className="flex gap-2 ">
                    <button
                      onClick={() => {
                        setEditId(q.id)
                        setText(q.text)
                        setSetId(q.exam_set_id)
                        window.scrollTo({ top: 0, behavior: 'smooth' })
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
    </div>
  )
}