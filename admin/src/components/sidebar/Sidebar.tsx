import { NavLink } from 'react-router-dom'

const menus = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin/categories', label: 'Categories' },
  { to: '/admin/sub-categories', label: 'Sub Categories' },
  { to: '/admin/exam-sets', label: 'Exam Sets' },
  { to: '/admin/questions', label: 'Questions' },
  { to: '/admin/choices', label: 'Choices' },
]

export default function Sidebar() {
  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col">
      <div className="h-14 flex items-center px-6 font-bold border-b border-slate-700">
        BIMBEL ADMIN
      </div>

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
          >
            {m.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
