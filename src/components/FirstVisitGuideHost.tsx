import { Ionicons } from "@expo/vector-icons";
import { usePathname } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { storageService } from "../core/storage/StorageService";
import { useI18n, type TranslationKey } from "../i18n";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";

type GuideSlide = {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  eyebrow?: string;
};

type GuideDefinition = {
  id: string;
  slides: readonly GuideSlide[];
};

const GUIDE_VERSION = 1;
const STORAGE_PREFIX = `oummah:first-visit-guide:v${GUIDE_VERSION}:`;

const APP_GUIDE: GuideDefinition = {
  id: "app",
  slides: [
    {
      eyebrow: "guide.app1.eyebrow",
      title: "guide.app1.title",
      description:
        "guide.app1.description",
      icon: "sparkles-outline",
    },
    {
      eyebrow: "guide.app2.eyebrow",
      title: "guide.app2.title",
      description:
        "guide.app2.description",
      icon: "grid-outline",
    },
    {
      eyebrow: "guide.app3.eyebrow",
      title: "guide.app3.title",
      description:
        "guide.app3.description",
      icon: "navigate-circle-outline",
    },
  ],
};

const MODULE_GUIDES: Record<string, GuideDefinition> = {
  "/notifications": {
    id: "notifications",
    slides: [{
      eyebrow: "guide.notifications.eyebrow",
      title: "guide.notifications.title",
      description:
        "guide.notifications.description",
      icon: "notifications-outline",
    }],
  },
  "/quran": {
    id: "quran",
    slides: [{
      eyebrow: "guide.quran.eyebrow",
      title: "guide.quran.title",
      description:
        "guide.quran.description",
      icon: "book-outline",
    }],
  },
  "/listen": {
    id: "listen",
    slides: [{
      eyebrow: "guide.listen.eyebrow",
      title: "guide.listen.title",
      description:
        "guide.listen.description",
      icon: "headset-outline",
    }],
  },
  "/hadith": {
    id: "hadith",
    slides: [{
      eyebrow: "guide.hadith.eyebrow",
      title: "guide.hadith.title",
      description:
        "guide.hadith.description",
      icon: "library-outline",
    }],
  },
  "/hadiths": {
    id: "hadith",
    slides: [{
      eyebrow: "guide.hadith.eyebrow",
      title: "guide.hadith.title",
      description:
        "guide.hadith.description",
      icon: "library-outline",
    }],
  },
  "/dhikr": {
    id: "dhikr",
    slides: [{
      eyebrow: "guide.dhikr.eyebrow",
      title: "guide.dhikr.title",
      description:
        "guide.dhikr.description",
      icon: "radio-button-on-outline",
    }],
  },
  "/hifz": {
    id: "hifz",
    slides: [{
      eyebrow: "guide.hifz.eyebrow",
      title: "guide.hifz.title",
      description:
        "guide.hifz.description",
      icon: "school-outline",
    }],
  },
  "/dua": {
    id: "dua",
    slides: [{
      eyebrow: "guide.dua.eyebrow",
      title: "guide.dua.title",
      description:
        "guide.dua.description",
      icon: "heart-outline",
    }],
  },
  "/mosques": {
    id: "mosques",
    slides: [{
      eyebrow: "guide.mosques.eyebrow",
      title: "guide.mosques.title",
      description:
        "guide.mosques.description",
      icon: "business-outline",
    }],
  },
  "/zawaj": {
    id: "zawaj",
    slides: [{
      eyebrow: "guide.zawaj.eyebrow",
      title: "guide.zawaj.title",
      description:
        "guide.zawaj.description",
      icon: "people-outline",
    }],
  },
  "/zakat": {
    id: "zakat",
    slides: [{
      eyebrow: "guide.zakat.eyebrow",
      title: "guide.zakat.title",
      description:
        "guide.zakat.description",
      icon: "calculator-outline",
    }],
  },
  "/calendar": {
    id: "calendar",
    slides: [{
      eyebrow: "guide.calendar.eyebrow",
      title: "guide.calendar.title",
      description:
        "guide.calendar.description",
      icon: "calendar-outline",
    }],
  },
  "/fiqh": {
    id: "fiqh",
    slides: [{
      eyebrow: "guide.fiqh.eyebrow",
      title: "guide.fiqh.title",
      description:
        "guide.fiqh.description",
      icon: "book-outline",
    }],
  },
  "/prophets": {
    id: "prophets",
    slides: [{
      eyebrow: "guide.prophets.eyebrow",
      title: "guide.prophets.title",
      description:
        "guide.prophets.description",
      icon: "git-network-outline",
    }],
  },
  "/sirah": {
    id: "sirah",
    slides: [{
      eyebrow: "guide.sirah.eyebrow",
      title: "guide.sirah.title",
      description:
        "guide.sirah.description",
      icon: "map-outline",
    }],
  },
  "/boycott": {
    id: "boycott",
    slides: [{
      eyebrow: "guide.boycott.eyebrow",
      title: "guide.boycott.title",
      description:
        "guide.boycott.description",
      icon: "scan-outline",
    }],
  },
  "/99-names": {
    id: "99-names",
    slides: [{
      eyebrow: "guide.names99.eyebrow",
      title: "guide.names99.title",
      description:
        "guide.names99.description",
      icon: "sparkles-outline",
    }],
  },
  "/prenoms": {
    id: "prenoms",
    slides: [{
      eyebrow: "guide.prenoms.eyebrow",
      title: "guide.prenoms.title",
      description:
        "guide.prenoms.description",
      icon: "person-outline",
    }],
  },
  "/names": {
    id: "prenoms",
    slides: [{
      eyebrow: "guide.prenoms.eyebrow",
      title: "guide.prenoms.title",
      description:
        "guide.prenoms.description",
      icon: "person-outline",
    }],
  },
  "/companions": {
    id: "companions",
    slides: [{
      eyebrow: "guide.companions.eyebrow",
      title: "guide.companions.title",
      description:
        "guide.companions.description",
      icon: "people-circle-outline",
    }],
  },
  "/jumuah": {
    id: "jumuah",
    slides: [{
      eyebrow: "guide.eyebrow.jumuah",
      title: "guide.jumuah.title",
      description:
        "guide.jumuah.description",
      icon: "moon-outline",
    }],
  },
  "/pilgrimage": {
    id: "pilgrimage",
    slides: [{
      eyebrow: "guide.eyebrow.pilgrimage",
      title: "guide.pilgrimage.title",
      description:
        "guide.pilgrimage.description",
      icon: "walk-outline",
    }],
  },
  "/akhira": {
    id: "akhira",
    slides: [{
      eyebrow: "guide.akhira.eyebrow",
      title: "guide.akhira.title",
      description:
        "guide.akhira.description",
      icon: "moon-outline",
    }],
  },
  "/dalil": {
    id: "wasil",
    slides: [{
      eyebrow: "guide.eyebrow.wasil",
      title: "guide.wasil.title",
      description:
        "guide.wasil.description",
      icon: "chatbubble-ellipses-outline",
    }],
  },
};

function storageKey(id: string) {
  return `${STORAGE_PREFIX}${id}`;
}

export default function FirstVisitGuideHost({
  enabled = true,
}: {
  enabled?: boolean;
}) {
  const { t } = useI18n();
  const pathname = usePathname();
  const [guide, setGuide] = useState<GuideDefinition | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const requestIdRef = useRef(0);

  const candidate = useMemo(() => {
    if (!enabled) return null;
    if (pathname === "/") return APP_GUIDE;
    const moduleGuide = MODULE_GUIDES[pathname] ?? null;
    if (moduleGuide?.id !== "dhikr") return moduleGuide;
    return {
      ...moduleGuide,
      slides: moduleGuide.slides.map((slide) => ({
        ...slide,
        eyebrow: "dhikr.guideEyebrow",
        title: "dhikr.guideTitle",
        description: "dhikr.guideDescription",
      })),
    };
  }, [enabled, pathname, t]);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    setVisible(false);
    setSlideIndex(0);
    setGuide(null);

    if (!candidate) return;

    const timer = setTimeout(() => {
      void storageService
        .get<boolean>(storageKey(candidate.id))
        .then((seen) => {
          if (requestId !== requestIdRef.current || seen === true) return;
          setGuide(candidate);
          setVisible(true);
        })
        .catch(() => {
          // Une erreur de stockage ne doit pas bloquer l'accompagnement.
          if (requestId !== requestIdRef.current) return;
          setGuide(candidate);
          setVisible(true);
        });
    }, 650);

    return () => clearTimeout(timer);
  }, [candidate]);

  if (!guide) return null;

  const slide = guide.slides[slideIndex];
  const isLast = slideIndex >= guide.slides.length - 1;

  const closeGuide = async () => {
    setVisible(false);
    await storageService.set(storageKey(guide.id), true).catch(() => undefined);
    setGuide(null);
    setSlideIndex(0);
  };

  const next = () => {
    if (isLast) {
      void closeGuide();
      return;
    }
    setSlideIndex((current) => current + 1);
  };

  return (
    <Modal
      animationType="fade"
      onRequestClose={() => void closeGuide()}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.glow} />
          <View style={styles.iconWrap}>
            <Ionicons name={slide.icon} size={28} color={colors.goldLight} />
          </View>

          {slide.eyebrow ? (
            <Text style={styles.eyebrow}>{t(slide.eyebrow as TranslationKey)}</Text>
          ) : null}

          <Text style={styles.title}>{t(slide.title as TranslationKey)}</Text>
          <Text style={styles.description}>{t(slide.description as TranslationKey)}</Text>

          {guide.slides.length > 1 ? (
            <View style={styles.dots}>
              {guide.slides.map((_, index) => (
                <View
                  key={`${guide.id}-${index}`}
                  style={[styles.dot, index === slideIndex && styles.dotActive]}
                />
              ))}
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            onPress={next}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>
              {guide.id === "dhikr"
                ? t("dhikr.guideDiscover")
                : isLast
                  ? t("guide.discover")
                  : t("guide.next")}
            </Text>
            <Ionicons
              name={isLast ? "checkmark" : "arrow-forward"}
              size={18}
              color="#17111C"
            />
          </Pressable>

          {guide.slides.length > 1 && !isLast ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => void closeGuide()}
              style={({ pressed }) => [
                styles.skipButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.skipText}>{t("guide.skip")}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
    backgroundColor: "rgba(5, 3, 13, 0.82)",
  },
  card: {
    width: "100%",
    maxWidth: 390,
    overflow: "hidden",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(239, 190, 74, 0.42)",
    backgroundColor: "#17111F",
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 14 },
    elevation: 18,
  },
  glow: {
    position: "absolute",
    top: -90,
    width: 220,
    height: 180,
    borderRadius: 110,
    backgroundColor: "rgba(116, 47, 145, 0.22)",
  },
  iconWrap: {
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(239, 190, 74, 0.34)",
    backgroundColor: "rgba(82, 39, 101, 0.70)",
  },
  eyebrow: {
    marginTop: 17,
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 2.2,
    textAlign: "center",
  },
  title: {
    marginTop: 8,
    color: colors.text,
    fontFamily: typography.serifSemibold,
    fontSize: 25,
    lineHeight: 30,
    textAlign: "center",
  },
  description: {
    marginTop: 10,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  dots: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.20)",
  },
  dotActive: {
    width: 18,
    backgroundColor: colors.goldLight,
  },
  primaryButton: {
    width: "100%",
    minHeight: 50,
    marginTop: 22,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 18,
    backgroundColor: colors.goldLight,
  },
  primaryButtonText: {
    color: "#17111C",
    fontFamily: typography.sans,
    fontSize: 14,
    fontWeight: "800",
  },
  skipButton: {
    marginTop: 11,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  skipText: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 12,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.72,
  },
});
