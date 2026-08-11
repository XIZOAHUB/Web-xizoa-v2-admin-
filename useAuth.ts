import { useEffect, useState } from 'react'
import { useAuthStore } from '../stores/authStore'

export function useAuth() {
  const { user, setUser, clearUser } = useAuthStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkSession()
  }, [])

  async function checkSession() {
    try {
      const res = await fetch('/api/auth/session', {
        credentials: 'include',
      })
      const data = await res.json()
      if (data.data?.authenticated) {
        setUser(data.data.user)
      } else {
        clearUser()
      }
    } catch {
      clearUser()
    } finally {
      setLoading(false)
    }
  }

  async function logout() {
    const csrfToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('xizoa_csrf='))
      ?.split('=')[1]

    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'X-CSRF-Token': csrfToken || '',
      },
    })
    clearUser()
    window.location.href = '/'
  }

  return { user, loading, logout }
}
