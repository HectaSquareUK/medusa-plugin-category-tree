import { z } from "zod";
export declare const ReorderCategoryMoveSchema: z.ZodObject<{
    id: z.ZodString;
    parent_category_id: z.ZodNullable<z.ZodString>;
    rank: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id?: string;
    parent_category_id?: string;
    rank?: number;
}, {
    id?: string;
    parent_category_id?: string;
    rank?: number;
}>;
export declare const ReorderCategoryBodySchema: z.ZodObject<{
    moves: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        parent_category_id: z.ZodNullable<z.ZodString>;
        rank: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        id?: string;
        parent_category_id?: string;
        rank?: number;
    }, {
        id?: string;
        parent_category_id?: string;
        rank?: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    moves?: {
        id?: string;
        parent_category_id?: string;
        rank?: number;
    }[];
}, {
    moves?: {
        id?: string;
        parent_category_id?: string;
        rank?: number;
    }[];
}>;
export type ReorderCategoryBody = z.infer<typeof ReorderCategoryBodySchema>;
export declare const CreateCategoryTreeBodySchema: z.ZodObject<{
    name: z.ZodString;
    handle: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    parent_category_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    rank: z.ZodOptional<z.ZodNumber>;
    is_active: z.ZodDefault<z.ZodBoolean>;
    is_internal: z.ZodDefault<z.ZodBoolean>;
    sales_channels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    image_url: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string;
    handle?: string;
    parent_category_id?: string;
    rank?: number;
    is_active?: boolean;
    is_internal?: boolean;
    description?: string;
    sales_channels?: string[];
    image_url?: string;
}, {
    name?: string;
    handle?: string;
    parent_category_id?: string;
    rank?: number;
    is_active?: boolean;
    is_internal?: boolean;
    description?: string;
    sales_channels?: string[];
    image_url?: string;
}>;
export type CreateCategoryTreeBody = z.infer<typeof CreateCategoryTreeBodySchema>;
