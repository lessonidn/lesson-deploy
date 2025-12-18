import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import logo from '../../public/leaf.png'

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
        .eq('is_deleted', false)
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
    return <div className="min-h-screen flex items-center justify-center text-blue-500 font-medium">Loading…</div>
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <header className="bg-blue-600 text-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="relative inline-block">
            {/* Logo di atas huruf N */}
            <img
              src={logo}
              alt="Logo"
              className="absolute -top-6 left-[7rem] h-7 w-auto" // sesuaikan posisi dan ukuran
            />

            <h1 className="text-4xl font-bold text-gray-400 tracking-tight">
              LES<span className="text-sky-200">SON</span>
            </h1>
          </div>

          <p className="text-sm text-gray-100 mt-2">The Best Choice Of Tutoring</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10 space-y-10">
        {categories.map((cat) => {
          const catSubs = subCategories.filter(s => s.category_id === cat.id)
          if (catSubs.length === 0) return null

          return (
            <section key={cat.id}>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 border-l-4 border-blue-500 pl-3">
                {cat.name}
              </h2>

              <div className="space-y-6">
                {catSubs.map((sub) => {
                  const exams = examSets.filter(e => e.sub_category_id === sub.id)
                  if (exams.length === 0) return null

                  return (
                    <div key={sub.id}>
                      <h3 className="font-semibold text-blue-600 mb-2 text-lg">
                        {sub.name}
                      </h3>

                      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {exams.map(exam => (
                          <Link
                            key={exam.id}
                            to={`/exam/${exam.id}`}
                            className="p-4 rounded-xl bg-white border border-blue-100 hover:border-sky-400 hover:shadow transition"
                          >
                            <div className="font-semibold text-gray-800">{exam.title}</div>
                            <div className="text-sm text-sky-700 mt-1 font-medium">
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