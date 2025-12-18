import { Outlet } from 'react-router-dom'
import Sidebar from '../components/sidebar/Sidebar'
import logo from '../asset/logo.png'

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <div className="flex flex-col flex-1">
        {/* Topbar */}
        <header className="h-14 bg-white border-b flex items-center px-6">
          <img
            src={logo}
            alt="Logo"
            className="h-8 w-auto"   // atur ukuran sesuai kebutuhan
          />
           Lesson.Idn
        </header>


        {/* Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

