import { FileText, Clock, Image, Zap } from 'lucide-react'
import StatCard from '../components/dashboard/StatCard'
import { usePosts } from '../hooks/usePosts'

export default function Dashboard() {
  const { posts } = usePosts()

  const publishedCount = posts.filter(p => p.status === 'published').length
  const draftCount = posts.filter(p => p.status === 'draft').length

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Overview of your content</p>
      </div>

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
          title="Media Files"
          value="—"
          icon={<Image className="w-6 h-6" />}
          color="purple"
        />
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Posts</h3>
        {posts.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">No posts yet. Create your first post!</p>
        ) : (
          <div className="space-y-3">
            {posts.slice(0, 5).map((post) => (
              <div
                key={post.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{post.title}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {post.status} • {new Date(post.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  post.status === 'published'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                }`}>
                  {post.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
