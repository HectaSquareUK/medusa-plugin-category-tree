"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryTreeCanvas = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_2 = require("@xyflow/react");
require("@xyflow/react/dist/style.css");
const ui_1 = require("@medusajs/ui");
const category_node_1 = require("./category-node");
const custom_edge_1 = require("./custom-edge");
const canvas_dock_1 = require("./canvas-dock");
const create_category_drawer_1 = require("./create-category-drawer");
const edit_category_drawer_1 = require("./edit-category-drawer");
const tree_state_1 = require("./lib/tree-state");
const layout_engine_1 = require("./lib/layout-engine");
const sdk_1 = require("../../lib/sdk");
const nodeTypes = {
    categoryNode: category_node_1.CategoryNode,
};
const edgeTypes = {
    smoothstep: custom_edge_1.CustomSmoothStepEdge,
};
const CanvasInner = () => {
    const { fitView, zoomIn, zoomOut } = (0, react_2.useReactFlow)();
    const [originalCategories, setOriginalCategories] = (0, react_1.useState)([]);
    const [categories, setCategories] = (0, react_1.useState)([]);
    const [salesChannels, setSalesChannels] = (0, react_1.useState)([]);
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    const [isSaving, setIsSaving] = (0, react_1.useState)(false);
    const [direction, setDirection] = (0, react_1.useState)("LR");
    const [selectedStorefront, setSelectedStorefront] = (0, react_1.useState)("all");
    const [searchQuery, setSearchQuery] = (0, react_1.useState)("");
    const [collapsedIds, setCollapsedIds] = (0, react_1.useState)(new Set());
    const [isBoxSelect, setIsBoxSelect] = (0, react_1.useState)(false);
    const [selectedNodeIds, setSelectedNodeIds] = (0, react_1.useState)([]);
    const [createDrawerOpen, setCreateDrawerOpen] = (0, react_1.useState)(false);
    const [createParentCategory, setCreateParentCategory] = (0, react_1.useState)(null);
    const [editDrawerOpen, setEditDrawerOpen] = (0, react_1.useState)(false);
    const [editingCategory, setEditingCategory] = (0, react_1.useState)(null);
    const [nodes, setNodes, onNodesChange] = (0, react_2.useNodesState)([]);
    const [edges, setEdges, onEdgesChange] = (0, react_2.useEdgesState)([]);
    const loadCategories = (0, react_1.useCallback)(async () => {
        setIsLoading(true);
        try {
            const res = await sdk_1.sdk.client.fetch("/admin/category-tree");
            setOriginalCategories(res.categories || []);
            setCategories(res.categories || []);
            setSalesChannels(res.sales_channels || []);
        }
        catch (err) {
            ui_1.toast.error(err?.message || "Failed to load category tree");
        }
        finally {
            setIsLoading(false);
        }
    }, []);
    (0, react_1.useEffect)(() => {
        loadCategories();
    }, [loadCategories]);
    const { childrenMap, enrichedCategories } = (0, react_1.useMemo)(() => {
        const map = new Map();
        for (const c of categories) {
            if (c.parent_category_id) {
                const list = map.get(c.parent_category_id) || [];
                list.push(c.id);
                map.set(c.parent_category_id, list);
            }
        }
        const tiers = (0, tree_state_1.computeTiers)(categories);
        const siblingRanks = (0, tree_state_1.computeSiblingRanks)(categories);
        const branchColors = (0, tree_state_1.computeBranchColors)(categories);
        const enriched = categories.map((cat) => {
            const kids = map.get(cat.id) || [];
            const rankInfo = siblingRanks.get(cat.id);
            return {
                ...cat,
                tier: tiers.get(cat.id) || 1,
                sibling_rank: rankInfo?.rankNum || 1,
                children_count: kids.length,
                has_children: kids.length > 0,
                branch_color: branchColors.get(cat.id),
            };
        });
        return { childrenMap: map, enrichedCategories: enriched };
    }, [categories]);
    const handleToggleCollapse = (0, react_1.useCallback)((id) => {
        setCollapsedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            }
            else {
                next.add(id);
            }
            return next;
        });
    }, []);
    const handleExpandSelected = (0, react_1.useCallback)(() => {
        if (selectedNodeIds.length === 0)
            return;
        setCollapsedIds((prev) => {
            const next = new Set(prev);
            selectedNodeIds.forEach((id) => next.delete(id));
            return next;
        });
    }, [selectedNodeIds]);
    const handleCollapseSelected = (0, react_1.useCallback)(() => {
        if (selectedNodeIds.length === 0)
            return;
        setCollapsedIds((prev) => {
            const next = new Set(prev);
            selectedNodeIds.forEach((id) => next.add(id));
            return next;
        });
    }, [selectedNodeIds]);
    const handleMoveSiblingUp = (0, react_1.useCallback)((id) => {
        setCategories((prev) => {
            const { nextCategories, siblingMoves } = (0, tree_state_1.moveSiblingRank)(prev, id, "up");
            if (siblingMoves.length > 0) {
                // AAA Realtime: Immediately auto-persist contiguous ranks to backend in background
                sdk_1.sdk.client
                    .fetch("/admin/category-tree/reorder", {
                    method: "POST",
                    body: { moves: siblingMoves },
                })
                    .then(() => {
                    setOriginalCategories([...nextCategories]);
                })
                    .catch((err) => {
                    console.error("Failed to auto-save sibling rank:", err);
                    ui_1.toast.error("Failed to save ranking: " + (err.message || "Unknown error"));
                });
            }
            return nextCategories;
        });
    }, []);
    const handleMoveSiblingDown = (0, react_1.useCallback)((id) => {
        setCategories((prev) => {
            const { nextCategories, siblingMoves } = (0, tree_state_1.moveSiblingRank)(prev, id, "down");
            if (siblingMoves.length > 0) {
                // AAA Realtime: Immediately auto-persist contiguous ranks to backend in background
                sdk_1.sdk.client
                    .fetch("/admin/category-tree/reorder", {
                    method: "POST",
                    body: { moves: siblingMoves },
                })
                    .then(() => {
                    setOriginalCategories([...nextCategories]);
                })
                    .catch((err) => {
                    console.error("Failed to auto-save sibling rank:", err);
                    ui_1.toast.error("Failed to save ranking: " + (err.message || "Unknown error"));
                });
            }
            return nextCategories;
        });
    }, []);
    const handleAddChild = (0, react_1.useCallback)((parent) => {
        setCreateParentCategory(parent);
        setCreateDrawerOpen(true);
    }, []);
    const handleEdit = (0, react_1.useCallback)((category) => {
        setEditingCategory(category);
        setEditDrawerOpen(true);
    }, []);
    const handleDetach = (0, react_1.useCallback)((id) => {
        setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, parent_category_id: null } : c)));
    }, []);
    (0, react_1.useEffect)(() => {
        if (enrichedCategories.length === 0) {
            setNodes([]);
            setEdges([]);
            return;
        }
        const siblingRankMap = (0, tree_state_1.computeSiblingRanks)(enrichedCategories);
        const query = searchQuery.trim().toLowerCase();
        const rawNodes = enrichedCategories.map((cat) => {
            const rankInfo = siblingRankMap.get(cat.id);
            const matchesSearch = !query ||
                cat.name.toLowerCase().includes(query) ||
                cat.handle.toLowerCase().includes(query);
            const matchesStorefront = selectedStorefront === "all" ||
                (cat.sales_channels || []).includes(selectedStorefront);
            const isDimmed = !matchesSearch || !matchesStorefront;
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
            };
        });
        const rawEdges = [];
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
                });
            }
        }
        const { visibleNodes, visibleEdges } = (0, tree_state_1.getVisibleTree)(rawNodes, rawEdges, collapsedIds, childrenMap);
        const { nodes: layoutedNodes, edges: layoutedEdges } = (0, layout_engine_1.computeTreeLayout)(visibleNodes, visibleEdges, { direction });
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
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
    ]);
    (0, react_1.useEffect)(() => {
        const timer = setTimeout(() => {
            fitView({ padding: 0.2, duration: 400 });
        }, 100);
        return () => clearTimeout(timer);
    }, [fitView, direction]);
    const onConnect = (0, react_1.useCallback)((params) => {
        if (!params.source || !params.target || params.source === params.target)
            return;
        if ((0, tree_state_1.wouldCreateCycle)(categories, params.target, params.source)) {
            ui_1.toast.error("Cannot connect: would create a circular loop in the hierarchy!");
            return;
        }
        setCategories((prev) => prev.map((c) => c.id === params.target ? { ...c, parent_category_id: params.source } : c));
    }, [categories]);
    const onEdgesDelete = (0, react_1.useCallback)((deletedEdges) => {
        const targetIds = new Set(deletedEdges.map((e) => e.target));
        setCategories((prev) => prev.map((c) => (targetIds.has(c.id) ? { ...c, parent_category_id: null } : c)));
    }, []);
    const handleExpandAll = () => setCollapsedIds(new Set());
    const handleCollapseAll = () => {
        const parents = new Set(categories.filter((c) => (childrenMap.get(c.id) || []).length > 0).map((c) => c.id));
        setCollapsedIds(parents);
    };
    const handleFocusRoot = () => {
        const rootIds = new Set(categories.filter((c) => !c.parent_category_id).map((c) => c.id));
        setCollapsedIds(rootIds);
    };
    const dirtyMoves = (0, react_1.useMemo)(() => {
        return (0, tree_state_1.computeMoves)(originalCategories, categories);
    }, [originalCategories, categories]);
    const handleSave = async () => {
        if (dirtyMoves.length === 0)
            return;
        setIsSaving(true);
        try {
            await sdk_1.sdk.client.fetch("/admin/category-tree/reorder", {
                method: "POST",
                body: { moves: dirtyMoves },
            });
            ui_1.toast.success("Category hierarchy successfully saved");
            setOriginalCategories([...categories]);
        }
        catch (err) {
            ui_1.toast.error(err?.message || "Failed to save category order");
        }
        finally {
            setIsSaving(false);
        }
    };
    const handleReset = () => {
        setCategories([...originalCategories]);
        ui_1.toast.info("Changes reset to previous saved state");
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "relative w-full h-[calc(100vh-56px)] overflow-hidden bg-[#fafafa] dark:bg-[#09090b]", children: [(0, jsx_runtime_1.jsx)("div", { className: `absolute top-4 left-1/2 -translate-x-1/2 z-10 transition-all duration-200 pointer-events-none ${editDrawerOpen || createDrawerOpen
                    ? "opacity-0 -translate-y-6 scale-95 pointer-events-none"
                    : "opacity-100"}`, children: (0, jsx_runtime_1.jsx)(canvas_dock_1.CanvasDock, { salesChannels: salesChannels, selectedStorefront: selectedStorefront, onSelectStorefront: setSelectedStorefront, direction: direction, onToggleDirection: () => setDirection((d) => (d === "TB" ? "LR" : "TB")), onSelectDirection: (dir) => setDirection(dir), searchQuery: searchQuery, onSearchChange: setSearchQuery, onExpandAll: handleExpandAll, onCollapseAll: handleCollapseAll, onFocusRoot: handleFocusRoot, selectedCount: selectedNodeIds.length, onExpandSelected: handleExpandSelected, onCollapseSelected: handleCollapseSelected, isBoxSelect: isBoxSelect, onToggleBoxSelect: () => setIsBoxSelect((prev) => !prev), onZoomIn: () => zoomIn({ duration: 300 }), onZoomOut: () => zoomOut({ duration: 300 }), onFitView: () => fitView({ padding: 0.25, duration: 400 }), onOpenCreateRoot: () => {
                        setCreateParentCategory(null);
                        setCreateDrawerOpen(true);
                    }, dirtyCount: dirtyMoves.length, isSaving: isSaving, onSave: handleSave, onReset: handleReset }) }), (0, jsx_runtime_1.jsxs)(react_2.ReactFlow, { nodes: nodes, edges: edges, onNodesChange: onNodesChange, onEdgesChange: onEdgesChange, onConnect: onConnect, onEdgesDelete: onEdgesDelete, onSelectionChange: (0, react_1.useCallback)(({ nodes }) => {
                    setSelectedNodeIds(nodes.map((n) => n.id));
                }, []), selectionMode: react_2.SelectionMode.Partial, selectionOnDrag: isBoxSelect, panOnDrag: isBoxSelect ? [1, 2] : true, elementsSelectable: true, nodeTypes: nodeTypes, edgeTypes: edgeTypes, minZoom: 0.2, maxZoom: 2.0, defaultEdgeOptions: { type: "smoothstep" }, fitView: true, proOptions: { hideAttribution: true }, className: "touch-none", children: [(0, jsx_runtime_1.jsx)(react_2.Background, { color: "#cbd5e1", gap: 20, size: 1.25 }), (0, jsx_runtime_1.jsx)(react_2.Controls, { showInteractive: false, className: "!bottom-4 !left-4" }), (0, jsx_runtime_1.jsx)("style", { children: `
          .react-flow__controls {
            background: #ffffff !important;
            border: 1px solid #d1d5db !important;
            border-radius: 9999px !important;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2) !important;
            padding: 3px !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 2px !important;
            overflow: hidden !important;
          }
          .react-flow__controls-button {
            background: #ffffff !important;
            border: none !important;
            border-bottom: 1px solid #f1f5f9 !important;
            border-radius: 9999px !important;
            width: 28px !important;
            height: 28px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            cursor: pointer !important;
            transition: background 0.15s ease !important;
          }
          .react-flow__controls-button:last-child {
            border-bottom: none !important;
          }
          .react-flow__controls-button:hover {
            background: #f3f4f6 !important;
          }
          .react-flow__controls-button svg {
            fill: #000000 !important;
            stroke: #000000 !important;
            color: #000000 !important;
          }
          .react-flow__controls-button svg path {
            fill: #000000 !important;
            stroke: #000000 !important;
            color: #000000 !important;
          }
        ` }), (0, jsx_runtime_1.jsx)(react_2.MiniMap, { nodeColor: () => "var(--bg-interactive, #3b82f6)", maskColor: "rgba(0, 0, 0, 0.25)", className: "!bottom-4 !right-4 !bg-[#18181b]/95 !backdrop-blur-md !border !border-neutral-700 !rounded-xl !shadow-xl !overflow-hidden", zoomable: true, pannable: true })] }), (0, jsx_runtime_1.jsx)(create_category_drawer_1.CreateCategoryDrawer, { open: createDrawerOpen, onOpenChange: setCreateDrawerOpen, parentCategory: createParentCategory, salesChannels: salesChannels, onSuccess: (newCat) => {
                    setCategories((prev) => [...prev, newCat]);
                    setOriginalCategories((prev) => [...prev, newCat]);
                } }), (0, jsx_runtime_1.jsx)(edit_category_drawer_1.EditCategoryDrawer, { open: editDrawerOpen, onOpenChange: setEditDrawerOpen, category: editingCategory, salesChannels: salesChannels, onSuccess: (updatedCat) => {
                    setCategories((prev) => prev.map((c) => (c.id === updatedCat.id ? updatedCat : c)));
                    setOriginalCategories((prev) => prev.map((c) => (c.id === updatedCat.id ? updatedCat : c)));
                }, onDeleteSuccess: (deletedId) => {
                    setCategories((prev) => prev.filter((c) => c.id !== deletedId));
                    setOriginalCategories((prev) => prev.filter((c) => c.id !== deletedId));
                } })] }));
};
const CategoryTreeCanvas = () => {
    return ((0, jsx_runtime_1.jsx)(ui_1.TooltipProvider, { children: (0, jsx_runtime_1.jsx)(react_2.ReactFlowProvider, { children: (0, jsx_runtime_1.jsx)(CanvasInner, {}) }) }));
};
exports.CategoryTreeCanvas = CategoryTreeCanvas;
