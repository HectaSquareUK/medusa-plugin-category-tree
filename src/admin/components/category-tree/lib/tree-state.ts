import { Node, Edge } from "@xyflow/react"
import { CategoryTreeNode, CategoryMoveItem } from "../types"

const SUPERSCRIPT_MAP: Record<string, string> = {
  "0": "⁰",
  "1": "¹",
  "2": "²",
  "3": "³",
  "4": "⁴",
  "5": "⁵",
  "6": "⁶",
  "7": "⁷",
  "8": "⁸",
  "9": "⁹",
}

export function toSuperscript(num: number): string {
  return num
    .toString()
    .split("")
    .map((digit) => SUPERSCRIPT_MAP[digit] || digit)
    .join("")
}

export function computeTiers(
  categories: CategoryTreeNode[]
): Map<string, number> {
  const itemMap = new Map(categories.map((c) => [c.id, c]))
  const tierMap = new Map<string, number>()

  function getTier(id: string, visited: Set<string>): number {
    if (tierMap.has(id)) return tierMap.get(id)!
    if (visited.has(id)) return 1

    visited.add(id)
    const item = itemMap.get(id)
    if (!item || !item.parent_category_id || !itemMap.has(item.parent_category_id)) {
      tierMap.set(id, 1)
      return 1
    }

    const parentTier = getTier(item.parent_category_id, visited)
    const tier = parentTier + 1
    tierMap.set(id, tier)
    return tier
  }

  for (const c of categories) {
    getTier(c.id, new Set())
  }

  return tierMap
}

export function compareCategories(
  a: { rank?: number; name?: string; id?: string },
  b: { rank?: number; name?: string; id?: string }
): number {
  const rankA = typeof a.rank === "number" ? a.rank : 9999
  const rankB = typeof b.rank === "number" ? b.rank : 9999
  if (rankA !== rankB) return rankA - rankB
  const nameA = (a.name || "").trim()
  const nameB = (b.name || "").trim()
  const nameComp = nameA.localeCompare(nameB)
  if (nameComp !== 0) return nameComp
  return (a.id || "").localeCompare(b.id || "")
}

export function computeSiblingRanks(
  categories: CategoryTreeNode[]
): Map<string, { rankNum: number; superscript: string }> {
  const grouped = new Map<string | null, CategoryTreeNode[]>()

  for (const c of categories) {
    const p = c.parent_category_id || null
    const list = grouped.get(p) || []
    list.push(c)
    grouped.set(p, list)
  }

  const result = new Map<string, { rankNum: number; superscript: string }>()

  for (const [, list] of grouped.entries()) {
    list.sort(compareCategories)
    list.forEach((item, index) => {
      const rankNum = index + 1
      result.set(item.id, {
        rankNum,
        superscript: toSuperscript(rankNum),
      })
    })
  }

  return result
}

export function wouldCreateCycle(
  categories: CategoryTreeNode[],
  draggedId: string,
  targetParentId: string | null
): boolean {
  if (!targetParentId) return false
  if (draggedId === targetParentId) return true

  const parentMap = new Map(categories.map((c) => [c.id, c.parent_category_id]))
  parentMap.set(draggedId, targetParentId)

  let cur: string | null = targetParentId
  let steps = 0
  const maxSteps = categories.length + 2

  while (cur && steps++ < maxSteps) {
    if (cur === draggedId) return true
    cur = parentMap.get(cur) ?? null
  }

  return false
}

export function computeSubtreeIds(
  rootId: string,
  childrenMap: Map<string, string[]>
): Set<string> {
  const descendantIds = new Set<string>()
  const queue = [...(childrenMap.get(rootId) || [])]

  while (queue.length > 0) {
    const curr = queue.shift()!
    descendantIds.add(curr)
    const kids = childrenMap.get(curr) || []
    queue.push(...kids)
  }

  return descendantIds
}

export function getVisibleTree(
  allNodes: Node[],
  allEdges: Edge[],
  collapsedIds: Set<string>,
  childrenMap: Map<string, string[]>
): { visibleNodes: Node[]; visibleEdges: Edge[] } {
  const hiddenIds = new Set<string>()

  for (const collapsedId of collapsedIds) {
    const descendants = computeSubtreeIds(collapsedId, childrenMap)
    descendants.forEach((id) => hiddenIds.add(id))
  }

  const visibleNodes = allNodes.filter((n) => !hiddenIds.has(n.id))
  const visibleNodeIdSet = new Set(visibleNodes.map((n) => n.id))

  const visibleEdges = allEdges.filter(
    (e) => visibleNodeIdSet.has(e.source) && visibleNodeIdSet.has(e.target)
  )

  return { visibleNodes, visibleEdges }
}

export function computeMoves(
  original: CategoryTreeNode[],
  current: CategoryTreeNode[]
): CategoryMoveItem[] {
  const origMap = new Map(original.map((c) => [c.id, c]))
  const moves: CategoryMoveItem[] = []

  for (const c of current) {
    const orig = origMap.get(c.id)
    if (!orig) continue

    if (orig.parent_category_id !== c.parent_category_id || orig.rank !== c.rank) {
      moves.push({
        id: c.id,
        parent_category_id: c.parent_category_id,
        rank: c.rank,
      })
    }
  }

  return moves
}

export const BRANCH_PALETTE: { name: string; hex: string }[] = [
  { name: "Emerald", hex: "#10b981" },
  { name: "Indigo", hex: "#6366f1" },
  { name: "Amber", hex: "#f59e0b" },
  { name: "Rose", hex: "#f43f5e" },
  { name: "Cyan", hex: "#06b6d4" },
  { name: "Violet", hex: "#8b5cf6" },
  { name: "Pink", hex: "#ec4899" },
  { name: "Lime", hex: "#84cc16" },
  { name: "Sky", hex: "#0ea5e9" },
  { name: "Orange", hex: "#f97316" },
  { name: "Teal", hex: "#14b8a6" },
  { name: "Purple", hex: "#a855f7" },
]

/**
 * Assigns a deterministic branch color to each category based on its top-level root ancestor.
 * All descendants in a root branch share the exact same branch color.
 */
export function computeBranchColors(
  categories: CategoryTreeNode[]
): Map<string, string> {
  const catMap = new Map(categories.map((c) => [c.id, c]))
  const rootMap = new Map<string, string>()

  function findRootId(id: string, visited: Set<string>): string {
    if (rootMap.has(id)) return rootMap.get(id)!
    if (visited.has(id)) return id
    visited.add(id)

    const cat = catMap.get(id)
    if (!cat || !cat.parent_category_id || !catMap.has(cat.parent_category_id)) {
      rootMap.set(id, id)
      return id
    }

    const root = findRootId(cat.parent_category_id, visited)
    rootMap.set(id, root)
    return root
  }

  for (const c of categories) {
    findRootId(c.id, new Set())
  }

  const rootIds = Array.from(
    new Set(categories.filter((c) => !c.parent_category_id).map((c) => c.id))
  ).sort((a, b) => {
    const catA = catMap.get(a)
    const catB = catMap.get(b)
    return (catA?.rank ?? 0) - (catB?.rank ?? 0) || a.localeCompare(b)
  })

  const rootColorMap = new Map<string, string>()
  rootIds.forEach((id, index) => {
    rootColorMap.set(id, BRANCH_PALETTE[index % BRANCH_PALETTE.length].hex)
  })

  const result = new Map<string, string>()
  for (const c of categories) {
    const rootId = rootMap.get(c.id) || c.id
    const color = rootColorMap.get(rootId) || BRANCH_PALETTE[0].hex
    result.set(c.id, color)
  }

  return result
}

/**
 * Swaps sibling ranking (up or down). Modifies rank property among siblings
 * and returns a new categories array ready for preview and commit, along with
 * explicit contiguous moves for all siblings in the group.
 */
export function moveSiblingRank(
  categories: CategoryTreeNode[],
  targetId: string,
  direction: "up" | "down"
): {
  nextCategories: CategoryTreeNode[]
  siblingMoves: Array<{ id: string; parent_category_id: string | null; rank: number }>
} {
  const target = categories.find((c) => c.id === targetId)
  if (!target) return { nextCategories: categories, siblingMoves: [] }

  const parentId = target.parent_category_id || null
  const siblings = categories
    .filter((c) => (c.parent_category_id || null) === parentId)
    .sort(compareCategories)

  const currentIndex = siblings.findIndex((s) => s.id === targetId)
  if (currentIndex === -1) return { nextCategories: categories, siblingMoves: [] }

  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
  if (targetIndex < 0 || targetIndex >= siblings.length) return { nextCategories: categories, siblingMoves: [] }

  // Swap target and adjacent within ordered sibling list
  const reordered = [...siblings]
  const temp = reordered[currentIndex]
  reordered[currentIndex] = reordered[targetIndex]
  reordered[targetIndex] = temp

  // Normalize contiguous ranks: 0, 1, 2, 3...
  const updatedRanks = new Map<string, number>()
  const siblingMoves: Array<{ id: string; parent_category_id: string | null; rank: number }> = []

  reordered.forEach((s, idx) => {
    updatedRanks.set(s.id, idx)
    siblingMoves.push({
      id: s.id,
      parent_category_id: parentId,
      rank: idx,
    })
  })

  const nextCategories = categories.map((c) => {
    if (updatedRanks.has(c.id)) {
      return { ...c, rank: updatedRanks.get(c.id)! }
    }
    return c
  })

  return { nextCategories, siblingMoves }
}
