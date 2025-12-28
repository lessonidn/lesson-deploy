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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">
          Daftar Kategori
        </h1>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map(cat => (
            <Link
              key={cat.id}
              to={`/category/${cat.slug}`}
              className="bg-white border rounded-xl overflow-hidden hover:shadow transition"
            >
              {cat.banner_image && (
                <img
                  src={cat.banner_image}
                  alt={cat.name}
                  className="h-40 w-full object-cover"
                />
              )}

              <div className="p-4">
                <h2 className="font-semibold text-lg mb-1">
                  {cat.name}
                </h2>

                {cat.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {cat.description}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
