import { CategoryTreeNode, SalesChannelInfo } from "../types"

export interface GalleryImage {
  id?: string
  url: string
  type?: "thumbnail" | "banner" | "image" | string
  file_id?: string
}

export type EditTab = "general" | "products" | "channels" | "youtube"

export interface SaveNotification {
  type: "success" | "error"
  message: string
}

export function extractYouTubeVideoId(url: string): string | null {
  if (!url || typeof url !== "string") return null
  const trimmed = url.trim()
  const patterns = [
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/i,
    /(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/i,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/i,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/i,
  ]
  for (const pattern of patterns) {
    const match = trimmed.match(pattern)
    if (match && match[1]) return match[1]
  }
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed) && !/^[A-Za-z]{11}$/.test(trimmed)) return trimmed
  return null
}
