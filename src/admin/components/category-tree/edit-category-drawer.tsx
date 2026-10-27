import React, { useState, useEffect, useCallback, useRef } from "react"
import {
  Button,
  Drawer,
  Input,
  Label,
  Switch,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui"
import { Trash, Plus, ArrowUpRightMicro, ArrowsPointingOut, ArrowDownTray } from "@medusajs/icons"
import { CategoryTreeNode, SalesChannelInfo } from "./types"
import { CategoryProductsManager } from "./category-products-manager"
import { sdk } from "../../lib/sdk"

export interface EditCategoryDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: CategoryTreeNode | null
  salesChannels: SalesChannelInfo[]
  onSuccess: (updatedCat: CategoryTreeNode) => void
  onDeleteSuccess: (deletedId: string) => void
}

function extractYouTubeVideoId(url: string): string | null {
  if (!url || typeof url !== "string") return null
  const trimmed = url.trim()
  const patterns = [
    /(?:youtube\.com\/shorts\/)([^?&\s]+)/i,
    /(?:youtube\.com\/watch\?.*v=)([^?&\s]+)/i,
    /(?:youtu\.be\/)([^?&\s]+)/i,
    /(?:youtube\.com\/embed\/)([^?&\s]+)/i,
  ]
  for (const pattern of patterns) {
    const match = trimmed.match(pattern)
    if (match && match[1]) return match[1]
  }
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed
  return null
}

export const EditCategoryDrawer: React.FC<EditCategoryDrawerProps> = ({
  open,
  onOpenChange,
  category,
  salesChannels,
  onSuccess,
  onDeleteSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<"general" | "products" | "channels" | "youtube">("general")

  const [name, setName] = useState("")
  const [handle, setHandle] = useState("")
  const [description, setDescription] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [rank, setRank] = useState(0)
  const [isActive, setIsActive] = useState(true)
  const [isInternal, setIsInternal] = useState(false)
  const [selectedChannels, setSelectedChannels] = useState<string[]>([])
  const [youtubeUrls, setYoutubeUrls] = useState<string[]>([])
  const [newYoutubeInput, setNewYoutubeInput] = useState("")

  const [currentMetadata, setCurrentMetadata] = useState<Record<string, any>>({})
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Media upload & gallery state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [categoryImages, setCategoryImages] = useState<Array<{ id?: string; url: string; type?: string }>>([])

  useEffect(() => {
    if (category) {
      setName(category.name || "")
      setHandle(category.handle || "")
      setDescription(category.description || "")
      setImageUrl(category.image_url || "")
      setRank(category.rank ?? 0)
      setIsActive(Boolean(category.is_active))
      setIsInternal(Boolean(category.is_internal))
      setSelectedChannels(category.sales_channels || salesChannels.map((s) => s.id))
      setCurrentMetadata((category.metadata as Record<string, any>) || {})

      // Parse YouTube URLs from metadata
      const meta = category.metadata as Record<string, any> | null
      const urls: string[] = []
      if (meta?.youtube_urls && Array.isArray(meta.youtube_urls)) {
        meta.youtube_urls.forEach((u) => typeof u === "string" && u.trim() && urls.push(u.trim()))
      } else if (meta?.youtube_url && typeof meta.youtube_url === "string") {
        urls.push(meta.youtube_url.trim())
      }
      setYoutubeUrls(urls)
      setActiveTab("general")

      // Load category media from backend
      loadCategoryImages(category.id, category.image_url || meta?.thumbnail || meta?.image)
    }
  }, [category, salesChannels])

  // Load existing category media gallery
  const loadCategoryImages = useCallback(async (catId: string, currentImageUrl?: string) => {
    try {
      const res = await sdk.client.fetch<{ category_images?: any[] }>(
        `/admin/categories/${catId}/images`
      )
      if (res?.category_images && Array.isArray(res.category_images) && res.category_images.length > 0) {
        setCategoryImages(res.category_images)
        const thumb = res.category_images.find((img) => img.type === "thumbnail")
        if (thumb?.url) {
          setImageUrl(thumb.url)
        }
        return
      }
    } catch {
      // Endpoint fallback
    }

    if (currentImageUrl) {
      setCategoryImages([{ url: currentImageUrl, type: "thumbnail" }])
    } else {
      setCategoryImages([])
    }
  }, [])

  // Universal S3/Storage Media Upload Handler (works with AWS S3, MinIO, Cloudflare R2, Local)
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setIsUploading(true)
    try {
      const fileList = Array.from(files)
      // Calls standard Medusa File Module API (delegates to configured S3 provider in medusa-config.js)
      const res = await sdk.admin.upload.create({ files: fileList })
      const uploadedFiles = res.files || []
      if (uploadedFiles.length === 0) {
        throw new Error("No files returned from upload service")
      }

      const firstUrl = uploadedFiles[0].url
      if (!imageUrl) {
        setImageUrl(firstUrl)
      }

      // If backend has custom category images endpoint, save them there too
      try {
        await sdk.client.fetch(`/admin/categories/${category.id}/images`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: {
            images: uploadedFiles.map((f, i) => ({
              url: f.url,
              type: i === 0 && !imageUrl ? "thumbnail" : "image",
            })),
          },
        })
        await loadCategoryImages(category.id, firstUrl)
      } catch {
        // Fallback for standard stores: update local gallery state
        setCategoryImages((prev) => [
          ...prev,
          ...uploadedFiles.map((f, i) => ({
            url: f.url,
            type: i === 0 && !imageUrl ? "thumbnail" : "image",
          })),
        ])
      }

      toast.success(`${uploadedFiles.length} image(s) uploaded successfully`)
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload image")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  // Set selected image as Category Thumbnail
  const handleSetThumbnail = async (img: { id?: string; url: string }) => {
    setImageUrl(img.url)
    if (img.id) {
      try {
        await sdk.client.fetch(`/admin/categories/${category.id}/images/batch`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: {
            updates: [{ id: img.id, type: "thumbnail" }],
          },
        })
        await loadCategoryImages(category.id, img.url)
      } catch {
        setCategoryImages((prev) =>
          prev.map((item) => ({
            ...item,
            type: item.url === img.url ? "thumbnail" : "image",
          }))
        )
      }
    } else {
      setCategoryImages((prev) =>
        prev.map((item) => ({
          ...item,
          type: item.url === img.url ? "thumbnail" : "image",
        }))
      )
    }
    toast.success("Designated as category thumbnail")
  }

  // Delete category image
  const handleDeleteImage = async (img: { id?: string; url: string }) => {
    if (img.id) {
      try {
        await sdk.client.fetch(`/admin/categories/${category.id}/images/batch`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: {
            ids: [img.id],
          },
        })
      } catch {
        // Fallback
      }
    }
    setCategoryImages((prev) => prev.filter((i) => i.url !== img.url))
    if (imageUrl === img.url) {
      setImageUrl("")
    }
    toast.info("Image removed")
  }

  if (!category) return null

  const toggleChannel = (channelId: string) => {
    setSelectedChannels((prev) =>
      prev.includes(channelId)
        ? prev.filter((id) => id !== channelId)
        : [...prev, channelId]
    )
  }

  const handleAddYoutube = () => {
    const raw = newYoutubeInput.trim()
    if (!raw) return
    const id = extractYouTubeVideoId(raw)
    if (!id) {
      toast.error("Please enter a valid YouTube URL or video ID")
      return
    }
    const cleanUrl = `https://www.youtube.com/watch?v=${id}`
    if (youtubeUrls.includes(cleanUrl)) {
      toast.error("Video already added")
      return
    }
    setYoutubeUrls((prev) => [...prev, cleanUrl])
    setNewYoutubeInput("")
    toast.success("YouTube video added")
  }

  const handleRemoveYoutube = (urlToRemove: string) => {
    setYoutubeUrls((prev) => prev.filter((u) => u !== urlToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Category name is required")
      return
    }

    setIsSubmitting(true)
    try {
      const updatedMetadata: Record<string, any> = {
        ...(currentMetadata || {}),
        sales_channels: selectedChannels,
        youtube_urls: youtubeUrls,
      }
      if (imageUrl.trim()) {
        updatedMetadata.thumbnail = imageUrl.trim()
        updatedMetadata.image = imageUrl.trim()
      }

      await sdk.admin.productCategory.update(category.id, {
        name: name.trim(),
        handle: handle.trim() || undefined,
        description: description.trim() || undefined,
        rank: Number(rank) || 0,
        is_active: isActive,
        is_internal: isInternal,
        metadata: updatedMetadata,
      })

      const updated: CategoryTreeNode = {
        ...category,
        name: name.trim(),
        handle: handle.trim(),
        description: description.trim() || null,
        image_url: imageUrl.trim() || category.image_url,
        rank: Number(rank) || 0,
        sales_channels: selectedChannels,
        is_active: isActive,
        is_internal: isInternal,
        metadata: updatedMetadata,
      }

      toast.success("Category updated successfully")
      onSuccess(updated)
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err?.message || "Failed to update category")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete category "${category.name}"? Subcategories will be promoted.`)) {
      return
    }

    setIsDeleting(true)
    try {
      await sdk.admin.productCategory.delete(category.id)
      toast.success(`Category "${category.name}" deleted`)
      onDeleteSuccess(category.id)
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete category")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <Drawer.Content
        className={`transition-all duration-300 w-full z-50 ${
          isFullScreen
            ? "!max-w-full !w-screen !h-screen !inset-0 !rounded-none"
            : "max-w-5xl xl:max-w-6xl w-[92vw]"
        }`}
      >
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <Drawer.Header className="border-b border-ui-border-base pb-3">
            <div className="flex items-center justify-between w-full">
              <div>
                <Drawer.Title className="text-base font-semibold text-ui-fg-base">
                  {category.name}
                </Drawer.Title>
                <Drawer.Description className="text-xs text-ui-fg-muted mt-0.5">
                  Tier {category.tier} • ID: {category.id}
                </Drawer.Description>
              </div>

              <div className="flex items-center gap-2">
                {/* Full Screen / Wide Mode Toggle */}
                <button
                  type="button"
                  onClick={() => setIsFullScreen((prev) => !prev)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-ui-fg-subtle hover:text-ui-fg-base rounded-lg border border-ui-border-base bg-ui-bg-subtle hover:bg-ui-bg-base shadow-2xs transition-colors"
                  title={isFullScreen ? "Exit Fullscreen" : "Expand to Full Page Modal"}
                >
                  <ArrowsPointingOut className="w-3.5 h-3.5" />
                  <span>{isFullScreen ? "Exit Fullscreen" : "Full Page"}</span>
                </button>

                {/* Direct Open Legacy Page Link */}
                <button
                  type="button"
                  onClick={() => window.open(`/app/categories/${category.id}`, "_blank")}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-ui-fg-subtle hover:text-ui-fg-base rounded-lg border border-ui-border-base bg-ui-bg-subtle hover:bg-ui-bg-base shadow-2xs transition-colors"
                  title="Open full category details page in a new tab"
                >
                  <span>Open Full Page</span>
                  <ArrowUpRightMicro className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Tab Navigation Bar */}
            <div className="flex items-center gap-1 mt-3 border-b border-ui-border-base/50 -mb-3 pb-1">
              <button
                type="button"
                onClick={() => setActiveTab("general")}
                className={`px-3 py-1.5 text-xs font-medium rounded-t-lg transition-colors border-b-2 -mb-[5px] ${
                  activeTab === "general"
                    ? "border-ui-border-interactive text-ui-fg-base bg-ui-bg-subtle/50"
                    : "border-transparent text-ui-fg-muted hover:text-ui-fg-base"
                }`}
              >
                General & Ranking
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("products")}
                className={`px-3 py-1.5 text-xs font-medium rounded-t-lg transition-colors border-b-2 -mb-[5px] ${
                  activeTab === "products"
                    ? "border-ui-border-interactive text-ui-fg-base bg-ui-bg-subtle/50"
                    : "border-transparent text-ui-fg-muted hover:text-ui-fg-base"
                }`}
              >
                Products Management
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("channels")}
                className={`px-3 py-1.5 text-xs font-medium rounded-t-lg transition-colors border-b-2 -mb-[5px] ${
                  activeTab === "channels"
                    ? "border-ui-border-interactive text-ui-fg-base bg-ui-bg-subtle/50"
                    : "border-transparent text-ui-fg-muted hover:text-ui-fg-base"
                }`}
              >
                Storefronts & Media
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("youtube")}
                className={`px-3 py-1.5 text-xs font-medium rounded-t-lg transition-colors border-b-2 -mb-[5px] ${
                  activeTab === "youtube"
                    ? "border-ui-border-interactive text-ui-fg-base bg-ui-bg-subtle/50"
                    : "border-transparent text-ui-fg-muted hover:text-ui-fg-base"
                }`}
              >
                YouTube Videos ({youtubeUrls.length})
              </button>
            </div>
          </Drawer.Header>

          <Drawer.Body className="flex flex-col gap-4 overflow-y-auto px-6 py-4 flex-1">
            {/* TAB 1: GENERAL & RANKING */}
            {activeTab === "general" && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="edit-name" className="text-xs font-semibold">
                    Category Name *
                  </Label>
                  <Input
                    id="edit-name"
                    size="small"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="edit-handle" className="text-xs font-semibold">
                    Handle (URL slug)
                  </Label>
                  <Input
                    id="edit-handle"
                    size="small"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-ui-bg-subtle border border-ui-border-base">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="edit-rank" className="text-xs font-semibold">
                      Storefront Ranking (Sort Order)
                    </Label>
                    <span className="text-[10px] font-mono text-ui-fg-muted">
                      Controls Storefront 2 & Monfil
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      id="edit-rank"
                      type="number"
                      size="small"
                      value={rank}
                      onChange={(e) => setRank(Number(e.target.value))}
                      className="w-24"
                    />
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setRank((r) => Math.max(0, r - 1))}
                        className="px-2 py-1 text-xs font-medium rounded border border-ui-border-base bg-ui-bg-base hover:bg-ui-bg-subtle transition-colors"
                        title="Move Earlier in Storefront"
                      >
                        ↑ Earlier
                      </button>
                      <button
                        type="button"
                        onClick={() => setRank((r) => r + 1)}
                        className="px-2 py-1 text-xs font-medium rounded border border-ui-border-base bg-ui-bg-base hover:bg-ui-bg-subtle transition-colors"
                        title="Move Later in Storefront"
                      >
                        ↓ Later
                      </button>
                      <button
                        type="button"
                        onClick={() => setRank(0)}
                        className="px-2 py-1 text-xs font-medium rounded border border-ui-border-base bg-ui-bg-base hover:bg-ui-bg-subtle transition-colors"
                        title="Set as First Category"
                      >
                        Top (#0)
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-ui-fg-muted leading-relaxed">
                    Categories are sorted by rank ASC (0, 1, 2...). Lower numbers appear first on your storefront navigation menu.
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="edit-desc" className="text-xs font-semibold">
                    Description
                  </Label>
                  <Textarea
                    id="edit-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-ui-border-base">
                  <div>
                    <Label className="text-xs font-semibold">Active Status</Label>
                    <Text size="xsmall" className="text-ui-fg-muted">
                      Visible to shoppers on enabled storefronts
                    </Text>
                  </div>
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs font-semibold">Internal Only</Label>
                    <Text size="xsmall" className="text-ui-fg-muted">
                      Hidden from public storefront navigation
                    </Text>
                  </div>
                  <Switch checked={isInternal} onCheckedChange={setIsInternal} />
                </div>

                <div className="pt-3 border-t border-ui-border-base">
                  <Button
                    type="button"
                    variant="danger"
                    size="small"
                    onClick={handleDelete}
                    isLoading={isDeleting}
                    className="w-full flex items-center justify-center gap-1.5"
                  >
                    <Trash className="w-3.5 h-3.5" />
                    <span>Delete Category</span>
                  </Button>
                </div>
              </div>
            )}

            {/* TAB 2: PRODUCTS MANAGEMENT */}
            {activeTab === "products" && (
              <div className="flex flex-col gap-3">
                <CategoryProductsManager
                  categoryId={category.id}
                  categoryName={category.name}
                  initialMetadata={currentMetadata}
                  onMetadataUpdate={(meta) => {
                    setCurrentMetadata(meta)
                  }}
                />
              </div>
            )}

            {/* TAB 3: STOREFRONTS & MEDIA */}
            {activeTab === "channels" && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label className="text-xs font-semibold">Storefront Visibility</Label>
                  <Text size="xsmall" className="text-ui-fg-muted">
                    Designate which storefront sales channels display this category.
                  </Text>
                  <div className="flex flex-col gap-2 mt-1">
                    {salesChannels.map((channel) => {
                      const isChecked = selectedChannels.includes(channel.id)
                      return (
                        <label
                          key={channel.id}
                          className="flex items-center gap-2.5 text-xs text-ui-fg-base cursor-pointer select-none p-2 rounded-lg border border-ui-border-base bg-ui-bg-subtle/40 hover:bg-ui-bg-subtle"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleChannel(channel.id)}
                            className="rounded border-ui-border-base text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          <span className="font-medium">{channel.name}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>

                {/* Category Media / Images Upload & Gallery */}
                <div className="flex flex-col gap-3 pt-3 border-t border-ui-border-base">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs font-semibold">Category Media</Label>
                      <Text size="xsmall" className="text-ui-fg-muted">
                        Upload category thumbnails and banners. Automatically handled by your configured S3 or storage provider.
                      </Text>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-ui-bg-base hover:bg-ui-bg-subtle text-ui-fg-base border border-ui-border-base rounded-lg shadow-2xs transition-colors cursor-pointer"
                    >
                      <ArrowDownTray className="w-3.5 h-3.5" />
                      <span>{isUploading ? "Uploading…" : "Upload Media"}</span>
                    </button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                    onChange={(e) => handleFileUpload(e.target.files)}
                    className="hidden"
                  />

                  {/* Drag and Drop Upload Zone */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      if (!isUploading) handleFileUpload(e.dataTransfer.files)
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-ui-border-strong hover:border-ui-border-interactive rounded-xl p-6 flex flex-col items-center justify-center gap-2 bg-ui-bg-subtle/30 hover:bg-ui-bg-subtle/60 transition-colors cursor-pointer text-center"
                  >
                    <div className="w-10 h-10 rounded-full bg-ui-bg-base border border-ui-border-base flex items-center justify-center text-ui-fg-subtle shadow-2xs">
                      <ArrowDownTray className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-semibold text-ui-fg-base">
                        {isUploading ? "Uploading to storage…" : "Click to upload or drag & drop images"}
                      </span>
                      <span className="text-[11px] text-ui-fg-muted">
                        PNG, JPG, WEBP, GIF, SVG up to 10MB
                      </span>
                    </div>
                  </div>

                  {/* Uploaded Images Gallery */}
                  {categoryImages.length > 0 && (
                    <div className="flex flex-col gap-2 mt-2">
                      <Label className="text-xs font-medium text-ui-fg-muted">
                        Uploaded Images ({categoryImages.length})
                      </Label>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                        {categoryImages.map((img, idx) => {
                          const isThumbnail = img.type === "thumbnail" || img.url === imageUrl
                          return (
                            <div
                              key={img.id || idx}
                              className={`group relative aspect-square rounded-xl overflow-hidden border bg-ui-bg-base transition-all shadow-xs ${
                                isThumbnail
                                  ? "ring-2 ring-blue-500 border-transparent"
                                  : "border-ui-border-base hover:border-ui-border-strong"
                              }`}
                            >
                              <img
                                src={img.url}
                                alt="Category Media"
                                className="w-full h-full object-cover"
                              />

                              {isThumbnail && (
                                <div className="absolute top-1.5 left-1.5 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                                  ★ Thumbnail
                                </div>
                              )}

                              {/* Hover Action Overlay */}
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1.5">
                                {!isThumbnail && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      handleSetThumbnail(img)
                                    }}
                                    className="px-2 py-0.5 bg-white text-neutral-900 rounded text-[10px] font-semibold hover:bg-neutral-100 transition-colors shadow-xs"
                                  >
                                    Set Thumbnail
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    handleDeleteImage(img)
                                  }}
                                  className="p-1 bg-rose-600 text-white rounded hover:bg-rose-700 transition-colors"
                                  title="Remove image"
                                >
                                  <Trash className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Manual URL input fallback */}
                  <div className="flex flex-col gap-1 mt-1 pt-2 border-t border-ui-border-base/50">
                    <Label htmlFor="edit-image" className="text-[11px] text-ui-fg-muted">
                      Or paste an external image URL
                    </Label>
                    <Input
                      id="edit-image"
                      size="small"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://example.com/category-image.jpg"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: YOUTUBE VIDEOS */}
            {activeTab === "youtube" && (
              <div className="flex flex-col gap-4">
                <div>
                  <h4 className="text-xs font-semibold text-ui-fg-base">
                    Category Demonstration Videos (YouTube)
                  </h4>
                  <p className="text-xs text-ui-fg-muted mt-0.5">
                    Attach YouTube video demonstration links to show interactive video carousels on the storefront category page.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    size="small"
                    placeholder="Paste YouTube watch URL, shorts, or video ID…"
                    value={newYoutubeInput}
                    onChange={(e) => setNewYoutubeInput(e.target.value)}
                    className="flex-1 text-xs"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleAddYoutube()
                      }
                    }}
                  />
                  <Button
                    size="small"
                    type="button"
                    variant="secondary"
                    onClick={handleAddYoutube}
                    className="flex items-center gap-1 text-xs flex-shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Video</span>
                  </Button>
                </div>

                {youtubeUrls.length === 0 ? (
                  <div className="p-8 text-center text-xs text-ui-fg-muted border border-dashed border-ui-border-base rounded-xl">
                    No demonstration videos attached yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {youtubeUrls.map((url) => {
                      const id = extractYouTubeVideoId(url)
                      const thumb = id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null
                      return (
                        <div
                          key={url}
                          className="flex flex-col border border-ui-border-base rounded-xl overflow-hidden bg-ui-bg-subtle/40 shadow-xs"
                        >
                          <div className="relative aspect-video bg-black/80 overflow-hidden flex items-center justify-center">
                            {thumb ? (
                              <img src={thumb} alt="YouTube Preview" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xs text-white">Video</span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveYoutube(url)}
                              className="absolute top-1.5 right-1.5 p-1 bg-black/70 hover:bg-rose-600 text-white rounded-full transition-colors"
                              title="Remove video"
                            >
                              <Trash className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="p-2">
                            <span className="text-[10px] text-ui-fg-muted truncate block font-mono" title={url}>
                              {url}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </Drawer.Body>

          <Drawer.Footer className="flex justify-end gap-2 px-6 py-4 border-t border-ui-border-base">
            <Button
              type="button"
              variant="secondary"
              size="small"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting || isDeleting}
            >
              Close
            </Button>
            <Button
              type="submit"
              size="small"
              isLoading={isSubmitting}
              disabled={isSubmitting || !name.trim() || isDeleting}
            >
              Save Category
            </Button>
          </Drawer.Footer>
        </form>
      </Drawer.Content>
    </Drawer>
  )
}
