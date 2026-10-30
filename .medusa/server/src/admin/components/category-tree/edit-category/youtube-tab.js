"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.YoutubeTab = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const ui_1 = require("@medusajs/ui");
const icons_1 = require("@medusajs/icons");
const types_1 = require("./types");
const YoutubeTab = ({ youtubeUrls, newYoutubeInput, setNewYoutubeInput, handleAddYoutube, handleRemoveYoutube, }) => {
    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h4", { className: "text-xs font-semibold text-ui-fg-base", children: "Category Demonstration Videos (YouTube)" }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-ui-fg-muted mt-0.5", children: "Attach YouTube video demonstration links to show interactive video carousels on the storefront category page." })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 w-full", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex-1 min-w-[360px] sm:min-w-[500px]", children: (0, jsx_runtime_1.jsx)(ui_1.Input, { size: "small", placeholder: "Paste YouTube watch URL, shorts, or video ID\u2026", value: newYoutubeInput, onChange: (e) => setNewYoutubeInput(e.target.value), className: "w-full text-xs", onKeyDown: (e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleAddYoutube();
                                }
                            } }) }), (0, jsx_runtime_1.jsxs)(ui_1.Button, { size: "small", type: "button", variant: "secondary", onClick: handleAddYoutube, className: "flex items-center gap-1 text-xs flex-shrink-0", children: [(0, jsx_runtime_1.jsx)(icons_1.Plus, { className: "w-3.5 h-3.5" }), (0, jsx_runtime_1.jsx)("span", { children: "Add Video" })] })] }), youtubeUrls.length === 0 ? ((0, jsx_runtime_1.jsx)("div", { className: "p-8 text-center text-xs text-ui-fg-muted border border-dashed border-ui-border-base rounded-xl", children: "No demonstration videos attached yet." })) : ((0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-2 gap-3", children: youtubeUrls.map((url) => {
                    const id = (0, types_1.extractYouTubeVideoId)(url);
                    const thumb = id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
                    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col border border-ui-border-base rounded-xl overflow-hidden bg-ui-bg-subtle/40 shadow-xs", children: [(0, jsx_runtime_1.jsxs)("div", { className: "relative aspect-video bg-black/80 overflow-hidden flex items-center justify-center", children: [thumb ? ((0, jsx_runtime_1.jsx)("img", { src: thumb, alt: "YouTube Preview", className: "w-full h-full object-cover" })) : ((0, jsx_runtime_1.jsx)("span", { className: "text-xs text-white", children: "Video" })), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => handleRemoveYoutube(url), className: "absolute top-1.5 right-1.5 p-1 bg-black/70 hover:bg-rose-600 text-white rounded-full transition-colors cursor-pointer", title: "Remove video", children: (0, jsx_runtime_1.jsx)(icons_1.Trash, { className: "w-3 h-3" }) })] }), (0, jsx_runtime_1.jsx)("div", { className: "p-2", children: (0, jsx_runtime_1.jsx)("span", { className: "text-[10px] text-ui-fg-muted truncate block font-mono", title: url, children: url }) })] }, url));
                }) }))] }));
};
exports.YoutubeTab = YoutubeTab;
