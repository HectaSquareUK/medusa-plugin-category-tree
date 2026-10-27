export type SalesChannelInfo = {
    id: string;
    name: string;
    description?: string;
};
export type CategoryTreeNode = {
    id: string;
    name: string;
    handle: string;
    description?: string | null;
    parent_category_id: string | null;
    rank: number;
    is_active: boolean;
    is_internal: boolean;
    metadata: Record<string, unknown> | null;
    image_url: string | null;
    sales_channels: string[];
    tier: number;
    sibling_rank: number;
    children_count: number;
    has_children: boolean;
    branch_color?: string;
};
export type CategoryTreeResponse = {
    categories: CategoryTreeNode[];
    sales_channels: SalesChannelInfo[];
    count: number;
};
export type CategoryMoveItem = {
    id: string;
    parent_category_id: string | null;
    rank: number;
};
export type CategoryNodeData = {
    category: CategoryTreeNode;
    tier: number;
    siblingRank: number;
    superscriptRank: string;
    branchColor?: string;
    salesChannels: SalesChannelInfo[];
    isCollapsed: boolean;
    hiddenDescendantCount: number;
    direction: "TB" | "LR";
    isDimmed: boolean;
    onToggleCollapse: (id: string) => void;
    onAddChild: (parent: CategoryTreeNode) => void;
    onEdit: (category: CategoryTreeNode) => void;
    onDetach: (id: string) => void;
    onMoveSiblingUp?: (id: string) => void;
    onMoveSiblingDown?: (id: string) => void;
};
