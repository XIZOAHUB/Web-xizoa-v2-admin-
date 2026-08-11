import { Upload, Folder, Search } from 'lucide-react'

export default function Media() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Media Library</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your images and files</p>
        </div>
        <label className="btn-primary cursor-pointer">
          <Upload className="w-4 h-4 mr-2" />
          Upload
          <input type="file" className="hidden" accept="image/*" />
        </label>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search media..."
            className="input pl-10"
          />
        </div>
        <button className="btn-secondary">
          <Folder className="w-4 h-4 mr-2" />
          All Folders
        </button>
      </div>

      <div className="card p-12 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          Media upload coming in Phase 8. Upload images to see them here.
        </p>
      </div>
    </div>
  )
}
