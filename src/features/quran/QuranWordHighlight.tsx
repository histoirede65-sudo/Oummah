import { memo } from 'react';
import { StyleSheet, Text } from 'react-native';

import { colors } from '../../theme/colors';
import { ARABIC_READING_COLOR } from './ArabicReadingPresentation';

function QuranWordHighlightComponent({ text, isActive, isRead }: {
  text: string;
  fontFamily: string;
  isActive: boolean;
  isRead: boolean;
}) {
  return <Text style={[styles.highlight, isRead && styles.read, isActive && styles.active]}>{text}</Text>;
}

export const QuranWordHighlight = memo(QuranWordHighlightComponent, (previous, next) => (
  previous.text === next.text
  && previous.fontFamily === next.fontFamily
  && previous.isActive === next.isActive
  && previous.isRead === next.isRead
));

const styles = StyleSheet.create({
  highlight: {
    color: colors.text,
    opacity: 0.94,
    textShadowColor: 'transparent',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 0,
  },
  read: { color: colors.goldMuted, opacity: 0.96 },
  active: { color: ARABIC_READING_COLOR, opacity: 1, textShadowColor: ARABIC_READING_COLOR, textShadowRadius: 7 },
});
