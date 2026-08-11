import { Outlet } from "react-router-dom";
import Sidebar from './Sidebar';
import TopBar from './TopBar';

interface AppShellProps {
  children?: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
      <TopBar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 ml-64 p-6 pt-20">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}
