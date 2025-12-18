import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

type Category = {
  id: string
  name: string
}

type SubCategory = {
  id: string
  name: string
  category_id: string
}

type ExamSet = {
  id: string
  title: string
  sub_category_id: string
}

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([])
  const [subCategories, setSubCategories] = useState<SubCategory[]>([])
  const [examSets, setExamSets] = useState<ExamSet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    setLoading(true)
    setError(null)

    const [{ data: cats, error: catErr },
           { data: subs, error: subErr },
           { data: exams, error: examErr }] = await Promise.all([
      supabase.from('categories').select('id, name').order('name'),
      supabase.from('sub_categories').select('id, name, category_id').order('name'),
      supabase
        .from('exam_sets')
        .select('id, title, sub_category_id')
        .eq('is_published', true)
        .eq('is_deleted', false)  // exclude yang sudah soft delete
        .order('created_at')
    ])

    if (catErr || subErr || examErr) {
      setError(catErr?.message || subErr?.message || examErr?.message || 'Gagal load data')
    } else {
      setCategories(cats || [])
      setSubCategories(subs || [])
      setExamSets(exams || [])
    }

    setLoading(false)
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading…</div>
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-pink-50">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-indigo-600">Lesson.Idn</h1>
          <p className="text-gray-600">Selamat datang di bimbel online</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        {categories.map((cat) => {
          const catSubs = subCategories.filter(s => s.category_id === cat.id)
          if (catSubs.length === 0) return null

          return (
            <section key={cat.id}>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                {cat.name}
              </h2>

              <div className="space-y-6">
                {catSubs.map((sub) => {
                  const exams = examSets.filter(e => e.sub_category_id === sub.id)
                  if (exams.length === 0) return null

                  return (
                    <div key={sub.id}>
                      <h3 className="font-medium text-indigo-600 mb-2">
                        {sub.name}
                      </h3>

                      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {exams.map(exam => (
                          <Link
                            key={exam.id}
                            to={`/exam/${exam.id}`}
                            className="p-4 rounded-lg bg-white border hover:shadow-md hover:border-indigo-400 transition"
                          >
                            <div className="font-semibold">{exam.title}</div>
                            <div className="text-sm text-gray-500 mt-1">
                              Mulai latihan →
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}
      </main>
    </div>
  )
}
