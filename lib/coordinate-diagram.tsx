'use client'

import React, { useCallback, useRef } from 'react'

/**
 * SVG Coordinate Plane Diagram for math questions.
 *
 * Renders a grid with axes, optional plotted functions, points, and labels.
 * Supports interactive mode where users can click to place a point.
 */

export interface DiagramPoint {
  x: number
  y: number
  label?: string
  color?: string
}

export interface DiagramFunction {
  /** Array of [x, y] sample points to plot as a smooth curve */
  points: [number, number][]
  color?: string
  label?: string
  dashed?: boolean
}

export interface DiagramData {
  /** Range of the axes */
  x_range: [number, number]
  y_range: [number, number]
  /** Grid step size (default 1) */
  step?: number
  /** Functions/curves to plot */
  functions?: DiagramFunction[]
  /** Individual points to mark */
  points?: DiagramPoint[]
  /** Axis labels */
  x_label?: string
  y_label?: string
  /** Title above the diagram */
  title?: string
}

const COLORS = ['#2563eb', '#dc2626', '#16a34a', '#9333ea', '#ea580c']

interface CoordinateDiagramProps {
  data: DiagramData
  /** Enable click-to-place-point interaction */
  interactive?: boolean
  /** The user-placed point (controlled) */
  userPoint?: { x: number; y: number } | null
  /** Callback when user clicks to place a point */
  onPointPlaced?: (point: { x: number; y: number }) => void
  /** Whether interaction is disabled (e.g. after answer submitted) */
  disabled?: boolean
  /** Show a correct point after submission */
  correctPoint?: { x: number; y: number } | null
  /** Whether the user's answer was correct */
  isCorrect?: boolean | null
}

export function CoordinateDiagram({
  data,
  interactive,
  userPoint,
  onPointPlaced,
  disabled,
  correctPoint,
  isCorrect,
}: CoordinateDiagramProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  const padding = 40
  const width = 320
  const height = 280
  const plotW = width - padding * 2
  const plotH = height - padding * 2

  const [xMin, xMax] = data.x_range
  const [yMin, yMax] = data.y_range
  const step = data.step || 1

  // Map math coords to SVG coords
  function toSvgX(x: number) {
    return padding + ((x - xMin) / (xMax - xMin)) * plotW
  }
  function toSvgY(y: number) {
    return padding + plotH - ((y - yMin) / (yMax - yMin)) * plotH
  }

  // Map SVG coords back to math coords (snapped to grid)
  function toMathX(svgX: number) {
    const raw = xMin + ((svgX - padding) / plotW) * (xMax - xMin)
    return Math.round(raw / step) * step
  }
  function toMathY(svgY: number) {
    const raw = yMin + ((padding + plotH - svgY) / plotH) * (yMax - yMin)
    return Math.round(raw / step) * step
  }

  const handleClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!interactive || disabled || !onPointPlaced || !svgRef.current) return

    const svg = svgRef.current
    const rect = svg.getBoundingClientRect()
    // Scale from DOM coords to viewBox coords
    const scaleX = width / rect.width
    const scaleY = height / rect.height
    const svgX = (e.clientX - rect.left) * scaleX
    const svgY = (e.clientY - rect.top) * scaleY

    // Check bounds
    if (svgX < padding || svgX > padding + plotW) return
    if (svgY < padding || svgY > padding + plotH) return

    const mx = toMathX(svgX)
    const my = toMathY(svgY)

    // Clamp to range
    const cx = Math.max(xMin, Math.min(xMax, mx))
    const cy = Math.max(yMin, Math.min(yMax, my))

    onPointPlaced({ x: cx, y: cy })
  }, [interactive, disabled, onPointPlaced, xMin, xMax, yMin, yMax, step])

  // Compute tick intervals that prevent label overlap
  // Target ~15px min spacing between labels
  function niceTickInterval(rangeMin: number, rangeMax: number, availablePx: number, minLabelPx: number): number {
    const range = rangeMax - rangeMin
    const maxTicks = Math.floor(availablePx / minLabelPx)
    if (maxTicks <= 0) return range
    const rawInterval = range / maxTicks
    // Round up to a "nice" number: 1, 2, 5, 10, 20, 25, 50, 100...
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawInterval)))
    const residual = rawInterval / magnitude
    let nice: number
    if (residual <= 1) nice = 1
    else if (residual <= 2) nice = 2
    else if (residual <= 5) nice = 5
    else nice = 10
    return Math.max(step, nice * magnitude)
  }

  const xTickInterval = niceTickInterval(xMin, xMax, plotW, 30)
  const yTickInterval = niceTickInterval(yMin, yMax, plotH, 16)

  // Grid lines (at step interval) and labels (at tick interval)
  const gridLines: React.JSX.Element[] = []

  // Limit grid lines to avoid performance issues
  const xGridStep = (xMax - xMin) / step > 50 ? xTickInterval : step
  const yGridStep = (yMax - yMin) / step > 50 ? yTickInterval : step

  for (let x = Math.ceil(xMin / xGridStep) * xGridStep; x <= xMax; x = +(x + xGridStep).toFixed(10)) {
    const sx = toSvgX(x)
    gridLines.push(
      <line key={`gx-${x}`} x1={sx} y1={padding} x2={sx} y2={padding + plotH}
        stroke="#E8E4DD" strokeWidth={0.5} />
    )
  }
  // X-axis labels at tick interval
  for (let x = Math.ceil(xMin / xTickInterval) * xTickInterval; x <= xMax; x = +(x + xTickInterval).toFixed(10)) {
    if (x !== 0) {
      const sx = toSvgX(x)
      gridLines.push(
        <text key={`lx-${x}`} x={sx} y={padding + plotH + 14}
          textAnchor="middle" className="text-[10px] fill-[#A39B90]">{x}</text>
      )
    }
  }

  for (let y = Math.ceil(yMin / yGridStep) * yGridStep; y <= yMax; y = +(y + yGridStep).toFixed(10)) {
    const sy = toSvgY(y)
    gridLines.push(
      <line key={`gy-${y}`} x1={padding} y1={sy} x2={padding + plotW} y2={sy}
        stroke="#E8E4DD" strokeWidth={0.5} />
    )
  }
  // Y-axis labels at tick interval
  for (let y = Math.ceil(yMin / yTickInterval) * yTickInterval; y <= yMax; y = +(y + yTickInterval).toFixed(10)) {
    if (y !== 0) {
      const sy = toSvgY(y)
      gridLines.push(
        <text key={`ly-${y}`} x={padding - 6} y={sy + 3}
          textAnchor="end" className="text-[10px] fill-[#A39B90]">{y}</text>
      )
    }
  }

  // Axes
  const axisOriginX = toSvgX(0)
  const axisOriginY = toSvgY(0)
  const showXAxis = yMin <= 0 && yMax >= 0
  const showYAxis = xMin <= 0 && xMax >= 0

  // Function curves
  const curves = (data.functions || []).map((fn, fi) => {
    const color = fn.color || COLORS[fi % COLORS.length]
    const pathData = fn.points
      .map(([x, y], i) => {
        const sx = toSvgX(x)
        const sy = toSvgY(y)
        return `${i === 0 ? 'M' : 'L'} ${sx} ${sy}`
      })
      .join(' ')

    return (
      <g key={`fn-${fi}`}>
        <path d={pathData} fill="none" stroke={color} strokeWidth={2}
          strokeDasharray={fn.dashed ? '6 4' : undefined}
          strokeLinecap="round" strokeLinejoin="round" />
        {fn.label && fn.points.length > 0 && (
          <text
            x={toSvgX(fn.points[fn.points.length - 1][0]) + 4}
            y={toSvgY(fn.points[fn.points.length - 1][1]) - 6}
            className="text-[10px] font-medium"
            fill={color}
          >
            {fn.label}
          </text>
        )}
      </g>
    )
  })

  // Static points
  const pointElements = (data.points || []).map((pt, pi) => {
    const color = pt.color || '#2C2825'
    return (
      <g key={`pt-${pi}`}>
        <circle cx={toSvgX(pt.x)} cy={toSvgY(pt.y)} r={4}
          fill={color} stroke="white" strokeWidth={1.5} />
        {pt.label && (
          <text x={toSvgX(pt.x) + 7} y={toSvgY(pt.y) - 7}
            className="text-[10px] font-medium" fill={color}>
            {pt.label}
          </text>
        )}
      </g>
    )
  })

  return (
    <div className="flex flex-col items-center mb-4">
      {data.title && (
        <p className="text-xs font-medium text-[#6B635A] mb-2">{data.title}</p>
      )}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className={`w-full max-w-[320px] rounded-xl border bg-white transition-colors ${
          interactive && !disabled
            ? 'border-blue-300 cursor-crosshair'
            : 'border-[#E8E4DD]'
        }`}
        onClick={handleClick}
      >
        {/* Grid */}
        {gridLines}

        {/* Click-target overlay for interactive mode */}
        {interactive && !disabled && (
          <rect x={padding} y={padding} width={plotW} height={plotH}
            fill="transparent" />
        )}

        {/* Axes */}
        {showXAxis && (
          <line x1={padding} y1={axisOriginY} x2={padding + plotW} y2={axisOriginY}
            stroke="#2C2825" strokeWidth={1.5} />
        )}
        {showYAxis && (
          <line x1={axisOriginX} y1={padding} x2={axisOriginX} y2={padding + plotH}
            stroke="#2C2825" strokeWidth={1.5} />
        )}

        {/* Axis labels */}
        {data.x_label && (
          <text x={padding + plotW + 2} y={axisOriginY - 4}
            className="text-[10px] font-medium fill-[#2C2825]">{data.x_label}</text>
        )}
        {data.y_label && (
          <text x={axisOriginX + 4} y={padding - 4}
            className="text-[10px] font-medium fill-[#2C2825]">{data.y_label}</text>
        )}

        {/* Origin label */}
        {showXAxis && showYAxis && (
          <text x={axisOriginX - 8} y={axisOriginY + 14}
            className="text-[10px] fill-[#A39B90]">0</text>
        )}

        {/* Arrowheads on axes */}
        {showXAxis && (
          <polygon points={`${padding + plotW},${axisOriginY - 3} ${padding + plotW},${axisOriginY + 3} ${padding + plotW + 6},${axisOriginY}`}
            fill="#2C2825" />
        )}
        {showYAxis && (
          <polygon points={`${axisOriginX - 3},${padding} ${axisOriginX + 3},${padding} ${axisOriginX},${padding - 6}`}
            fill="#2C2825" />
        )}

        {/* Curves */}
        {curves}

        {/* Static points */}
        {pointElements}

        {/* User-placed point */}
        {userPoint && (
          <g>
            {/* Crosshair lines */}
            <line x1={toSvgX(userPoint.x)} y1={padding} x2={toSvgX(userPoint.x)} y2={padding + plotH}
              stroke={isCorrect === null || isCorrect === undefined ? '#2563eb' : isCorrect ? '#16a34a' : '#dc2626'}
              strokeWidth={0.5} strokeDasharray="4 3" opacity={0.5} />
            <line x1={padding} y1={toSvgY(userPoint.y)} x2={padding + plotW} y2={toSvgY(userPoint.y)}
              stroke={isCorrect === null || isCorrect === undefined ? '#2563eb' : isCorrect ? '#16a34a' : '#dc2626'}
              strokeWidth={0.5} strokeDasharray="4 3" opacity={0.5} />
            {/* Point */}
            <circle cx={toSvgX(userPoint.x)} cy={toSvgY(userPoint.y)} r={6}
              fill={isCorrect === null || isCorrect === undefined ? '#2563eb' : isCorrect ? '#16a34a' : '#dc2626'}
              stroke="white" strokeWidth={2} />
            <text x={toSvgX(userPoint.x) + 9} y={toSvgY(userPoint.y) - 9}
              className="text-[11px] font-semibold"
              fill={isCorrect === null || isCorrect === undefined ? '#2563eb' : isCorrect ? '#16a34a' : '#dc2626'}>
              ({userPoint.x}, {userPoint.y})
            </text>
          </g>
        )}

        {/* Correct point shown after wrong answer */}
        {correctPoint && isCorrect === false && (
          <g>
            <circle cx={toSvgX(correctPoint.x)} cy={toSvgY(correctPoint.y)} r={6}
              fill="#16a34a" stroke="white" strokeWidth={2} />
            <text x={toSvgX(correctPoint.x) + 9} y={toSvgY(correctPoint.y) - 9}
              className="text-[11px] font-semibold" fill="#16a34a">
              ({correctPoint.x}, {correctPoint.y})
            </text>
          </g>
        )}
      </svg>

      {/* Interactive hint */}
      {interactive && !disabled && !userPoint && (
        <p className="text-xs text-blue-500 mt-2 font-medium">Tap on the graph to place your answer</p>
      )}
      {interactive && !disabled && userPoint && (
        <p className="text-xs text-[#6B635A] mt-2">
          Your answer: ({userPoint.x}, {userPoint.y}) -- tap again to move
        </p>
      )}
    </div>
  )
}
