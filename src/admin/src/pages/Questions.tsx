import { useEffect, useState } from 'react'
import { useEditor, EditorContent, ReactNodeViewRenderer } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table'
import 'katex/dist/katex.min.css'
import katex from 'katex'
import { Node } from '@tiptap/core'
import ResizableImage from '../lib/ResizableImage'
import {
  getExamSets,
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,     // ✅ tambahkan
} from '../lib/quizApi'
import { deleteImageFromSupabase } from '../lib/deleteImage'
import { usePreventDoubleClick } from '../lib/usePreventDoubleClick'
import { uploadImageAsWebP } from '../hooks/useImageUpload'
import { supabase } from '../../../../src/lib/supabase'
import MediaPickerModal from '../components/media/MediaPickerModal'


type ExamSet = {
  id: string
  title: string
}

type Question = {
  id: string
  text: string
  exam_set_id: string
  exam_title: string
  exam_set?: ExamSet
}

/* =========================
   HELPER (AMAN)
========================= */
function publicUrlToPath(url: string): string {
  try {
    const u = new URL(url)
    const idx = u.pathname.indexOf('/media/')
    if (idx === -1) return url
    return u.pathname.substring(idx + 7)
  } catch {
    return url
  }
}

// ✅ Custom Image node pakai ResizableImage
const CustomImage = Node.create({
  name: 'customImage',
  group: 'block',
  inline: false,
  draggable: true,
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      width: { default: 200 },
      height: { default: 150 },
    }
  },

  parseHTML() {
    return [{ tag: 'img[src]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', HTMLAttributes]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImage)
  },
})

export default function Questions() {
  const [sets, setSets] = useState<ExamSet[]>([])
  const [items, setItems] = useState<Question[]>([])
  const [text, setText] = useState('')
  const [setId, setSetId] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { canClick } = usePreventDoubleClick()
  const [search, setSearch] = useState('')
  const [showMediaPicker, setShowMediaPicker] = useState(false)

  // -- fitur copy soal ---
  const [copySource, setCopySource] = useState<Question | null>(null)
  const [copyTargetSetId, setCopyTargetSetId] = useState('')

  const unicodeSymbols = [
    "√", "∛", "∜", "∑", "π", "∞", "Δ", "Ω",
    "α", "β", "γ", "θ", "μ", "λ", "σ", "φ", "ψ",
    "∫", "≈", "≠", "≤", "≥", "÷", "×", "±", "∠",
  ]
  const [showSymbols, setShowSymbols] = useState(false)

  async function load() {
    const { data: setsData, error: setsError } = await getExamSets()
    const { data: questionsData, error: questionsError } = await getQuestions()

    if (setsError || questionsError) {
      setError(setsError?.message || questionsError?.message || 'Gagal memuat data')
    } else {
      setSets(setsData || [])
      setItems((questionsData || []).sort((a, b) => b.id.localeCompare(a.id)))
    }
  }

  async function save() {
    if (!setId) {
      setError('⚠️ Silakan pilih lembar soal terlebih dahulu.')
      return
    }
    if (!text) return
    if (!canClick()) return

    if (editId) {
      const oldQuestion = items.find(q => q.id === editId)
      if (oldQuestion) {
        const regex = /<img[^>]+src="([^">]+)"/g
        let match
        while ((match = regex.exec(oldQuestion.text)) !== null) {
          const oldUrl = match[1]
          if (!text.includes(oldUrl)) {
            await deleteImageFromSupabase(publicUrlToPath(oldUrl))
          }
        }
      }

      const { error } = await updateQuestion(editId, text, setId)
      if (error) setError(error.message)
      setEditId(null)
    } else {
      const { error } = await createQuestion(text, setId)
      if (error) setError(error.message)
    }

    setText('')
    setError(null)
    editor?.commands.setContent(`<p></p><p></p><p><br></p><p><br></p>`)
    load()
  }

  async function remove(id: string) {
    const q = items.find(item => item.id === id)
    if (q) {
      const regex = /<img[^>]+src="([^">]+)"/g
      let match
      while ((match = regex.exec(q.text)) !== null) {
        await deleteImageFromSupabase(publicUrlToPath(match[1]))
      }
    }

    const { error } = await deleteQuestion(id)
    if (error) setError(error.message)
    load()
  }

  function cancelEdit() {
    setEditId(null)
    setText('')
    editor?.commands.clearContent()
  }

  useEffect(() => {
    load()
  }, [])

  const filteredItems = items
    .filter(q => (setId ? q.exam_set_id === setId : true))
    .filter(q => q.text.toLowerCase().includes(search.toLowerCase()))

  function renderSoal(html: string) {
    const latexRegex = /\$\$(.*?)\$\$/gs
    const replaced = html.replace(latexRegex, (_, expr) =>
      katex.renderToString(expr, { throwOnError: false })
    )
    return (
      <div
        className="prose max-w-none prose-p:my-0 prose-table:my-0 prose-img:my-0"
        dangerouslySetInnerHTML={{ __html: replaced }}
      />
    )
  }

  const editor = useEditor({
    extensions: [
      StarterKit,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      CustomImage,
    ],
    content: `<p></p><p></p><p><br></p><p><br></p>`,
    onUpdate: ({ editor }) => setText(editor.getHTML()),
  })

  return (
    <div className="space-y-4 bg-gray-50 min-h-screen p-4 sm:p-6">
      <h2 className="text-xl font-semibold">Questions</h2>

      <div className="flex flex-col gap-2">
        <select
          className="border px-3 py-2 rounded max-w-xs truncate"
          value={setId}
          onChange={e => {
            const newSetId = e.target.value
            setSetId(newSetId)

            // ✅ kalau sedang edit, jangan clear editor (biar bisa pindah soal ke lembar lain)
            if (!editId) {
              setText('')
              editor?.commands.setContent(`<p></p><p></p><p><br></p><p><br></p>`)
            }
          }}
        >
          <option value="">Pilih Lembar Soal</option>
          {sets.map(s => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
        
        {/* ✅ Editor TipTap */}
        <div className="editor-preview border rounded bg-white">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2 border-b p-2 bg-gray-50">
            <button onClick={() => editor?.chain().focus().toggleBold().run()}
              className="px-3 py-1 rounded hover:bg-gray-200 transition text-sm font-semibold">B</button>
            <button onClick={() => editor?.chain().focus().toggleItalic().run()}
              className="px-3 py-1 rounded hover:bg-gray-200 transition text-sm italic">I</button>
            <button onClick={() => editor?.chain().focus().toggleUnderline().run()} 
              className="px-3 py-1 rounded hover:bg-gray-200 transition text-sm underline">U</button>
            <button onClick={() => editor?.chain().focus().toggleBulletList().run()}
              className="px-3 py-1 rounded hover:bg-gray-200 transition text-sm">• List</button>
            <button onClick={() => {
                const rows = parseInt(prompt('Jumlah baris?') || '3', 10)
                const cols = parseInt(prompt('Jumlah kolom?') || '3', 10)
                editor?.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run()
              }}
              className="px-3 py-1 rounded hover:bg-gray-200 transition text-sm">⌗ Table</button>
            <button onClick={() => editor?.chain().focus().insertContent('$$a^2 + b^2 = c^2$$').run()}
              className="px-3 py-1 rounded hover:bg-gray-200 transition text-sm">∑ Rumus</button>

            {/* Insert Gambar */}
            <label className="px-3 py-1 rounded hover:bg-gray-200 transition text-sm cursor-pointer">
              🖼 Gambar
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={async e => {
                  const file = e.target.files?.[0]
                  if (!file) return

                  const path = await uploadImageAsWebP(file, 'questions')
                  const { data } = supabase.storage
                    .from('media')
                    .getPublicUrl(path)

                  editor?.chain().focus().insertContent({
                    type: 'customImage',
                    attrs: { src: data.publicUrl, width: 200, height: 150 },
                  }).run()

                  e.target.value = ''
                }}
              />
            </label>

            <button
              onClick={() => setShowMediaPicker(true)}
              className="px-3 py-1 rounded hover:bg-gray-200 transition text-sm"
            >
              🗂 Media
            </button>

            <MediaPickerModal
              open={showMediaPicker}
              onClose={() => setShowMediaPicker(false)}
              onSelect={(url) => {
                setShowMediaPicker(false)
                editor?.chain().focus().insertContent({
                  type: 'customImage',
                  attrs: { src: url, width: 200, height: 150 },
                }).run()
              }}
            />

            {/* ✅ Tombol Unicode */}
            <button
              onClick={() => setShowSymbols(!showSymbols)}
              className="px-3 py-1 rounded hover:bg-gray-200 transition text-sm"
            >
              🔣 Unicode
            </button>
          </div>

          {/* Panel simbol Unicode */}
          {showSymbols && (
            <div className="flex flex-wrap gap-2 p-2 bg-gray-100 border-b">
              {unicodeSymbols.map(sym => (
                <button
                  key={sym}
                  onClick={() => {
                    editor?.chain().focus().insertContent(sym).run()
                    setShowSymbols(false)
                  }}
                  className="px-2 py-1 rounded bg-white hover:bg-gray-200 text-lg"
                >
                  {sym}
                </button>
              ))}
            </div>
          )}

          {/* Editor area */}
          <EditorContent
            editor={editor}
            placeholder="Tulis soal di sini..."
            className="min-h-[300px] p-3 focus:outline-none"
          />
        </div>

        {/* Info KaTeX */}
        <p className="text-xs text-gray-500 mt-2">
          Untuk daftar lengkap sintaks Rumus LaTeX yang didukung, lihat di{' '}
          <a
            href="https://katex.org/docs/supported.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            KaTeX Supported Functions
          </a>.
        </p>

        <div className="flex flex-wrap gap-2 mt-2">
          <button
            onClick={save}
            className="bg-indigo-600 text-white px-4 py-2 rounded"
          >
            {editId ? 'Update' : 'Tambah'}
          </button>

          {editId && (
            <button
              onClick={cancelEdit}
              className="bg-gray-400 text-white px-4 py-2 rounded"
            >
              Batal
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-red-500">{error}</p>}

      {/* ✅ Info jumlah soal + Search */}
      <div className="flex justify-between items-center text-sm text-gray-600">
        <span>
          {setId
            ? `Jumlah soal di lembar "${sets.find(s => s.id === setId)?.title || '-'}": ${filteredItems.length}`
            : `Total semua soal: ${filteredItems.length}`}
        </span>

        <div className="relative w-1/3">
          <input
            type="text"
            placeholder="Cari soal..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border px-3 py-1 rounded w-full text-sm pr-8"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 text-sm"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded shadow bg-white">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 text-center">
              <th className="p-2 border w-2/3">Soal - Soal</th>
              <th className="p-2 border w-1/3">Lembar Soal</th>
              <th className="p-2 border">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map(q => (
              <tr
                key={q.id}
                className="hover:bg-yellow-300 transition-colors"
              >
                <td className="p-2 border">
                  {renderSoal(q.text)}
                </td>
                <td
                  className="p-2 border text-sm text-gray-600 text-center truncate max-w-[200px]"
                  title={q.exam_title}
                >
                  <span className="inline-block px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs">
                    {q.exam_title || '-'}
                  </span>
                </td>
               <td className="p-2 border">
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditId(q.id)
                      setText(q.text)
                      setSetId(q.exam_set_id)
                      editor?.commands.setContent(q.text)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    className="px-2 py-1 bg-yellow-500 text-white rounded text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Apakah Anda yakin ingin menghapus Soal ini?`)) {
                        remove(q.id)
                      }
                    }}
                    className="px-2 py-1 bg-red-600 text-white rounded text-sm"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setCopySource(q)}
                    className="px-2 py-1 bg-green-600 text-white rounded text-sm"
                  >
                    Copy
                  </button>
                </div>
              </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {copySource && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded shadow-lg p-4 w-full max-w-md space-y-4">
              <h3 className="font-semibold">Copy Soal</h3>
              <p className="text-sm text-gray-600">Pilih lembar tujuan untuk menyalin soal:</p>

              <select
                className="border px-3 py-2 rounded w-full"
                value={copyTargetSetId}
                onChange={e => setCopyTargetSetId(e.target.value)}
              >
                <option value="">-- Pilih Lembar Tujuan --</option>
                {sets.map(s => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>

              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    if (!copyTargetSetId) {
                      alert('Pilih lembar tujuan dulu')
                      return
                    }

                    // ✅ buat soal baru di lembar tujuan
                    const { data: newQuestionData, error: newQuestionError } = await createQuestion(
                      copySource!.text,
                      copyTargetSetId
                    )

                    if (newQuestionError) {
                      alert(`Gagal membuat soal baru: ${newQuestionError.message}`)
                      return
                    }

                    // Supabase bisa return array atau single object tergantung implementasi quizApi
                    const newQuestion =
                      Array.isArray(newQuestionData) ? newQuestionData[0] : newQuestionData

                    if (!newQuestion?.id) {
                      alert('Gagal mendapatkan ID soal baru setelah insert.')
                      return
                    }

                    // ✅ langsung update state items agar soal baru muncul tanpa reload
                    setItems(prev => [
                      { 
                        id: newQuestion.id,
                        text: newQuestion.text,
                        exam_set_id: newQuestion.exam_set_id,
                        exam_title: sets.find(s => s.id === newQuestion.exam_set_id)?.title || ''
                      },
                      ...prev
                    ])

                    alert('Soal berhasil dicopy ke lembar tujuan')

                    // reset state modal
                    setCopySource(null)
                    setCopyTargetSetId('')
                  }}
                  className="bg-indigo-600 text-white px-4 py-2 rounded"
                >
                  Confirm Copy
                </button>
                <button
                  onClick={() => {
                    setCopySource(null)
                    setCopyTargetSetId('')
                  }}
                  className="bg-gray-400 text-white px-4 py-2 rounded"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}