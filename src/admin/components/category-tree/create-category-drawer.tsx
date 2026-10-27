import React, { useState, useEffect } from "react"
import { Button, Drawer, Input, Label, Switch, Text, Textarea, toast } from "@medusajs/ui"
import { CategoryTreeNode, SalesChannelInfo } from "./types"
import { sdk } from "../../lib/sdk"

export interface CreateCategoryDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  parentCategory: CategoryTreeNode | null
  salesChannels: SalesChannelInfo[]
  onSuccess: (newCat: CategoryTreeNode) => void
}

export const CreateCategoryDrawer: React.FC<CreateCategoryDrawerProps> = ({
  open,
  onOpenChange,
  parentCategory,
  salesChannels,
  onSuccess,
}) => {
  const [name, setName] = useState("")
  const [handle, setHandle] = useState("")
  const [description, setDescription] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [isInternal, setIsInternal] = useState(false)
  const [selectedChannels, setSelectedChannels] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setName("")
      setHandle("")
      setDescription("")
      setImageUrl("")
      setIsActive(true)
      setIsInternal(false)
      if (parentCategory?.sales_channels) {
        setSelectedChannels(parentCategory.sales_channels)
      } else {
        setSelectedChannels(salesChannels.map((sc) => sc.id))
      }
    }
  }, [open, parentCategory, salesChannels])

  const handleNameChange = (val: string) => {
    setName(val)
    if (!handle || handle === name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")) {
      setHandle(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
      )
    }
  }

  const toggleChannel = (channelId: string) => {
    setSelectedChannels((prev) =>
      prev.includes(channelId)
        ? prev.filter((id) => id !== channelId)
        : [...prev, channelId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Category name is required")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await sdk.client.fetch<{ category: CategoryTreeNode }>(
        "/admin/category-tree/create",
        {
          method: "POST",
          body: {
            name: name.trim(),
            handle: handle.trim() || undefined,
            description: description.trim() || undefined,
            parent_category_id: parentCategory ? parentCategory.id : null,
            image_url: imageUrl.trim() || undefined,
            sales_channels: selectedChannels,
            is_active: isActive,
            is_internal: isInternal,
          },
        }
      )

      toast.success(`Category "${name}" created successfully`)
      onSuccess(res.category)
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err?.message || "Failed to create category")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <Drawer.Content className="max-w-md">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <Drawer.Header>
            <Drawer.Title>
              {parentCategory ? `New Subcategory under "${parentCategory.name}"` : "New Root Category"}
            </Drawer.Title>
            <Drawer.Description>
              {parentCategory
                ? `Will be created at Tier ${(parentCategory.tier || 1) + 1} and linked in the hierarchy.`
                : "Creates a top-level Tier 1 main category in the store."}
            </Drawer.Description>
          </Drawer.Header>

          <Drawer.Body className="flex flex-col gap-4 overflow-y-auto px-6 py-4 flex-1">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cat-name" className="text-xs font-semibold">
                Category Name *
              </Label>
              <Input
                id="cat-name"
                size="small"
                placeholder="e.g. Embroidery Thread"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cat-handle" className="text-xs font-semibold">
                Handle (URL slug)
              </Label>
              <Input
                id="cat-handle"
                size="small"
                placeholder="e.g. embroidery-thread"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cat-image" className="text-xs font-semibold">
                Category Image URL
              </Label>
              <Input
                id="cat-image"
                size="small"
                placeholder="https://... or /images/..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
              {imageUrl && (
                <div className="mt-1 w-16 h-16 rounded-lg overflow-hidden border border-ui-border-base bg-ui-bg-subtle">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      ;(e.target as any).style.display = "none"
                    }}
                  />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cat-desc" className="text-xs font-semibold">
                Description
              </Label>
              <Textarea
                id="cat-desc"
                placeholder="Brief summary of this category..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-ui-border-base">
              <Label className="text-xs font-semibold">Storefront Visibility</Label>
              <Text size="xsmall" className="text-ui-fg-muted">
                Designate which storefronts can display this category.
              </Text>
              <div className="flex flex-col gap-2 mt-1">
                {salesChannels.map((channel) => {
                  const isChecked = selectedChannels.includes(channel.id)
                  return (
                    <label
                      key={channel.id}
                      className="flex items-center gap-2.5 text-xs text-ui-fg-base cursor-pointer select-none"
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
          </Drawer.Body>

          <Drawer.Footer className="flex justify-end gap-2 px-6 py-4 border-t border-ui-border-base">
            <Button
              type="button"
              variant="secondary"
              size="small"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="small"
              isLoading={isSubmitting}
              disabled={isSubmitting || !name.trim()}
            >
              Create Category
            </Button>
          </Drawer.Footer>
        </form>
      </Drawer.Content>
    </Drawer>
  )
}
