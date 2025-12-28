import { NavLink, Outlet } from 'react-router-dom'

const linkClass =
  'block px-3 py-2 rounded hover:bg-blue-50 transition'

const activeClass =
  'bg-blue-100 text-blue-700 font-medium'

export default function MenuManagerLayout() {
  return (
    <div className="flex gap-6">
      {/* SUB MENU */}
      <aside className="w-64 bg-white border rounded-xl p-4">
        <h2 className="font-bold mb-4">Menu Manager</h2>

        <nav className="space-y-1 text-sm">
          <NavLink
            to="/admin/menu-manager/menus"
            className={({ isActive }) =>
              `${linkClass} ${isActive ? activeClass : ''}`
            }
          >
            Menus
          </NavLink>

          <NavLink
            to="/admin/menu-manager/pages"
            className={({ isActive }) =>
              `${linkClass} ${isActive ? activeClass : ''}`
            }
          >
            Pages
          </NavLink>

          <NavLink
            to="/admin/menu-manager/widgets"
            className={({ isActive }) =>
              `${linkClass} ${isActive ? activeClass : ''}`
            }
          >
            Widgets
          </NavLink>

          <NavLink
            to="/admin/menu-manager/banners"
            className={({ isActive }) =>
              `${linkClass} ${isActive ? activeClass : ''}`
            }
          >
            Banners
          </NavLink>

          {/* 🔥 NEW: SOCIAL MEDIA */}
          <NavLink
            to="/admin/menu-manager/social-media"
            className={({ isActive }) =>
              `${linkClass} ${isActive ? activeClass : ''}`
            }
          >
            Social Media
          </NavLink>
        </nav>
      </aside>

      {/* CONTENT */}
      <section className="flex-1">
        <Outlet />
      </section>
    </div>
  )
}
