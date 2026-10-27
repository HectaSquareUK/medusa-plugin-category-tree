"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryNode = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_2 = require("@xyflow/react");
const icons_1 = require("@medusajs/icons");
const tier_bars_1 = require("./tier-bars");
exports.CategoryNode = (0, react_1.memo)(({ id, data, selected }) => {
    const { category, tier, siblingRank, superscriptRank, branchColor, salesChannels, isCollapsed, hiddenDescendantCount, direction, isDimmed, onToggleCollapse, onAddChild, onEdit, onDetach, onMoveSiblingUp, onMoveSiblingDown, } = data;
    const isTB = direction === "TB";
    const hasChildren = category.has_children || category.children_count > 0;
    const assignedStorefrontNames = (category.sales_channels || []).map((scId) => {
        const sc = salesChannels.find((s) => s.id === scId);
        return sc?.name || scId;
    });
    return ((0, jsx_runtime_1.jsxs)("div", { className: `group relative flex items-stretch w-[270px] h-[86px] rounded-xl border bg-ui-bg-base transition-all duration-150 select-none ${selected
            ? "ring-2 ring-ui-border-interactive border-transparent shadow-lg"
            : "border-ui-border-base shadow-sm hover:shadow-md hover:border-ui-border-strong"} ${isDimmed ? "opacity-35 grayscale" : "opacity-100"}`, style: selected && branchColor
            ? {
                boxShadow: `0 0 0 2px ${branchColor}, 0 10px 15px -3px rgba(0, 0, 0, 0.1)`,
            }
            : undefined, children: [(0, jsx_runtime_1.jsx)(react_2.Handle, { type: "target", position: isTB ? react_2.Position.Top : react_2.Position.Left, className: "!w-2.5 !h-2.5 !bg-ui-border-interactive !border-2 !border-white dark:!border-neutral-900 transition-transform group-hover:scale-125" }), (0, jsx_runtime_1.jsx)(tier_bars_1.TierBars, { tier: tier, color: branchColor }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-1 items-center gap-2.5 px-2.5 py-2 min-w-0 overflow-hidden", children: [(0, jsx_runtime_1.jsxs)("div", { className: "relative w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 border border-ui-border-base bg-ui-bg-subtle flex items-center justify-center shadow-2xs", children: [category.image_url ? ((0, jsx_runtime_1.jsx)("img", { src: category.image_url, alt: category.name, className: "w-full h-full object-cover", loading: "lazy" })) : ((0, jsx_runtime_1.jsx)("div", { className: "w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900 text-ui-fg-muted", children: (0, jsx_runtime_1.jsx)(icons_1.Folder, { className: "w-5 h-5 opacity-70" }) })), (0, jsx_runtime_1.jsx)("span", { className: `absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full border border-white dark:border-neutral-900 ${category.is_active ? "bg-emerald-500" : "bg-neutral-400"}`, title: category.is_active ? "Active" : "Inactive" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col min-w-0 flex-1 justify-center", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-1 min-w-0", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-xs font-semibold text-ui-fg-base truncate leading-snug flex-1 min-w-0", title: category.name, children: category.name }), superscriptRank && ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-0.5 flex-shrink-0", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-[11px] font-bold font-mono text-ui-fg-subtle px-1 py-0.5 rounded bg-ui-bg-subtle/80", title: `Rank #${siblingRank} among siblings (Storefront sort order)`, children: superscriptRank }), onMoveSiblingUp && ((0, jsx_runtime_1.jsx)("button", { type: "button", title: "Move Up in Storefront Order (\u2191)", onClick: (e) => {
                                                    e.stopPropagation();
                                                    onMoveSiblingUp(id);
                                                }, className: "w-3.5 h-3.5 flex items-center justify-center text-[10px] font-bold text-ui-fg-muted hover:text-ui-fg-base hover:bg-ui-bg-subtle rounded transition-colors", children: "\u2191" })), onMoveSiblingDown && ((0, jsx_runtime_1.jsx)("button", { type: "button", title: "Move Down in Storefront Order (\u2193)", onClick: (e) => {
                                                    e.stopPropagation();
                                                    onMoveSiblingDown(id);
                                                }, className: "w-3.5 h-3.5 flex items-center justify-center text-[10px] font-bold text-ui-fg-muted hover:text-ui-fg-base hover:bg-ui-bg-subtle rounded transition-colors", children: "\u2193" }))] }))] }), (0, jsx_runtime_1.jsxs)("span", { className: "text-[11px] text-ui-fg-muted truncate leading-tight mt-0.5", children: ["/", category.handle] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-1 mt-1 flex-wrap", children: [assignedStorefrontNames.slice(0, 2).map((name) => {
                                        const isSuperpunch = name.toLowerCase().includes("superpunch");
                                        const isMonfil = name.toLowerCase().includes("monfil");
                                        const badgeText = isSuperpunch ? "SP" : isMonfil ? "M" : name.slice(0, 2).toUpperCase();
                                        return ((0, jsx_runtime_1.jsx)("span", { className: "px-1 py-[1px] text-[9px] font-semibold rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200/60 dark:border-neutral-700/60", title: `Storefront: ${name}`, children: badgeText }, name));
                                    }), hasChildren && ((0, jsx_runtime_1.jsxs)("button", { type: "button", onClick: (e) => {
                                            e.stopPropagation();
                                            onToggleCollapse(id);
                                        }, className: `ml-auto px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-0.5 transition-colors ${isCollapsed
                                            ? "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800"
                                            : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300"}`, title: isCollapsed ? "Click to expand subcategories" : "Click to collapse subcategories", children: [(0, jsx_runtime_1.jsx)("span", { children: isCollapsed ? "▸" : "▾" }), (0, jsx_runtime_1.jsx)("span", { children: isCollapsed ? `+${hiddenDescendantCount || category.children_count}` : category.children_count || "sub" })] }))] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "absolute -top-3 right-2 hidden group-hover:flex items-center gap-1 px-1.5 py-0.5 bg-ui-bg-base/95 backdrop-blur-sm border border-ui-border-base rounded-full shadow-md z-20", children: [(0, jsx_runtime_1.jsx)("button", { type: "button", title: "Add Subcategory", onClick: (e) => {
                            e.stopPropagation();
                            onAddChild(category);
                        }, className: "p-1 text-ui-fg-subtle hover:text-ui-fg-base hover:bg-ui-bg-subtle rounded-full transition-colors", children: (0, jsx_runtime_1.jsx)(icons_1.Plus, { className: "w-3.5 h-3.5" }) }), (0, jsx_runtime_1.jsx)("button", { type: "button", title: "Edit Category", onClick: (e) => {
                            e.stopPropagation();
                            onEdit(category);
                        }, className: "p-1 text-ui-fg-subtle hover:text-ui-fg-base hover:bg-ui-bg-subtle rounded-full transition-colors", children: (0, jsx_runtime_1.jsx)(icons_1.PencilSquare, { className: "w-3.5 h-3.5" }) }), category.parent_category_id && ((0, jsx_runtime_1.jsx)("button", { type: "button", title: "Promote to Root (Detach)", onClick: (e) => {
                            e.stopPropagation();
                            onDetach(id);
                        }, className: "p-1 text-ui-fg-subtle hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-full transition-colors", children: (0, jsx_runtime_1.jsx)(icons_1.ArrowUturnLeft, { className: "w-3.5 h-3.5" }) }))] }), (0, jsx_runtime_1.jsx)(react_2.Handle, { type: "source", position: isTB ? react_2.Position.Bottom : react_2.Position.Right, className: "!w-2.5 !h-2.5 !bg-ui-border-interactive !border-2 !border-white dark:!border-neutral-900 transition-transform group-hover:scale-125" })] }));
});
exports.CategoryNode.displayName = "CategoryNode";
