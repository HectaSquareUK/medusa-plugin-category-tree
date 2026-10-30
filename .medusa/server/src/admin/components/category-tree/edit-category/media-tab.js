"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaTab = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const ui_1 = require("@medusajs/ui");
const icons_1 = require("@medusajs/icons");
const MediaTab = ({ salesChannels, selectedChannels, toggleChannel, categoryImages, imageUrl, isUploading, handleFileUpload, handleSetThumbnail, handleSetBanner, handleDeleteImage, manualImageUrl, setManualImageUrl, handleAddManualImage, }) => {
    const fileInputRef = (0, react_1.useRef)(null);
    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-2", children: [(0, jsx_runtime_1.jsx)(ui_1.Label, { className: "text-xs font-semibold", children: "Storefront Visibility" }), (0, jsx_runtime_1.jsx)(ui_1.Text, { size: "xsmall", className: "text-ui-fg-muted", children: "Designate which storefront sales channels display this category." }), (0, jsx_runtime_1.jsx)("div", { className: "flex flex-col gap-2 mt-1", children: salesChannels.map((channel) => {
                            const isChecked = selectedChannels.includes(channel.id);
                            return ((0, jsx_runtime_1.jsxs)("label", { className: "flex items-center gap-2.5 text-xs text-ui-fg-base cursor-pointer select-none p-2 rounded-lg border border-ui-border-base bg-ui-bg-subtle/40 hover:bg-ui-bg-subtle", children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: isChecked, onChange: () => toggleChannel(channel.id), className: "rounded border-ui-border-base text-blue-600 focus:ring-blue-500 cursor-pointer" }), (0, jsx_runtime_1.jsx)("span", { className: "font-medium", children: channel.name })] }, channel.id));
                        }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-3 pt-3 border-t border-ui-border-base", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)(ui_1.Label, { className: "text-xs font-semibold", children: "Category Media" }), (0, jsx_runtime_1.jsx)(ui_1.Text, { size: "xsmall", className: "text-ui-fg-muted", children: "Upload category thumbnails and banners. Automatically handled by your configured storage provider." })] }), (0, jsx_runtime_1.jsxs)("button", { type: "button", onClick: () => fileInputRef.current?.click(), disabled: isUploading, className: "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-ui-bg-base hover:bg-ui-bg-subtle text-ui-fg-base border border-ui-border-base rounded-lg shadow-2xs transition-colors cursor-pointer", children: [(0, jsx_runtime_1.jsx)(icons_1.ArrowDownTray, { className: "w-3.5 h-3.5" }), (0, jsx_runtime_1.jsx)("span", { children: isUploading ? "Uploading…" : "Upload Media" })] })] }), (0, jsx_runtime_1.jsx)("input", { ref: fileInputRef, type: "file", multiple: true, accept: "image/jpeg,image/png,image/gif,image/webp,image/svg+xml", onChange: (e) => handleFileUpload(e.target.files), className: "hidden" }), (0, jsx_runtime_1.jsxs)("div", { onDragOver: (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }, onDrop: (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!isUploading)
                                handleFileUpload(e.dataTransfer.files);
                        }, onClick: () => fileInputRef.current?.click(), className: "border-2 border-dashed border-ui-border-strong hover:border-ui-border-interactive rounded-xl p-6 flex flex-col items-center justify-center gap-2 bg-ui-bg-subtle/30 hover:bg-ui-bg-subtle/60 transition-colors cursor-pointer text-center", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-10 h-10 rounded-full bg-ui-bg-base border border-ui-border-base flex items-center justify-center text-ui-fg-subtle shadow-2xs", children: (0, jsx_runtime_1.jsx)(icons_1.ArrowDownTray, { className: "w-5 h-5" }) }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-0.5", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-xs font-semibold text-ui-fg-base", children: isUploading ? "Uploading to storage…" : "Click to upload or drag & drop images" }), (0, jsx_runtime_1.jsx)("span", { className: "text-[11px] text-ui-fg-muted", children: "PNG, JPG, WEBP, GIF, SVG up to 10MB" })] })] }), categoryImages.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-2 mt-2", children: [(0, jsx_runtime_1.jsxs)(ui_1.Label, { className: "text-xs font-medium text-ui-fg-muted", children: ["Uploaded Images (", categoryImages.length, ")"] }), (0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3", children: categoryImages.map((img, idx) => {
                                    const isThumbnail = img.type === "thumbnail" || img.url === imageUrl;
                                    const isBanner = img.type === "banner" ||
                                        (!isThumbnail &&
                                            categoryImages.length > 1 &&
                                            categoryImages.find((i) => i.type === "banner")?.url === img.url);
                                    return ((0, jsx_runtime_1.jsxs)("div", { className: `group relative aspect-square rounded-xl overflow-hidden border bg-ui-bg-base transition-all shadow-xs ${isThumbnail
                                            ? "ring-2 ring-blue-500 border-transparent"
                                            : isBanner
                                                ? "ring-2 ring-emerald-500 border-transparent"
                                                : "border-ui-border-base hover:border-ui-border-strong"}`, children: [(0, jsx_runtime_1.jsx)("img", { src: img.url, alt: "Category Media", className: "w-full h-full object-contain p-1.5" }), isThumbnail && ((0, jsx_runtime_1.jsx)("div", { className: "absolute top-1.5 left-1.5 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs", children: "\u2605 Thumbnail" })), !isThumbnail && isBanner && ((0, jsx_runtime_1.jsx)("div", { className: "absolute top-1.5 left-1.5 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs", children: "\uD83D\uDDBC\uFE0F Hero Banner" })), (0, jsx_runtime_1.jsxs)("div", { className: "absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1.5", children: [!isThumbnail && ((0, jsx_runtime_1.jsx)("button", { type: "button", onClick: (e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            handleSetThumbnail(img);
                                                        }, className: "w-full py-0.5 bg-white text-neutral-900 rounded text-[9px] font-semibold hover:bg-neutral-100 transition-colors shadow-xs text-center cursor-pointer", children: "Set Thumbnail" })), !isBanner && ((0, jsx_runtime_1.jsx)("button", { type: "button", onClick: (e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            handleSetBanner(img);
                                                        }, className: "w-full py-0.5 bg-emerald-600 text-white rounded text-[9px] font-semibold hover:bg-emerald-700 transition-colors shadow-xs text-center cursor-pointer", children: "Set as Banner" })), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: (e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            handleDeleteImage(img);
                                                        }, className: "w-full py-0.5 bg-rose-600 text-white rounded text-[9px] font-semibold hover:bg-rose-700 transition-colors shadow-xs text-center cursor-pointer", children: "Delete" })] })] }, img.id || img.url || idx));
                                }) })] })), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-1.5 mt-2 p-3 rounded-xl border border-ui-border-base bg-ui-bg-subtle/30", children: [(0, jsx_runtime_1.jsx)(ui_1.Label, { className: "text-xs font-semibold text-ui-fg-base", children: "External Image URL (CDN / Manual)" }), (0, jsx_runtime_1.jsx)("p", { className: "text-[11px] text-ui-fg-muted", children: "Or paste a direct image URL (S3, Cloudinary, Imgur, Supabase) to link without uploading." }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 mt-1 w-full", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex-1 min-w-[360px] sm:min-w-[500px]", children: (0, jsx_runtime_1.jsx)(ui_1.Input, { size: "small", type: "url", placeholder: "https://example.com/category-image.jpg", value: manualImageUrl, onChange: (e) => setManualImageUrl(e.target.value), className: "text-xs w-full", onKeyDown: (e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    handleAddManualImage();
                                                }
                                            } }) }), (0, jsx_runtime_1.jsxs)(ui_1.Button, { type: "button", size: "small", variant: "secondary", onClick: handleAddManualImage, disabled: !manualImageUrl.trim(), className: "text-xs shrink-0", children: [(0, jsx_runtime_1.jsx)(icons_1.Plus, { className: "w-3.5 h-3.5 mr-1" }), "Add to Gallery"] })] })] })] })] }));
};
exports.MediaTab = MediaTab;
