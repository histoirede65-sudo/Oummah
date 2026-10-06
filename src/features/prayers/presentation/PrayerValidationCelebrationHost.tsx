import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { useI18n, type TranslationKey } from "../../../i18n";
import { colors } from "../../../theme/colors";
import { typography } from "../../../theme/typography";
import { setIndividualPrayerCelebrationActive } from "../../celebrations/CelebrationCoordinator";
import type { MosquePrayerKey } from "../../mosques/data/mosquePrayerTimes";
import {
  subscribePrayerValidation,
  type PrayerValidationEvent,
} from "../PrayerCompletionStore";

type Hadith = { text: TranslationKey; reference: string };

const HADITHS: Record<MosquePrayerKey, Hadith> = {
  Fajr: {
    text: "prayerDone.hadithFajr",
    reference: "Sahih Muslim, 657",
  },
  Asr: {
    text: "prayerDone.hadithAsr",
    reference: "Sahih al-Bukhari, 574",
  },
  Dhuhr: {
    text: "prayerDone.hadithFive",
    reference: "Sahih al-Bukhari, 528",
  },
  Maghrib: {
    text: "prayerDone.hadithFive",
    reference: "Sahih al-Bukhari, 528",
  },
  Isha: {
    text: "prayerDone.hadithFive",
    reference: "Sahih al-Bukhari, 528",
  },
};

export default function PrayerValidationCelebrationHost() {
  const { t } = useI18n();
  const queue = useRef<PrayerValidationEvent[]>([]);
  const [event, setEvent] = useState<PrayerValidationEvent | null>(null);

  useEffect(() => {
    const unsubscribe = subscribePrayerValidation((next) => {
      queue.current.push(next);
      setIndividualPrayerCelebrationActive(true);
      setEvent((current) => current ?? queue.current.shift() ?? null);
    });
    return () => {
      unsubscribe();
      setIndividualPrayerCelebrationActive(false);
    };
  }, []);

  useEffect(() => {
    if (!event) setIndividualPrayerCelebrationActive(false);
  }, [event]);

  const dismiss = () => {
    const next = queue.current.shift() ?? null;
    setEvent(next);
  };
  const hadith = event ? HADITHS[event.prayer] : null;

  return event ? (
    <Modal visible transparent animationType="fade" onRequestClose={dismiss}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.icon}>
            <Ionicons name="sparkles" size={30} color={colors.goldLight} />
          </View>
          <Text style={styles.heading}>{t("prayerDone.title")}</Text>
          <Text style={styles.blessing}>{t("prayerDone.blessing")}</Text>
          <View style={styles.separator} />
          <Text style={styles.intro}>{t("prayerDone.intro")}</Text>
          <Text style={styles.hadith}>{hadith ? t(hadith.text) : null}</Text>
          <Text style={styles.reference}>{hadith?.reference}</Text>
          <Pressable accessibilityRole="button" onPress={dismiss} style={styles.button}>
            <Text style={styles.buttonText}>Alhamdulillah</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  ) : null;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(4,6,13,0.76)",
  },
  card: {
    padding: 24,
    alignItems: "center",
    borderRadius: 27,
    borderWidth: 1,
    borderColor: colors.goldLight,
    backgroundColor: colors.surface,
    shadowColor: colors.goldLight,
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  icon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(241,188,79,0.14)",
  },
  heading: {
    marginTop: 16,
    color: colors.goldLight,
    fontFamily: typography.serifSemibold,
    fontSize: 24,
    textAlign: "center",
  },
  blessing: {
    marginTop: 11,
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
  separator: {
    width: "70%",
    height: 1,
    marginTop: 16,
    backgroundColor: colors.borderSoft,
  },
  intro: {
    marginTop: 14,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 14,
    textAlign: "center",
  },
  hadith: {
    marginTop: 8,
    color: colors.text,
    fontFamily: typography.serif,
    fontSize: 17,
    lineHeight: 25,
    textAlign: "center",
  },
  reference: {
    marginTop: 8,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 12,
    textAlign: "center",
  },
  button: {
    marginTop: 22,
    minHeight: 44,
    paddingHorizontal: 26,
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.goldLight,
  },
  buttonText: {
    color: colors.background,
    fontFamily: typography.sans,
    fontSize: 14,
    fontWeight: "800",
  },
});
