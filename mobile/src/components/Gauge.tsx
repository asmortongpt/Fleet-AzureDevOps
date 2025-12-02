/**
 * Gauge Component
 * Circular gauge visualization with animated needle and color zones
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Path, G, Line } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withSpring,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { GaugeConfig } from '../types/obd2';

// ============================================================================
// Types
// ============================================================================

export interface GaugeProps {
  config: GaugeConfig;
  value: number;
  size?: number;
  animated?: boolean;
  showValue?: boolean;
  showLabel?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_SIZE = 180;
const STROKE_WIDTH = 12;
const START_ANGLE = -135; // degrees
const END_ANGLE = 135; // degrees
const NEEDLE_LENGTH_RATIO = 0.65;
const AnimatedPath = Animated.createAnimatedComponent(Path);

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert degrees to radians
 */
const degreesToRadians = (degrees: number): number => {
  return (degrees * Math.PI) / 180;
};

/**
 * Calculate point on circle
 */
const polarToCartesian = (
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number
): { x: number; y: number } => {
  const angleInRadians = degreesToRadians(angleInDegrees - 90);
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
};

/**
 * Create SVG arc path
 */
const describeArc = (
  x: number,
  y: number,
  radius: number,
  startAngle: number,
  endAngle: number
): string => {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  return [
    'M',
    start.x,
    start.y,
    'A',
    radius,
    radius,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
  ].join(' ');
};

/**
 * Get color for value based on zones
 */
const getColorForValue = (value: number, config: GaugeConfig): string => {
  for (const zone of config.colorZones) {
    if (value >= zone.from && value <= zone.to) {
      return zone.color;
    }
  }
  return config.colorZones[0]?.color || '#666';
};

// ============================================================================
// Gauge Component
// ============================================================================

export const Gauge: React.FC<GaugeProps> = ({
  config,
  value,
  size = DEFAULT_SIZE,
  animated = true,
  showValue = true,
  showLabel = true,
}) => {
  // Animation value
  const animatedValue = useSharedValue(config.minValue);

  // Update animated value when prop changes
  useEffect(() => {
    if (animated) {
      animatedValue.value = withSpring(value, {
        damping: 15,
        stiffness: 100,
      });
    } else {
      animatedValue.value = value;
    }
  }, [value, animated]);

  // Calculate dimensions
  const center = size / 2;
  const radius = (size - STROKE_WIDTH * 2) / 2;
  const needleLength = radius * NEEDLE_LENGTH_RATIO;

  // Clamp value to min/max
  const clampedValue = Math.max(
    config.minValue,
    Math.min(config.maxValue, value)
  );

  // Calculate angle for needle
  const valueAngle = interpolate(
    clampedValue,
    [config.minValue, config.maxValue],
    [START_ANGLE, END_ANGLE],
    Extrapolate.CLAMP
  );

  // Get current color
  const currentColor = getColorForValue(clampedValue, config);

  // Animated props for needle
  const animatedNeedleProps = useAnimatedProps(() => {
    const angle = interpolate(
      animatedValue.value,
      [config.minValue, config.maxValue],
      [START_ANGLE, END_ANGLE],
      Extrapolate.CLAMP
    );

    const needleEnd = polarToCartesian(center, center, needleLength, angle);

    return {
      d: `M ${center} ${center} L ${needleEnd.x} ${needleEnd.y}`,
    };
  });

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background track */}
        <Path
          d={describeArc(center, center, radius, START_ANGLE, END_ANGLE)}
          stroke="#e5e7eb"
          strokeWidth={STROKE_WIDTH}
          fill="none"
          strokeLinecap="round"
        />

        {/* Color zones */}
        {config.colorZones.map((zone, index) => {
          const zoneStartAngle = interpolate(
            zone.from,
            [config.minValue, config.maxValue],
            [START_ANGLE, END_ANGLE],
            Extrapolate.CLAMP
          );
          const zoneEndAngle = interpolate(
            zone.to,
            [config.minValue, config.maxValue],
            [START_ANGLE, END_ANGLE],
            Extrapolate.CLAMP
          );

          return (
            <Path
              key={`zone-${index}`}
              d={describeArc(
                center,
                center,
                radius,
                zoneStartAngle,
                zoneEndAngle
              )}
              stroke={zone.color}
              strokeWidth={STROKE_WIDTH}
              fill="none"
              strokeLinecap="round"
              opacity={0.3}
            />
          );
        })}

        {/* Progress arc (current value) */}
        <Path
          d={describeArc(center, center, radius, START_ANGLE, valueAngle)}
          stroke={currentColor}
          strokeWidth={STROKE_WIDTH}
          fill="none"
          strokeLinecap="round"
        />

        {/* Tick marks */}
        {generateTickMarks(config, center, radius, size).map(
          (tick, index) => (
            <G key={`tick-${index}`}>
              <Line
                x1={tick.start.x}
                y1={tick.start.y}
                x2={tick.end.x}
                y2={tick.end.y}
                stroke="#9ca3af"
                strokeWidth={tick.major ? 2 : 1}
              />
            </G>
          )
        )}

        {/* Center dot */}
        <Circle cx={center} cy={center} r={8} fill="#374151" />

        {/* Animated needle */}
        <AnimatedPath
          animatedProps={animatedNeedleProps}
          stroke="#374151"
          strokeWidth={3}
          strokeLinecap="round"
        />
      </Svg>

      {/* Value display */}
      {showValue && (
        <View style={styles.valueContainer}>
          <Text style={[styles.value, { color: currentColor }]}>
            {clampedValue.toFixed(config.precision)}
          </Text>
          <Text style={styles.unit}>{config.unit}</Text>
        </View>
      )}

      {/* Label */}
      {showLabel && <Text style={styles.label}>{config.label}</Text>}

      {/* Status indicator */}
      <View style={styles.statusContainer}>
        <View
          style={[
            styles.statusDot,
            {
              backgroundColor: currentColor,
            },
          ]}
        />
      </View>
    </View>
  );
};

// ============================================================================
// Helper: Generate Tick Marks
// ============================================================================

interface TickMark {
  start: { x: number; y: number };
  end: { x: number; y: number };
  major: boolean;
}

const generateTickMarks = (
  config: GaugeConfig,
  center: number,
  radius: number,
  size: number
): TickMark[] => {
  const ticks: TickMark[] = [];
  const totalAngle = END_ANGLE - START_ANGLE;
  const numTicks = 9; // 8 segments = 9 tick marks

  for (let i = 0; i <= numTicks; i++) {
    const angle = START_ANGLE + (totalAngle / numTicks) * i;
    const isMajor = i % 2 === 0; // Every other tick is major

    const tickLength = isMajor ? 12 : 8;
    const outerRadius = radius + STROKE_WIDTH / 2 + 4;
    const innerRadius = outerRadius - tickLength;

    const start = polarToCartesian(center, center, outerRadius, angle);
    const end = polarToCartesian(center, center, innerRadius, angle);

    ticks.push({
      start,
      end,
      major: isMajor,
    });
  }

  return ticks;
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  value: {
    fontSize: 32,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  unit: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    marginTop: 2,
  },
  label: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  statusContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});

// ============================================================================
// Export default
// ============================================================================

export default Gauge;
