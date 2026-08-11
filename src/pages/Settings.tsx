import { useState, useEffect } from 'react'
import Button from '../components/common/Button'

export default function Settings() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/settings', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (data.success) setSettings(data.data)
        setLoading(false)
      })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    const csrfToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('xizoa_csrf='))
      ?.split('=')[1]

    await fetch('/api/settings', {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken || '',
      },
      body: JSON.stringify(settings),
    })
    setSaving(false)
  }

  if (loading) return <div className="text-center py-8">Loading...</div>

  const fields = [
    { key: 'site_title', label: 'Site Title', type: 'text' },
    { key: 'site_description', label: 'Site Description', type: 'text' },
    { key: 'site_url', label: 'Site URL', type: 'url' },
    { key: 'author_name', label: 'Author Name', type: 'text' },
    { key: 'author_bio', label: 'Author Bio', type: 'text' },
    { key: 'posts_per_page', label: 'Posts Per Page', type: 'number' },
    { key: 'default_category', label: 'Default Category', type: 'text' },
    { key: 'timezone', label: 'Timezone', type: 'text' },
  ]

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Configure your site</p>
      </div>

      <div className="card p-6 space-y-4">
        {fields.map((field) => (
          <div key={field.key}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {field.label}
            </label>
            <input
              type={field.type}
              value={settings[field.key] || ''}
              onChange={(e) => setSettings(s => ({ ...s, [field.key]: e.target.value }))}
              className="input"
            />
          </div>
        ))}

        <div className="pt-4">
          <Button onClick={handleSave} loading={saving}>Save Settings</Button>
        </div>
      </div>
    </div>
  )
}
