import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  pt: {
    translation: {
      'app.name': 'Trainer Buddy',
      'tabs.dashboard': 'Início',
      'tabs.plan': 'Plano',
      'tabs.history': 'Histórico',
      'tabs.progress': 'Progresso',
      'dashboard.title': 'Início',
      'dashboard.noPlan': 'Você ainda não tem um plano de treino.',
      'dashboard.createPlan': 'Criar plano',
      'dashboard.catalogCount': '{{count}} exercícios no catálogo',
      'plan.title': 'Plano de treino',
      'plan.empty': 'Nenhum plano ativo. Crie um na aba Início.',
      'planBuilder.title': 'Montar plano',
      'session.start': 'Iniciar treino',
      'session.finish': 'Finalizar treino',
      'session.rest': 'Descanso',
      'history.title': 'Histórico',
      'history.empty': 'Nenhum treino concluído ainda.',
      'progress.title': 'Progresso',
      'progress.empty': 'Os gráficos aparecem depois dos primeiros treinos.',
      'settings.title': 'Ajustes',
      'settings.language': 'Idioma',
      'settings.theme': 'Tema',
      'settings.theme.light': 'Claro',
      'settings.theme.dark': 'Escuro',
      'settings.theme.system': 'Sistema',
      'settings.unit': 'Unidade de carga',
      'settings.about': 'Sobre',
      'settings.attribution':
        'Fotos e textos em inglês: free-exercise-db (domínio público). Textos em português: curadoria própria. Referências cruzadas: wger.de. Design baseado no kit FITBODY (Figma Community).',
    },
  },
  en: {
    translation: {
      'app.name': 'Trainer Buddy',
      'tabs.dashboard': 'Home',
      'tabs.plan': 'Plan',
      'tabs.history': 'History',
      'tabs.progress': 'Progress',
      'dashboard.title': 'Home',
      'dashboard.noPlan': "You don't have a workout plan yet.",
      'dashboard.createPlan': 'Create plan',
      'dashboard.catalogCount': '{{count}} exercises in the catalog',
      'plan.title': 'Workout plan',
      'plan.empty': 'No active plan. Create one from the Home tab.',
      'planBuilder.title': 'Plan builder',
      'session.start': 'Start workout',
      'session.finish': 'Finish workout',
      'session.rest': 'Rest',
      'history.title': 'History',
      'history.empty': 'No completed workouts yet.',
      'progress.title': 'Progress',
      'progress.empty': 'Charts show up after your first workouts.',
      'settings.title': 'Settings',
      'settings.language': 'Language',
      'settings.theme': 'Theme',
      'settings.theme.light': 'Light',
      'settings.theme.dark': 'Dark',
      'settings.theme.system': 'System',
      'settings.unit': 'Load unit',
      'settings.about': 'About',
      'settings.attribution':
        'Photos and English text: free-exercise-db (public domain). Portuguese text: curated. Cross-referenced with wger.de. Design based on the FITBODY kit (Figma Community).',
    },
  },
} as const;

i18n.use(initReactI18next).init({
  resources,
  lng: 'pt',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
