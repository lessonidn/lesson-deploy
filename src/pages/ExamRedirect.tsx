import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { normalizeArray } from '../utils/normalize'

export default function ExamRedirect() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  useEffect(() => {
    if (!id) return

    async function redirect() {
      const { data, error } = await supabase
        .from('exam_sets')
        .select(`
          slug,
          sub_categories!inner (
            slug,
            categories!inner (
              slug
            )
          )
        `)
        .eq('id', id)
        .single()

      if (error || !data) {
        console.error('Redirect error:', error)
        navigate('/', { replace: true })
        return
      }

      // ✅ NORMALISASI RELASI SUPABASE
      const subCategory = normalizeArray(data.sub_categories)[0]
      const category = normalizeArray(subCategory?.categories)[0]

      if (!subCategory || !category) {
        console.error('Relasi tidak lengkap:', data)
        navigate('/', { replace: true })
        return
      }

      navigate(
        `/${category.slug}/${subCategory.slug}/${data.slug}`,
        { replace: true }
      )
    }

    redirect()
  }, [id, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center text-gray-500">
      Menuju ke halaman soal…
    </div>
  )
}
