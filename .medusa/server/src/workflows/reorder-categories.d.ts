export type CategoryMove = {
    id: string;
    parent_category_id: string | null;
    rank: number;
};
export type ReorderCategoriesInput = {
    moves: CategoryMove[];
};
export declare const reorderCategoriesStep: import("@medusajs/framework/workflows-sdk").StepFunction<ReorderCategoriesInput, import("@medusajs/types").ProductCategoryDTO[]>;
export declare const reorderCategoriesWorkflow: import("@medusajs/framework/workflows-sdk").ReturnWorkflow<ReorderCategoriesInput, import("@medusajs/types").ProductCategoryDTO[], []>;
