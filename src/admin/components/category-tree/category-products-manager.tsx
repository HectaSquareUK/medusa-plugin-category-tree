import React, { useState, useEffect, useCallback, useMemo } from "react"
import {
  Button,
  Badge,
  toast,
} from "@medusajs/ui"
import {
  Plus,
  Trash,
  MagnifyingGlass,
  CheckMini,
  Sparkles,
  ArrowUpRightMicro,
} from "@medusajs/icons"
import { sdk } from "../../lib/sdk"

export interface CategoryProductsManagerProps {
  categoryId: string
  categoryName: string
  initialMetadata?: Record<string, any> | null
  onMetadataUpdate?: (updatedMetadata: Record<string, any>) => void
}

interface ProductItem {
  id: string
  title: string
  thumbnail?: string | null
  status: string
  variants?: Array<{ id: string; title: string }>
  collection?: { id: string; title: string } | null
  sales_channels?: Array<{ id: string; name: string }>
}

export const CategoryProductsManager: React.FC<CategoryProductsManagerProps> = ({
  categoryId,
  categoryName,
  initialMetadata,
  onMetadataUpdate,
}) => {
  const [products, setProducts] = useState<ProductItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isRemoving, setIsRemoving] = useState(false)
  const [activeView, setActiveView] = useState<"all" | "top_sellers">("all")

  // Product ranking and top sellers state
  const [orderedProductIds, setOrderedProductIds] = useState<string[]>([])
  const [topSellerIds, setTopSellerIds] = useState<Set<string>>(new Set())

  // Full-Screen Add Products FocusModal state (matching Medusa legacy modal)
  const [focusModalOpen, setFocusModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [catalogProducts, setCatalogProducts] = useState<ProductItem[]>([])
  const [catalogTotalCount, setCatalogTotalCount] = useState(0)
  const [catalogPage, setCatalogPage] = useState(0)
  const [isSearchingCatalog, setIsSearchingCatalog] = useState(false)
  const [catalogSelectedIds, setCatalogSelectedIds] = useState<Set<string>>(new Set())
  const [isAdding, setIsAdding] = useState(false)

  const PAGE_SIZE = 50

  const orderedProductIdsRef = React.useRef<string[]>(orderedProductIds)
  useEffect(() => {
    orderedProductIdsRef.current = orderedProductIds
  }, [orderedProductIds])

  // Initialize ranking and top sellers from category metadata
  useEffect(() => {
    if (initialMetadata) {
      if (Array.isArray(initialMetadata.ordered_product_ids)) {
        setOrderedProductIds(initialMetadata.ordered_product_ids)
      }
      if (Array.isArray(initialMetadata.top_sellers)) {
        setTopSellerIds(new Set(initialMetadata.top_sellers))
      }
    }
  }, [initialMetadata])

  // Load products assigned to this category
  const loadAssignedProducts = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await sdk.client.fetch<{ products: ProductItem[]; count: number }>(
        `/admin/products?category_id[]=${categoryId}&limit=100&fields=id,title,thumbnail,status,variants.id,collection.title,sales_channels.name`
      )
      const fetched = res.products || []
      setTotalCount(res.count ?? fetched.length)

      // Sort products according to orderedProductIds if available
      setProducts(() => {
        const orderMap = new Map((orderedProductIdsRef.current || []).map((id, index) => [id, index]))
        return [...fetched].sort((a, b) => {
          const indexA = orderMap.has(a.id) ? orderMap.get(a.id)! : 9999
          const indexB = orderMap.has(b.id) ? orderMap.get(b.id)! : 9999
          return indexA - indexB
        })
      })
    } catch (err: any) {
      toast.error(err?.message || "Failed to load assigned products")
    } finally {
      setIsLoading(false)
    }
  }, [categoryId])

  useEffect(() => {
    loadAssignedProducts()
  }, [loadAssignedProducts])

  // Save updated product rankings and top sellers to category metadata
  const persistProductConfig = async (newOrder: string[], newTopSellers: Set<string>) => {
    const ranksMap: Record<string, number> = {}
    newOrder.forEach((id, idx) => {
      ranksMap[id] = idx + 1
    })

    const updatedMetadata = {
      ...(initialMetadata || {}),
      ordered_product_ids: newOrder,
      product_ranks: ranksMap,
      top_sellers: Array.from(newTopSellers),
    }

    try {
      await sdk.admin.productCategory.update(categoryId, {
        metadata: updatedMetadata,
      })
      if (onMetadataUpdate) {
        onMetadataUpdate(updatedMetadata)
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to save product ordering")
    }
  }

  // Sibling product ranking handlers (Move Up / Move Down)
  const handleMoveProduct = async (productId: string, direction: "up" | "down") => {
    const currentIndex = products.findIndex((p) => p.id === productId)
    if (currentIndex === -1) return

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
    if (targetIndex < 0 || targetIndex >= products.length) return

    const reordered = [...products]
    const [moved] = reordered.splice(currentIndex, 1)
    reordered.splice(targetIndex, 0, moved)

    setProducts(reordered)
    const newOrder = reordered.map((p) => p.id)
    setOrderedProductIds(newOrder)

    toast.info(`Moved "${moved.title}" to #${targetIndex + 1}`)
    await persistProductConfig(newOrder, topSellerIds)
  }

  // Toggle Top Commercial Seller status
  const handleToggleTopSeller = async (productId: string, productTitle: string) => {
    const next = new Set(topSellerIds)
    const isNowTop = !next.has(productId)
    if (isNowTop) {
      next.add(productId)
      toast.success(`Marked "${productTitle}" as Top Commercial Seller ⭐`)
    } else {
      next.delete(productId)
      toast.info(`Removed "${productTitle}" from Top Commercial Sellers`)
    }

    setTopSellerIds(next)
    const currentOrder = products.map((p) => p.id)
    await persistProductConfig(currentOrder, next)
  }

  // Remove products from category using official Medusa v2 JS SDK method
  const handleRemoveProducts = async (idsToRemove: string[]) => {
    if (idsToRemove.length === 0) return
    const msg =
      idsToRemove.length === 1
        ? "Are you sure you want to remove this product from the category?"
        : `Are you sure you want to remove ${idsToRemove.length} products from this category?`
    if (!confirm(msg)) return

    setIsRemoving(true)
    try {
      await sdk.admin.productCategory.updateProducts(categoryId, {
        remove: idsToRemove,
      })
      toast.success(`Removed ${idsToRemove.length} product(s) from category`)
      setSelectedIds(new Set())

      // Also clean up ranking and top sellers
      const removeSet = new Set(idsToRemove)
      const newOrder = orderedProductIds.filter((id) => !removeSet.has(id))
      const newTopSellers = new Set(Array.from(topSellerIds).filter((id) => !removeSet.has(id)))
      setOrderedProductIds(newOrder)
      setTopSellerIds(newTopSellers)
      await persistProductConfig(newOrder, newTopSellers)

      await loadAssignedProducts()
    } catch (err: any) {
      toast.error(err?.message || "Failed to remove products")
    } finally {
      setIsRemoving(false)
    }
  }

  // Search catalog for the Add Products FocusModal (matching Medusa's legacy product table)
  const searchCatalog = useCallback(async (query: string, page: number) => {
    setIsSearchingCatalog(true)
    try {
      const qParam = query.trim() ? `&q=${encodeURIComponent(query.trim())}` : ""
      const offset = page * PAGE_SIZE
      const res = await sdk.client.fetch<{ products: ProductItem[]; count: number }>(
        `/admin/products?limit=${PAGE_SIZE}&offset=${offset}${qParam}&fields=id,title,thumbnail,status,variants.id,collection.title,sales_channels.name`
      )
      setCatalogProducts(res.products || [])
      setCatalogTotalCount(res.count ?? (res.products?.length || 0))
    } catch (err: any) {
      toast.error(err?.message || "Failed to search catalog")
    } finally {
      setIsSearchingCatalog(false)
    }
  }, [])

  useEffect(() => {
    if (focusModalOpen) {
      searchCatalog(searchQuery, catalogPage)
    }
  }, [focusModalOpen, searchQuery, catalogPage, searchCatalog])

  // Save added products using official Medusa v2 JS SDK method
  const handleSaveAddedProducts = async () => {
    const idsToAdd = Array.from(catalogSelectedIds)
    if (idsToAdd.length === 0) return

    setIsAdding(true)
    try {
      await sdk.admin.productCategory.updateProducts(categoryId, {
        add: idsToAdd,
      })
      toast.success(`Added ${idsToAdd.length} product(s) to ${categoryName}`)
      setFocusModalOpen(false)
      setCatalogSelectedIds(new Set())

      // Append new products to orderedProductIds
      const newOrder = [...orderedProductIds, ...idsToAdd]
      setOrderedProductIds(newOrder)
      await persistProductConfig(newOrder, topSellerIds)

      await loadAssignedProducts()
    } catch (err: any) {
      toast.error(err?.message || "Failed to add products")
    } finally {
      setIsAdding(false)
    }
  }

  const assignedProductIdsSet = useMemo(() => new Set(products.map((p) => p.id)), [products])

  const displayedProducts = useMemo(() => {
    if (activeView === "top_sellers") {
      return products.filter((p) => topSellerIds.has(p.id))
    }
    return products
  }, [products, activeView, topSellerIds])

  return (
    <div className="flex flex-col gap-3">
      {/* View Switcher and Action Bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-ui-bg-subtle border border-ui-border-base">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setActiveView("all")
            }}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              activeView === "all"
                ? "bg-ui-bg-base text-ui-fg-base shadow-2xs font-semibold"
                : "text-ui-fg-muted hover:text-ui-fg-base"
            }`}
          >
            All Products ({products.length})
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setActiveView("top_sellers")
            }}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              activeView === "top_sellers"
                ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold"
                : "text-ui-fg-muted hover:text-amber-600"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Top Commercial Sellers ({topSellerIds.size})</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <Button
              type="button"
              size="small"
              variant="danger"
              disabled={isRemoving}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleRemoveProducts(Array.from(selectedIds))
              }}
              className="flex items-center gap-1 text-xs"
            >
              <Trash className="w-3.5 h-3.5" />
              <span>Remove Selected ({selectedIds.size})</span>
            </Button>
          )}

          <Button
            type="button"
            size="small"
            variant="secondary"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setCatalogSelectedIds(new Set())
              setSearchQuery("")
              setCatalogPage(0)
              setFocusModalOpen(true)
            }}
            className="flex items-center gap-1 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Products</span>
          </Button>
        </div>
      </div>

      {/* Products Table with Ranking and Top Sellers */}
      <div className="border border-ui-border-base rounded-xl overflow-hidden bg-ui-bg-base shadow-2xs">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-ui-fg-muted">
            Loading products…
          </div>
        ) : displayedProducts.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
            <p className="text-xs text-ui-fg-muted">
              {activeView === "top_sellers"
                ? "No products marked as Top Commercial Sellers yet. Star a product below to highlight it."
                : "No products assigned to this category."}
            </p>
            {activeView === "all" && (
              <Button
                type="button"
                size="small"
                variant="secondary"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setCatalogSelectedIds(new Set())
                  setSearchQuery("")
                  setCatalogPage(0)
                  setFocusModalOpen(true)
                }}
                className="flex items-center gap-1 text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Products</span>
              </Button>
            )}
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-ui-border-base bg-ui-bg-subtle/60 text-ui-fg-muted font-medium">
                <th className="py-2.5 px-3 w-8">
                  <input
                    type="checkbox"
                    checked={displayedProducts.length > 0 && selectedIds.size === displayedProducts.length}
                    onChange={() => {
                      if (selectedIds.size === displayedProducts.length) setSelectedIds(new Set())
                      else setSelectedIds(new Set(displayedProducts.map((p) => p.id)))
                    }}
                    className="rounded border-ui-border-base cursor-pointer"
                  />
                </th>
                <th className="py-2.5 px-3 w-20">Rank</th>
                <th className="py-2.5 px-3">Product</th>
                <th className="py-2.5 px-3">Top Seller</th>
                <th className="py-2.5 px-3">Collection</th>
                <th className="py-2.5 px-3">Variants</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ui-border-base">
              {displayedProducts.map((p, index) => {
                const isChecked = selectedIds.has(p.id)
                const isTopSeller = topSellerIds.has(p.id)

                return (
                  <tr
                    key={p.id}
                    className={`hover:bg-ui-bg-subtle/40 transition-colors ${
                      isChecked ? "bg-blue-50/40 dark:bg-blue-950/20" : ""
                    }`}
                  >
                    <td className="py-2.5 px-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          setSelectedIds((prev) => {
                            const next = new Set(prev)
                            if (next.has(p.id)) next.delete(p.id)
                            else next.add(p.id)
                            return next
                          })
                        }}
                        className="rounded border-ui-border-base cursor-pointer"
                      />
                    </td>

                    {/* Sibling Product Ranking with Move Up / Down */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1 font-mono">
                        <span className="text-xs font-bold text-ui-fg-subtle px-1.5 py-0.5 rounded bg-ui-bg-subtle border border-ui-border-base">
                          #{index + 1}
                        </span>
                        <div className="flex flex-col">
                          <button
                            type="button"
                            title="Move Up"
                            disabled={index === 0}
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleMoveProduct(p.id, "up")
                            }}
                            className="text-[9px] text-ui-fg-muted hover:text-ui-fg-base disabled:opacity-20 px-0.5 leading-none cursor-pointer"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            title="Move Down"
                            disabled={index === displayedProducts.length - 1}
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleMoveProduct(p.id, "down")
                            }}
                            className="text-[9px] text-ui-fg-muted hover:text-ui-fg-base disabled:opacity-20 px-0.5 leading-none cursor-pointer"
                          >
                            ▼
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Product Thumbnail & Title (Clickable link to Medusa Admin product page) */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <a
                          href={`/app/products/${p.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-9 h-9 rounded-md border border-ui-border-base overflow-hidden bg-ui-bg-subtle flex-shrink-0 flex items-center justify-center hover:opacity-80 transition-opacity"
                          title={`Open ${p.title} in new tab`}
                        >
                          {p.thumbnail ? (
                            <img src={p.thumbnail} alt={p.title} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[9px] text-ui-fg-muted">IMG</span>
                          )}
                        </a>
                        <div className="flex flex-col min-w-0">
                          <a
                            href={`/app/products/${p.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-ui-fg-base hover:text-ui-fg-interactive truncate leading-snug hover:underline flex items-center gap-1 group/pname"
                            title={`Open ${p.title} in new tab`}
                          >
                            <span className="truncate">{p.title}</span>
                            <ArrowUpRightMicro className="w-3.5 h-3.5 text-ui-fg-muted group-hover/pname:text-ui-fg-interactive transition-colors shrink-0" />
                          </a>
                        </div>
                      </div>
                    </td>

                    {/* Top Commercial Seller Toggle */}
                    <td className="py-2.5 px-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleToggleTopSeller(p.id, p.title)
                        }}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
                          isTopSeller
                            ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700 shadow-2xs"
                            : "bg-ui-bg-subtle text-ui-fg-muted border-ui-border-base hover:text-amber-600 hover:border-amber-300"
                        }`}
                        title={
                          isTopSeller
                            ? "Click to remove from Top Commercial Sellers"
                            : "Click to mark as Top Commercial Seller (Reflected on Storefront 2)"
                        }
                      >
                        <span>{isTopSeller ? "★" : "☆"}</span>
                        <span>{isTopSeller ? "Top Seller" : "Normal"}</span>
                      </button>
                    </td>

                    <td className="py-2.5 px-3 text-ui-fg-muted">
                      {p.collection?.title || "-"}
                    </td>

                    <td className="py-2.5 px-3 text-ui-fg-subtle">
                      {p.variants?.length || 0} variant(s)
                    </td>

                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          p.status === "published"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300"
                            : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        title="Remove from category"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleRemoveProducts([p.id])
                        }}
                        className="p-1 text-ui-fg-muted hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded transition-colors cursor-pointer"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* FULL-SCREEN ADD PRODUCTS FOCUS MODAL (Medusa Legacy Parity)         */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {focusModalOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-neutral-950 animate-in fade-in-50">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-ui-border-base bg-ui-bg-base flex-shrink-0">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setFocusModalOpen(false)
                }}
                className="p-1.5 rounded-lg text-ui-fg-muted hover:text-ui-fg-base hover:bg-ui-bg-subtle transition-colors cursor-pointer"
                title="Close (ESC)"
              >
                <span className="text-sm font-bold">✕</span>
              </button>
              <span className="text-[11px] font-mono font-medium text-ui-fg-muted px-1.5 py-0.5 rounded bg-ui-bg-subtle border border-ui-border-base">
                ESC
              </span>
              <h2 className="text-sm font-semibold text-ui-fg-base">
                Add Products to Category: {categoryName}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative w-64">
                <input
                  type="text"
                  placeholder="Search products…"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCatalogPage(0)
                  }}
                  className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg bg-ui-bg-subtle border border-ui-border-base text-ui-fg-base focus:bg-ui-bg-base focus:border-ui-border-interactive focus:outline-none placeholder:text-ui-fg-muted"
                  autoFocus
                />
                <MagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ui-fg-muted pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Full-width Products Table */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="border border-ui-border-base rounded-xl overflow-hidden bg-ui-bg-base shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-ui-border-base bg-ui-bg-subtle/80 text-ui-fg-muted font-medium">
                    <th className="py-2.5 px-3 w-8">
                      <input
                        type="checkbox"
                        checked={
                          catalogProducts.length > 0 &&
                          catalogProducts.every(
                            (p) => assignedProductIdsSet.has(p.id) || catalogSelectedIds.has(p.id)
                          )
                        }
                        onChange={() => {
                          const available = catalogProducts.filter((p) => !assignedProductIdsSet.has(p.id))
                          if (available.every((p) => catalogSelectedIds.has(p.id))) {
                            setCatalogSelectedIds(new Set())
                          } else {
                            setCatalogSelectedIds(new Set(available.map((p) => p.id)))
                          }
                        }}
                        className="rounded border-ui-border-base cursor-pointer"
                      />
                    </th>
                    <th className="py-2.5 px-3">Product</th>
                    <th className="py-2.5 px-3">Collection</th>
                    <th className="py-2.5 px-3">Sales Channels</th>
                    <th className="py-2.5 px-3">Variants</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ui-border-base">
                  {isSearchingCatalog ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-ui-fg-muted">
                        Searching catalog products…
                      </td>
                    </tr>
                  ) : catalogProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-ui-fg-muted">
                        No products found.
                      </td>
                    </tr>
                  ) : (
                    catalogProducts.map((p) => {
                      const isAlreadyAssigned = assignedProductIdsSet.has(p.id)
                      const isSelected = catalogSelectedIds.has(p.id) || isAlreadyAssigned

                      return (
                        <tr
                          key={p.id}
                          onClick={() => {
                            if (isAlreadyAssigned) return
                            setCatalogSelectedIds((prev) => {
                              const next = new Set(prev)
                              if (next.has(p.id)) next.delete(p.id)
                              else next.add(p.id)
                              return next
                            })
                          }}
                          className={`cursor-pointer transition-colors ${
                            isAlreadyAssigned
                              ? "opacity-50 bg-ui-bg-subtle/30 cursor-not-allowed"
                              : isSelected
                              ? "bg-blue-50/50 dark:bg-blue-950/30"
                              : "hover:bg-ui-bg-subtle/50"
                          }`}
                        >
                          <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={isAlreadyAssigned}
                              onChange={() => {
                                if (isAlreadyAssigned) return
                                setCatalogSelectedIds((prev) => {
                                  const next = new Set(prev)
                                  if (next.has(p.id)) next.delete(p.id)
                                  else next.add(p.id)
                                  return next
                                })
                              }}
                              className="rounded border-ui-border-base cursor-pointer"
                            />
                          </td>

                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded border border-ui-border-base overflow-hidden bg-ui-bg-subtle flex-shrink-0 flex items-center justify-center">
                                {p.thumbnail ? (
                                  <img src={p.thumbnail} alt={p.title} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-[8px] text-ui-fg-muted">IMG</span>
                                )}
                              </div>
                              <span className="font-semibold text-ui-fg-base truncate leading-snug">
                                {p.title}
                              </span>
                              {isAlreadyAssigned && (
                                <Badge size="small" color="grey" className="ml-1 text-[9px]">
                                  Already in Category
                                </Badge>
                              )}
                            </div>
                          </td>

                          <td className="py-2.5 px-3 text-ui-fg-muted">
                            {p.collection?.title || "-"}
                          </td>

                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-1 flex-wrap">
                              {(p.sales_channels || []).map((sc) => (
                                <span
                                  key={sc.id}
                                  className="px-1.5 py-0.5 rounded text-[10px] bg-ui-bg-subtle border border-ui-border-base text-ui-fg-subtle"
                                >
                                  {sc.name}
                                </span>
                              ))}
                            </div>
                          </td>

                          <td className="py-2.5 px-3 text-ui-fg-subtle">
                            {p.variants?.length || 0} variant(s)
                          </td>

                          <td className="py-2.5 px-3">
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                p.status === "published"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300"
                                  : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer (Matching Medusa Legacy modal footer) */}
          <div className="flex items-center justify-between px-6 py-3 border-t border-ui-border-base bg-ui-bg-base flex-shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-xs text-ui-fg-muted">
                Showing {Math.min(catalogProducts.length, PAGE_SIZE)} of {catalogTotalCount} results
              </span>
              <span className="text-xs text-ui-fg-muted">•</span>
              <span className="text-xs font-semibold text-ui-fg-base">
                {catalogSelectedIds.size} product(s) selected
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={catalogPage === 0}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setCatalogPage((p) => Math.max(0, p - 1))
                }}
                className="px-2.5 py-1 text-xs rounded border border-ui-border-base bg-ui-bg-subtle hover:bg-ui-bg-base disabled:opacity-40 cursor-pointer"
              >
                Prev
              </button>
              <button
                type="button"
                disabled={(catalogPage + 1) * PAGE_SIZE >= catalogTotalCount}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setCatalogPage((p) => p + 1)
                }}
                className="px-2.5 py-1 text-xs rounded border border-ui-border-base bg-ui-bg-subtle hover:bg-ui-bg-base disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>

              <div className="h-4 w-[1px] bg-ui-border-base mx-1" />

              <Button
                type="button"
                size="small"
                variant="secondary"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setFocusModalOpen(false)
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="small"
                variant="primary"
                disabled={catalogSelectedIds.size === 0 || isAdding}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleSaveAddedProducts()
                }}
                className="flex items-center gap-1 text-xs min-w-[70px] justify-center"
              >
                <CheckMini className="w-3.5 h-3.5" />
                <span>{isAdding ? "Saving…" : "Save"}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
