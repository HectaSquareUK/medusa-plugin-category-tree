import React from "react"
import { Button } from "@medusajs/ui"
import {
  ArrowsPointingOut,
  MagnifyingGlass,
  Plus,
} from "@medusajs/icons"
import { SalesChannelInfo } from "./types"

export interface CanvasDockProps {
  salesChannels: SalesChannelInfo[]
  selectedStorefront: string
  onSelectStorefront: (val: string) => void

  direction: "TB" | "LR"
  onToggleDirection: () => void

  searchQuery: string
  onSearchChange: (q: string) => void

  onExpandAll: () => void
  onCollapseAll: () => void
  onFocusRoot: () => void

  selectedCount?: number
  onExpandSelected?: () => void
  onCollapseSelected?: () => void

  isBoxSelect?: boolean
  onToggleBoxSelect?: () => void

  onZoomIn: () => void
  onZoomOut: () => void
  onFitView: () => void

  onOpenCreateRoot: () => void

  dirtyCount: number
  isSaving: boolean
  onSave: () => void
  onReset: () => void
}

export const CanvasDock: React.FC<CanvasDockProps> = ({
  salesChannels,
  selectedStorefront,
  onSelectStorefront,
  direction,
  onToggleDirection,
  searchQuery,
  onSearchChange,
  onExpandAll,
  onCollapseAll,
  onFocusRoot,
  selectedCount = 0,
  onExpandSelected,
  onCollapseSelected,
  isBoxSelect = false,
  onToggleBoxSelect,
  onFitView,
  onOpenCreateRoot,
  dirtyCount,
  isSaving,
  onSave,
  onReset,
}) => {
  return (
    <div className="flex flex-col gap-2 items-center pointer-events-auto">
      <div className="flex items-center gap-2.5 px-3.5 py-2 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border border-ui-border-base rounded-2xl shadow-xl transition-all">
        <div className="flex items-center gap-1.5 border-r border-ui-border-base pr-2.5">
          <span className="text-[11px] font-semibold text-ui-fg-muted uppercase tracking-wider">
            Store:
          </span>
          <select
            value={selectedStorefront}
            onChange={(e) => onSelectStorefront(e.target.value)}
            className="text-xs bg-ui-bg-subtle text-ui-fg-base border border-ui-border-base rounded-lg px-2 py-1 font-medium focus:outline-none cursor-pointer"
          >
            <option value="all">All Storefronts</option>
            {salesChannels.map((sc) => (
              <option key={sc.id} value={sc.id}>
                {sc.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center border-r border-ui-border-base pr-2.5">
          <button
            type="button"
            title={direction === "TB" ? "Switch to Mind Map (Left-to-Right)" : "Switch to Vertical Tree (Top-to-Bottom)"}
            onClick={onToggleDirection}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-ui-bg-subtle text-ui-fg-base hover:bg-ui-bg-base border border-ui-border-base transition-colors"
          >
            <span>{direction === "TB" ? "⬇ Vertical" : "➡ Mind Map"}</span>
          </button>
        </div>

        <div className="relative w-36 sm:w-44">
          <input
            type="text"
            placeholder="Search categories…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full text-xs pl-7 pr-2.5 py-1 rounded-lg bg-ui-bg-subtle border border-ui-border-base text-ui-fg-base focus:bg-ui-bg-base focus:border-ui-border-interactive focus:outline-none transition-all placeholder:text-ui-fg-muted"
          />
          <MagnifyingGlass className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ui-fg-muted pointer-events-none" />
        </div>

        {/* Expand / Collapse Section with Selective awareness */}
        <div className="flex items-center gap-1 border-l border-ui-border-base pl-2.5">
          {selectedCount > 0 ? (
            <>
              <button
                type="button"
                title={`Expand selected category (${selectedCount} selected)`}
                onClick={onExpandSelected || onExpandAll}
                className="px-2 py-1 text-xs font-medium bg-ui-bg-interactive text-ui-fg-on-color rounded-md transition-colors"
              >
                Expand ({selectedCount})
              </button>
              <button
                type="button"
                title={`Collapse selected category (${selectedCount} selected)`}
                onClick={onCollapseSelected || onCollapseAll}
                className="px-2 py-1 text-xs font-medium bg-ui-bg-subtle text-ui-fg-base hover:bg-ui-bg-base border border-ui-border-base rounded-md transition-colors"
              >
                Collapse ({selectedCount})
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                title="Expand All Categories"
                onClick={onExpandAll}
                className="px-2 py-1 text-xs font-medium text-ui-fg-subtle hover:text-ui-fg-base hover:bg-ui-bg-subtle rounded-md transition-colors"
              >
                Expand All
              </button>
              <button
                type="button"
                title="Collapse All Subcategories"
                onClick={onCollapseAll}
                className="px-2 py-1 text-xs font-medium text-ui-fg-subtle hover:text-ui-fg-base hover:bg-ui-bg-subtle rounded-md transition-colors"
              >
                Collapse All
              </button>
            </>
          )}

          <button
            type="button"
            title="Focus on Root Categories"
            onClick={onFocusRoot}
            className="px-2 py-1 text-xs font-medium text-ui-fg-subtle hover:text-ui-fg-base hover:bg-ui-bg-subtle rounded-md transition-colors"
          >
            Root
          </button>
        </div>

        {/* Box Selection / Marquee mode toggle */}
        {onToggleBoxSelect && (
          <div className="flex items-center border-l border-ui-border-base pl-2.5">
            <button
              type="button"
              title={isBoxSelect ? "Box Selection Active (Drag to outline cards). Click to switch to Pan" : "Click to enable Box Select marquee (Outline cards to move together)"}
              onClick={onToggleBoxSelect}
              className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                isBoxSelect
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-ui-fg-subtle hover:text-ui-fg-base hover:bg-ui-bg-subtle"
              }`}
            >
              ⛶ Box Select
            </button>
          </div>
        )}

        <div className="flex items-center gap-1 border-l border-ui-border-base pl-2.5">
          <button
            type="button"
            title="Fit View (Center)"
            onClick={onFitView}
            className="p-1 text-ui-fg-subtle hover:text-ui-fg-base hover:bg-ui-bg-subtle rounded-md transition-colors"
          >
            <ArrowsPointingOut className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="border-l border-ui-border-base pl-2.5">
          <Button
            size="small"
            variant="secondary"
            onClick={onOpenCreateRoot}
            className="flex items-center gap-1 text-xs h-7"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Root</span>
          </Button>
        </div>
      </div>

      {dirtyCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-1.5 bg-blue-600 text-white rounded-full shadow-lg text-xs font-medium animate-in fade-in slide-in-from-top-2 duration-200">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span>
              {dirtyCount} categor{dirtyCount === 1 ? "y" : "ies"} repositioned
            </span>
          </span>
          <div className="flex items-center gap-1 border-l border-blue-400 pl-2">
            <button
              type="button"
              onClick={onReset}
              disabled={isSaving}
              className="px-2 py-0.5 rounded hover:bg-blue-700 transition-colors text-blue-100 hover:text-white"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className="px-3 py-0.5 rounded-full bg-white text-blue-700 font-semibold hover:bg-blue-50 transition-colors shadow-xs"
            >
              {isSaving ? "Saving…" : "Save Hierarchy"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
