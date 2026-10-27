import React from "react";
import { CategoryTreeNode, SalesChannelInfo } from "./types";
export interface EditCategoryDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    category: CategoryTreeNode | null;
    salesChannels: SalesChannelInfo[];
    onSuccess: (updatedCat: CategoryTreeNode) => void;
    onDeleteSuccess: (deletedId: string) => void;
}
export declare const EditCategoryDrawer: React.FC<EditCategoryDrawerProps>;
