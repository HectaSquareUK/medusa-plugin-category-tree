import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { ReorderCategoryBodySchema } from "../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const parsed = ReorderCategoryBodySchema.safeParse(req.body)
  if (!parsed.success) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      parsed.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")
    )
  }

  const { moves } = parsed.data
  const productModule = req.scope.resolve(Modules.PRODUCT)

  const existing = await productModule.listProductCategories(
    {},
    { select: ["id", "parent_category_id", "rank", "metadata"], take: null }
  )
  const existingMap = new Map<
    string,
    { parent_category_id: string | null; rank: number; metadata?: any }
  >(
    existing.map((c: any) => [
      c.id,
      { parent_category_id: c.parent_category_id, rank: c.rank, metadata: c.metadata },
    ])
  )

  const simulatedParents = new Map<string, string | null>()
  for (const [id, data] of existingMap.entries()) {
    simulatedParents.set(id, data.parent_category_id)
  }

  for (const m of moves) {
    if (!existingMap.has(m.id)) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Category ${m.id} does not exist`
      )
    }
    if (m.parent_category_id && !existingMap.has(m.parent_category_id)) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Parent category ${m.parent_category_id} does not exist`
      )
    }
    if (m.id === m.parent_category_id) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "A category cannot be its own parent"
      )
    }
    simulatedParents.set(m.id, m.parent_category_id)
  }

  for (const id of simulatedParents.keys()) {
    let cur: string | null = id
    let steps = 0
    while (cur) {
      cur = simulatedParents.get(cur) ?? null
      if (++steps > simulatedParents.size) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Cycle detected in category hierarchy"
        )
      }
    }
  }

  const applied: string[] = []
  try {
    for (const m of moves) {
      const prevMeta = existingMap.get(m.id)?.metadata || {}
      await productModule.updateProductCategories(m.id, {
        parent_category_id: m.parent_category_id,
        rank: m.rank,
        metadata: {
          ...prevMeta,
          rank: m.rank,
          sibling_rank: m.rank + 1,
        },
      })
      applied.push(m.id)
    }
  } catch (err: any) {
    for (const id of applied) {
      const prev = existingMap.get(id)
      if (prev) {
        try {
          await productModule.updateProductCategories(id, {
            parent_category_id: prev.parent_category_id,
            rank: prev.rank,
          })
        } catch {
          // ignore
        }
      }
    }
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      `Failed to apply category reorder: ${err.message}`
    )
  }

  res.json({
    success: true,
    updated_count: moves.length,
  })
}
