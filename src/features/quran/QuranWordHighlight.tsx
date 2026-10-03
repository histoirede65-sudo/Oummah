import { memo } from 'react';
import { StyleSheet, Text } from 'react-native';

import { colors } from '../../theme/colors';
import { ARABIC_READING_COLOR } from './ArabicReadingPresentation';

function QuranWordHighlightComponent({ text, fontFamily, fontSize, lineHeight, isActive, isRead, isSelected = false, useReadingColor = false }: {
  text: string;
  fontFamily: string;
  fontSize?: number;
  lineHeight?: number;
  isActive: boolean;
  isRead: boolean;
  isSelected?: boolean;
  useReadingColor?: boolean;
}) {
  return (
    <Text
      style={[
        styles.highlight,
        { fontFamily, fontSize, lineHeight },
        useReadingColor && styles.readingColor,
        isRead && styles.read,
        isActive && styles.active,
        isSelected && styles.selected,
      ]}
    >
      {text}
    </Text>
  );
}

export const QuranWordHighlight = memo(QuranWordHighlightComponent, (previous, next) => (
  previous.text === next.text
  && previous.fontFamily === next.fontFamily
  && previous.fontSize === next.fontSize
  && previous.lineHeight === next.lineHeight
  && previous.isActive === next.isActive
  && previous.isRead === next.isRead
  && previous.isSelected === next.isSelected
  && previous.useReadingColor === next.useReadingColor
));

const styles = StyleSheet.create({
  highlight: {
    color: colors.text,
    opacity: 0.94,
    textShadowColor: 'transparent',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 0,
  },
  readingColor: { color: ARABIC_READING_COLOR },
  read: { color: colors.goldMuted, opacity: 0.96 },
  active: { color: ARABIC_READING_COLOR, opacity: 1, textShadowColor: ARABIC_READING_COLOR, textShadowRadius: 7 },
  selected: { color: colors.goldLight, opacity: 1, backgroundColor: 'rgba(224,188,112,0.22)', textShadowColor: colors.goldLight, textShadowRadius: 8 },
});
