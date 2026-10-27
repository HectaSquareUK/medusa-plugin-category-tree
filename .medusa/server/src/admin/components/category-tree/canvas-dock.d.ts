import React from "react";
import { SalesChannelInfo } from "./types";
export interface CanvasDockProps {
    salesChannels: SalesChannelInfo[];
    selectedStorefront: string;
    onSelectStorefront: (val: string) => void;
    direction: "TB" | "LR";
    onToggleDirection: () => void;
    onSelectDirection?: (val: "TB" | "LR") => void;
    searchQuery: string;
    onSearchChange: (q: string) => void;
    onExpandAll: () => void;
    onCollapseAll: () => void;
    onFocusRoot: () => void;
    selectedCount?: number;
    onExpandSelected?: () => void;
    onCollapseSelected?: () => void;
    isBoxSelect?: boolean;
    onToggleBoxSelect?: () => void;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onFitView: () => void;
    onOpenCreateRoot: () => void;
    dirtyCount: number;
    isSaving: boolean;
    onSave: () => void;
    onReset: () => void;
}
export declare const CanvasDock: React.FC<CanvasDockProps>;
