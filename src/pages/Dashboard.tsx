import { useState, useEffect } from 'react'
import { FileText, Clock, Image, Zap, Github, Server, Database, Activity, CheckCircle2, CloudLightning } from 'lucide-react'
import StatCard from '../components/dashboard/StatCard'
import { usePosts } from '../hooks/usePosts'

export default function Dashboard() {
  const { posts } = usePosts()
  
  // Abhi UI ko advanced dikhane ke liye hum temporary mock data use kar rahe hain
  // API theek hote hi ye real data fetch karne lagega
  const [deployStatus] = useState({
    status: 'success',
    commit: '5165420',
    time: '2 minutes ago'
  });

  const [commits] = useState([
    { id: 1, message: 'Update Dashboard UI to Advanced version', hash: '5165420', time: '10 mins ago' },
    { id: 2, message: 'Fix login routing issue', hash: '3d73b68', time: '1 hour ago' },
    { id: 3, message: 'Setup Cloudflare Pages config', hash: 'f247ef3', time: '2 hours ago' },
  ]);

  const publishedCount = posts.filter(p => p.status === 'published').length
  const draftCount = posts.filter(p => p.status === 'draft').length

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Overview of your Xizoa CMS</p>
        </div>
        <button className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors shadow-sm">
          <CloudLightning className="w-4 h-4" />
          Trigger Deploy
        </button>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Posts"
          value={posts.length}
          icon={<FileText className="w-6 h-6" />}
          color="primary"
        />
        <StatCard
          title="Published"
          value={publishedCount}
          icon={<Zap className="w-6 h-6" />}
          color="green"
        />
        <StatCard
          title="Drafts"
          value={draftCount}
          icon={<Clock className="w-6 h-6" />}
          color="orange"
        />
        <StatCard
          title="Avg Build Time"
          value="15s"
          icon={<Activity className="w-6 h-6" />}
          color="purple"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Recent Posts (Takes up 2 columns on large screens) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-500" />
              Recent Posts
            </h3>
            {posts.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-dark-800 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400">No posts yet. Create your first post!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {posts.slice(0, 5).map((post) => (
                  <div
                    key={post.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-dark-800 hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{post.title}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                         Last updated: {new Date(post.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      post.status === 'published'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                      {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Advanced Widgets (Cloudflare, GitHub, Storage) */}
        <div className="space-y-6">
          
          {/* Deploy Status Widget */}
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Server className="w-4 h-4" />
              Deploy Status
            </h3>
            <div className="flex items-start gap-4">
              <div className="mt-1">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white text-lg">Live & Active</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Commit: <span className="font-mono bg-gray-100 dark:bg-dark-800 px-1.5 py-0.5 rounded">{deployStatus.commit}</span></p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Deployed {deployStatus.time}</p>
              </div>
            </div>
          </div>

          {/* GitHub Commits Widget */}
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Github className="w-4 h-4" />
              Recent Commits
            </h3>
            <div className="space-y-4">
              {commits.map((commit) => (
                <div key={commit.id} className="flex gap-3">
                  <div className="mt-1">
                    <div className="w-2 h-2 rounded-full bg-primary-500 ring-4 ring-primary-50 dark:ring-primary-900/20"></div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">{commit.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-mono text-primary-600 dark:text-primary-400">{commit.hash}</span>
                      <span className="text-xs text-gray-400">• {commit.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Storage Usage Widget */}
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Database className="w-4 h-4" />
              Storage Usage
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 dark:text-gray-300">D1 (Database)</span>
                  <span className="text-gray-500">1.2 MB / 5 GB</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-dark-800 rounded-full h-1.5">
                  <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '2%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 dark:text-gray-300">KV (Sessions)</span>
                  <span className="text-gray-500">12 Keys / 100K</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-dark-800 rounded-full h-1.5">
                  <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: '1%' }}></div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
