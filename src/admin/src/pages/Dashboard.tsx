import { useEffect, useState } from 'react'
import {
  getCategories,
  getSubCategories,
  getExamSets,
  getQuestions,
} from '../lib/quizApi'

export default function Dashboard() {
  const [catCount, setCatCount] = useState(0)
  const [subCount, setSubCount] = useState(0)
  const [examCount, setExamCount] = useState(0)
  const [questionCount, setQuestionCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: cats, error: catErr } = await getCategories()
      const { data: subs, error: subErr } = await getSubCategories()
      const { data: exams, error: examErr } = await getExamSets()
      const { data: questions, error: qErr } = await getQuestions()

      if (catErr || subErr || examErr || qErr) {
        setError(catErr?.message || subErr?.message || examErr?.message || qErr?.message || 'Gagal memuat data')
      } else {
        setCatCount(cats?.length || 0)
        setSubCount(subs?.length || 0)
        setExamCount(exams?.length || 0)
        setQuestionCount(questions?.length || 0)
      }
    }
    load()
  }, [])

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Overview</h2>

      {error && <p className="text-red-500">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Categories" value={catCount.toString()} />
        <StatCard title="Sub Categories" value={subCount.toString()} />
        <StatCard title="Exam Sets" value={examCount.toString()} />
        <StatCard title="Questions" value={questionCount.toString()} />
      </div>
    </div>
  )
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white rounded border p-4">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  )
}