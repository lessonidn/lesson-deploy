import type { RouteObject } from 'react-router-dom'
import Home from '../pages/Home'
import CategoryPage from '../pages/CategoryPage'
import ExamPage from '../pages/ExamPage'
import QuizPage from '../pages/QuizPage'
import ResultPage from '../pages/ResultPage'

export const userRoutes: RouteObject[] = [
  { path: '/', element: <Home /> },
  { path: '/category/:slug', element: <CategoryPage /> },
  { path: '/exam/:id', element: <ExamPage /> },
  { path: '/quiz/:id', element: <QuizPage /> },
  { path: '/result/:attemptId', element: <ResultPage /> },
]
