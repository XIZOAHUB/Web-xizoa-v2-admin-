import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Save, Eye, Settings } from 'lucide-react'
import Button from '../components/common/Button'
import MarkdownEditor from '../components/editor/MarkdownEditor'
import { useEditorStore } from '../stores/editorStore'

export default function Editor() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const store = useEditorStore()
  const [activeTab, setActiveTab] = useState<'editor' | 'settings'>('editor')
  const [publishing] = useState(false);

  // Load existing post if editing
  useEffect(() => {
    if (slug) {
      fetch(`/api/posts/${slug}`, { credentials: 'include' })
        .then(r => r.json())
        .then(data => {
          if (data.success) {
            const post = data.data
            store.setField('title', post.title)
            store.setField('content', post.content)
            store.setField('slug', post.slug)
            store.setField('excerpt', post.excerpt || '')
            store.setField('category', post.category || '')
            store.setField('tags', post.tags || [])
            store.setField('featuredImage', post.featuredImage || '')
            store.setField('status', post.status)
            store.setField('metaTitle', post.metaTitle || '')
            store.setField('metaDescription', post.metaDescription || '')
            store.setDirty(false)
          }
        })
    }
  }, [slug])

  const handleSave = async (publish = false) => {
    store.setSaving(true)

    const csrfToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('xizoa_csrf='))
      ?.split('=')[1]

    const body = {
      title: store.title,
      slug: store.slug || store.title.toLowerCase().replace(/\s+/g, '-'),
      content: store.content,
      excerpt: store.excerpt,
      category: store.category,
      tags: store.tags,
      featuredImage: store.featuredImage,
      status: publish ? 'published' : store.status,
      metaTitle: store.metaTitle,
      metaDescription: store.metaDescription,
    }

    const url = slug ? `/api/posts/${slug}` : '/api/posts'
    const method = slug ? 'PUT' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || '',
        },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (data.success) {
        store.setLastSaved()
        if (!slug) {
          navigate(`/editor/${data.data.slug}`)
        }
      }
    } finally {
      store.setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <input
          type="text"
          placeholder="Post title..."
          value={store.title}
          onChange={(e) => store.setField('title', e.target.value)}
          className="text-2xl font-bold bg-transparent border-none outline-none placeholder-gray-400 dark:text-white w-full"
        />
        <div className="flex items-center gap-2">
          {store.dirty && (
            <span className="text-sm text-yellow-600 dark:text-yellow-400">
              Unsaved changes
            </span>
          )}
          <Button variant="secondary" onClick={() => handleSave(false)} loading={store.saving}>
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
          <Button onClick={() => handleSave(true)} loading={publishing}>
            <Eye className="w-4 h-4 mr-2" />
            Publish
          </Button>
        </div>
      </div>

      <div className="flex gap-4 border-b border-gray-200 dark:border-dark-800">
        <button
          onClick={() => setActiveTab('editor')}
          className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'editor'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Editor
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'settings'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Settings className="w-4 h-4 inline mr-1" />
          Settings
        </button>
      </div>

      {activeTab === 'editor' ? (
        <MarkdownEditor />
      ) : (
        <div className="card p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Slug
            </label>
            <input
              type="text"
              value={store.slug}
              onChange={(e) => store.setField('slug', e.target.value)}
              className="input"
              placeholder="auto-generated-from-title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Excerpt
            </label>
            <textarea
              value={store.excerpt}
              onChange={(e) => store.setField('excerpt', e.target.value)}
              className="input h-20 resize-none"
              placeholder="Brief summary..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category
            </label>
            <input
              type="text"
              value={store.category}
              onChange={(e) => store.setField('category', e.target.value)}
              className="input"
              placeholder="e.g. Engineering"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={store.tags.join(', ')}
              onChange={(e) => store.setField('tags', e.target.value.split(',').map(t => t.trim()))}
              className="input"
              placeholder="cms, cloudflare, github"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Featured Image URL
            </label>
            <input
              type="text"
              value={store.featuredImage}
              onChange={(e) => store.setField('featuredImage', e.target.value)}
              className="input"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Meta Title
            </label>
            <input
              type="text"
              value={store.metaTitle}
              onChange={(e) => store.setField('metaTitle', e.target.value)}
              className="input"
              placeholder="SEO title..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Meta Description
            </label>
            <textarea
              value={store.metaDescription}
              onChange={(e) => store.setField('metaDescription', e.target.value)}
              className="input h-20 resize-none"
              placeholder="SEO description..."
            />
          </div>
        </div>
      )}
    </div>
  )
}
