import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { Href } from "expo-router";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Pressable, StyleSheet, Text, View } from "react-native";

import { hadithRepository } from "../../features/hadith-explorer/data/hadithRepository";
import type { Hadith } from "../../features/hadith-explorer/domain/Hadith";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { useI18n } from "../../i18n";

function getHadithPreview(text: string) {
  const frenchQuotedContent = text.match(/«\s*([^»]+?)\s*»/s)?.[1]?.trim();
  if (frenchQuotedContent) return frenchQuotedContent;
  const straightQuotedContent = text.match(/"\s*([^"]+?)\s*"/s)?.[1]?.trim();
  return straightQuotedContent || text;
}

export default function HadithCard() {
  const { language, t } = useI18n();
  const [daily, setDaily] = useState<Hadith | null>(null);
  const [loadedLanguage, setLoadedLanguage] = useState<typeof language | null>(null);
  const requestId = useRef(0);
  const visibleDaily = loadedLanguage === language ? daily : null;
  const rawHadithText = visibleDaily?.french ?? "";
  const previewHadithText = rawHadithText
    ? getHadithPreview(rawHadithText)
    : t("home.loadingHadith");

  const loadDailyHadith = useCallback(async () => {
    const currentRequestId = ++requestId.current;
    try {
      const hadith = await hadithRepository.daily(language);
      if (currentRequestId === requestId.current) {
        setDaily(hadith);
        setLoadedLanguage(language);
      }
    } catch {
      // Conserve le dernier hadith affiché si le rechargement échoue.
    }
  }, [language]);

  useFocusEffect(
    useCallback(() => {
      void loadDailyHadith();

      return () => {
        requestId.current += 1;
      };
    }, [loadDailyHadith]),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void loadDailyHadith();
    });

    return () => subscription.remove();
  }, [loadDailyHadith]);

  const openDailyHadith = () => {
    if (visibleDaily?.id) {
      router.push(`/hadith/${visibleDaily.id}` as Href);
      return;
    }

    router.push("/hadiths" as Href);
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("home.openHadithToday")}
      onPress={openDailyHadith}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <LinearGradient
        colors={["#28183F", "#1A1231"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.cardHeader}>
        <Ionicons
          name="chatbubble-ellipses-outline"
          size={21}
          color={colors.primaryLight}
        />
        <Text style={styles.title}>{t("home.hadithToday")}</Text>
      </View>
      <Text numberOfLines={3} style={styles.bodyText}>
        {previewHadithText}
      </Text>
      <Text numberOfLines={1} style={styles.reference}>
        {visibleDaily?.reference || ""}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
    padding: 12,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(229,193,255,0.12)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 7,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 11,
  },
  title: {
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 12,
    fontWeight: "600",
  },
  bodyText: {
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 17,
  },
  reference: {
    marginTop: "auto",
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 11,
    fontWeight: "500",
    lineHeight: 15,
  },
  pressed: { opacity: 0.72 },
});
