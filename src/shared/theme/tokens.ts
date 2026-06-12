export interface Theme {
  name: 'dark' | 'light';
  colorBg: string;
  colorSurface: string;
  colorSurfaceTint: string;
  colorPrimary: string;
  colorPrimaryStrong: string;
  colorPrimarySoft: string;
  colorPrimaryDeep: string;
  colorAccent: string;
  colorAccentStrong: string;
  colorText: string;
  colorTextMuted: string;
  colorOnPrimary: string;
  colorOnAccent: string;
  colorTrack: string;
  colorDivider: string;
  colorDanger: string;
}

export const darkTheme: Theme = {
  name: 'dark',
  colorBg: '#232323',
  colorSurface: '#FFFFFF',
  colorSurfaceTint: '#353043',
  colorPrimary: '#896CFE',
  colorPrimaryStrong: '#B3A0FF',
  colorPrimarySoft: '#B3A0FF',
  colorPrimaryDeep: '#7C57FF',
  colorAccent: '#E2F163',
  colorAccentStrong: '#E2F163',
  colorText: '#FFFFFF',
  colorTextMuted: '#ACABAB',
  colorOnPrimary: '#FFFFFF',
  colorOnAccent: '#232323',
  colorTrack: '#D9D9D9',
  colorDivider: '#3D3C3C',
  colorDanger: '#FF7A7A',
};

export const lightTheme: Theme = {
  name: 'light',
  colorBg: '#F7F6FB',
  colorSurface: '#FFFFFF',
  colorSurfaceTint: '#EFEBFF',
  colorPrimary: '#896CFE',
  colorPrimaryStrong: '#6C4DE0',
  colorPrimarySoft: '#B3A0FF',
  colorPrimaryDeep: '#6C4DE0',
  colorAccent: '#E2F163',
  colorAccentStrong: '#5F6C00',
  colorText: '#232323',
  colorTextMuted: '#6E6D73',
  colorOnPrimary: '#FFFFFF',
  colorOnAccent: '#232323',
  colorTrack: '#DAD8E4',
  colorDivider: '#E4E2EC',
  colorDanger: '#C0392B',
};

export const fonts = {
  title: 'Poppins_700Bold',
  subtitle: 'Poppins_600SemiBold',
  label: 'Poppins_500Medium',
  body: 'LeagueSpartan_400Regular',
  bodyStrong: 'LeagueSpartan_600SemiBold',
} as const;
