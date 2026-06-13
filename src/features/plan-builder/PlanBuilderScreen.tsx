import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, BackHandler, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getExercise } from '../../core/catalog/catalog';
import { planRepository } from '../../core/db/plan.repository';
import { useSettings } from '../../core/settings/SettingsContext';
import { useTheme } from '../../core/theme/ThemeContext';
import { fonts } from '../../shared/theme/tokens';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import { ExerciseConfigCard } from './ExerciseConfigCard';
import { ExercisePicker } from './ExercisePicker';
import {
  createEmptyDraft,
  defaultDraftExercise,
  draftFromPlan,
  draftToPlanInput,
  exerciseErrorKey,
  nextDefaultSetName,
  nextSetKey,
  validateDraft,
  type DraftWorkoutSet,
  type PlanDraft,
} from './draft';

type BuilderView =
  | { kind: 'basics' }
  | { kind: 'set'; setKey: string }
  | { kind: 'picker'; setKey: string }
  | { kind: 'review' };

type Props = NativeStackScreenProps<RootStackParamList, 'PlanBuilder'>;

export function PlanBuilderScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const editingPlan = route.params?.plan;
  const [draft, setDraft] = useState<PlanDraft>(() =>
    editingPlan ? draftFromPlan(editingPlan) : createEmptyDraft(t('planBuilder.defaultSetName')),
  );
  const [view, setView] = useState<BuilderView>({ kind: 'basics' });
  const [showErrors, setShowErrors] = useState(false);

  const validation = useMemo(() => validateDraft(draft), [draft]);

  const internalBack = useCallback(() => {
    if (view.kind === 'picker') {
      setView({ kind: 'set', setKey: view.setKey });
    } else if (view.kind === 'set' || view.kind === 'review') {
      setView({ kind: 'basics' });
    } else {
      navigation.goBack();
    }
  }, [view, navigation]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (view.kind === 'basics') return false;
      internalBack();
      return true;
    });
    return () => subscription.remove();
  }, [view.kind, internalBack]);

  const patchSet = (setKey: string, patch: Partial<DraftWorkoutSet>) => {
    setDraft((prev) => ({
      ...prev,
      sets: prev.sets.map((set) => (set.key === setKey ? { ...set, ...patch } : set)),
    }));
  };

  const addSet = () => {
    setDraft((prev) => ({
      ...prev,
      sets: [
        ...prev.sets,
        {
          key: nextSetKey(),
          name: nextDefaultSetName(
            t('planBuilder.defaultSetName'),
            prev.sets.map((set) => set.name),
          ),
          exercises: [],
        },
      ],
    }));
  };

  const removeSet = (setKey: string) => {
    setDraft((prev) =>
      prev.sets.length <= 1 ? prev : { ...prev, sets: prev.sets.filter((s) => s.key !== setKey) },
    );
  };

  const confirmPicker = (setKey: string, selectedIds: string[]) => {
    setDraft((prev) => ({
      ...prev,
      sets: prev.sets.map((set) => {
        if (set.key !== setKey) return set;
        const exercises = selectedIds
          .map((id) => {
            const existing = set.exercises.find((e) => e.catalogExerciseId === id);
            if (existing) return existing;
            const catalogExercise = getExercise(id);
            return catalogExercise ? defaultDraftExercise(catalogExercise, settings.unit) : null;
          })
          .filter((e): e is NonNullable<typeof e> => e !== null);
        return { ...set, exercises };
      }),
    }));
    setView({ kind: 'set', setKey });
  };

  const save = async () => {
    if (!validation.ok) {
      setShowErrors(true);
      return;
    }
    const input = draftToPlanInput(draft);
    const existing = await planRepository.getActivePlan();
    const doSave = async () => {
      await planRepository.saveActivePlan(input);
      navigation.goBack();
    };
    if (existing && !editingPlan) {
      Alert.alert(t('planBuilder.replaceTitle'), t('planBuilder.replaceMessage'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('planBuilder.replaceConfirm'), style: 'destructive', onPress: () => void doSave() },
      ]);
      return;
    }
    await doSave();
  };

  const currentSet =
    view.kind === 'set' || view.kind === 'picker'
      ? draft.sets.find((s) => s.key === view.setKey)
      : undefined;

  const headerTitle =
    view.kind === 'basics'
      ? editingPlan
        ? t('planBuilder.editTitle')
        : t('planBuilder.title')
      : view.kind === 'review'
        ? t('planBuilder.reviewTitle')
        : view.kind === 'picker'
          ? t('planBuilder.addExercises')
          : (currentSet?.name ?? '');

  const sectionStyle = [styles.section, { color: theme.colorText }];
  const primaryButton = (label: string, onPress: () => void) => (
    <Pressable onPress={onPress} style={[styles.primary, { backgroundColor: theme.colorPrimary }]}>
      <Text style={[styles.primaryLabel, { color: theme.colorOnPrimary }]}>{label}</Text>
    </Pressable>
  );

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={[styles.root, { backgroundColor: theme.colorBg, paddingTop: insets.top + 8 }]}
    >
      <View style={styles.header}>
        <Pressable onPress={internalBack} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color={theme.colorPrimaryStrong} />
        </Pressable>
        <Text style={[styles.title, { color: theme.colorPrimaryStrong }]} numberOfLines={1}>
          {headerTitle}
        </Text>
      </View>

      {view.kind === 'basics' ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        >
          <Text style={sectionStyle}>{t('planBuilder.planName')}</Text>
          <TextInput
            value={draft.name}
            onChangeText={(name) => setDraft((prev) => ({ ...prev, name }))}
            placeholder={t('planBuilder.planNamePlaceholder')}
            placeholderTextColor={theme.colorTextMuted}
            style={[
              styles.nameInput,
              {
                backgroundColor: theme.colorSurfaceTint,
                color: theme.colorText,
                borderColor: showErrors && validation.nameError ? theme.colorDanger : 'transparent',
              },
            ]}
          />
          {showErrors && validation.nameError ? (
            <Text style={[styles.error, { color: theme.colorDanger }]}>{t('planBuilder.nameError')}</Text>
          ) : null}

          <Text style={sectionStyle}>{t('planBuilder.workoutSets')}</Text>
          {draft.sets.map((set) => (
            <View key={set.key} style={[styles.setCard, { backgroundColor: theme.colorSurfaceTint, shadowColor: theme.colorShadow }]}>
              <View style={styles.setHeader}>
                <TextInput
                  value={set.name}
                  onChangeText={(name) => patchSet(set.key, { name })}
                  style={[styles.setName, { color: theme.colorText }]}
                />
                {draft.sets.length > 1 ? (
                  <Pressable onPress={() => removeSet(set.key)} style={styles.iconButton}>
                    <Ionicons name="trash-outline" size={20} color={theme.colorTextMuted} />
                  </Pressable>
                ) : null}
              </View>
              <Pressable onPress={() => setView({ kind: 'set', setKey: set.key })} style={styles.setRow}>
                <Text style={[styles.setCount, { color: theme.colorTextMuted }]}>
                  {t('planBuilder.exercisesCount', { count: set.exercises.length })}
                </Text>
                <Ionicons name="chevron-forward" size={18} color={theme.colorPrimaryStrong} />
              </Pressable>
              {showErrors && validation.emptySetKeys.includes(set.key) ? (
                <Text style={[styles.error, { color: theme.colorDanger }]}>{t('planBuilder.emptySet')}</Text>
              ) : null}
            </View>
          ))}

          <Pressable onPress={addSet} style={[styles.addSet, { borderColor: theme.colorPrimaryStrong }]}>
            <Ionicons name="add" size={18} color={theme.colorPrimaryStrong} />
            <Text style={[styles.addSetLabel, { color: theme.colorPrimaryStrong }]}>
              {t('planBuilder.addSet')}
            </Text>
          </Pressable>

          {primaryButton(t('planBuilder.continue'), () => setView({ kind: 'review' }))}
        </ScrollView>
      ) : null}

      {view.kind === 'set' && currentSet ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        >
          {currentSet.exercises.map((exercise) => (
            <ExerciseConfigCard
              key={exercise.catalogExerciseId}
              draft={exercise}
              errors={
                showErrors
                  ? (validation.exerciseErrors[exerciseErrorKey(currentSet.key, exercise.catalogExerciseId)] ?? {})
                  : {}
              }
              onPatch={(patch) =>
                patchSet(currentSet.key, {
                  exercises: currentSet.exercises.map((e) =>
                    e.catalogExerciseId === exercise.catalogExerciseId ? { ...e, ...patch } : e,
                  ),
                })
              }
              onRemove={() =>
                patchSet(currentSet.key, {
                  exercises: currentSet.exercises.filter(
                    (e) => e.catalogExerciseId !== exercise.catalogExerciseId,
                  ),
                })
              }
            />
          ))}
          <Pressable
            onPress={() => setView({ kind: 'picker', setKey: currentSet.key })}
            style={[styles.addSet, { borderColor: theme.colorPrimaryStrong }]}
          >
            <Ionicons name="add" size={18} color={theme.colorPrimaryStrong} />
            <Text style={[styles.addSetLabel, { color: theme.colorPrimaryStrong }]}>
              {t('planBuilder.addExercises')}
            </Text>
          </Pressable>
          {primaryButton(t('planBuilder.done'), internalBack)}
        </ScrollView>
      ) : null}

      {view.kind === 'picker' && currentSet ? (
        <ExercisePicker
          initialSelection={currentSet.exercises.map((e) => e.catalogExerciseId)}
          onConfirm={(ids) => confirmPicker(currentSet.key, ids)}
        />
      ) : null}

      {view.kind === 'review' ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        >
          <Text style={[styles.reviewName, { color: theme.colorText }]}>
            {draft.name.trim() || t('planBuilder.planName')}
          </Text>
          {draft.sets.map((set) => (
            <View key={set.key} style={[styles.setCard, { backgroundColor: theme.colorSurfaceTint, shadowColor: theme.colorShadow }]}>
              <Text style={[styles.setName, { color: theme.colorText }]}>{set.name}</Text>
              <Text style={[styles.setCount, { color: theme.colorTextMuted }]}>
                {t('planBuilder.exercisesCount', { count: set.exercises.length })}
              </Text>
              {showErrors && validation.emptySetKeys.includes(set.key) ? (
                <Text style={[styles.error, { color: theme.colorDanger }]}>{t('planBuilder.emptySet')}</Text>
              ) : null}
            </View>
          ))}
          {showErrors && !validation.ok ? (
            <Text style={[styles.error, { color: theme.colorDanger }]}>{t('planBuilder.fieldErrors')}</Text>
          ) : null}
          {primaryButton(t('planBuilder.save'), () => void save())}
        </ScrollView>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, paddingHorizontal: 20 },
  back: { padding: 6, marginLeft: -10 },
  title: { flex: 1, fontFamily: fonts.subtitle, fontSize: 22 },
  scroll: { paddingHorizontal: 20 },
  section: { fontFamily: fonts.subtitle, fontSize: 15, marginTop: 14, marginBottom: 8 },
  nameInput: { borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontFamily: fonts.body, fontSize: 15, borderWidth: 1 },
  setCard: {
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 3,
  },
  setHeader: { flexDirection: 'row', alignItems: 'center' },
  setName: { flex: 1, fontFamily: fonts.subtitle, fontSize: 15, padding: 0 },
  iconButton: { padding: 6 },
  setRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  setCount: { fontFamily: fonts.body, fontSize: 13 },
  addSet: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderRadius: 999, paddingVertical: 12, marginTop: 4, marginBottom: 16 },
  addSetLabel: { fontFamily: fonts.label, fontSize: 14 },
  primary: { borderRadius: 999, paddingVertical: 14, alignItems: 'center', marginBottom: 24 },
  primaryLabel: { fontFamily: fonts.label, fontSize: 15 },
  error: { fontFamily: fonts.body, fontSize: 12, marginTop: 6, marginBottom: 6 },
  reviewName: { fontFamily: fonts.title, fontSize: 20, marginBottom: 12 },
});
