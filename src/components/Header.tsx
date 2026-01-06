import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Header() {
  const { session, profile, loading, logout } = useAuth()
  const navigate = useNavigate()

  if (loading) return null

  const isMemberActive =
    profile?.membership_status === 'active'

  return (
    <header className="h-14 bg-white border-b flex items-center justify-between px-6">
      <Link to="/" className="font-bold text-lg">
        Lesson.Idn
      </Link>

      <div className="flex items-center gap-4">
        {!session && (
          <>
            <Link
              to="/login"
              className="text-sm font-medium"
            >
              Masuk Member
            </Link>
            <Link
              to="/upgrade"
              className="px-4 py-1.5 rounded bg-indigo-600 text-white text-sm"
            >
              Upgrade
            </Link>
          </>
        )}

        {session && profile && (
          <div className="relative group">
            <button className="flex items-center gap-2 text-sm font-medium">
              👤 {profile.full_name ?? 'Member'}
            </button>

            <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow hidden group-hover:block">
              <Link
                to="/mydashboard"
                className="block px-4 py-2 text-sm hover:bg-gray-100"
              >
                Dashboard
              </Link>

              {!isMemberActive && (
                <Link
                  to="/upgrade"
                  className="block px-4 py-2 text-sm hover:bg-gray-100 text-indigo-600"
                >
                  Upgrade Member
                </Link>
              )}

              <button
                onClick={async () => {
                  await logout()
                  navigate('/')
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-red-600"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
