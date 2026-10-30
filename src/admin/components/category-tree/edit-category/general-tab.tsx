import React from "react"
import { Button, Input, Label, Switch, Text, Textarea } from "@medusajs/ui"
import { Trash } from "@medusajs/icons"

interface GeneralTabProps {
  name: string
  setName: (val: string) => void
  handle: string
  setHandle: (val: string) => void
  rank: number
  setRank: React.Dispatch<React.SetStateAction<number>>
  description: string
  setDescription: (val: string) => void
  isActive: boolean
  setIsActive: (val: boolean) => void
  isInternal: boolean
  setIsInternal: (val: boolean) => void
  onDirty: () => void
  onDelete: () => void
  isDeleting: boolean
}

export const GeneralTab: React.FC<GeneralTabProps> = ({
  name,
  setName,
  handle,
  setHandle,
  rank,
  setRank,
  description,
  setDescription,
  isActive,
  setIsActive,
  isInternal,
  setIsInternal,
  onDirty,
  onDelete,
  isDeleting,
}) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="edit-name" className="text-xs font-semibold">
          Category Name *
        </Label>
        <Input
          id="edit-name"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            onDirty()
          }}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="edit-handle" className="text-xs font-semibold">
          Handle (URL Slug)
        </Label>
        <Input
          id="edit-handle"
          value={handle}
          onChange={(e) => {
            setHandle(e.target.value)
            onDirty()
          }}
          placeholder="e.g. rayon-embroidery-thread"
        />
      </div>

      {/* Direct Rank Modifier */}
      <div className="flex flex-col gap-1.5 p-3 rounded-xl border border-ui-border-base bg-ui-bg-subtle/50">
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
            onChange={(e) => {
              setRank(Number(e.target.value))
              onDirty()
            }}
            className="w-24"
          />
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setRank((r) => Math.max(0, r - 1))
                onDirty()
              }}
              className="px-2 py-1 text-xs font-medium rounded border border-ui-border-base bg-ui-bg-base hover:bg-ui-bg-subtle transition-colors cursor-pointer"
              title="Move Earlier in Storefront"
            >
              ↑ Earlier
            </button>
            <button
              type="button"
              onClick={() => {
                setRank((r) => r + 1)
                onDirty()
              }}
              className="px-2 py-1 text-xs font-medium rounded border border-ui-border-base bg-ui-bg-base hover:bg-ui-bg-subtle transition-colors cursor-pointer"
              title="Move Later in Storefront"
            >
              ↓ Later
            </button>
            <button
              type="button"
              onClick={() => {
                setRank(0)
                onDirty()
              }}
              className="px-2 py-1 text-xs font-medium rounded border border-ui-border-base bg-ui-bg-base hover:bg-ui-bg-subtle transition-colors cursor-pointer"
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
          onChange={(e) => {
            setDescription(e.target.value)
            onDirty()
          }}
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
        <Switch
          checked={isActive}
          onCheckedChange={(val) => {
            setIsActive(val)
            onDirty()
          }}
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <Label className="text-xs font-semibold">Internal Only</Label>
          <Text size="xsmall" className="text-ui-fg-muted">
            Hidden from public storefront navigation
          </Text>
        </div>
        <Switch
          checked={isInternal}
          onCheckedChange={(val) => {
            setIsInternal(val)
            onDirty()
          }}
        />
      </div>

      <div className="pt-3 border-t border-ui-border-base">
        <Button
          type="button"
          variant="danger"
          size="small"
          onClick={onDelete}
          isLoading={isDeleting}
          className="w-full flex items-center justify-center gap-1.5"
        >
          <Trash className="w-3.5 h-3.5" />
          <span>Delete Category</span>
        </Button>
      </div>
    </div>
  )
}
