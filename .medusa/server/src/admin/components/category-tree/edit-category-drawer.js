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
        /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/i,
        /(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/i,
        /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/i,
        /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/i,
    ];
    for (const pattern of patterns) {
        const match = trimmed.match(pattern);
        if (match && match[1])
            return match[1];
    }
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed) && !/^[A-Za-z]{11}$/.test(trimmed))
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
    // Media upload & gallery state
    const fileInputRef = (0, react_1.useRef)(null);
    const [isUploading, setIsUploading] = (0, react_1.useState)(false);
    const [categoryImages, setCategoryImages] = (0, react_1.useState)([]);
    const [manualImageUrl, setManualImageUrl] = (0, react_1.useState)("");
    // Unsaved changes & inline notification state
    const [isDirty, setIsDirty] = (0, react_1.useState)(false);
    const [showDiscardConfirm, setShowDiscardConfirm] = (0, react_1.useState)(false);
    const [saveNotification, setSaveNotification] = (0, react_1.useState)(null);
    const saveTimerRef = (0, react_1.useRef)(null);
    const triggerSaveNotification = (0, react_1.useCallback)((type, message) => {
        if (saveTimerRef.current)
            clearTimeout(saveTimerRef.current);
        setSaveNotification({ type, message });
        saveTimerRef.current = setTimeout(() => {
            setSaveNotification(null);
        }, 4000);
    }, []);
    const prevCategoryIdRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
        if (!open) {
            prevCategoryIdRef.current = null;
            setIsDirty(false);
            setShowDiscardConfirm(false);
            setSaveNotification(null);
        }
    }, [open]);
    (0, react_1.useEffect)(() => {
        if (category) {
            const isNewCategory = prevCategoryIdRef.current !== category.id;
            if (isNewCategory) {
                prevCategoryIdRef.current = category.id;
                setActiveTab("general");
                setIsDirty(false);
                setShowDiscardConfirm(false);
                setSaveNotification(null);
                const initName = category.name || "";
                const initHandle = category.handle || "";
                const initDescription = category.description || category.metadata?.description || "";
                const initRank = category.rank ?? 0;
                const initActive = Boolean(category.is_active);
                const initInternal = Boolean(category.is_internal);
                const initChannels = category.sales_channels || salesChannels.map((s) => s.id);
                const initMetadata = category.metadata || {};
                setName(initName);
                setHandle(initHandle);
                setDescription(initDescription);
                setImageUrl(category.image_url || "");
                setRank(initRank);
                setIsActive(initActive);
                setIsInternal(initInternal);
                setSelectedChannels(initChannels);
                setCurrentMetadata(initMetadata);
                // Parse YouTube URLs from metadata (including legacy fields)
                const meta = category.metadata;
                const urls = [];
                if (meta?.youtube_urls && Array.isArray(meta.youtube_urls)) {
                    meta.youtube_urls.forEach((u) => typeof u === "string" && u.trim() && urls.push(u.trim()));
                }
                else if (meta?.youtube_url && typeof meta.youtube_url === "string" && meta.youtube_url.trim()) {
                    urls.push(meta.youtube_url.trim());
                }
                else if (meta?.youtube_link && typeof meta.youtube_link === "string" && meta.youtube_link.trim()) {
                    urls.push(meta.youtube_link.trim());
                }
                else if (meta?.video_url && typeof meta.video_url === "string" && meta.video_url.trim()) {
                    urls.push(meta.video_url.trim());
                }
                setYoutubeUrls(urls);
                // Load category media from backend
                loadCategoryImages(category.id, category.image_url || meta?.thumbnail || meta?.image, meta || undefined);
            }
            else {
                // Drawer is already open for this exact category:
                // Do NOT switch activeTab back to general. Keep user's active tab.
                if (category.metadata) {
                    setCurrentMetadata((prev) => ({ ...prev, ...category.metadata }));
                }
            }
        }
    }, [category, salesChannels]);
    // Load existing category media gallery
    const loadCategoryImages = (0, react_1.useCallback)(async (catId, currentImageUrl, metadata) => {
        try {
            const res = await sdk_1.sdk.client.fetch(`/admin/categories/${catId}/images`);
            if (res?.category_images && Array.isArray(res.category_images) && res.category_images.length > 0) {
                const bannerUrl = metadata?.banner;
                const mapped = res.category_images.map((img) => ({
                    ...img,
                    type: img.type === "thumbnail" ? "thumbnail" : img.url === bannerUrl ? "banner" : "image",
                }));
                setCategoryImages(mapped);
                const thumb = mapped.find((img) => img.type === "thumbnail") || mapped[0];
                if (thumb?.url)
                    setImageUrl(thumb.url);
                return;
            }
        }
        catch {
            // Endpoint fallback
        }
        // Explicit metadata.images check: if metadata.images array exists (even if empty)
        if (metadata && Array.isArray(metadata.images)) {
            if (metadata.images.length === 0) {
                setCategoryImages([]);
                setImageUrl("");
                return;
            }
            setCategoryImages(metadata.images);
            const thumb = metadata.images.find((img) => img.type === "thumbnail") || metadata.images[0];
            if (thumb?.url)
                setImageUrl(thumb.url);
            return;
        }
        // Legacy fallback
        const list = [];
        const thumb = metadata?.thumbnail || metadata?.image_url || currentImageUrl;
        if (thumb) {
            list.push({ url: thumb, type: "thumbnail" });
        }
        const banner = metadata?.banner || (metadata?.image && metadata.image !== thumb ? metadata.image : null);
        if (banner && banner !== thumb) {
            list.push({ url: banner, type: "banner" });
        }
        setCategoryImages(list);
    }, []);
    // Universal S3/Storage Media Upload Handler (works with AWS S3, MinIO, Cloudflare R2, Local)
    const handleFileUpload = async (files) => {
        if (!files || files.length === 0)
            return;
        setIsUploading(true);
        try {
            const fileList = Array.from(files);
            // Calls standard Medusa File Module API (delegates to configured S3 provider in medusa-config.js)
            const res = await sdk_1.sdk.admin.upload.create({ files: fileList });
            const uploadedFiles = res.files || [];
            if (uploadedFiles.length === 0) {
                throw new Error("No files returned from upload service");
            }
            const firstUrl = uploadedFiles[0].url;
            if (!imageUrl) {
                setImageUrl(firstUrl);
            }
            // Prepare payload with required file_id for backend schema
            const payload = uploadedFiles.map((f, i) => ({
                url: f.url,
                file_id: f.id || f.file_id || f.key || `file_${Date.now()}_${i}`,
                type: (categoryImages.length === 0 && i === 0 ? "thumbnail" : "image"),
            }));
            // If backend has custom category images endpoint, save them there too
            try {
                await sdk_1.sdk.client.fetch(`/admin/categories/${category.id}/images`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: { images: payload },
                });
                await loadCategoryImages(category.id, firstUrl, currentMetadata);
            }
            catch {
                // Fallback for standard stores: update local gallery state
                setCategoryImages((prev) => [
                    ...prev,
                    ...payload.map((p, i) => ({
                        ...p,
                        type: prev.length === 0 && i === 0 ? "thumbnail" : prev.length === 1 && i === 0 ? "banner" : "image",
                    })),
                ]);
            }
            ui_1.toast.success(`${uploadedFiles.length} image(s) uploaded successfully`);
            triggerSaveNotification("success", `${uploadedFiles.length} image(s) uploaded!`);
        }
        catch (err) {
            ui_1.toast.error(err?.message || "Failed to upload image");
            triggerSaveNotification("error", err?.message || "Failed to upload image");
        }
        finally {
            setIsUploading(false);
            if (fileInputRef.current)
                fileInputRef.current.value = "";
        }
    };
    // Set selected image as Category Thumbnail
    const handleSetThumbnail = async (img) => {
        setImageUrl(img.url);
        setIsDirty(true);
        setShowDiscardConfirm(false);
        if (img.id) {
            try {
                const currentThumb = categoryImages.find((i) => i.type === "thumbnail");
                const updates = [];
                if (currentThumb?.id && currentThumb.id !== img.id) {
                    updates.push({ id: currentThumb.id, type: "image" });
                }
                updates.push({ id: img.id, type: "thumbnail" });
                await sdk_1.sdk.client.fetch(`/admin/categories/${category.id}/images/batch`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: { updates },
                });
                await loadCategoryImages(category.id, img.url, currentMetadata);
            }
            catch {
                setCategoryImages((prev) => prev.map((item) => ({
                    ...item,
                    type: item.url === img.url ? "thumbnail" : item.type === "thumbnail" ? "image" : item.type,
                })));
            }
        }
        else {
            setCategoryImages((prev) => prev.map((item) => ({
                ...item,
                type: item.url === img.url ? "thumbnail" : item.type === "thumbnail" ? "image" : item.type,
            })));
        }
        ui_1.toast.success("Designated as category thumbnail (Nav & Cards)");
        triggerSaveNotification("success", "Designated as category thumbnail (click Save Category)");
    };
    // Set selected image as Hero Banner
    const handleSetBanner = (img) => {
        setIsDirty(true);
        setShowDiscardConfirm(false);
        setCategoryImages((prev) => prev.map((item) => {
            if (item.url === img.url)
                return { ...item, type: "banner" };
            if (item.type === "banner")
                return { ...item, type: "image" };
            return item;
        }));
        ui_1.toast.success("Designated as category hero banner");
        triggerSaveNotification("success", "Designated as hero banner (click Save Category)");
    };
    // Add external URL image to gallery
    const handleAddManualImage = () => {
        const raw = manualImageUrl.trim();
        if (!raw)
            return;
        if (categoryImages.some((i) => i.url === raw)) {
            ui_1.toast.error("Image already in gallery");
            return;
        }
        const isFirst = categoryImages.length === 0;
        const isSecond = categoryImages.length === 1;
        const newType = isFirst ? "thumbnail" : isSecond ? "banner" : "image";
        setCategoryImages((prev) => [...prev, { url: raw, type: newType }]);
        if (isFirst)
            setImageUrl(raw);
        setManualImageUrl("");
        setIsDirty(true);
        setShowDiscardConfirm(false);
        const msg = `Added to gallery as ${newType === "thumbnail" ? "Thumbnail" : newType === "banner" ? "Hero Banner" : "Image"} (click Save Category to persist)`;
        ui_1.toast.success(msg);
        triggerSaveNotification("success", msg);
    };
    // Delete category image with immediate persistence & explicit nulls
    const handleDeleteImage = async (img) => {
        const remaining = categoryImages.filter((i) => i.url !== img.url && (img.id ? i.id !== img.id : true));
        const nextThumb = remaining.find((i) => i.type === "thumbnail") || remaining[0] || null;
        const nextBanner = remaining.find((i) => i.type === "banner") ||
            (remaining.length > 1 ? remaining.find((i) => i.url !== nextThumb?.url) : null) ||
            null;
        // Update local state immediately
        setCategoryImages(remaining);
        setImageUrl(nextThumb ? nextThumb.url : "");
        const updatedMeta = {
            ...(currentMetadata || {}),
            images: remaining,
            thumbnail: nextThumb ? nextThumb.url : null,
            image_url: nextThumb ? nextThumb.url : null,
            banner: nextBanner ? nextBanner.url : null,
            image: (nextBanner?.url || nextThumb?.url) || null,
        };
        setCurrentMetadata(updatedMeta);
        // Call backend endpoint if DB relation exists
        if (img.id) {
            try {
                await sdk_1.sdk.client.fetch(`/admin/categories/${category.id}/images/batch`, {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: {
                        ids: [img.id],
                    },
                });
            }
            catch (err) {
                console.warn("Could not delete from backend images endpoint:", err);
            }
        }
        // Immediately persist metadata changes to Medusa
        try {
            await sdk_1.sdk.admin.productCategory.update(category.id, {
                metadata: updatedMeta,
            });
            const updatedCat = {
                ...category,
                image_url: nextThumb ? nextThumb.url : "",
                metadata: updatedMeta,
            };
            onSuccess(updatedCat);
            ui_1.toast.success("Image removed and changes saved");
            triggerSaveNotification("success", "Image removed and changes saved");
        }
        catch (err) {
            console.warn("Could not immediately update category metadata on delete:", err);
            ui_1.toast.info("Image removed from gallery (remember to save)");
            triggerSaveNotification("error", "Image removed locally (click Save Category)");
        }
    };
    if (!category)
        return null;
    const toggleChannel = (channelId) => {
        setIsDirty(true);
        setShowDiscardConfirm(false);
        setSelectedChannels((prev) => prev.includes(channelId)
            ? prev.filter((id) => id !== channelId)
            : [...prev, channelId]);
    };
    const handleAddYoutube = async () => {
        const raw = newYoutubeInput.trim();
        if (!raw)
            return;
        const id = extractYouTubeVideoId(raw);
        if (!id) {
            ui_1.toast.error("Please enter a valid YouTube URL or video ID");
            triggerSaveNotification("error", "Please enter a valid YouTube URL or video ID");
            return;
        }
        const cleanUrl = `https://www.youtube.com/watch?v=${id}`;
        if (youtubeUrls.includes(cleanUrl)) {
            ui_1.toast.error("Video already added");
            triggerSaveNotification("error", "Video already added");
            return;
        }
        const nextUrls = [...youtubeUrls, cleanUrl];
        setYoutubeUrls(nextUrls);
        setNewYoutubeInput("");
        const updatedMeta = {
            ...(currentMetadata || {}),
            youtube_urls: nextUrls,
            youtube_url: nextUrls[0] || null,
            youtube_link: nextUrls[0] || null,
            video_url: nextUrls[0] || null,
        };
        setCurrentMetadata(updatedMeta);
        try {
            await sdk_1.sdk.admin.productCategory.update(category.id, {
                metadata: updatedMeta,
            });
            onSuccess({
                ...category,
                metadata: updatedMeta,
            });
            ui_1.toast.success("YouTube video added and saved");
            triggerSaveNotification("success", "YouTube video added and saved!");
        }
        catch {
            ui_1.toast.success("YouTube video added");
            triggerSaveNotification("success", "YouTube video added!");
        }
    };
    const handleRemoveYoutube = async (urlToRemove) => {
        const nextUrls = youtubeUrls.filter((u) => u !== urlToRemove);
        setYoutubeUrls(nextUrls);
        const updatedMeta = {
            ...(currentMetadata || {}),
            youtube_urls: nextUrls,
            youtube_url: nextUrls[0] || null,
            youtube_link: nextUrls[0] || null,
            video_url: nextUrls[0] || null,
        };
        setCurrentMetadata(updatedMeta);
        try {
            await sdk_1.sdk.admin.productCategory.update(category.id, {
                metadata: updatedMeta,
            });
            onSuccess({
                ...category,
                metadata: updatedMeta,
            });
            ui_1.toast.success("Video removed and changes saved");
            triggerSaveNotification("success", "Video removed and changes saved!");
        }
        catch {
            ui_1.toast.info("Video removed (remember to save)");
            triggerSaveNotification("error", "Video removed locally (click Save Category)");
        }
    };
    const handleSubmit = async (eOrClose, closeAfter = false) => {
        let shouldClose = closeAfter;
        if (typeof eOrClose === "boolean") {
            shouldClose = eOrClose;
        }
        else if (eOrClose && eOrClose.preventDefault) {
            eOrClose.preventDefault();
        }
        if (!name.trim()) {
            ui_1.toast.error("Category name is required");
            triggerSaveNotification("error", "Category name is required");
            return;
        }
        setIsSubmitting(true);
        try {
            const thumbImg = categoryImages.find((img) => img.type === "thumbnail") ||
                categoryImages[0] ||
                null;
            const bannerImg = categoryImages.find((img) => img.type === "banner") ||
                (categoryImages.length > 1 ? categoryImages.find((img) => img.url !== thumbImg?.url) : null) ||
                null;
            const descValue = description.trim();
            const updatedMetadata = {
                ...(currentMetadata || {}),
                description: descValue || null,
                sales_channels: selectedChannels,
                youtube_urls: youtubeUrls,
                youtube_url: youtubeUrls[0] || null,
                youtube_link: youtubeUrls[0] || null,
                video_url: youtubeUrls[0] || null,
                images: categoryImages,
                thumbnail: thumbImg ? thumbImg.url : null,
                image_url: thumbImg ? thumbImg.url : null,
                banner: bannerImg ? bannerImg.url : null,
                image: (bannerImg?.url || thumbImg?.url) || null,
            };
            // IMPORTANT: Medusa v2 UpdateProductCategory Zod schema defines description: z.string().optional() (NOT nullable).
            // Sending empty string "" instead of null prevents 400 Bad Request errors when description is blank.
            await sdk_1.sdk.admin.productCategory.update(category.id, {
                name: name.trim(),
                handle: handle.trim() || undefined,
                description: descValue,
                rank: Number(rank) || 0,
                is_active: isActive,
                is_internal: isInternal,
                metadata: updatedMetadata,
            });
            const updated = {
                ...category,
                name: name.trim(),
                handle: handle.trim(),
                description: descValue ? descValue : null,
                image_url: thumbImg ? thumbImg.url : "",
                rank: Number(rank) || 0,
                sales_channels: selectedChannels,
                is_active: isActive,
                is_internal: isInternal,
                metadata: updatedMetadata,
            };
            setIsDirty(false);
            setShowDiscardConfirm(false);
            ui_1.toast.success("Category changes saved successfully");
            triggerSaveNotification("success", "Changes saved successfully!");
            onSuccess(updated);
            if (shouldClose) {
                onOpenChange(false);
            }
        }
        catch (err) {
            const errMsg = err?.message || "Failed to update category";
            ui_1.toast.error(errMsg);
            triggerSaveNotification("error", errMsg);
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
            triggerSaveNotification("error", err?.message || "Failed to delete category");
        }
        finally {
            setIsDeleting(false);
        }
    };
    const handleClose = (0, react_1.useCallback)(() => {
        if (isDirty && !showDiscardConfirm) {
            setShowDiscardConfirm(true);
            return;
        }
        setIsDirty(false);
        setShowDiscardConfirm(false);
        onOpenChange(false);
    }, [isDirty, showDiscardConfirm, onOpenChange]);
    const handleDrawerOpenChange = (0, react_1.useCallback)((newOpen) => {
        if (!newOpen) {
            handleClose();
        }
        else {
            onOpenChange(true);
        }
    }, [handleClose, onOpenChange]);
    return ((0, jsx_runtime_1.jsx)(ui_1.Drawer, { open: open, onOpenChange: handleDrawerOpenChange, children: (0, jsx_runtime_1.jsx)(ui_1.Drawer.Content, { className: `transition-all duration-300 w-full z-50 ${isFullScreen
                ? "!max-w-full !w-screen !h-screen !inset-0 !rounded-none"
                : "max-w-5xl xl:max-w-6xl w-[92vw]"}`, children: (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col h-full", children: [(0, jsx_runtime_1.jsxs)(ui_1.Drawer.Header, { className: "border-b border-ui-border-base pb-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between w-full", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)(ui_1.Drawer.Title, { className: "text-base font-semibold text-ui-fg-base", children: category.name }), (0, jsx_runtime_1.jsxs)(ui_1.Drawer.Description, { className: "text-xs text-ui-fg-muted mt-0.5", children: ["Tier ", category.tier, " \u2022 ID: ", category.id] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsxs)("button", { type: "button", onClick: () => setIsFullScreen((prev) => !prev), className: "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-ui-fg-subtle hover:text-ui-fg-base rounded-lg border border-ui-border-base bg-ui-bg-subtle hover:bg-ui-bg-base shadow-2xs transition-colors cursor-pointer", title: isFullScreen ? "Exit Fullscreen" : "Expand to Full Page Modal", children: [(0, jsx_runtime_1.jsx)(icons_1.ArrowsPointingOut, { className: "w-3.5 h-3.5" }), (0, jsx_runtime_1.jsx)("span", { children: isFullScreen ? "Exit Fullscreen" : "Full Page" })] }), (0, jsx_runtime_1.jsxs)("button", { type: "button", onClick: () => window.open(`/app/categories/${category.id}`, "_blank"), className: "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-ui-fg-subtle hover:text-ui-fg-base rounded-lg border border-ui-border-base bg-ui-bg-subtle hover:bg-ui-bg-base shadow-2xs transition-colors cursor-pointer", title: "Open full category details page in a new tab", children: [(0, jsx_runtime_1.jsx)("span", { children: "Open Full Page" }), (0, jsx_runtime_1.jsx)(icons_1.ArrowUpRightMicro, { className: "w-3.5 h-3.5" })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-1 mt-3 border-b border-ui-border-base -mb-3", children: [(0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setActiveTab("general"), className: `px-3 py-1.5 text-xs font-medium border-b-2 transition-colors cursor-pointer ${activeTab === "general"
                                            ? "border-blue-600 text-blue-600 font-semibold"
                                            : "border-transparent text-ui-fg-muted hover:text-ui-fg-base"}`, children: "General & Ranking" }), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setActiveTab("products"), className: `px-3 py-1.5 text-xs font-medium border-b-2 transition-colors cursor-pointer ${activeTab === "products"
                                            ? "border-blue-600 text-blue-600 font-semibold"
                                            : "border-transparent text-ui-fg-muted hover:text-ui-fg-base"}`, children: "Products Management" }), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setActiveTab("channels"), className: `px-3 py-1.5 text-xs font-medium border-b-2 transition-colors cursor-pointer ${activeTab === "channels"
                                            ? "border-blue-600 text-blue-600 font-semibold"
                                            : "border-transparent text-ui-fg-muted hover:text-ui-fg-base"}`, children: "Storefronts & Media" }), (0, jsx_runtime_1.jsxs)("button", { type: "button", onClick: () => setActiveTab("youtube"), className: `flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border-b-2 transition-colors cursor-pointer ${activeTab === "youtube"
                                            ? "border-blue-600 text-blue-600 font-semibold"
                                            : "border-transparent text-ui-fg-muted hover:text-ui-fg-base"}`, children: [(0, jsx_runtime_1.jsx)("span", { children: "YouTube Videos" }), youtubeUrls.length > 0 && ((0, jsx_runtime_1.jsx)("span", { className: "px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", children: youtubeUrls.length }))] })] })] }), (0, jsx_runtime_1.jsxs)(ui_1.Drawer.Body, { className: "overflow-y-auto flex-1 p-6", children: [activeTab === "general" && ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-1.5", children: [(0, jsx_runtime_1.jsx)(ui_1.Label, { htmlFor: "edit-name", className: "text-xs font-semibold", children: "Category Name *" }), (0, jsx_runtime_1.jsx)(ui_1.Input, { id: "edit-name", value: name, onChange: (e) => {
                                                    setName(e.target.value);
                                                    setIsDirty(true);
                                                    setShowDiscardConfirm(false);
                                                }, required: true })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-1.5", children: [(0, jsx_runtime_1.jsx)(ui_1.Label, { htmlFor: "edit-handle", className: "text-xs font-semibold", children: "Handle (URL Slug)" }), (0, jsx_runtime_1.jsx)(ui_1.Input, { id: "edit-handle", value: handle, onChange: (e) => {
                                                    setHandle(e.target.value);
                                                    setIsDirty(true);
                                                    setShowDiscardConfirm(false);
                                                }, placeholder: "e.g. rayon-embroidery-thread" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-1.5 p-3 rounded-xl border border-ui-border-base bg-ui-bg-subtle/50", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsx)(ui_1.Label, { htmlFor: "edit-rank", className: "text-xs font-semibold", children: "Storefront Ranking (Sort Order)" }), (0, jsx_runtime_1.jsx)("span", { className: "text-[10px] font-mono text-ui-fg-muted", children: "Controls Storefront 2 & Monfil" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(ui_1.Input, { id: "edit-rank", type: "number", size: "small", value: rank, onChange: (e) => {
                                                            setRank(Number(e.target.value));
                                                            setIsDirty(true);
                                                            setShowDiscardConfirm(false);
                                                        }, className: "w-24" }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-1", children: [(0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => {
                                                                    setRank((r) => Math.max(0, r - 1));
                                                                    setIsDirty(true);
                                                                    setShowDiscardConfirm(false);
                                                                }, className: "px-2 py-1 text-xs font-medium rounded border border-ui-border-base bg-ui-bg-base hover:bg-ui-bg-subtle transition-colors cursor-pointer", title: "Move Earlier in Storefront", children: "\u2191 Earlier" }), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => {
                                                                    setRank((r) => r + 1);
                                                                    setIsDirty(true);
                                                                    setShowDiscardConfirm(false);
                                                                }, className: "px-2 py-1 text-xs font-medium rounded border border-ui-border-base bg-ui-bg-base hover:bg-ui-bg-subtle transition-colors cursor-pointer", title: "Move Later in Storefront", children: "\u2193 Later" }), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => {
                                                                    setRank(0);
                                                                    setIsDirty(true);
                                                                    setShowDiscardConfirm(false);
                                                                }, className: "px-2 py-1 text-xs font-medium rounded border border-ui-border-base bg-ui-bg-base hover:bg-ui-bg-subtle transition-colors cursor-pointer", title: "Set as First Category", children: "Top (#0)" })] })] }), (0, jsx_runtime_1.jsx)("p", { className: "text-[11px] text-ui-fg-muted leading-relaxed", children: "Categories are sorted by rank ASC (0, 1, 2...). Lower numbers appear first on your storefront navigation menu." })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-1.5", children: [(0, jsx_runtime_1.jsx)(ui_1.Label, { htmlFor: "edit-desc", className: "text-xs font-semibold", children: "Description" }), (0, jsx_runtime_1.jsx)(ui_1.Textarea, { id: "edit-desc", value: description, onChange: (e) => {
                                                    setDescription(e.target.value);
                                                    setIsDirty(true);
                                                    setShowDiscardConfirm(false);
                                                }, rows: 3 })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between pt-2 border-t border-ui-border-base", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)(ui_1.Label, { className: "text-xs font-semibold", children: "Active Status" }), (0, jsx_runtime_1.jsx)(ui_1.Text, { size: "xsmall", className: "text-ui-fg-muted", children: "Visible to shoppers on enabled storefronts" })] }), (0, jsx_runtime_1.jsx)(ui_1.Switch, { checked: isActive, onCheckedChange: (val) => {
                                                    setIsActive(val);
                                                    setIsDirty(true);
                                                    setShowDiscardConfirm(false);
                                                } })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)(ui_1.Label, { className: "text-xs font-semibold", children: "Internal Only" }), (0, jsx_runtime_1.jsx)(ui_1.Text, { size: "xsmall", className: "text-ui-fg-muted", children: "Hidden from public storefront navigation" })] }), (0, jsx_runtime_1.jsx)(ui_1.Switch, { checked: isInternal, onCheckedChange: (val) => {
                                                    setIsInternal(val);
                                                    setIsDirty(true);
                                                    setShowDiscardConfirm(false);
                                                } })] }), (0, jsx_runtime_1.jsx)("div", { className: "pt-3 border-t border-ui-border-base", children: (0, jsx_runtime_1.jsxs)(ui_1.Button, { type: "button", variant: "danger", size: "small", onClick: handleDelete, isLoading: isDeleting, className: "w-full flex items-center justify-center gap-1.5", children: [(0, jsx_runtime_1.jsx)(icons_1.Trash, { className: "w-3.5 h-3.5" }), (0, jsx_runtime_1.jsx)("span", { children: "Delete Category" })] }) })] })), activeTab === "products" && ((0, jsx_runtime_1.jsx)("div", { className: "flex flex-col gap-3", children: (0, jsx_runtime_1.jsx)(category_products_manager_1.CategoryProductsManager, { categoryId: category.id, categoryName: category.name, initialMetadata: currentMetadata, onMetadataUpdate: (meta) => {
                                        setCurrentMetadata(meta);
                                    } }) })), activeTab === "channels" && ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-2", children: [(0, jsx_runtime_1.jsx)(ui_1.Label, { className: "text-xs font-semibold", children: "Storefront Visibility" }), (0, jsx_runtime_1.jsx)(ui_1.Text, { size: "xsmall", className: "text-ui-fg-muted", children: "Designate which storefront sales channels display this category." }), (0, jsx_runtime_1.jsx)("div", { className: "flex flex-col gap-2 mt-1", children: salesChannels.map((channel) => {
                                                    const isChecked = selectedChannels.includes(channel.id);
                                                    return ((0, jsx_runtime_1.jsxs)("label", { className: "flex items-center gap-2.5 text-xs text-ui-fg-base cursor-pointer select-none p-2 rounded-lg border border-ui-border-base bg-ui-bg-subtle/40 hover:bg-ui-bg-subtle", children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: isChecked, onChange: () => toggleChannel(channel.id), className: "rounded border-ui-border-base text-blue-600 focus:ring-blue-500 cursor-pointer" }), (0, jsx_runtime_1.jsx)("span", { className: "font-medium", children: channel.name })] }, channel.id));
                                                }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-3 pt-3 border-t border-ui-border-base", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)(ui_1.Label, { className: "text-xs font-semibold", children: "Category Media" }), (0, jsx_runtime_1.jsx)(ui_1.Text, { size: "xsmall", className: "text-ui-fg-muted", children: "Upload category thumbnails and banners. Automatically handled by your configured S3 or storage provider." })] }), (0, jsx_runtime_1.jsxs)("button", { type: "button", onClick: () => fileInputRef.current?.click(), disabled: isUploading, className: "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-ui-bg-base hover:bg-ui-bg-subtle text-ui-fg-base border border-ui-border-base rounded-lg shadow-2xs transition-colors cursor-pointer", children: [(0, jsx_runtime_1.jsx)(icons_1.ArrowDownTray, { className: "w-3.5 h-3.5" }), (0, jsx_runtime_1.jsx)("span", { children: isUploading ? "Uploading…" : "Upload Media" })] })] }), (0, jsx_runtime_1.jsx)("input", { ref: fileInputRef, type: "file", multiple: true, accept: "image/jpeg,image/png,image/gif,image/webp,image/svg+xml", onChange: (e) => handleFileUpload(e.target.files), className: "hidden" }), (0, jsx_runtime_1.jsxs)("div", { onDragOver: (e) => {
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
                                                                    } }) }), (0, jsx_runtime_1.jsxs)(ui_1.Button, { type: "button", size: "small", variant: "secondary", onClick: handleAddManualImage, disabled: !manualImageUrl.trim(), className: "text-xs shrink-0", children: [(0, jsx_runtime_1.jsx)(icons_1.Plus, { className: "w-3.5 h-3.5 mr-1" }), "Add to Gallery"] })] })] })] })] })), activeTab === "youtube" && ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h4", { className: "text-xs font-semibold text-ui-fg-base", children: "Category Demonstration Videos (YouTube)" }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-ui-fg-muted mt-0.5", children: "Attach YouTube video demonstration links to show interactive video carousels on the storefront category page." })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 w-full", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex-1 min-w-[360px] sm:min-w-[500px]", children: (0, jsx_runtime_1.jsx)(ui_1.Input, { size: "small", placeholder: "Paste YouTube watch URL, shorts, or video ID\u2026", value: newYoutubeInput, onChange: (e) => setNewYoutubeInput(e.target.value), className: "w-full text-xs", onKeyDown: (e) => {
                                                        if (e.key === "Enter") {
                                                            e.preventDefault();
                                                            handleAddYoutube();
                                                        }
                                                    } }) }), (0, jsx_runtime_1.jsxs)(ui_1.Button, { size: "small", type: "button", variant: "secondary", onClick: handleAddYoutube, className: "flex items-center gap-1 text-xs flex-shrink-0", children: [(0, jsx_runtime_1.jsx)(icons_1.Plus, { className: "w-3.5 h-3.5" }), (0, jsx_runtime_1.jsx)("span", { children: "Add Video" })] })] }), youtubeUrls.length === 0 ? ((0, jsx_runtime_1.jsx)("div", { className: "p-8 text-center text-xs text-ui-fg-muted border border-dashed border-ui-border-base rounded-xl", children: "No demonstration videos attached yet." })) : ((0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-2 gap-3", children: youtubeUrls.map((url) => {
                                            const id = extractYouTubeVideoId(url);
                                            const thumb = id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
                                            return ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col border border-ui-border-base rounded-xl overflow-hidden bg-ui-bg-subtle/40 shadow-xs", children: [(0, jsx_runtime_1.jsxs)("div", { className: "relative aspect-video bg-black/80 overflow-hidden flex items-center justify-center", children: [thumb ? ((0, jsx_runtime_1.jsx)("img", { src: thumb, alt: "YouTube Preview", className: "w-full h-full object-cover" })) : ((0, jsx_runtime_1.jsx)("span", { className: "text-xs text-white", children: "Video" })), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => handleRemoveYoutube(url), className: "absolute top-1.5 right-1.5 p-1 bg-black/70 hover:bg-rose-600 text-white rounded-full transition-colors cursor-pointer", title: "Remove video", children: (0, jsx_runtime_1.jsx)(icons_1.Trash, { className: "w-3 h-3" }) })] }), (0, jsx_runtime_1.jsx)("div", { className: "p-2", children: (0, jsx_runtime_1.jsx)("span", { className: "text-[10px] text-ui-fg-muted truncate block font-mono", title: url, children: url }) })] }, url));
                                        }) }))] }))] }), (0, jsx_runtime_1.jsxs)(ui_1.Drawer.Footer, { className: "flex flex-col gap-2 px-6 py-4 border-t border-ui-border-base", children: [showDiscardConfirm && ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between gap-3 w-full px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-xs", children: [(0, jsx_runtime_1.jsx)("span", { className: "font-medium", children: "You have unsaved changes. Discard changes and close?" }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 shrink-0", children: [(0, jsx_runtime_1.jsx)(ui_1.Button, { type: "button", size: "small", variant: "secondary", onClick: () => setShowDiscardConfirm(false), children: "Keep Editing" }), (0, jsx_runtime_1.jsx)(ui_1.Button, { type: "button", size: "small", variant: "danger", onClick: () => {
                                                    setIsDirty(false);
                                                    setShowDiscardConfirm(false);
                                                    onOpenChange(false);
                                                }, children: "Discard & Close" })] })] })), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between w-full gap-2", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex items-center", children: saveNotification && ((0, jsx_runtime_1.jsxs)("span", { className: `inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shadow-2xs ${saveNotification.type === "success"
                                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800"
                                                : "bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-800"}`, children: [saveNotification.type === "success" ? "✓ " : "⚠ ", saveNotification.message] })) }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 ml-auto", children: [(0, jsx_runtime_1.jsx)(ui_1.Button, { type: "button", variant: "secondary", size: "small", onClick: handleClose, disabled: isSubmitting || isDeleting, children: "Close" }), (0, jsx_runtime_1.jsx)(ui_1.Button, { type: "button", size: "small", onClick: () => handleSubmit(false), isLoading: isSubmitting, disabled: isSubmitting || !name.trim() || isDeleting, children: saveNotification?.type === "success" ? "✓ Saved!" : "Save Category" })] })] })] })] }) }) }));
};
exports.EditCategoryDrawer = EditCategoryDrawer;
