import { Routes, Route } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Posts from './pages/Posts'
import Editor from './pages/Editor'
import Media from './pages/Media'
import Settings from './pages/Settings'
import { useAuth } from './hooks/useAuth'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/posts" element={<Posts />} />
        <Route path="/editor" element={<Editor />} />
        <Route path="/editor/:slug" element={<Editor />} />
        <Route path="/media" element={<Media />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </AppShell>
  )
}

export default App
