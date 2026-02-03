import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import logo from '../asset/leaf.png'
import RequestSoalWA from "../components/RequestSoalWA";

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
  is_member_only: boolean   // ✅ TAMBAH
}

type ExamTeaser = {
  id: string
  sub_category_id: string
  title: string
  // tambahkan field lain sesuai struktur datanya
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

  //-- SLIDER BANNER ---
  const heroSlides = [
    {
      image:
        'https://images.unsplash.com/photo-1565598611425-45b0878bdd0b?q=80&w=1170&auto=format&fit=crop',
      link: '/category',
    },
    {
      image:
        'https://images.unsplash.com/photo-1756102080345-797e02549f97?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      link: '/donasi',
    },
    {
      image:
        'https://images.unsplash.com/photo-1625111381887-458fce74a923?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      link: '/tentang-kami',
    },
  ]

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
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([])
  const [scrolled, setScrolled] = useState(false)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const { session, profile, logout } = useAuth()
  const [examTeasers, setExamTeasers] = useState<ExamTeaser[]>([])

  const isMemberActive = profile?.membership_status === 'active'

  const [searchResults, setSearchResults] = useState<ExamSet[]>([])
  const searchResultRef = useRef<HTMLDivElement | null>(null)

  /* ===== SEARCH HANDLER ===== */
  function handleSearch() {
    const term = normalize(search)
    if (!term) {
      setSearchResults([])
      return
    }

    const results = examSets.filter(e => {
      const sub = subCategories.find(s => s.id === e.sub_category_id)
      const examTitle = normalize(e.title)
      const subName = normalize(sub?.name || "")

      if (examTitle.includes(term)) return true
      if (subName.includes(term)) return true

      const matchKelas = subName.match(/kelas\s*\d+/i)
      if (matchKelas && normalize(matchKelas[0]).includes(term)) return true

      return false
    })

    setSearchResults(results)

    // ✅ SCROLL PRESISI KE H2
    setTimeout(() => {
      if (!searchResultRef.current) return

      const y =
        searchResultRef.current.getBoundingClientRect().top +
        window.scrollY -
        HEADER_OFFSET

      window.scrollTo({
        top: y,
        behavior: 'smooth',
      })
    }, 50)
  }

  const HEADER_OFFSET = 140

  /* ===== HERO SLIDER STATE (WAJIB DI SINI) ===== */
  const [currentSlide, setCurrentSlide] = useState(0)

  // Auto slide hero
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev =>
        prev === heroSlides.length - 1 ? 0 : prev + 1
      )
    }, 4000)

    return () => clearInterval(timer)
  }, [])

  // Header scroll effect
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Load data
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
      { data: socialLinks },
      { data: teasers },   // ✅ TAMBAH
    ] = await Promise.all([
      supabase
        .from('categories')
        .select('id, name, slug, is_published')
        .eq('is_published', true)
        .order('order_index'),

      supabase
        .from('sub_categories')
        .select('id, name, slug, category_id')
        .order('name'),

      supabase
        .from('exam_sets')
        .select('id, title, sub_category_id, created_at, is_member_only')
        .eq('is_published', true)
        .eq('is_deleted', false),   // ❌ hapus filter is_member_only di sini

      supabase
        .from('exam_sets')
        .select('id, title, sub_category_id, created_at, is_member_only')
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
        .select('id, title, slug, excerpt, created_at')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(10),

      supabase
        .from('social_links')
        .select('*')
        .eq('is_active', true)
        .order('order_index'),

      supabase
      .from('exam_teasers')   // ✅ nama tabel plural sesuai schema
      .select('id, title, sub_category_id, is_member_only')   // ✅ pakai kolom yang ada
      .order('id', { ascending: false }),   // ✅ order by id saja
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
    setSocialLinks(socialLinks || [])
    setExamTeasers(teasers || [])   // ✅ TAMBAH

    /* ===== RESOLVE AUTO MENU ===== */

    const resolved: Menu[] = []

    menus.forEach(menu => {
      if (menu.source === 'manual') {
        resolved.push(menu)
        return
      }

      if (menu.source === 'category') {
        resolved.push({ ...menu, url: null })
        cats.forEach((c, i) => {
          resolved.push({
            id: `cat-${c.id}`,
            label: c.name,
            url: `/latihan/${c.slug}`,   // ✅ pakai slug dari DB
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
            url: `/latihan/${s.slug}`,   // ✅ pakai slug dari DB
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

  const filteredExams = examSets.filter(e => {
    const sub = subCategories.find(s => s.id === e.sub_category_id)
    const examTitle = normalize(e.title)
    const subName = normalize(sub?.name || "")
    const searchTerm = normalize(search)

    // cek di judul exam
    if (examTitle.includes(searchTerm)) return true

    // cek di nama sub category
    if (subName.includes(searchTerm)) return true

    // cek kelas (misalnya "kelas 7", "kelas 8")
    const matchKelas = subName.match(/kelas\s*\d+/i)
    if (matchKelas && normalize(matchKelas[0]).includes(searchTerm)) return true

    return false
  })

  /* == URUT KELAS ===*/
  function getClassNumber(name: string): number {
    const match = name.match(/\d+/)
    return match ? Number(match[0]) : 0
  }

  function normalize(str: string): string {
    return str.toLowerCase()
  }

  /* ================= RENDER ================= */

  return (
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
              {!session && !profile && (
                <Link
                  to="/login"
                  className="bg-sky-500 hover:bg-sky-400 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                >
                  Member Area
                </Link>
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

                  {/* Tambah invisible hover area */}
                  <div className="absolute top-full left-0 w-full h-2 bg-transparent"></div>

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
                    <Link to="/mydashboard" className="block px-4 py-2 text-sm hover:bg-white/10">
                      Dashboard
                    </Link>
                    
                    <button
                      onClick={logout}
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

      {/* ================= HERO ================= */}
      <section className="pt-24 relative z-10 bg-gradient-to-br from-blue-900 to-sky-500 text-white overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 py-16 grid md:grid-cols-2 gap-10 items-center">
          {/* TEXT */}
          <div>
            <h2 className="text-4xl font-bold leading-tight">
              Belajar Lebih Terarah <br />
              <span className="text-sky-200">Latihan & Ujian Online</span>
            </h2>
            <p className="mt-4 text-blue-100 max-w-md">
              Platform bimbel modern untuk membantu siswa berlatih,
              memahami materi, dan siap menghadapi ujian.
            </p>

            <div className="mt-6 flex gap-4 flex-wrap">
              <Link
                to="/category"
                className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-sky-100 transition"
              >
                Mulai Latihan
              </Link>

              <Link
                to="/upgrade"
                className="border border-white/60 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/10 transition"
              >
                Member Premium
              </Link>
            </div>
          </div>

          {/* SLIDER */}
          <div className="relative">
            <a href={heroSlides[currentSlide].link}>
              <img
                src={heroSlides[currentSlide].image}
                alt="Hero Slide"
                className="
                  rounded-2xl shadow-xl
                  transition-opacity duration-700 ease-in-out
                  opacity-100
                "
              />
            </a>

            {/* INDICATORS */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {heroSlides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`
                    w-2.5 h-2.5 rounded-full transition
                    ${i === currentSlide
                      ? 'bg-white'
                      : 'bg-white/40 hover:bg-white/70'}
                  `}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= MEMBER VALUE ================= */}
      <section className="bg-white py-14">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Belajar Lebih Terarah dengan Member Premium
          </h2>

          <p className="text-gray-600 max-w-2xl mx-auto mb-10">
            Member Premium dirancang untuk siswa yang ingin memahami materi
            secara menyeluruh dengan latihan terstruktur dan pembahasan lengkap.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 border rounded-xl bg-gray-50">
              <h3 className="font-semibold mb-2">Latihan Khusus Member</h3>
              <p className="text-sm text-gray-600">
                Akses latihan eksklusif yang tidak tersedia untuk umum.
              </p>
            </div>

            <div className="p-6 border rounded-xl bg-gray-50">
              <h3 className="font-semibold mb-2">Pembahasan Lengkap</h3>
              <p className="text-sm text-gray-600">
                Setiap soal dilengkapi pembahasan untuk membantu memahami konsep.
              </p>
            </div>

            <div className="p-6 border rounded-xl bg-gray-50">
              <h3 className="font-semibold mb-2">Progres Belajar</h3>
              <p className="text-sm text-gray-600">
                Hasil latihan tersimpan untuk evaluasi belajar yang lebih terarah.
              </p>
            </div>
          </div>

          <div className="mt-10">
            <Link
              to="/upgrade"
              className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-semibold transition"
            >
              Pelajari Member Premium
            </Link>
          </div>
        </div>
      </section>

      {/* ================= MAIN ================= */}
      <main className="max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-4 gap-10 flex-1">
        {/* CONTENT */}
        <div className="md:col-span-3 space-y-10">
          {search ? (
            <section ref={searchResultRef}>
              <h2 className="text-xl font-bold mb-4">
                🔍 Hasil Pencarian: "{search}"
              </h2>

              {searchResults.length > 0 ? (
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
              ) : (
                <p className="text-gray-500 italic">
                  Tidak ditemukan hasil untuk "{search}"
                </p>
              )}
            </section>
          ) : (
            <>
              {/* ===== KONTEN NORMAL (Hero & Category tetap tampil) ===== */}
              {categories.map(cat => {
                const catSubs = subCategories
                  .filter(s => s.category_id === cat.id)
                  .sort((a, b) => getClassNumber(a.name) - getClassNumber(b.name))

                if (!catSubs.length) return null


                return (
                  <section key={cat.id}>
                    <h2
                      className="
                        text-lg md:text-xl font-bold text-gray-800
                        bg-gradient-to-r from-sky-500/10 to-transparent
                        border-l-4 border-sky-500
                        pl-4 py-2
                        rounded-r-lg
                        mb-4
                      "
                    >
                      {cat.name}
                    </h2>

                    {catSubs.map(sub => {
                      const exams = filteredExams.filter(e => e.sub_category_id === sub.id)
                      const teasers = examTeasers.filter(t => t.sub_category_id === sub.id)

                      if (!exams.length && !teasers.length) return null

                      return (
                        <div key={sub.id} className="mb-6">
                          <h3 className="font-semibold text-blue-600 mb-3">{sub.name}</h3>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {exams.map(exam => {
                            const isMemberOnly = exam.is_member_only
                            const isLocked = isMemberOnly && !isMemberActive

                            // Publik exam (selalu bisa diakses)
                            if (!isMemberOnly) {
                              return (
                                <Link
                                  key={exam.id}
                                  to={`/exam/${exam.id}`}
                                  className="relative p-5 rounded-2xl border transition hover:shadow-lg hover:-translate-y-1 bg-white"
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

                            // Exam member-only tapi user aktif
                            return (
                              <Link
                                key={exam.id}
                                to={`/exam/${exam.id}`}
                                className="relative p-5 rounded-2xl border transition hover:shadow-lg hover:-translate-y-1 bg-gradient-to-br from-purple-50 to-white border-purple-300"
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
                        </div>
                      )
                    })}
                  </section>
                )
              })}
              <RequestSoalWA />
            </>
          )}
        </div>

        {/* SIDEBAR */}
        <aside className="space-y-6">
          <div className="bg-white rounded-2xl overflow-hidden border">
            <img
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80"
              alt="Siswa belajar"
              className="w-full h-40 object-cover"
            />
            <div className="p-4">
              <p className="text-sm text-gray-600">
                Belajar rutin dengan latihan terstruktur membantu hasil lebih maksimal.
              </p>
            </div>
          </div>

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
          <div
            className="
              bg-white/90 backdrop-blur
              rounded-2xl p-4
              border border-gray-200
              shadow-sm
            "
          >
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
      <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-black text-gray-300">
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
            <p className="mt-6 mb-2 text-sm">Surakarta 57127, Jawa Tengah, Indonesia</p>

            {/* Tambahkan margin agar tidak mepet */}
            <h4 className="font-semibold text-white mt-6 mb-2">Ikuti Kami</h4>

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
  )
}
