import { useCallback, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { getAllExercises, getExerciseImages, getExerciseName } from '../../core/catalog/catalog';
import { planRepository } from '../../core/db/plan.repository';
import type { WorkoutPlan } from '../../core/db/models';
import { useSettings } from '../../core/settings/SettingsContext';
import { useTheme } from '../../core/theme/ThemeContext';
import { Screen } from '../../shared/components/Screen';
import { fonts } from '../../shared/theme/tokens';
import type { RootStackParamList } from '../../navigation/AppNavigator';

export function DashboardScreen() {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

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

  const exercises = getAllExercises();
  const sample = exercises[0];
  const sampleImage = getExerciseImages(sample.id)[0];

  return (
    <Screen title={t('dashboard.title')}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: theme.colorSurfaceTint }]}>
          <Text style={[styles.cardTitle, { color: theme.colorText }]}>
            {plan ? plan.name : t('dashboard.noPlan')}
          </Text>
          <Pressable
            onPress={() => navigation.navigate('PlanBuilder', plan ? { plan } : {})}
            style={[styles.cta, { backgroundColor: theme.colorPrimary }]}
          >
            <Text style={[styles.ctaLabel, { color: theme.colorOnPrimary }]}>
              {plan ? t('plan.edit') : t('dashboard.createPlan')}
            </Text>
          </Pressable>
        </View>

        <View style={[styles.mediaCard, { backgroundColor: theme.colorPrimarySoft }]}>
          {sampleImage ? <Image source={sampleImage} style={styles.photo} resizeMode="cover" /> : null}
          <Text style={[styles.exerciseName, { color: theme.colorOnAccent }]}>
            {getExerciseName(sample, settings.language)}
          </Text>
        </View>
        <Text style={[styles.muted, { color: theme.colorTextMuted }]}>
          {t('dashboard.catalogCount', { count: exercises.length })}
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, padding: 18, marginBottom: 16 },
  cardTitle: { fontFamily: fonts.body, fontSize: 15, marginBottom: 14 },
  cta: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 20, paddingVertical: 10 },
  ctaLabel: { fontFamily: fonts.label, fontSize: 14 },
  mediaCard: { borderRadius: 24, padding: 10, marginBottom: 10 },
  photo: { width: '100%', height: 200, borderRadius: 18 },
  exerciseName: { fontFamily: fonts.subtitle, fontSize: 16, textAlign: 'center', paddingVertical: 10 },
  muted: { fontFamily: fonts.body, fontSize: 13, marginBottom: 24 },
});
