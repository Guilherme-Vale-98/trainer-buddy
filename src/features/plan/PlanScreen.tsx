import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { getExercise } from '../../core/catalog/catalog';
import { planRepository } from '../../core/db/plan.repository';
import type { WorkoutPlan } from '../../core/db/models';
import { useStartWorkout } from '../session/useStartWorkout';
import { useTheme } from '../../core/theme/ThemeContext';
import { Screen } from '../../shared/components/Screen';
import { fonts } from '../../shared/theme/tokens';
import { workoutSetMuscleGroups } from './plan-logic';
import type { RootStackParamList } from '../../navigation/AppNavigator';

export function PlanScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const startWorkout = useStartWorkout();

  const [plan, setPlan] = useState<WorkoutPlan | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      planRepository.getActivePlan().then((loaded) => {
        if (active) setPlan(loaded);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  return (
    <Screen title={t('plan.title')} padded={false}>
      {plan ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <View style={styles.planHeader}>
            <Text style={[styles.planName, { color: theme.colorText }]}>{plan.name}</Text>
            <Pressable
              onPress={() => navigation.navigate('PlanBuilder', { plan })}
              style={[styles.editButton, { backgroundColor: theme.colorAccent }]}
            >
              <Text style={[styles.editLabel, { color: theme.colorOnAccent }]}>{t('plan.edit')}</Text>
            </Pressable>
          </View>
          {plan.workoutSets.map((set) => (
            <View
              key={set.id}
              style={[styles.setCard, { backgroundColor: theme.colorSurfaceTint, shadowColor: theme.colorShadow }]}
            >
              <View style={styles.setHeader}>
                <Text style={[styles.setName, { color: theme.colorPrimaryStrong }]}>{set.name}</Text>
                <Pressable
                  onPress={() => void startWorkout(plan, set.id)}
                  style={[styles.startButton, { backgroundColor: theme.colorPrimary }]}
                >
                  <Text style={[styles.startLabel, { color: theme.colorOnPrimary }]}>
                    {t('session.start')}
                  </Text>
                </Pressable>
              </View>
              <View style={styles.muscleRow}>
                {workoutSetMuscleGroups(set.exercises, (id) => getExercise(id)?.muscleGroup).map(
                  (group) => (
                    <View
                      key={group}
                      style={[styles.muscleChip, { backgroundColor: theme.colorPrimarySoft }]}
                    >
                      <Text style={[styles.muscleChipLabel, { color: theme.colorOnAccent }]}>
                        {t(`muscle.${group}`)}
                      </Text>
                    </View>
                  ),
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyWrap}>
          <Text style={[styles.empty, { color: theme.colorTextMuted }]}>{t('plan.empty')}</Text>
          <Pressable
            onPress={() => navigation.navigate('PlanBuilder', {})}
            style={[styles.createButton, { backgroundColor: theme.colorPrimary }]}
          >
            <Text style={[styles.createLabel, { color: theme.colorOnPrimary }]}>
              {t('dashboard.createPlan')}
            </Text>
          </Pressable>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 32 },
  emptyWrap: { paddingHorizontal: 20 },
  planHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  planName: { flex: 1, fontFamily: fonts.title, fontSize: 18 },
  editButton: { borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 },
  editLabel: { fontFamily: fonts.label, fontSize: 13 },
  setCard: {
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 3,
  },
  setHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  setName: { flex: 1, fontFamily: fonts.subtitle, fontSize: 15 },
  startButton: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 },
  startLabel: { fontFamily: fonts.label, fontSize: 12 },
  muscleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  muscleChip: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  muscleChipLabel: { fontFamily: fonts.label, fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase' },
  empty: { fontFamily: fonts.body, fontSize: 14, marginBottom: 16 },
  createButton: { borderRadius: 999, paddingVertical: 14, alignItems: 'center' },
  createLabel: { fontFamily: fonts.label, fontSize: 15 },
});
