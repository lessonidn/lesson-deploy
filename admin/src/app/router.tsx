import type { RouteObject } from 'react-router-dom'
import AdminLayout from '../layouts/AdminLayout'
import Dashboard from '../pages/Dashboard'
import Categories from '../pages/Categories'
import SubCategories from '../pages/SubCategories'
import ExamSets from '../pages/ExamSets'
import Questions from '../pages/Questions'
import Choices from '../pages/Choices'

export const adminRoutes: RouteObject[] = [
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'categories', element: <Categories /> },
      { path: 'sub-categories', element: <SubCategories /> },
      { path: 'exam-sets', element: <ExamSets /> },
      { path: 'questions', element: <Questions /> },
      { path: 'choices', element: <Choices /> },
    ],
  },
]
