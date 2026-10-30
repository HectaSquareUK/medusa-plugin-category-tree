"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractYouTubeVideoId = extractYouTubeVideoId;
function extractYouTubeVideoId(url) {
    if (!url || typeof url !== "string")
        return null;
    const trimmed = url.trim();
    const patterns = [
        /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/i,
        /(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/i,
        /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/i,
        /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/i,
    ];
    for (const pattern of patterns) {
        const match = trimmed.match(pattern);
        if (match && match[1])
            return match[1];
    }
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed) && !/^[A-Za-z]{11}$/.test(trimmed))
        return trimmed;
    return null;
}
