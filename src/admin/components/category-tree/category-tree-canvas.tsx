import React, { useCallback, useEffect, useMemo, useState } from "react"
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  useReactFlow,
  ReactFlowProvider,
  SelectionMode,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { toast, TooltipProvider } from "@medusajs/ui"

import { CategoryNode } from "./category-node"
import { CustomSmoothStepEdge } from "./custom-edge"
import { CanvasDock } from "./canvas-dock"
import { CreateCategoryDrawer } from "./create-category-drawer"
import { EditCategoryDrawer } from "./edit-category-drawer"
import { CategoryTreeNode, SalesChannelInfo } from "./types"
import {
  computeTiers,
  computeSiblingRanks,
  computeBranchColors,
  moveSiblingRank,
  wouldCreateCycle,
  getVisibleTree,
  computeMoves,
} from "./lib/tree-state"
import { computeTreeLayout } from "./lib/layout-engine"
import { sdk } from "../../lib/sdk"

const nodeTypes = {
  categoryNode: CategoryNode,
}

const edgeTypes = {
  smoothstep: CustomSmoothStepEdge,
}

const CanvasInner: React.FC = () => {
  const { fitView, zoomIn, zoomOut } = useReactFlow()

  const [originalCategories, setOriginalCategories] = useState<CategoryTreeNode[]>([])
  const [categories, setCategories] = useState<CategoryTreeNode[]>([])
  const [salesChannels, setSalesChannels] = useState<SalesChannelInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const [direction, setDirection] = useState<"TB" | "LR">("TB")
  const [selectedStorefront, setSelectedStorefront] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set())
  const [isBoxSelect, setIsBoxSelect] = useState(false)
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([])

  const [createDrawerOpen, setCreateDrawerOpen] = useState(false)
  const [createParentCategory, setCreateParentCategory] = useState<CategoryTreeNode | null>(null)
  const [editDrawerOpen, setEditDrawerOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategoryTreeNode | null>(null)

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  const loadCategories = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await sdk.client.fetch<{
        categories: CategoryTreeNode[]
        sales_channels: SalesChannelInfo[]
      }>("/admin/category-tree")

      setOriginalCategories(res.categories || [])
      setCategories(res.categories || [])
      setSalesChannels(res.sales_channels || [])
    } catch (err: any) {
      toast.error(err?.message || "Failed to load category tree")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  const { childrenMap, enrichedCategories } = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const c of categories) {
      if (c.parent_category_id) {
        const list = map.get(c.parent_category_id) || []
        list.push(c.id)
        map.set(c.parent_category_id, list)
      }
    }

    const tiers = computeTiers(categories)
    const siblingRanks = computeSiblingRanks(categories)
    const branchColors = computeBranchColors(categories)

    const enriched: CategoryTreeNode[] = categories.map((cat) => {
      const kids = map.get(cat.id) || []
      const rankInfo = siblingRanks.get(cat.id)
      return {
        ...cat,
        tier: tiers.get(cat.id) || 1,
        sibling_rank: rankInfo?.rankNum || 1,
        children_count: kids.length,
        has_children: kids.length > 0,
        branch_color: branchColors.get(cat.id),
      }
    })

    return { childrenMap: map, enrichedCategories: enriched }
  }, [categories])

  const handleToggleCollapse = useCallback((id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const handleExpandSelected = useCallback(() => {
    if (selectedNodeIds.length === 0) return
    setCollapsedIds((prev) => {
      const next = new Set(prev)
      selectedNodeIds.forEach((id) => next.delete(id))
      return next
    })
  }, [selectedNodeIds])

  const handleCollapseSelected = useCallback(() => {
    if (selectedNodeIds.length === 0) return
    setCollapsedIds((prev) => {
      const next = new Set(prev)
      selectedNodeIds.forEach((id) => next.add(id))
      return next
    })
  }, [selectedNodeIds])

  const handleMoveSiblingUp = useCallback((id: string) => {
    setCategories((prev) => moveSiblingRank(prev, id, "up"))
  }, [])

  const handleMoveSiblingDown = useCallback((id: string) => {
    setCategories((prev) => moveSiblingRank(prev, id, "down"))
  }, [])

  const handleAddChild = useCallback((parent: CategoryTreeNode) => {
    setCreateParentCategory(parent)
    setCreateDrawerOpen(true)
  }, [])

  const handleEdit = useCallback((category: CategoryTreeNode) => {
    setEditingCategory(category)
    setEditDrawerOpen(true)
  }, [])

  const handleDetach = useCallback((id: string) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, parent_category_id: null } : c))
    )
  }, [])

  useEffect(() => {
    if (enrichedCategories.length === 0) {
      setNodes([])
      setEdges([])
      return
    }

    const siblingRankMap = computeSiblingRanks(enrichedCategories)
    const query = searchQuery.trim().toLowerCase()

    const rawNodes: Node[] = enrichedCategories.map((cat) => {
      const rankInfo = siblingRankMap.get(cat.id)
      const matchesSearch =
        !query ||
        cat.name.toLowerCase().includes(query) ||
        cat.handle.toLowerCase().includes(query)

      const matchesStorefront =
        selectedStorefront === "all" ||
        (cat.sales_channels || []).includes(selectedStorefront)

      const isDimmed = !matchesSearch || !matchesStorefront

      return {
        id: cat.id,
        type: "categoryNode",
        position: { x: 0, y: 0 },
        data: {
          category: cat,
          tier: cat.tier,
          siblingRank: rankInfo?.rankNum || 1,
          superscriptRank: rankInfo?.superscript || "¹",
          branchColor: cat.branch_color,
          salesChannels,
          isCollapsed: collapsedIds.has(cat.id),
          hiddenDescendantCount: cat.children_count,
          direction,
          isDimmed,
          onToggleCollapse: handleToggleCollapse,
          onAddChild: handleAddChild,
          onEdit: handleEdit,
          onDetach: handleDetach,
          onMoveSiblingUp: handleMoveSiblingUp,
          onMoveSiblingDown: handleMoveSiblingDown,
        },
      }
    })

    const rawEdges: Edge[] = []
    for (const cat of enrichedCategories) {
      if (cat.parent_category_id) {
        rawEdges.push({
          id: `e-${cat.parent_category_id}-${cat.id}`,
          source: cat.parent_category_id,
          target: cat.id,
          type: "smoothstep",
          data: {
            branchColor: cat.branch_color,
          },
          style: {
            stroke: cat.branch_color || "#64748b",
            strokeWidth: 2,
          },
        })
      }
    }

    const { visibleNodes, visibleEdges } = getVisibleTree(
      rawNodes,
      rawEdges,
      collapsedIds,
      childrenMap
    )

    const { nodes: layoutedNodes, edges: layoutedEdges } = computeTreeLayout(
      visibleNodes,
      visibleEdges,
      { direction }
    )

    setNodes(layoutedNodes)
    setEdges(layoutedEdges)
  }, [
    enrichedCategories,
    collapsedIds,
    childrenMap,
    direction,
    searchQuery,
    selectedStorefront,
    salesChannels,
    handleToggleCollapse,
    handleAddChild,
    handleEdit,
    handleDetach,
    handleMoveSiblingUp,
    handleMoveSiblingDown,
    setNodes,
    setEdges,
  ])

  useEffect(() => {
    const timer = setTimeout(() => {
      fitView({ padding: 0.2, duration: 400 })
    }, 100)
    return () => clearTimeout(timer)
  }, [fitView, direction])

  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target || params.source === params.target) return

      if (wouldCreateCycle(categories, params.target, params.source)) {
        toast.error("Cannot connect: would create a circular loop in the hierarchy!")
        return
      }

      setCategories((prev) =>
        prev.map((c) =>
          c.id === params.target ? { ...c, parent_category_id: params.source } : c
        )
      )
    },
    [categories]
  )

  const onEdgesDelete = useCallback((deletedEdges: Edge[]) => {
    const targetIds = new Set(deletedEdges.map((e) => e.target))
    setCategories((prev) =>
      prev.map((c) => (targetIds.has(c.id) ? { ...c, parent_category_id: null } : c))
    )
  }, [])

  const handleExpandAll = () => setCollapsedIds(new Set())
  const handleCollapseAll = () => {
    const parents = new Set(
      categories.filter((c) => (childrenMap.get(c.id) || []).length > 0).map((c) => c.id)
    )
    setCollapsedIds(parents)
  }
  const handleFocusRoot = () => {
    const rootIds = new Set(categories.filter((c) => !c.parent_category_id).map((c) => c.id))
    setCollapsedIds(rootIds)
  }

  const dirtyMoves = useMemo(() => {
    return computeMoves(originalCategories, categories)
  }, [originalCategories, categories])

  const handleSave = async () => {
    if (dirtyMoves.length === 0) return
    setIsSaving(true)
    try {
      await sdk.client.fetch("/admin/category-tree/reorder", {
        method: "POST",
        body: { moves: dirtyMoves },
      })
      toast.success("Category hierarchy successfully saved")
      setOriginalCategories([...categories])
    } catch (err: any) {
      toast.error(err?.message || "Failed to save category order")
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setCategories([...originalCategories])
    toast.info("Changes reset to previous saved state")
  }

  return (
      <div className="relative w-full h-[calc(100vh-56px)] overflow-hidden bg-[#fafafa] dark:bg-[#09090b]">
      <div
        className={`absolute top-4 left-1/2 -translate-x-1/2 z-10 transition-all duration-200 pointer-events-none ${
          editDrawerOpen || createDrawerOpen
            ? "opacity-0 -translate-y-6 scale-95 pointer-events-none"
            : "opacity-100"
        }`}
      >
        <CanvasDock
          salesChannels={salesChannels}
          selectedStorefront={selectedStorefront}
          onSelectStorefront={setSelectedStorefront}
          direction={direction}
          onToggleDirection={() => setDirection((d) => (d === "TB" ? "LR" : "TB"))}
          onSelectDirection={(dir) => setDirection(dir)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onExpandAll={handleExpandAll}
          onCollapseAll={handleCollapseAll}
          onFocusRoot={handleFocusRoot}
          selectedCount={selectedNodeIds.length}
          onExpandSelected={handleExpandSelected}
          onCollapseSelected={handleCollapseSelected}
          isBoxSelect={isBoxSelect}
          onToggleBoxSelect={() => setIsBoxSelect((prev) => !prev)}
          onZoomIn={() => zoomIn({ duration: 300 })}
          onZoomOut={() => zoomOut({ duration: 300 })}
          onFitView={() => fitView({ padding: 0.25, duration: 400 })}
          onOpenCreateRoot={() => {
            setCreateParentCategory(null)
            setCreateDrawerOpen(true)
          }}
          dirtyCount={dirtyMoves.length}
          isSaving={isSaving}
          onSave={handleSave}
          onReset={handleReset}
        />
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgesDelete={onEdgesDelete}
        onSelectionChange={useCallback(({ nodes }: { nodes: Node[] }) => {
          setSelectedNodeIds(nodes.map((n) => n.id))
        }, [])}
        selectionMode={SelectionMode.Partial}
        selectionOnDrag={isBoxSelect}
        panOnDrag={isBoxSelect ? [1, 2] : true}
        elementsSelectable={true}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        minZoom={0.2}
        maxZoom={2.0}
        defaultEdgeOptions={{ type: "smoothstep" }}
        fitView
        proOptions={{ hideAttribution: true }}
        className="touch-none"
      >
        <Background color="#cbd5e1" gap={20} size={1.25} />
        <Controls
          showInteractive={false}
          className="!bottom-4 !left-4 !bg-[#18181b] !border !border-neutral-700 !rounded-xl !shadow-2xl !overflow-hidden [&_.react-flow\_\_controls-button]:!bg-[#18181b] [&_.react-flow\_\_controls-button]:!border-b [&_.react-flow\_\_controls-button]:!border-neutral-800 [&_.react-flow\_\_controls-button:hover]:!bg-[#27272a] [&_.react-flow\_\_controls-button_svg]:!fill-white [&_.react-flow\_\_controls-button_svg]:!stroke-white [&_.react-flow\_\_controls-button_path]:!fill-white"
        />
        <MiniMap
          nodeColor={() => "var(--bg-interactive, #3b82f6)"}
          maskColor="rgba(0, 0, 0, 0.25)"
          className="!bottom-4 !right-4 !bg-[#18181b]/95 !backdrop-blur-md !border !border-neutral-700 !rounded-xl !shadow-xl !overflow-hidden"
          zoomable
          pannable
        />
      </ReactFlow>

      <CreateCategoryDrawer
        open={createDrawerOpen}
        onOpenChange={setCreateDrawerOpen}
        parentCategory={createParentCategory}
        salesChannels={salesChannels}
        onSuccess={(newCat) => {
          setCategories((prev) => [...prev, newCat])
          setOriginalCategories((prev) => [...prev, newCat])
        }}
      />

      <EditCategoryDrawer
        open={editDrawerOpen}
        onOpenChange={setEditDrawerOpen}
        category={editingCategory}
        salesChannels={salesChannels}
        onSuccess={(updatedCat) => {
          setCategories((prev) =>
            prev.map((c) => (c.id === updatedCat.id ? updatedCat : c))
          )
          setOriginalCategories((prev) =>
            prev.map((c) => (c.id === updatedCat.id ? updatedCat : c))
          )
        }}
        onDeleteSuccess={(deletedId) => {
          setCategories((prev) => prev.filter((c) => c.id !== deletedId))
          setOriginalCategories((prev) => prev.filter((c) => c.id !== deletedId))
        }}
      />
    </div>
  )
}

export const CategoryTreeCanvas: React.FC = () => {
  return (
    <TooltipProvider>
      <ReactFlowProvider>
        <CanvasInner />
      </ReactFlowProvider>
    </TooltipProvider>
  )
}
