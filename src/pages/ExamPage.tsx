import { useParams, Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import logo from '../asset/leaf.png'

type Category = {
  id: string
  name: string
  slug: string
}

type SubCategory = {
  id: string
  name: string
  categories: Category[]
}

type ExamSet = {
  id: string
  title: string
  description: string
  duration_minutes: number
  sub_categories: SubCategory[]
}

export default function ExamPage() {
  const { id } = useParams()
  const [exam, setExam] = useState<ExamSet | null>(null)
  const [questionCount, setQuestionCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!id) return
    loadExam(id)
  }, [id])

  async function loadExam(examId: string) {
    setLoading(true)
    setError(null)

    const { data: examData, error: examErr } = await supabase
      .from('exam_sets')
      .select(`
        id,
        title,
        description,
        duration_minutes,
        sub_categories (
          id,
          name,
          categories (
            id,
            name,
            slug
          )
        )
      `)
      .eq('id', examId)
      .eq('is_published', true)
      .single()

    const { count, error: countErr } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('exam_set_id', examId)

    if (examErr || countErr || !examData) {
      setError(examErr?.message || countErr?.message || 'Gagal memuat exam')
    } else {
      setExam(examData)
      setQuestionCount(count || 0)
    }

    setLoading(false)
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading…</div>
  }

  if (error || !exam) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        {error || 'Exam tidak ditemukan'}
      </div>
    )
  }

  // Ambil kategori pertama, fallback ke null
  const category = exam.sub_categories[0]?.categories[0]

  return (
  <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-pink-50">
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold flex items-center text-gray-500">
        LES
        <span className="text-sky-300 flex">
          SO
          <span className="relative inline-block">
            N
            {/* ✅ Logo lebih kecil di atas huruf N */}
            <img
              src={logo}
              alt="lesson"
              className="absolute -top-4 left-1/2 -translate-x-1/2 h-4"
            />
          </span>
        </span>
      </h1>

      <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">

        {/* ✅ Logo + BACK TO CATEGORY */}
        <div className="flex items-center gap-2">        
          {category ? (
            <Link
              to={`/category/${category.slug}`}
              className="text-sm text-blue-600 hover:underline inline-block"
            >
              ← Kembali ke latihan {category.name}
            </Link>
          ) : (
            <Link
              to="/category"
              className="text-sm text-blue-600 hover:underline inline-block"
            >
              ← Kembali ke daftar Mata Pelajaran
            </Link>
          )}
        </div>

        <h1 className="text-3xl font-bold text-indigo-600">
          {exam.title}
        </h1>

          {exam.description && (
            <p className="text-gray-700 leading-relaxed">
              {exam.description}
            </p>
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
              className="px-5 py-3 rounded-lg border text-gray-600 hover:bg-gray-100"
            >
              ← Kembali
            </button>

            <Link
              to={`/quiz/${exam.id}`}
              className="px-6 py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
            >
              Mulai Tes
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}