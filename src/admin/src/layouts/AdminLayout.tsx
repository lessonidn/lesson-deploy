import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../components/sidebar/Sidebar";
import logo from "../asset/logo.png";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { logout } from "../../../lib/logout";

// 🔐 AUTO LOGOUT TIME (pindah ke luar komponen)
const AUTO_LOGOUT_TIME = 2 * 60 * 60 * 1000; // 2 jam

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  // 🔐 ADMIN GUARD
  useEffect(() => {
    const checkAdmin = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate("/login");
        return;
      }

      const role = session.user.app_metadata?.role;
      if (role !== "admin") {
        navigate("/"); // atau /403
      }
    };

    checkAdmin();
  }, [navigate]);

  // 🔐 AUTO LOGOUT
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        alert("Sesi admin berakhir karena tidak ada aktivitas.");
        logout(navigate);
      }, AUTO_LOGOUT_TIME);
    };

    // daftar event aktivitas
    const events = ["mousemove", "keydown", "scroll", "click"];
    events.forEach((event) => window.addEventListener(event, resetTimer));

    resetTimer(); // start timer pertama

    return () => {
      clearTimeout(timeout);
      events.forEach((event) =>
        window.removeEventListener(event, resetTimer)
      );
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-col flex-1">
        {/* Topbar */}
        <header className="h-14 bg-white border-b flex items-center justify-between px-4 sm:px-6">
         <a href="/" target="_blank" rel="noopener noreferrer" className="inline-block">
            <div className="flex items-center gap-2">
              <img src={logo} alt="Logo" className="h-8 w-auto" />
              <span className="font-semibold text-sm sm:text-base">
                Lesson.Idn
              </span>
            </div>
          </a>

          <div className="flex items-center gap-3">
            {/* Logout */}
            <button
              onClick={() => logout(navigate)}
              className="text-sm px-3 py-1.5 rounded bg-red-500 text-white hover:bg-red-600"
            >
              Logout
            </button>

            {/* Hamburger menu */}
            <button
              className="md:hidden px-3 py-2 bg-indigo-600 text-white rounded"
              onClick={() => setSidebarOpen(true)}
            >
              ☰
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 sm:p-6 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}