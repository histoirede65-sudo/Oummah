import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SURAHS } from '../../data/surahs';
import type { CatalogReciter } from '../../features/audio/domain/audio';
import { useI18n } from '../../i18n';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

export default function PlayerQuickMenu({ visible, reciters, currentSurahId, onClose, onSpeed, onTimer, onRepeat, onReciter, onSurah }: {
  visible: boolean;
  reciters: readonly CatalogReciter[];
  currentSurahId: number;
  onClose: () => void;
  onSpeed: () => void;
  onTimer: () => void;
  onRepeat: () => void;
  onReciter: (reciterId: string) => void;
  onSurah: (surahId: number) => void;
}) {
  const { t } = useI18n();
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
              <Option icon="speedometer-outline" label={t('audio.speed')} onPress={onSpeed} />
              <Option icon="timer-outline" label={t('audio.timer')} onPress={onTimer} />
              <Option icon="repeat-outline" label={t('audio.repeat')} onPress={onRepeat} />
              <Option icon="people-outline" label={t('audio.chooseReciter')} onPress={() => setShowReciters(true)} />
              <Option icon="list-outline" label="Changer de sourate" onPress={() => setShowSurahs(true)} />
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Option({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.option, pressed && styles.pressed]}><View style={styles.optionIcon}><Ionicons name={icon} size={19} color={colors.goldMuted} /></View><Text style={styles.optionText}>{label}</Text><Ionicons name="chevron-forward" size={15} color={colors.textMuted} /></Pressable>;
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', padding: 16, backgroundColor: 'rgba(8,7,19,0.72)' },
  sheet: { maxHeight: '68%', padding: 16, borderRadius: 24, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: colors.surfaceAlt },
  handle: { alignSelf: 'center', width: 36, height: 3, borderRadius: 2, backgroundColor: colors.border },
  title: { marginVertical: 14, color: colors.text, fontFamily: typography.serifMedium, fontSize: 21, textAlign: 'center' },
  options: { gap: 7 },
  option: { height: 51, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', borderRadius: 15, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: colors.purpleDeep },
  optionIcon: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 17, backgroundColor: colors.surfaceLight },
  optionText: { flex: 1, marginLeft: 10, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 11, fontWeight: '600' },
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
