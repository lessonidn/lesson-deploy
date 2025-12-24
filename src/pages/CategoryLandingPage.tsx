import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import logo from '../asset/leaf.png'

/* ================= TYPES ================= */

type MenuSource = 'manual' | 'category' | 'sub_category'

type Category = {
  id: string
  name: string
  slug: string
  description: string | null
  banner_image: string | null
}

type SubCategory = {
  id: string
  name: string
  category_id: string
  is_deleted?: boolean
}

type ExamSet = {
  id: string
  title: string
  sub_category_id: string
  is_deleted?: boolean
}

type Page = {
  id: string
  title: string
  slug: string
  excerpt: string | null
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
  return text.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
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

export default function CategoryLandingPage() {
  const { slug } = useParams()

  const [category, setCategory] = useState<Category | null>(null)
  const [subCategories, setSubCategories] = useState<SubCategory[]>([])
  const [examSets, setExamSets] = useState<ExamSet[]>([])
  const [latestExams, setLatestExams] = useState<ExamSet[]>([])
  const [latestPages, setLatestPages] = useState<Page[]>([])
  const [headerMenus, setHeaderMenus] = useState<Menu[]>([])
  const [footerMenus, setFooterMenus] = useState<Menu[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAll()
  }, [slug])

  async function loadAll() {
    setLoading(true)
    setSubCategories([])
    setExamSets([])
    setLatestExams([])
    setLatestPages([])

    /* ===== CATEGORY ===== */
    const { data: cat } = await supabase
      .from('categories')
      .select('id, name, slug, description, banner_image')
      .eq('slug', slug)
      .eq('is_published', true)
      .eq('is_deleted', false)
      .single()

    if (!cat) {
      setLoading(false)
      return
    }

    const [
        { data: subs },
        { data: exams },
        { data: latest },
        { data: menus },
        { data: pages },
        ] = await Promise.all([
        supabase
            .from('sub_categories')
            .select('id, name, category_id, is_published, is_deleted')
            .eq('category_id', cat.id)
            .eq('is_deleted', false)   // filter sub kategori yang belum dihapus
            .order('order_index'),

        supabase
            .from('exam_sets')
            .select('id, title, sub_category_id, is_published, is_deleted')
            .eq('is_published', true)
            .eq('is_deleted', false),  // filter exam set yang belum dihapus

        supabase
            .from('exam_sets')
            .select('id, title, sub_category_id, is_published, is_deleted')
            .eq('is_published', true)
            .eq('is_deleted', false)   // filter exam set terbaru
            .order('created_at', { ascending: false })
            .limit(10),

        supabase
            .from('menus')
            .select('*')
            .eq('is_active', true)
            .order('order_index'),

        supabase
            .from('pages')
            .select('id, title, slug, excerpt')
            .eq('status', 'published')
            .order('created_at', { ascending: false })
            .limit(3),
        ])

    /* ===== MENU RESOLVE ===== */
    const resolved: Menu[] = []

    menus?.forEach(menu => {
      if (menu.source === 'manual') {
        resolved.push(menu)
        return
      }

      if (menu.source === 'category') {
        resolved.push(menu)
        resolved.push({
          id: `cat-${cat.id}`,
          label: cat.name,
          url: `/category/${cat.slug}`,
          position: menu.position,
          parent_id: menu.id,
          order: 1,
          is_active: true,
          source: 'manual',
          source_id: cat.id,
          auto_generate: false,
        })
      }

      if (menu.source === 'sub_category') {
        resolved.push(menu)
        subs?.forEach((s, i) => {
          resolved.push({
            id: `sub-${s.id}`,
            label: s.name,
            url: `/category/${cat.slug}#${slugify(s.name)}`,
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

    setCategory(cat)
    setSubCategories(subs || [])
    setExamSets(exams || [])
    setLatestExams(latest || [])
    setLatestPages(pages || [])
    setHeaderMenus(buildMenuTree(resolved.filter(m => m.position === 'header')))
    setFooterMenus(resolved.filter(m => m.position === 'footer'))

    setLoading(false)
  }

  if (loading || !category) {
    return <div className="min-h-screen flex items-center justify-center">Loading…</div>
  }


  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
    {/* ===== SEO Breadcrumb Schema ===== */}
    <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{
        __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": window.location.origin + "/"
            },
            {
            "@type": "ListItem",
            "position": 2,
            "name": "Kategori",
            "item": window.location.origin + "/category"
            },
            {
            "@type": "ListItem",
            "position": 3,
            "name": category.name,
            "item": window.location.href
            }
        ]
        })
    }}
    />

      {/* HEADER */}
      <header className="bg-blue-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-5 flex justify-between items-center">
          <div className="relative">
            <img src={logo} alt="lesson" className="absolute -top-5 right-7 h-6" />
            <h1 className="text-3xl font-bold">
              LES<span className="text-sky-200">SON</span>
            </h1>
            <p className="text-xs text-blue-100">The Best Choice Of Tutoring</p>
          </div>

          <nav className="hidden md:flex gap-6 text-sm font-medium">
            {headerMenus.map(m => (
              <Link key={m.id} to={m.url || '#'} className="hover:text-sky-300">
                {m.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* HERO */}
      {category.banner_image && (
        <div className="max-w-6xl mx-auto px-4 mt-8">
          <div className="h-[360px] rounded-xl overflow-hidden">
            <img
              src={category.banner_image}
              alt={category.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* ================= BREADCRUMB ================= */}
      <div className="max-w-6xl mx-auto px-4 mt-6">
        {/* ===== Breadcrumb ===== */}
        <nav className="max-w-6xl mx-auto px-4 mt-6 text-sm text-gray-500">
        <ol className="flex items-center gap-2">
            <li>
            <Link to="/" className="hover:text-blue-600">
                Home
            </Link>
            </li>

            <li>›</li>

            <li>
            <Link to="/category" className="hover:text-blue-600">
                Kategori
            </Link>
            </li>

            <li>›</li>

            <li className="text-gray-800 font-medium">
            {category.name}
            </li>
        </ol>
        </nav>
      </div>

      {/* CONTENT */}
      <main className="max-w-6xl mx-auto px-4 py-8 grid md:grid-cols-4 gap-10 flex-1">
        <div className="md:col-span-3 space-y-10">
          <div>
            <h2 className="text-3xl font-bold mb-2">{category.name}</h2>
            {category.description && (
              <p className="text-gray-600 max-w-2xl">{category.description}</p>
            )}
          </div>

          {subCategories
            .filter(sub => !sub.is_deleted) // ✅ filter client-side
            .map(sub => {
                const exams = examSets.filter(e => e.sub_category_id === sub.id && !e.is_deleted)
                if (!exams.length) return null

            return (
              <section key={sub.id} id={slugify(sub.name)}>
                <h3 className="text-lg font-semibold text-blue-600 mb-3">
                  {sub.name}
                </h3>

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
              </section>
            )
          })}
        </div>

        {/* SIDEBAR */}
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

          <div className="bg-white rounded-xl p-4 border">
            <h4 className="font-semibold mb-3">Artikel Terbaru</h4>
            <ul className="space-y-3 text-sm">
              {latestPages.map(p => (
                <li key={p.id}>
                  <Link to={`/blog/${p.slug}`} className="font-medium hover:text-blue-600">
                    {p.title}
                  </Link>
                  {p.excerpt && (
                    <p className="text-xs text-gray-500 mt-1">{p.excerpt}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </main>

      {/* FOOTER */}
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
        </div>
        </footer>
    </div>
  )
}
