import type { RouteObject } from 'react-router-dom'
import RequireAdmin from '../lib/RequireAdmin'
import AdminLayout from '../layouts/AdminLayout'

import AdminLogin from '../pages/Login'
import Dashboard from '../pages/Dashboard'
import Categories from '../pages/Categories'
import SubCategories from '../pages/SubCategories'
import ExamSets from '../pages/ExamSets'
import Questions from '../pages/Questions'
import Choices from '../pages/Choices'

import MenuManagerLayout from '../pages/menu-manager/MenuManagerLayout'
import Menus from '../pages/menu-manager/Menus'
import Pages from '../pages/menu-manager/Pages'
import Widgets from '../pages/menu-manager/Widgets'
import Banners from '../pages/menu-manager/Banners'
import SocialMedia from '../pages/menu-manager/SocialMedia'

export const adminRoutes: RouteObject[] = [
  // 🔓 LOGIN (PUBLIC)
  { path: '/admin/login', element: <AdminLogin /> },

  // 🔒 PROTECTED ADMIN
  {
    path: '/admin',
    element: <RequireAdmin />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <Dashboard /> },
          { path: 'categories', element: <Categories /> },
          { path: 'sub-categories', element: <SubCategories /> },
          { path: 'exam-sets', element: <ExamSets /> },
          { path: 'questions', element: <Questions /> },
          { path: 'choices', element: <Choices /> },

          {
            path: 'menu-manager',
            element: <MenuManagerLayout />,
            children: [
              { index: true, element: <Menus /> },
              { path: 'menus', element: <Menus /> },
              { path: 'pages', element: <Pages /> },
              { path: 'widgets', element: <Widgets /> },
              { path: 'banners', element: <Banners /> },
              { path: 'social-media', element: <SocialMedia /> },
            ],
          },
        ],
      },
    ],
  },
]
