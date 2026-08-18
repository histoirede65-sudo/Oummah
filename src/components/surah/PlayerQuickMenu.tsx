import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SURAHS } from '../../data/surahs';
import type { CatalogReciter } from '../../features/audio/domain/audio';
import { useGlobalAudioPlayer } from '../../context/AudioPlayerProvider';
import { useI18n } from '../../i18n';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

export default function PlayerQuickMenu({ visible, reciters, currentSurahId, currentReciterName, onClose, onSpeed, onTimer, onRepeat, onReciter, onSurah }: {
  visible: boolean;
  reciters: readonly CatalogReciter[];
  currentSurahId: number;
  currentReciterName?: string;
  onClose: () => void;
  onSpeed: () => void;
  onTimer: () => void;
  onRepeat: () => void;
  onReciter: (reciterId: string) => void;
  onSurah: (surahId: number) => void;
}) {
  const { t } = useI18n();
  const { playbackRate, sleepTimer, repeatMode } = useGlobalAudioPlayer();
  const [showReciters, setShowReciters] = useState(false);
  const [showSurahs, setShowSurahs] = useState(false);
  const close = () => { setShowReciters(false); setShowSurahs(false); onClose(); };
  const title = showReciters ? t('recitations.reciters') : showSurahs ? 'Changer de sourate' : t('audio.quickMenu');
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <Pressable onPress={close} style={styles.backdrop}>
        <Pressable onPress={(event) => event.stopPropagation()} style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>{title}</Text>
          {showReciters ? (
            <ScrollView style={styles.reciterList} showsVerticalScrollIndicator={false}>
              {reciters.map((reciter) => (
                <Pressable key={reciter.id} onPress={() => { onReciter(reciter.id); close(); }} style={({ pressed }) => [styles.reciterRow, pressed && styles.pressed]}>
                  <View style={styles.reciterIcon}><Ionicons name="mic-outline" size={17} color={colors.goldMuted} /></View>
                  <View style={styles.reciterCopy}><Text style={styles.reciterName}>{reciter.name}</Text><Text style={styles.reciterMeta}>{reciter.country} · {t(`recitations.style.${reciter.style}`)}</Text></View>
                  <Ionicons name="chevron-forward" size={15} color={colors.textMuted} />
                </Pressable>
              ))}
            </ScrollView>
          ) : showSurahs ? (
            <ScrollView style={styles.reciterList} showsVerticalScrollIndicator={false}>
              {SURAHS.map((surah) => (
                <Pressable key={surah.id} onPress={() => { onSurah(surah.id); close(); }} style={({ pressed }) => [styles.reciterRow, surah.id === currentSurahId && styles.activeRow, pressed && styles.pressed]}>
                  <View style={styles.reciterIcon}><Text style={styles.surahNumber}>{surah.id}</Text></View>
                  <View style={styles.reciterCopy}><Text style={styles.reciterName}>{surah.frenchName}</Text><Text style={styles.reciterMeta}>{surah.arabicName} · {surah.transliteration}</Text></View>
                  <Ionicons name="play-outline" size={15} color={surah.id === currentSurahId ? colors.goldMuted : colors.textMuted} />
                </Pressable>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.options}>
              <Text style={styles.sectionLabel}>RÉGLAGES DE LECTURE</Text>
              <Option icon="speedometer-outline" label="Vitesse de récitation" value={`${playbackRate}×`} onPress={onSpeed} />
              <Option icon="timer-outline" label="Minuteur de sommeil" value={sleepTimer ? `${sleepTimer} min` : "Désactivé"} description="Arrêter automatiquement la récitation" onPress={onTimer} />
              <Option icon="repeat-outline" label="Répétition" value={repeatMode === 'none' ? "Désactivée" : repeatMode === 'verse' ? "Verset ×3" : "Sourate"} description={repeatMode === 'none' ? undefined : "Idéal pour mémoriser un passage"} onPress={onRepeat} />
              <Text style={styles.sectionLabel}>CONTENU</Text>
              <Option icon="people-outline" label="Récitateur" value={currentReciterName ?? "Sélectionner"} onPress={() => setShowReciters(true)} />
              <Option icon="list-outline" label="Sourate" value={`${SURAHS[currentSurahId - 1]?.frenchName ?? ""} · ${currentSurahId}`} onPress={() => setShowSurahs(true)} />
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Option({ icon, label, value, description, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; description?: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.option, pressed && styles.pressed]}><View style={styles.optionIcon}><Ionicons name={icon} size={19} color={colors.goldMuted} /></View><View style={styles.optionCopy}><Text style={styles.optionText}>{label}</Text>{description ? <Text style={styles.optionDescription}>{description}</Text> : null}</View><Text style={styles.optionValue} numberOfLines={1}>{value}</Text><Ionicons name="chevron-forward" size={15} color={colors.textMuted} /></Pressable>;
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', padding: 16, backgroundColor: 'rgba(8,7,19,0.72)' },
  sheet: { maxHeight: '68%', padding: 16, borderRadius: 24, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: colors.surfaceAlt },
  handle: { alignSelf: 'center', width: 36, height: 3, borderRadius: 2, backgroundColor: colors.border },
  title: { marginVertical: 14, color: colors.text, fontFamily: typography.serifMedium, fontSize: 21, textAlign: 'center' },
  options: { gap: 7 },
  sectionLabel: { marginTop: 5, marginBottom: 1, color: colors.goldMuted, fontFamily: typography.sans, fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  option: { minHeight: 58, paddingHorizontal: 10, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', borderRadius: 15, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: colors.purpleDeep },
  optionIcon: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 17, backgroundColor: colors.surfaceLight },
  optionCopy: { flex: 1, marginLeft: 10 },
  optionText: { color: colors.textSecondary, fontFamily: typography.sans, fontSize: 11, fontWeight: '600' },
  optionDescription: { marginTop: 2, color: colors.textMuted, fontFamily: typography.sans, fontSize: 8.5 },
  optionValue: { maxWidth: 105, marginHorizontal: 8, color: colors.goldLight, fontFamily: typography.sans, fontSize: 10, fontWeight: '800', textAlign: 'right' },
  reciterList: { maxHeight: 330 },
  reciterRow: { minHeight: 58, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
  activeRow: { backgroundColor: 'rgba(216,182,90,0.08)' },
  reciterIcon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: colors.purpleDeep },
  surahNumber: { color: colors.goldMuted, fontFamily: typography.sans, fontSize: 11, fontWeight: '900' },
  reciterCopy: { flex: 1, marginHorizontal: 10 },
  reciterName: { color: colors.text, fontFamily: typography.serifMedium, fontSize: 15 },
  reciterMeta: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 8.5 },
  pressed: { opacity: 0.62 },
});
