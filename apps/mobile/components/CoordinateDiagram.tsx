import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, {
  Line,
  Circle,
  Polygon,
  Path,
  Rect,
  G,
  Text as SvgText,
} from 'react-native-svg';
import { colors, spacing, fontSize as fs, radii } from '@/lib/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;

export interface DiagramPoint {
  x: number;
  y: number;
  label?: string;
  color?: string;
}

export interface DiagramFunction {
  points: [number, number][];
  color?: string;
  label?: string;
  dashed?: boolean;
}

export interface DiagramData {
  x_range: [number, number];
  y_range: [number, number];
  step?: number;
  functions?: DiagramFunction[];
  points?: DiagramPoint[];
  x_label?: string;
  y_label?: string;
  title?: string;
}

const COLORS = ['#2563eb', '#dc2626', '#16a34a', '#9333ea', '#ea580c'];

interface CoordinateDiagramProps {
  data: DiagramData;
  interactive?: boolean;
  userPoint?: { x: number; y: number } | null;
  onPointPlaced?: (point: { x: number; y: number }) => void;
  disabled?: boolean;
  correctPoint?: { x: number; y: number } | null;
  isCorrect?: boolean | null;
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
  const padding = 40;
  const width = 320;
  const height = 280;
  const plotW = width - padding * 2;
  const plotH = height - padding * 2;

  const [xMin, xMax] = data.x_range;
  const [yMin, yMax] = data.y_range;
  const step = data.step || 1;

  function toSvgX(x: number) {
    return padding + ((x - xMin) / (xMax - xMin)) * plotW;
  }
  function toSvgY(y: number) {
    return padding + plotH - ((y - yMin) / (yMax - yMin)) * plotH;
  }

  function toMathX(svgX: number) {
    const raw = xMin + ((svgX - padding) / plotW) * (xMax - xMin);
    return Math.round(raw / step) * step;
  }
  function toMathY(svgY: number) {
    const raw = yMin + ((padding + plotH - svgY) / plotH) * (yMax - yMin);
    return Math.round(raw / step) * step;
  }

  const handlePress = useCallback(
    (e: { nativeEvent: { locationX: number; locationY: number } }) => {
      if (!interactive || disabled || !onPointPlaced) return;

      // The SVG is rendered in a container that fills the width,
      // so we need to scale from layout coords to viewBox coords
      const svgX = e.nativeEvent.locationX;
      const svgY = e.nativeEvent.locationY;

      if (svgX < padding || svgX > padding + plotW) return;
      if (svgY < padding || svgY > padding + plotH) return;

      const mx = toMathX(svgX);
      const my = toMathY(svgY);
      const cx = Math.max(xMin, Math.min(xMax, mx));
      const cy = Math.max(yMin, Math.min(yMax, my));
      onPointPlaced({ x: cx, y: cy });
    },
    [interactive, disabled, onPointPlaced, xMin, xMax, yMin, yMax, step],
  );

  function niceTickInterval(
    rangeMin: number,
    rangeMax: number,
    availablePx: number,
    minLabelPx: number,
  ): number {
    const range = rangeMax - rangeMin;
    const maxTicks = Math.floor(availablePx / minLabelPx);
    if (maxTicks <= 0) return range;
    const rawInterval = range / maxTicks;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawInterval)));
    const residual = rawInterval / magnitude;
    let nice: number;
    if (residual <= 1) nice = 1;
    else if (residual <= 2) nice = 2;
    else if (residual <= 5) nice = 5;
    else nice = 10;
    return Math.max(step, nice * magnitude);
  }

  const xTickInterval = niceTickInterval(xMin, xMax, plotW, 30);
  const yTickInterval = niceTickInterval(yMin, yMax, plotH, 16);

  const xGridStep = (xMax - xMin) / step > 50 ? xTickInterval : step;
  const yGridStep = (yMax - yMin) / step > 50 ? yTickInterval : step;

  // Build grid lines
  const gridElements: React.JSX.Element[] = [];

  for (let x = Math.ceil(xMin / xGridStep) * xGridStep; x <= xMax; x = +(x + xGridStep).toFixed(10)) {
    const sx = toSvgX(x);
    gridElements.push(
      <Line key={`gx-${x}`} x1={sx} y1={padding} x2={sx} y2={padding + plotH}
        stroke="#E8E4DD" strokeWidth={0.5} />,
    );
  }
  for (let x = Math.ceil(xMin / xTickInterval) * xTickInterval; x <= xMax; x = +(x + xTickInterval).toFixed(10)) {
    if (x !== 0) {
      const sx = toSvgX(x);
      gridElements.push(
        <SvgText key={`lx-${x}`} x={sx} y={padding + plotH + 14}
          textAnchor="middle" fontSize={10} fill="#A39B90">{String(x)}</SvgText>,
      );
    }
  }

  for (let y = Math.ceil(yMin / yGridStep) * yGridStep; y <= yMax; y = +(y + yGridStep).toFixed(10)) {
    const sy = toSvgY(y);
    gridElements.push(
      <Line key={`gy-${y}`} x1={padding} y1={sy} x2={padding + plotW} y2={sy}
        stroke="#E8E4DD" strokeWidth={0.5} />,
    );
  }
  for (let y = Math.ceil(yMin / yTickInterval) * yTickInterval; y <= yMax; y = +(y + yTickInterval).toFixed(10)) {
    if (y !== 0) {
      const sy = toSvgY(y);
      gridElements.push(
        <SvgText key={`ly-${y}`} x={padding - 6} y={sy + 3}
          textAnchor="end" fontSize={10} fill="#A39B90">{String(y)}</SvgText>,
      );
    }
  }

  const axisOriginX = toSvgX(0);
  const axisOriginY = toSvgY(0);
  const showXAxis = yMin <= 0 && yMax >= 0;
  const showYAxis = xMin <= 0 && xMax >= 0;

  // Function curves
  const curves = (data.functions || []).map((fn, fi) => {
    const color = fn.color || COLORS[fi % COLORS.length];
    const pathData = fn.points
      .map(([x, y], i) => {
        const sx = toSvgX(x);
        const sy = toSvgY(y);
        return `${i === 0 ? 'M' : 'L'} ${sx} ${sy}`;
      })
      .join(' ');

    return (
      <G key={`fn-${fi}`}>
        <Path d={pathData} fill="none" stroke={color} strokeWidth={2}
          strokeDasharray={fn.dashed ? '6 4' : undefined}
          strokeLinecap="round" strokeLinejoin="round" />
        {fn.label && fn.points.length > 0 && (
          <SvgText
            x={toSvgX(fn.points[fn.points.length - 1][0]) + 4}
            y={toSvgY(fn.points[fn.points.length - 1][1]) - 6}
            fontSize={10} fontWeight="500" fill={color}>
            {fn.label}
          </SvgText>
        )}
      </G>
    );
  });

  // Static points
  const pointElements = (data.points || []).map((pt, pi) => {
    const color = pt.color || '#2C2825';
    return (
      <G key={`pt-${pi}`}>
        <Circle cx={toSvgX(pt.x)} cy={toSvgY(pt.y)} r={4}
          fill={color} stroke="white" strokeWidth={1.5} />
        {pt.label && (
          <SvgText x={toSvgX(pt.x) + 7} y={toSvgY(pt.y) - 7}
            fontSize={10} fontWeight="500" fill={color}>
            {pt.label}
          </SvgText>
        )}
      </G>
    );
  });

  const userPointColor =
    isCorrect === null || isCorrect === undefined
      ? '#2563eb'
      : isCorrect
        ? '#16a34a'
        : '#dc2626';

  return (
    <View style={styles.container}>
      {data.title && (
        <Text style={styles.title}>{data.title}</Text>
      )}
      <View style={[
        styles.svgWrapper,
        interactive && !disabled ? styles.svgInteractive : null,
      ]}>
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        onPress={interactive && !disabled ? handlePress : undefined}
      >
        {/* Grid */}
        {gridElements}

        {/* Click target for interactive */}
        {interactive && !disabled && (
          <Rect x={padding} y={padding} width={plotW} height={plotH} fill="transparent" />
        )}

        {/* Axes */}
        {showXAxis && (
          <Line x1={padding} y1={axisOriginY} x2={padding + plotW} y2={axisOriginY}
            stroke="#2C2825" strokeWidth={1.5} />
        )}
        {showYAxis && (
          <Line x1={axisOriginX} y1={padding} x2={axisOriginX} y2={padding + plotH}
            stroke="#2C2825" strokeWidth={1.5} />
        )}

        {/* Axis labels */}
        {data.x_label && (
          <SvgText x={padding + plotW + 2} y={axisOriginY - 4}
            fontSize={10} fontWeight="500" fill="#2C2825">{data.x_label}</SvgText>
        )}
        {data.y_label && (
          <SvgText x={axisOriginX + 4} y={padding - 4}
            fontSize={10} fontWeight="500" fill="#2C2825">{data.y_label}</SvgText>
        )}

        {/* Origin label */}
        {showXAxis && showYAxis && (
          <SvgText x={axisOriginX - 8} y={axisOriginY + 14}
            fontSize={10} fill="#A39B90">0</SvgText>
        )}

        {/* Arrowheads */}
        {showXAxis && (
          <Polygon
            points={`${padding + plotW},${axisOriginY - 3} ${padding + plotW},${axisOriginY + 3} ${padding + plotW + 6},${axisOriginY}`}
            fill="#2C2825" />
        )}
        {showYAxis && (
          <Polygon
            points={`${axisOriginX - 3},${padding} ${axisOriginX + 3},${padding} ${axisOriginX},${padding - 6}`}
            fill="#2C2825" />
        )}

        {/* Curves */}
        {curves}

        {/* Static points */}
        {pointElements}

        {/* User-placed point */}
        {userPoint && (
          <G>
            <Line x1={toSvgX(userPoint.x)} y1={padding} x2={toSvgX(userPoint.x)} y2={padding + plotH}
              stroke={userPointColor} strokeWidth={0.5} strokeDasharray="4 3" opacity={0.5} />
            <Line x1={padding} y1={toSvgY(userPoint.y)} x2={padding + plotW} y2={toSvgY(userPoint.y)}
              stroke={userPointColor} strokeWidth={0.5} strokeDasharray="4 3" opacity={0.5} />
            <Circle cx={toSvgX(userPoint.x)} cy={toSvgY(userPoint.y)} r={6}
              fill={userPointColor} stroke="white" strokeWidth={2} />
            <SvgText x={toSvgX(userPoint.x) + 9} y={toSvgY(userPoint.y) - 9}
              fontSize={11} fontWeight="600" fill={userPointColor}>
              ({userPoint.x}, {userPoint.y})
            </SvgText>
          </G>
        )}

        {/* Correct point after wrong answer */}
        {correctPoint && isCorrect === false && (
          <G>
            <Circle cx={toSvgX(correctPoint.x)} cy={toSvgY(correctPoint.y)} r={6}
              fill="#16a34a" stroke="white" strokeWidth={2} />
            <SvgText x={toSvgX(correctPoint.x) + 9} y={toSvgY(correctPoint.y) - 9}
              fontSize={11} fontWeight="600" fill="#16a34a">
              ({correctPoint.x}, {correctPoint.y})
            </SvgText>
          </G>
        )}
      </Svg>
      </View>

      {/* Interactive hints */}
      {interactive && !disabled && !userPoint && (
        <Text style={styles.hint}>Tap on the graph to place your answer</Text>
      )}
      {interactive && !disabled && userPoint && (
        <Text style={styles.hintMuted}>
          Your answer: ({userPoint.x}, {userPoint.y}) -- tap again to move
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fs.xs,
    fontWeight: '500',
    color: '#6B635A',
    marginBottom: spacing.sm,
  },
  svgWrapper: {
    width: Math.min(SCREEN_WIDTH - 64, 320),
    aspectRatio: 320 / 280,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: '#E8E4DD',
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  svgInteractive: {
    borderColor: '#93c5fd',
  },
  hint: {
    fontSize: fs.xs,
    color: '#2563eb',
    fontWeight: '500',
    marginTop: spacing.sm,
  },
  hintMuted: {
    fontSize: fs.xs,
    color: '#6B635A',
    marginTop: spacing.sm,
  },
});
