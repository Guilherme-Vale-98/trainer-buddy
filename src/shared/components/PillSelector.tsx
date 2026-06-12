import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../core/theme/ThemeContext';
import { fonts } from '../theme/tokens';

interface PillOption<T extends string> {
  value: T;
  label: string;
}

interface PillSelectorProps<T extends string> {
  options: PillOption<T>[];
  selected: T;
  onSelect: (value: T) => void;
}

export function PillSelector<T extends string>({ options, selected, onSelect }: PillSelectorProps<T>) {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      {options.map((opt) => {
        const active = opt.value === selected;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onSelect(opt.value)}
            style={({ pressed }) => [
              styles.pill,
              {
                backgroundColor: active ? theme.colorAccent : theme.colorSurfaceTint,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Text
              style={[
                styles.label,
                { color: active ? theme.colorOnAccent : theme.colorText },
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  pill: { borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 },
  label: { fontFamily: fonts.label, fontSize: 13 },
});
