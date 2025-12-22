import { NavLink, Outlet } from 'react-router-dom'

export default function MenuManagerLayout() {
  return (
    <div className="flex gap-6">
      {/* SUB MENU */}
      <aside className="w-64 bg-white border rounded-xl p-4">
        <h2 className="font-bold mb-4">Menu Manager</h2>

        <nav className="space-y-1 text-sm">
          <NavLink to="/admin/menu-manager/menus" className="block px-3 py-2 rounded hover:bg-blue-50">
            Menus
          </NavLink>

          <NavLink to="/admin/menu-manager/pages" className="block px-3 py-2 rounded hover:bg-blue-50">
            Pages
          </NavLink>

          <NavLink to="/admin/menu-manager/widgets" className="block px-3 py-2 rounded hover:bg-blue-50">
            Widgets
          </NavLink>

          <NavLink to="/admin/menu-manager/banners" className="block px-3 py-2 rounded hover:bg-blue-50">
            Banners
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
