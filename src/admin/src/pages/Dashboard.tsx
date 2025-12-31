import { useEffect, useState } from 'react'
import { getCategories, getSubCategories, getExamSets, getQuestions } from '../lib/quizApi'
import { supabase } from '../../../../src/lib/supabase'

type BucketUsage = {
  bucket_id: string;
  total_size_bytes: string; // Supabase RPC return biasanya string
};

export default function Dashboard() {
  const [catCount, setCatCount] = useState(0)
  const [subCount, setSubCount] = useState(0)
  const [examCount, setExamCount] = useState(0)
  const [questionCount, setQuestionCount] = useState(0)
  const [storageUsage, setStorageUsage] = useState<{ bucket_id: string; total_size_mb: number }[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: cats, error: catErr } = await getCategories()
      const { data: subs, error: subErr } = await getSubCategories()
      const { data: exams, error: examErr } = await getExamSets()
      const { data: questions, error: qErr } = await getQuestions()
      const { data: usage, error: usageErr } = await supabase.rpc('get_bucket_usage')

      if (catErr || subErr || examErr || qErr || usageErr) {
        setError(catErr?.message || subErr?.message || examErr?.message || qErr?.message || usageErr?.message || 'Gagal memuat data')
      } else {
        setCatCount(cats?.length || 0)
        setSubCount(subs?.length || 0)
        setExamCount(exams?.length || 0)
        setQuestionCount(questions?.length || 0)

        setStorageUsage(
          (usage as BucketUsage[])?.map((u: BucketUsage) => ({
            bucket_id: u.bucket_id,
            total_size_mb: Math.round(parseInt(u.total_size_bytes) / 1024 / 1024 * 100) / 100
          })) || []
        );
      }
    }
    load()
  }, [])

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">📊 Dashboard Overview</h2>

      {error && <p className="text-red-500">{error}</p>}

      {/* Quiz Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Categories" value={catCount.toString()} />
        <StatCard title="Sub Categories" value={subCount.toString()} />
        <StatCard title="Exam Sets" value={examCount.toString()} />
        <StatCard title="Questions" value={questionCount.toString()} />
      </div>

      {/* Storage Usage */}
      <div>
        <h3 className="text-xl font-semibold mb-4">🗄️ Storage Usage</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {storageUsage.map(bucket => (
            <StorageCard
              key={bucket.bucket_id}
              title={bucket.bucket_id}
              value={bucket.total_size_mb}
              limit={1024} // 1 GB limit
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white shadow rounded-lg p-6 text-center">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-3xl font-bold text-indigo-600">{value}</div>
    </div>
  )
}

function StorageCard({ title, value, limit }: { title: string; value: number; limit: number }) {
  const percent = Math.min((value / limit) * 100, 100)
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between mb-2">
        <span className="text-sm text-gray-500">Bucket: {title}</span>
        <span className="text-sm font-semibold">{value} MB / {limit} MB</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className={`h-3 rounded-full ${percent > 80 ? 'bg-red-500' : 'bg-green-500'}`}
          style={{ width: `${percent}%` }}
        ></div>
      </div>
    </div>
  )
}