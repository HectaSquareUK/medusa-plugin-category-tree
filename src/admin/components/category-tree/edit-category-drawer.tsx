import React, { useState, useEffect, useCallback, useRef } from "react"
import {
  Button,
  Drawer,
  toast,
} from "@medusajs/ui"
import { ArrowsPointingOut, ArrowUpRightMicro } from "@medusajs/icons"
import { CategoryTreeNode, SalesChannelInfo } from "./types"
import { CategoryProductsManager } from "./category-products-manager"
import { sdk } from "../../lib/sdk"
import { GalleryImage, EditTab, SaveNotification, extractYouTubeVideoId } from "./edit-category/types"
import { GeneralTab } from "./edit-category/general-tab"
import { MediaTab } from "./edit-category/media-tab"
import { YoutubeTab } from "./edit-category/youtube-tab"

export interface EditCategoryDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: CategoryTreeNode | null
  salesChannels: SalesChannelInfo[]
  onSuccess: (updatedCat: CategoryTreeNode) => void
  onDeleteSuccess: (deletedId: string) => void
}

interface EditCategoryDrawerContentProps {
  category: CategoryTreeNode
  salesChannels: SalesChannelInfo[]
  onClose: () => void
  onSuccess: (updatedCat: CategoryTreeNode) => void
  onDeleteSuccess: (deletedId: string) => void
}

const EditCategoryDrawerContent: React.FC<EditCategoryDrawerContentProps> = ({
  category,
  salesChannels,
  onClose,
  onSuccess,
  onDeleteSuccess,
}) => {
  // Navigation & View Mode
  const [activeTab, setActiveTab] = useState<EditTab>("general")
  const [isFullScreen, setIsFullScreen] = useState(false)

  // Form Fields
  const [name, setName] = useState(category.name || "")
  const [handle, setHandle] = useState(category.handle || "")
  const [description, setDescription] = useState(
    category.description || (category.metadata as any)?.description || ""
  )
  const [imageUrl, setImageUrl] = useState(category.image_url || "")
  const [rank, setRank] = useState(category.rank ?? 0)
  const [isActive, setIsActive] = useState(Boolean(category.is_active))
  const [isInternal, setIsInternal] = useState(Boolean(category.is_internal))
  const [selectedChannels, setSelectedChannels] = useState<string[]>(
    category.sales_channels || salesChannels.map((s) => s.id)
  )

  // YouTube Videos
  const [youtubeUrls, setYoutubeUrls] = useState<string[]>(() => {
    const meta = category.metadata as Record<string, any> | null
    const urls: string[] = []
    if (meta?.youtube_urls && Array.isArray(meta.youtube_urls)) {
      meta.youtube_urls.forEach((u) => typeof u === "string" && u.trim() && urls.push(u.trim()))
    } else if (meta?.youtube_url && typeof meta.youtube_url === "string" && meta.youtube_url.trim()) {
      urls.push(meta.youtube_url.trim())
    } else if (meta?.youtube_link && typeof meta.youtube_link === "string" && meta.youtube_link.trim()) {
      urls.push(meta.youtube_link.trim())
    } else if (meta?.video_url && typeof meta.video_url === "string" && meta.video_url.trim()) {
      urls.push(meta.video_url.trim())
    }
    return urls
  })
  const [newYoutubeInput, setNewYoutubeInput] = useState("")

  // Metadata & Media
  const [currentMetadata, setCurrentMetadata] = useState<Record<string, any>>(
    (category.metadata as Record<string, any>) || {}
  )
  const [categoryImages, setCategoryImages] = useState<GalleryImage[]>([])
  const [manualImageUrl, setManualImageUrl] = useState("")
  const [isUploading, setIsUploading] = useState(false)

  // Submission States
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Dirty State & Notifications
  const [isDirty, setIsDirty] = useState(false)
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)
  const [saveNotification, setSaveNotification] = useState<SaveNotification | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const triggerSaveNotification = useCallback((type: "success" | "error", message: string) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    setSaveNotification({ type, message })
    saveTimerRef.current = setTimeout(() => {
      setSaveNotification(null)
    }, 4000)
  }, [])

  // Load existing category media gallery
  const loadCategoryImages = useCallback(
    async (catId: string, currentImageUrl?: string, metadata?: Record<string, any>) => {
      try {
        const res = await sdk.client.fetch<{ category_images?: any[] }>(
          `/admin/categories/${catId}/images`
        )
        if (res?.category_images && Array.isArray(res.category_images) && res.category_images.length > 0) {
          const bannerUrl = metadata?.banner
          const mapped = res.category_images.map((img) => ({
            ...img,
            type: img.type === "thumbnail" ? "thumbnail" : img.url === bannerUrl ? "banner" : "image",
          }))
          setCategoryImages(mapped)
          const thumb = mapped.find((img) => img.type === "thumbnail") || mapped[0]
          if (thumb?.url) setImageUrl(thumb.url)
          return
        }
      } catch {
        // Fallback
      }

      if (metadata && Array.isArray(metadata.images)) {
        if (metadata.images.length === 0) {
          setCategoryImages([])
          setImageUrl("")
          return
        }
        setCategoryImages(metadata.images)
        const thumb = metadata.images.find((img: any) => img.type === "thumbnail") || metadata.images[0]
        if (thumb?.url) setImageUrl(thumb.url)
        return
      }

      const list: GalleryImage[] = []
      const thumb = metadata?.thumbnail || metadata?.image_url || currentImageUrl
      if (thumb) {
        list.push({ url: thumb, type: "thumbnail" })
      }
      const banner = metadata?.banner || (metadata?.image && metadata.image !== thumb ? metadata.image : null)
      if (banner && banner !== thumb) {
        list.push({ url: banner, type: "banner" })
      }
      setCategoryImages(list)
    },
    []
  )

  useEffect(() => {
    const meta = category.metadata as Record<string, any> | undefined
    loadCategoryImages(category.id, category.image_url || meta?.thumbnail || meta?.image, meta)
  }, [category.id, category.image_url, category.metadata, loadCategoryImages])

  // Mark dirty helper
  const handleMarkDirty = useCallback(() => {
    setIsDirty(true)
    setShowDiscardConfirm(false)
  }, [])

  // Channel toggling
  const toggleChannel = useCallback((channelId: string) => {
    setIsDirty(true)
    setShowDiscardConfirm(false)
    setSelectedChannels((prev) =>
      prev.includes(channelId) ? prev.filter((id) => id !== channelId) : [...prev, channelId]
    )
  }, [])

  // File upload handler
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setIsUploading(true)
    try {
      const fileList = Array.from(files)
      const res = await sdk.admin.upload.create({ files: fileList })
      const uploadedFiles = res.files || []
      if (uploadedFiles.length === 0) {
        throw new Error("No files returned from upload service")
      }

      const firstUrl = uploadedFiles[0].url
      if (!imageUrl) {
        setImageUrl(firstUrl)
      }

      const payload = uploadedFiles.map((f, i) => ({
        url: f.url,
        file_id: f.id || (f as any).file_id || (f as any).key || `file_${Date.now()}_${i}`,
        type: (categoryImages.length === 0 && i === 0 ? "thumbnail" : "image") as "thumbnail" | "image",
      }))

      try {
        await sdk.client.fetch(`/admin/categories/${category.id}/images`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: { images: payload },
        })
        await loadCategoryImages(category.id, firstUrl, currentMetadata)
      } catch {
        setCategoryImages((prev) => [
          ...prev,
          ...payload.map((p, i) => ({
            ...p,
            type: prev.length === 0 && i === 0 ? "thumbnail" : prev.length === 1 && i === 0 ? "banner" : "image",
          })),
        ])
      }

      setIsDirty(true)
      toast.success(`${uploadedFiles.length} image(s) uploaded successfully`)
      triggerSaveNotification("success", `${uploadedFiles.length} image(s) uploaded!`)
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload image")
      triggerSaveNotification("error", err?.message || "Failed to upload image")
    } finally {
      setIsUploading(false)
    }
  }

  // Set selected image as Category Thumbnail
  const handleSetThumbnail = async (img: GalleryImage) => {
    setImageUrl(img.url)
    setIsDirty(true)
    setShowDiscardConfirm(false)
    if (img.id) {
      try {
        const currentThumb = categoryImages.find((i) => i.type === "thumbnail")
        const updates: any[] = []
        if (currentThumb?.id && currentThumb.id !== img.id) {
          updates.push({ id: currentThumb.id, type: "image" })
        }
        updates.push({ id: img.id, type: "thumbnail" })
        await sdk.client.fetch(`/admin/categories/${category.id}/images/batch`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: { updates },
        })
        await loadCategoryImages(category.id, img.url, currentMetadata)
      } catch {
        setCategoryImages((prev) =>
          prev.map((item) => ({
            ...item,
            type: item.url === img.url ? "thumbnail" : item.type === "thumbnail" ? "image" : item.type,
          }))
        )
      }
    } else {
      setCategoryImages((prev) =>
        prev.map((item) => ({
          ...item,
          type: item.url === img.url ? "thumbnail" : item.type === "thumbnail" ? "image" : item.type,
        }))
      )
    }
    toast.success("Designated as category thumbnail (Nav & Cards)")
    triggerSaveNotification("success", "Designated as category thumbnail (click Save Category)")
  }

  // Set selected image as Hero Banner
  const handleSetBanner = (img: GalleryImage) => {
    setIsDirty(true)
    setShowDiscardConfirm(false)
    setCategoryImages((prev) =>
      prev.map((item) => {
        if (item.url === img.url) return { ...item, type: "banner" }
        if (item.type === "banner") return { ...item, type: "image" }
        return item
      })
    )
    toast.success("Designated as category hero banner")
    triggerSaveNotification("success", "Designated as hero banner (click Save Category)")
  }

  // Add external image URL
  const handleAddManualImage = () => {
    const raw = manualImageUrl.trim()
    if (!raw) return
    if (categoryImages.some((i) => i.url === raw)) {
      toast.error("Image already in gallery")
      return
    }
    const isFirst = categoryImages.length === 0
    const isSecond = categoryImages.length === 1
    const newType = isFirst ? "thumbnail" : isSecond ? "banner" : "image"
    setCategoryImages((prev) => [...prev, { url: raw, type: newType }])
    if (isFirst) setImageUrl(raw)
    setManualImageUrl("")
    setIsDirty(true)
    setShowDiscardConfirm(false)
    const msg = `Added to gallery as ${
      newType === "thumbnail" ? "Thumbnail" : newType === "banner" ? "Hero Banner" : "Image"
    } (click Save Category to persist)`
    toast.success(msg)
    triggerSaveNotification("success", msg)
  }

  // Delete category image
  const handleDeleteImage = async (img: GalleryImage) => {
    const remaining = categoryImages.filter(
      (i) => i.url !== img.url && (img.id ? i.id !== img.id : true)
    )
    const nextThumb =
      remaining.find((i) => i.type === "thumbnail") || remaining[0] || null
    const nextBanner =
      remaining.find((i) => i.type === "banner") ||
      (remaining.length > 1 ? remaining.find((i) => i.url !== nextThumb?.url) : null) ||
      null

    setCategoryImages(remaining)
    setImageUrl(nextThumb ? nextThumb.url : "")

    const updatedMeta: Record<string, any> = {
      ...(currentMetadata || {}),
      images: remaining,
      thumbnail: nextThumb ? nextThumb.url : null,
      image_url: nextThumb ? nextThumb.url : null,
      banner: nextBanner ? nextBanner.url : null,
      image: (nextBanner?.url || nextThumb?.url) || null,
    }
    setCurrentMetadata(updatedMeta)

    if (img.id) {
      try {
        await sdk.client.fetch(`/admin/categories/${category.id}/images/batch`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: { ids: [img.id] },
        })
      } catch (err: any) {
        console.warn("Could not delete from backend images endpoint:", err)
      }
    }

    try {
      await sdk.admin.productCategory.update(category.id, {
        metadata: updatedMeta,
      })
      const updatedCat: CategoryTreeNode = {
        ...category,
        image_url: nextThumb ? nextThumb.url : "",
        metadata: updatedMeta,
      }
      onSuccess(updatedCat)
      toast.success("Image removed and changes saved")
      triggerSaveNotification("success", "Image removed and changes saved")
    } catch (err: any) {
      console.warn("Could not immediately update category metadata on delete:", err)
      toast.info("Image removed from gallery (remember to save)")
      triggerSaveNotification("error", "Image removed locally (click Save Category)")
    }
  }

  // YouTube handlers
  const handleAddYoutube = async () => {
    const raw = newYoutubeInput.trim()
    if (!raw) return
    const id = extractYouTubeVideoId(raw)
    if (!id) {
      toast.error("Please enter a valid YouTube URL or video ID")
      triggerSaveNotification("error", "Please enter a valid YouTube URL or video ID")
      return
    }
    const cleanUrl = `https://www.youtube.com/watch?v=${id}`
    if (youtubeUrls.includes(cleanUrl)) {
      toast.error("Video already added")
      triggerSaveNotification("error", "Video already added")
      return
    }
    const nextUrls = [...youtubeUrls, cleanUrl]
    setYoutubeUrls(nextUrls)
    setNewYoutubeInput("")

    const updatedMeta = {
      ...(currentMetadata || {}),
      youtube_urls: nextUrls,
      youtube_url: nextUrls[0] || null,
      youtube_link: nextUrls[0] || null,
      video_url: nextUrls[0] || null,
    }
    setCurrentMetadata(updatedMeta)

    try {
      await sdk.admin.productCategory.update(category.id, {
        metadata: updatedMeta,
      })
      onSuccess({
        ...category,
        metadata: updatedMeta,
      })
      toast.success("YouTube video added and saved")
      triggerSaveNotification("success", "YouTube video added and saved!")
    } catch {
      toast.success("YouTube video added")
      triggerSaveNotification("success", "YouTube video added!")
    }
  }

  const handleRemoveYoutube = async (urlToRemove: string) => {
    const nextUrls = youtubeUrls.filter((u) => u !== urlToRemove)
    setYoutubeUrls(nextUrls)
    const updatedMeta = {
      ...(currentMetadata || {}),
      youtube_urls: nextUrls,
      youtube_url: nextUrls[0] || null,
      youtube_link: nextUrls[0] || null,
      video_url: nextUrls[0] || null,
    }
    setCurrentMetadata(updatedMeta)

    try {
      await sdk.admin.productCategory.update(category.id, {
        metadata: updatedMeta,
      })
      onSuccess({
        ...category,
        metadata: updatedMeta,
      })
      toast.success("Video removed and changes saved")
      triggerSaveNotification("success", "Video removed and changes saved!")
    } catch {
      toast.info("Video removed (remember to save)")
      triggerSaveNotification("error", "Video removed locally (click Save Category)")
    }
  }

  // Submit / Save Category
  const handleSubmit = async (eOrClose?: React.FormEvent | boolean, closeAfter: boolean = false) => {
    let shouldClose = closeAfter
    if (typeof eOrClose === "boolean") {
      shouldClose = eOrClose
    } else if (eOrClose && (eOrClose as any).preventDefault) {
      (eOrClose as any).preventDefault()
    }
    if (!name.trim()) {
      toast.error("Category name is required")
      triggerSaveNotification("error", "Category name is required")
      return
    }

    setIsSubmitting(true)
    try {
      const thumbImg =
        categoryImages.find((img) => img.type === "thumbnail") ||
        categoryImages[0] ||
        null
      const bannerImg =
        categoryImages.find((img) => img.type === "banner") ||
        (categoryImages.length > 1 ? categoryImages.find((img) => img.url !== thumbImg?.url) : null) ||
        null

      const descValue = description.trim()

      const updatedMetadata: Record<string, any> = {
        ...(currentMetadata || {}),
        description: descValue || null,
        sales_channels: selectedChannels,
        youtube_urls: youtubeUrls,
        youtube_url: youtubeUrls[0] || null,
        youtube_link: youtubeUrls[0] || null,
        video_url: youtubeUrls[0] || null,
        images: categoryImages,
        thumbnail: thumbImg ? thumbImg.url : null,
        image_url: thumbImg ? thumbImg.url : null,
        banner: bannerImg ? bannerImg.url : null,
        image: (bannerImg?.url || thumbImg?.url) || null,
      }

      // Safe description: sending "" when blank prevents 400 Bad Request
      await sdk.admin.productCategory.update(category.id, {
        name: name.trim(),
        handle: handle.trim() || undefined,
        description: descValue,
        rank: Number(rank) || 0,
        is_active: isActive,
        is_internal: isInternal,
        metadata: updatedMetadata,
      })

      const updated: CategoryTreeNode = {
        ...category,
        name: name.trim(),
        handle: handle.trim(),
        description: descValue ? descValue : null,
        image_url: thumbImg ? thumbImg.url : "",
        rank: Number(rank) || 0,
        sales_channels: selectedChannels,
        is_active: isActive,
        is_internal: isInternal,
        metadata: updatedMetadata,
      }

      setIsDirty(false)
      setShowDiscardConfirm(false)
      toast.success("Category changes saved successfully")
      triggerSaveNotification("success", "Changes saved successfully!")
      onSuccess(updated)
      if (shouldClose) {
        onClose()
      }
    } catch (err: any) {
      const errMsg = err?.message || "Failed to update category"
      toast.error(errMsg)
      triggerSaveNotification("error", errMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete Category
  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete category "${category.name}"? Subcategories will be promoted.`)) {
      return
    }

    setIsDeleting(true)
    try {
      await sdk.admin.productCategory.delete(category.id)
      toast.success(`Category "${category.name}" deleted`)
      onDeleteSuccess(category.id)
      onClose()
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete category")
      triggerSaveNotification("error", err?.message || "Failed to delete category")
    } finally {
      setIsDeleting(false)
    }
  }

  // Close handler with dirty check
  const handleClose = () => {
    if (isDirty && !showDiscardConfirm) {
      setShowDiscardConfirm(true)
      return
    }
    setIsDirty(false)
    setShowDiscardConfirm(false)
    onClose()
  }

  return (
    <Drawer.Content
      className={`transition-all duration-300 w-full z-50 ${
        isFullScreen
          ? "!max-w-full !w-screen !h-screen !inset-0 !rounded-none"
          : "max-w-5xl xl:max-w-6xl w-[92vw]"
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Drawer Header */}
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
              <button
                type="button"
                onClick={() => setIsFullScreen((prev) => !prev)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-ui-fg-subtle hover:text-ui-fg-base rounded-lg border border-ui-border-base bg-ui-bg-subtle hover:bg-ui-bg-base shadow-2xs transition-colors cursor-pointer"
                title={isFullScreen ? "Exit Fullscreen" : "Expand to Full Page Modal"}
              >
                <ArrowsPointingOut className="w-3.5 h-3.5" />
                <span>{isFullScreen ? "Exit Fullscreen" : "Full Page"}</span>
              </button>

              <button
                type="button"
                onClick={() => window.open(`/app/categories/${category.id}`, "_blank")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-ui-fg-subtle hover:text-ui-fg-base rounded-lg border border-ui-border-base bg-ui-bg-subtle hover:bg-ui-bg-base shadow-2xs transition-colors cursor-pointer"
                title="Open full category details page in a new tab"
              >
                <span>Open Full Page</span>
                <ArrowUpRightMicro className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Sub-tab Navigation */}
          <div className="flex items-center gap-1 mt-3 border-b border-ui-border-base -mb-3">
            <button
              type="button"
              onClick={() => setActiveTab("general")}
              className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
                activeTab === "general"
                  ? "border-blue-600 text-blue-600 font-semibold"
                  : "border-transparent text-ui-fg-muted hover:text-ui-fg-base"
              }`}
            >
              General & Ranking
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("products")}
              className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
                activeTab === "products"
                  ? "border-blue-600 text-blue-600 font-semibold"
                  : "border-transparent text-ui-fg-muted hover:text-ui-fg-base"
              }`}
            >
              Products Management
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("channels")}
              className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
                activeTab === "channels"
                  ? "border-blue-600 text-blue-600 font-semibold"
                  : "border-transparent text-ui-fg-muted hover:text-ui-fg-base"
              }`}
            >
              Storefronts & Media
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("youtube")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
                activeTab === "youtube"
                  ? "border-blue-600 text-blue-600 font-semibold"
                  : "border-transparent text-ui-fg-muted hover:text-ui-fg-base"
              }`}
            >
              <span>YouTube Videos</span>
              {youtubeUrls.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {youtubeUrls.length}
                </span>
              )}
            </button>
          </div>
        </Drawer.Header>

        {/* Drawer Body */}
        <Drawer.Body className="overflow-y-auto flex-1 p-6">
          {activeTab === "general" && (
            <GeneralTab
              name={name}
              setName={setName}
              handle={handle}
              setHandle={setHandle}
              rank={rank}
              setRank={setRank}
              description={description}
              setDescription={setDescription}
              isActive={isActive}
              setIsActive={setIsActive}
              isInternal={isInternal}
              setIsInternal={setIsInternal}
              onDirty={handleMarkDirty}
              onDelete={handleDelete}
              isDeleting={isDeleting}
            />
          )}

          {activeTab === "products" && (
            <CategoryProductsManager
              categoryId={category.id}
              categoryName={category.name}
              initialMetadata={currentMetadata}
              onMetadataUpdate={(meta) => {
                setCurrentMetadata(meta)
              }}
            />
          )}

          {activeTab === "channels" && (
            <MediaTab
              salesChannels={salesChannels}
              selectedChannels={selectedChannels}
              toggleChannel={toggleChannel}
              categoryImages={categoryImages}
              imageUrl={imageUrl}
              isUploading={isUploading}
              handleFileUpload={handleFileUpload}
              handleSetThumbnail={handleSetThumbnail}
              handleSetBanner={handleSetBanner}
              handleDeleteImage={handleDeleteImage}
              manualImageUrl={manualImageUrl}
              setManualImageUrl={setManualImageUrl}
              handleAddManualImage={handleAddManualImage}
            />
          )}

          {activeTab === "youtube" && (
            <YoutubeTab
              youtubeUrls={youtubeUrls}
              newYoutubeInput={newYoutubeInput}
              setNewYoutubeInput={setNewYoutubeInput}
              handleAddYoutube={handleAddYoutube}
              handleRemoveYoutube={handleRemoveYoutube}
            />
          )}
        </Drawer.Body>

        {/* Drawer Footer */}
        <Drawer.Footer className="flex flex-col gap-2 px-6 py-4 border-t border-ui-border-base">
          {showDiscardConfirm && (
            <div className="flex items-center justify-between gap-3 w-full px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-xs">
              <span className="font-medium">
                You have unsaved changes. Discard changes and close?
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  type="button"
                  size="small"
                  variant="secondary"
                  onClick={() => setShowDiscardConfirm(false)}
                >
                  Keep Editing
                </Button>
                <Button
                  type="button"
                  size="small"
                  variant="danger"
                  onClick={() => {
                    setIsDirty(false)
                    setShowDiscardConfirm(false)
                    onClose()
                  }}
                >
                  Discard & Close
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between w-full gap-2">
            <div className="flex items-center">
              {saveNotification && (
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shadow-2xs ${
                    saveNotification.type === "success"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800"
                      : "bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-800"
                  }`}
                >
                  {saveNotification.type === "success" ? "✓ " : "⚠ "}
                  {saveNotification.message}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <Button
                type="button"
                variant="secondary"
                size="small"
                onClick={handleClose}
                disabled={isSubmitting || isDeleting}
              >
                Close
              </Button>
              <Button
                type="button"
                size="small"
                onClick={() => handleSubmit(false)}
                isLoading={isSubmitting}
                disabled={isSubmitting || !name.trim() || isDeleting}
              >
                {saveNotification?.type === "success" ? "✓ Saved!" : "Save Category"}
              </Button>
            </div>
          </div>
        </Drawer.Footer>
      </div>
    </Drawer.Content>
  )
}

export const EditCategoryDrawer: React.FC<EditCategoryDrawerProps> = ({
  open,
  onOpenChange,
  category,
  salesChannels,
  onSuccess,
  onDeleteSuccess,
}) => {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      {open && category && (
        <EditCategoryDrawerContent
          key={category.id}
          category={category}
          salesChannels={salesChannels}
          onClose={() => onOpenChange(false)}
          onSuccess={onSuccess}
          onDeleteSuccess={onDeleteSuccess}
        />
      )}
    </Drawer>
  )
}
