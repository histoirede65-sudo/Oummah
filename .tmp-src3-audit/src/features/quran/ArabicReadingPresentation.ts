import { colors } from '../../theme/colors';

export const ARABIC_READING_FONT_FAMILY = 'UthmanicHafs';
export const ARABIC_READING_COLOR = colors.goldLight;
export const ARABIC_READING_FONT_WEIGHT = '400' as const;

export function getArabicReadingMetrics(screenWidth: number, preferredSize = 38) {
  const responsiveSize = screenWidth < 375 ? 34 : screenWidth < 430 ? 38 : 42;
  return {
    fontSize: Math.max(34, Math.min(42, responsiveSize + preferredSize - 38)),
    lineHeight: screenWidth < 375 ? 58 : screenWidth < 430 ? 64 : 70,
    paddingHorizontal: screenWidth < 375 ? 24 : 30,
  };
}
