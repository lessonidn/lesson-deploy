import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { shuffle } from '../lib/shuffle'

type Choice = {
  id: string
  text: string
  is_correct: boolean
}

type Question = {
  id: string
  text: string
  points: number
  choices: Choice[]
}

export default function QuizPage() {
  const { id: examId } = useParams()
  const navigate = useNavigate()

  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // ⏱ TIMER
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [isTimeUp, setIsTimeUp] = useState(false)

  function getUnansweredIndexes() {
    return questions
      .map((q, index) => (answers[q.id] ? null : index))
      .filter((v): v is number => v !== null)
  }

  function goNext() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1)
      return
    }
    const unanswered = getUnansweredIndexes()
    if (unanswered.length > 0) {
      setCurrentIndex(unanswered[0])
      return
    }
    submitQuiz()
  }

  const submitQuiz = useCallback(async () => {
    if (submitting || isTimeUp) return
    setSubmitting(true)
    try {
      const { data: attempt, error: attemptError } = await supabase
        .from('quiz_attempts')
        .insert({
          exam_set_id: examId,
          total_questions: questions.length,
        })
        .select()
        .single()
      if (attemptError) throw attemptError

      const answersPayload = questions.map(q => {
        const selectedChoiceId = answers[q.id]
        const selectedChoice = q.choices.find(c => c.id === selectedChoiceId)
        return {
          quiz_attempt_id: attempt.id,
          question_id: q.id,
          choice_id: selectedChoiceId,
          is_correct: selectedChoice?.is_correct || false,
        }
      })

      const { error: answerError } = await supabase
        .from('quiz_answers')
        .insert(answersPayload)
      if (answerError) throw answerError

      let score = 0
      let correctCount = 0
      answersPayload.forEach(a => {
        if (a.is_correct) {
          correctCount++
          const q = questions.find(q => q.id === a.question_id)
          if (q) score += q.points
        }
      })

      await supabase
        .from('quiz_attempts')
        .update({ score, correct_answers: correctCount })
        .eq('id', attempt.id)

      navigate(`/result/${attempt.id}`)
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message || 'Gagal submit quiz')
      } else {
        alert('Gagal submit quiz')
      }
    } finally {
      setSubmitting(false)
    }
  }, [submitting, isTimeUp, examId, questions, answers, navigate])

  useEffect(() => {
    if (!examId) return
    loadQuiz(examId)
  }, [examId])

  useEffect(() => {
    if (timeLeft <= 0) {
      if (timeLeft === 0) return
      setIsTimeUp(true)
      submitQuiz()
      return
    }
    const timer: ReturnType<typeof setInterval> = setInterval(() => {
      setTimeLeft(prev => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [timeLeft, submitQuiz])

  async function loadQuiz(examSetId: string) {
    setLoading(true)
    setError(null)

    const { data: exam, error: examError } = await supabase
      .from('exam_sets')
      .select('duration_minutes')
      .eq('id', examSetId)
      .single()
    if (examError || !exam) {
      setError('Gagal memuat exam')
      setLoading(false)
      return
    }
    setTimeLeft(exam.duration_minutes * 60)

    const { data: qs, error: qError } = await supabase
      .from('questions')
      .select(`
        id,
        text,
        points,
        choices (
          id,
          text,
          is_correct
        )
      `)
      .eq('exam_set_id', examSetId)
      .order('created_at')
    if (qError) {
      setError(qError.message)
      setLoading(false)
      return
    }
    const shuffledQuestions = shuffle(qs || []).map(q => ({
      ...q,
      choices: shuffle(q.choices || []),
    }))
    setQuestions(shuffledQuestions)
    setLoading(false)
  }

  function selectAnswer(questionId: string, choiceId: string) {
    if (isTimeUp) return
    setAnswers(prev => ({ ...prev, [questionId]: choiceId }))
  }

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading…</div>
  }
  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>
  }

  const question = questions[currentIndex]
  const selected = answers[question.id]

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-pink-50">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl shadow p-8 space-y-6">

          {/* HEADER */}
          <div className="flex justify-between items-center text-sm">
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium"
            >
              ← Kembali ke Beranda
            </button>

            <div className="text-gray-600">
              Soal {currentIndex + 1} / {questions.length}
            </div>

            <div
              className={`px-3 py-1 rounded-full font-semibold
                ${timeLeft < 60 ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'}
              `}
            >
              ⏱ {formatTime(timeLeft)}
            </div>
          </div>

          {isTimeUp && (
            <div className="p-4 rounded-lg bg-red-50 text-red-600 font-semibold">
              ⛔ Waktu habis. Jawaban telah dikunci.
            </div>
          )}

          {/* QUESTION */}
          <h2 className="text-xl font-semibold text-gray-800">{question.text}</h2>

          {/* CHOICES */}
          <div className="space-y-3">
            {question.choices.map((c, idx) => (
              <label
                key={c.id}
                className={`flex items-center gap-3 p-4 rounded-lg border transition
                  ${selected === c.id ? 'border-indigo-600 bg-indigo-50' : 'hover:bg-gray-50'}
                  ${isTimeUp ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <input
                  type="radio"
                  name={question.id}
                  value={c.id}
                  disabled={isTimeUp}
                  checked={selected === c.id}
                  onChange={() => selectAnswer(question.id, c.id)}
                  className="accent-indigo-600"
                />
                <span className="font-medium">{String.fromCharCode(65 + idx)}.</span>
                <span>{c.text}</span>
              </label>
            ))}
          </div>

          {/* NAVIGATION */}
          <div className="flex justify-between pt-6">
            <button
              disabled={currentIndex === 0 || isTimeUp}
              onClick={() => setCurrentIndex(i => i - 1)}
              className="px-5 py-2 rounded-lg border disabled:opacity-40"
            >
              ← Sebelumnya
            </button>

            <button
              disabled={isTimeUp || submitting}
              onClick={goNext}
              className={`px-6 py-2 rounded-lg font-semibold text-white
                ${
                  currentIndex === questions.length - 1
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }
                disabled:opacity-50
              `}
            >
              {currentIndex === questions.length - 1
                ? 'Selesai / Cek Soal Kosong'
                : 'Selanjutnya →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}