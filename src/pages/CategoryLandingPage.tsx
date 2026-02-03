import { useEffect, useState, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import logo from '../../public/leaf.png'
import { Helmet } from 'react-helmet-async'
import {
  Facebook,
  Instagram,
  Youtube,
  Music,
  LucideIcon
} from 'lucide-react'
import RequestSoalWA from '../components/RequestSoalWA'

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
  is_member_only: boolean
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

function getClassNumber(name: string): number {
  const match = name.match(/\d+/)
  return match ? Number(match[0]) : 0
}


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
  const [scrolled, setScrolled] = useState(false)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const { session, profile, logout } = useAuth()

  const isMemberActive = profile?.membership_status === 'active'

  const [pageResults, setPageResults] = useState<Page[]>([])
  const [searchResults, setSearchResults] = useState<ExamSet[]>([])
  const searchResultRef = useRef<HTMLDivElement | null>(null)
  const [activeLatestId, setActiveLatestId] = useState<string | null>(null)

  // BLOK PENCARIAN
  function splitKeywords(q: string) {
    return q
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean)
  }

  const hasExamResults = searchResults.length > 0
  const hasPageResults = pageResults.length > 0
  const hasAnyResults = hasExamResults || hasPageResults

  function handleSearch() {
    const keywords = splitKeywords(search)

    if (keywords.length === 0) {
      setSearchResults([])
      setPageResults([])
      return
    }

    const examResults = examSets.filter(e => {
      const sub = subCategories.find(s => s.id === e.sub_category_id)

      const haystack = [
        e.title,
        sub?.name || '',
      ].join(' ').toLowerCase()

      return keywords.every(k => haystack.includes(k))
    })

    const articleResults = latestPages.filter(p => {
      const haystack = [
        p.title,
        p.excerpt || '',
      ].join(' ').toLowerCase()

      return keywords.every(k => haystack.includes(k))
    })

    setSearchResults(examResults)
    setPageResults(articleResults)

    // scroll tetap sama
    setTimeout(() => {
      if (!searchResultRef.current) return

      const y =
        searchResultRef.current.getBoundingClientRect().top +
        window.scrollY -
        HEADER_OFFSET

      window.scrollTo({ top: y, behavior: 'smooth' })
    }, 50)
  }

  const HEADER_OFFSET = 140

  // Header scroll effect
    useEffect(() => {
      const onScroll = () => {
        setScrolled(window.scrollY > 20)
      }
      window.addEventListener('scroll', onScroll)
      return () => window.removeEventListener('scroll', onScroll)
    }, [])

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
        .select('id, title, sub_category_id, is_member_only')
        .in('sub_category_id', subIds)
        .eq('is_published', true)
        .eq('is_deleted', false),
        

      supabase
        .from('exam_sets')
        .select('id, title, sub_category_id, is_member_only')
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
        .limit(10),

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
    setSubCategories(
      (subs || []).sort(
        (a, b) => getClassNumber(a.name) - getClassNumber(b.name)
      )
    )
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
        <header
          className={`
            fixed top-0 left-0 w-full z-50
            transition-all duration-300
            ${scrolled
              ? 'backdrop-blur-md bg-black/70 shadow-lg'
              : 'bg-transparent'}
          `}
        >
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black" />

          {/* Motif karbon */}
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage: `
                repeating-linear-gradient(
                  45deg,
                  rgba(255,255,255,0.15) 0,
                  rgba(255,255,255,0.15) 1px,
                  transparent 1px,
                  transparent 6px
                )
              `,
            }}
          />

          {/* Content */}
          <div className="relative max-w-6xl mx-auto px-4 py-5 flex justify-between items-center text-white">
            <div className="relative">
              <Link to="/" className="inline-block">
                <h1 className="text-3xl font-extrabold tracking-wide flex items-center gap-0 mt-3">
                  <span className="text-white drop-shadow">LES</span>
                  <span className="text-sky-400 glow-son relative">
                    SON
                    <img
                      src={logo}
                      alt="logo daun"
                      className="absolute -top-6 -right-3 h-7"
                    />
                  </span>
                </h1>
              </Link>
              <p className="text-xs text-gray-300 tracking-wide">
                The Best Choice Of Tutoring
              </p>
            </div>

            <div className="flex items-center gap-6">
              <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                {headerMenus.map(menu => (
                  <div key={menu.id} className="relative group z-50">
                    {/* Parent menu: pakai button kalau hanya pemicu dropdown */}
                    {menu.children?.length ? (
                      <button
                        type="button"
                        className="flex items-center gap-1 hover:text-sky-400 transition"
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
                        className="
                          z-[9999] absolute left-0 top-full mt-0
                          bg-black/40 backdrop-blur-md
                          rounded
                          hidden group-hover:block
                          w-auto min-w-max
                          border border-white/10
                          shadow-xl
                        "
                      >

                        {menu.children.map(child => (
                          <Link
                            key={child.id}
                            to={child.url || '#'}
                            className="
                              block px-4 py-2
                              text-sm text-white/90 whitespace-nowrap
                              hover:bg-white/10
                              hover:text-sky-300
                              transition
                              border-b border-white/10 last:border-none
                            "
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </nav>

              {/* CTA / ACCOUNT */}
              <div className="hidden md:flex items-center gap-3 relative">
                {!session && (
                  <>
                    <Link
                      to="/login"
                      className="bg-sky-500 hover:bg-sky-400 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                    >
                      Member Area
                    </Link>
                  </>
                )}

                {session && profile && (
                  <div className="relative group">
                    <button
                      className="
                        flex items-center gap-2
                        bg-black/40 backdrop-blur
                        border border-white/20
                        px-3 py-2 rounded-lg
                        text-sm font-medium
                        hover:border-sky-400
                        transition
                      "
                    >
                      👤 {profile.full_name ?? 'Member'}
                    </button>

                    {/* Invisible hover bridge */}
                    <div className="absolute top-full left-0 w-full h-2 bg-transparent" />

                    <div
                      className="
                        absolute right-0 mt-2 w-48
                        bg-black/80 backdrop-blur-md
                        border border-white/10
                        rounded-lg shadow-xl
                        hidden group-hover:block group-focus-within:block
                        overflow-hidden
                        z-50
                      "
                    >
                      <Link
                        to="/mydashboard"
                        className="block px-4 py-2 text-sm hover:bg-white/10"
                      >
                        Dashboard
                      </Link>

                      {profile.membership_status !== 'active' && (
                        <Link
                          to="/upgrade"
                          className="block px-4 py-2 text-sm hover:bg-white/10 text-sky-400"
                        >
                          Upgrade Member
                        </Link>
                      )}

                      <button
                        onClick={async () => {
                          await logout()
                          window.location.href = '/'
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-white/10 text-red-400"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col max-w-xs md:max-w-none gap-2">
              {/* Search */}
              <div className="relative w-full">
                <form
                  onSubmit={e => {
                    e.preventDefault()
                    handleSearch()
                  }}
                >
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Cari latihan / ujian / kelas..."
                    className="border border-gray-600 bg-gray-900 text-white rounded-xl px-3 py-2 text-sm w-full pr-8 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-sky-400"
                  >
                    🔍
                  </button>
                </form>
              </div>

              {/* Navbar di bawah search, horizontal & kecil */}
              <nav className="relative flex flex-row justify-end gap-3 w-full text-xs font-medium md:hidden">
                {headerMenus.map(menu => (
                  <div key={menu.id} className="relative overflow-visible">
                    {menu.children && menu.children.length > 0 ? (
                      <button
                        onClick={() =>
                          setOpenMenu(openMenu === menu.id ? null : menu.id)
                        }
                        className="text-white hover:text-sky-400 whitespace-nowrap flex items-center gap-1"
                      >
                        {menu.label}
                        <span className="text-[10px]">
                          {openMenu === menu.id ? '▲' : '▼'}
                        </span>
                      </button>
                    ) : (
                      <Link
                        to={menu.url || '#'}
                        className="text-white hover:text-sky-400 whitespace-nowrap"
                      >
                        {menu.label}
                      </Link>
                    )}

                    {menu.children && menu.children.length > 0 && (
                      <div
                        className={`absolute top-full left-0 mt-2 min-w-[8rem] bg-gray-800 rounded-md shadow-lg p-2 flex flex-col gap-1 z-50 transition-all duration-200 ${
                          openMenu === menu.id ? 'opacity-100 visible' : 'opacity-0 invisible'
                        }`}
                      >
                        {menu.children.map(child => (
                          <Link
                            key={child.id}
                            to={child.url || '#'}
                            className="text-gray-300 hover:text-sky-400 text-[11px] whitespace-nowrap px-2 py-1 rounded"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </header>

        {/* CONTENT */}
        <main className="max-w-6xl mx-auto px-4 py-10 pt-32 grid md:grid-cols-4 gap-10 flex-1">
          <div className="md:col-span-3 space-y-10">
            {search ? (
              <section ref={searchResultRef}>
                <h2 className="text-xl font-bold mb-4">
                  🔍 Hasil Pencarian: "{search}"
                </h2>

                {/* === HASIL LATIHAN === */}
                {hasExamResults && (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {searchResults.map(exam => (
                      <Link
                        key={exam.id}
                        to={`/exam/${exam.id}`}
                        className="p-5 rounded-2xl border bg-white hover:shadow-lg"
                      >
                        <div className="font-semibold text-gray-800">
                          {exam.title}
                        </div>
                        <div className="text-xs text-blue-600 mt-2">
                          Kerjakan Sekarang →
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* === HASIL ARTIKEL === */}
                {hasPageResults && (
                  <>
                    <h3 className="mt-8 font-semibold text-lg">
                      📄 Artikel Terkait
                    </h3>
                    <ul className="mt-3 space-y-2">
                      {pageResults.map(p => (
                        <li key={p.id}>
                          <Link
                            to={`/blog/${p.slug}`}
                            className="text-blue-600 hover:underline"
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
                  </>
                )}

                {/* === TIDAK ADA HASIL SAMA SEKALI === */}
                {!hasAnyResults && (
                  <p className="text-gray-500 italic">
                    Tidak ditemukan hasil untuk "{search}"
                  </p>
                )}
              </section>
            ) : (
              <>
                {/* ===== KONTEN NORMAL CATEGORY ===== */}
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
                        {exams.map(exam => {
                          const isMemberOnly = exam.is_member_only
                          const isLocked = isMemberOnly && !isMemberActive

                          // Exam publik → selalu bisa diakses
                          if (!isMemberOnly) {
                            return (
                              <Link
                                key={exam.id}
                                to={`/exam/${exam.id}`}
                                className="
                                  relative p-5 rounded-2xl border
                                  transition hover:shadow-lg hover:-translate-y-1
                                  bg-white
                                "
                              >
                                <div className="w-8 h-8 rounded-full flex items-center justify-center mb-3 bg-blue-100 text-blue-600">
                                  ✏️
                                </div>
                                <div className="font-semibold text-gray-800 leading-snug">
                                  {exam.title}
                                </div>
                                <div className="mt-2 text-xs text-blue-600">
                                  Kerjakan Sekarang →
                                </div>
                              </Link>
                            )
                          }

                          // Exam member-only tapi user belum aktif → teaser yang bisa diklik ke /upgrade
                          if (isLocked) {
                            return (
                              <Link
                                key={exam.id}
                                to="/upgrade"
                                className="
                                  relative p-5 rounded-2xl border
                                  transition hover:shadow-lg hover:-translate-y-1
                                  bg-gradient-to-br from-purple-50 to-white border-purple-300
                                "
                              >
                                <div className="absolute top-3 right-3 bg-purple-600 text-white text-[10px] font-semibold px-2 py-1 rounded-full tracking-wide">
                                  KHUSUS MEMBER
                                </div>
                                <div className="w-8 h-8 rounded-full flex items-center justify-center mb-3 bg-purple-100 text-purple-600">
                                  ✏️
                                </div>
                                <div className="font-semibold text-gray-800 leading-snug">
                                  {exam.title}
                                </div>
                                <div className="mt-2 text-sm text-gray-600">
                                  Latihan eksklusif dengan pembahasan lengkap
                                </div>
                                <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-purple-700">
                                  🔒 Login / Upgrade untuk akses penuh →
                                </div>
                                <div className="absolute inset-0 rounded-2xl bg-purple-500/5 pointer-events-none" />
                              </Link>
                            )
                          }

                          // Exam member-only → member aktif dapat Link penuh
                          return (
                            <Link
                              key={exam.id}
                              to={`/exam/${exam.id}`}
                              className="
                                relative p-5 rounded-2xl border
                                transition hover:shadow-lg hover:-translate-y-1
                                bg-gradient-to-br from-purple-50 to-white border-purple-300
                              "
                            >
                              <div className="absolute top-3 right-3 bg-purple-600 text-white text-[10px] font-semibold px-2 py-1 rounded-full tracking-wide">
                                KHUSUS MEMBER
                              </div>
                              <div className="w-8 h-8 rounded-full flex items-center justify-center mb-3 bg-purple-100 text-purple-600">
                                ✏️
                              </div>
                              <div className="font-semibold text-gray-800 leading-snug">
                                {exam.title}
                              </div>
                              <div className="mt-2 text-sm text-gray-600">
                                Latihan eksklusif dengan pembahasan lengkap
                              </div>
                              <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-green-700">
                                ✅ Akses terbuka untuk Member
                              </div>
                            </Link>
                          )
                        })}
                      </div>

                    </section>
                  )
                })}
                <RequestSoalWA />
              </>
              )}
              <div className="mt-10 text-sm text-gray-500">
              <Link to="/blog" className="hover:text-blue-600">
                Baca artikel kami →
              </Link>
            </div>
          </div>

          <aside className="space-y-6">
            {/* Latest Exams */}
            <div
              className="
                bg-white/90 backdrop-blur
                rounded-2xl p-4
                border border-gray-200
                shadow-sm
              "
            >
              <h4 className="font-semibold mb-3 border-b pb-2">
                Latihan Terbaru
              </h4>
              <ul className="space-y-3 text-sm select-none">
                {latestExams.map((e, index) => {
                  const gradients = [
                    'from-purple-500 to-fuchsia-500',
                    'from-blue-500 to-cyan-500',
                    'from-emerald-500 to-lime-500',
                    'from-orange-500 to-amber-500',
                    'from-pink-500 to-rose-500',
                    'from-indigo-500 to-violet-500',
                    'from-teal-500 to-emerald-500',
                    'from-red-500 to-orange-500',
                    'from-sky-500 to-blue-600',
                    'from-yellow-400 to-orange-500',
                  ]

                  const gradient = gradients[index % gradients.length]
                  const isActive = activeLatestId === e.id

                  return (
                    <li
                      key={e.id}
                      onMouseEnter={() => setActiveLatestId(e.id)}
                      onMouseLeave={() => setActiveLatestId(null)}
                      onPointerDown={() => {
                        setActiveLatestId(e.id)
                        setTimeout(() => setActiveLatestId(null), 2000)
                      }}
                      className={`
                        relative
                        flex items-center gap-3 p-3 rounded-xl cursor-pointer
                        border border-gray-100
                        transition-all duration-300 ease-out
                        transform
                        active:scale-[0.97] active:opacity-90
                        ${
                          isActive
                            ? `bg-gradient-to-r ${gradient} text-white shadow-lg translate-x-2 scale-[1.02]`
                            : 'bg-white text-slate-700'
                        }
                      `}
                    >
                      {/* STRIP KIRI */}
                      <span
                        className={`
                          absolute left-0 top-0 h-full w-1 rounded-l-xl
                          transition-opacity duration-300
                          ${isActive ? 'opacity-100 bg-white/70' : 'opacity-0'}
                        `}
                      />

                      {/* ANGKA BULAT */}
                      <div
                        className={`
                          w-8 h-8 shrink-0 rounded-full
                          flex items-center justify-center
                          text-xs font-bold
                          transition-colors duration-300
                          ${isActive
                            ? 'bg-white text-indigo-600'
                            : 'bg-slate-100 text-slate-500'}
                        `}
                      >
                        {index + 1}
                      </div>

                      {/* JUDUL */}
                      <Link
                        to={`/exam/${e.id}`}
                        className={`
                          leading-snug font-semibold
                          transition-colors duration-300
                          ${isActive ? 'text-white' : 'text-slate-700'}
                        `}
                      >
                        {e.title}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>

            {/* Latest Pages */}
            <div className="bg-white rounded-xl p-4 border">
              <h4 className="font-semibold mb-3 border-b pb-2">
                Artikel Terbaru
              </h4>
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
