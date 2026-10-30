import React from "react"
import { Button, Input } from "@medusajs/ui"
import { Plus, Trash } from "@medusajs/icons"
import { extractYouTubeVideoId } from "./types"

interface YoutubeTabProps {
  youtubeUrls: string[]
  newYoutubeInput: string
  setNewYoutubeInput: (val: string) => void
  handleAddYoutube: () => void
  handleRemoveYoutube: (url: string) => void
}

export const YoutubeTab: React.FC<YoutubeTabProps> = ({
  youtubeUrls,
  newYoutubeInput,
  setNewYoutubeInput,
  handleAddYoutube,
  handleRemoveYoutube,
}) => {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h4 className="text-xs font-semibold text-ui-fg-base">
          Category Demonstration Videos (YouTube)
        </h4>
        <p className="text-xs text-ui-fg-muted mt-0.5">
          Attach YouTube video demonstration links to show interactive video carousels on the storefront category page.
        </p>
      </div>

      <div className="flex items-center gap-2 w-full">
        <div className="flex-1 min-w-[360px] sm:min-w-[500px]">
          <Input
            size="small"
            placeholder="Paste YouTube watch URL, shorts, or video ID…"
            value={newYoutubeInput}
            onChange={(e) => setNewYoutubeInput(e.target.value)}
            className="w-full text-xs"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                handleAddYoutube()
              }
            }}
          />
        </div>
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
                    className="absolute top-1.5 right-1.5 p-1 bg-black/70 hover:bg-rose-600 text-white rounded-full transition-colors cursor-pointer"
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
  )
}
