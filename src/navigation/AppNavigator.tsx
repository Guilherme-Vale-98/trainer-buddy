import { NavigationContainer, DefaultTheme, type Theme as NavTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../core/theme/ThemeContext';
import { fonts } from '../shared/theme/tokens';
import { DashboardScreen } from '../features/dashboard/DashboardScreen';
import { PlanScreen } from '../features/plan/PlanScreen';
import { HistoryScreen } from '../features/history/HistoryScreen';
import { ProgressScreen } from '../features/progress/ProgressScreen';
import { SettingsScreen } from '../features/settings/SettingsScreen';
import { PlanBuilderScreen } from '../features/plan-builder/PlanBuilderScreen';
import type { WorkoutPlan } from '../core/db/models';

export type RootStackParamList = {
  Tabs: undefined;
  Settings: undefined;
  PlanBuilder: { plan?: WorkoutPlan };
};

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();

const TAB_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Dashboard: 'home',
  Plan: 'list',
  History: 'time',
  Progress: 'stats-chart',
};

function Tabs({ navigation }: { navigation: any }) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerTransparent: true,
        headerTitle: '',
        headerRight: () => (
          <Pressable onPress={() => navigation.navigate('Settings')} hitSlop={12} style={{ marginRight: 16 }}>
            <Ionicons name="settings-outline" size={22} color={theme.colorPrimaryStrong} />
          </Pressable>
        ),
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={TAB_ICONS[route.name]} size={size} color={color} />
        ),
        tabBarStyle: { backgroundColor: theme.colorPrimarySoft, borderTopWidth: 0 },
        tabBarActiveTintColor: theme.name === 'dark' ? '#FFFFFF' : theme.colorOnAccent,
        tabBarInactiveTintColor: theme.name === 'dark' ? 'rgba(255,255,255,0.65)' : 'rgba(35,35,35,0.55)',
        tabBarLabelStyle: { fontFamily: fonts.label, fontSize: 11 },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: t('tabs.dashboard') }} />
      <Tab.Screen name="Plan" component={PlanScreen} options={{ title: t('tabs.plan') }} />
      <Tab.Screen name="History" component={HistoryScreen} options={{ title: t('tabs.history') }} />
      <Tab.Screen name="Progress" component={ProgressScreen} options={{ title: t('tabs.progress') }} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const theme = useTheme();
  const { t } = useTranslation();

  const navTheme: NavTheme = {
    ...DefaultTheme,
    dark: theme.name === 'dark',
    colors: {
      ...DefaultTheme.colors,
      primary: theme.colorPrimary,
      background: theme.colorBg,
      card: theme.colorBg,
      text: theme.colorText,
      border: theme.colorDivider,
      notification: theme.colorAccent,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={Tabs} />
        <Stack.Screen name="PlanBuilder" component={PlanBuilderScreen} />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            headerShown: true,
            headerTitle: t('settings.title'),
            headerStyle: { backgroundColor: theme.colorBg },
            headerShadowVisible: false,
            headerTintColor: theme.colorPrimaryStrong,
            headerTitleStyle: { fontFamily: fonts.subtitle, fontSize: 20, color: theme.colorPrimaryStrong },
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
