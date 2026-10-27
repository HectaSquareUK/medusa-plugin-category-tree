import { Node, Edge } from "@xyflow/react";
export declare const CARD_WIDTH = 270;
export declare const CARD_HEIGHT = 86;
export interface LayoutOptions {
    direction?: "TB" | "LR";
    nodeSep?: number;
    rankSep?: number;
}
/**
 * AAA Clustered Hierarchical Tree Layout (Buchheim/Walker style)
 * - Guarantees each parent is positioned at the exact midpoint/center of its children
 * - Guarantees subtrees never overlap and stay tightly clustered
 * - Completely eliminates long spanning cross-canvas threads
 * - Sibling order is preserved strictly according to category rank
 */
export declare function computeTreeLayout(nodes: Node[], edges: Edge[], options?: LayoutOptions): {
    nodes: Node[];
    edges: Edge[];
};
export declare const computeDagreLayout: typeof computeTreeLayout;
