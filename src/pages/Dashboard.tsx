import { useEffect, useState } from 'react';
import StatCard from '../components/dashboard/StatCard';
import RecentPosts from '../components/dashboard/RecentPosts';
import DeployStatus from '../components/dashboard/DeployStatus';

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, published: 0, drafts: 0 });

  useEffect(() => {
    fetch('/api/posts')
      .then(r => r.json())
      .then(data => {
        setStats({
          total: data.pagination?.total || 0,
          published: data.posts?.filter((p: any) => p.status === 'published').length || 0,
          drafts: data.posts?.filter((p: any) => p.status === 'draft').length || 0,
        });
      })
      .catch(() => {/* handle error */});
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Posts" value={stats.total} icon="📄" />
        <StatCard title="Published" value={stats.published} icon="✅" />
        <StatCard title="Drafts" value={stats.drafts} icon="📝" />
        <StatCard title="Avg Build Time" value="15s" icon="⚡" />
      </div>
      <div className="grid grid-cols-2 gap-6">
        <RecentPosts />
        <DeployStatus />
      </div>
    </div>
  );
}
