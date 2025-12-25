import type { RouteObject } from 'react-router-dom'
import Home from '../pages/Home'
import CategoryPage from '../pages/CategoryPage'
import ExamPage from '../pages/ExamPage'
import QuizPage from '../pages/QuizPage'
import ResultPage from '../pages/ResultPage'
import BlogDetail from '../pages/BlogDetail'
import BlogArchive from '../pages/BlogArchive'
import CategoryLandingPage from '../pages/CategoryLandingPage'

export const userRoutes: RouteObject[] = [
  { path: '/', element: <Home /> },
  { path: '/category/:slug', element: <CategoryPage /> },
  { path: '/exam/:id', element: <ExamPage /> },
  { path: '/quiz/:id', element: <QuizPage /> },
  { path: '/result/:attemptId', element: <ResultPage /> },
  { path: '/blog/:slug', element: <BlogDetail /> },
  { path: '/blog', element: <BlogArchive /> }, // ✅ ARCHIVE
  { path: '/latihan/:slug', element: <CategoryLandingPage /> },
]
