import React from "react";
import { SalesChannelInfo } from "../types";
import { GalleryImage } from "./types";
interface MediaTabProps {
    salesChannels: SalesChannelInfo[];
    selectedChannels: string[];
    toggleChannel: (channelId: string) => void;
    categoryImages: GalleryImage[];
    imageUrl: string;
    isUploading: boolean;
    handleFileUpload: (files: FileList | null) => void;
    handleSetThumbnail: (img: GalleryImage) => void;
    handleSetBanner: (img: GalleryImage) => void;
    handleDeleteImage: (img: GalleryImage) => void;
    manualImageUrl: string;
    setManualImageUrl: (url: string) => void;
    handleAddManualImage: () => void;
}
export declare const MediaTab: React.FC<MediaTabProps>;
export {};
