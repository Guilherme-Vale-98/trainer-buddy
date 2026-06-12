import { type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../core/theme/ThemeContext';
import { fonts } from '../theme/tokens';

interface ScreenProps {
  title?: string;
  children?: ReactNode;
}

export function Screen({ title, children }: ScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: theme.colorBg, paddingTop: title ? insets.top + 8 : 8 },
      ]}
    >
      {title ? (
        <Text style={[styles.title, { color: theme.colorPrimaryStrong }]}>{title}</Text>
      ) : null}
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 20 },
  title: { fontFamily: fonts.subtitle, fontSize: 22, marginBottom: 12 },
  body: { flex: 1 },
});
