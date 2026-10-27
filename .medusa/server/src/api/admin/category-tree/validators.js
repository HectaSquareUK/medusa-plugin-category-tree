"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateCategoryTreeBodySchema = exports.ReorderCategoryBodySchema = exports.ReorderCategoryMoveSchema = void 0;
const zod_1 = require("zod");
exports.ReorderCategoryMoveSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    parent_category_id: zod_1.z.string().min(1).nullable(),
    rank: zod_1.z.number().int().min(0),
});
exports.ReorderCategoryBodySchema = zod_1.z.object({
    moves: zod_1.z.array(exports.ReorderCategoryMoveSchema).min(1).max(2000),
});
exports.CreateCategoryTreeBodySchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Name is required"),
    handle: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    parent_category_id: zod_1.z.string().nullable().optional(),
    rank: zod_1.z.number().int().min(0).optional(),
    is_active: zod_1.z.boolean().default(true),
    is_internal: zod_1.z.boolean().default(false),
    sales_channels: zod_1.z.array(zod_1.z.string()).optional(),
    image_url: zod_1.z.string().optional(),
});
