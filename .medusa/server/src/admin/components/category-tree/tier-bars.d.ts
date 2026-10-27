import React from "react";
export interface TierBarsProps {
    tier: number;
    color?: string;
}
/**
 * Renders N vertical colored bars on the left edge of each category card,
 * providing an immediate tactile hierarchy indicator:
 * Tier 1 = 1 bar (Root/Main)
 * Tier 2 = 2 bars (Sub)
 * Tier 3 = 3 bars (Sub-Sub)
 * Tier N = N bars
 * Bar color matches the branch lineage for instant visual identification.
 */
export declare const TierBars: React.FC<TierBarsProps>;
