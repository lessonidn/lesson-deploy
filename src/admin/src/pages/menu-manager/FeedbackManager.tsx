import { useEffect, useState } from 'react'
import { supabase } from '../../../../lib/supabase'

type Feedback = {
  id: string
  exam_set_id: string
  rating: number
  comment: string | null
  created_at: string
  is_visible: boolean
  user_id: string
  user_name: string | null
  user_email: string | null
  exam_sets?: {
    title: string
  }
}

export default function FeedbackManager() {
  const [items, setItems] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)

    const { data, error } = await supabase
      .from('exam_feedback')
      .select(`
        *,
        exam_sets (
          title
        )
      `)
      .order('created_at', { ascending: false })

    if (!error) {
      setItems(data || [])
    }

    setLoading(false)
  }

  async function toggle(id: string, value: boolean) {
    await supabase
      .from('exam_feedback')
      .update({ is_visible: value })
      .eq('id', id)

    load()
  }

  async function remove(id: string) {
    if (!confirm('Hapus komentar ini?')) return

    await supabase
      .from('exam_feedback')
      .delete()
      .eq('id', id)

    load()
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">
        ⭐ Kelola Rating & Komentar
      </h1>

      <div className="bg-white border rounded-xl divide-y">
        {items.length === 0 && (
          <div className="p-4 text-sm text-gray-500">
            Belum ada komentar.
          </div>
        )}

        {items.map(item => (
          <div
            key={item.id}
            className="p-4 flex justify-between gap-4"
          >
            <div className="flex-1">
              <div className="text-sm font-semibold">
                {item.exam_sets?.title || 'Exam'}
              </div>

              <div className="text-xs text-gray-500">
                👤 {item.user_name || 'User'}
              </div>

              <div className="text-xs text-gray-400">
                {item.user_email || 'Email'} 
              </div>

              <div className="text-yellow-500 text-sm">
                {'★'.repeat(item.rating)}
              </div>

              {item.comment && (
                <div className="text-sm text-gray-600 mt-1">
                  {item.comment}
                </div>
              )}

              <div className="text-xs text-gray-400 mt-1">
                {new Date(item.created_at).toLocaleString()}
              </div>
            </div>

            <div className="flex flex-col gap-2 text-xs">
              <button
                onClick={() => toggle(item.id, !item.is_visible)}
                className={`px-3 py-1 rounded ${
                  item.is_visible
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {item.is_visible ? 'Visible' : 'Hidden'}
              </button>

              <button
                onClick={() => remove(item.id)}
                className="text-red-600"
              >
                Hapus
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}