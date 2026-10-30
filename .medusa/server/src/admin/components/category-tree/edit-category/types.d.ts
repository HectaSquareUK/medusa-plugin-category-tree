export interface GalleryImage {
    id?: string;
    url: string;
    type?: "thumbnail" | "banner" | "image" | string;
    file_id?: string;
}
export type EditTab = "general" | "products" | "channels" | "youtube";
export interface SaveNotification {
    type: "success" | "error";
    message: string;
}
export declare function extractYouTubeVideoId(url: string): string | null;
