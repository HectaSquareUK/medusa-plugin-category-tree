import React, { memo } from "react"
import { BaseEdge, EdgeProps, getSmoothStepPath } from "@xyflow/react"

export const CustomSmoothStepEdge = memo((props: EdgeProps) => {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    data,
    markerEnd,
    selected,
  } = props

  const branchColor = (data as any)?.branchColor || (style as any)?.stroke || "#64748b"

  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 16,
  })

  return (
    <>
      <path
        d={edgePath}
        fill="none"
        strokeOpacity={0}
        strokeWidth={20}
        className="react-flow__edge-interaction cursor-pointer"
      />

      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: selected ? "#2563eb" : branchColor,
          strokeWidth: selected ? 2.75 : 2,
          strokeOpacity: 0.95,
          transition: "stroke 0.2s, stroke-width 0.2s",
        }}
      />
    </>
  )
})

CustomSmoothStepEdge.displayName = "CustomSmoothStepEdge"
