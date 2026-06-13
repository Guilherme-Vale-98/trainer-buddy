import { type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../core/theme/ThemeContext';

type Elevation = 'none' | 'soft' | 'strong';

interface GradientCardProps {
  children: ReactNode;
  colors?: readonly [string, string, ...string[]];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  elevation?: Elevation;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

const SHADOWS: Record<Elevation, (color: string) => ViewStyle> = {
  none: () => ({}),
  soft: (color) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 4,
  }),
  strong: (color) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 22,
    elevation: 8,
  }),
};

export function GradientCard({
  children,
  colors,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
  elevation = 'soft',
  radius = 20,
  style,
  onPress,
}: GradientCardProps) {
  const theme = useTheme();
  const shadow = SHADOWS[elevation](theme.colorShadow);
  const shape: ViewStyle = { borderRadius: radius, overflow: 'hidden' };
  const wrapStyle: StyleProp<ViewStyle> = [
    styles.wrap,
    { borderRadius: radius, backgroundColor: theme.colorBg },
    shadow,
  ];

  const inner = colors ? (
    <LinearGradient colors={colors} start={start} end={end} style={[shape, style]}>
      {children}
    </LinearGradient>
  ) : (
    <View style={[shape, style]}>{children}</View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={wrapStyle}>
        {inner}
      </Pressable>
    );
  }
  return <View style={wrapStyle}>{inner}</View>;
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
});
