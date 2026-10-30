import React from "react";
interface YoutubeTabProps {
    youtubeUrls: string[];
    newYoutubeInput: string;
    setNewYoutubeInput: (val: string) => void;
    handleAddYoutube: () => void;
    handleRemoveYoutube: (url: string) => void;
}
export declare const YoutubeTab: React.FC<YoutubeTabProps>;
export {};
