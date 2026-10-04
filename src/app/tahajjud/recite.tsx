import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { Href } from 'expo-router';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GlassCard, shellStyles, TahajjudShell } from '../../components/tahajjud/TahajjudShell';
import { night, nightType } from '../../components/tahajjud/theme';
import type { Surah } from '../../data/surahs';
import { loadKnownSurahs, prefetchReciteSurahs, RECITE_GROUPS, toggleKnownSurah } from '../../features/tahajjud/tahajjudRecite';

/** « Que réciter dans ma prière ? » : short surahs by length, with « je la connais ». */
export default function ReciteScreen() {
  const [known, setKnown] = useState<number[]>([]);
  const [onlyKnown, setOnlyKnown] = useState(false);

  useFocusEffect(useCallback(() => {
    void loadKnownSurahs().then(setKnown);
    void prefetchReciteSurahs();
  }, []));

  const toggle = async (id: number) => {
    void Haptics.selectionAsync().catch(() => undefined);
    setKnown(await toggleKnownSurah(id));
  };

  const open = (surah: Surah) => router.push({ pathname: '/tahajjud/recite-surah', params: { id: String(surah.id) } } as unknown as Href);

  return (
    <TahajjudShell title="Que réciter ?" eyebrow="Dans ma prière">
      <Text style={styles.intro}>
        Après Al-Fatiha, récitez ce que vous connaissez, même une courte sourate. Marquez celles que vous connaissez avec l’étoile pour les retrouver la nuit.
      </Text>

      <View style={styles.filters}>
        {([[false, 'Toutes'], [true, `Je les connais · ${known.length}`]] as const).map(([value, label]) => (
          <Pressable key={label} onPress={() => setOnlyKnown(value)} style={[styles.filter, onlyKnown === value && styles.filterOn]}>
            <Text style={[styles.filterText, onlyKnown === value && styles.filterTextOn]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {onlyKnown && known.length === 0 ? (
        <GlassCard style={styles.empty}>
          <Ionicons name="star-outline" size={28} color={night.goldSoft} />
          <Text style={styles.emptyText}>Touchez l’étoile d’une sourate pour l’ajouter ici.</Text>
        </GlassCard>
      ) : null}

      {RECITE_GROUPS.map((group) => {
        const surahs = onlyKnown ? group.surahs.filter((surah) => known.includes(surah.id)) : group.surahs;
        if (!surahs.length) return null;
        return (
          <View key={group.id} style={styles.group}>
            <Text style={shellStyles.sectionLabel}>{group.title}</Text>
            {!onlyKnown ? <Text style={styles.groupHint}>{group.hint}</Text> : null}
            <GlassCard style={styles.list}>
              {surahs.map((surah, index) => {
                const isKnown = known.includes(surah.id);
                return (
                  <Pressable key={surah.id} onPress={() => open(surah)} style={({ pressed }) => [styles.row, index > 0 && styles.rowBorder, pressed && styles.pressed]}>
                    <View style={styles.number}><Text style={styles.numberText}>{surah.id}</Text></View>
                    <View style={styles.copy}>
                      <Text style={styles.name}>{surah.transliteration}</Text>
                      <Text style={styles.meta}>{surah.frenchName} · {surah.verses} versets</Text>
                    </View>
                    <Text style={styles.arabic}>{surah.arabicName}</Text>
                    <Pressable onPress={() => void toggle(surah.id)} hitSlop={10} accessibilityLabel={isKnown ? 'Je ne la connais pas' : 'Je la connais'}>
                      <Ionicons name={isKnown ? 'star' : 'star-outline'} size={21} color={isKnown ? night.gold : night.muted} />
                    </Pressable>
                  </Pressable>
                );
              })}
            </GlassCard>
          </View>
        );
      })}

      <Text style={styles.footer}>Texte et traduction : le Coran d’OUMMAH. Les sourates courtes restent disponibles hors connexion.</Text>
    </TahajjudShell>
  );
}

const styles = StyleSheet.create({
  intro: { color: night.textSoft, fontSize: 17, lineHeight: 24, marginBottom: 16, ...nightType.body },
  filters: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  filter: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 18, borderWidth: 1, borderColor: night.goldLine },
  filterOn: { backgroundColor: night.gold, borderColor: night.gold },
  filterText: { color: night.goldSoft, fontSize: 15, ...nightType.semibold },
  filterTextOn: { color: night.sky0 },
  empty: { marginTop: 14, alignItems: 'center', gap: 8 },
  emptyText: { color: night.textSoft, fontSize: 15, textAlign: 'center', ...nightType.body },
  group: { marginTop: 22 },
  groupHint: { marginTop: -6, marginBottom: 10, color: night.muted, fontSize: 14, ...nightType.body },
  list: { paddingVertical: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
  rowBorder: { borderTopWidth: 1, borderTopColor: night.line },
  number: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: night.goldLine },
  numberText: { color: night.goldSoft, fontSize: 13, ...nightType.bold },
  copy: { flex: 1 },
  name: { color: night.text, fontSize: 17, ...nightType.semibold },
  meta: { marginTop: 2, color: night.muted, fontSize: 13, ...nightType.body },
  arabic: { color: night.goldSoft, fontSize: 20, ...nightType.arabic },
  footer: { marginTop: 22, color: night.muted, fontSize: 13, lineHeight: 18, textAlign: 'center', ...nightType.body },
  pressed: { opacity: 0.8 },
});
