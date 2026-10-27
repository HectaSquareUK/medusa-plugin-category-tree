"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditCategoryDrawer = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const ui_1 = require("@medusajs/ui");
const icons_1 = require("@medusajs/icons");
const category_products_manager_1 = require("./category-products-manager");
const sdk_1 = require("../../lib/sdk");
function extractYouTubeVideoId(url) {
    if (!url || typeof url !== "string")
        return null;
    const trimmed = url.trim();
    const patterns = [
        /(?:youtube\.com\/shorts\/)([^?&\s]+)/i,
        /(?:youtube\.com\/watch\?.*v=)([^?&\s]+)/i,
        /(?:youtu\.be\/)([^?&\s]+)/i,
        /(?:youtube\.com\/embed\/)([^?&\s]+)/i,
    ];
    for (const pattern of patterns) {
        const match = trimmed.match(pattern);
        if (match && match[1])
            return match[1];
    }
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed))
        return trimmed;
    return null;
}
const EditCategoryDrawer = ({ open, onOpenChange, category, salesChannels, onSuccess, onDeleteSuccess, }) => {
    const [activeTab, setActiveTab] = (0, react_1.useState)("general");
    const [name, setName] = (0, react_1.useState)("");
    const [handle, setHandle] = (0, react_1.useState)("");
    const [description, setDescription] = (0, react_1.useState)("");
    const [imageUrl, setImageUrl] = (0, react_1.useState)("");
    const [rank, setRank] = (0, react_1.useState)(0);
    const [isActive, setIsActive] = (0, react_1.useState)(true);
    const [isInternal, setIsInternal] = (0, react_1.useState)(false);
    const [selectedChannels, setSelectedChannels] = (0, react_1.useState)([]);
    const [youtubeUrls, setYoutubeUrls] = (0, react_1.useState)([]);
    const [newYoutubeInput, setNewYoutubeInput] = (0, react_1.useState)("");
    const [currentMetadata, setCurrentMetadata] = (0, react_1.useState)({});
    const [isFullScreen, setIsFullScreen] = (0, react_1.useState)(false);
    const [isSubmitting, setIsSubmitting] = (0, react_1.useState)(false);
    const [isDeleting, setIsDeleting] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        if (category) {
            setName(category.name || "");
            setHandle(category.handle || "");
            setDescription(category.description || "");
            setImageUrl(category.image_url || "");
            setRank(category.rank ?? 0);
            setIsActive(Boolean(category.is_active));
            setIsInternal(Boolean(category.is_internal));
            setSelectedChannels(category.sales_channels || salesChannels.map((s) => s.id));
            setCurrentMetadata(category.metadata || {});
            // Parse YouTube URLs from metadata
            const meta = category.metadata;
            const urls = [];
            if (meta?.youtube_urls && Array.isArray(meta.youtube_urls)) {
                meta.youtube_urls.forEach((u) => typeof u === "string" && u.trim() && urls.push(u.trim()));
            }
            else if (meta?.youtube_url && typeof meta.youtube_url === "string") {
                urls.push(meta.youtube_url.trim());
            }
            setYoutubeUrls(urls);
            setActiveTab("general");
        }
    }, [category, salesChannels]);
    if (!category)
        return null;
    const toggleChannel = (channelId) => {
        setSelectedChannels((prev) => prev.includes(channelId)
            ? prev.filter((id) => id !== channelId)
            : [...prev, channelId]);
    };
    const handleAddYoutube = () => {
        const raw = newYoutubeInput.trim();
        if (!raw)
            return;
        const id = extractYouTubeVideoId(raw);
        if (!id) {
            ui_1.toast.error("Please enter a valid YouTube URL or video ID");
            return;
        }
        const cleanUrl = `https://www.youtube.com/watch?v=${id}`;
        if (youtubeUrls.includes(cleanUrl)) {
            ui_1.toast.error("Video already added");
            return;
        }
        setYoutubeUrls((prev) => [...prev, cleanUrl]);
        setNewYoutubeInput("");
        ui_1.toast.success("YouTube video added");
    };
    const handleRemoveYoutube = (urlToRemove) => {
        setYoutubeUrls((prev) => prev.filter((u) => u !== urlToRemove));
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) {
            ui_1.toast.error("Category name is required");
            return;
        }
        setIsSubmitting(true);
        try {
            const updatedMetadata = {
                ...(currentMetadata || {}),
                sales_channels: selectedChannels,
                youtube_urls: youtubeUrls,
            };
            if (imageUrl.trim()) {
                updatedMetadata.thumbnail = imageUrl.trim();
                updatedMetadata.image = imageUrl.trim();
            }
            await sdk_1.sdk.admin.productCategory.update(category.id, {
                name: name.trim(),
                handle: handle.trim() || undefined,
                description: description.trim() || undefined,
                rank: Number(rank) || 0,
                is_active: isActive,
                is_internal: isInternal,
                metadata: updatedMetadata,
            });
            const updated = {
                ...category,
                name: name.trim(),
                handle: handle.trim(),
                description: description.trim() || null,
                image_url: imageUrl.trim() || category.image_url,
                rank: Number(rank) || 0,
                sales_channels: selectedChannels,
                is_active: isActive,
                is_internal: isInternal,
                metadata: updatedMetadata,
            };
            ui_1.toast.success("Category updated successfully");
            onSuccess(updated);
            onOpenChange(false);
        }
        catch (err) {
            ui_1.toast.error(err?.message || "Failed to update category");
        }
        finally {
            setIsSubmitting(false);
        }
    };
    const handleDelete = async () => {
        if (!confirm(`Are you sure you want to delete category "${category.name}"? Subcategories will be promoted.`)) {
            return;
        }
        setIsDeleting(true);
        try {
            await sdk_1.sdk.admin.productCategory.delete(category.id);
            ui_1.toast.success(`Category "${category.name}" deleted`);
            onDeleteSuccess(category.id);
            onOpenChange(false);
        }
        catch (err) {
            ui_1.toast.error(err?.message || "Failed to delete category");
        }
        finally {
            setIsDeleting(false);
        }
    };
    return ((0, jsx_runtime_1.jsx)(ui_1.Drawer, { open: open, onOpenChange: onOpenChange, children: (0, jsx_runtime_1.jsx)(ui_1.Drawer.Content, { className: `transition-all duration-300 w-full z-50 ${isFullScreen
                ? "!max-w-full !w-screen !h-screen !inset-0 !rounded-none"
                : "max-w-5xl xl:max-w-6xl w-[92vw]"}`, children: (0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSubmit, className: "flex flex-col h-full", children: [(0, jsx_runtime_1.jsxs)(ui_1.Drawer.Header, { className: "border-b border-ui-border-base pb-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between w-full", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)(ui_1.Drawer.Title, { className: "text-base font-semibold text-ui-fg-base", children: category.name }), (0, jsx_runtime_1.jsxs)(ui_1.Drawer.Description, { className: "text-xs text-ui-fg-muted mt-0.5", children: ["Tier ", category.tier, " \u2022 ID: ", category.id] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsxs)("button", { type: "button", onClick: () => setIsFullScreen((prev) => !prev), className: "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-ui-fg-subtle hover:text-ui-fg-base rounded-lg border border-ui-border-base bg-ui-bg-subtle hover:bg-ui-bg-base shadow-2xs transition-colors", title: isFullScreen ? "Exit Fullscreen" : "Expand to Full Page Modal", children: [(0, jsx_runtime_1.jsx)(icons_1.ArrowsPointingOut, { className: "w-3.5 h-3.5" }), (0, jsx_runtime_1.jsx)("span", { children: isFullScreen ? "Exit Fullscreen" : "Full Page" })] }), (0, jsx_runtime_1.jsxs)("button", { type: "button", onClick: () => window.open(`/app/categories/${category.id}`, "_blank"), className: "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-ui-fg-subtle hover:text-ui-fg-base rounded-lg border border-ui-border-base bg-ui-bg-subtle hover:bg-ui-bg-base shadow-2xs transition-colors", title: "Open full category details page in a new tab", children: [(0, jsx_runtime_1.jsx)("span", { children: "Open Full Page" }), (0, jsx_runtime_1.jsx)(icons_1.ArrowUpRightMicro, { className: "w-3.5 h-3.5" })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-1 mt-3 border-b border-ui-border-base/50 -mb-3 pb-1", children: [(0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setActiveTab("general"), className: `px-3 py-1.5 text-xs font-medium rounded-t-lg transition-colors border-b-2 -mb-[5px] ${activeTab === "general"
                                            ? "border-ui-border-interactive text-ui-fg-base bg-ui-bg-subtle/50"
                                            : "border-transparent text-ui-fg-muted hover:text-ui-fg-base"}`, children: "General & Ranking" }), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setActiveTab("products"), className: `px-3 py-1.5 text-xs font-medium rounded-t-lg transition-colors border-b-2 -mb-[5px] ${activeTab === "products"
                                            ? "border-ui-border-interactive text-ui-fg-base bg-ui-bg-subtle/50"
                                            : "border-transparent text-ui-fg-muted hover:text-ui-fg-base"}`, children: "Products Management" }), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setActiveTab("channels"), className: `px-3 py-1.5 text-xs font-medium rounded-t-lg transition-colors border-b-2 -mb-[5px] ${activeTab === "channels"
                                            ? "border-ui-border-interactive text-ui-fg-base bg-ui-bg-subtle/50"
                                            : "border-transparent text-ui-fg-muted hover:text-ui-fg-base"}`, children: "Storefronts & Media" }), (0, jsx_runtime_1.jsxs)("button", { type: "button", onClick: () => setActiveTab("youtube"), className: `px-3 py-1.5 text-xs font-medium rounded-t-lg transition-colors border-b-2 -mb-[5px] ${activeTab === "youtube"
                                            ? "border-ui-border-interactive text-ui-fg-base bg-ui-bg-subtle/50"
                                            : "border-transparent text-ui-fg-muted hover:text-ui-fg-base"}`, children: ["YouTube Videos (", youtubeUrls.length, ")"] })] })] }), (0, jsx_runtime_1.jsxs)(ui_1.Drawer.Body, { className: "flex flex-col gap-4 overflow-y-auto px-6 py-4 flex-1", children: [activeTab === "general" && ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-1.5", children: [(0, jsx_runtime_1.jsx)(ui_1.Label, { htmlFor: "edit-name", className: "text-xs font-semibold", children: "Category Name *" }), (0, jsx_runtime_1.jsx)(ui_1.Input, { id: "edit-name", size: "small", value: name, onChange: (e) => setName(e.target.value) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-1.5", children: [(0, jsx_runtime_1.jsx)(ui_1.Label, { htmlFor: "edit-handle", className: "text-xs font-semibold", children: "Handle (URL slug)" }), (0, jsx_runtime_1.jsx)(ui_1.Input, { id: "edit-handle", size: "small", value: handle, onChange: (e) => setHandle(e.target.value) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-1.5 p-3 rounded-lg bg-ui-bg-subtle border border-ui-border-base", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsx)(ui_1.Label, { htmlFor: "edit-rank", className: "text-xs font-semibold", children: "Storefront Ranking (Sort Order)" }), (0, jsx_runtime_1.jsx)("span", { className: "text-[10px] font-mono text-ui-fg-muted", children: "Controls Storefront 2 & Monfil" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(ui_1.Input, { id: "edit-rank", type: "number", size: "small", value: rank, onChange: (e) => setRank(Number(e.target.value)), className: "w-24" }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-1", children: [(0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setRank((r) => Math.max(0, r - 1)), className: "px-2 py-1 text-xs font-medium rounded border border-ui-border-base bg-ui-bg-base hover:bg-ui-bg-subtle transition-colors", title: "Move Earlier in Storefront", children: "\u2191 Earlier" }), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setRank((r) => r + 1), className: "px-2 py-1 text-xs font-medium rounded border border-ui-border-base bg-ui-bg-base hover:bg-ui-bg-subtle transition-colors", title: "Move Later in Storefront", children: "\u2193 Later" }), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setRank(0), className: "px-2 py-1 text-xs font-medium rounded border border-ui-border-base bg-ui-bg-base hover:bg-ui-bg-subtle transition-colors", title: "Set as First Category", children: "Top (#0)" })] })] }), (0, jsx_runtime_1.jsx)("p", { className: "text-[11px] text-ui-fg-muted leading-relaxed", children: "Categories are sorted by rank ASC (0, 1, 2...). Lower numbers appear first on your storefront navigation menu." })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-1.5", children: [(0, jsx_runtime_1.jsx)(ui_1.Label, { htmlFor: "edit-desc", className: "text-xs font-semibold", children: "Description" }), (0, jsx_runtime_1.jsx)(ui_1.Textarea, { id: "edit-desc", value: description, onChange: (e) => setDescription(e.target.value), rows: 3 })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between pt-2 border-t border-ui-border-base", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)(ui_1.Label, { className: "text-xs font-semibold", children: "Active Status" }), (0, jsx_runtime_1.jsx)(ui_1.Text, { size: "xsmall", className: "text-ui-fg-muted", children: "Visible to shoppers on enabled storefronts" })] }), (0, jsx_runtime_1.jsx)(ui_1.Switch, { checked: isActive, onCheckedChange: setIsActive })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)(ui_1.Label, { className: "text-xs font-semibold", children: "Internal Only" }), (0, jsx_runtime_1.jsx)(ui_1.Text, { size: "xsmall", className: "text-ui-fg-muted", children: "Hidden from public storefront navigation" })] }), (0, jsx_runtime_1.jsx)(ui_1.Switch, { checked: isInternal, onCheckedChange: setIsInternal })] }), (0, jsx_runtime_1.jsx)("div", { className: "pt-3 border-t border-ui-border-base", children: (0, jsx_runtime_1.jsxs)(ui_1.Button, { type: "button", variant: "danger", size: "small", onClick: handleDelete, isLoading: isDeleting, className: "w-full flex items-center justify-center gap-1.5", children: [(0, jsx_runtime_1.jsx)(icons_1.Trash, { className: "w-3.5 h-3.5" }), (0, jsx_runtime_1.jsx)("span", { children: "Delete Category" })] }) })] })), activeTab === "products" && ((0, jsx_runtime_1.jsx)("div", { className: "flex flex-col gap-3", children: (0, jsx_runtime_1.jsx)(category_products_manager_1.CategoryProductsManager, { categoryId: category.id, categoryName: category.name, initialMetadata: currentMetadata, onMetadataUpdate: (meta) => {
                                        setCurrentMetadata(meta);
                                    } }) })), activeTab === "channels" && ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-2", children: [(0, jsx_runtime_1.jsx)(ui_1.Label, { className: "text-xs font-semibold", children: "Storefront Visibility" }), (0, jsx_runtime_1.jsx)(ui_1.Text, { size: "xsmall", className: "text-ui-fg-muted", children: "Designate which storefront sales channels display this category." }), (0, jsx_runtime_1.jsx)("div", { className: "flex flex-col gap-2 mt-1", children: salesChannels.map((channel) => {
                                                    const isChecked = selectedChannels.includes(channel.id);
                                                    return ((0, jsx_runtime_1.jsxs)("label", { className: "flex items-center gap-2.5 text-xs text-ui-fg-base cursor-pointer select-none p-2 rounded-lg border border-ui-border-base bg-ui-bg-subtle/40 hover:bg-ui-bg-subtle", children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: isChecked, onChange: () => toggleChannel(channel.id), className: "rounded border-ui-border-base text-blue-600 focus:ring-blue-500 cursor-pointer" }), (0, jsx_runtime_1.jsx)("span", { className: "font-medium", children: channel.name })] }, channel.id));
                                                }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-1.5 pt-3 border-t border-ui-border-base", children: [(0, jsx_runtime_1.jsx)(ui_1.Label, { htmlFor: "edit-image", className: "text-xs font-semibold", children: "Category Thumbnail / Image URL" }), (0, jsx_runtime_1.jsx)(ui_1.Input, { id: "edit-image", size: "small", value: imageUrl, onChange: (e) => setImageUrl(e.target.value), placeholder: "https://example.com/category-image.jpg" }), imageUrl && ((0, jsx_runtime_1.jsx)("div", { className: "mt-2 w-24 h-24 rounded-xl overflow-hidden border border-ui-border-base bg-ui-bg-subtle shadow-xs", children: (0, jsx_runtime_1.jsx)("img", { src: imageUrl, alt: "Category Preview", className: "w-full h-full object-cover", onError: (e) => {
                                                        ;
                                                        e.target.style.display = "none";
                                                    } }) }))] })] })), activeTab === "youtube" && ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h4", { className: "text-xs font-semibold text-ui-fg-base", children: "Category Demonstration Videos (YouTube)" }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-ui-fg-muted mt-0.5", children: "Attach YouTube video demonstration links to show interactive video carousels on the storefront category page." })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(ui_1.Input, { size: "small", placeholder: "Paste YouTube watch URL, shorts, or video ID\u2026", value: newYoutubeInput, onChange: (e) => setNewYoutubeInput(e.target.value), className: "flex-1 text-xs", onKeyDown: (e) => {
                                                    if (e.key === "Enter") {
                                                        e.preventDefault();
                                                        handleAddYoutube();
                                                    }
                                                } }), (0, jsx_runtime_1.jsxs)(ui_1.Button, { size: "small", type: "button", variant: "secondary", onClick: handleAddYoutube, className: "flex items-center gap-1 text-xs flex-shrink-0", children: [(0, jsx_runtime_1.jsx)(icons_1.Plus, { className: "w-3.5 h-3.5" }), (0, jsx_runtime_1.jsx)("span", { children: "Add Video" })] })] }), youtubeUrls.length === 0 ? ((0, jsx_runtime_1.jsx)("div", { className: "p-8 text-center text-xs text-ui-fg-muted border border-dashed border-ui-border-base rounded-xl", children: "No demonstration videos attached yet." })) : ((0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-2 gap-3", children: youtubeUrls.map((url) => {
                                            const id = extractYouTubeVideoId(url);
                                            const thumb = id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
                                            return ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col border border-ui-border-base rounded-xl overflow-hidden bg-ui-bg-subtle/40 shadow-xs", children: [(0, jsx_runtime_1.jsxs)("div", { className: "relative aspect-video bg-black/80 overflow-hidden flex items-center justify-center", children: [thumb ? ((0, jsx_runtime_1.jsx)("img", { src: thumb, alt: "YouTube Preview", className: "w-full h-full object-cover" })) : ((0, jsx_runtime_1.jsx)("span", { className: "text-xs text-white", children: "Video" })), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => handleRemoveYoutube(url), className: "absolute top-1.5 right-1.5 p-1 bg-black/70 hover:bg-rose-600 text-white rounded-full transition-colors", title: "Remove video", children: (0, jsx_runtime_1.jsx)(icons_1.Trash, { className: "w-3 h-3" }) })] }), (0, jsx_runtime_1.jsx)("div", { className: "p-2", children: (0, jsx_runtime_1.jsx)("span", { className: "text-[10px] text-ui-fg-muted truncate block font-mono", title: url, children: url }) })] }, url));
                                        }) }))] }))] }), (0, jsx_runtime_1.jsxs)(ui_1.Drawer.Footer, { className: "flex justify-end gap-2 px-6 py-4 border-t border-ui-border-base", children: [(0, jsx_runtime_1.jsx)(ui_1.Button, { type: "button", variant: "secondary", size: "small", onClick: () => onOpenChange(false), disabled: isSubmitting || isDeleting, children: "Close" }), (0, jsx_runtime_1.jsx)(ui_1.Button, { type: "submit", size: "small", isLoading: isSubmitting, disabled: isSubmitting || !name.trim() || isDeleting, children: "Save Category" })] })] }) }) }));
};
exports.EditCategoryDrawer = EditCategoryDrawer;
