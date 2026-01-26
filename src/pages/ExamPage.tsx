import { useParams, Link, useNavigate } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import logo from '../asset/leaf.png'
import { Helmet } from 'react-helmet-async'
import { normalizeArray } from '../utils/normalize'

type Category = {
  id: string
  name: string
  slug: string
}

type SubCategory = {
  id: string
  name: string
  slug: string
  categories: Category[]
}

type ExamSet = {
  id: string
  title: string
  slug: string
  description: string | null
  duration_minutes: number
  sub_categories: SubCategory[]
}

export default function ExamPage() {
  const { categorySlug, subCategorySlug, examSlug } = useParams()
  const navigate = useNavigate()

  const [exam, setExam] = useState<ExamSet | null>(null)
  const [questionCount, setQuestionCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadExam = useCallback(async () => {
    if (!categorySlug || !subCategorySlug || !examSlug) return

    setLoading(true)
    setError(null)

    const { data: examData, error: examErr } = await supabase
      .from('exam_sets')
      .select(`
        id,
        title,
        slug,
        description,
        duration_minutes,
        sub_categories!inner (
          id,
          name,
          slug,
          categories!inner (
            id,
            name,
            slug
          )
        )
      `)
      .eq('slug', examSlug)
      .eq('sub_categories.slug', subCategorySlug)
      .eq('sub_categories.categories.slug', categorySlug)
      .eq('is_published', true)
      .single()

    if (examErr || !examData) {
      setError('Exam tidak ditemukan')
      setLoading(false)
      return
    }

    const { count } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('exam_set_id', examData.id)

    setExam(examData)
    setQuestionCount(count || 0)
    setLoading(false)
  }, [categorySlug, subCategorySlug, examSlug])

  useEffect(() => {
    loadExam()
  }, [loadExam])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading…</div>
  }

  if (error || !exam) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        {error}
      </div>
    )
  }

  // Ambil kategori 
  // 🔥 NORMALISASI RELASI SUPABASE
  const subCategory = normalizeArray(exam.sub_categories)[0]
  const category = normalizeArray(subCategory?.categories)[0]

  if (!subCategory || !category) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        Struktur data kategori tidak valid
      </div>
    )
  }

  // Fungsi Statisik
  async function startExam() {
    if (!exam) return

    const { data, error } = await supabase
      .from('exam_attempts')
      .insert({ exam_id: exam.id })
      .select()
      .single()

    if (error) {
      alert('Gagal memulai tes')
      return
    }

    sessionStorage.setItem('attempt_id', data.id)
    navigate(`/quiz/${exam.id}`)
  }

  const canonicalUrl = `https://www.bimbellesson.com/${category.slug}/${subCategory.slug}/${exam.slug}`

  return (
    <>
      <Helmet>
        <title>
          {exam.title} – {category.name} {subCategory.name} | Bimbel Lesson
        </title>

        <meta
          name="description"
          content={`Latihan soal ${category.name} ${subCategory.name} materi ${exam.title}. Durasi ${exam.duration_minutes} menit.`}
        />

        <link rel="canonical" href={canonicalUrl} />

        {/* QUIZ SCHEMA */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Quiz",
            "name": exam.title,
            "description": `Latihan soal ${category.name} ${subCategory.name}`,
            "educationalLevel": subCategory.name,
            "timeRequired": `PT${exam.duration_minutes}M`,
            "isAccessibleForFree": true,
            "publisher": {
              "@type": "Organization",
              "name": "Bimbel Lesson",
              "url": "https://www.bimbellesson.com"
            }
          })}
        </script>

        {/* BREADCRUMB */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Beranda", "item": "https://www.bimbellesson.com" },
              { "@type": "ListItem", "position": 2, "name": category.name, "item": `https://www.bimbellesson.com/category/${category.slug}` },
              { "@type": "ListItem", "position": 3, "name": subCategory.name, "item": `https://www.bimbellesson.com/${category.slug}/${subCategory.slug}` },
              { "@type": "ListItem", "position": 4, "name": exam.title, "item": canonicalUrl }
            ]
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-pink-50">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <h1 className="text-xl font-bold flex items-center text-gray-500">
            LES
            <span className="text-sky-300 flex">
              SO
              <span className="relative inline-block">
                N
                <img src={logo} alt="lesson" className="absolute -top-4 left-1/2 -translate-x-1/2 h-4" />
              </span>
            </span>
          </h1>

          <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
            <Link
              to={`/category/${category.slug}`}
              className="text-sm text-blue-600 hover:underline"
            >
              ← Kembali ke {category.name}
            </Link>

            <h1 className="text-3xl font-bold text-indigo-600">
              {exam.title}
            </h1>

            {exam.description && (
              <p className="text-gray-700">{exam.description}</p>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div className="p-4 rounded-lg bg-gray-50">
                ⏱ Durasi: <b>{exam.duration_minutes} menit</b>
              </div>
              <div className="p-4 rounded-lg bg-gray-50">
                📝 Jumlah Soal: <b>{questionCount}</b>
              </div>
            </div>

          <div className="pt-6 flex gap-4">
              <button
                onClick={() => navigate(-1)}
                className="px-5 py-3 rounded-lg border"
              >
                ← Kembali
              </button>

              <button
                onClick={startExam}
                className="px-6 py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
              >
                Mulai Tes
              </button>
          </div>
        </div>
      </div>
    </div>
  </>
  )
}