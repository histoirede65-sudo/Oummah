import { memo, type ReactNode } from 'react';
import { StyleSheet, Text, type TextProps } from 'react-native';

import {
  ARABIC_READING_COLOR,
  ARABIC_READING_FONT_FAMILY,
  ARABIC_READING_FONT_WEIGHT,
  getArabicReadingMetrics,
} from './ArabicReadingPresentation';

type QuranArabicTextProps = Omit<TextProps, 'children'> & {
  children?: ReactNode;
  text?: string;
  screenWidth: number;
  preferredSize?: number;
};

function QuranArabicTextComponent({
  children,
  text,
  screenWidth,
  preferredSize = 38,
  style,
  ...props
}: QuranArabicTextProps) {
  return (
    <Text
      {...props}
      style={[styles.text, getArabicReadingMetrics(screenWidth, preferredSize), style]}
    >
      {children ?? text}
    </Text>
  );
}

export const QuranArabicText = memo(QuranArabicTextComponent);

const styles = StyleSheet.create({
  text: {
    color: ARABIC_READING_COLOR,
    fontFamily: ARABIC_READING_FONT_FAMILY,
    fontWeight: ARABIC_READING_FONT_WEIGHT,
    writingDirection: 'rtl',
    textAlign: 'right',
    paddingVertical: 8,
  },
});
