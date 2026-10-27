"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("@medusajs/framework/http");
const validators_1 = require("./admin/category-tree/validators");
exports.default = (0, http_1.defineMiddlewares)({
    routes: [
        {
            method: ["POST"],
            matcher: "/admin/category-tree/reorder",
            middlewares: [(0, http_1.validateAndTransformBody)(validators_1.ReorderCategoryBodySchema)],
        },
    ],
});
