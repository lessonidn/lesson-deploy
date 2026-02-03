import { useEffect, useState } from 'react'
import { useEditor, EditorContent, ReactNodeViewRenderer } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table'
import 'katex/dist/katex.min.css'
import katex from 'katex'
import {
  getQuestions,
  getChoices,
  createChoice,
  updateChoice,
  deleteChoice,
  getExamSets, // ✅ tambahkan API ambil exam_sets
} from '../lib/quizApi'
import { usePreventDoubleClick } from '../lib/usePreventDoubleClick'
import { supabase } from '../../../../src/lib/supabase'
import { uploadImageAsWebP } from '../hooks/useImageUpload'
import MediaPickerModal from '../components/media/MediaPickerModal'
import { Node } from '@tiptap/core'
import ResizableImage from '../lib/ResizableImage'

type ExamSet = {
  id: string
  title: string
  sub_category_id: string
  duration_minutes?: number
  is_published?: boolean
  is_member_only?: boolean
  sub_categories?: {
    id: string
    name: string        // contoh: KELAS 5
    categories?: { id: string; name: string } // contoh: MATEMATIKA
  }
}

type Question = {
  id: string
  text: string
  exam_set_id: string
  exam_title: string
  created_at: string
}

type Choice = {
  id: string
  text: string
  is_correct: boolean
  question_id: string
  explanation?: string
}

// ✅ Custom Image node pakai ResizableImage
const CustomImage = Node.create({
  name: 'customImage',
  group: 'block',
  inline: false,
  draggable: true,
  atom: false, // ✅ PENTING: HARUS FALSE

  addAttributes() {
    return {
      src: { default: null },
      width: { default: 120 },
      height: { default: 90 },
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



export default function Choices() {
  const [examSets, setExamSets] = useState<ExamSet[]>([])
  const [examId, setExamId] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [questionId, setQuestionId] = useState('')
  const [choiceHtml, setChoiceHtml] = useState('')
  const [correct, setCorrect] = useState(false)
  const [explanation, setExplanation] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [choices, setChoices] = useState<Choice[]>([])
  const [editId, setEditId] = useState<string | null>(null)
  const { canClick } = usePreventDoubleClick()
  const [showMediaPicker, setShowMediaPicker] = useState(false)
  const [showMediaPickerChoice, setShowMediaPickerChoice] = useState(false)


  const unicodeSymbols = [
    "√", "∛", "∜", "∑", "π", "∞", "Δ", "Ω",
    "α", "β", "γ", "θ", "μ", "λ", "σ", "φ", "ψ",
    "∫", "≈", "≠", "≤", "≥", "÷", "×", "±", "∠",
  ]
  const [showSymbols, setShowSymbols] = useState(false)

  useEffect(() => {
    async function loadData() {
      const { data: examData } = await getExamSets()
      setExamSets(examData || [])

      const { data: questionData, error } = await getQuestions()
      if (error) {
        setError(error.message)
      } else {
        setQuestions(questionData || [])
      }
    }

    loadData()
  }, [])

  async function loadChoices(qid: string) {
    const { data, error } = await getChoices(qid)
    if (error) setError(error.message)
    else setChoices(data || [])
  }

  async function save() {
    if (!questionId || !choiceHtml) return
    if (!canClick()) return

    const cleanedText = cleanHtmlTail(choiceHtml)
    const cleanedExplanation = cleanHtmlTail(explanation)

    if (editId) {
      const { error } = await updateChoice(editId, cleanedText, correct, cleanedExplanation)
      if (error) setError(error.message)
      setEditId(null)
    } else {
      const { error } = await createChoice(questionId, cleanedText, correct, cleanedExplanation)
      if (error) setError(error.message)
    }

    setChoiceHtml('')
    setCorrect(false)
    setExplanation('')
    loadChoices(questionId)
    choiceEditor?.commands.setContent(`<p><br></p>`)
  }

  async function remove(id: string) {
    const { error } = await deleteChoice(id)
    if (error) setError(error.message)
    loadChoices(questionId)
  }

  function cancelEdit() {
    setEditId(null)
    setChoiceHtml('')
    setCorrect(false)
    setExplanation('')
    explanationEditor?.commands.setContent(`<p><br></p>`) // ✅ reset editor visual
  }

  //--- UNTUK ISI RUMUS ---
  function renderSoal(html: string) {
  const latexRegex = /\$\$(.*?)\$\$/gs
  const replaced = html.replace(latexRegex, (_, expr) =>
    katex.renderToString(expr, { throwOnError: false })
  )
  return (
    <div
      className="prose max-w-none prose-p:my-0 prose-table:my-0 prose-img:my-0.5 [&_td]:p-1 [&_th]:p-1 [&_td]:text-sm [&_tr]:leading-tight [&_img]:max-w-[120px] [&_img]:h-auto [&_img]:mx-auto"
      dangerouslySetInnerHTML={{ __html: replaced }}
    />
  )
}

function renderExplanation(html: string) {
  const latexRegex = /\$\$(.*?)\$\$/gs
  const replaced = html.replace(latexRegex, (_, expr) =>
    katex.renderToString(expr, { throwOnError: false, displayMode: false, })
  )
  return (
    <div
      className=" explanation-content prose max-w-none prose-p:my-0 prose-table:my-0 prose-img:my-0.5 [&_td]:p-1 [&_th]:p-1 [&_td]:text-sm [&_tr]:leading-tight [&_img]:max-w-[120px] [&_img]:h-auto [&_img]:mx-auto"
      dangerouslySetInnerHTML={{ __html: replaced }}
    />
  )
}

function renderLatexBlocks(html: string) {
  const blockRegex = /\$\$([\s\S]*?)\$\$/g // ✅ tangkap semua isi antar $$...$$ termasuk newline
  const replaced = html.replace(blockRegex, (_, expr) =>
    katex.renderToString(expr.trim(), {
      throwOnError: false,
      displayMode: false,
    })
  )
  return (
    <div
      className="prose max-w-none prose-p:my-0 prose-img:my-0"
      dangerouslySetInnerHTML={{ __html: replaced }}
    />
  )
}


function cleanHtmlTail(html: string) {
  // Hapus <p><br></p> atau <p></p> di akhir
  return html.replace(/(<p>(<br\s*\/?>)?<\/p>\s*)+$/g, '')
}

  // --- textarea penjelasan ---
  const explanationEditor = useEditor({
    extensions: [
      StarterKit,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      CustomImage,
    ],
    content: `<p><br></p>`, // default tinggi editor
    onUpdate: ({ editor }) => {
      setExplanation(editor.getHTML())
    },
  })

  /* ==== INSERT GAMBAR ==== */
  const choiceEditor = useEditor({
    extensions: [
      StarterKit,
      CustomImage,
    ],
    content: `<p><br></p>`,
    onUpdate: ({ editor }) => {
      setChoiceHtml(editor.getHTML())
    },
  })


  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold mb-4">Choices</h2>

      {/* Filter exam set */}
      <select
        className="border px-3 py-2 rounded w-full md:w-1/2"
        value={examId}
        onChange={e => {
          setExamId(e.target.value)
          setQuestionId('')
          setChoices([])
        }}
      >
        <option value="">Pilih Lembar Soal</option>
        {examSets.map(ex => (
          <option key={ex.id} value={ex.id}>
            {ex.title}
            {ex.sub_categories?.name ? ` -- ${ex.sub_categories.name}` : ''}
            {ex.sub_categories?.categories?.name ? ` -- ${ex.sub_categories.categories.name}` : ''}
          </option>
        ))}
      </select>

      {/* Dropdown soal sesuai exam */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <select
          className="border px-3 py-2 rounded w-full"
          value={questionId}
          onChange={e => {
            const newId = e.target.value
            setQuestionId(newId)

            // ✅ hanya reset kalau sedang edit
            if (editId) {
              setEditId(null)
              setChoiceHtml('')
              setCorrect(false)
              setExplanation('')
              explanationEditor?.commands.setContent(`<p><br></p>`)
            }

            if (newId) {
              loadChoices(newId)
            }
          }}
        >
          <option value="">Pilih Soal</option>
          {questions
            .filter(q => !examId || q.exam_set_id === examId)
            .map(q => (
              <option key={q.id} value={q.id} title={q.text}>
                {q.text.length > 50 ? q.text.slice(0, 50) + '...' : q.text}
              </option>
            ))}
        </select>

        <div className="border rounded w-full md:col-span-2 bg-white">
          <EditorContent
            editor={choiceEditor}
            className="min-h-[40px] p-2 focus:outline-none max-w-none
                      prose-p:my-0 prose-img:my-1
                      [&_img]:max-w-full [&_img]:h-auto"
            placeholder="Jawaban (boleh teks, rumus, atau paste gambar)"
          />

          {/* Upload gambar kecil */}
          <div className="flex justify-end gap-3 border-t px-2 py-1 bg-gray-50">
            <label className="text-xs cursor-pointer hover:text-indigo-600">
              🖼 Upload
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={async e => {
                  const file = e.target.files?.[0]
                  if (!file) return

                  const path = await uploadImageAsWebP(file, 'choices')
                  const { data } = supabase.storage
                    .from('media')
                    .getPublicUrl(path)

                  choiceEditor?.chain().focus().insertContent({
                    type: 'customImage',
                    attrs: { src: data.publicUrl, width: 120, height: 90 },
                  }).run()

                  e.target.value = ''
                }}
              />
            </label>

            <button
              type="button"
              onClick={() => setShowMediaPickerChoice(true)}
              className="text-xs hover:text-indigo-600"
            >
              🗂 Media
            </button>
            
            <MediaPickerModal
              open={showMediaPickerChoice}
              onClose={() => setShowMediaPickerChoice(false)}
              onSelect={(url) => {
                setShowMediaPickerChoice(false)
                choiceEditor?.chain().focus().insertContent({
                  type: 'customImage',
                  attrs: {
                    src: url,
                    width: 120,   // default kecil
                    height: 90,
                  },
                }).run()
              }}
            />

          </div>
        </div>

        <label className="flex items-center gap-1 w-full">
          <input
            type="checkbox"
            checked={correct}
            onChange={e => setCorrect(e.target.checked)}
          />
          Kunci Jawaban
        </label>
      </div>

      {/* Editor penjelasan jawaban */}
      <div className="editor-preview border rounded bg-white mt-2">
        <p className="text-center text-sky-600 mt-2">
         Penjelasan Kunci Jawaban </p>
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b p-2 bg-gray-50">
          <button onClick={() => explanationEditor?.chain().focus().toggleBold().run()}
            className="px-3 py-1 rounded hover:bg-gray-200 transition text-sm font-semibold">B</button>
          <button onClick={() => explanationEditor?.chain().focus().toggleItalic().run()}
            className="px-3 py-1 rounded hover:bg-gray-200 transition text-sm italic">I</button>
          <button onClick={() => explanationEditor?.chain().focus().toggleUnderline().run()}
            className="px-3 py-1 rounded hover:bg-gray-200 transition text-sm underline">U</button>
          <button onClick={() => explanationEditor?.chain().focus().toggleBulletList().run()}
            className="px-3 py-1 rounded hover:bg-gray-200 transition text-sm">• List</button>
          <button onClick={() => {
              const rows = parseInt(prompt('Jumlah baris?') || '3', 10)
              const cols = parseInt(prompt('Jumlah kolom?') || '3', 10)
              explanationEditor?.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run()
            }}
            className="px-3 py-1 rounded hover:bg-gray-200 transition text-sm">⌗ Table</button>
          <button onClick={() => explanationEditor?.chain().focus().insertContent('$$a^2 + b^2 = c^2$$').run()}
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

                explanationEditor?.chain().focus().insertContent({
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
              explanationEditor?.chain().focus().insertContent({
                type: 'customImage',
                attrs: { src: url, width: 120, height: 90 },
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
                  explanationEditor?.chain().focus().insertContent(sym).run()
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
          editor={explanationEditor}
          placeholder="Penjelasan Jawaban (opsional)"
          className="min-h-[150px] p-3 focus:outline-none"
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

      {error && <p className="text-red-500">{error}</p>}

      {questionId && (
        <>
          {/* ✅ Preview soal yang dipilih */}
          <div className="border rounded bg-white p-3 mt-2">
            <h4 className="text-sm font-semibold mb-2">Preview Soal</h4>
            {renderSoal(questions.find(q => q.id === questionId)?.text || '')}
          </div>

          {/* ✅ Daftar pilihan jawaban */}
          <ul className="bg-white border rounded divide-y">
            {choices.map(c => (
              <li key={c.id} className="p-3 flex justify-between items-start">
                <div className="max-w-[80%]">
                  <div className="text-base">
                    {renderLatexBlocks(c.text)}
                    {c.is_correct && (
                      <span className="text-green-600 font-semibold">✔</span>
                    )}
                  </div>
                  {c.explanation && (
                    <div className="text-gray-500 text-sm mt-2">
                      {renderExplanation(c.explanation)}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditId(c.id)
                      setChoiceHtml(c.text)
                      setCorrect(c.is_correct)
                      setExplanation(c.explanation || '')
                      choiceEditor?.commands.setContent(c.text)
                      explanationEditor?.commands.setContent(c.explanation || `<p></p><p></p><p><br></p><p><br></p>`)
                      window.scrollTo({ top: 0, behavior: 'smooth' }) // ✅ scroll ke atas otomatis
                    }}
                    className="px-2 py-1 bg-yellow-500 text-white rounded text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Apakah Anda yakin ingin menghapus Jawaban ini?`)) {
                        remove(c.id)
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
        </>
      )}
    </div>
  )
}