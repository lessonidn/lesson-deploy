import { useParams, Link } from 'react-router-dom'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import 'katex/dist/katex.min.css'
import katex from 'katex'

type Attempt = {
  id: string
  score: number
  total_questions: number
  correct_answers: number
  exam_set_id: string
}

type Choice = {
  id: string
  text: string
  is_correct: boolean
  explanation?: string
}

type Question = {
  id: string
  text: string
  points: number
  choices: Choice[]
  userChoiceId: string | null
}

export default function ResultPage() {
  const { attemptId } = useParams()
  const [attempt, setAttempt] = useState<Attempt | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)

  const loadResult = useCallback(async () => {
    // 1️⃣ ambil attempt dasar
    const { data: attemptData } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('id', attemptId)
      .single()

    if (!attemptData) return

    // 2️⃣ ambil jawaban + soal + pilihan
    const { data: answers } = await supabase
      .from('quiz_answers')
      .select(`
        choice_id,
        questions!inner (
          id,
          text,
          points,
          choices (
            id,
            text,
            is_correct,
            explanation
          )
        )
      `)
      .eq('quiz_attempt_id', attemptId)

    // 3️⃣ normalisasi data
    const mapped =
      (answers?.map(a => {
        // pastikan questions bisa array atau object
        const q = Array.isArray(a.questions) ? a.questions[0] : a.questions
        if (!q) return null
        return {
          id: q.id,
          text: q.text,
          points: q.points,
          choices: q.choices,
          userChoiceId: String(a.choice_id), // pastikan string
        } as Question
      }).filter((q): q is Question => q !== null)) || []

    setQuestions(mapped)

    // 4️⃣ hitung skor, benar, total
    const correctCount = mapped.filter(q => {
      const choice = q.choices.find(c => String(c.id) === q.userChoiceId)
      return choice?.is_correct
    }).length

    const totalQuestions = mapped.length

    const score = mapped.reduce((acc, q) => {
      const choice = q.choices.find(c => String(c.id) === q.userChoiceId)
      return acc + (choice?.is_correct ? q.points : 0)
    }, 0)

    setAttempt({
      ...attemptData,
      correct_answers: correctCount,
      total_questions: totalQuestions,
      score,
    })

    setLoading(false)
  }, [attemptId])

  useEffect(() => {
    loadResult()
  }, [loadResult])

  if (loading) {
    return <div className="p-10 text-center">Loading hasil...</div>
  }

  if (!attempt) {
    return (
      <div className="p-10 text-center text-red-500">
        Data tidak ditemukan
      </div>
    )
  }

  function renderSoal(html: string) {
    const latexRegex = /\$\$(.*?)\$\$/gs
    const replaced = html.replace(latexRegex, (_, expr) =>
      katex.renderToString(expr, { throwOnError: false })
    )
    return (
      <div
        className="prose max-w-none prose-p:my-0 prose-table:my-0 prose-img:my-0
                  [&_td]:p-1 [&_th]:p-1 [&_td]:text-sm [&_tr]:leading-tight
                  [&_img]:max-w-[500px] [&_img]:h-auto [&_img]:mx-auto"
        dangerouslySetInnerHTML={{ __html: replaced }}
      />
    )
  }

  function renderChoice(html: string) {
    if (!html) return null

    let decoded = html.replace(/\\\\/g, '\\')
    decoded = decoded.replace(/<\/?[^>]+(>|$)/g, '')

    const blockRegex = /\$\$([\s\S]*?)\$\$/g
    const inlineRegex = /\$(.+?)\$/g

    const replaced = decoded
  .replace(blockRegex, (_, expr) => {
    try {
      return katex.renderToString(expr.trim(), {
        throwOnError: false,
        displayMode: false,
      })
    } catch {
      return expr
    }
  })
  .replace(inlineRegex, (_, expr) => {
    try {
      return katex.renderToString(expr.trim(), {
        throwOnError: false,
        displayMode: false,
      })
    } catch {
      return expr
    }
  })

    return (
      <div
        className="prose max-w-none prose-p:my-0 prose-img:my-0 text-left"
        dangerouslySetInnerHTML={{ __html: replaced }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <div className="bg-white border-b shadow-sm">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <h1 className="text-2xl font-bold text-indigo-600">
            Hasil Tes
          </h1>
          <p className="text-gray-600 mt-1">
            Skor kamu: <b>{attempt.score}</b> | Benar{' '}
            <b>{attempt.correct_answers}</b> dari{' '}
            <b>{attempt.total_questions}</b>
          </p>
        </div>
      </div>

      {/* REVIEW */}
      <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
        {questions.map((q, idx) => (
          <div
            key={q.id}
            className="rounded-xl border bg-white p-6 shadow-sm"
          >
            <h3 className="font-semibold mb-3">
              {idx + 1}.
            </h3>
            {renderSoal(q.text)}

            <div className="space-y-2">
              {q.choices.map(c => {
                const isUserAnswer = c.id === q.userChoiceId

                return (
                  <div
                    key={c.id}
                    className={`rounded-lg border px-4 py-2 text-sm
                      ${
                        c.is_correct
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : isUserAnswer
                          ? 'border-red-400 bg-red-50 text-red-700'
                          : 'border-gray-200'
                      }`}
                  >
                    {renderChoice(c.text)}
                    {c.is_correct && (
                      <span className="ml-2 font-semibold">(Jawaban Benar)</span>
                    )}
                    {isUserAnswer && !c.is_correct && (
                      <span className="ml-2 font-semibold">(Jawaban Kamu)</span>
                    )}

                    {/* Tambahan: tampilkan penjelasan jawaban benar */}
                    {c.is_correct && c.explanation && (
                      <div className="mt-2 text-gray-600 text-sm">
                        Penjelasan:
                        {c.explanation && renderSoal(c.explanation)}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        <div className="text-center pt-6">
          <Link
            to="/"
            className="inline-block rounded-lg bg-indigo-600 px-6 py-3 text-white hover:bg-indigo-700"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  )
}
