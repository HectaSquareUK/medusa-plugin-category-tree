"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateCategoryDrawer = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const ui_1 = require("@medusajs/ui");
const sdk_1 = require("../../lib/sdk");
const CreateCategoryDrawer = ({ open, onOpenChange, parentCategory, salesChannels, onSuccess, }) => {
    const [name, setName] = (0, react_1.useState)("");
    const [handle, setHandle] = (0, react_1.useState)("");
    const [description, setDescription] = (0, react_1.useState)("");
    const [imageUrl, setImageUrl] = (0, react_1.useState)("");
    const [isActive, setIsActive] = (0, react_1.useState)(true);
    const [isInternal, setIsInternal] = (0, react_1.useState)(false);
    const [selectedChannels, setSelectedChannels] = (0, react_1.useState)([]);
    const [isSubmitting, setIsSubmitting] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        if (open) {
            setName("");
            setHandle("");
            setDescription("");
            setImageUrl("");
            setIsActive(true);
            setIsInternal(false);
            if (parentCategory?.sales_channels) {
                setSelectedChannels(parentCategory.sales_channels);
            }
            else {
                setSelectedChannels(salesChannels.map((sc) => sc.id));
            }
        }
    }, [open, parentCategory, salesChannels]);
    const handleNameChange = (val) => {
        setName(val);
        if (!handle || handle === name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")) {
            setHandle(val
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, ""));
        }
    };
    const toggleChannel = (channelId) => {
        setSelectedChannels((prev) => prev.includes(channelId)
            ? prev.filter((id) => id !== channelId)
            : [...prev, channelId]);
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) {
            ui_1.toast.error("Category name is required");
            return;
        }
        setIsSubmitting(true);
        try {
            const res = await sdk_1.sdk.client.fetch("/admin/category-tree/create", {
                method: "POST",
                body: {
                    name: name.trim(),
                    handle: handle.trim() || undefined,
                    description: description.trim() || undefined,
                    parent_category_id: parentCategory ? parentCategory.id : null,
                    image_url: imageUrl.trim() || undefined,
                    sales_channels: selectedChannels,
                    is_active: isActive,
                    is_internal: isInternal,
                },
            });
            ui_1.toast.success(`Category "${name}" created successfully`);
            onSuccess(res.category);
            onOpenChange(false);
        }
        catch (err) {
            ui_1.toast.error(err?.message || "Failed to create category");
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return ((0, jsx_runtime_1.jsx)(ui_1.Drawer, { open: open, onOpenChange: onOpenChange, children: (0, jsx_runtime_1.jsx)(ui_1.Drawer.Content, { className: "max-w-md", children: (0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSubmit, className: "flex flex-col h-full", children: [(0, jsx_runtime_1.jsxs)(ui_1.Drawer.Header, { children: [(0, jsx_runtime_1.jsx)(ui_1.Drawer.Title, { children: parentCategory ? `New Subcategory under "${parentCategory.name}"` : "New Root Category" }), (0, jsx_runtime_1.jsx)(ui_1.Drawer.Description, { children: parentCategory
                                    ? `Will be created at Tier ${(parentCategory.tier || 1) + 1} and linked in the hierarchy.`
                                    : "Creates a top-level Tier 1 main category in the store." })] }), (0, jsx_runtime_1.jsxs)(ui_1.Drawer.Body, { className: "flex flex-col gap-4 overflow-y-auto px-6 py-4 flex-1", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-1.5", children: [(0, jsx_runtime_1.jsx)(ui_1.Label, { htmlFor: "cat-name", className: "text-xs font-semibold", children: "Category Name *" }), (0, jsx_runtime_1.jsx)(ui_1.Input, { id: "cat-name", size: "small", placeholder: "e.g. Embroidery Thread", value: name, onChange: (e) => handleNameChange(e.target.value), autoFocus: true })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-1.5", children: [(0, jsx_runtime_1.jsx)(ui_1.Label, { htmlFor: "cat-handle", className: "text-xs font-semibold", children: "Handle (URL slug)" }), (0, jsx_runtime_1.jsx)(ui_1.Input, { id: "cat-handle", size: "small", placeholder: "e.g. embroidery-thread", value: handle, onChange: (e) => setHandle(e.target.value) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-1.5", children: [(0, jsx_runtime_1.jsx)(ui_1.Label, { htmlFor: "cat-image", className: "text-xs font-semibold", children: "Category Image URL" }), (0, jsx_runtime_1.jsx)(ui_1.Input, { id: "cat-image", size: "small", placeholder: "https://... or /images/...", value: imageUrl, onChange: (e) => setImageUrl(e.target.value) }), imageUrl && ((0, jsx_runtime_1.jsx)("div", { className: "mt-1 w-16 h-16 rounded-lg overflow-hidden border border-ui-border-base bg-ui-bg-subtle", children: (0, jsx_runtime_1.jsx)("img", { src: imageUrl, alt: "Preview", className: "w-full h-full object-cover", onError: (e) => {
                                                ;
                                                e.target.style.display = "none";
                                            } }) }))] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-1.5", children: [(0, jsx_runtime_1.jsx)(ui_1.Label, { htmlFor: "cat-desc", className: "text-xs font-semibold", children: "Description" }), (0, jsx_runtime_1.jsx)(ui_1.Textarea, { id: "cat-desc", placeholder: "Brief summary of this category...", value: description, onChange: (e) => setDescription(e.target.value), rows: 2 })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-2 pt-2 border-t border-ui-border-base", children: [(0, jsx_runtime_1.jsx)(ui_1.Label, { className: "text-xs font-semibold", children: "Storefront Visibility" }), (0, jsx_runtime_1.jsx)(ui_1.Text, { size: "xsmall", className: "text-ui-fg-muted", children: "Designate which storefronts can display this category." }), (0, jsx_runtime_1.jsx)("div", { className: "flex flex-col gap-2 mt-1", children: salesChannels.map((channel) => {
                                            const isChecked = selectedChannels.includes(channel.id);
                                            return ((0, jsx_runtime_1.jsxs)("label", { className: "flex items-center gap-2.5 text-xs text-ui-fg-base cursor-pointer select-none", children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: isChecked, onChange: () => toggleChannel(channel.id), className: "rounded border-ui-border-base text-blue-600 focus:ring-blue-500 cursor-pointer" }), (0, jsx_runtime_1.jsx)("span", { className: "font-medium", children: channel.name })] }, channel.id));
                                        }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between pt-2 border-t border-ui-border-base", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)(ui_1.Label, { className: "text-xs font-semibold", children: "Active Status" }), (0, jsx_runtime_1.jsx)(ui_1.Text, { size: "xsmall", className: "text-ui-fg-muted", children: "Visible to shoppers on enabled storefronts" })] }), (0, jsx_runtime_1.jsx)(ui_1.Switch, { checked: isActive, onCheckedChange: setIsActive })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)(ui_1.Label, { className: "text-xs font-semibold", children: "Internal Only" }), (0, jsx_runtime_1.jsx)(ui_1.Text, { size: "xsmall", className: "text-ui-fg-muted", children: "Hidden from public storefront navigation" })] }), (0, jsx_runtime_1.jsx)(ui_1.Switch, { checked: isInternal, onCheckedChange: setIsInternal })] })] }), (0, jsx_runtime_1.jsxs)(ui_1.Drawer.Footer, { className: "flex justify-end gap-2 px-6 py-4 border-t border-ui-border-base", children: [(0, jsx_runtime_1.jsx)(ui_1.Button, { type: "button", variant: "secondary", size: "small", onClick: () => onOpenChange(false), disabled: isSubmitting, children: "Cancel" }), (0, jsx_runtime_1.jsx)(ui_1.Button, { type: "submit", size: "small", isLoading: isSubmitting, disabled: isSubmitting || !name.trim(), children: "Create Category" })] })] }) }) }));
};
exports.CreateCategoryDrawer = CreateCategoryDrawer;
