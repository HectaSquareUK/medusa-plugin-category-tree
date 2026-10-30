"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeneralTab = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const ui_1 = require("@medusajs/ui");
const icons_1 = require("@medusajs/icons");
const GeneralTab = ({ name, setName, handle, setHandle, rank, setRank, description, setDescription, isActive, setIsActive, isInternal, setIsInternal, onDirty, onDelete, isDeleting, }) => {
    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-1.5", children: [(0, jsx_runtime_1.jsx)(ui_1.Label, { htmlFor: "edit-name", className: "text-xs font-semibold", children: "Category Name *" }), (0, jsx_runtime_1.jsx)(ui_1.Input, { id: "edit-name", value: name, onChange: (e) => {
                            setName(e.target.value);
                            onDirty();
                        }, required: true })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-1.5", children: [(0, jsx_runtime_1.jsx)(ui_1.Label, { htmlFor: "edit-handle", className: "text-xs font-semibold", children: "Handle (URL Slug)" }), (0, jsx_runtime_1.jsx)(ui_1.Input, { id: "edit-handle", value: handle, onChange: (e) => {
                            setHandle(e.target.value);
                            onDirty();
                        }, placeholder: "e.g. rayon-embroidery-thread" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-1.5 p-3 rounded-xl border border-ui-border-base bg-ui-bg-subtle/50", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsx)(ui_1.Label, { htmlFor: "edit-rank", className: "text-xs font-semibold", children: "Storefront Ranking (Sort Order)" }), (0, jsx_runtime_1.jsx)("span", { className: "text-[10px] font-mono text-ui-fg-muted", children: "Controls Storefront 2 & Monfil" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(ui_1.Input, { id: "edit-rank", type: "number", size: "small", value: rank, onChange: (e) => {
                                    setRank(Number(e.target.value));
                                    onDirty();
                                }, className: "w-24" }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-1", children: [(0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => {
                                            setRank((r) => Math.max(0, r - 1));
                                            onDirty();
                                        }, className: "px-2 py-1 text-xs font-medium rounded border border-ui-border-base bg-ui-bg-base hover:bg-ui-bg-subtle transition-colors cursor-pointer", title: "Move Earlier in Storefront", children: "\u2191 Earlier" }), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => {
                                            setRank((r) => r + 1);
                                            onDirty();
                                        }, className: "px-2 py-1 text-xs font-medium rounded border border-ui-border-base bg-ui-bg-base hover:bg-ui-bg-subtle transition-colors cursor-pointer", title: "Move Later in Storefront", children: "\u2193 Later" }), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => {
                                            setRank(0);
                                            onDirty();
                                        }, className: "px-2 py-1 text-xs font-medium rounded border border-ui-border-base bg-ui-bg-base hover:bg-ui-bg-subtle transition-colors cursor-pointer", title: "Set as First Category", children: "Top (#0)" })] })] }), (0, jsx_runtime_1.jsx)("p", { className: "text-[11px] text-ui-fg-muted leading-relaxed", children: "Categories are sorted by rank ASC (0, 1, 2...). Lower numbers appear first on your storefront navigation menu." })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-1.5", children: [(0, jsx_runtime_1.jsx)(ui_1.Label, { htmlFor: "edit-desc", className: "text-xs font-semibold", children: "Description" }), (0, jsx_runtime_1.jsx)(ui_1.Textarea, { id: "edit-desc", value: description, onChange: (e) => {
                            setDescription(e.target.value);
                            onDirty();
                        }, rows: 3 })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between pt-2 border-t border-ui-border-base", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)(ui_1.Label, { className: "text-xs font-semibold", children: "Active Status" }), (0, jsx_runtime_1.jsx)(ui_1.Text, { size: "xsmall", className: "text-ui-fg-muted", children: "Visible to shoppers on enabled storefronts" })] }), (0, jsx_runtime_1.jsx)(ui_1.Switch, { checked: isActive, onCheckedChange: (val) => {
                            setIsActive(val);
                            onDirty();
                        } })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)(ui_1.Label, { className: "text-xs font-semibold", children: "Internal Only" }), (0, jsx_runtime_1.jsx)(ui_1.Text, { size: "xsmall", className: "text-ui-fg-muted", children: "Hidden from public storefront navigation" })] }), (0, jsx_runtime_1.jsx)(ui_1.Switch, { checked: isInternal, onCheckedChange: (val) => {
                            setIsInternal(val);
                            onDirty();
                        } })] }), (0, jsx_runtime_1.jsx)("div", { className: "pt-3 border-t border-ui-border-base", children: (0, jsx_runtime_1.jsxs)(ui_1.Button, { type: "button", variant: "danger", size: "small", onClick: onDelete, isLoading: isDeleting, className: "w-full flex items-center justify-center gap-1.5", children: [(0, jsx_runtime_1.jsx)(icons_1.Trash, { className: "w-3.5 h-3.5" }), (0, jsx_runtime_1.jsx)("span", { children: "Delete Category" })] }) })] }));
};
exports.GeneralTab = GeneralTab;
