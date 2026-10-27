"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = void 0;
const utils_1 = require("@medusajs/framework/utils");
const validators_1 = require("../validators");
const POST = async (req, res) => {
    const parsed = validators_1.CreateCategoryTreeBodySchema.safeParse(req.body);
    if (!parsed.success) {
        throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, parsed.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", "));
    }
    const { name, handle: customHandle, description, parent_category_id, rank, is_active, is_internal, sales_channels, image_url, } = parsed.data;
    const productModule = req.scope.resolve(utils_1.Modules.PRODUCT);
    const handle = customHandle?.trim() ||
        name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");
    const metadata = {};
    if (Array.isArray(sales_channels) && sales_channels.length > 0) {
        metadata.sales_channels = sales_channels;
    }
    if (image_url) {
        metadata.thumbnail = image_url;
        metadata.image = image_url;
    }
    const category = await productModule.createProductCategories({
        name,
        handle,
        description: description || undefined,
        parent_category_id: parent_category_id || null,
        rank: typeof rank === "number" ? rank : 0,
        is_active,
        is_internal,
        metadata,
    });
    res.status(201).json({
        category: {
            ...category,
            image_url: image_url || null,
            sales_channels: sales_channels || [],
        },
    });
};
exports.POST = POST;
