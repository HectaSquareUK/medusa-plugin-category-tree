import React from "react";
import { CategoryNodeData } from "./types";
interface CategoryNodeProps {
    id: string;
    data: CategoryNodeData;
    selected?: boolean;
}
export declare const CategoryNode: React.MemoExoticComponent<({ id, data, selected }: CategoryNodeProps) => import("react/jsx-runtime").JSX.Element>;
export {};
