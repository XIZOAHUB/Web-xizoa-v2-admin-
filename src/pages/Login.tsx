import { Github } from 'lucide-react'
import Button from '../components/common/Button'

export default function Login() {
  const handleLogin = () => {
    window.location.href = '/api/auth/login'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-950">
      <div className="card p-8 w-full max-w-md text-center">
        <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <span className="text-white font-bold text-2xl">X</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome to Xizoa CMS
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          Sign in with your GitHub account to continue
        </p>
        <Button onClick={handleLogin} className="w-full gap-2">
          <Github className="w-5 h-5" />
          Login with GitHub
        </Button>
      </div>
    </div>
  )
}
