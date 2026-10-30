import React, { useRef } from "react"
import { Button, Input, Label, Text } from "@medusajs/ui"
import { ArrowDownTray, Plus } from "@medusajs/icons"
import { SalesChannelInfo } from "../types"
import { GalleryImage } from "./types"

interface MediaTabProps {
  salesChannels: SalesChannelInfo[]
  selectedChannels: string[]
  toggleChannel: (channelId: string) => void
  categoryImages: GalleryImage[]
  imageUrl: string
  isUploading: boolean
  handleFileUpload: (files: FileList | null) => void
  handleSetThumbnail: (img: GalleryImage) => void
  handleSetBanner: (img: GalleryImage) => void
  handleDeleteImage: (img: GalleryImage) => void
  manualImageUrl: string
  setManualImageUrl: (url: string) => void
  handleAddManualImage: () => void
}

export const MediaTab: React.FC<MediaTabProps> = ({
  salesChannels,
  selectedChannels,
  toggleChannel,
  categoryImages,
  imageUrl,
  isUploading,
  handleFileUpload,
  handleSetThumbnail,
  handleSetBanner,
  handleDeleteImage,
  manualImageUrl,
  setManualImageUrl,
  handleAddManualImage,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex flex-col gap-4">
      {/* Storefront Visibility */}
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
              Upload category thumbnails and banners. Automatically handled by your configured storage provider.
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
                const isBanner =
                  img.type === "banner" ||
                  (!isThumbnail &&
                    categoryImages.length > 1 &&
                    categoryImages.find((i) => i.type === "banner")?.url === img.url)
                return (
                  <div
                    key={img.id || img.url || idx}
                    className={`group relative aspect-square rounded-xl overflow-hidden border bg-ui-bg-base transition-all shadow-xs ${
                      isThumbnail
                        ? "ring-2 ring-blue-500 border-transparent"
                        : isBanner
                        ? "ring-2 ring-emerald-500 border-transparent"
                        : "border-ui-border-base hover:border-ui-border-strong"
                    }`}
                  >
                    <img
                      src={img.url}
                      alt="Category Media"
                      className="w-full h-full object-contain p-1.5"
                    />

                    {isThumbnail && (
                      <div className="absolute top-1.5 left-1.5 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                        ★ Thumbnail
                      </div>
                    )}

                    {!isThumbnail && isBanner && (
                      <div className="absolute top-1.5 left-1.5 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                        🖼️ Hero Banner
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
                          className="w-full py-0.5 bg-white text-neutral-900 rounded text-[9px] font-semibold hover:bg-neutral-100 transition-colors shadow-xs text-center cursor-pointer"
                        >
                          Set Thumbnail
                        </button>
                      )}
                      {!isBanner && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleSetBanner(img)
                          }}
                          className="w-full py-0.5 bg-emerald-600 text-white rounded text-[9px] font-semibold hover:bg-emerald-700 transition-colors shadow-xs text-center cursor-pointer"
                        >
                          Set as Banner
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleDeleteImage(img)
                        }}
                        className="w-full py-0.5 bg-rose-600 text-white rounded text-[9px] font-semibold hover:bg-rose-700 transition-colors shadow-xs text-center cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Manual / External Image URL Entry */}
        <div className="flex flex-col gap-1.5 mt-2 p-3 rounded-xl border border-ui-border-base bg-ui-bg-subtle/30">
          <Label className="text-xs font-semibold text-ui-fg-base">
            External Image URL (CDN / Manual)
          </Label>
          <p className="text-[11px] text-ui-fg-muted">
            Or paste a direct image URL (S3, Cloudinary, Imgur, Supabase) to link without uploading.
          </p>
          <div className="flex items-center gap-2 mt-1 w-full">
            <div className="flex-1 min-w-[360px] sm:min-w-[500px]">
              <Input
                size="small"
                type="url"
                placeholder="https://example.com/category-image.jpg"
                value={manualImageUrl}
                onChange={(e) => setManualImageUrl(e.target.value)}
                className="text-xs w-full"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleAddManualImage()
                  }
                }}
              />
            </div>
            <Button
              type="button"
              size="small"
              variant="secondary"
              onClick={handleAddManualImage}
              disabled={!manualImageUrl.trim()}
              className="text-xs shrink-0"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add to Gallery
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
