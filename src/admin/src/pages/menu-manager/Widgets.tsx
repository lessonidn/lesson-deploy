import { useEffect, useState } from 'react'
import { supabase } from '../../../../lib/supabase'

type MenuSource = 'manual' | 'category' | 'sub_category'

type Menu = {
  id: string
  label: string
  url: string
  position: 'header' | 'footer'
  parent_id: string | null
  order: number
  is_active: boolean

  source: MenuSource
  source_id: string | null
  auto_generate: boolean
}

type Category = {
  id: string
  name: string
}

const emptyForm: Omit<Menu, 'id'> = {
  label: '',
  url: '',
  position: 'header',
  parent_id: null,
  order: 0,
  is_active: true,

  source: 'manual',
  source_id: null,
  auto_generate: false,
}

export default function Widgets() {
  const [menus, setMenus] = useState<Menu[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState<Omit<Menu, 'id'>>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    const [{ data: menusData }, { data: catData }] = await Promise.all([
      supabase
        .from('menus')
        .select('*')
        .order('position')
        .order('parent_id', { nullsFirst: true })
        .order('order'),
      supabase.from('categories').select('id, name').order('name'),
    ])

    setMenus(menusData || [])
    setCategories(catData || [])
  }

  async function save() {
    const payload = {
      ...form,
      url: form.source === 'manual' ? form.url : null,
      parent_id: null, // menu auto TIDAK pakai parent manual
    }

    if (editingId) {
      await supabase.from('menus').update(payload).eq('id', editingId)
    } else {
      await supabase.from('menus').insert(payload)
    }

    reset()
    loadAll()
  }

  function edit(menu: Menu) {
    setEditingId(menu.id)
    setForm({
      label: menu.label,
      url: menu.url || '',
      position: menu.position,
      parent_id: menu.parent_id,
      order: menu.order,
      is_active: menu.is_active,
      source: menu.source,
      source_id: menu.source_id,
      auto_generate: menu.auto_generate,
    })
  }

  async function remove(id: string) {
    if (!confirm('Hapus menu ini?')) return
    await supabase.from('menus').delete().eq('id', id)
    loadAll()
  }

  function reset() {
    setEditingId(null)
    setForm(emptyForm)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Menu Manager (Scalable)</h1>

      {/* FORM */}
      <div className="bg-white p-4 border rounded-xl space-y-3">
        <input
          placeholder="Label Menu"
          className="border p-2 w-full rounded"
          value={form.label}
          onChange={e => setForm({ ...form, label: e.target.value })}
        />

        {/* SOURCE TYPE */}
        <select
          className="border p-2 w-full rounded"
          value={form.source}
          onChange={e =>
            setForm({
              ...form,
              source: e.target.value as MenuSource,
              auto_generate: e.target.value !== 'manual',
            })
          }
        >
          <option value="manual">Manual</option>
          <option value="category">Auto dari Categories</option>
          <option value="sub_category">Auto dari Sub Categories</option>
        </select>

        {/* URL MANUAL */}
        {form.source === 'manual' && (
          <input
            placeholder="URL (contoh: /kontak)"
            className="border p-2 w-full rounded"
            value={form.url}
            onChange={e => setForm({ ...form, url: e.target.value })}
          />
        )}

        {/* AUTO CATEGORY SOURCE */}
        {form.source === 'category' && (
          <select
            className="border p-2 w-full rounded"
            value={form.source_id ?? ''}
            onChange={e =>
              setForm({ ...form, source_id: e.target.value || null })
            }
          >
            <option value="">— Semua Categories —</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}

        <div className="flex gap-3">
          <button
            onClick={save}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            {editingId ? 'Update' : 'Tambah'}
          </button>

          {editingId && (
            <button onClick={reset} className="px-4 py-2 border rounded">
              Batal
            </button>
          )}
        </div>
      </div>

      {/* LIST */}
      <div className="bg-white border rounded-xl p-4 space-y-2">
        {menus.map(m => (
          <div
            key={m.id}
            className="flex justify-between items-center border-b last:border-b-0 py-2"
          >
            <div>
              <div className="font-semibold">{m.label}</div>
              <div className="text-xs text-gray-500">
                {m.source === 'manual'
                  ? 'Manual'
                  : `Auto (${m.source})`}
              </div>
            </div>

            <div className="flex gap-2 text-xs">
              <button
                onClick={() => edit(m)}
                className="text-blue-600"
              >
                Edit
              </button>
              <button
                onClick={() => remove(m.id)}
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
