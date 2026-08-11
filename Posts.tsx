import { Link } from 'react-router-dom'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import Button from '../components/common/Button'
import { usePosts } from '../hooks/usePosts'

export default function Posts() {
  const { posts, loading, refetch } = usePosts()

  const handleDelete = async (slug: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return

    const csrfToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('xizoa_csrf='))
      ?.split('=')[1]

    await fetch(`/api/posts/${slug}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'X-CSRF-Token': csrfToken || '' },
    })
    refetch()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Posts</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your blog posts</p>
        </div>
        <Link to="/editor">
          <Button><Plus className="w-4 h-4 mr-2" />New Post</Button>
        </Link>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : posts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No posts yet</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-dark-800 border-b border-gray-200 dark:border-dark-800">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Title</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Updated</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-dark-800">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50 dark:hover:bg-dark-800/50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900 dark:text-white">{post.title}</p>
                    <p className="text-sm text-gray-500">/{post.slug}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      post.status === 'published'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30'
                        : post.status === 'scheduled'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30'
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30'
                    }`}>
                      {post.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(post.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link to={`/editor/${post.slug}`}>
                        <button className="p-2 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg">
                          <Edit2 className="w-4 h-4 text-gray-500" />
                        </button>
                      </Link>
                      <button
                        onClick={() => handleDelete(post.slug)}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
