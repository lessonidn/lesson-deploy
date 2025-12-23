import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import logo from '../asset/leaf.png'

/* ================= TYPES ================= */

type MenuSource = 'manual' | 'category' | 'sub_category'

type Category = {
  id: string
  name: string
  is_published: boolean
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

type Page = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  created_at: string
}

type Menu = {
  id: string
  label: string
  url: string | null
  position: 'header' | 'footer'
  parent_id: string | null
  order: number
  is_active: boolean
  source: MenuSource
  source_id: string | null
  auto_generate: boolean
  children?: Menu[]
}

/* ================= HELPERS ================= */

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
}

function buildMenuTree(menus: Menu[]) {
  const map = new Map<string, Menu>()
  const roots: Menu[] = []

  menus.forEach(m => map.set(m.id, { ...m, children: [] }))

  menus.forEach(m => {
    if (m.parent_id) {
      map.get(m.parent_id)?.children?.push(map.get(m.id)!)
    } else {
      roots.push(map.get(m.id)!)
    }
  })

  return roots
}

/* ================= COMPONENT ================= */

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([])
  const [subCategories, setSubCategories] = useState<SubCategory[]>([])
  const [examSets, setExamSets] = useState<ExamSet[]>([])
  const [latestExams, setLatestExams] = useState<ExamSet[]>([])
  const [latestPages, setLatestPages] = useState<Page[]>([])
  const [headerMenus, setHeaderMenus] = useState<Menu[]>([])
  const [footerMenus, setFooterMenus] = useState<Menu[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    setLoading(true)

    const [
      { data: cats },
      { data: subs },
      { data: exams },
      { data: latest },
      { data: menus },
      { data: pages },
    ] = await Promise.all([
      supabase
        .from('categories')
        .select('id, name, is_published')
        .eq('is_published', true)
        .order('name'),

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
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(10),

      supabase
        .from('menus')
        .select('*')
        .eq('is_active', true)
        .order('order'),

      supabase
        .from('pages')
        .select('id, title, slug, excerpt, created_at')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(3),
    ])

    if (!cats || !subs || !exams || !menus) {
      setError('Gagal load data')
      setLoading(false)
      return
    }

    setCategories(cats)
    setSubCategories(subs)
    setExamSets(exams)
    setLatestExams(latest || [])
    setLatestPages(pages || [])

    /* ===== RESOLVE AUTO MENU ===== */

    const resolved: Menu[] = []

    menus.forEach(menu => {
      if (menu.source === 'manual') {
        resolved.push(menu)
        return
      }

      if (menu.source === 'category') {
        resolved.push(menu)

        cats.forEach((c, i) => {
          resolved.push({
            id: `cat-${c.id}`,
            label: c.name,
            url: `/latihan/${slugify(c.name)}`,
            position: menu.position,
            parent_id: menu.id,
            order: i + 1,
            is_active: true,
            source: 'manual',
            source_id: c.id,
            auto_generate: false,
          })
        })
      }

      if (menu.source === 'sub_category') {
        resolved.push(menu)
        subs.forEach((s, i) => {
          resolved.push({
            id: `sub-${s.id}`,
            label: s.name,
            url: `/latihan/${slugify(s.name)}`,
            position: menu.position,
            parent_id: menu.id,
            order: i + 1,
            is_active: true,
            source: 'manual',
            source_id: s.id,
            auto_generate: false,
          })
        })
      }
    })

    setHeaderMenus(buildMenuTree(resolved.filter(m => m.position === 'header')))
    setFooterMenus(resolved.filter(m => m.position === 'footer'))


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

  /* ================= RENDER ================= */

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ================= HEADER ================= */}
      <header className="bg-blue-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-5 flex justify-between items-center">
          <div className="relative">
            <img src={logo} alt="lesson" className="absolute -top-5 right-7 h-6" />
            <h1 className="text-3xl font-bold">
              LES<span className="text-sky-200">SON</span>
            </h1>
            <p className="text-xs text-blue-100">The Best Choice Of Tutoring</p>
          </div>

          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
              {headerMenus.map(menu => (
                <div key={menu.id} className="relative group">
                  <Link to={menu.url || '#'} className="flex items-center gap-1 hover:text-sky-300">
                    {menu.label}
                    {menu.children?.length ? <span className="text-xs">▼</span> : null}
                  </Link>

                  {menu.children?.length ? (
                    <div className="absolute left-0 top-full mt-2 w-52 bg-white text-gray-800 rounded-xl shadow-lg
                                    opacity-0 invisible group-hover:opacity-100 group-hover:visible transition">
                      {menu.children.map(child => (
                        <Link
                          key={child.id}
                          to={child.url || '#'}
                          className="block px-4 py-2 hover:bg-blue-50 text-sm"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </nav>

            <div className="relative">
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari latihan / ujian..."
                className="border rounded-xl px-3 py-2 text-sm text-black w-48 pr-8"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ================= MAIN ================= */}
      <main className="max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-4 gap-10 flex-1">
        {/* CONTENT */}
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

        {/* SIDEBAR */}
        <aside className="space-y-6">
          {/* Latest Exams */}
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

          {/* Latest Pages */}
          <div className="bg-white rounded-xl p-4 border">
            <h4 className="font-semibold mb-3">Artikel Terbaru</h4>
            <ul className="space-y-3 text-sm">
              {latestPages.map(p => (
                <li key={p.id}>
                  <Link
                    to={`/blog/${p.slug}`}
                    className="font-medium hover:text-blue-600"
                  >
                    {p.title}
                  </Link>
                  {p.excerpt && (
                    <p className="text-xs text-gray-500 mt-1">
                      {p.excerpt}
                    </p>
                  )}
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
              {footerMenus.map(m => (
                <li key={m.id}>
                  <Link to={m.url || '#'} className="hover:text-white">
                    {m.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-2">Kontak</h4>
            <p className="text-sm">Email: lesson.idn@gmail.com</p>
            <p className="text-sm">Whatsapp: 0851 2222 9986</p>
          </div>
        </div>

        <div className="text-center text-xs text-gray-500 py-4 border-t border-gray-700">
          © {new Date().getFullYear()} LESSON. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
