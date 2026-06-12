import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { getExercise, getExerciseImages, getExerciseName } from '../../core/catalog/catalog';
import { useSettings } from '../../core/settings/SettingsContext';
import { useTheme } from '../../core/theme/ThemeContext';
import { fonts } from '../../shared/theme/tokens';
import { PillSelector } from '../../shared/components/PillSelector';
import type { DraftExercise, DraftExerciseErrors } from './draft';

interface ExerciseConfigCardProps {
  draft: DraftExercise;
  errors: DraftExerciseErrors;
  onPatch: (patch: Partial<DraftExercise>) => void;
  onRemove: () => void;
}

export function ExerciseConfigCard({ draft, errors, onPatch, onRemove }: ExerciseConfigCardProps) {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const theme = useTheme();

  const exercise = getExercise(draft.catalogExerciseId);
  if (!exercise) return null;

  const image = getExerciseImages(exercise.id)[0];

  const inputStyle = (hasError?: boolean) => [
    styles.input,
    {
      backgroundColor: theme.colorBg,
      color: theme.colorText,
      borderColor: hasError ? theme.colorDanger : 'transparent',
    },
  ];
  const labelStyle = [styles.label, { color: theme.colorTextMuted }];

  return (
    <View style={[styles.card, { backgroundColor: theme.colorSurfaceTint }]}>
      <View style={styles.header}>
        {image ? <Image source={image} style={styles.thumb} /> : <View style={[styles.thumb, { backgroundColor: theme.colorPrimarySoft }]} />}
        <Text style={[styles.name, { color: theme.colorText }]} numberOfLines={2}>
          {getExerciseName(exercise, settings.language)}
        </Text>
        <Pressable onPress={onRemove} style={styles.remove}>
          <Ionicons name="trash-outline" size={20} color={theme.colorTextMuted} />
        </Pressable>
      </View>

      <View style={styles.row}>
        <View style={styles.field}>
          <Text style={labelStyle}>{t('planBuilder.series')}</Text>
          <TextInput
            value={draft.sets}
            onChangeText={(sets) => onPatch({ sets })}
            keyboardType="number-pad"
            style={inputStyle(errors.sets)}
          />
        </View>
        <View style={styles.field}>
          <Text style={labelStyle}>{t('planBuilder.rest')}</Text>
          <TextInput
            value={draft.restSeconds}
            onChangeText={(restSeconds) => onPatch({ restSeconds })}
            keyboardType="number-pad"
            style={inputStyle(errors.rest)}
          />
        </View>
      </View>

      <Text style={labelStyle}>{t('planBuilder.reps')}</Text>
      <View style={styles.row}>
        <PillSelector
          options={[
            { value: 'fixed', label: t('planBuilder.fixed') },
            { value: 'range', label: t('planBuilder.range') },
          ]}
          selected={draft.repsMode}
          onSelect={(repsMode) => onPatch({ repsMode })}
        />
        {draft.repsMode === 'fixed' ? (
          <TextInput
            value={draft.repsValue}
            onChangeText={(repsValue) => onPatch({ repsValue })}
            keyboardType="number-pad"
            style={[...inputStyle(errors.reps), styles.repsInput]}
          />
        ) : (
          <View style={styles.rangeRow}>
            <TextInput
              value={draft.repsMin}
              onChangeText={(repsMin) => onPatch({ repsMin })}
              keyboardType="number-pad"
              placeholder={t('planBuilder.min')}
              placeholderTextColor={theme.colorTextMuted}
              style={[...inputStyle(errors.reps), styles.repsInput]}
            />
            <Text style={{ color: theme.colorTextMuted }}>-</Text>
            <TextInput
              value={draft.repsMax}
              onChangeText={(repsMax) => onPatch({ repsMax })}
              keyboardType="number-pad"
              placeholder={t('planBuilder.max')}
              placeholderTextColor={theme.colorTextMuted}
              style={[...inputStyle(errors.reps), styles.repsInput]}
            />
          </View>
        )}
      </View>

      <Text style={labelStyle}>{t('planBuilder.load')}</Text>
      <View style={styles.row}>
        <TextInput
          value={draft.loadValue}
          onChangeText={(loadValue) => onPatch({ loadValue })}
          keyboardType="decimal-pad"
          style={[...inputStyle(errors.load), styles.repsInput]}
        />
        <PillSelector
          options={[
            { value: 'kg', label: 'kg' },
            { value: 'lb', label: 'lb' },
          ]}
          selected={draft.loadUnit}
          onSelect={(loadUnit) => onPatch({ loadUnit })}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, padding: 14, marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  thumb: { width: 52, height: 52, borderRadius: 12 },
  name: { flex: 1, fontFamily: fonts.subtitle, fontSize: 14 },
  remove: { padding: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  field: { flex: 1 },
  label: { fontFamily: fonts.label, fontSize: 12, marginBottom: 6 },
  input: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, fontFamily: fonts.body, fontSize: 14, borderWidth: 1 },
  repsInput: { width: 70, textAlign: 'center' },
  rangeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
