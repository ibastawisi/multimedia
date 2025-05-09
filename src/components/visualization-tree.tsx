"use client"

import { useEffect, useRef, useState } from "react"

interface TreeNode {
  id: string
  name: string
  value: number
  code?: string
  splitIndex?: number
  leftSum?: number
  rightSum?: number
  children: TreeNode[]
}

interface VisualizationTreeProps {
  treeData: TreeNode | null
  currentPartition: any
  currentStep: string
}

export default function VisualizationTree({ treeData, currentPartition, currentStep }: VisualizationTreeProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })

  // Update dimensions on window resize
  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current) {
        const containerWidth = svgRef.current.parentElement?.clientWidth || 800
        setDimensions({
          width: containerWidth,
          height: Math.max(500, treeData ? calculateTreeHeight(treeData) * 100 : 300),
        })
      }
    }

    updateDimensions()
    window.addEventListener("resize", updateDimensions)
    return () => window.removeEventListener("resize", updateDimensions)
  }, [treeData])

  // Calculate the maximum depth of the tree
  const calculateTreeHeight = (node: TreeNode): number => {
    if (node.children.length === 0) return 1
    return 1 + Math.max(...node.children.map(calculateTreeHeight))
  }

  // Render the tree recursively
  const renderTree = (node: TreeNode, x: number, y: number, width: number, depth = 0) => {
    const nodeRadius = 30
    const verticalSpacing = 100
    const textOffset = 5
    const isHighlighted = currentPartition && currentPartition.chars.join(",") === node.name.split(", ").join(",")

    // Calculate positions for children
    const childrenElements = []
    const edgeElements = []

    if (node.children.length > 0) {
      const childWidth = width / node.children.length

      for (let i = 0; i < node.children.length; i++) {
        const childX = x - width / 2 + childWidth / 2 + i * childWidth
        const childY = y + verticalSpacing

        // Draw edge
        const edgeColor = i === 0 ? "#3b82f6" : "#ef4444"
        const bitLabel = i === 0 ? "0" : "1"

        edgeElements.push(
          <g key={`edge-${node.id}-${i}`}>
            <line
              x1={x}
              y1={y}
              x2={childX}
              y2={childY}
              stroke={edgeColor}
              strokeWidth={2}
              strokeDasharray={isHighlighted ? "5,5" : "none"}
            />
            <circle cx={(x + childX) / 2} cy={(y + childY) / 2} r={12} fill="white" stroke={edgeColor} />
            <text
              x={(x + childX) / 2}
              y={(y + childY) / 2 + textOffset}
              textAnchor="middle"
              fontSize={12}
              fill={edgeColor}
              fontWeight="bold"
            >
              {bitLabel}
            </text>
          </g>,
        )

        // Recursively render child and its subtree
        const childElements = renderTree(node.children[i], childX, childY, childWidth, depth + 1)
        childrenElements.push(...childElements)
      }
    }

    // Determine node color based on state
    let nodeColor = "#e5e7eb" // Default gray
    const textColor = "#1f2937"
    let strokeColor = "#9ca3af"
    let strokeWidth = 1

    if (isHighlighted) {
      nodeColor = "#fef3c7" // Amber light
      strokeColor = "#f59e0b" // Amber
      strokeWidth = 3
    } else if (node.children.length === 0 && node.code) {
      nodeColor = "#dcfce7" // Green light
      strokeColor = "#10b981" // Green
    }

    // Create the node element
    const nodeElement = (
      <g key={node.id}>
        <circle cx={x} cy={y} r={nodeRadius} fill={nodeColor} stroke={strokeColor} strokeWidth={strokeWidth} />

        <text x={x} y={y - 5} textAnchor="middle" fontSize={node.name.length > 5 ? 10 : 12} fill={textColor}>
          {node.name}
        </text>

        <text x={x} y={y + 12} textAnchor="middle" fontSize={10} fill={textColor}>
          {node.value}
        </text>

        {node.code && (
          <text x={x} y={y + nodeRadius + 20} textAnchor="middle" fontSize={12} fill="#6366f1" fontWeight="bold">
            Code: {node.code}
          </text>
        )}

        {isHighlighted && node.splitIndex !== undefined && node.splitIndex !== null && (
          <line
            x1={x - nodeRadius}
            y1={y + nodeRadius + 35}
            x2={x + nodeRadius}
            y2={y + nodeRadius + 35}
            stroke="#9ca3af"
            strokeWidth={1}
          />
        )}

        {isHighlighted && node.leftSum !== undefined && node.rightSum !== undefined && (
          <>
            <text x={x - 15} y={y + nodeRadius + 45} textAnchor="middle" fontSize={10} fill="#3b82f6">
              {node.leftSum}
            </text>
            <text x={x} y={y + nodeRadius + 45} textAnchor="middle" fontSize={10} fill="#9ca3af">
              |
            </text>
            <text x={x + 15} y={y + nodeRadius + 45} textAnchor="middle" fontSize={10} fill="#ef4444">
              {node.rightSum}
            </text>
          </>
        )}
      </g>
    )

    return [nodeElement, ...edgeElements, ...childrenElements]
  }

  if (!treeData) {
    return (
      <div className="flex items-center justify-center h-[300px] bg-gray-50 rounded-md border">
        <p className="text-gray-500">
          {currentStep === "idle"
            ? "Start the algorithm to see the visualization."
            : "Building the Shannon-Fano tree..."}
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
      >
        <g transform={`translate(${dimensions.width / 2}, 50)`}>{renderTree(treeData, 0, 0, dimensions.width * 0.8)}</g>
      </svg>

      <div className="mt-4 flex flex-wrap gap-4 justify-center">
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full bg-e5e7eb border border-9ca3af mr-2"></div>
          <span className="text-sm">Regular Node</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full bg-fef3c7 border-2 border-f59e0b mr-2"></div>
          <span className="text-sm">Current Partition</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full bg-dcfce7 border border-10b981 mr-2"></div>
          <span className="text-sm">Leaf Node (Final Code)</span>
        </div>
        <div className="flex items-center">
          <div className="flex items-center mr-2">
            <div className="w-3 h-3 rounded-full bg-white border border-3b82f6 flex items-center justify-center">
              <span className="text-xs text-3b82f6">0</span>
            </div>
          </div>
          <span className="text-sm">Left Branch (0)</span>
        </div>
        <div className="flex items-center">
          <div className="flex items-center mr-2">
            <div className="w-3 h-3 rounded-full bg-white border border-ef4444 flex items-center justify-center">
              <span className="text-xs text-ef4444">1</span>
            </div>
          </div>
          <span className="text-sm">Right Branch (1)</span>
        </div>
      </div>
    </div>
  )
}
