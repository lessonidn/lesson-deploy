import type { RouteObject } from 'react-router-dom'
import Home from '../pages/Home'
import ExamPage from '../pages/ExamPage'
import QuizPage from '../pages/QuizPage'
import ResultPage from '../pages/ResultPage'
import BlogDetail from '../pages/BlogDetail'
import BlogArchive from '../pages/BlogArchive'
import CategoryLandingPage from '../pages/CategoryLandingPage'
import CategoryIndexPage from '../pages/CategoryIndexPage'
import SitemapPage from "../pages/SitemapPage"
import AboutPage from "../pages/AboutPage"
import DonationPage from "../pages/DonationPage"
import UpgradeMember from "../pages/UpgradeMember"
import InviteRegister from "../pages/InviteRegister"
import LoginMember from '../pages/LoginMember'
import MemberDashboard from "../pages/MemberDashboard"

export const userRoutes: RouteObject[] = [
  { path: '/', element: <Home /> },
  { path: '/category', element: <CategoryIndexPage /> },
  { path: '/exam/:id', element: <ExamPage /> },
  { path: '/quiz/:id', element: <QuizPage /> },
  { path: '/result/:attemptId', element: <ResultPage /> },
  { path: '/blog/:slug', element: <BlogDetail /> },
  { path: '/blog', element: <BlogArchive /> }, // ✅ ARCHIVE
  { path: '/category/:slug', element: <CategoryLandingPage /> },
  { path: "/sitemap.xml", element: <SitemapPage /> },
  { path: "/tentang-kami", element: <AboutPage /> },
  { path: "/donasi", element: <DonationPage /> },
  { path: "/upgrade", element: <UpgradeMember /> },
  { path: "/invite/:token", element: <InviteRegister /> },
  { path: '/login', element: <LoginMember /> },
  { path: "/mydashboard", element: <MemberDashboard /> },
]
