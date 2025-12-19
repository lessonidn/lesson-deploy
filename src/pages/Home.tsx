import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import logo from '../asset/leaf.png'

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
  created_at: string
}

type Menu = {
  id: string
  label: string
  url: string
  position: 'header' | 'footer'
}

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([])
  const [subCategories, setSubCategories] = useState<SubCategory[]>([])
  const [examSets, setExamSets] = useState<ExamSet[]>([])
  const [latestExams, setLatestExams] = useState<ExamSet[]>([])
  const [menus, setMenus] = useState<Menu[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    setLoading(true)

    const [
      { data: cats, error: catErr },
      { data: subs, error: subErr },
      { data: exams, error: examErr },
      { data: latest },
      { data: menuData }
    ] = await Promise.all([
      supabase.from('categories').select('id, name').order('name'),
      supabase.from('sub_categories').select('id, name, category_id').order('name'),
      supabase
        .from('exam_sets')
        .select('id, title, sub_category_id, created_at')
        .eq('is_published', true)
        .eq('is_deleted', false),
      supabase
        .from('exam_sets')
        .select('id, title, sub_category_id, created_at')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('menus')
        .select('id, label, url, position')
        .eq('is_active', true)
        .order('order')
    ])

    if (catErr || subErr || examErr) {
      setError('Gagal load data')
    } else {
      setCategories(cats || [])
      setSubCategories(subs || [])
      setExamSets(exams || [])
      setLatestExams(latest || [])
      setMenus(menuData || [])
    }

    setLoading(false)
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading…</div>
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>
  }

  const filteredExams = examSets.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ================= HEADER ================= */}
      <header className="bg-blue-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-7 flex justify-between items-center">
          <div className="relative">
            <img src={logo} alt="lesson" className="absolute -top-5 right-7 h-6" />
            <h1 className="text-3xl font-bold">
              LES<span className="text-sky-200">SON</span>
            </h1>
            <p className="text-xs text-blue-100">The Best Choice Of Tutoring</p>
          </div>

          <nav className="flex gap-6 text-sm font-medium">
            {menus
              .filter(m => m.position === 'header')
              .map(m => (
                <Link key={m.id} to={m.url} className="hover:text-sky-200">
                  {m.label}
                </Link>
              ))}
          </nav>
        </div>
      </header>

      {/* ================= SEARCH ================= */}
      <div className="max-w-6xl mx-auto px-4 mt-6">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari latihan / ujian..."
          className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {/* ================= MAIN ================= */}
      <main className="max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-4 gap-10 flex-1">
        {/* ===== CONTENT ===== */}
        <div className="md:col-span-3 space-y-10">
          {categories.map(cat => {
            const catSubs = subCategories.filter(s => s.category_id === cat.id)
            if (!catSubs.length) return null

            return (
              <section key={cat.id}>
                <h2 className="text-xl font-semibold border-l-4 border-blue-500 pl-3 mb-4">
                  {cat.name}
                </h2>

                {catSubs.map(sub => {
                  const exams = filteredExams.filter(e => e.sub_category_id === sub.id)
                  if (!exams.length) return null

                  return (
                    <div key={sub.id} className="mb-6">
                      <h3 className="font-semibold text-blue-600 mb-3">{sub.name}</h3>

                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {exams.map(exam => (
                          <Link
                            key={exam.id}
                            to={`/exam/${exam.id}`}
                            className="p-4 bg-white rounded-xl border hover:shadow"
                          >
                            <div className="font-medium">{exam.title}</div>
                            <div className="text-xs text-blue-600 mt-2">Mulai →</div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </section>
            )
          })}
        </div>

        {/* ===== SIDEBAR (WORDPRESS STYLE) ===== */}
        <aside className="space-y-6">
          <div className="bg-white rounded-xl p-4 border">
            <h4 className="font-semibold mb-3">Latihan Terbaru</h4>
            <ul className="space-y-2 text-sm">
              {latestExams.map(e => (
                <li key={e.id}>
                  <Link to={`/exam/${e.id}`} className="hover:text-blue-600">
                    {e.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-bold text-white mb-2">LESSON</h3>
            <p className="text-sm">
              Platform latihan online untuk persiapan ujian secara modern dan terstruktur.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-2">Menu</h4>
            <ul className="space-y-2 text-sm">
              {menus
                .filter(m => m.position === 'footer')
                .map(m => (
                  <li key={m.id}>
                    <Link to={m.url} className="hover:text-white">
                      {m.label}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-2">Kontak</h4>
            <p className="text-sm">Email: admin@lesson.id</p>
          </div>
        </div>

        <div className="text-center text-xs text-gray-500 py-4 border-t border-gray-700">
          © {new Date().getFullYear()} LESSON. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
