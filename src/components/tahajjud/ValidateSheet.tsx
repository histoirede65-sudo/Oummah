import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { night, nightType } from './theme';
import { tx } from '../../features/tahajjud/tahajjudI18n';

type Props = {
  visible: boolean;
  /** Morning after the night: « J'ai prié cette nuit ». */
  late: boolean;
  streak: number;
  onClose: () => void;
  onConfirm: (witr: boolean) => Promise<void>;
};

/** « J'ai prié cette nuit » : optional Witr, then a quiet celebration. */
export function ValidateSheet({ visible, late, streak, onClose, onConfirm }: Props) {
  const [witr, setWitr] = useState(true);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (visible) {
      setDone(false);
      setSaving(false);
      setWitr(true);
    }
  }, [visible]);

  const confirm = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await onConfirm(witr);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      setDone(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => undefined}>
          <LinearGradient colors={['#1C1546', '#0E0A26']} style={StyleSheet.absoluteFill} />
          {done ? (
            <Animated.View entering={FadeIn.duration(300)} style={styles.doneWrap}>
              <Animated.View entering={ZoomIn.springify().damping(12)} style={styles.doneMoon}>
                <Ionicons name="moon" size={44} color={night.sky0} />
              </Animated.View>
              <Text style={styles.doneTitle}>{tx("Nuit accomplie")}</Text>
              <Text style={styles.doneText}>{tx("Qu’Allah accepte votre prière et exauce vos invocations.")}</Text>
              {streak > 1 ? (
                <View style={styles.streak}>
                  <Ionicons name="flame" size={16} color={night.gold} />
                  <Text style={styles.streakText}>{streak} {tx("nuits de suite")}</Text>
                </View>
              ) : null}
              <Pressable onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeText}>{tx("Fermer")}</Text>
              </Pressable>
            </Animated.View>
          ) : (
            <>
              <View style={styles.handle} />
              <Text style={styles.title}>{tx("J’ai prié cette nuit")}</Text>
              <Text style={styles.text}>
                {tx("Une seule validation par nuit. Elle reste sur ce téléphone et nourrit votre suivi.")}
              </Text>

              <Pressable onPress={() => setWitr((value) => !value)} style={styles.option}>
                <View style={[styles.check, witr && styles.checkOn]}>
                  {witr ? <Ionicons name="checkmark" size={16} color={night.sky0} /> : null}
                </View>
                <View style={styles.optionCopy}>
                  <Text style={styles.optionTitle}>{tx("J’ai aussi prié le Witr")}</Text>
                  <Text style={styles.optionText}>{tx("Facultatif")}</Text>
                </View>
              </Pressable>

              <Pressable disabled={saving} onPress={() => void confirm()} style={({ pressed }) => [pressed && styles.pressed]}>
                <LinearGradient colors={[night.goldSoft, night.gold]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.confirm}>
                  <Ionicons name="moon" size={19} color={night.sky0} />
                  <Text style={styles.confirmText}>{saving ? tx('Enregistrement…') : tx('Enregistrer ma nuit')}</Text>
                </LinearGradient>
              </Pressable>
              <Pressable onPress={onClose} style={styles.cancel}>
                <Text style={styles.cancelText}>{tx("Annuler")}</Text>
              </Pressable>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(2,1,8,0.72)', justifyContent: 'flex-end' },
  sheet: { overflow: 'hidden', borderTopLeftRadius: 30, borderTopRightRadius: 30, borderWidth: 1, borderColor: night.goldLine, padding: 24, paddingBottom: 36 },
  handle: { alignSelf: 'center', width: 42, height: 4, borderRadius: 2, backgroundColor: '#363448', marginBottom: 18 },
  title: { color: night.text, fontSize: 32, ...nightType.display },
  text: { marginTop: 6, color: night.textSoft, fontSize: 17, lineHeight: 24, ...nightType.body },
  option: { marginTop: 22, flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 18, backgroundColor: night.glass, borderWidth: 1, borderColor: night.line },
  check: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: night.gold, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: night.gold },
  optionCopy: { flex: 1 },
  optionTitle: { color: night.text, fontSize: 18, ...nightType.semibold },
  optionText: { marginTop: 2, color: night.muted, fontSize: 15, ...nightType.body },
  confirm: { marginTop: 22, minHeight: 56, borderRadius: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  confirmText: { color: night.sky0, fontSize: 20, ...nightType.bold },
  cancel: { marginTop: 10, alignSelf: 'center', padding: 10 },
  cancelText: { color: night.muted, fontSize: 17, ...nightType.medium },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  doneWrap: { alignItems: 'center', paddingVertical: 10 },
  doneMoon: {
    width: 92, height: 92, borderRadius: 46, backgroundColor: night.goldSoft, alignItems: 'center', justifyContent: 'center',
    shadowColor: night.goldSoft, shadowOpacity: 0.9, shadowRadius: 30, shadowOffset: { width: 0, height: 0 }, elevation: 12,
  },
  doneTitle: { marginTop: 20, color: night.text, fontSize: 34, ...nightType.display },
  doneText: { marginTop: 6, color: night.textSoft, fontSize: 17, textAlign: 'center', lineHeight: 24, ...nightType.body },
  streak: { marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16, backgroundColor: '#241C27' },
  streakText: { color: night.goldSoft, fontSize: 16, ...nightType.bold },
  closeButton: { marginTop: 22, paddingHorizontal: 30, paddingVertical: 12, borderRadius: 22, borderWidth: 1, borderColor: night.goldLine },
  closeText: { color: night.text, fontSize: 17, ...nightType.semibold },
});
