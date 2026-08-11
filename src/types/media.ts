export interface MediaItem {
  id: string
  filename: string
  mimeType: string
  size: number
  width: number | null
  height: number | null
  cdnUrl: string
  folder: string
  uploadedAt: string
}
