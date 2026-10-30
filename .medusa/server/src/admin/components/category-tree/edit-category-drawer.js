"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditCategoryDrawer = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const ui_1 = require("@medusajs/ui");
const icons_1 = require("@medusajs/icons");
const category_products_manager_1 = require("./category-products-manager");
const sdk_1 = require("../../lib/sdk");
const types_1 = require("./edit-category/types");
const general_tab_1 = require("./edit-category/general-tab");
const media_tab_1 = require("./edit-category/media-tab");
const youtube_tab_1 = require("./edit-category/youtube-tab");
const EditCategoryDrawerContent = ({ category, salesChannels, onClose, onSuccess, onDeleteSuccess, }) => {
    // Navigation & View Mode
    const [activeTab, setActiveTab] = (0, react_1.useState)("general");
    const [isFullScreen, setIsFullScreen] = (0, react_1.useState)(false);
    // Form Fields
    const [name, setName] = (0, react_1.useState)(category.name || "");
    const [handle, setHandle] = (0, react_1.useState)(category.handle || "");
    const [description, setDescription] = (0, react_1.useState)(category.description || category.metadata?.description || "");
    const [imageUrl, setImageUrl] = (0, react_1.useState)(category.image_url || "");
    const [rank, setRank] = (0, react_1.useState)(category.rank ?? 0);
    const [isActive, setIsActive] = (0, react_1.useState)(Boolean(category.is_active));
    const [isInternal, setIsInternal] = (0, react_1.useState)(Boolean(category.is_internal));
    const [selectedChannels, setSelectedChannels] = (0, react_1.useState)(category.sales_channels || salesChannels.map((s) => s.id));
    // YouTube Videos
    const [youtubeUrls, setYoutubeUrls] = (0, react_1.useState)(() => {
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
        return urls;
    });
    const [newYoutubeInput, setNewYoutubeInput] = (0, react_1.useState)("");
    // Metadata & Media
    const [currentMetadata, setCurrentMetadata] = (0, react_1.useState)(category.metadata || {});
    const [categoryImages, setCategoryImages] = (0, react_1.useState)([]);
    const [manualImageUrl, setManualImageUrl] = (0, react_1.useState)("");
    const [isUploading, setIsUploading] = (0, react_1.useState)(false);
    // Submission States
    const [isSubmitting, setIsSubmitting] = (0, react_1.useState)(false);
    const [isDeleting, setIsDeleting] = (0, react_1.useState)(false);
    // Dirty State & Notifications
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
            // Fallback
        }
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
    (0, react_1.useEffect)(() => {
        const meta = category.metadata;
        loadCategoryImages(category.id, category.image_url || meta?.thumbnail || meta?.image, meta);
    }, [category.id, category.image_url, category.metadata, loadCategoryImages]);
    // Mark dirty helper
    const handleMarkDirty = (0, react_1.useCallback)(() => {
        setIsDirty(true);
        setShowDiscardConfirm(false);
    }, []);
    // Channel toggling
    const toggleChannel = (0, react_1.useCallback)((channelId) => {
        setIsDirty(true);
        setShowDiscardConfirm(false);
        setSelectedChannels((prev) => prev.includes(channelId) ? prev.filter((id) => id !== channelId) : [...prev, channelId]);
    }, []);
    // File upload handler
    const handleFileUpload = async (files) => {
        if (!files || files.length === 0)
            return;
        setIsUploading(true);
        try {
            const fileList = Array.from(files);
            const res = await sdk_1.sdk.admin.upload.create({ files: fileList });
            const uploadedFiles = res.files || [];
            if (uploadedFiles.length === 0) {
                throw new Error("No files returned from upload service");
            }
            const firstUrl = uploadedFiles[0].url;
            if (!imageUrl) {
                setImageUrl(firstUrl);
            }
            const payload = uploadedFiles.map((f, i) => ({
                url: f.url,
                file_id: f.id || f.file_id || f.key || `file_${Date.now()}_${i}`,
                type: (categoryImages.length === 0 && i === 0 ? "thumbnail" : "image"),
            }));
            try {
                await sdk_1.sdk.client.fetch(`/admin/categories/${category.id}/images`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: { images: payload },
                });
                await loadCategoryImages(category.id, firstUrl, currentMetadata);
            }
            catch {
                setCategoryImages((prev) => [
                    ...prev,
                    ...payload.map((p, i) => ({
                        ...p,
                        type: prev.length === 0 && i === 0 ? "thumbnail" : prev.length === 1 && i === 0 ? "banner" : "image",
                    })),
                ]);
            }
            setIsDirty(true);
            ui_1.toast.success(`${uploadedFiles.length} image(s) uploaded successfully`);
            triggerSaveNotification("success", `${uploadedFiles.length} image(s) uploaded!`);
        }
        catch (err) {
            ui_1.toast.error(err?.message || "Failed to upload image");
            triggerSaveNotification("error", err?.message || "Failed to upload image");
        }
        finally {
            setIsUploading(false);
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
    // Add external image URL
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
    // Delete category image
    const handleDeleteImage = async (img) => {
        const remaining = categoryImages.filter((i) => i.url !== img.url && (img.id ? i.id !== img.id : true));
        const nextThumb = remaining.find((i) => i.type === "thumbnail") || remaining[0] || null;
        const nextBanner = remaining.find((i) => i.type === "banner") ||
            (remaining.length > 1 ? remaining.find((i) => i.url !== nextThumb?.url) : null) ||
            null;
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
        if (img.id) {
            try {
                await sdk_1.sdk.client.fetch(`/admin/categories/${category.id}/images/batch`, {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: { ids: [img.id] },
                });
            }
            catch (err) {
                console.warn("Could not delete from backend images endpoint:", err);
            }
        }
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
    // YouTube handlers
    const handleAddYoutube = async () => {
        const raw = newYoutubeInput.trim();
        if (!raw)
            return;
        const id = (0, types_1.extractYouTubeVideoId)(raw);
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
    // Submit / Save Category
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
            // Safe description: sending "" when blank prevents 400 Bad Request
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
                onClose();
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
    // Delete Category
    const handleDelete = async () => {
        if (!confirm(`Are you sure you want to delete category "${category.name}"? Subcategories will be promoted.`)) {
            return;
        }
        setIsDeleting(true);
        try {
            await sdk_1.sdk.admin.productCategory.delete(category.id);
            ui_1.toast.success(`Category "${category.name}" deleted`);
            onDeleteSuccess(category.id);
            onClose();
        }
        catch (err) {
            ui_1.toast.error(err?.message || "Failed to delete category");
            triggerSaveNotification("error", err?.message || "Failed to delete category");
        }
        finally {
            setIsDeleting(false);
        }
    };
    // Close handler with dirty check
    const handleClose = () => {
        if (isDirty && !showDiscardConfirm) {
            setShowDiscardConfirm(true);
            return;
        }
        setIsDirty(false);
        setShowDiscardConfirm(false);
        onClose();
    };
    return ((0, jsx_runtime_1.jsx)(ui_1.Drawer.Content, { className: `transition-all duration-300 w-full z-50 ${isFullScreen
            ? "!max-w-full !w-screen !h-screen !inset-0 !rounded-none"
            : "max-w-5xl xl:max-w-6xl w-[92vw]"}`, children: (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col h-full", children: [(0, jsx_runtime_1.jsxs)(ui_1.Drawer.Header, { className: "border-b border-ui-border-base pb-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between w-full", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)(ui_1.Drawer.Title, { className: "text-base font-semibold text-ui-fg-base", children: category.name }), (0, jsx_runtime_1.jsxs)(ui_1.Drawer.Description, { className: "text-xs text-ui-fg-muted mt-0.5", children: ["Tier ", category.tier, " \u2022 ID: ", category.id] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsxs)("button", { type: "button", onClick: () => setIsFullScreen((prev) => !prev), className: "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-ui-fg-subtle hover:text-ui-fg-base rounded-lg border border-ui-border-base bg-ui-bg-subtle hover:bg-ui-bg-base shadow-2xs transition-colors cursor-pointer", title: isFullScreen ? "Exit Fullscreen" : "Expand to Full Page Modal", children: [(0, jsx_runtime_1.jsx)(icons_1.ArrowsPointingOut, { className: "w-3.5 h-3.5" }), (0, jsx_runtime_1.jsx)("span", { children: isFullScreen ? "Exit Fullscreen" : "Full Page" })] }), (0, jsx_runtime_1.jsxs)("button", { type: "button", onClick: () => window.open(`/app/categories/${category.id}`, "_blank"), className: "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-ui-fg-subtle hover:text-ui-fg-base rounded-lg border border-ui-border-base bg-ui-bg-subtle hover:bg-ui-bg-base shadow-2xs transition-colors cursor-pointer", title: "Open full category details page in a new tab", children: [(0, jsx_runtime_1.jsx)("span", { children: "Open Full Page" }), (0, jsx_runtime_1.jsx)(icons_1.ArrowUpRightMicro, { className: "w-3.5 h-3.5" })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-1 mt-3 border-b border-ui-border-base -mb-3", children: [(0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setActiveTab("general"), className: `px-3 py-1.5 text-xs font-medium border-b-2 transition-colors cursor-pointer ${activeTab === "general"
                                        ? "border-blue-600 text-blue-600 font-semibold"
                                        : "border-transparent text-ui-fg-muted hover:text-ui-fg-base"}`, children: "General & Ranking" }), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setActiveTab("products"), className: `px-3 py-1.5 text-xs font-medium border-b-2 transition-colors cursor-pointer ${activeTab === "products"
                                        ? "border-blue-600 text-blue-600 font-semibold"
                                        : "border-transparent text-ui-fg-muted hover:text-ui-fg-base"}`, children: "Products Management" }), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setActiveTab("channels"), className: `px-3 py-1.5 text-xs font-medium border-b-2 transition-colors cursor-pointer ${activeTab === "channels"
                                        ? "border-blue-600 text-blue-600 font-semibold"
                                        : "border-transparent text-ui-fg-muted hover:text-ui-fg-base"}`, children: "Storefronts & Media" }), (0, jsx_runtime_1.jsxs)("button", { type: "button", onClick: () => setActiveTab("youtube"), className: `flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border-b-2 transition-colors cursor-pointer ${activeTab === "youtube"
                                        ? "border-blue-600 text-blue-600 font-semibold"
                                        : "border-transparent text-ui-fg-muted hover:text-ui-fg-base"}`, children: [(0, jsx_runtime_1.jsx)("span", { children: "YouTube Videos" }), youtubeUrls.length > 0 && ((0, jsx_runtime_1.jsx)("span", { className: "px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", children: youtubeUrls.length }))] })] })] }), (0, jsx_runtime_1.jsxs)(ui_1.Drawer.Body, { className: "overflow-y-auto flex-1 p-6", children: [activeTab === "general" && ((0, jsx_runtime_1.jsx)(general_tab_1.GeneralTab, { name: name, setName: setName, handle: handle, setHandle: setHandle, rank: rank, setRank: setRank, description: description, setDescription: setDescription, isActive: isActive, setIsActive: setIsActive, isInternal: isInternal, setIsInternal: setIsInternal, onDirty: handleMarkDirty, onDelete: handleDelete, isDeleting: isDeleting })), activeTab === "products" && ((0, jsx_runtime_1.jsx)(category_products_manager_1.CategoryProductsManager, { categoryId: category.id, categoryName: category.name, initialMetadata: currentMetadata, onMetadataUpdate: (meta) => {
                                setCurrentMetadata(meta);
                            } })), activeTab === "channels" && ((0, jsx_runtime_1.jsx)(media_tab_1.MediaTab, { salesChannels: salesChannels, selectedChannels: selectedChannels, toggleChannel: toggleChannel, categoryImages: categoryImages, imageUrl: imageUrl, isUploading: isUploading, handleFileUpload: handleFileUpload, handleSetThumbnail: handleSetThumbnail, handleSetBanner: handleSetBanner, handleDeleteImage: handleDeleteImage, manualImageUrl: manualImageUrl, setManualImageUrl: setManualImageUrl, handleAddManualImage: handleAddManualImage })), activeTab === "youtube" && ((0, jsx_runtime_1.jsx)(youtube_tab_1.YoutubeTab, { youtubeUrls: youtubeUrls, newYoutubeInput: newYoutubeInput, setNewYoutubeInput: setNewYoutubeInput, handleAddYoutube: handleAddYoutube, handleRemoveYoutube: handleRemoveYoutube }))] }), (0, jsx_runtime_1.jsxs)(ui_1.Drawer.Footer, { className: "flex flex-col gap-2 px-6 py-4 border-t border-ui-border-base", children: [showDiscardConfirm && ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between gap-3 w-full px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-xs", children: [(0, jsx_runtime_1.jsx)("span", { className: "font-medium", children: "You have unsaved changes. Discard changes and close?" }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 shrink-0", children: [(0, jsx_runtime_1.jsx)(ui_1.Button, { type: "button", size: "small", variant: "secondary", onClick: () => setShowDiscardConfirm(false), children: "Keep Editing" }), (0, jsx_runtime_1.jsx)(ui_1.Button, { type: "button", size: "small", variant: "danger", onClick: () => {
                                                setIsDirty(false);
                                                setShowDiscardConfirm(false);
                                                onClose();
                                            }, children: "Discard & Close" })] })] })), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between w-full gap-2", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex items-center", children: saveNotification && ((0, jsx_runtime_1.jsxs)("span", { className: `inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shadow-2xs ${saveNotification.type === "success"
                                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800"
                                            : "bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-800"}`, children: [saveNotification.type === "success" ? "✓ " : "⚠ ", saveNotification.message] })) }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 ml-auto", children: [(0, jsx_runtime_1.jsx)(ui_1.Button, { type: "button", variant: "secondary", size: "small", onClick: handleClose, disabled: isSubmitting || isDeleting, children: "Close" }), (0, jsx_runtime_1.jsx)(ui_1.Button, { type: "button", size: "small", onClick: () => handleSubmit(false), isLoading: isSubmitting, disabled: isSubmitting || !name.trim() || isDeleting, children: saveNotification?.type === "success" ? "✓ Saved!" : "Save Category" })] })] })] })] }) }));
};
const EditCategoryDrawer = ({ open, onOpenChange, category, salesChannels, onSuccess, onDeleteSuccess, }) => {
    return ((0, jsx_runtime_1.jsx)(ui_1.Drawer, { open: open, onOpenChange: onOpenChange, children: open && category && ((0, jsx_runtime_1.jsx)(EditCategoryDrawerContent, { category: category, salesChannels: salesChannels, onClose: () => onOpenChange(false), onSuccess: onSuccess, onDeleteSuccess: onDeleteSuccess }, category.id)) }));
};
exports.EditCategoryDrawer = EditCategoryDrawer;
