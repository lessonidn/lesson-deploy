import { useParams, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { supabase } from '../lib/supabase'

type BlogPage = {
  id?: string
  title: string
  slug: string
  content: string
  excerpt: string | null
  featured_image: string | null
  category_slug: string | null
  created_at: string
  updated_at?: string
}

type LatestPage = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  category_slug: string | null
}

export default function BlogDetail() {
  const { slug } = useParams()
  const [page, setPage] = useState<BlogPage | null>(null)
  const [latestPages, setLatestPages] = useState<LatestPage[]>([])
  const [loading, setLoading] = useState(true)
  const siteUrl = window.location.origin

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('pages')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single()

      if (data) {
        setPage(data)

        const { data: latest } = await supabase
          .from('pages')
          .select('id, title, slug, excerpt, category_slug')
          .eq('status', 'published')
          .eq('category_slug', data.category_slug)
          .order('created_at', { ascending: false })
          .limit(5)

        setLatestPages(latest || [])
      }

      setLoading(false)
    }

    load()
  }, [slug])

  if (loading || !page) {
    return <div className="min-h-screen flex items-center justify-center">Loading…</div>
  }

  const pageUrl = `${siteUrl}/blog/${page.slug}`

  return (
    <>
      {/* ===== SEO ===== */}
      <Helmet>
        <title>{page.title} | LESSON</title>
        <meta name="description" content={page.excerpt || page.title} />
        <link rel="canonical" href={pageUrl} />

        <meta property="og:url" content={pageUrl} />
        {page.featured_image && (
          <meta property="og:image" content={page.featured_image} />
        )}

        {/* ================= TWITTER ================= */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={page.title} />
        <meta name="twitter:description" content={page.excerpt || page.title} />
        {page.featured_image && (
          <meta name="twitter:image" content={page.featured_image} />
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
                name: "Blog",
                item: `${siteUrl}/blog`,
              },
              {
                "@type": "ListItem",
                position: 3,
                name: page.title,
                item: pageUrl,
              },
            ],
          })}
        </script>

        {/* ================= ARTICLE SCHEMA ================= */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: page.title,
            description: page.excerpt || page.title,
            image: page.featured_image ? [page.featured_image] : undefined,
            author: {
              "@type": "Organization",
              name: "LESSON",
            },
            publisher: {
              "@type": "Organization",
              name: "LESSON",
              logo: {
                "@type": "ImageObject",
                url: `${siteUrl}/logo.png`,
              },
            },
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": pageUrl,
            },
            url: pageUrl,
            datePublished: page.created_at,
            dateModified: page.updated_at || page.created_at,
            inLanguage: "id-ID",
          })}
        </script>
      </Helmet>

      {/* ===== CONTENT + SIDEBAR ===== */}
      <main className="max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-3 gap-10">
        {/* Kolom konten utama */}
        <article className="md:col-span-2">
          <Link to="/" className="text-sm text-gray-500 hover:text-blue-600">
            ← Kembali ke Home
          </Link>

          <h1 className="text-3xl font-bold mt-4 mb-4">{page.title}</h1>

          {page.featured_image && (
            <div className="w-full h-[420px] overflow-hidden rounded-xl mb-6">
              <img
                src={page.featured_image}
                alt={page.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="prose max-w-none">{page.content}</div>

          <div className="mt-10 flex justify-between text-sm">
            <Link to="/blog" className="text-blue-600 font-medium">
              ← Semua Artikel
            </Link>
            <Link to="/category" className="text-blue-600 font-medium">
              Lihat Kategori →
            </Link>
          </div>

          {/* CTA Latihan Soal */}
          {page.category_slug && (
            <div className="mt-10 p-4 bg-blue-50 rounded-xl">
              <p className="text-sm text-gray-700 mb-2">
                Ingin latihan soal terkait?
              </p>
              <Link
                to={`/category/${page.category_slug}`}
                className="inline-block text-blue-600 font-medium hover:underline"
              >
                👉 Lihat latihan {page.category_slug.replace('-', ' ')}
              </Link>
            </div>
          )}
        </article>

        {/* Kolom sidebar */}
        <aside className="space-y-6">
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
                    <p className="text-xs text-gray-500 mt-1">{p.excerpt}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </main>

      {/* ===== CTA LATIHAN SOAL ===== */}
      {page.category_slug && (
        <div className="mt-10 p-4 bg-blue-50 rounded-xl">
          <p className="text-sm text-gray-700 mb-2">
            Ingin latihan soal terkait?
          </p>

          <Link
            to={`/category/${page.category_slug}`}
            className="inline-block text-blue-600 font-medium hover:underline"
          >
            👉 Lihat latihan {page.category_slug.replace('-', ' ')}
          </Link>
        </div>
      )}
    </>
  )
}