import { useParams, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type Page = {
  id: string
  title: string
  slug: string
  content: string
  featured_image: string | null
  created_at: string
  updated_at?: string
}

interface PageSummary {
  id: string
  title: string
  slug: string
}

export default function BlogDetail() {
  const { slug } = useParams()
  const [page, setPage] = useState<Page | null>(null)
  const [prev, setPrev] = useState<PageSummary | null>(null)   // ✅ ubah ke PageSummary
  const [next, setNext] = useState<PageSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return

    async function load() {
      // 1️⃣ Ambil artikel aktif
      const { data: current } = await supabase
        .from('pages')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single()

      if (!current) {
        setLoading(false)
        return
      }

      setPage(current)

      // 2️⃣ Artikel sebelumnya
      const { data: prevData } = await supabase
        .from('pages')
        .select('id, title, slug')
        .eq('status', 'published')
        .lt('created_at', current.created_at)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      // 3️⃣ Artikel selanjutnya
      const { data: nextData } = await supabase
        .from('pages')
        .select('id, title, slug')
        .eq('status', 'published')
        .gt('created_at', current.created_at)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      setPrev(prevData)
      setNext(nextData)
      setLoading(false)
    }

    load()
  }, [slug])

  if (loading) return <div className="p-10">Loading…</div>
  if (!page) return <div className="p-10">Artikel tidak ditemukan</div>

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* ===== SEO BREADCRUMMB ===== */}
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
              "name": "Artikel",
              "item": window.location.origin + "/blog"
            },
            {
              "@type": "ListItem",
              "position": 3,
              "name": page.title,
              "item": window.location.href
            }
          ]
        })
      }}
    />
      <h1 className="text-3xl font-bold mb-4">{page.title}</h1>

      {page.featured_image && (
        <div className="w-full h-[420px] overflow-hidden rounded-xl mb-6">
          <img
            src={`${page.featured_image}?v=${page.updated_at || Date.now()}`}
            alt={page.title}
            className="w-full h-full object-cover object-center"
          />
        </div>
      )}

      <div className="prose max-w-none mb-10">{page.content}</div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t pt-6">
        <Link
          to="/"
          className="text-sm font-medium text-gray-600 hover:text-blue-600"
        >
          Kembali ke Home
        </Link>

        <div className="flex gap-6 text-sm">
          {prev && (
            <Link
              to={`/blog/${prev.slug}`}
              className="text-blue-600 hover:underline"
            >
              ← Sebelumnya -- {prev.title} 
            </Link>
          )}

          {next && (
            <Link
              to={`/blog/${next.slug}`}
              className="text-blue-600 hover:underline"
            >
              Selanjutnya -- {next.title} →
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}