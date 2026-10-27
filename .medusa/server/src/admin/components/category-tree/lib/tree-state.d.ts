import { Node, Edge } from "@xyflow/react";
import { CategoryTreeNode, CategoryMoveItem } from "../types";
export declare function toSuperscript(num: number): string;
export declare function computeTiers(categories: CategoryTreeNode[]): Map<string, number>;
export declare function computeSiblingRanks(categories: CategoryTreeNode[]): Map<string, {
    rankNum: number;
    superscript: string;
}>;
export declare function wouldCreateCycle(categories: CategoryTreeNode[], draggedId: string, targetParentId: string | null): boolean;
export declare function computeSubtreeIds(rootId: string, childrenMap: Map<string, string[]>): Set<string>;
export declare function getVisibleTree(allNodes: Node[], allEdges: Edge[], collapsedIds: Set<string>, childrenMap: Map<string, string[]>): {
    visibleNodes: Node[];
    visibleEdges: Edge[];
};
export declare function computeMoves(original: CategoryTreeNode[], current: CategoryTreeNode[]): CategoryMoveItem[];
export declare const BRANCH_PALETTE: {
    name: string;
    hex: string;
}[];
/**
 * Assigns a deterministic branch color to each category based on its top-level root ancestor.
 * All descendants in a root branch share the exact same branch color.
 */
export declare function computeBranchColors(categories: CategoryTreeNode[]): Map<string, string>;
/**
 * Swaps sibling ranking (up or down). Modifies rank property among siblings
 * and returns a new categories array ready for preview and commit.
 */
export declare function moveSiblingRank(categories: CategoryTreeNode[], targetId: string, direction: "up" | "down"): CategoryTreeNode[];
