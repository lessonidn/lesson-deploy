import { useCallback, useEffect, useState } from 'react'
import { getCategories, getSubCategories, getExamSets, getQuestionsCount } from '../lib/quizApi'
import { supabase } from '../../../../src/lib/supabase'

type BucketUsage = {
  bucket_id: string;
  total_size_bytes: string; // Supabase RPC return biasanya string
};

type ExamStat = {
  exam_id: string
  exam_label: string
  activity_date: string | null
  total_attempts: number
  total_finished: number
}

export default function Dashboard() {
  const [catCount, setCatCount] = useState(0)
  const [subCount, setSubCount] = useState(0)
  const [examCount, setExamCount] = useState(0)
  const [questionCount, setQuestionCount] = useState(0)
  const [storageUsage, setStorageUsage] = useState<{ bucket_id: string; total_size_mb: number }[]>([])
  const [error, setError] = useState<string | null>(null)

  const [examStats, setExamStats] = useState<ExamStat[]>([])
  const [filterMapel, setFilterMapel] = useState('ALL')
  const [filterKelas, setFilterKelas] = useState('ALL')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const [allExamStats, setAllExamStats] = useState<ExamStat[]>([])

  function getUniqueMapel(stats: ExamStat[]): string[] {
    const mapels = stats
      .map(s => s.exam_label.split(' KELAS ')[0])
      .filter((m): m is string => typeof m === 'string' && m.length > 0)

    return Array.from(new Set(mapels))
  }

  function getUniqueKelas(stats: ExamStat[]): string[] {
    const kelas = stats
      .map(s => {
        const match = s.exam_label.match(/KELAS\s+\d+/)
        return match ? match[0] : undefined
      })
      .filter((k): k is string => typeof k === 'string')

    return Array.from(new Set(kelas))
  }

  // Fungsi Load Data Dipisah
  const loadFiltersSource = useCallback(async () => {
    const { data } = await supabase
      .from('admin_exam_ranking_by_date')
      .select('*')

    setAllExamStats(data || [])
  }, [])

  useEffect(() => {
    loadFiltersSource()
  }, [loadFiltersSource])


  const loadTableData = useCallback(async () => {
    let query = supabase
      .from('admin_exam_ranking_by_date')
      .select('*')

    if (startDate) query = query.gte('activity_date', startDate)
    if (endDate) query = query.lte('activity_date', endDate)

    const { data, error } = await query

    if (error) {
      setError(error.message)
      return
    }

    if (!data) {
      setExamStats([])
      return
    }

    // 🔥 GROUPING TOTAL PER EXAM
    const grouped: Record<string, ExamStat> = {}

    data.forEach(row => {
      if (!grouped[row.exam_id]) {
        grouped[row.exam_id] = {
          exam_id: row.exam_id,
          exam_label: row.exam_label,
          activity_date: null, // tidak dipakai lagi
          total_attempts: 0,
          total_finished: 0
        }
      }

      grouped[row.exam_id].total_attempts += row.total_attempts
      grouped[row.exam_id].total_finished += row.total_finished
    })

    const aggregated = Object.values(grouped)
      .sort((a, b) => b.total_finished - a.total_finished)

    setExamStats(aggregated)
  }, [startDate, endDate])

  useEffect(() => {
    loadTableData()
  }, [loadTableData])

  useEffect(() => {
    async function loadDashboardStats() {
      const { data: cats, error: catErr } = await getCategories()
      const { data: subs, error: subErr } = await getSubCategories()
      const { data: exams, error: examErr } = await getExamSets()

      // ✅ TAMBAHKAN INI
      const { count: questionTotal, error: qErr } = await getQuestionsCount()

      const { data: usage, error: usageErr } =
        await supabase.rpc('get_bucket_usage')


      if (catErr || subErr || examErr || qErr || usageErr) {
        setError(
          catErr?.message ||
          subErr?.message ||
          examErr?.message ||
          qErr?.message ||
          usageErr?.message ||
          'Gagal memuat data'
        )
        return
      }

      setCatCount(cats?.length || 0)
      setSubCount(subs?.length || 0)
      setExamCount(exams?.length || 0)
      setQuestionCount(questionTotal)

      setStorageUsage(
        (usage as BucketUsage[])?.map(u => ({
          bucket_id: u.bucket_id,
          total_size_mb:
            Math.round(parseInt(u.total_size_bytes) / 1024 / 1024 * 100) / 100
        })) || []
      )
    }

    loadDashboardStats()
  }, [])

  // Fungsi filter data
  const filteredStats = examStats.filter(row => {
    if (filterMapel !== 'ALL' && !row.exam_label.startsWith(filterMapel)) {
      return false
    }
    if (filterKelas !== 'ALL' && !row.exam_label.includes(filterKelas)) {
      return false
    }
    return true
  })


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

      {/* Exam Statistics */}
      <div>
        <h3 className="text-xl font-semibold mb-4">
          📈 Lembar Soal Terpopuler
        </h3>

        {/* Date Filter */}
        <div className="flex flex-wrap gap-4 mb-4">
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          />

          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-4">
          {/* Mapel */}
          <select value={filterMapel} onChange={e => setFilterMapel(e.target.value)}>
            <option value="ALL">Semua Mapel</option>
            {getUniqueMapel(allExamStats).map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <select value={filterKelas} onChange={e => setFilterKelas(e.target.value)}>
            <option value="ALL">Semua Kelas</option>
            {getUniqueKelas(allExamStats).map(k => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto bg-white shadow rounded-lg">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left">No</th>
                <th className="px-4 py-3 text-left">Lembar Soal</th>
                <th className="px-4 py-3 text-center">Dikerjakan</th>
                <th className="px-4 py-3 text-center">Selesai</th>
                <th className="px-4 py-3 text-center">Completion</th>
              </tr>
            </thead>

            <tbody>
              {filteredStats.slice(0, 10).map((row, i) => {
                const completion =
                  row.total_attempts === 0
                    ? 0
                    : Math.round((row.total_finished / row.total_attempts) * 100)

                const isProblematic =
                  row.total_attempts >= 10 && completion < 50

                return (
                  <tr
                    key={row.exam_id}
                    className={`border-t ${
                      isProblematic ? 'bg-red-50' : ''
                    }`}
                  >
                    <td className="px-4 py-3">{i + 1}</td>

                    <td className="px-4 py-3 font-medium">
                      {row.exam_label}
                    </td>

                    <td className="px-4 py-3 text-center">
                      {row.total_attempts}
                    </td>

                    <td className="px-4 py-3 text-center font-semibold text-green-600">
                      {row.total_finished}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-col items-center gap-1">
                        <span
                          className={`text-sm font-semibold ${
                            completion >= 70
                              ? 'text-green-600'
                              : completion >= 50
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          }`}
                        >
                          {completion}%
                        </span>

                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              completion >= 70
                                ? 'bg-green-500'
                                : completion >= 50
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${completion}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-xs text-gray-500">
          🔴 Baris Completion merah menandakan lembar soal dengan tingkat penyelesaian rendah (perlu evaluasi).
        </p>
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
