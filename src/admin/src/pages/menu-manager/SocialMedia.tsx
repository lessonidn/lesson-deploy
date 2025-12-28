import { useEffect, useState } from 'react'
import { supabase } from '../../../../lib/supabase'
import {
  Facebook,
  Instagram,
  Youtube,
  Music,
  LucideIcon,
} from 'lucide-react'

type SocialLink = {
  id: string
  platform: string
  url: string
  icon: string
  is_active: boolean
  order_index: number
}

/* ICON MAP */
const ICONS: Record<string, LucideIcon> = {
  facebook: Facebook,
  instagram: Instagram,
  youtube: Youtube,
  tiktok: Music, // lucide belum punya tiktok resmi
}


export default function SocialMedia() {
  const [items, setItems] = useState<SocialLink[]>([])
  const [platform, setPlatform] = useState('facebook')
  const [url, setUrl] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const { data } = await supabase
      .from('social_links')
      .select('*')
      .order('order_index')

    setItems(data || [])
  }

  async function save() {
    if (!url) return

    const payload = {
      platform,
      url,
      icon: platform,
    }

    if (editingId) {
      await supabase
        .from('social_links')
        .update(payload)
        .eq('id', editingId)
    } else {
      await supabase.from('social_links').insert({
        ...payload,
        order_index: items.length + 1,
      })
    }

    reset()
    load()
  }

  function edit(item: SocialLink) {
    setEditingId(item.id)
    setPlatform(item.platform)
    setUrl(item.url)
  }

  async function remove(id: string) {
    if (!confirm('Hapus social media ini?')) return
    await supabase.from('social_links').delete().eq('id', id)
    load()
  }

  async function toggle(id: string, value: boolean) {
    await supabase
      .from('social_links')
      .update({ is_active: value })
      .eq('id', id)
    load()
  }

  function reset() {
    setEditingId(null)
    setPlatform('facebook')
    setUrl('')
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Social Media</h1>

      {/* FORM */}
      <div className="bg-white border rounded-xl p-4 space-y-3">
        <select
          className="border p-2 rounded"
          value={platform}
          onChange={e => setPlatform(e.target.value)}
        >
          <option value="facebook">Facebook</option>
          <option value="instagram">Instagram</option>
          <option value="tiktok">TikTok</option>
          <option value="youtube">YouTube</option>
        </select>

        <input
          className="border p-2 w-full rounded"
          placeholder="https://..."
          value={url}
          onChange={e => setUrl(e.target.value)}
        />

        <div className="flex gap-2">
          <button
            onClick={save}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            {editingId ? 'Update' : 'Tambah'}
          </button>

          {editingId && (
            <button
              onClick={reset}
              className="px-4 py-2 border rounded"
            >
              Batal
            </button>
          )}
        </div>
      </div>

      {/* LIST */}
      <div className="bg-white border rounded-xl divide-y">
        {items.map(item => {
          const Icon = ICONS[item.icon]
          return (
            <div
              key={item.id}
              className="p-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                {Icon && <Icon size={18} />}
                <div>
                  <div className="font-medium capitalize">
                    {item.platform}
                  </div>
                  <div className="text-xs text-gray-500">
                    {item.url}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 text-xs">
                <button
                  onClick={() => toggle(item.id, !item.is_active)}
                  className={`px-2 py-1 rounded ${
                    item.is_active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {item.is_active ? 'Active' : 'Hidden'}
                </button>

                <button
                  onClick={() => edit(item)}
                  className="text-blue-600"
                >
                  Edit
                </button>

                <button
                  onClick={() => remove(item.id)}
                  className="text-red-600"
                >
                  Hapus
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}