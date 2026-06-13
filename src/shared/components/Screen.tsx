import { type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../core/theme/ThemeContext';
import { fonts } from '../theme/tokens';

interface ScreenProps {
  title?: string;
  children?: ReactNode;
  padded?: boolean;
}

export function Screen({ title, children, padded = true }: ScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: theme.colorBg,
          paddingTop: title ? insets.top + 8 : 8,
          paddingHorizontal: padded ? 20 : 0,
        },
      ]}
    >
      {title ? (
        <Text style={[styles.title, { color: theme.colorPrimaryStrong }, padded ? null : styles.titleBleed]}>
          {title}
        </Text>
      ) : null}
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  title: { fontFamily: fonts.subtitle, fontSize: 22, marginBottom: 12 },
  titleBleed: { paddingHorizontal: 20 },
  body: { flex: 1 },
});
