"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = void 0;
const GET = async (req, res) => {
    const query = req.scope.resolve("query");
    let salesChannels = [];
    try {
        const { data: scData } = await query.graph({
            entity: "sales_channel",
            fields: ["id", "name", "description"],
        });
        salesChannels = scData || [];
    }
    catch (err) {
        console.warn("[category-tree] Failed to query sales_channels:", err);
    }
    let categories = [];
    try {
        const { data: catData } = await query.graph({
            entity: "product_category",
            fields: [
                "id",
                "name",
                "handle",
                "description",
                "parent_category_id",
                "rank",
                "is_active",
                "is_internal",
                "metadata",
                "product_category_image.*",
            ],
            pagination: {
                order: { rank: "ASC" },
                take: null,
            },
        });
        categories = catData || [];
    }
    catch (err) {
        console.warn("[category-tree] query.graph with product_category_image fallback:", err);
        const { data: catDataFallback } = await query.graph({
            entity: "product_category",
            fields: [
                "id",
                "name",
                "handle",
                "description",
                "parent_category_id",
                "rank",
                "is_active",
                "is_internal",
                "metadata",
            ],
            pagination: {
                order: { rank: "ASC" },
                take: null,
            },
        });
        categories = catDataFallback || [];
    }
    // Enforce universal deterministic sorting (rank ASC, name ASC, id ASC)
    categories.sort((a, b) => {
        const rankA = typeof a.rank === "number" ? a.rank : 9999;
        const rankB = typeof b.rank === "number" ? b.rank : 9999;
        if (rankA !== rankB)
            return rankA - rankB;
        const nameA = (a.name || "").trim();
        const nameB = (b.name || "").trim();
        const nameComp = nameA.localeCompare(nameB);
        if (nameComp !== 0)
            return nameComp;
        return (a.id || "").localeCompare(b.id || "");
    });
    const allChannelIds = salesChannels.map((sc) => sc.id);
    const enriched = categories.map((cat) => {
        const images = Array.isArray(cat.product_category_image)
            ? cat.product_category_image
            : cat.product_category_image
                ? [cat.product_category_image]
                : [];
        const thumbObj = images.find((img) => (img?.type || "").toLowerCase() === "thumbnail");
        const firstImg = images[0];
        const metaThumb = typeof cat.metadata?.thumbnail === "string" ? cat.metadata.thumbnail : null;
        const metaImg = typeof cat.metadata?.image === "string" ? cat.metadata.image : null;
        const imageUrl = thumbObj?.url || firstImg?.url || metaThumb || metaImg || null;
        const metaChannels = cat.metadata?.sales_channels;
        const allowedChannels = Array.isArray(metaChannels)
            ? metaChannels
            : allChannelIds;
        return {
            id: cat.id,
            name: cat.name,
            handle: cat.handle,
            description: cat.description || cat.metadata?.description || null,
            parent_category_id: cat.parent_category_id || null,
            rank: typeof cat.rank === "number" ? cat.rank : 0,
            is_active: Boolean(cat.is_active),
            is_internal: Boolean(cat.is_internal),
            metadata: cat.metadata || {},
            image_url: imageUrl,
            sales_channels: allowedChannels,
        };
    });
    res.json({
        categories: enriched,
        sales_channels: salesChannels,
        count: enriched.length,
    });
};
exports.GET = GET;
