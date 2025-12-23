import { useEffect, useState } from 'react'
import {
  getQuestions,
  getChoices,
  createChoice,
  updateChoice,
  deleteChoice,
  getExamSets, // ✅ tambahkan API ambil exam_sets
} from '../lib/quizApi'
import { usePreventDoubleClick } from '../lib/usePreventDoubleClick'

type ExamSet = {
  id: string
  title: string
}

type Question = {
  id: string
  text: string
  exam_set_id: string
}

type Choice = {
  id: string
  text: string
  is_correct: boolean
  question_id: string
  explanation?: string
}

export default function Choices() {
  const [examSets, setExamSets] = useState<ExamSet[]>([])
  const [examId, setExamId] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [questionId, setQuestionId] = useState('')
  const [text, setText] = useState('')
  const [correct, setCorrect] = useState(false)
  const [explanation, setExplanation] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [choices, setChoices] = useState<Choice[]>([])
  const [editId, setEditId] = useState<string | null>(null)
  const { canClick } = usePreventDoubleClick()

  const unicodeSymbols = [
    "√", "∛", "∜",  "∑", "π", "∞", "Δ", "Ω", "α", "β", "γ", "θ", "μ", "λ", "σ", "φ", "ψ", "∫", "≈", "≠", "≤", "≥", 
  ]
  const [showSymbols, setShowSymbols] = useState(false)

  function insertSymbol(sym: string) {
    setExplanation(prev => prev + sym)
  }

  useEffect(() => {
    async function loadData() {
      const { data: examData } = await getExamSets()
      setExamSets(examData || [])

      const { data: questionData, error } = await getQuestions()
      if (error) setError(error.message)
      else setQuestions(questionData || [])
    }
    loadData()
  }, [])

  async function loadChoices(qid: string) {
    const { data, error } = await getChoices(qid)
    if (error) setError(error.message)
    else setChoices(data || [])
  }

  async function save() {
    if (!questionId || !text) return
    if (!canClick()) return

    if (editId) {
      const { error } = await updateChoice(editId, text, correct, explanation)
      if (error) setError(error.message)
      setEditId(null)
    } else {
      const { error } = await createChoice(questionId, text, correct, explanation)
      if (error) setError(error.message)
    }

    setText('')
    setCorrect(false)
    setExplanation('')
    loadChoices(questionId)
  }

  async function remove(id: string) {
    const { error } = await deleteChoice(id)
    if (error) setError(error.message)
    loadChoices(questionId)
  }

  function cancelEdit() {
    setEditId(null)
    setText('')
    setCorrect(false)
    setExplanation('')
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold mb-4">Choices</h2>

      {/* Filter exam set */}
      <select
        className="border px-3 py-2 rounded w-full md:w-1/2"
        value={examId}
        onChange={e => {
          setExamId(e.target.value)
          setQuestionId('')
          setChoices([])
        }}
      >
        <option value="">Pilih Lembar Soal</option>
        {examSets.map(ex => (
          <option key={ex.id} value={ex.id}>
            {ex.title}
          </option>
        ))}
      </select>

      {/* Dropdown soal sesuai exam */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <select
          className="border px-3 py-2 rounded w-full"
          value={questionId}
          onChange={e => {
            setQuestionId(e.target.value)
            if (e.target.value) loadChoices(e.target.value)
          }}
        >
          <option value="">Pilih Soal</option>
          {questions
            .filter(q => !examId || q.exam_set_id === examId)
            .map(q => (
              <option key={q.id} value={q.id}>
                {q.text}
              </option>
            ))}
        </select>

        <input
          className="border px-3 py-2 rounded w-full md:col-span-2"
          placeholder="Jawaban"
          value={text}
          onChange={e => setText(e.target.value)}
        />

        <label className="flex items-center gap-1 w-full">
          <input
            type="checkbox"
            checked={correct}
            onChange={e => setCorrect(e.target.checked)}
          />
          Kunci Jawaban
        </label>
      </div>

      {/* Tombol untuk membuka daftar simbol */}
      <button
        type="button"
        onClick={() => setShowSymbols(prev => !prev)}
        className="px-3 py-1 border rounded bg-blue-200 hover:bg-orange-300"
      >
        Insert Unicode
      </button>

      {/* Panel daftar simbol */}
      {showSymbols && (
        <div className="flex flex-wrap gap-2 mt-2">
          {unicodeSymbols.map(sym => (
            <button
              key={sym}
              type="button"
              onClick={() => insertSymbol(sym)}
              className="px-2 py-1 border rounded bg-white hover:bg-gray-100"
            >
              {sym}
            </button>
          ))}
        </div>
      )}

      {/* Textarea penjelasan */}
      <textarea
        className="border px-3 py-2 rounded w-full md:col-span-2"
        placeholder="Penjelasan Jawaban (opsional)"
        value={explanation}
        onChange={e => setExplanation(e.target.value)}
        rows={3}
      />

      <div className="flex flex-wrap gap-2">
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

      {questionId && (
        <ul className="bg-white border rounded divide-y">
          {choices.map(c => (
            <li key={c.id} className="p-3 flex justify-between items-start">
              <div>
                <span>
                  {c.text}{' '}
                  {c.is_correct && (
                    <span className="text-green-600 font-semibold">✔</span>
                  )}
                </span>
                {c.explanation && (
                  <div className="text-gray-500 text-sm mt-1">
                    {c.explanation}
                  </div>
                )}
              </div>

              <span className="flex gap-2">
                <button
                  onClick={() => {
                    setEditId(c.id)
                    setText(c.text)
                    setCorrect(c.is_correct)
                    setExplanation(c.explanation || '')
                  }}
                  className="px-2 py-1 bg-yellow-500 text-white rounded text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Apakah Anda yakin ingin menghapus Jawaban ini?`)) {
                      remove(c.id)
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
      )}
    </div>
  )
}