import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import { SURAHS } from '../../data/surahs';
import { ARABIC_READING_FONT_FAMILY } from '../../features/quran/ArabicReadingPresentation';
import { loadMushafFont, MUSHAF_LINES_PER_PAGE, prepareMushafPage, type MushafPage, type MushafStyle } from '../../features/quran/mushaf/MushafRepository';
import { useI18n } from '../../i18n';
import { MushafZoom } from './MushafZoom';

const PAPER = '#FBF6E9';
const INK = '#1B1712';
const FRAME = '#C9A35A';
const HEADER_FILL = '#F1E6C8';
// Recitation, letters only: the verse in gold ink, the recited word in a deep red-brown.
// The tajweed font carries its own colours, so the recited verse is drawn with the classic font of the same page.
const VERSE_INK = '#B07A0A';
const WORD_INK = '#9A2A0E';
const BASMALA = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';

type Props = {
  /** Pages shown, in reading order (the surah's pages). */
  pages: number[];
  style: MushafStyle;
  initialPage: number;
  /** Verse being recited: its page comes into view and the verse is lit. */
  activeVerseKey?: string | null;
  activeWordPosition?: number | null;
  onVersePress: (verseKey: string) => void;
  /** Page carrying the reader's bookmark ribbon. */
  bookmarkPage?: number | null;
  /** Page in view, with the surahs it contains (in order), once its layout is known. */
  onPageChange?: (page: number, chapters: number[]) => void;
  /** Asks the pager to show this page (nonce: a new request each time). */
  jumpTo?: { page: number; nonce: number } | null;
};

/** The Mushaf's pages, turned from right to left like a printed book. */
export function MushafPager({ pages, style, initialPage, activeVerseKey, activeWordPosition, onVersePress, bookmarkPage, onPageChange, jumpTo }: Props) {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const listRef = useRef<FlatList<number>>(null);
  const pageOfVerse = useRef(new Map<string, number>());
  const initialIndex = Math.max(0, pages.indexOf(initialPage));
  const { t } = useI18n();
  // Zoomed page: the page turn waits until the page is back to normal size.
  const [zoomed, setZoomed] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const pageChange = useRef(onPageChange);
  useEffect(() => { pageChange.current = onPageChange; }, [onPageChange]);
  // Surahs of each loaded page; the page in view is reported once its layout is known.
  const pageChapters = useRef(new Map<number, number[]>());
  const visiblePage = useRef<number | null>(null);
  const viewability = useCallback(({ viewableItems }: { viewableItems: { item: number }[] }) => {
    const visible = viewableItems[0]?.item;
    if (typeof visible !== 'number') return;
    visiblePage.current = visible;
    const chapters = pageChapters.current.get(visible);
    if (chapters) pageChange.current?.(visible, chapters);
  }, []);
  const resetZoom = () => {
    setZoomed(false);
    setResetKey((value) => value + 1);
  };

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (!size || Math.abs(size.width - width) > 1 || Math.abs(size.height - height) > 1) setSize({ width, height });
  };

  const register = useCallback((layout: MushafPage) => {
    const chapters: number[] = [];
    for (const line of layout.lines) {
      for (const word of line.words) {
        pageOfVerse.current.set(word.verseKey, layout.page);
        const chapter = Number(word.verseKey.split(':')[0]);
        if (!chapters.includes(chapter)) chapters.push(chapter);
      }
    }
    pageChapters.current.set(layout.page, chapters);
    if (visiblePage.current === layout.page) pageChange.current?.(layout.page, chapters);
  }, []);

  useEffect(() => {
    if (!jumpTo || !size) return;
    const index = pages.indexOf(jumpTo.page);
    if (index >= 0) listRef.current?.scrollToIndex({ index, animated: true });
  }, [jumpTo, pages, size]);

  // During recitation, the page of the recited verse comes into view.
  useEffect(() => {
    if (!activeVerseKey || !size) return;
    const page = pageOfVerse.current.get(activeVerseKey);
    const index = page ? pages.indexOf(page) : -1;
    if (index >= 0) listRef.current?.scrollToIndex({ index, animated: true });
  }, [activeVerseKey, pages, size]);

  return (
    <View style={styles.root} onLayout={onLayout}>
      {size ? (
        <FlatList
          ref={listRef}
          data={pages}
          horizontal
          inverted
          pagingEnabled
          scrollEnabled={!zoomed}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(page) => String(page)}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({ length: size.width, offset: size.width * index, index })}
          windowSize={3}
          initialNumToRender={1}
          maxToRenderPerBatch={2}
          extraData={`${activeVerseKey}-${activeWordPosition}-${zoomed}-${resetKey}-${bookmarkPage}`}
          onViewableItemsChanged={viewability}
          viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
          renderItem={({ item }) => (
            <MushafPageView
              page={item}
              style={style}
              width={size.width}
              height={size.height}
              activeVerseKey={activeVerseKey ?? null}
              activeWordPosition={activeWordPosition ?? null}
              onVersePress={onVersePress}
              onLoaded={register}
              resetKey={resetKey}
              zoomed={zoomed}
              onZoomChange={setZoomed}
              bookmarked={item === bookmarkPage}
            />
          )}
        />
      ) : null}
      {zoomed ? (
        <Pressable accessibilityRole="button" onPress={resetZoom} style={styles.resetZoom}>
          <Text style={styles.resetZoomText}>{t('surahReader.mushafResetZoom')}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const MushafPageView = memo(function MushafPageView({ page, style, width, height, activeVerseKey, activeWordPosition, onVersePress, onLoaded, resetKey, zoomed, onZoomChange, bookmarked }: {
  page: number;
  style: MushafStyle;
  width: number;
  height: number;
  activeVerseKey: string | null;
  activeWordPosition: number | null;
  onVersePress: (verseKey: string) => void;
  onLoaded: (layout: MushafPage) => void;
  resetKey: number;
  zoomed: boolean;
  onZoomChange: (zoomed: boolean) => void;
  bookmarked: boolean;
}) {
  const { t } = useI18n();
  const [state, setState] = useState<{ key: string; layout: MushafPage; family: string; inkFamily: string } | { key: string; error: true } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const key = `${page}-${style}-${attempt}`;

  useEffect(() => {
    let active = true;
    Promise.all([prepareMushafPage(page, style), style === 'tajweed' ? loadMushafFont(page, 'plain') : null])
      .then(([{ layout, family }, plainFamily]) => {
        if (!active) return;
        onLoaded(layout);
        setState({ key, layout, family, inkFamily: plainFamily ?? family });
      })
      .catch(() => {
        if (active) setState({ key, error: true });
      });
    return () => { active = false; };
  }, [key, onLoaded, page, style]);

  const current = state?.key === key ? state : null;
  const pageWidth = width - 6;
  const innerWidth = pageWidth - 12;
  const lineHeight = (height - 4 - 18) / MUSHAF_LINES_PER_PAGE;
  // Pages 1 and 2 (Al-Fâtiha, start of Al-Baqara) are shorter and centred, as in the printed Mushaf.
  const opening = page <= 2;
  const fontSize = Math.min(innerWidth * (opening ? 0.07 : 0.0605), lineHeight * 0.66);

  const rows = useMemo(() => {
    if (!current || 'error' in current) return [];
    const { layout } = current;
    const words = new Map(layout.lines.map((line) => [line.number, line]));
    const headers = new Map<number, { kind: 'name' | 'basmala'; chapter: number }>();
    for (const start of layout.surahStarts) {
      const basmala = start.chapter !== 1 && start.chapter !== 9;
      if (basmala) headers.set(start.firstLine - 1, { kind: 'basmala', chapter: start.chapter });
      headers.set(start.firstLine - (basmala ? 2 : 1), { kind: 'name', chapter: start.chapter });
    }
    const last = opening ? Math.max(...layout.lines.map((line) => line.number)) : MUSHAF_LINES_PER_PAGE;
    return Array.from({ length: last }, (_, index) => index + 1).map((number) => ({ number, line: words.get(number), header: headers.get(number) }));
  }, [current, opening]);

  // Centre of the line being recited, so a zoomed page follows the recitation.
  const focusY = useMemo(() => {
    if (!activeVerseKey) return null;
    const index = rows.findIndex(({ line }) => line?.words.some((word) => word.verseKey === activeVerseKey && (activeWordPosition === null || word.position === activeWordPosition)));
    const fallback = index >= 0 ? index : rows.findIndex(({ line }) => line?.words.some((word) => word.verseKey === activeVerseKey));
    if (fallback < 0) return null;
    const contentHeight = height - 4 - 18;
    const top = opening ? (contentHeight - rows.length * lineHeight) / 2 : 0;
    return 4 + top + (fallback + 0.5) * lineHeight;
  }, [activeVerseKey, activeWordPosition, height, lineHeight, opening, rows]);

  return (
    <View style={{ width, height, overflow: 'hidden' }}>
    <MushafZoom width={width} height={height} resetKey={resetKey} zoomed={zoomed} focusY={focusY} onZoomChange={onZoomChange}>
    <View style={[styles.slot, { width, height }]}>
      <View style={[styles.page, { width: pageWidth }]}>
        {!current ? (
          <View style={styles.center}><ActivityIndicator color={FRAME} /></View>
        ) : 'error' in current ? (
          <Pressable onPress={() => setAttempt((value) => value + 1)} style={styles.center}>
            <Text style={styles.errorText}>{t('surahReader.mushafPageError')}</Text>
          </Pressable>
        ) : (
          <View style={[styles.lines, opening && styles.linesOpening]}>
            {rows.map(({ number, line, header }) => {
              if (line) {
                return (
                  <View key={number} style={[styles.line, { height: lineHeight }, opening && styles.lineOpening]}>
                    {line.words.map((word, index) => {
                      const inVerse = word.verseKey === activeVerseKey;
                      const isWord = inVerse && word.position !== null && word.position === activeWordPosition;
                      return (
                        <Text
                          key={`${word.verseKey}-${index}`}
                          allowFontScaling={false}
                          onPress={() => onVersePress(word.verseKey)}
                          style={[
                            { fontFamily: inVerse ? current.inkFamily : current.family, fontSize, lineHeight, color: INK },
                            inVerse && styles.verseInk,
                            isWord && styles.wordInk,
                          ]}
                        >
                          {word.code}
                        </Text>
                      );
                    })}
                  </View>
                );
              }
              if (header?.kind === 'name') {
                return (
                  <View key={number} style={[styles.surahName, { height: lineHeight * 0.86, marginVertical: lineHeight * 0.07 }]}>
                    <Text allowFontScaling={false} style={[styles.surahNameText, { fontSize: fontSize * 0.82 }]}>
                      سُورَةُ {SURAHS.find((surah) => surah.id === header.chapter)?.arabicName ?? ''}
                    </Text>
                  </View>
                );
              }
              if (header?.kind === 'basmala') {
                return (
                  <View key={number} style={[styles.basmala, { height: lineHeight }]}>
                    <Text allowFontScaling={false} style={[styles.basmalaText, { fontSize: fontSize * 0.86 }]}>{BASMALA}</Text>
                  </View>
                );
              }
              return <View key={number} style={{ height: lineHeight }} />;
            })}
          </View>
        )}
        <Text numberOfLines={1} style={styles.pageNumber}>{page}  ·  {t('surahReader.mushafCredit')}</Text>
        {bookmarked ? (
          <View pointerEvents="none" style={styles.ribbon} accessibilityLabel={t('surahReader.mushafBookmarkHere')}>
            <View style={styles.ribbonBody} />
            <View style={styles.ribbonTail} />
          </View>
        ) : null}
      </View>
    </View>
    </MushafZoom>
    </View>
  );
});

const styles = StyleSheet.create({
  root: { flex: 1 },
  ribbon: { position: 'absolute', top: -2, left: 18, width: 18, alignItems: 'center' },
  ribbonBody: { width: 18, height: 34, backgroundColor: '#A3271C' },
  ribbonTail: { width: 0, height: 0, borderLeftWidth: 9, borderRightWidth: 9, borderTopWidth: 8, borderLeftColor: '#A3271C', borderRightColor: '#A3271C', borderTopColor: 'transparent' },
  resetZoom: { position: 'absolute', top: 10, alignSelf: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, backgroundColor: 'rgba(11,9,24,0.85)', borderWidth: 1, borderColor: FRAME },
  resetZoomText: { color: '#F4E3B5', fontSize: 13, fontWeight: '800' },
  slot: { alignItems: 'center', justifyContent: 'center' },
  page: {
    flex: 1, marginVertical: 2, paddingHorizontal: 6, paddingTop: 2, borderRadius: 8, backgroundColor: PAPER,
    borderWidth: 1.5, borderColor: FRAME,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  errorText: { color: INK, fontSize: 15, textAlign: 'center', lineHeight: 21 },
  lines: { flex: 1 },
  linesOpening: { justifyContent: 'center' },
  line: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  lineOpening: { justifyContent: 'center', gap: 6 },
  verseInk: { color: VERSE_INK },
  wordInk: { color: WORD_INK },
  surahName: { alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: FRAME, borderRadius: 10, backgroundColor: HEADER_FILL },
  surahNameText: { color: INK, fontFamily: ARABIC_READING_FONT_FAMILY },
  basmala: { alignItems: 'center', justifyContent: 'center' },
  basmalaText: { color: INK, fontFamily: ARABIC_READING_FONT_FAMILY },
  pageNumber: { height: 18, textAlign: 'center', textAlignVertical: 'center', lineHeight: 18, color: '#8A7E69', fontSize: 10 },
});
