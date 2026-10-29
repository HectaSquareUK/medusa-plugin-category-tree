"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeDagreLayout = exports.CARD_HEIGHT = exports.CARD_WIDTH = void 0;
exports.computeTreeLayout = computeTreeLayout;
const react_1 = require("@xyflow/react");
const tree_state_1 = require("./tree-state");
exports.CARD_WIDTH = 270;
exports.CARD_HEIGHT = 86;
/**
 * AAA Clustered Hierarchical Tree Layout (Buchheim/Walker style)
 * - Guarantees each parent is positioned at the exact midpoint/center of its children
 * - Guarantees subtrees never overlap and stay tightly clustered
 * - Completely eliminates long spanning cross-canvas threads
 * - Sibling order is preserved strictly according to category rank
 */
function computeTreeLayout(nodes, edges, options = {}) {
    if (nodes.length === 0)
        return { nodes: [], edges: [] };
    const direction = options.direction || "TB";
    const isTB = direction === "TB";
    const nodeSep = options.nodeSep ?? (isTB ? 40 : 28);
    const rankSep = options.rankSep ?? (isTB ? 70 : 80);
    const treeGap = isTB ? 80 : 64;
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const childrenMap = new Map();
    const parentMap = new Map();
    edges.forEach((edge) => {
        if (nodeMap.has(edge.source) && nodeMap.has(edge.target)) {
            const list = childrenMap.get(edge.source) || [];
            list.push(edge.target);
            childrenMap.set(edge.source, list);
            parentMap.set(edge.target, edge.source);
        }
    });
    // Identify roots (nodes with no incoming edge in the visible graph)
    const rootNodes = nodes.filter((n) => !parentMap.has(n.id)).sort((a, b) => {
        const catA = a.data?.category || { id: a.id };
        const catB = b.data?.category || { id: b.id };
        return (0, tree_state_1.compareCategories)(catA, catB);
    });
    function buildTree(id, depth) {
        const rawNode = nodeMap.get(id);
        const childIds = (childrenMap.get(id) || []).sort((aId, bId) => {
            const catA = nodeMap.get(aId)?.data?.category || { id: aId };
            const catB = nodeMap.get(bId)?.data?.category || { id: bId };
            return (0, tree_state_1.compareCategories)(catA, catB);
        });
        const children = childIds.map((childId) => buildTree(childId, depth + 1));
        return {
            id,
            node: rawNode,
            children,
            depth,
            span: 0,
            primaryCoord: 0,
            secondaryCoord: 0,
        };
    }
    // 1. Post-order pass: Compute subtree span (width in TB, height in LR)
    function computeSpan(treeNode) {
        const baseSpan = isTB ? exports.CARD_WIDTH : exports.CARD_HEIGHT;
        if (treeNode.children.length === 0) {
            treeNode.span = baseSpan;
            return baseSpan;
        }
        let childrenSpanTotal = 0;
        treeNode.children.forEach((child, index) => {
            const childSpan = computeSpan(child);
            childrenSpanTotal += childSpan + (index > 0 ? nodeSep : 0);
        });
        treeNode.span = Math.max(baseSpan, childrenSpanTotal);
        return treeNode.span;
    }
    // 2. Pre-order pass: Position nodes
    function assignPositions(treeNode, startOffset, depth) {
        const baseSpan = isTB ? exports.CARD_WIDTH : exports.CARD_HEIGHT;
        const baseSecondary = isTB ? exports.CARD_HEIGHT : exports.CARD_WIDTH;
        treeNode.secondaryCoord = depth * (baseSecondary + rankSep);
        if (treeNode.children.length === 0) {
            treeNode.primaryCoord = startOffset + (treeNode.span - baseSpan) / 2;
            return;
        }
        let currentOffset = startOffset;
        treeNode.children.forEach((child) => {
            assignPositions(child, currentOffset, depth + 1);
            currentOffset += child.span + nodeSep;
        });
        // Center parent directly between first and last child
        const firstChild = treeNode.children[0];
        const lastChild = treeNode.children[treeNode.children.length - 1];
        const centerOfChildren = (firstChild.primaryCoord + lastChild.primaryCoord) / 2;
        treeNode.primaryCoord = centerOfChildren;
    }
    const positionedNodes = [];
    let globalOffset = 0;
    rootNodes.forEach((root) => {
        const tree = buildTree(root.id, 0);
        computeSpan(tree);
        assignPositions(tree, globalOffset, 0);
        globalOffset += tree.span + treeGap;
        // Flatten tree
        function collect(node) {
            const x = isTB ? node.primaryCoord : node.secondaryCoord;
            const y = isTB ? node.secondaryCoord : node.primaryCoord;
            positionedNodes.push({
                ...node.node,
                targetPosition: isTB ? react_1.Position.Top : react_1.Position.Left,
                sourcePosition: isTB ? react_1.Position.Bottom : react_1.Position.Right,
                position: { x, y },
            });
            node.children.forEach(collect);
        }
        collect(tree);
    });
    // Style edges to match branch color
    const styledEdges = edges.map((e) => {
        const sourceNode = nodeMap.get(e.source);
        const targetNode = nodeMap.get(e.target);
        const branchColor = e.data?.branchColor ||
            targetNode?.data?.branchColor ||
            sourceNode?.data?.branchColor ||
            "#64748b";
        return {
            ...e,
            data: {
                ...e.data,
                branchColor,
            },
            style: {
                ...e.style,
                stroke: branchColor,
                strokeWidth: 2,
                opacity: 0.95,
            },
        };
    });
    return { nodes: positionedNodes, edges: styledEdges };
}
// Keep computeDagreLayout as alias to guarantee backwards compatibility
exports.computeDagreLayout = computeTreeLayout;
