import { useParams, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// Definisikan tipe data
type SubCategory = {
  id: string
  name: string
  slug: string
  categories?: {
    slug: string
  }[]   // Supabase relasi default → array
}

type ExamSet = {
  id: string
  title: string
  sub_category_id: string
}

export default function CategoryPage() {
  const { slug } = useParams()
  const [subs, setSubs] = useState<SubCategory[]>([])   // ✅ bukan any[]

  useEffect(() => {
    supabase
      .from('sub_categories')
      .select('id,name,slug,categories!inner(slug)')
      .eq('categories.slug', slug)
      .then(res => setSubs(res.data || []))
  }, [slug])

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Choose Exam</h1>

      {subs.map(sub => (
        <div key={sub.id} className="mb-4">
          <h2 className="font-semibold">{sub.name}</h2>
          <ExamList subId={sub.id} />
        </div>
      ))}
    </div>
  )
}

function ExamList({ subId }: { subId: string }) {
  const [exams, setExams] = useState<ExamSet[]>([])   // ✅ bukan any[]

  useEffect(() => {
    supabase
      .from('exam_sets')
      .select('*')
      .eq('sub_category_id', subId)
      .then(res => setExams(res.data || []))
  }, [subId])

  return (
    <ul className="pl-4">
      {exams.map(exam => (
        <li key={exam.id}>
          <Link
            to={`/exam/${exam.id}`}
            className="text-indigo-600 hover:underline"
          >
            {exam.title}
          </Link>
        </li>
      ))}
    </ul>
  )
}