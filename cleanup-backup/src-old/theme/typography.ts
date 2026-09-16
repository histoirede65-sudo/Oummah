import { Platform } from 'react-native';

const sans = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  web: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  default: 'sans-serif',
});

const arabic = Platform.select({
  ios: 'Geeza Pro',
  android: 'serif',
  web: '"Noto Naskh Arabic", "Geeza Pro", serif',
  default: 'serif',
});

export const typography = {
  serif: 'CormorantGaramond-Regular',
  serifMedium: 'CormorantGaramond-Medium',
  serifSemibold: 'CormorantGaramond-SemiBold',
  sans,
  arabic,
  sansRegular: '400' as const,
  sansMedium: '500' as const,
  sansSemibold: '600' as const,
  sansBold: '700' as const,
} as const;
