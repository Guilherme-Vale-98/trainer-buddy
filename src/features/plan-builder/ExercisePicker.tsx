import { useMemo, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import {
  getAllExercises,
  getExerciseImages,
  getExerciseName,
  muscleGroups,
  type CatalogExercise,
} from '../../core/catalog/catalog';
import { useSettings } from '../../core/settings/SettingsContext';
import { useTheme } from '../../core/theme/ThemeContext';
import { fonts } from '../../shared/theme/tokens';
import { PillSelector } from '../../shared/components/PillSelector';

interface ExercisePickerProps {
  initialSelection: string[];
  onConfirm: (selectedIds: string[]) => void;
}

export function ExercisePicker({ initialSelection, onConfirm }: ExercisePickerProps) {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('all');
  const [selection, setSelection] = useState<string[]>(initialSelection);

  const exercises = useMemo(() => {
    const base = getAllExercises().filter((e) => group === 'all' || e.muscleGroup === group);
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter((e) => e.name[settings.language].toLowerCase().includes(q));
  }, [group, query, settings.language]);

  const toggle = (id: string) => {
    setSelection((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const renderItem = ({ item }: { item: CatalogExercise }) => {
    const selected = selection.includes(item.id);
    const image = getExerciseImages(item.id)[0];
    return (
      <Pressable
        onPress={() => toggle(item.id)}
        style={[
          styles.card,
          {
            backgroundColor: theme.colorSurfaceTint,
            borderColor: selected ? theme.colorAccent : 'transparent',
          },
        ]}
      >
        {image ? (
          <Image source={image} style={styles.photo} resizeMode="cover" />
        ) : (
          <View style={[styles.photo, { backgroundColor: theme.colorPrimarySoft }]} />
        )}
        {selected ? (
          <View style={[styles.check, { backgroundColor: theme.colorAccent }]}>
            <Ionicons name="checkmark" size={16} color={theme.colorOnAccent} />
          </View>
        ) : null}
        <Text style={[styles.name, { color: theme.colorText }]} numberOfLines={2}>
          {getExerciseName(item, settings.language)}
        </Text>
        <Text style={[styles.group, { color: theme.colorTextMuted }]}>
          {t(`muscle.${item.muscleGroup}`)}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.root}>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={t('planBuilder.searchPlaceholder')}
        placeholderTextColor={theme.colorTextMuted}
        style={[styles.search, { backgroundColor: theme.colorSurfaceTint, color: theme.colorText }]}
      />
      <View style={styles.filters}>
        <PillSelector
          options={[
            { value: 'all', label: t('planBuilder.all') },
            ...muscleGroups.map((g) => ({ value: g, label: t(`muscle.${g}`) })),
          ]}
          selected={group}
          onSelect={setGroup}
        />
      </View>
      <FlatList
        data={exercises}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={styles.columns}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
      <Pressable
        onPress={() => onConfirm(selection)}
        style={[styles.done, { backgroundColor: theme.colorPrimary, bottom: insets.bottom + 16 }]}
      >
        <Text style={[styles.doneLabel, { color: theme.colorOnPrimary }]}>
          {t('planBuilder.done')} ({selection.length})
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  search: { borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10, fontFamily: fonts.body, fontSize: 14, marginBottom: 10 },
  filters: { marginBottom: 10 },
  columns: { gap: 10 },
  listContent: { gap: 10, paddingBottom: 90 },
  card: { flex: 1, borderRadius: 18, padding: 8, borderWidth: 2 },
  photo: { width: '100%', height: 100, borderRadius: 12 },
  check: { position: 'absolute', top: 14, right: 14, width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: fonts.subtitle, fontSize: 13, marginTop: 8 },
  group: { fontFamily: fonts.body, fontSize: 11, marginTop: 2, marginBottom: 4 },
  done: { position: 'absolute', left: 20, right: 20, borderRadius: 999, paddingVertical: 14, alignItems: 'center' },
  doneLabel: { fontFamily: fonts.label, fontSize: 15 },
});
