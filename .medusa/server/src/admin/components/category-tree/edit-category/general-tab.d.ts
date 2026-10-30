import React from "react";
interface GeneralTabProps {
    name: string;
    setName: (val: string) => void;
    handle: string;
    setHandle: (val: string) => void;
    rank: number;
    setRank: React.Dispatch<React.SetStateAction<number>>;
    description: string;
    setDescription: (val: string) => void;
    isActive: boolean;
    setIsActive: (val: boolean) => void;
    isInternal: boolean;
    setIsInternal: (val: boolean) => void;
    onDirty: () => void;
    onDelete: () => void;
    isDeleting: boolean;
}
export declare const GeneralTab: React.FC<GeneralTabProps>;
export {};
