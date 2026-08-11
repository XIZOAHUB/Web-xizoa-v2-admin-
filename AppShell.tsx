import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
      <TopBar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 ml-64 p-6 pt-20">
          {children}
        </main>
      </div>
    </div>
  )
}
