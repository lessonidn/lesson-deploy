import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Helmet } from "react-helmet-async"


type Page = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  featured_image: string | null
  created_at: string
  updated_at?: string
}

export default function BlogArchive() {
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('pages')
        .select('id, title, slug, excerpt, featured_image, created_at, updated_at')
        .eq('status', 'published')
        .order('created_at', { ascending: false })

      setPages(data || [])
      setLoading(false)
    }

    load()
  }, [])

  if (loading) return <div className="p-10 text-center">Loading…</div>

  const siteUrl = window.location.origin
  const pageTitle = "Artikel & Tips Pendidikan | LESSON"
  const pageDescription =
    "Kumpulan artikel, tips belajar, parenting, dan edukasi terbaik dari LESSON."


  return (
    <>
    <Helmet>
      {/* BASIC SEO */}
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <link rel="canonical" href={`${siteUrl}/blog`} />

      {/* OPEN GRAPH */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:url" content={`${siteUrl}/blog`} />

      {/* TWITTER */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />

      {/* BLOG COLLECTION SCHEMA */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Blog",
          name: "LESSON Blog",
          description: pageDescription,
          url: `${siteUrl}/blog`,
          publisher: {
            "@type": "Organization",
            name: "LESSON",
            logo: {
              "@type": "ImageObject",
              url: `${siteUrl}/logo.png`,
            },
          },
        })}
      </script>
    </Helmet>

    {/* === KONTEN BLOG ARCHIVE KAMU === */}

      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-8">Artikel</h1>

        {pages.length === 0 && (
          <p className="text-gray-500 ">Belum ada artikel.</p>
        )}

        <div className="space-y-8 ">
          {pages.map(p => (
            <article key={p.id} className="border rounded-xl p-4">
              {p.featured_image && (
                <img
                  src={`${p.featured_image}?v=${p.updated_at || Date.now()}`}
                  alt={p.title}
                  className="w-full aspect-[16/9] object-cover rounded mb-3"
              />
              )}

              <h2 className="text-xl font-semibold mb-2">
                <Link to={`/blog/${p.slug}`} className="hover:text-blue-600">
                  {p.title}
                </Link>
              </h2>

              {p.excerpt && (
                <p className="text-gray-600 text-sm mb-2">{p.excerpt}</p>
              )}

              <Link
                to={`/blog/${p.slug}`}
                className="text-sm text-blue-600 font-medium"
              >
                Baca selengkapnya →
              </Link>
            </article>
          ))}
          <div className="mt-10 text-sm text-gray-500">
            <Link to="/" className="hover:text-blue-600">
              ← Kembali ke Home
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
