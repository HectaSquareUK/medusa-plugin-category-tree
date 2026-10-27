import { z } from "zod"

export const ReorderCategoryMoveSchema = z.object({
  id: z.string().min(1),
  parent_category_id: z.string().min(1).nullable(),
  rank: z.number().int().min(0),
})

export const ReorderCategoryBodySchema = z.object({
  moves: z.array(ReorderCategoryMoveSchema).min(1).max(2000),
})

export type ReorderCategoryBody = z.infer<typeof ReorderCategoryBodySchema>

export const CreateCategoryTreeBodySchema = z.object({
  name: z.string().min(1, "Name is required"),
  handle: z.string().optional(),
  description: z.string().optional(),
  parent_category_id: z.string().nullable().optional(),
  rank: z.number().int().min(0).optional(),
  is_active: z.boolean().default(true),
  is_internal: z.boolean().default(false),
  sales_channels: z.array(z.string()).optional(),
  image_url: z.string().optional(),
})

export type CreateCategoryTreeBody = z.infer<typeof CreateCategoryTreeBodySchema>
