import React from "react";
export interface CategoryProductsManagerProps {
    categoryId: string;
    categoryName: string;
    initialMetadata?: Record<string, any> | null;
    onMetadataUpdate?: (updatedMetadata: Record<string, any>) => void;
}
export declare const CategoryProductsManager: React.FC<CategoryProductsManagerProps>;
