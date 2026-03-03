import { useParams, Link } from 'react-router-dom'
import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import 'katex/dist/katex.min.css'
import katex from 'katex'
import type { User } from '@supabase/supabase-js'


/* ================= TYPES ================= */

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



/* ================= COMPONENT ================= */

export default function ResultPage() {
  const { attemptId } = useParams()
  const [attempt, setAttempt] = useState<Attempt | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  
  const [rating, setRating] = useState<number>(0)
  const [comment, setComment] = useState('')
  const [user, setUser] = useState<User | null>(null)

  const [submitting, setSubmitting] = useState(false)

  const commentSectionRef = useRef<HTMLDivElement | null>(null)
  const [avgRating, setAvgRating] = useState<number | null>(null)
  const [existingFeedbackId, setExistingFeedbackId] = useState<string | null>(null)

 /* === CEK LOGIN GMAIL KOMENTAR ==== */
  useEffect(() => {
    let isMounted = true

    const handleUser = (currentUser: User | null) => {
      if (!isMounted) return
      setUser(currentUser)
    }

    supabase.auth.getUser().then(({ data }) => {
      handleUser(data.user)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      handleUser(session?.user ?? null)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  //== load feedback user login ==//
  useEffect(() => {
    if (!user || !attempt) return

    const examSetId = attempt.exam_set_id

    const userId = user.id  // 🔥 simpan ke variable lokal

    async function loadUserFeedback() {
      const { data, error } = await supabase
    .from('exam_feedback')
    .select('*')
    .eq('exam_set_id', examSetId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.log(error)
    return
  }

  if (data) {
    setExistingFeedbackId(data.id)
    setRating(data.rating)
    setComment(data.comment || '')
  } else {
    // 🔥 reset jika user belum pernah review
    setExistingFeedbackId(null)
    setRating(0)
    setComment('')
  }
  }

    loadUserFeedback()
  }, [user, attempt])

  const loadResult = useCallback(async () => {
    const { data: attemptData } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('id', attemptId)
      .single()

    if (!attemptData) return

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

    const mapped =
      (answers?.map(a => {
        const q = Array.isArray(a.questions) ? a.questions[0] : a.questions
        if (!q) return null
        return {
          id: q.id,
          text: q.text,
          points: q.points,
          choices: q.choices,
          userChoiceId: String(a.choice_id),
        } as Question
      }).filter((q): q is Question => q !== null)) || []

    setQuestions(mapped)

    const correctCount = mapped.filter(q => {
      const choice = q.choices.find(c => String(c.id) === q.userChoiceId)
      return choice?.is_correct
    }).length

    const score = mapped.reduce((acc, q) => {
      const choice = q.choices.find(c => String(c.id) === q.userChoiceId)
      return acc + (choice?.is_correct ? q.points : 0)
    }, 0)

    setAttempt({
      ...attemptData,
      correct_answers: correctCount,
      total_questions: mapped.length,
      score,
    })

    setLoading(false)
  }, [attemptId])

  useEffect(() => {
    loadResult()
  }, [loadResult])

  //=== RATA-RATA RATING ===//
  useEffect(() => {
    if (!attempt) return

    const examSetId = attempt.exam_set_id  // 🔥 ambil dulu ke variable lokal

    async function loadRating() {
      const { data } = await supabase
        .from('exam_feedback')
        .select('rating')
        .eq('exam_set_id', examSetId)

      if (!data || data.length === 0) {
        setAvgRating(null)
        return
      }

      const total = data.reduce((sum, r) => sum + r.rating, 0)
      setAvgRating(Math.round((total / data.length) * 10) / 10)
    }

    loadRating()
  }, [attempt])
  
  useEffect(() => {
    const shouldScroll = sessionStorage.getItem('scrollToComment')

    if (
      shouldScroll === 'true' &&
      user &&
      !loading &&
      commentSectionRef.current
    ) {
      setTimeout(() => {
        if (commentSectionRef.current) {
          const top = commentSectionRef.current.offsetTop
          window.scrollTo({ top, behavior: 'auto' })
        }
        sessionStorage.removeItem('scrollToComment')
      }, 200)
    }
  }, [user, loading])

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

  /* ================== JANGAN DIUBAH ================== */

  function renderSoal(html: string) {
    const latexRegex = /\$\$(.*?)\$\$/gs
    const replaced = html.replace(latexRegex, (_, expr) =>
      katex.renderToString(expr, { throwOnError: false })
    )
    return (
      <div
        className="prose max-w-none prose-p:my-0 prose-table:my-0 prose-img:my-0
                  [&_td]:p-1 [&_th]:p-1 [&_td]:text-sm [&_tr]:leading-tight
                  [&_img]:max-w-[300px] [&_img]:h-auto [&_img]:mx-auto"
        dangerouslySetInnerHTML={{ __html: replaced }}
      />
    )
  }

  function renderChoice(html: string) {
    if (!html) return null

    const latexBlock = /\$\$([\s\S]*?)\$\$/g
    const latexInline = /\$(.+?)\$/g

    const replaced = html
      .replace(latexBlock, (_, expr) =>
        katex.renderToString(expr.trim(), {
          throwOnError: false,
          displayMode: false,
        })
      )
      .replace(latexInline, (_, expr) =>
        katex.renderToString(expr.trim(), {
          throwOnError: false,
          displayMode: false,
        })
      )

    return (
      <div
        className="
          prose max-w-none
          prose-p:my-1
          prose-img:my-3
          prose-img:mx-auto
          prose-img:rounded-lg
          prose-img:max-w-[360px]
          prose-img:w-full
          prose-img:h-auto
          prose-table:text-sm
          text-left
        "
        dangerouslySetInnerHTML={{ __html: replaced }}
      />
    )
  }


  /* ================== CELEBRATION LOGIC ================== */

  const percentage = Math.round(
    (attempt.correct_answers / attempt.total_questions) * 100
  )

  const title =
    percentage >= 85
      ? 'Prestasi Sangat Baik'
      : percentage >= 70
      ? 'Hasil Baik'
      : percentage >= 50
      ? 'Cukup Baik'
      : 'Perlu Latihan'

  /* ================== UI ================== */

  return (
    <div className="min-h-screen bg-gray-50 relative">

      {/* CONFETTI */}
      {percentage >= 60 && (
        <div className="pointer-events-none absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <span
              key={i}
              className="absolute top-0 animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                backgroundColor: ['#6366f1', '#22c55e', '#facc15', '#fa153bff', '#15fa8bff'][i % 5],
                animationDelay: `${Math.random()}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* HEADER / PIAGAM */}
      <div className="bg-white border-b shadow-sm">
        <div className="mx-auto max-w-4xl px-4 py-8 text-center">
          <div className="inline-block rounded-2xl border bg-gradient-to-br from-indigo-50 to-white px-8 py-6 shadow">
            <div className="text-3xl mb-2">🎓</div>
            <h1 className="text-2xl font-bold text-indigo-600">
              {title}
            </h1>
            <p className="mt-1 text-gray-600">
              Skor: <b>{attempt.score}</b> • Benar{' '}
              <b>{attempt.correct_answers}</b> dari{' '}
              <b>{attempt.total_questions}</b>
            </p>

            <div className="mt-4 text-4xl font-extrabold text-indigo-700">
              {percentage}%
            </div>

            <div className="mt-4 h-3 w-full rounded-full bg-gray-200 overflow-hidden">
              <div
                className="h-full bg-indigo-600 transition-all duration-700"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="text-center pt-6">
          <Link
            to="/category"
            className="inline-block rounded-lg bg-indigo-600 px-6 py-3 text-white hover:bg-indigo-700"
          >
            Kembali ke Daftar Mata Pelajaran
          </Link>
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
                    {/* LABEL */}
                    {isUserAnswer && !c.is_correct && (
                      <div className="mb-6 text-xm font-semibold text-red-600">
                        ( Jawaban Kamu )
                      </div>
                    )}

                    {c.is_correct && (
                      <div className="mb-6 text-xm font-semibold text-green-600">
                        Jawaban Benar
                      </div>
                    )}

                    {/* KONTEN JAWABAN (TEXT / GAMBAR) */}
                    {renderChoice(c.text)}


                    {c.is_correct && c.explanation && (
                      <div className="explanation-content mt-3 rounded-lg bg-gray-50 border px-3 py-2 text-sm">
                        <div className="font-semibold text-gray-700 mb-4 border-b-2 border-indigo-100">
                          Penjelasan:
                        </div>
                        {renderSoal(c.explanation)}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        <div className="text-center">
          <Link
            to="/category"
            className="inline-block rounded-lg bg-indigo-600 px-6 py-3 text-white hover:bg-indigo-700"
          >
            Kembali ke Daftar Mata Pelajaran
          </Link>
        </div>

        {/* ===== RATING & KOMENTAR LEMBAR SOAL ===== */}
        {avgRating && (
          <div className="mt-2 text-sm text-gray-600">
            ⭐ Rating rata-rata: <b>{avgRating}</b> / 5
          </div>
        )}
        <div
          id="comment"
          ref={commentSectionRef}
          className="mt-12 rounded-2xl border bg-white p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-gray-800">
            ⭐ Penilaian & Masukan
          </h3>

          <p className="mt-1 text-sm text-gray-600">
            Nilai keseluruhan kualitas soal dan berikan masukan singkat.
          </p>

          {!user ? (
            <div className="mt-4 rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-800">
              <p className="font-medium">
                🔒 Login diperlukan
              </p>
              <p className="mt-1">
                Silakan login dengan akun Google untuk memberikan rating dan komentar.
              </p>

              <button
                onClick={async () => {
                  // tandai bahwa login dari komentar
                  sessionStorage.setItem('scrollToComment', 'true')

                  console.log("ENV VITE_APP_URL:", import.meta.env.VITE_APP_URL)
                  await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                      redirectTo: `${import.meta.env.VITE_APP_URL}${window.location.pathname}${window.location.search}${window.location.hash}`,
                    },
                  })
                }}
                className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
              >
                Login dengan Google
              </button>
            </div>
          ) : (
            <>
              {/* RATING */}
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Rating:
                </p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className={`text-3xl transition
                        ${
                          rating >= star
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                        } hover:scale-110`}
                      aria-label={`Rating ${star}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              {/* KOMENTAR */}
              <div className="mt-4">
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Komentar atau saran (opsional)"
                  rows={3}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* SUBMIT (SIMPAN DB) */}
              <button
                onClick={async () => {
                  if (!user || !attempt) return
                  if (rating === 0) return

                  setSubmitting(true)

                  try {
                    const userName =
                      user.user_metadata?.full_name ||
                      user.user_metadata?.name ||
                      user.email?.split('@')[0] ||
                      'User'

                    if (existingFeedbackId) {
                      // UPDATE
                      const { error } = await supabase
                        .from('exam_feedback')
                        .update({
                          rating,
                          comment: comment || null,
                        })
                        .eq('id', existingFeedbackId)

                      if (error) throw error
                    } else {
                      // INSERT
                      const { error } = await supabase
                        .from('exam_feedback')
                        .insert({
                          exam_set_id: attempt.exam_set_id,
                          user_id: user.id,
                          user_name: userName,
                          user_email: user.email,
                          rating,
                          comment: comment || null,
                        })

                      if (error) throw error
                    }

                    // 🔥 reload feedback supaya state sinkron
                    const { data: refreshed } = await supabase
                      .from('exam_feedback')
                      .select('*')
                      .eq('exam_set_id', attempt.exam_set_id)
                      .eq('user_id', user.id)
                      .single()

                    if (refreshed) {
                      setExistingFeedbackId(refreshed.id)
                      setRating(refreshed.rating)
                      setComment(refreshed.comment || '')
                    }

                    alert(existingFeedbackId
                      ? 'Review berhasil diperbarui ✨'
                      : 'Terima kasih atas masukannya 🙏'
                    )

                  } catch (err: unknown) {
                    if (err instanceof Error) {
                      alert(err.message)
                    } else {
                      alert('Gagal menyimpan feedback')
                    }
                  } finally {
                    setSubmitting(false)
                  }
                }}
                disabled={rating === 0 || submitting}
                className="mt-4 rounded-lg bg-indigo-600 px-6 py-3 text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {submitting
                  ? 'Menyimpan...'
                  : existingFeedbackId
                  ? 'Update Review'
                  : 'Kirim Penilaian'}
              </button>
            </>
          )}
        </div>

        {/* ===== DUKUNG KAMI ===== */}
        <div className="mt-10 rounded-2xl border bg-gradient-to-br from-pink-50 to-white p-6 text-center shadow-sm">
          <h3 className="text-lg font-semibold text-pink-600">
            ❤️ Dukung Kami
          </h3>
          <p className="mt-2 text-sm text-gray-600">
            Jika platform ini bermanfaat, dukunganmu membantu kami
            terus mengembangkan soal dan fitur pembelajaran.
          </p>

          <a
            href="https://sociabuzz.com/bimbellesson/tribe"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block rounded-lg bg-pink-600 px-6 py-3 text-white font-medium hover:bg-pink-700 transition"
          >
            Dukung Sekarang
          </a>
        </div>
      </div>
      

      {/* CONFETTI STYLE */}
      <style>{`
        .animate-confetti {
          width: 6px;
          height: 12px;
          opacity: 0.8;
          animation: confetti-fall 2s linear infinite;
        }
        @keyframes confetti-fall {
          from { transform: translateY(-10vh) rotate(0deg); }
          to { transform: translateY(50vh) rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
