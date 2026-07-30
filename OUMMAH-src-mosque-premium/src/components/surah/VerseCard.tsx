import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { VerseHighlightMode } from '../../core/audio';
import type { Verse } from '../../data/verses/al-fatiha';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import VerseActions from './VerseActions';
import VerseHighlighter from './VerseHighlighter';

type VerseCardProps = {
  verse: Verse;
  isFavorite?: boolean;
  isBookmarked?: boolean;
  showActions?: boolean;
  compact?: boolean;
  isActive?: boolean;
  progress?: number;
  highlightMode?: VerseHighlightMode;
  onListen: (verse: Verse) => void;
  onTafsir: (verse: Verse) => void;
  onDalil: (verse: Verse) => void;
  onFavorite: (verse: Verse) => void;
  onBookmark: (verse: Verse) => void;
  onShare: (verse: Verse) => void;
};

function VerseCard({
  verse,
  isFavorite,
  isBookmarked,
  showActions = true,
  compact,
  isActive = false,
  progress = 0,
  highlightMode = 'reading',
  onListen,
  onTafsir,
  onDalil,
  onFavorite,
  onBookmark,
  onShare,
}: VerseCardProps) {
  return (
    <VerseHighlighter verseId={verse.id} isActive={isActive} progress={progress} highlightMode={highlightMode}>
      <View style={[styles.card, compact && styles.cardCompact]}>
      <View style={styles.innerBorder} />
      <View style={[styles.ornament, styles.ornamentLeft]} />
      <View style={[styles.ornament, styles.ornamentRight]} />
      <View style={styles.number}><Text style={styles.numberText}>{verse.id}</Text></View>
      <Text style={[styles.arabic, compact && styles.arabicCompact]}>{verse.arabic}</Text>
      <View style={[styles.divider, compact && styles.dividerCompact]} />
      <Text style={[styles.french, compact && styles.frenchCompact]}>{verse.french}</Text>
      {showActions ? (
        <VerseActions
          isFavorite={isFavorite}
          isBookmarked={isBookmarked}
          compact={compact}
          onListen={() => onListen(verse)}
          onTafsir={() => onTafsir(verse)}
          onDalil={() => onDalil(verse)}
          onFavorite={() => onFavorite(verse)}
          onBookmark={() => onBookmark(verse)}
          onShare={() => onShare(verse)}
        />
      ) : null}
      </View>
    </VerseHighlighter>
  );
}

export default memo(VerseCard);

const styles = StyleSheet.create({
  card: { position: 'relative', marginTop: 15, paddingHorizontal: 21, paddingTop: 35, paddingBottom: 20, overflow: 'visible', borderRadius: 25, borderWidth: 1, borderColor: colors.goldDark, backgroundColor: colors.surface, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.14, shadowRadius: 9, elevation: 4 },
  cardCompact: { marginTop: 4, paddingHorizontal: 16, paddingTop: 24, paddingBottom: 8, borderRadius: 20 },
  innerBorder: { position: 'absolute', top: 9, right: 9, bottom: 9, left: 9, borderRadius: 19, borderWidth: 1, borderColor: 'rgba(200,148,58,0.22)' },
  ornament: { position: 'absolute', top: '48%', width: 22, height: 22, borderWidth: 1, borderColor: 'rgba(200,148,58,0.35)', transform: [{ rotate: '45deg' }] },
  ornamentLeft: { left: -11 },
  ornamentRight: { right: -11 },
  number: { position: 'absolute', top: -19, left: '50%', width: 42, height: 42, marginLeft: -21, alignItems: 'center', justifyContent: 'center', borderRadius: 21, borderWidth: 1.5, borderColor: colors.gold, backgroundColor: colors.purpleDeep, shadowColor: colors.gold, shadowOpacity: 0.35, shadowRadius: 7, elevation: 5 },
  numberText: { color: colors.goldMuted, fontFamily: typography.sans, fontSize: 10, fontWeight: '700' },
  arabic: { color: colors.goldMuted, fontFamily: typography.arabic, fontSize: 26, lineHeight: 43, fontWeight: '400', textAlign: 'center', writingDirection: 'rtl' },
  arabicCompact: { fontSize: 21, lineHeight: 31 },
  divider: { height: 1, marginVertical: 14, backgroundColor: colors.borderSoft },
  dividerCompact: { marginVertical: 6 },
  french: { color: colors.textSecondary, fontFamily: typography.sans, fontSize: 15, lineHeight: 22, textAlign: 'center' },
  frenchCompact: { fontSize: 13, lineHeight: 17 },
});
