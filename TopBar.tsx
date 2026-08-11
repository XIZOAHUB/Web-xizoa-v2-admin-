import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../hooks/useTheme'
import { Sun, Moon, LogOut, User } from 'lucide-react'

export default function TopBar() {
  const { user, logout } = useAuth()
  const { dark, toggle } = useTheme()

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-dark-900 border-b border-gray-200 dark:border-dark-800 z-50 flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">X</span>
        </div>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">Xizoa CMS</h1>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={toggle}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
        >
          {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {user && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {user.avatar ? (
                <img src={user.avatar} alt="" className="w-8 h-8 rounded-full" />
              ) : (
                <User className="w-8 h-8 p-1 bg-gray-200 dark:bg-dark-800 rounded-full" />
              )}
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">
                {user.username}
              </span>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
