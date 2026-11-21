import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

type ProgressRingProps = {
  percent: number;
  color: string;
  trackColor: string;
  textColor: string;
  size?: number;
  strokeWidth?: number;
  label?: string;
};

export function ProgressRing({ percent, color, trackColor, textColor, size = 52, strokeWidth = 5, label }: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);
  return (
    <View
      accessibilityLabel={label ?? `${clamped} percent complete`}
      style={[styles.wrap, { width: size, height: size }]}
    >
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text style={[styles.text, { color: textColor, fontSize: size >= 64 ? 15 : 12 }]}>{clamped}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  text: { fontWeight: '800', includeFontPadding: false },
});
