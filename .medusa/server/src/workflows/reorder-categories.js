"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reorderCategoriesWorkflow = exports.reorderCategoriesStep = void 0;
const workflows_sdk_1 = require("@medusajs/framework/workflows-sdk");
const utils_1 = require("@medusajs/framework/utils");
const SELECT = [
    "id",
    "name",
    "handle",
    "parent_category_id",
    "rank",
    "is_active",
    "is_internal",
];
/**
 * Rejects unknown ids and any move that would create a cycle
 * (a category ending up inside its own subtree).
 */
function assertValid(snapshot, moves) {
    const parents = new Map(snapshot.map((c) => [c.id, c.parent_category_id]));
    for (const m of moves) {
        if (!parents.has(m.id)) {
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.NOT_FOUND, `Product category ${m.id} was not found`);
        }
        if (m.parent_category_id && !parents.has(m.parent_category_id)) {
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.NOT_FOUND, `Parent category ${m.parent_category_id} was not found`);
        }
        if (m.parent_category_id === m.id) {
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, "A category cannot be its own parent");
        }
        parents.set(m.id, m.parent_category_id);
    }
    for (const id of parents.keys()) {
        let cur = id;
        let steps = 0;
        while (cur) {
            cur = parents.get(cur) ?? null;
            if (++steps > parents.size) {
                throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, "These moves would create a loop in the category tree");
            }
        }
    }
}
/** Top-down, ascending-rank restore of a snapshot (used for rollback). */
function snapshotToMoves(snapshot) {
    const byParent = new Map();
    for (const c of snapshot) {
        const list = byParent.get(c.parent_category_id) ?? [];
        list.push(c);
        byParent.set(c.parent_category_id, list);
    }
    const out = [];
    const queue = [null];
    while (queue.length) {
        const parent = queue.shift();
        const kids = (byParent.get(parent) ?? []).sort((a, b) => a.rank - b.rank);
        kids.forEach((k, i) => {
            out.push({ id: k.id, parent_category_id: parent, rank: i });
            queue.push(k.id);
        });
    }
    return out;
}
exports.reorderCategoriesStep = (0, workflows_sdk_1.createStep)("reorder-categories-step", async (input, { container }) => {
    const productModule = container.resolve(utils_1.Modules.PRODUCT);
    const before = (await productModule.listProductCategories({}, { select: ["id", "parent_category_id", "rank"], take: null }));
    assertValid(before, input.moves);
    // Moves must be applied sequentially: each rank change shifts siblings.
    for (const m of input.moves) {
        await productModule.updateProductCategories(m.id, {
            parent_category_id: m.parent_category_id,
            rank: m.rank,
        });
    }
    const after = await productModule.listProductCategories({}, { select: SELECT, order: { rank: "ASC" }, take: null });
    return new workflows_sdk_1.StepResponse(after, before);
}, async (before, { container }) => {
    if (!before) {
        return;
    }
    const productModule = container.resolve(utils_1.Modules.PRODUCT);
    for (const m of snapshotToMoves(before)) {
        await productModule.updateProductCategories(m.id, {
            parent_category_id: m.parent_category_id,
            rank: m.rank,
        });
    }
});
exports.reorderCategoriesWorkflow = (0, workflows_sdk_1.createWorkflow)("reorder-categories", (input) => {
    const categories = (0, exports.reorderCategoriesStep)(input);
    return new workflows_sdk_1.WorkflowResponse(categories);
});
