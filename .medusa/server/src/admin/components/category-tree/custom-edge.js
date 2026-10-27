"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomSmoothStepEdge = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_2 = require("@xyflow/react");
exports.CustomSmoothStepEdge = (0, react_1.memo)((props) => {
    const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, data, markerEnd, selected, } = props;
    const branchColor = data?.branchColor || style?.stroke || "#64748b";
    const [edgePath] = (0, react_2.getSmoothStepPath)({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        borderRadius: 16,
    });
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("path", { d: edgePath, fill: "none", strokeOpacity: 0, strokeWidth: 20, className: "react-flow__edge-interaction cursor-pointer" }), (0, jsx_runtime_1.jsx)(react_2.BaseEdge, { id: id, path: edgePath, markerEnd: markerEnd, style: {
                    ...style,
                    stroke: selected ? "#2563eb" : branchColor,
                    strokeWidth: selected ? 2.75 : 2,
                    strokeOpacity: 0.95,
                    transition: "stroke 0.2s, stroke-width 0.2s",
                } })] }));
});
exports.CustomSmoothStepEdge.displayName = "CustomSmoothStepEdge";
