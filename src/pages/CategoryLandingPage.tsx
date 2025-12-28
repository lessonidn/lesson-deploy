import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import logo from '../asset/leaf.png'
import { Helmet } from 'react-helmet-async'
import {
  Facebook,
  Instagram,
  Youtube,
  Music,
  LucideIcon
} from 'lucide-react'

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
}

type ExamSet = {
  id: string
  title: string
  sub_category_id: string
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

type SocialLink = {
  id: string
  platform: string
  url: string
  icon: string
  is_active: boolean
  order_index: number
}

const SOCIAL_ICONS: Record<string, LucideIcon> = {
  facebook: Facebook,
  instagram: Instagram,
  youtube: Youtube,
  tiktok: Music,
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

export default function CategoryLandingPage() {
  const { slug } = useParams<{ slug: string }>()

  const [category, setCategory] = useState<Category | null>(null)
  const [subCategories, setSubCategories] = useState<SubCategory[]>([])
  const [examSets, setExamSets] = useState<ExamSet[]>([])
  const [latestExams, setLatestExams] = useState<ExamSet[]>([])
  const [latestPages, setLatestPages] = useState<Page[]>([])
  const [headerMenus, setHeaderMenus] = useState<Menu[]>([])
  const [footerMenus, setFooterMenus] = useState<Menu[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([])

  useEffect(() => {
    if (!slug) return
    loadAll(slug)
  }, [slug])

  async function loadAll(slug: string) {
    setLoading(true)

    /* ===== CATEGORY ===== */
    const { data: cat } = await supabase
      .from('categories')
      .select('id, name, slug, description, banner_image')
      .eq('slug', slug)
      .eq('is_published', true)
      .eq('is_deleted', false)
      .maybeSingle()

    if (!cat) {
      setLoading(false)
      return
    }

    /* ===== SUB CATEGORIES ===== */
    const { data: subs } = await supabase
      .from('sub_categories')
      .select('id, name, category_id')
      .eq('category_id', cat.id)
      .eq('is_published', true)
      .eq('is_deleted', false)
      .order('name')

    const subIds = subs?.map(s => s.id) ?? []

    /* ===== PARALLEL LOAD ===== */
    const [
      { data: exams },
      { data: latest },
      { data: menus },
      { data: pages },
      { data: socialLinks },
    ] = await Promise.all([
      supabase
        .from('exam_sets')
        .select('id, title, sub_category_id')
        .in('sub_category_id', subIds)
        .eq('is_published', true)
        .eq('is_deleted', false),

      supabase
        .from('exam_sets')
        .select('id, title, sub_category_id')
        .eq('is_published', true)
        .eq('is_deleted', false)
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

      supabase
        .from('social_links')
        .select('*')
        .eq('is_active', true)
        .order('order_index'),
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
          url: `/latihan/${cat.slug}`,
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
            url: `/latihan/${cat.slug}#${slugify(s.name)}`,
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
    setSocialLinks(socialLinks || [])
  }

  if (loading || !category) {
    return <div className="min-h-screen flex items-center justify-center">Loading…</div>
  }

  const siteUrl = window.location.origin

  const pageTitle = `${category.name} | Latihan & Soal Online - LESSON`
  const pageDescription =
    category.description ||
    `Latihan dan kumpulan soal ${category.name} lengkap dengan pembahasan. Cocok untuk persiapan ujian.`


  return (
    <>
      <Helmet>
        {/* BASIC SEO */}
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={`${siteUrl}/category/${category.slug}`} />

        {/* OPEN GRAPH */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={`${siteUrl}/category/${category.slug}`} />
        {category.banner_image && (
          <meta property="og:image" content={category.banner_image} />
        )}

        {/* ================= BREADCRUMB SCHEMA ================= */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: siteUrl,
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Kategori",
                item: `${siteUrl}/category`,
              },
              {
                "@type": "ListItem",
                position: 3,
                name: category.name,
                item: `${siteUrl}/category/${category.slug}`,
              },
            ],
          })}
        </script>

        {/* ================= COLLECTION PAGE SCHEMA ================= */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: category.name,
            description: pageDescription,
            url: `${siteUrl}/category/${category.slug}`,
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="relative bg-blue-600 text-white z-40">
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
                    {/* Parent menu: pakai button kalau hanya pemicu dropdown */}
                    {menu.children?.length ? (
                      <button
                        type="button"
                        className="flex items-center gap-1 hover:text-sky-300"
                      >
                        {menu.label}
                        <span className="text-xs">▼</span>
                      </button>
                    ) : (
                      <Link
                        to={menu.url || '#'}
                        className="flex items-center gap-1 hover:text-sky-300"
                      >
                        {menu.label}
                      </Link>
                    )}

                    {menu.children?.length ? (
                      <div
                        className="absolute left-0 top-full mt-0 bg-white text-gray-800 rounded-xl shadow-lg
                                  hidden group-hover:block hover:block z-50 w-auto min-w-max"
                      >
                        {menu.children.map(child => (
                          <Link
                            key={child.id}
                            to={child.url || '#'}
                            className="block px-4 py-2 hover:bg-blue-50 text-sm whitespace-nowrap"
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

        {/* CONTENT */}
        <main className="max-w-6xl mx-auto px-4 py-8 grid md:grid-cols-4 gap-10 flex-1">
          <div className="md:col-span-3 space-y-10">
            <h1 className="text-3xl font-bold mb-2">{category.name}</h1>

            {category.description && (
              <p className="text-gray-600 max-w-2xl mb-8">
                {category.description}
              </p>
            )}

            {subCategories.map(sub => {
              const exams = examSets.filter(e => e.sub_category_id === sub.id)
              if (!exams.length) return null

              return (
                <section key={sub.id} id={slugify(sub.name)}>
                  <h2 className="text-lg font-semibold text-blue-600 mb-3">
                    {sub.name}
                  </h2>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {exams.map(exam => (
                      <Link
                        key={exam.id}
                        to={`/exam/${exam.id}`}
                        className="p-4 bg-white rounded-xl border hover:shadow"
                      >
                        {exam.title}
                      </Link>
                    ))}
                  </div>
                </section>
              )
            })}
              <div className="mt-10 text-sm text-gray-500">
              <Link to="/blog" className="hover:text-blue-600">
                Baca artikel kami →
              </Link>
            </div>
          </div>

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
            {/* BRAND */}
            <div>
              <h3 className="font-bold text-white mb-2">LESSON</h3>
              <p className="text-sm">
                Platform latihan online untuk persiapan ujian secara modern dan terstruktur.
              </p>
            </div>

            {/* MENU */}
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

            {/* KONTAK */}
            <div>
              <h4 className="font-semibold text-white mb-2">Kontak</h4>
              <p className="text-sm">Email: lesson.idn@gmail.com</p>
              <p className="text-sm">Whatsapp: 0851 2222 9986</p>

              {/* Tambahkan margin agar tidak mepet */}
              <h4 className="font-semibold text-white mt-6 mb-2">Sosial Media</h4>

              {/* SOCIAL ICONS */}
              {socialLinks.length > 0 && (
                <div className="flex gap-3 mt-2">
                  {socialLinks.map(s => {
                    const Icon = SOCIAL_ICONS[s.icon]
                    if (!Icon) return null

                    return (
                      <a
                        key={s.id}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-full bg-gray-800 hover:bg-blue-600 transition"
                        aria-label={s.platform}
                      >
                        <Icon size={16} />
                      </a>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="text-center text-xs text-gray-500 py-4 border-t border-gray-700">
            © {new Date().getFullYear()} LESSON. All rights reserved.
          </div>
        </footer>
      </div>
    </>
  )
}
