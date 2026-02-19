import { useEffect, useState } from 'react'
import { FaRegClock } from 'react-icons/fa'
import {
  getSubCategories,
  getAdminExamSets,
  createExamSet,
  updateExamSet,
  softDeleteExamSet,
  togglePublishExamSet
} from '../lib/quizApi'
import { usePreventDoubleClick } from '../lib/usePreventDoubleClick'

// ================= TYPES =================
type SubCategory = {
  id: string
  name: string
  category_id: string
  categories?: { id: string; name: string }
}

type ExamSet = {
  id: string
  title: string
  sub_category_id: string
  duration_minutes: number
  is_published: boolean
  is_member_only: boolean   // ✅ TAMBAH
  sub_categories?: {
    id: string
    name: string
    categories?: { id: string; name: string }
  }
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

// ================= COMPONENT =================
export default function ExamSets() {
  const [subs, setSubs] = useState<SubCategory[]>([])
  const [items, setItems] = useState<ExamSet[]>([])
  const [title, setTitle] = useState('')
  const [subId, setSubId] = useState('')
  const [durationMinutes, setDurationMinutes] = useState<number>(30)
  const [editId, setEditId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filterSubId, setFilterSubId] = useState<string>('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [memberFilter, setMemberFilter] = useState<'all' | 'member' | 'public'>('all')

  const { canClick } = usePreventDoubleClick()

  async function load() {
    const { data: subsData, error: subsError } = await getSubCategories()
    const { data: examData, error: examError } = await getAdminExamSets()

    if (subsError || examError) {
      setError(subsError?.message || examError?.message || 'Gagal memuat data')
      return
    }

    setSubs((subsData ?? []) as unknown as SubCategory[])
    setItems((examData ?? []) as unknown as ExamSet[])
  }

  /* === FITUR SEARCH === */
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setSearch('')
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  async function handleToggle(id: string, isPublished: boolean) {
    const { error } = await togglePublishExamSet('exam_sets', id, isPublished)
    if (error) {
      setError(error.message)
      return
    }
    await load()
  }

  async function save() {
    if (!title || !subId) return
    if (!canClick()) return

    const payload = {
      title,
      slug: slugify(title), // ✅ WAJIB
      sub_category_id: subId,
      duration_minutes: durationMinutes || 30,
    }


    if (editId) {
      const { error } = await updateExamSet(editId, payload)
      if (error) {
        setError(error.message)
        return
      }
    } else {
      const { error } = await createExamSet(payload)
      if (error) {
        setError(error.message)
        return
      }
    }

    resetForm()
    load()
  }

  async function remove(id: string) {
    const { error } = await softDeleteExamSet(id)
    if (error) setError(error.message)
    load()
  }

  function resetForm() {
    setTitle('')
    setSubId('')
    setDurationMinutes(30)
    setEditId(null)
    setError(null)
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Exam Sets</h2>

      {/* FORM */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <select
          className="border px-3 py-2 rounded"
          value={subId}
          onChange={e => {
            const newSubId = e.target.value
            setSubId(newSubId)

            // 🔒 RESET HANYA JIKA MODE TAMBAH
            if (!editId) {
              setTitle('')
              setDurationMinutes(30)
              setError(null)
            }
          }}
        >
          <option value="">Pilih Sub Kategori</option>
          {subs.map(s => (
            <option key={s.id} value={s.id}>
              {s.name} -- {s.categories?.name || '-'}
            </option>
          ))}
        </select>

        <input
          className="border px-3 py-2 rounded"
          placeholder="Nama Lembar Soal"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />

        <div className="flex items-center gap-2">
          <FaRegClock className="h-5 w-5 text-indigo-800" />
          <input
            type="number"
            min={1}
            className="border px-3 py-2 rounded w-32"
            placeholder="Durasi (menit)"
            value={durationMinutes}
            onChange={e => setDurationMinutes(Number(e.target.value))}
          />
          
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={items.find(e => e.id === editId)?.is_member_only || false}
              onChange={e => {
                if (!editId) return
                updateExamSet(editId, { is_member_only: e.target.checked })
                  .then(load)
              }}
            />
            Khusus Member
          </label>

          <button
            onClick={save}
            className="bg-indigo-600 text-white px-4 py-2 rounded"
          >
            {editId ? 'Update' : 'Tambah'}
          </button>

          {editId && (
            <button
              onClick={resetForm}
              className="bg-gray-400 text-white px-4 py-2 rounded"
            >
              Batal
            </button>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-500">
        ⏱ Default durasi <b>30 menit</b>, bisa diubah (contoh: 120 menit).
      </p>

      {error && <p className="text-red-500">{error}</p>}

      {/* FILTER & SEARCH */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
        {/* FILTER SUB KATEGORI */}
        <select
          className="border px-3 py-2 rounded"
          value={filterSubId}
          onChange={e => {
            setFilterSubId(e.target.value)
            setEditId(null)
            setTitle('')
            setSubId('')
            setDurationMinutes(30)
            setError(null)
          }}
        >
          <option value="">Filter: Semua Sub Kategori</option>
          {subs.map(s => (
            <option key={s.id} value={s.id}>
              {s.name} -- {s.categories?.name || '-'}
            </option>
          ))}
        </select>

        {/* FILTER STATUS PUBLISH */}
        <select
          className="border px-3 py-2 rounded"
          value={statusFilter}
          onChange={(e) =>
          setStatusFilter(e.target.value as 'all' | 'published' | 'draft')}
        >
          <option value="all">Filter: Semua Status</option>
          <option value="published">Published</option>
          <option value="draft">Unpublish</option>
        </select>

        {/* FILTER MEMBER */}
        <select
          className="border px-3 py-2 rounded"
          value={memberFilter}
          onChange={(e) =>
          setMemberFilter(e.target.value as 'all' | 'member' | 'public')}
        >
          <option value="all">Filter: Semua Akses</option>
          <option value="member">Khusus Member</option>
          <option value="public">Publik</option>
        </select>

        {/* SEARCH */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Cari nama lembar soal..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full border px-3 py-2 pr-9 rounded focus:ring-2 focus:ring-indigo-500"
          />

          {/* TOMBOL SILANG */}
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
              title="Bersihkan pencarian (ESC)"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* LIST */}
      <ul className="bg-white border rounded divide-y">
        {items
          // Filter Sub Kategori
          .filter(i => !filterSubId || i.sub_category_id === filterSubId)

          // Filter Publish Status
          .filter(i => {
            if (statusFilter === 'published') return i.is_published
            if (statusFilter === 'draft') return !i.is_published
            return true
          })

          // Filter Member Status
          .filter(i => {
            if (memberFilter === 'member') return i.is_member_only
            if (memberFilter === 'public') return !i.is_member_only
            return true
          })

          // Search
          .filter(i =>
            i.title.toLowerCase().includes(search.toLowerCase())
          )

          .map(i => (
            <li key={i.id} className="p-4 flex justify-between items-center hover:bg-yellow-300 transition-colors">
              <div>
                <div className="font-medium flex items-center gap-2 flex-wrap">
                  {i.title} 
                  {i.sub_categories?.name ? ` -- ${i.sub_categories?.name}` : ''}
                  {i.sub_categories?.categories?.name ? ` -- ${i.sub_categories?.categories?.name}` : ''}

                  {i.is_member_only && (
                    <span
                      title="Exam ini hanya bisa diakses oleh member"
                      className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700 cursor-help"
                    >
                      Khusus Member
                    </span>
                  )}

                  {i.is_published ? (
                    <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">
                      Published
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-600">
                      Draft
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  ⏱ {i.duration_minutes} menit
                </div>
              </div>

              <div className="flex gap-2 items-center">
                <button
                  onClick={() => handleToggle(i.id, !i.is_published)}
                  className={`px-3 py-1 rounded text-white text-sm
                    ${i.is_published
                      ? 'bg-gray-500 hover:bg-gray-600'
                      : 'bg-green-600 hover:bg-green-700'}`}
                >
                  {i.is_published ? 'Unpublish' : 'Publish'}
                </button>

                <button
                  onClick={() => {
                    setEditId(i.id)
                    setTitle(i.title)
                    setSubId(i.sub_category_id)
                    setDurationMinutes(i.duration_minutes || 30)
                    setSearch('')
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className="px-3 py-1 bg-yellow-500 text-white rounded text-sm"
                >
                  Edit
                </button>

                <button
                onClick={() => {
                  if (window.confirm(`Apakah Anda yakin ingin menghapus "${i.title}"?`)) {
                    remove(i.id)
                  }
                }}
                className="px-2 py-1 bg-red-600 text-white rounded text-sm"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
      </ul>
    </div>
  )
}