import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { sessionRepository } from '../../core/db/session.repository';
import type { WorkoutPlan } from '../../core/db/models';
import type { RootStackParamList } from '../../navigation/AppNavigator';

export function useStartWorkout() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t } = useTranslation();

  return async (plan: WorkoutPlan, workoutSetId: string) => {
    try {
      const session = await sessionRepository.startSession(plan, workoutSetId);
      navigation.navigate('Session', { sessionId: session.id });
    } catch (error) {
      if (error instanceof Error && error.message === 'session-in-progress') {
        const existing = await sessionRepository.getInProgressSession();
        if (!existing) return;
        Alert.alert(t('session.inProgressTitle'), t('session.inProgressMessage'), [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('session.discard'),
            style: 'destructive',
            onPress: () => {
              void sessionRepository.deleteSession(existing.id).then(async () => {
                const session = await sessionRepository.startSession(plan, workoutSetId);
                navigation.navigate('Session', { sessionId: session.id });
              });
            },
          },
          {
            text: t('session.resume'),
            onPress: () => navigation.navigate('Session', { sessionId: existing.id }),
          },
        ]);
        return;
      }
      throw error;
    }
  };
}
