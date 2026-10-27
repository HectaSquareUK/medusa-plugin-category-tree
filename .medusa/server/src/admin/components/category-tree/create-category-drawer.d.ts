import React from "react";
import { CategoryTreeNode, SalesChannelInfo } from "./types";
export interface CreateCategoryDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    parentCategory: CategoryTreeNode | null;
    salesChannels: SalesChannelInfo[];
    onSuccess: (newCat: CategoryTreeNode) => void;
}
export declare const CreateCategoryDrawer: React.FC<CreateCategoryDrawerProps>;
