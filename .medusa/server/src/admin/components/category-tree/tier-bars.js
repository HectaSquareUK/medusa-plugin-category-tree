"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TierBars = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
/**
 * Renders N vertical colored bars on the left edge of each category card,
 * providing an immediate tactile hierarchy indicator:
 * Tier 1 = 1 bar (Root/Main)
 * Tier 2 = 2 bars (Sub)
 * Tier 3 = 3 bars (Sub-Sub)
 * Tier N = N bars
 * Bar color matches the branch lineage for instant visual identification.
 */
const TierBars = ({ tier, color }) => {
    const count = Math.max(1, tier);
    const barColor = color || "var(--fg-interactive, #3b82f6)";
    return ((0, jsx_runtime_1.jsx)("div", { className: "flex h-full py-2 pl-2 pr-1.5 gap-[2.5px] items-stretch flex-shrink-0 select-none bg-neutral-50 dark:bg-neutral-900/60 rounded-l-xl border-r border-ui-border-base/50", title: `Tier ${tier} (${tier === 1 ? "Main Root Category" : tier === 2 ? "Subcategory" : "Sub-subcategory"}) - Branch Color: ${barColor}`, children: Array.from({ length: count }).map((_, index) => ((0, jsx_runtime_1.jsx)("span", { className: "w-[3.5px] rounded-full shadow-xs transition-colors", style: {
                backgroundColor: barColor,
                boxShadow: `0 0 4px ${barColor}40`,
            } }, index))) }));
};
exports.TierBars = TierBars;
