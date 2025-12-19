import { NavLink } from 'react-router-dom'

const menus = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin/categories', label: 'Categories' },
  { to: '/admin/sub-categories', label: 'Sub Categories' },
  { to: '/admin/exam-sets', label: 'Exam Sets' },
  { to: '/admin/questions', label: 'Questions' },
  { to: '/admin/choices', label: 'Choices' },
]

type SidebarProps = {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 w-64 bg-slate-900 text-white flex flex-col transform transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:shadow-none z-50`}
    >
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-6 font-bold border-b border-slate-700">
        BIMBEL ADMIN
        {/* Tombol close hanya muncul di mobile */}
        <button
          className="md:hidden text-slate-300 hover:text-white"
          onClick={onClose}
        >
          ✕
        </button>
      </div>

      {/* Menu */}
      <nav className="flex-1 px-4 py-4 space-y-2">
        {menus.map(m => (
          <NavLink
            key={m.to}
            to={m.to}
            className={({ isActive }) =>
              `block rounded px-3 py-2 text-sm ${
                isActive
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`
            }
            onClick={onClose} // tutup sidebar setelah klik menu di mobile
          >
            {m.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}