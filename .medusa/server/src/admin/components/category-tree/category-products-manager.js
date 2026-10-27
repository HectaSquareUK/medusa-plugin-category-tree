"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryProductsManager = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const ui_1 = require("@medusajs/ui");
const icons_1 = require("@medusajs/icons");
const sdk_1 = require("../../lib/sdk");
const CategoryProductsManager = ({ categoryId, categoryName, initialMetadata, onMetadataUpdate, }) => {
    const [products, setProducts] = (0, react_1.useState)([]);
    const [totalCount, setTotalCount] = (0, react_1.useState)(0);
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    const [selectedIds, setSelectedIds] = (0, react_1.useState)(new Set());
    const [isRemoving, setIsRemoving] = (0, react_1.useState)(false);
    const [activeView, setActiveView] = (0, react_1.useState)("all");
    // Product ranking and top sellers state
    const [orderedProductIds, setOrderedProductIds] = (0, react_1.useState)([]);
    const [topSellerIds, setTopSellerIds] = (0, react_1.useState)(new Set());
    // Full-Screen Add Products FocusModal state (matching Medusa legacy modal)
    const [focusModalOpen, setFocusModalOpen] = (0, react_1.useState)(false);
    const [searchQuery, setSearchQuery] = (0, react_1.useState)("");
    const [catalogProducts, setCatalogProducts] = (0, react_1.useState)([]);
    const [catalogTotalCount, setCatalogTotalCount] = (0, react_1.useState)(0);
    const [catalogPage, setCatalogPage] = (0, react_1.useState)(0);
    const [isSearchingCatalog, setIsSearchingCatalog] = (0, react_1.useState)(false);
    const [catalogSelectedIds, setCatalogSelectedIds] = (0, react_1.useState)(new Set());
    const [isAdding, setIsAdding] = (0, react_1.useState)(false);
    const PAGE_SIZE = 50;
    // Initialize ranking and top sellers from category metadata
    (0, react_1.useEffect)(() => {
        if (initialMetadata) {
            if (Array.isArray(initialMetadata.ordered_product_ids)) {
                setOrderedProductIds(initialMetadata.ordered_product_ids);
            }
            if (Array.isArray(initialMetadata.top_sellers)) {
                setTopSellerIds(new Set(initialMetadata.top_sellers));
            }
        }
    }, [initialMetadata]);
    // Load products assigned to this category
    const loadAssignedProducts = (0, react_1.useCallback)(async () => {
        setIsLoading(true);
        try {
            const res = await sdk_1.sdk.client.fetch(`/admin/products?category_id[]=${categoryId}&limit=100&fields=id,title,thumbnail,status,variants.id,collection.title,sales_channels.name`);
            const fetched = res.products || [];
            setTotalCount(res.count ?? fetched.length);
            // Sort products according to orderedProductIds if available
            setProducts((prev) => {
                const orderMap = new Map(orderedProductIds.map((id, index) => [id, index]));
                return [...fetched].sort((a, b) => {
                    const indexA = orderMap.has(a.id) ? orderMap.get(a.id) : 9999;
                    const indexB = orderMap.has(b.id) ? orderMap.get(b.id) : 9999;
                    return indexA - indexB;
                });
            });
        }
        catch (err) {
            ui_1.toast.error(err?.message || "Failed to load assigned products");
        }
        finally {
            setIsLoading(false);
        }
    }, [categoryId, orderedProductIds]);
    (0, react_1.useEffect)(() => {
        loadAssignedProducts();
    }, [loadAssignedProducts]);
    // Save updated product rankings and top sellers to category metadata
    const persistProductConfig = async (newOrder, newTopSellers) => {
        const ranksMap = {};
        newOrder.forEach((id, idx) => {
            ranksMap[id] = idx + 1;
        });
        const updatedMetadata = {
            ...(initialMetadata || {}),
            ordered_product_ids: newOrder,
            product_ranks: ranksMap,
            top_sellers: Array.from(newTopSellers),
        };
        try {
            await sdk_1.sdk.admin.productCategory.update(categoryId, {
                metadata: updatedMetadata,
            });
            if (onMetadataUpdate) {
                onMetadataUpdate(updatedMetadata);
            }
        }
        catch (err) {
            ui_1.toast.error(err?.message || "Failed to save product ordering");
        }
    };
    // Sibling product ranking handlers (Move Up / Move Down)
    const handleMoveProduct = async (index, direction) => {
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= products.length)
            return;
        const reordered = [...products];
        const [moved] = reordered.splice(index, 1);
        reordered.splice(targetIndex, 0, moved);
        setProducts(reordered);
        const newOrder = reordered.map((p) => p.id);
        setOrderedProductIds(newOrder);
        ui_1.toast.info(`Moved "${moved.title}" to #${targetIndex + 1}`);
        await persistProductConfig(newOrder, topSellerIds);
    };
    // Toggle Top Commercial Seller status
    const handleToggleTopSeller = async (productId, productTitle) => {
        const next = new Set(topSellerIds);
        const isNowTop = !next.has(productId);
        if (isNowTop) {
            next.add(productId);
            ui_1.toast.success(`Marked "${productTitle}" as Top Commercial Seller ⭐`);
        }
        else {
            next.delete(productId);
            ui_1.toast.info(`Removed "${productTitle}" from Top Commercial Sellers`);
        }
        setTopSellerIds(next);
        const currentOrder = products.map((p) => p.id);
        await persistProductConfig(currentOrder, next);
    };
    // Remove products from category
    const handleRemoveProducts = async (idsToRemove) => {
        if (idsToRemove.length === 0)
            return;
        const msg = idsToRemove.length === 1
            ? "Are you sure you want to remove this product from the category?"
            : `Are you sure you want to remove ${idsToRemove.length} products from this category?`;
        if (!confirm(msg))
            return;
        setIsRemoving(true);
        try {
            await sdk_1.sdk.client.fetch(`/admin/product-categories/${categoryId}/products`, {
                method: "POST",
                body: { remove: idsToRemove },
            });
            ui_1.toast.success(`Removed ${idsToRemove.length} product(s) from category`);
            setSelectedIds(new Set());
            // Also clean up ranking and top sellers
            const removeSet = new Set(idsToRemove);
            const newOrder = orderedProductIds.filter((id) => !removeSet.has(id));
            const newTopSellers = new Set(Array.from(topSellerIds).filter((id) => !removeSet.has(id)));
            setOrderedProductIds(newOrder);
            setTopSellerIds(newTopSellers);
            await persistProductConfig(newOrder, newTopSellers);
            await loadAssignedProducts();
        }
        catch (err) {
            ui_1.toast.error(err?.message || "Failed to remove products");
        }
        finally {
            setIsRemoving(false);
        }
    };
    // Search catalog for the Add Products FocusModal (matching Medusa's legacy product table)
    const searchCatalog = (0, react_1.useCallback)(async (query, page) => {
        setIsSearchingCatalog(true);
        try {
            const qParam = query.trim() ? `&q=${encodeURIComponent(query.trim())}` : "";
            const offset = page * PAGE_SIZE;
            const res = await sdk_1.sdk.client.fetch(`/admin/products?limit=${PAGE_SIZE}&offset=${offset}${qParam}&fields=id,title,thumbnail,status,variants.id,collection.title,sales_channels.name`);
            setCatalogProducts(res.products || []);
            setCatalogTotalCount(res.count ?? (res.products?.length || 0));
        }
        catch (err) {
            ui_1.toast.error(err?.message || "Failed to search catalog");
        }
        finally {
            setIsSearchingCatalog(false);
        }
    }, []);
    (0, react_1.useEffect)(() => {
        if (focusModalOpen) {
            searchCatalog(searchQuery, catalogPage);
        }
    }, [focusModalOpen, searchQuery, catalogPage, searchCatalog]);
    const handleSaveAddedProducts = async () => {
        const idsToAdd = Array.from(catalogSelectedIds);
        if (idsToAdd.length === 0)
            return;
        setIsAdding(true);
        try {
            await sdk_1.sdk.client.fetch(`/admin/product-categories/${categoryId}/products`, {
                method: "POST",
                body: { add: idsToAdd },
            });
            ui_1.toast.success(`Added ${idsToAdd.length} product(s) to ${categoryName}`);
            setFocusModalOpen(false);
            setCatalogSelectedIds(new Set());
            // Append new products to orderedProductIds
            const newOrder = [...orderedProductIds, ...idsToAdd];
            setOrderedProductIds(newOrder);
            await persistProductConfig(newOrder, topSellerIds);
            await loadAssignedProducts();
        }
        catch (err) {
            ui_1.toast.error(err?.message || "Failed to add products");
        }
        finally {
            setIsAdding(false);
        }
    };
    const assignedProductIdsSet = (0, react_1.useMemo)(() => new Set(products.map((p) => p.id)), [products]);
    const displayedProducts = (0, react_1.useMemo)(() => {
        if (activeView === "top_sellers") {
            return products.filter((p) => topSellerIds.has(p.id));
        }
        return products;
    }, [products, activeView, topSellerIds]);
    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between flex-wrap gap-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-1.5 p-1 rounded-lg bg-ui-bg-subtle border border-ui-border-base", children: [(0, jsx_runtime_1.jsxs)("button", { type: "button", onClick: () => setActiveView("all"), className: `px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${activeView === "all"
                                    ? "bg-ui-bg-base text-ui-fg-base shadow-2xs font-semibold"
                                    : "text-ui-fg-muted hover:text-ui-fg-base"}`, children: ["All Products (", products.length, ")"] }), (0, jsx_runtime_1.jsxs)("button", { type: "button", onClick: () => setActiveView("top_sellers"), className: `flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${activeView === "top_sellers"
                                    ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold"
                                    : "text-ui-fg-muted hover:text-amber-600"}`, children: [(0, jsx_runtime_1.jsx)(icons_1.Sparkles, { className: "w-3.5 h-3.5 text-amber-500" }), (0, jsx_runtime_1.jsxs)("span", { children: ["Top Commercial Sellers (", topSellerIds.size, ")"] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [selectedIds.size > 0 && ((0, jsx_runtime_1.jsxs)(ui_1.Button, { size: "small", variant: "danger", disabled: isRemoving, onClick: () => handleRemoveProducts(Array.from(selectedIds)), className: "flex items-center gap-1 text-xs", children: [(0, jsx_runtime_1.jsx)(icons_1.Trash, { className: "w-3.5 h-3.5" }), (0, jsx_runtime_1.jsxs)("span", { children: ["Remove Selected (", selectedIds.size, ")"] })] })), (0, jsx_runtime_1.jsxs)(ui_1.Button, { size: "small", variant: "secondary", onClick: () => {
                                    setCatalogSelectedIds(new Set());
                                    setSearchQuery("");
                                    setCatalogPage(0);
                                    setFocusModalOpen(true);
                                }, className: "flex items-center gap-1 text-xs", children: [(0, jsx_runtime_1.jsx)(icons_1.Plus, { className: "w-3.5 h-3.5" }), (0, jsx_runtime_1.jsx)("span", { children: "Add Products" })] })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "border border-ui-border-base rounded-xl overflow-hidden bg-ui-bg-base shadow-2xs", children: isLoading ? ((0, jsx_runtime_1.jsx)("div", { className: "p-8 text-center text-xs text-ui-fg-muted", children: "Loading products\u2026" })) : displayedProducts.length === 0 ? ((0, jsx_runtime_1.jsxs)("div", { className: "p-8 text-center flex flex-col items-center justify-center gap-2", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs text-ui-fg-muted", children: activeView === "top_sellers"
                                ? "No products marked as Top Commercial Sellers yet. Star a product below to highlight it."
                                : "No products assigned to this category." }), activeView === "all" && ((0, jsx_runtime_1.jsxs)(ui_1.Button, { size: "small", variant: "secondary", onClick: () => setFocusModalOpen(true), className: "flex items-center gap-1 text-xs", children: [(0, jsx_runtime_1.jsx)(icons_1.Plus, { className: "w-3.5 h-3.5" }), (0, jsx_runtime_1.jsx)("span", { children: "Add Products" })] }))] })) : ((0, jsx_runtime_1.jsxs)("table", { className: "w-full text-left text-xs border-collapse", children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsxs)("tr", { className: "border-b border-ui-border-base bg-ui-bg-subtle/60 text-ui-fg-muted font-medium", children: [(0, jsx_runtime_1.jsx)("th", { className: "py-2.5 px-3 w-8", children: (0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: displayedProducts.length > 0 && selectedIds.size === displayedProducts.length, onChange: () => {
                                                if (selectedIds.size === displayedProducts.length)
                                                    setSelectedIds(new Set());
                                                else
                                                    setSelectedIds(new Set(displayedProducts.map((p) => p.id)));
                                            }, className: "rounded border-ui-border-base cursor-pointer" }) }), (0, jsx_runtime_1.jsx)("th", { className: "py-2.5 px-3 w-20", children: "Rank" }), (0, jsx_runtime_1.jsx)("th", { className: "py-2.5 px-3", children: "Product" }), (0, jsx_runtime_1.jsx)("th", { className: "py-2.5 px-3", children: "Top Seller" }), (0, jsx_runtime_1.jsx)("th", { className: "py-2.5 px-3", children: "Collection" }), (0, jsx_runtime_1.jsx)("th", { className: "py-2.5 px-3", children: "Variants" }), (0, jsx_runtime_1.jsx)("th", { className: "py-2.5 px-3", children: "Status" }), (0, jsx_runtime_1.jsx)("th", { className: "py-2.5 px-3 text-right", children: "Action" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { className: "divide-y divide-ui-border-base", children: displayedProducts.map((p, index) => {
                                const isChecked = selectedIds.has(p.id);
                                const isTopSeller = topSellerIds.has(p.id);
                                return ((0, jsx_runtime_1.jsxs)("tr", { className: `hover:bg-ui-bg-subtle/40 transition-colors ${isChecked ? "bg-blue-50/40 dark:bg-blue-950/20" : ""}`, children: [(0, jsx_runtime_1.jsx)("td", { className: "py-2.5 px-3", children: (0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: isChecked, onChange: () => {
                                                    setSelectedIds((prev) => {
                                                        const next = new Set(prev);
                                                        if (next.has(p.id))
                                                            next.delete(p.id);
                                                        else
                                                            next.add(p.id);
                                                        return next;
                                                    });
                                                }, className: "rounded border-ui-border-base cursor-pointer" }) }), (0, jsx_runtime_1.jsx)("td", { className: "py-2.5 px-3", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-1 font-mono", children: [(0, jsx_runtime_1.jsxs)("span", { className: "text-xs font-bold text-ui-fg-subtle px-1.5 py-0.5 rounded bg-ui-bg-subtle border border-ui-border-base", children: ["#", index + 1] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col", children: [(0, jsx_runtime_1.jsx)("button", { type: "button", title: "Move Up", disabled: index === 0, onClick: () => handleMoveProduct(index, "up"), className: "text-[9px] text-ui-fg-muted hover:text-ui-fg-base disabled:opacity-20 px-0.5 leading-none", children: "\u25B2" }), (0, jsx_runtime_1.jsx)("button", { type: "button", title: "Move Down", disabled: index === displayedProducts.length - 1, onClick: () => handleMoveProduct(index, "down"), className: "text-[9px] text-ui-fg-muted hover:text-ui-fg-base disabled:opacity-20 px-0.5 leading-none", children: "\u25BC" })] })] }) }), (0, jsx_runtime_1.jsx)("td", { className: "py-2.5 px-3", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2.5 min-w-0", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-9 h-9 rounded-md border border-ui-border-base overflow-hidden bg-ui-bg-subtle flex-shrink-0 flex items-center justify-center", children: p.thumbnail ? ((0, jsx_runtime_1.jsx)("img", { src: p.thumbnail, alt: p.title, className: "w-full h-full object-cover" })) : ((0, jsx_runtime_1.jsx)("span", { className: "text-[9px] text-ui-fg-muted", children: "IMG" })) }), (0, jsx_runtime_1.jsx)("div", { className: "flex flex-col min-w-0", children: (0, jsx_runtime_1.jsx)("span", { className: "font-semibold text-ui-fg-base truncate leading-snug", title: p.title, children: p.title }) })] }) }), (0, jsx_runtime_1.jsx)("td", { className: "py-2.5 px-3", children: (0, jsx_runtime_1.jsxs)("button", { type: "button", onClick: () => handleToggleTopSeller(p.id, p.title), className: `inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border transition-all ${isTopSeller
                                                    ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700 shadow-2xs"
                                                    : "bg-ui-bg-subtle text-ui-fg-muted border-ui-border-base hover:text-amber-600 hover:border-amber-300"}`, title: isTopSeller
                                                    ? "Click to remove from Top Commercial Sellers"
                                                    : "Click to mark as Top Commercial Seller (Reflected in Storefront 2)", children: [(0, jsx_runtime_1.jsx)("span", { children: isTopSeller ? "★" : "☆" }), (0, jsx_runtime_1.jsx)("span", { children: isTopSeller ? "Top Seller" : "Normal" })] }) }), (0, jsx_runtime_1.jsx)("td", { className: "py-2.5 px-3 text-ui-fg-muted", children: p.collection?.title || "-" }), (0, jsx_runtime_1.jsxs)("td", { className: "py-2.5 px-3 text-ui-fg-subtle", children: [p.variants?.length || 0, " variant(s)"] }), (0, jsx_runtime_1.jsx)("td", { className: "py-2.5 px-3", children: (0, jsx_runtime_1.jsx)("span", { className: `inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${p.status === "published"
                                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300"
                                                    : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"}`, children: p.status }) }), (0, jsx_runtime_1.jsx)("td", { className: "py-2.5 px-3 text-right", children: (0, jsx_runtime_1.jsx)("button", { type: "button", title: "Remove from category", onClick: () => handleRemoveProducts([p.id]), className: "p-1 text-ui-fg-muted hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded transition-colors", children: (0, jsx_runtime_1.jsx)(icons_1.Trash, { className: "w-3.5 h-3.5" }) }) })] }, p.id));
                            }) })] })) }), focusModalOpen && ((0, jsx_runtime_1.jsxs)("div", { className: "fixed inset-0 z-50 flex flex-col bg-white dark:bg-neutral-950 animate-in fade-in-50", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between px-6 py-3 border-b border-ui-border-base bg-ui-bg-base flex-shrink-0", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setFocusModalOpen(false), className: "p-1.5 rounded-lg text-ui-fg-muted hover:text-ui-fg-base hover:bg-ui-bg-subtle transition-colors", title: "Close (ESC)", children: (0, jsx_runtime_1.jsx)("span", { className: "text-sm font-bold", children: "\u2715" }) }), (0, jsx_runtime_1.jsx)("span", { className: "text-[11px] font-mono font-medium text-ui-fg-muted px-1.5 py-0.5 rounded bg-ui-bg-subtle border border-ui-border-base", children: "ESC" }), (0, jsx_runtime_1.jsxs)("h2", { className: "text-sm font-semibold text-ui-fg-base", children: ["Add Products to Category: ", categoryName] })] }), (0, jsx_runtime_1.jsx)("div", { className: "flex items-center gap-3", children: (0, jsx_runtime_1.jsxs)("div", { className: "relative w-64", children: [(0, jsx_runtime_1.jsx)("input", { type: "text", placeholder: "Search products\u2026", value: searchQuery, onChange: (e) => {
                                                setSearchQuery(e.target.value);
                                                setCatalogPage(0);
                                            }, className: "w-full text-xs pl-8 pr-3 py-1.5 rounded-lg bg-ui-bg-subtle border border-ui-border-base text-ui-fg-base focus:bg-ui-bg-base focus:border-ui-border-interactive focus:outline-none placeholder:text-ui-fg-muted", autoFocus: true }), (0, jsx_runtime_1.jsx)(icons_1.MagnifyingGlass, { className: "absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ui-fg-muted pointer-events-none" })] }) })] }), (0, jsx_runtime_1.jsx)("div", { className: "flex-1 overflow-y-auto px-6 py-4", children: (0, jsx_runtime_1.jsx)("div", { className: "border border-ui-border-base rounded-xl overflow-hidden bg-ui-bg-base shadow-sm", children: (0, jsx_runtime_1.jsxs)("table", { className: "w-full text-left text-xs border-collapse", children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsxs)("tr", { className: "border-b border-ui-border-base bg-ui-bg-subtle/80 text-ui-fg-muted font-medium", children: [(0, jsx_runtime_1.jsx)("th", { className: "py-2.5 px-3 w-8", children: (0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: catalogProducts.length > 0 &&
                                                            catalogProducts.every((p) => assignedProductIdsSet.has(p.id) || catalogSelectedIds.has(p.id)), onChange: () => {
                                                            const available = catalogProducts.filter((p) => !assignedProductIdsSet.has(p.id));
                                                            if (available.every((p) => catalogSelectedIds.has(p.id))) {
                                                                setCatalogSelectedIds(new Set());
                                                            }
                                                            else {
                                                                setCatalogSelectedIds(new Set(available.map((p) => p.id)));
                                                            }
                                                        }, className: "rounded border-ui-border-base cursor-pointer" }) }), (0, jsx_runtime_1.jsx)("th", { className: "py-2.5 px-3", children: "Product" }), (0, jsx_runtime_1.jsx)("th", { className: "py-2.5 px-3", children: "Collection" }), (0, jsx_runtime_1.jsx)("th", { className: "py-2.5 px-3", children: "Sales Channels" }), (0, jsx_runtime_1.jsx)("th", { className: "py-2.5 px-3", children: "Variants" }), (0, jsx_runtime_1.jsx)("th", { className: "py-2.5 px-3", children: "Status" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { className: "divide-y divide-ui-border-base", children: isSearchingCatalog ? ((0, jsx_runtime_1.jsx)("tr", { children: (0, jsx_runtime_1.jsx)("td", { colSpan: 6, className: "py-12 text-center text-ui-fg-muted", children: "Searching catalog products\u2026" }) })) : catalogProducts.length === 0 ? ((0, jsx_runtime_1.jsx)("tr", { children: (0, jsx_runtime_1.jsx)("td", { colSpan: 6, className: "py-12 text-center text-ui-fg-muted", children: "No products found." }) })) : (catalogProducts.map((p) => {
                                            const isAlreadyAssigned = assignedProductIdsSet.has(p.id);
                                            const isSelected = catalogSelectedIds.has(p.id) || isAlreadyAssigned;
                                            return ((0, jsx_runtime_1.jsxs)("tr", { onClick: () => {
                                                    if (isAlreadyAssigned)
                                                        return;
                                                    setCatalogSelectedIds((prev) => {
                                                        const next = new Set(prev);
                                                        if (next.has(p.id))
                                                            next.delete(p.id);
                                                        else
                                                            next.add(p.id);
                                                        return next;
                                                    });
                                                }, className: `cursor-pointer transition-colors ${isAlreadyAssigned
                                                    ? "opacity-50 bg-ui-bg-subtle/30 cursor-not-allowed"
                                                    : isSelected
                                                        ? "bg-blue-50/50 dark:bg-blue-950/30"
                                                        : "hover:bg-ui-bg-subtle/50"}`, children: [(0, jsx_runtime_1.jsx)("td", { className: "py-2.5 px-3", onClick: (e) => e.stopPropagation(), children: (0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: isSelected, disabled: isAlreadyAssigned, onChange: () => {
                                                                if (isAlreadyAssigned)
                                                                    return;
                                                                setCatalogSelectedIds((prev) => {
                                                                    const next = new Set(prev);
                                                                    if (next.has(p.id))
                                                                        next.delete(p.id);
                                                                    else
                                                                        next.add(p.id);
                                                                    return next;
                                                                });
                                                            }, className: "rounded border-ui-border-base cursor-pointer" }) }), (0, jsx_runtime_1.jsx)("td", { className: "py-2.5 px-3", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2.5 min-w-0", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-8 h-8 rounded border border-ui-border-base overflow-hidden bg-ui-bg-subtle flex-shrink-0 flex items-center justify-center", children: p.thumbnail ? ((0, jsx_runtime_1.jsx)("img", { src: p.thumbnail, alt: p.title, className: "w-full h-full object-cover" })) : ((0, jsx_runtime_1.jsx)("span", { className: "text-[8px] text-ui-fg-muted", children: "IMG" })) }), (0, jsx_runtime_1.jsx)("span", { className: "font-semibold text-ui-fg-base truncate leading-snug", children: p.title }), isAlreadyAssigned && ((0, jsx_runtime_1.jsx)(ui_1.Badge, { size: "small", color: "grey", className: "ml-1 text-[9px]", children: "Already in Category" }))] }) }), (0, jsx_runtime_1.jsx)("td", { className: "py-2.5 px-3 text-ui-fg-muted", children: p.collection?.title || "-" }), (0, jsx_runtime_1.jsx)("td", { className: "py-2.5 px-3", children: (0, jsx_runtime_1.jsx)("div", { className: "flex items-center gap-1 flex-wrap", children: (p.sales_channels || []).map((sc) => ((0, jsx_runtime_1.jsx)("span", { className: "px-1.5 py-0.5 rounded text-[10px] bg-ui-bg-subtle border border-ui-border-base text-ui-fg-subtle", children: sc.name }, sc.id))) }) }), (0, jsx_runtime_1.jsxs)("td", { className: "py-2.5 px-3 text-ui-fg-subtle", children: [p.variants?.length || 0, " variant(s)"] }), (0, jsx_runtime_1.jsx)("td", { className: "py-2.5 px-3", children: (0, jsx_runtime_1.jsx)("span", { className: `inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${p.status === "published"
                                                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300"
                                                                : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"}`, children: p.status }) })] }, p.id));
                                        })) })] }) }) }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between px-6 py-3 border-t border-ui-border-base bg-ui-bg-base flex-shrink-0", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsxs)("span", { className: "text-xs text-ui-fg-muted", children: ["Showing ", Math.min(catalogProducts.length, PAGE_SIZE), " of ", catalogTotalCount, " results"] }), (0, jsx_runtime_1.jsx)("span", { className: "text-xs text-ui-fg-muted", children: "\u2022" }), (0, jsx_runtime_1.jsxs)("span", { className: "text-xs font-semibold text-ui-fg-base", children: [catalogSelectedIds.size, " product(s) selected"] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("button", { type: "button", disabled: catalogPage === 0, onClick: () => setCatalogPage((p) => Math.max(0, p - 1)), className: "px-2.5 py-1 text-xs rounded border border-ui-border-base bg-ui-bg-subtle hover:bg-ui-bg-base disabled:opacity-40", children: "Prev" }), (0, jsx_runtime_1.jsx)("button", { type: "button", disabled: (catalogPage + 1) * PAGE_SIZE >= catalogTotalCount, onClick: () => setCatalogPage((p) => p + 1), className: "px-2.5 py-1 text-xs rounded border border-ui-border-base bg-ui-bg-subtle hover:bg-ui-bg-base disabled:opacity-40", children: "Next" }), (0, jsx_runtime_1.jsx)("div", { className: "h-4 w-[1px] bg-ui-border-base mx-1" }), (0, jsx_runtime_1.jsx)(ui_1.Button, { size: "small", variant: "secondary", onClick: () => setFocusModalOpen(false), children: "Cancel" }), (0, jsx_runtime_1.jsxs)(ui_1.Button, { size: "small", variant: "primary", disabled: catalogSelectedIds.size === 0 || isAdding, onClick: handleSaveAddedProducts, className: "flex items-center gap-1 text-xs min-w-[70px] justify-center", children: [(0, jsx_runtime_1.jsx)(icons_1.CheckMini, { className: "w-3.5 h-3.5" }), (0, jsx_runtime_1.jsx)("span", { children: isAdding ? "Saving…" : "Save" })] })] })] })] }))] }));
};
exports.CategoryProductsManager = CategoryProductsManager;
