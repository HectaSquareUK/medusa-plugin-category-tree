import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { MedusaError, Modules } from "@medusajs/framework/utils"

export type CategoryMove = {
  id: string
  parent_category_id: string | null
  rank: number
}

export type ReorderCategoriesInput = {
  moves: CategoryMove[]
}

type Snapshot = {
  id: string
  parent_category_id: string | null
  rank: number
}[]

const SELECT = [
  "id",
  "name",
  "handle",
  "parent_category_id",
  "rank",
  "is_active",
  "is_internal",
]

/**
 * Rejects unknown ids and any move that would create a cycle
 * (a category ending up inside its own subtree).
 */
function assertValid(snapshot: Snapshot, moves: CategoryMove[]) {
  const parents = new Map<string, string | null>(
    snapshot.map((c) => [c.id, c.parent_category_id])
  )

  for (const m of moves) {
    if (!parents.has(m.id)) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Product category ${m.id} was not found`
      )
    }
    if (m.parent_category_id && !parents.has(m.parent_category_id)) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Parent category ${m.parent_category_id} was not found`
      )
    }
    if (m.parent_category_id === m.id) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "A category cannot be its own parent"
      )
    }
    parents.set(m.id, m.parent_category_id)
  }

  for (const id of parents.keys()) {
    let cur: string | null = id
    let steps = 0
    while (cur) {
      cur = parents.get(cur) ?? null
      if (++steps > parents.size) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "These moves would create a loop in the category tree"
        )
      }
    }
  }
}

/** Top-down, ascending-rank restore of a snapshot (used for rollback). */
function snapshotToMoves(snapshot: Snapshot): CategoryMove[] {
  const byParent = new Map<string | null, Snapshot>()
  for (const c of snapshot) {
    const list = byParent.get(c.parent_category_id) ?? []
    list.push(c)
    byParent.set(c.parent_category_id, list)
  }
  const out: CategoryMove[] = []
  const queue: (string | null)[] = [null]
  while (queue.length) {
    const parent = queue.shift()!
    const kids = (byParent.get(parent) ?? []).sort((a, b) => a.rank - b.rank)
    kids.forEach((k, i) => {
      out.push({ id: k.id, parent_category_id: parent, rank: i })
      queue.push(k.id)
    })
  }
  return out
}

export const reorderCategoriesStep = createStep(
  "reorder-categories-step",
  async (input: ReorderCategoriesInput, { container }) => {
    const productModule = container.resolve(Modules.PRODUCT)

    const before = (await productModule.listProductCategories(
      {},
      { select: ["id", "parent_category_id", "rank"], take: null }
    )) as unknown as Snapshot

    assertValid(before, input.moves)

    // Moves must be applied sequentially: each rank change shifts siblings.
    for (const m of input.moves) {
      await productModule.updateProductCategories(m.id, {
        parent_category_id: m.parent_category_id,
        rank: m.rank,
      })
    }

    const after = await productModule.listProductCategories(
      {},
      { select: SELECT, order: { rank: "ASC" }, take: null }
    )

    return new StepResponse(after, before)
  },
  async (before, { container }) => {
    if (!before) {
      return
    }
    const productModule = container.resolve(Modules.PRODUCT)
    for (const m of snapshotToMoves(before)) {
      await productModule.updateProductCategories(m.id, {
        parent_category_id: m.parent_category_id,
        rank: m.rank,
      })
    }
  }
)

export const reorderCategoriesWorkflow = createWorkflow(
  "reorder-categories",
  (input: ReorderCategoriesInput) => {
    const categories = reorderCategoriesStep(input)
    return new WorkflowResponse(categories)
  }
)
