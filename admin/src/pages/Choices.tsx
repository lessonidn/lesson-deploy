import { useEffect, useState } from 'react'
import {
  getQuestions,
  getChoices,
  createChoice,
  updateChoice,
  deleteChoice,
} from '../lib/quizApi'

type Question = {
  id: string
  text: string
}

type Choice = {
  id: string
  text: string
  is_correct: boolean
  question_id: string
}

export default function Choices() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [questionId, setQuestionId] = useState('')
  const [text, setText] = useState('')
  const [correct, setCorrect] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [choices, setChoices] = useState<Choice[]>([])
  const [editId, setEditId] = useState<string | null>(null)

  useEffect(() => {
    async function loadQuestions() {
      const { data, error } = await getQuestions()
      if (error) setError(error.message)
      else setQuestions(data || [])
    }
    loadQuestions()
  }, [])

  async function loadChoices(qid: string) {
    const { data, error } = await getChoices(qid)
    if (error) setError(error.message)
    else setChoices(data || [])
  }

  async function save() {
    if (!questionId || !text) return

    if (editId) {
      const { error } = await updateChoice(editId, text, correct)
      if (error) setError(error.message)
      setEditId(null)
    } else {
      const { error } = await createChoice(questionId, text, correct)
      if (error) setError(error.message)
    }

    setText('')
    setCorrect(false)
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
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold mb-4">Choices</h2>

      <div className="flex gap-2 items-center">
        <select
          className="border px-3 py-2 rounded"
          value={questionId}
          onChange={e => {
            setQuestionId(e.target.value)
            if (e.target.value) loadChoices(e.target.value)
          }}
        >
          <option value="">Select Question</option>
          {questions.map(q => (
            <option key={q.id} value={q.id}>
              {q.text}
            </option>
          ))}
        </select>

        <input
          className="border px-3 py-2 rounded flex-1"
          placeholder="Choice text"
          value={text}
          onChange={e => setText(e.target.value)}
        />

        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={correct}
            onChange={e => setCorrect(e.target.checked)}
          />
          Correct
        </label>

        <button
          onClick={save}
          className="bg-indigo-600 text-white px-4 py-2 rounded"
        >
          {editId ? 'Update' : 'Add'}
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
            <li key={c.id} className="p-3 flex justify-between">
              <span>
                {c.text}{' '}
                {c.is_correct && (
                  <span className="text-green-600 font-semibold">✔</span>
                )}
              </span>
              <span className="flex gap-2">
                <button
                  onClick={() => {
                    setEditId(c.id)
                    setText(c.text)
                    setCorrect(c.is_correct)
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
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}