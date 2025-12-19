import { Outlet } from 'react-router-dom'
import Sidebar from '../components/sidebar/Sidebar'
import logo from '../asset/logo.png'
import { useState } from 'react'

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-col flex-1">
        {/* Topbar */}
        <header className="h-14 bg-white border-b flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <img
              src={logo}
              alt="Logo"
              className="h-8 w-auto"
            />
            <span className="font-semibold text-sm sm:text-base">Lesson.Idn</span>
          </div>

          {/* Hamburger menu untuk mobile */}
          <button
            className="md:hidden px-3 py-2 bg-indigo-600 text-white rounded"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 sm:p-6 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  )
}