import React, { memo } from "react"
import { Handle, Position } from "@xyflow/react"
import { Text } from "@medusajs/ui"
import { Plus, PencilSquare, Folder, ArrowUturnLeft } from "@medusajs/icons"
import { TierBars } from "./tier-bars"
import { CategoryNodeData } from "./types"

interface CategoryNodeProps {
  id: string
  data: CategoryNodeData
  selected?: boolean
}

export const CategoryNode = memo(({ id, data, selected }: CategoryNodeProps) => {
  const {
    category,
    tier,
    siblingRank,
    superscriptRank,
    branchColor,
    salesChannels,
    isCollapsed,
    hiddenDescendantCount,
    direction,
    isDimmed,
    onToggleCollapse,
    onAddChild,
    onEdit,
    onDetach,
    onMoveSiblingUp,
    onMoveSiblingDown,
  } = data

  const isTB = direction === "TB"
  const hasChildren = category.has_children || category.children_count > 0

  const assignedStorefrontNames = (category.sales_channels || []).map((scId) => {
    const sc = salesChannels.find((s) => s.id === scId)
    return sc?.name || scId
  })

  return (
    <div
      className={`group relative flex items-stretch w-[270px] h-[86px] rounded-xl border bg-ui-bg-base transition-all duration-150 select-none ${
        selected
          ? "ring-2 ring-ui-border-interactive border-transparent shadow-lg"
          : "border-ui-border-base shadow-sm hover:shadow-md hover:border-ui-border-strong"
      } ${isDimmed ? "opacity-35 grayscale" : "opacity-100"}`}
      style={
        selected && branchColor
          ? {
              boxShadow: `0 0 0 2px ${branchColor}, 0 10px 15px -3px rgba(0, 0, 0, 0.1)`,
            }
          : undefined
      }
    >
      <Handle
        type="target"
        position={isTB ? Position.Top : Position.Left}
        className="!w-2.5 !h-2.5 !bg-ui-border-interactive !border-2 !border-white dark:!border-neutral-900 transition-transform group-hover:scale-125"
      />

      <TierBars tier={tier} color={branchColor} />

      <div className="flex flex-1 items-center gap-2.5 px-2.5 py-2 min-w-0 overflow-hidden">
        <div className="relative w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 border border-ui-border-base bg-ui-bg-subtle flex items-center justify-center shadow-2xs">
          {category.image_url ? (
            <img
              src={category.image_url}
              alt={category.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900 text-ui-fg-muted">
              <Folder className="w-5 h-5 opacity-70" />
            </div>
          )}
          <span
            className={`absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full border border-white dark:border-neutral-900 ${
              category.is_active ? "bg-emerald-500" : "bg-neutral-400"
            }`}
            title={category.is_active ? "Active" : "Inactive"}
          />
        </div>

        <div className="flex flex-col min-w-0 flex-1 justify-center">
          <div className="flex items-center gap-1 min-w-0">
            <span
              className="text-xs font-semibold text-ui-fg-base truncate leading-snug flex-1 min-w-0"
              title={category.name}
            >
              {category.name}
            </span>
            {superscriptRank && (
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <span
                  className="text-[11px] font-bold font-mono text-ui-fg-subtle px-1 py-0.5 rounded bg-ui-bg-subtle/80"
                  title={`Rank #${siblingRank} among siblings (Storefront sort order)`}
                >
                  {superscriptRank}
                </span>
                {onMoveSiblingUp && (
                  <button
                    type="button"
                    title="Move Up in Storefront Order (↑)"
                    onClick={(e) => {
                      e.stopPropagation()
                      onMoveSiblingUp(id)
                    }}
                    className="w-3.5 h-3.5 flex items-center justify-center text-[10px] font-bold text-ui-fg-muted hover:text-ui-fg-base hover:bg-ui-bg-subtle rounded transition-colors"
                  >
                    ↑
                  </button>
                )}
                {onMoveSiblingDown && (
                  <button
                    type="button"
                    title="Move Down in Storefront Order (↓)"
                    onClick={(e) => {
                      e.stopPropagation()
                      onMoveSiblingDown(id)
                    }}
                    className="w-3.5 h-3.5 flex items-center justify-center text-[10px] font-bold text-ui-fg-muted hover:text-ui-fg-base hover:bg-ui-bg-subtle rounded transition-colors"
                  >
                    ↓
                  </button>
                )}
              </div>
            )}
          </div>

          <span className="text-[11px] text-ui-fg-muted truncate leading-tight mt-0.5">
            /{category.handle}
          </span>

          <div className="flex items-center gap-1 mt-1 flex-wrap">
            {assignedStorefrontNames.slice(0, 2).map((name) => {
              const isSuperpunch = name.toLowerCase().includes("superpunch")
              const isMonfil = name.toLowerCase().includes("monfil")
              const badgeText = isSuperpunch ? "SP" : isMonfil ? "M" : name.slice(0, 2).toUpperCase()
              return (
                <span
                  key={name}
                  className="px-1 py-[1px] text-[9px] font-semibold rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200/60 dark:border-neutral-700/60"
                  title={`Storefront: ${name}`}
                >
                  {badgeText}
                </span>
              )
            })}

            {hasChildren && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleCollapse(id)
                }}
                className={`ml-auto px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-0.5 transition-colors ${
                  isCollapsed
                    ? "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300"
                }`}
                title={isCollapsed ? "Click to expand subcategories" : "Click to collapse subcategories"}
              >
                <span>{isCollapsed ? "▸" : "▾"}</span>
                <span>{isCollapsed ? `+${hiddenDescendantCount || category.children_count}` : category.children_count || "sub"}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="absolute -top-3 right-2 hidden group-hover:flex items-center gap-1 px-1.5 py-0.5 bg-ui-bg-base/95 backdrop-blur-sm border border-ui-border-base rounded-full shadow-md z-20">
        <button
          type="button"
          title="Add Subcategory"
          onClick={(e) => {
            e.stopPropagation()
            onAddChild(category)
          }}
          className="p-1 text-ui-fg-subtle hover:text-ui-fg-base hover:bg-ui-bg-subtle rounded-full transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          title="Edit Category"
          onClick={(e) => {
            e.stopPropagation()
            onEdit(category)
          }}
          className="p-1 text-ui-fg-subtle hover:text-ui-fg-base hover:bg-ui-bg-subtle rounded-full transition-colors"
        >
          <PencilSquare className="w-3.5 h-3.5" />
        </button>

        {category.parent_category_id && (
          <button
            type="button"
            title="Promote to Root (Detach)"
            onClick={(e) => {
              e.stopPropagation()
              onDetach(id)
            }}
            className="p-1 text-ui-fg-subtle hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-full transition-colors"
          >
            <ArrowUturnLeft className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <Handle
        type="source"
        position={isTB ? Position.Bottom : Position.Right}
        className="!w-2.5 !h-2.5 !bg-ui-border-interactive !border-2 !border-white dark:!border-neutral-900 transition-transform group-hover:scale-125"
      />
    </div>
  )
})

CategoryNode.displayName = "CategoryNode"
