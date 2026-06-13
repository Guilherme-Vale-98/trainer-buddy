import type { ImageSourcePropType } from 'react-native';

export interface Article {
  id: string;
  titleKey: string;
  url: string;
  image: ImageSourcePropType;
}

export const articles: Article[] = [
  {
    id: 'nutrition',
    titleKey: 'dashboard.articleNutrition',
    url: 'https://en.wikipedia.org/wiki/Healthy_diet',
    image: require('../../content/articles/article-nutrition.jpg'),
  },
  {
    id: 'gym',
    titleKey: 'dashboard.articleGym',
    url: 'https://en.wikipedia.org/wiki/Strength_training',
    image: require('../../content/articles/article-gym.jpg'),
  },
  {
    id: 'running',
    titleKey: 'dashboard.articleRunning',
    url: 'https://en.wikipedia.org/wiki/Running',
    image: require('../../content/articles/article-running.jpg'),
  },
  {
    id: 'stretching',
    titleKey: 'dashboard.articleStretching',
    url: 'https://en.wikipedia.org/wiki/Stretching',
    image: require('../../content/articles/article-stretching.jpg'),
  },
  {
    id: 'sleep',
    titleKey: 'dashboard.articleSleep',
    url: 'https://en.wikipedia.org/wiki/Sleep_and_health',
    image: require('../../content/articles/article-sleep.jpg'),
  },
];
