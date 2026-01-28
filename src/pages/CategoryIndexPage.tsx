import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type Category = {
  id: string
  name: string
  slug: string
  description: string | null
  banner_image: string | null
}

export default function CategoryIndexPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCategories()
  }, [])

  async function loadCategories() {
    const { data } = await supabase
      .from('categories')
      .select('id, name, slug, description, banner_image')
      .eq('is_published', true)
      .eq('is_deleted', false)
      .order('order_index')

    setCategories(data || [])
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading…
      </div>
    )
  }

  // RENDER GAMBAR CATEGORIES
  function getPublicImageUrl(path: string) {
    const { data } = supabase.storage
      .from('media')
      .getPublicUrl(path)
    return data.publicUrl
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ================= HEADER ================= */}
      <header className="relative z-40">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black" />
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

        <div className="relative max-w-6xl mx-auto px-4 py-10 text-white">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-wide">
            <span className="text-white">Daftar</span>{' '}
            <span className="text-sky-400 drop-shadow-[0_0_6px_rgba(56,189,248,0.6)]">
              Mata Pelajaran
            </span>
          </h1>
          <p className="text-gray-300 mt-2 max-w-xl">
            Pilih mata pelajaran dan mulai latihan secara terstruktur
            sesuai kebutuhan belajarmu.
          </p>
        </div>
      </header>

      {/* ================= CONTENT ================= */}
      <main className="max-w-6xl mx-auto px-4 py-14">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map(cat => (
            <Link
              key={cat.id}
              to={`/category/${cat.slug}`}
              className="
                group
                bg-white/90 backdrop-blur
                border border-gray-200
                rounded-2xl overflow-hidden
                shadow-sm hover:shadow-lg
                transition
              "
            >
              {cat.banner_image ? (
                <img
                  src={getPublicImageUrl(cat.banner_image)}
                  alt={cat.name}
                  className="h-40 w-full object-cover group-hover:scale-105 transition"
                />
              ) : (
                <div className="h-40 bg-gradient-to-br from-sky-100 to-sky-200 flex items-center justify-center">
                  <span className="text-sky-600 font-semibold">
                    {cat.name}
                  </span>
                </div>
              )}
              <div className="p-5">
                <h2 className="font-bold text-lg text-gray-800 mb-1">
                  {cat.name}
                </h2>

                {cat.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {cat.description}
                  </p>
                )}

                <div className="mt-4 text-sm text-sky-600 font-semibold">
                  Lihat Materi →
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
