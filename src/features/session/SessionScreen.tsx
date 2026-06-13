import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getExercise, getExerciseImages, getExerciseName } from '../../core/catalog/catalog';
import { sessionRepository } from '../../core/db/session.repository';
import type { WorkoutSession } from '../../core/db/models';
import { useSettings } from '../../core/settings/SettingsContext';
import { useTheme } from '../../core/theme/ThemeContext';
import { formatReps } from '../../shared/format';
import { fonts } from '../../shared/theme/tokens';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import {
  completedCount,
  exerciseProgress,
  firstIncompleteIndex,
  formatPreviousSets,
  isExerciseComplete,
  isSessionComplete,
  nextIncompleteIndex,
  parseLoadInput,
  parseRepsInput,
  previousPerformance,
  suggestedEntryForSet,
} from './session-logic';

type Props = NativeStackScreenProps<RootStackParamList, 'Session'>;

export function SessionScreen({ navigation, route }: Props) {
  useKeepAwake();
  const { t } = useTranslation();
  const { settings } = useSettings();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [history, setHistory] = useState<WorkoutSession[]>([]);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [repsInput, setRepsInput] = useState('');
  const [loadInput, setLoadInput] = useState('');
  const [inputError, setInputError] = useState(false);
  const [restRemaining, setRestRemaining] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      sessionRepository.getSession(route.params.sessionId),
      sessionRepository.getCompletedSessions(),
    ]).then(([loaded, completed]) => {
      if (!active) return;
      if (!loaded || loaded.status !== 'in_progress') {
        navigation.goBack();
        return;
      }
      setSession(loaded);
      setHistory(completed);
      const start = firstIncompleteIndex(loaded);
      setExerciseIndex(start === -1 ? 0 : start);
    });
    return () => {
      active = false;
    };
  }, [route.params.sessionId, navigation]);

  useEffect(() => {
    if (restRemaining === null) return;
    if (restRemaining <= 0) {
      setRestRemaining(null);
      return;
    }
    const timeout = setTimeout(() => setRestRemaining((r) => (r === null ? null : r - 1)), 1000);
    return () => clearTimeout(timeout);
  }, [restRemaining]);

  const planExercise = session?.planSnapshot.exercises[exerciseIndex];
  const catalogExercise = planExercise ? getExercise(planExercise.catalogExerciseId) : undefined;
  const previous = useMemo(
    () => (planExercise ? previousPerformance(history, planExercise.catalogExerciseId) : null),
    [history, planExercise],
  );

  const doneCount = session && planExercise ? completedCount(session, planExercise.catalogExerciseId) : 0;
  const currentSetNumber = Math.min(doneCount + 1, planExercise?.sets ?? 1);
  const exerciseDone = session && planExercise ? isExerciseComplete(session, planExercise) : false;

  const prefill = useCallback(() => {
    if (!session || !planExercise) return;
    const currentSets = session.completedSets.filter(
      (s) => s.catalogExerciseId === planExercise.catalogExerciseId,
    );
    const entry = suggestedEntryForSet(planExercise, currentSets, previous, doneCount + 1);
    setRepsInput(String(entry.reps));
    setLoadInput(entry.load ? String(entry.load.value) : '');
    setInputError(false);
  }, [session, planExercise, previous, doneCount]);

  useEffect(() => {
    prefill();
  }, [planExercise?.catalogExerciseId, doneCount]);

  if (!session || !planExercise || !catalogExercise) return null;

  const image = getExerciseImages(catalogExercise.id)[0];
  const progress = exerciseProgress(session);
  const complete = isSessionComplete(session);
  const showNextExercise = exerciseDone && !complete;

  const goToExercise = (direction: -1 | 1) => {
    const total = session.planSnapshot.exercises.length;
    setExerciseIndex((exerciseIndex + direction + total) % total);
    setRestRemaining(null);
  };

  const goToNextIncomplete = () => {
    const next = nextIncompleteIndex(session, exerciseIndex);
    if (next !== -1) {
      setExerciseIndex(next);
      setRestRemaining(null);
    }
  };

  const completeSet = async () => {
    const reps = parseRepsInput(repsInput);
    const load = parseLoadInput(loadInput);
    if (reps === null || !load.valid) {
      setInputError(true);
      return;
    }
    const updated = await sessionRepository.addCompletedSet(session.id, {
      catalogExerciseId: planExercise.catalogExerciseId,
      setNumber: doneCount + 1,
      actualReps: reps,
      actualLoad: load.load === null ? null : { value: load.load, unit: planExercise.targetLoad?.unit ?? settings.unit },
    });
    setSession(updated);
    const exerciseNowDone = completedCount(updated, planExercise.catalogExerciseId) >= planExercise.sets;
    if (!exerciseNowDone) {
      setRestRemaining(planExercise.restSeconds);
    }
  };

  const finishWorkout = () => {
    Alert.alert(t('session.finishTitle'), t('session.finishMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('session.finish'),
        onPress: () => {
          void sessionRepository.finishSession(session.id).then(() => navigation.goBack());
        },
      },
    ]);
  };

  const discardWorkout = () => {
    Alert.alert(t('session.discardTitle'), t('session.discardMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('session.discard'),
        style: 'destructive',
        onPress: () => {
          void sessionRepository.deleteSession(session.id).then(() => navigation.goBack());
        },
      },
    ]);
  };

  const inputStyle = [
    styles.input,
    {
      backgroundColor: theme.colorSurfaceTint,
      color: theme.colorText,
      borderColor: inputError ? theme.colorDanger : 'transparent',
    },
  ];

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={[styles.root, { backgroundColor: theme.colorBg, paddingTop: insets.top + 8 }]}
    >
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="chevron-back" size={24} color={theme.colorPrimaryStrong} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.colorPrimaryStrong }]} numberOfLines={1}>
            {session.workoutSetName}
          </Text>
          <Text style={[styles.headerProgress, { color: theme.colorTextMuted }]}>
            {t('session.progress', { done: progress.done, total: progress.total })}
          </Text>
        </View>
        <Pressable onPress={discardWorkout} style={styles.headerButton}>
          <Ionicons name="trash-outline" size={22} color={theme.colorTextMuted} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        {complete ? (
          <View style={[styles.banner, { backgroundColor: theme.colorAccent }]}>
            <Text style={[styles.bannerText, { color: theme.colorOnAccent }]}>
              {t('session.completeBanner')}
            </Text>
          </View>
        ) : null}

        <View style={[styles.mediaCard, { backgroundColor: theme.colorPrimarySoft }]}>
          {image ? <Image source={image} style={styles.photo} resizeMode="cover" /> : null}
          <View style={styles.exerciseNav}>
            <Pressable onPress={() => goToExercise(-1)} style={styles.navButton}>
              <Ionicons name="chevron-back" size={20} color={theme.colorOnAccent} />
            </Pressable>
            <View style={styles.exerciseTitleWrap}>
              <Text style={[styles.exerciseName, { color: theme.colorOnAccent }]} numberOfLines={2}>
                {getExerciseName(catalogExercise, settings.language)}
              </Text>
              <Text style={[styles.exerciseIndex, { color: theme.colorOnAccent }]}>
                {exerciseIndex + 1}/{session.planSnapshot.exercises.length}
                {exerciseDone ? '  ✓' : ''}
              </Text>
            </View>
            <Pressable onPress={() => goToExercise(1)} style={styles.navButton}>
              <Ionicons name="chevron-forward" size={20} color={theme.colorOnAccent} />
            </Pressable>
          </View>
        </View>

        <View style={[styles.infoPanel, { backgroundColor: theme.colorAccent }]}>
          <Text style={[styles.infoTitle, { color: theme.colorOnAccent }]}>
            {t('session.target')}: {formatReps(planExercise)}
            {planExercise.targetLoad
              ? ` · ${planExercise.targetLoad.value} ${planExercise.targetLoad.unit}`
              : ''}
          </Text>
          {previous ? (
            <Text style={[styles.infoLine, { color: theme.colorOnAccent }]}>
              {t('session.previous')}: {formatPreviousSets(previous)}
            </Text>
          ) : null}
          {catalogExercise.videoUrl ? (
            <Pressable onPress={() => void Linking.openURL(catalogExercise.videoUrl!)}>
              <Text style={[styles.videoLink, { color: theme.colorOnAccent }]}>
                {t('session.watchVideo')}
              </Text>
            </Pressable>
          ) : null}
        </View>

        {restRemaining !== null ? (
          <View style={[styles.restPanel, { backgroundColor: theme.colorPrimary }]}>
            <Text style={[styles.restLabel, { color: theme.colorOnPrimary }]}>{t('session.rest')}</Text>
            <Text style={[styles.restTime, { color: theme.colorOnPrimary }]}>
              {Math.floor(restRemaining / 60)}:{String(restRemaining % 60).padStart(2, '0')}
            </Text>
            <Pressable
              onPress={() => setRestRemaining(null)}
              style={[styles.skip, { backgroundColor: theme.colorOnPrimary }]}
            >
              <Text style={[styles.skipLabel, { color: theme.colorPrimary }]}>{t('session.skip')}</Text>
            </Pressable>
          </View>
        ) : (
          <View style={[styles.logCard, { backgroundColor: theme.colorSurfaceTint }]}>
            <Text style={[styles.setLabel, { color: theme.colorText }]}>
              {exerciseDone
                ? `${doneCount}/${planExercise.sets} ✓`
                : t('session.setOf', { current: currentSetNumber, total: planExercise.sets })}
            </Text>
            {exerciseDone ? (
              <Text style={[styles.goalHint, { color: theme.colorTextMuted }]}>
                {t('session.goalReached')}
              </Text>
            ) : null}
            <View style={styles.inputsRow}>
              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: theme.colorTextMuted }]}>
                  {t('session.reps')}
                </Text>
                <TextInput
                  value={repsInput}
                  onChangeText={(v) => {
                    setRepsInput(v);
                    setInputError(false);
                  }}
                  keyboardType="number-pad"
                  style={inputStyle}
                />
              </View>
              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: theme.colorTextMuted }]}>
                  {t('session.load')} ({planExercise.targetLoad?.unit ?? settings.unit})
                </Text>
                <TextInput
                  value={loadInput}
                  onChangeText={(v) => {
                    setLoadInput(v);
                    setInputError(false);
                  }}
                  keyboardType="decimal-pad"
                  style={inputStyle}
                />
              </View>
            </View>
            <Pressable
              onPress={() => void completeSet()}
              style={[styles.doneButton, { backgroundColor: theme.colorPrimary }]}
            >
              <Text style={[styles.doneLabel, { color: theme.colorOnPrimary }]}>
                {exerciseDone ? t('session.logExtra') : t('session.done')}
              </Text>
            </Pressable>
          </View>
        )}

        {showNextExercise ? (
          <Pressable
            onPress={goToNextIncomplete}
            style={[styles.nextButton, { backgroundColor: theme.colorAccent }]}
          >
            <Text style={[styles.nextLabel, { color: theme.colorOnAccent }]}>
              {t('session.nextExercise')}
            </Text>
            <Ionicons name="arrow-forward" size={18} color={theme.colorOnAccent} />
          </Pressable>
        ) : null}

        <Pressable
          onPress={finishWorkout}
          style={[
            styles.finishButton,
            complete
              ? { backgroundColor: theme.colorAccent }
              : { borderColor: theme.colorPrimaryStrong, borderWidth: 1 },
          ]}
        >
          <Text
            style={[
              styles.finishLabel,
              { color: complete ? theme.colorOnAccent : theme.colorPrimaryStrong },
            ]}
          >
            {t('session.finish')}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  headerButton: { padding: 6 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontFamily: fonts.subtitle, fontSize: 18 },
  headerProgress: { fontFamily: fonts.body, fontSize: 12, marginTop: 2 },
  banner: { borderRadius: 16, padding: 12, marginBottom: 12, alignItems: 'center' },
  bannerText: { fontFamily: fonts.subtitle, fontSize: 14 },
  mediaCard: { borderRadius: 24, padding: 10, marginBottom: 12 },
  photo: { width: '100%', height: 210, borderRadius: 18 },
  exerciseNav: { flexDirection: 'row', alignItems: 'center', paddingTop: 8 },
  navButton: { padding: 8 },
  exerciseTitleWrap: { flex: 1, alignItems: 'center' },
  exerciseName: { fontFamily: fonts.subtitle, fontSize: 16, textAlign: 'center' },
  exerciseIndex: { fontFamily: fonts.body, fontSize: 12, marginTop: 2 },
  infoPanel: { borderRadius: 18, padding: 14, marginBottom: 12 },
  infoTitle: { fontFamily: fonts.subtitle, fontSize: 14 },
  infoLine: { fontFamily: fonts.body, fontSize: 13, marginTop: 6 },
  videoLink: { fontFamily: fonts.bodyStrong, fontSize: 13, marginTop: 8, textDecorationLine: 'underline' },
  restPanel: { borderRadius: 18, padding: 18, marginBottom: 12, alignItems: 'center' },
  restLabel: { fontFamily: fonts.label, fontSize: 14 },
  restTime: { fontFamily: fonts.title, fontSize: 44, marginVertical: 6 },
  skip: { borderRadius: 999, paddingHorizontal: 22, paddingVertical: 8 },
  skipLabel: { fontFamily: fonts.label, fontSize: 13 },
  logCard: { borderRadius: 18, padding: 14, marginBottom: 12 },
  setLabel: { fontFamily: fonts.subtitle, fontSize: 15, marginBottom: 6 },
  goalHint: { fontFamily: fonts.body, fontSize: 12, marginBottom: 10 },
  inputsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  field: { flex: 1 },
  fieldLabel: { fontFamily: fonts.label, fontSize: 12, marginBottom: 6 },
  input: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontFamily: fonts.body, fontSize: 16, borderWidth: 1, textAlign: 'center' },
  doneButton: { borderRadius: 999, paddingVertical: 13, alignItems: 'center' },
  doneLabel: { fontFamily: fonts.label, fontSize: 15 },
  nextButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 999, paddingVertical: 14, marginBottom: 12 },
  nextLabel: { fontFamily: fonts.label, fontSize: 15 },
  finishButton: { borderRadius: 999, paddingVertical: 13, alignItems: 'center', marginBottom: 12 },
  finishLabel: { fontFamily: fonts.label, fontSize: 15 },
});
