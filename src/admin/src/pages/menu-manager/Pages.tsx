import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../../../lib/supabase'

/* ================= TYPES ================= */

type PageStatus = 'draft' | 'published'

type Category = {
  id: string
  name: string
}

type Page = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  status: PageStatus
  featured_image: string | null
  category_id: string | null
  created_at: string
}

type PageForm = {
  title: string
  slug: string
  excerpt: string
  content: string
  status: PageStatus
  featured_image: string | null
  category_id: string | null
}

const emptyForm: PageForm = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  status: 'draft',
  featured_image: null,
  category_id: null,
}

/* ================= COMPONENT ================= */

export default function Pages() {
  const [pages, setPages] = useState<Page[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState<PageForm>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    loadPages()
    loadCategories()
  }, [])

  /* ================= LOADERS ================= */

  async function loadPages() {
    const { data } = await supabase
      .from('pages')
      .select('*')
      .order('created_at', { ascending: false })

    setPages(data || [])
  }

  async function loadCategories() {
    const { data } = await supabase
      .from('categories')
      .select('id, name')
      .eq('is_published', true)
      .eq('is_deleted', false)
      .order('order_index')

    setCategories(data || [])
  }

  /* ================= IMAGE UPLOAD ================= */

  async function uploadImage(file: File) {
    const ext = file.name.split('.').pop()
    const fileName = `${crypto.randomUUID()}.${ext}`
    const filePath = `featured/${fileName}`

    const { error } = await supabase.storage
      .from('pages')
      .upload(filePath, file)

    if (error) throw error

    const { data } = supabase.storage
      .from('pages')
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  /* ================= SAVE ================= */

  async function save() {
    if (!form.title || !form.content) {
      alert('Judul & konten wajib diisi')
      return
    }

    const payload = {
      ...form,
      slug: form.slug || slugify(form.title),
    }

    if (editingId) {
      await supabase.from('pages').update(payload).eq('id', editingId)
    } else {
      await supabase.from('pages').insert(payload)
    }

    reset()
    loadPages()
  }

  /* ================= EDIT ================= */

  function edit(p: Page) {
    setEditingId(p.id)
    setForm({
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt || '',
      content: p.content,
      status: p.status,
      featured_image: p.featured_image,
      category_id: p.category_id,
    })

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  /* ================= DELETE ================= */

  async function remove(id: string) {
    if (!confirm('Hapus halaman ini?')) return
    await supabase.from('pages').delete().eq('id', id)
    loadPages()
  }

  /* ================= RESET ================= */

  function reset() {
    setEditingId(null)
    setForm(emptyForm)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  /* ================= RENDER ================= */

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Pages / Blog</h1>

      {/* FORM */}
      <div className="bg-white p-4 border rounded-xl space-y-3">
        <input
          className="border p-2 w-full rounded"
          placeholder="Judul"
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
        />

        <input
          className="border p-2 w-full rounded"
          placeholder="Slug (opsional)"
          value={form.slug}
          onChange={e => setForm({ ...form, slug: e.target.value })}
        />

        {/* CATEGORY */}
        <select
          className="border p-2 w-full rounded"
          value={form.category_id ?? ''}
          onChange={e =>
            setForm({ ...form, category_id: e.target.value || null })
          }
        >
          <option value="">— Pilih Kategori —</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <textarea
          className="border p-2 w-full rounded"
          placeholder="Excerpt"
          value={form.excerpt}
          onChange={e => setForm({ ...form, excerpt: e.target.value })}
        />

        {/* FEATURED IMAGE */}
        <div>
          <label className="text-sm font-medium">Featured Image</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={async e => {
              const file = e.target.files?.[0]
              if (!file) return
              const url = await uploadImage(file)
              setForm({ ...form, featured_image: url })
            }}
          />

          {form.featured_image && (
            <img
              src={`${form.featured_image}?t=${Date.now()}`}
              className="mt-2 h-32 rounded border object-cover"
            />
          )}
        </div>

        <textarea
          className="border p-2 w-full rounded h-40"
          placeholder="Konten"
          value={form.content}
          onChange={e => setForm({ ...form, content: e.target.value })}
        />

        <select
          className="border p-2 rounded"
          value={form.status}
          onChange={e =>
            setForm({ ...form, status: e.target.value as PageStatus })
          }
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>

        <div className="flex gap-2">
          <button
            onClick={save}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            {editingId ? 'Update' : 'Publish'}
          </button>

          {editingId && (
            <button onClick={reset} className="px-4 py-2 border rounded">
              Batal
            </button>
          )}
        </div>
      </div>

      {/* LIST */}
      <div className="bg-white border rounded-xl divide-y">
        {pages.map(p => (
          <div key={p.id} className="p-3 flex justify-between">
            <div>
              <div className="font-medium">{p.title}</div>
              <div className="text-xs text-gray-500">
                {p.status} • {new Date(p.created_at).toLocaleDateString()}
              </div>
            </div>

            <div className="flex gap-2 text-xs">
              <button onClick={() => edit(p)} className="text-blue-600">
                Edit
              </button>
              <button onClick={() => remove(p.id)} className="text-red-600">
                Hapus
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ================= HELPER ================= */

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
}
