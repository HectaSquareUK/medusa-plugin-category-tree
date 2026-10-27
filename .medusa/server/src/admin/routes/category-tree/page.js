"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const admin_sdk_1 = require("@medusajs/admin-sdk");
const icons_1 = require("@medusajs/icons");
const ui_1 = require("@medusajs/ui");
const category_tree_canvas_1 = require("../../components/category-tree/category-tree-canvas");
const CategoryTreePage = () => {
    return ((0, jsx_runtime_1.jsx)(ui_1.TooltipProvider, { children: (0, jsx_runtime_1.jsx)(category_tree_canvas_1.CategoryTreeCanvas, {}) }));
};
exports.config = (0, admin_sdk_1.defineRouteConfig)({
    label: "Category Tree",
    icon: icons_1.Folder,
});
exports.default = CategoryTreePage;
