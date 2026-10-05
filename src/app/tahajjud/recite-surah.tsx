import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import type { Href } from 'expo-router';
import { router, useLocalSearchParams } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { night, nightType } from '../../components/tahajjud/theme';
import { getReciteSurah, RECITE_ORDER, surahById, type ReciteVerse, surahName } from '../../features/tahajjud/tahajjudRecite';
import { tx } from '../../features/tahajjud/tahajjudI18n';

const PREFS_KEY = 'oummah.qiyam.recite.prefs.v1';
type Prefs = { size: number; phonetic: boolean; translation: boolean };
const DEFAULT_PREFS: Prefs = { size: 30, phonetic: true, translation: true };
const SIZES = [24, 27, 30, 34, 38, 44];

/** Reader for the night prayer: dark, large Arabic, phonetic and translation, screen kept on. */
export default function ReciteSurahScreen() {
  useKeepAwake();
  const { id } = useLocalSearchParams<{ id: string }>();
  const surahId = Number(id) || 1;
  const surah = surahById(surahId);
  const [verses, setVerses] = useState<ReciteVerse[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const scroll = useRef<ScrollView>(null);

  useEffect(() => {
    void AsyncStorage.getItem(PREFS_KEY).then((raw) => {
      if (raw) setPrefs({ ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<Prefs>) });
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    let active = true;
    setVerses(null);
    setFailed(false);
    scroll.current?.scrollTo({ y: 0, animated: false });
    void getReciteSurah(surahId)
      .then((list) => { if (active) setVerses(list); })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [surahId]);

  const updatePrefs = (next: Prefs) => {
    setPrefs(next);
    void AsyncStorage.setItem(PREFS_KEY, JSON.stringify(next)).catch(() => undefined);
  };
  const sizeIndex = Math.max(0, SIZES.indexOf(prefs.size));

  const position = RECITE_ORDER.indexOf(surahId);
  const previous = position > 0 ? surahById(RECITE_ORDER[position - 1]) : null;
  const next = position >= 0 && position < RECITE_ORDER.length - 1 ? surahById(RECITE_ORDER[position + 1]) : null;
  const go = (target: number) => router.replace({ pathname: '/tahajjud/recite-surah', params: { id: String(target) } } as unknown as Href);

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.flex}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel={tx("Retour")} onPress={() => router.back()} hitSlop={10} style={styles.round}>
            <Ionicons name="chevron-back" size={22} color={night.text} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.title} numberOfLines={1}>{surah?.transliteration ?? tx('Sourate')}</Text>
            <Text style={styles.sub} numberOfLines={1}>{surah ? tx("{0} · {1} versets", [surahName(surah), surah.verses]) : ''}</Text>
          </View>
          <Pressable
            onPress={() => updatePrefs({ ...prefs, size: SIZES[Math.max(0, sizeIndex - 1)] })}
            disabled={sizeIndex === 0}
            style={[styles.round, sizeIndex === 0 && styles.disabled]}
            accessibilityLabel={tx("Texte plus petit")}
          >
            <Text style={styles.sizeSmall}>A</Text>
          </Pressable>
          <Pressable
            onPress={() => updatePrefs({ ...prefs, size: SIZES[Math.min(SIZES.length - 1, sizeIndex + 1)] })}
            disabled={sizeIndex === SIZES.length - 1}
            style={[styles.round, sizeIndex === SIZES.length - 1 && styles.disabled]}
            accessibilityLabel={tx("Texte plus grand")}
          >
            <Text style={styles.sizeBig}>A</Text>
          </Pressable>
        </View>

        <View style={styles.toggles}>
          {([['phonetic', tx('Phonétique')], ['translation', tx('Traduction')]] as const).map(([key, label]) => (
            <Pressable key={key} onPress={() => updatePrefs({ ...prefs, [key]: !prefs[key] })} style={[styles.toggle, prefs[key] && styles.toggleOn]}>
              <Ionicons name={prefs[key] ? 'eye' : 'eye-off-outline'} size={15} color={prefs[key] ? night.sky0 : night.muted} />
              <Text style={[styles.toggleText, prefs[key] && styles.toggleTextOn]}>{label}</Text>
            </Pressable>
          ))}
        </View>

        {failed ? (
          <View style={styles.center}>
            <Ionicons name="cloud-offline-outline" size={34} color={night.lavender} />
            <Text style={styles.failed}>{tx("Cette sourate n’est pas encore enregistrée sur le téléphone. Connectez-vous une fois à Internet pour la garder hors connexion.")}</Text>
          </View>
        ) : verses === null ? (
          <View style={styles.center}><ActivityIndicator color={night.gold} /></View>
        ) : (
          <ScrollView ref={scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {surahId !== 1 && surahId !== 9 ? <Text style={[styles.basmala, { fontSize: prefs.size * 0.85 }]}>بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</Text> : null}
            {verses.map((verse) => (
              <View key={verse.number} style={styles.verse}>
                <Text style={[styles.arabic, { fontSize: prefs.size, lineHeight: prefs.size * 1.9 }]}>
                  {verse.arabic} <Text style={styles.verseNumber}>﴿{verse.number}﴾</Text>
                </Text>
                {prefs.phonetic && verse.phonetic ? <Text style={styles.phonetic}>{verse.phonetic}</Text> : null}
                {prefs.translation && verse.translation ? <Text style={styles.translation}>{verse.number}. {verse.translation}</Text> : null}
              </View>
            ))}

            <View style={styles.nav}>
              {previous ? (
                <Pressable onPress={() => go(previous.id)} style={styles.navButton}>
                  <Ionicons name="arrow-back" size={16} color={night.goldSoft} />
                  <Text style={styles.navText} numberOfLines={1}>{previous.transliteration}</Text>
                </Pressable>
              ) : <View style={styles.flex} />}
              {next ? (
                <Pressable onPress={() => go(next.id)} style={[styles.navButton, styles.navNext]}>
                  <Text style={styles.navText} numberOfLines={1}>{next.transliteration}</Text>
                  <Ionicons name="arrow-forward" size={16} color={night.goldSoft} />
                </Pressable>
              ) : <View style={styles.flex} />}
            </View>
            <Text style={styles.source}>{tx("Traduction du sens : Hamidullah · Phonétique indicative, à vérifier avec un enseignant.")}</Text>
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#030209' },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 6, paddingBottom: 8 },
  round: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: night.glassStrong, borderWidth: 1, borderColor: night.line },
  disabled: { opacity: 0.4 },
  headerCopy: { flex: 1, marginLeft: 4 },
  title: { color: night.text, fontSize: 22, ...nightType.display },
  sub: { color: night.muted, fontSize: 13, ...nightType.body },
  sizeSmall: { color: night.text, fontSize: 13, ...nightType.bold },
  sizeBig: { color: night.text, fontSize: 19, ...nightType.bold },
  toggles: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 8 },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 13, paddingVertical: 7, borderRadius: 16, borderWidth: 1, borderColor: night.goldLine },
  toggleOn: { backgroundColor: night.goldSoft, borderColor: night.goldSoft },
  toggleText: { color: night.muted, fontSize: 14, ...nightType.semibold },
  toggleTextOn: { color: night.sky0 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 30 },
  failed: { color: night.textSoft, fontSize: 16, lineHeight: 23, textAlign: 'center', ...nightType.body },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  basmala: { marginTop: 8, marginBottom: 18, color: night.goldSoft, textAlign: 'center', ...nightType.arabic },
  verse: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: night.line },
  arabic: { color: night.text, textAlign: 'right', writingDirection: 'rtl', ...nightType.arabic },
  verseNumber: { color: night.gold, fontSize: 20 },
  phonetic: { marginTop: 10, color: night.goldSoft, fontSize: 17, lineHeight: 25, fontStyle: 'italic', ...nightType.medium },
  translation: { marginTop: 8, color: night.muted, fontSize: 16, lineHeight: 23, ...nightType.body },
  nav: { marginTop: 24, flexDirection: 'row', gap: 10 },
  navButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 50, borderRadius: 25, borderWidth: 1, borderColor: night.goldLine, paddingHorizontal: 12 },
  navNext: { backgroundColor: night.glassStrong },
  navText: { flexShrink: 1, color: night.goldSoft, fontSize: 15, ...nightType.semibold },
  source: { marginTop: 18, color: night.muted, fontSize: 12, textAlign: 'center', ...nightType.body },
});
