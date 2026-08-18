import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { WasilContextButton } from "../../components/wasil/WasilContextButton";
import { SURAHS } from "../../data/surahs";
import { readingQuranRepository } from "../../features/quran/ReadingQuranRepository";
import type { QuranFoundationVerse } from "../../features/quranfoundation/QuranFoundationTypes";
import {
  tafsirRepository,
  type QuranTafsir,
} from "../../features/quranfoundation/TafsirRepository";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

function languageLabel(languageName?: string) {
  const normalized = languageName?.toLocaleLowerCase("fr") ?? "";
  if (normalized === "arabic") return "Arabe";
  if (normalized === "french") return "Français";
  if (normalized === "english") return "Anglais";
  return languageName || "Langue non précisée";
}

export default function TafsirScreen() {
  const params = useLocalSearchParams<{
    verseKey?: string | string[];
  }>();

  const verseKey = Array.isArray(params.verseKey)
    ? params.verseKey[0]
    : params.verseKey;

  const scrollRef = useRef<ScrollView>(null);
  const [verse, setVerse] = useState<QuranFoundationVerse>();
  const [tafsir, setTafsir] = useState<QuranTafsir>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  const chapterId = Number(verseKey?.split(":")[0]);
  const currentVerseNumber = Number(verseKey?.split(":")[1]) || 1;

  const surah = useMemo(
    () => SURAHS.find((item) => item.id === chapterId),
    [chapterId],
  );

  const totalVerses = surah?.verses ?? 0;
  const hasPreviousVerse = currentVerseNumber > 1;
  const hasNextVerse = totalVerses > 0 && currentVerseNumber < totalVerses;

  const load = useCallback(async () => {
    if (!verseKey || !/^\d{1,3}:\d{1,3}$/.test(verseKey)) {
      setError("Ce verset est invalide.");
      setLoading(false);
      return;
    }

    const requestedChapter = Number(verseKey.split(":")[0]);

    setLoading(true);
    setError(undefined);
    setVerse(undefined);
    setTafsir(undefined);

    try {
      const [verses, tafsirResult] = await Promise.all([
        readingQuranRepository.getVerses(requestedChapter),
        tafsirRepository.getTafsir(verseKey),
      ]);

      setVerse(verses.find((item) => item.verseKey === verseKey));
      setTafsir(tafsirResult);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Impossible de charger le tafsir.",
      );
    } finally {
      setLoading(false);
    }
  }, [verseKey]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      y: 0,
      animated: false,
    });

    void load();
  }, [load]);

  const openVerseTafsir = useCallback(
    (targetVerseNumber: number) => {
      if (
        !Number.isInteger(chapterId) ||
        chapterId < 1 ||
        targetVerseNumber < 1 ||
        (totalVerses > 0 && targetVerseNumber > totalVerses)
      ) {
        return;
      }

      router.replace({
        pathname: "/tafsir/[verseKey]",
        params: {
          verseKey: `${chapterId}:${targetVerseNumber}`,
        },
      });
    },
    [chapterId, totalVerses],
  );

  const returnToVerse = useCallback(() => {
    if (
      !Number.isInteger(chapterId) ||
      chapterId < 1 ||
      currentVerseNumber < 1
    ) {
      router.back();
      return;
    }

    router.replace({
      pathname: "/surah/[id]",
      params: {
        id: String(chapterId),
        verse: String(currentVerseNumber),
      },
    });
  }, [chapterId, currentVerseNumber]);

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Retour"
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={22} color={colors.goldLight} />
        </Pressable>

        <View style={styles.headerCopy}>
          <Text style={styles.title}>Tafsir</Text>
          <Text style={styles.subtitle}>
            {surah?.frenchName ?? "Sourate"} · Verset {verseKey ?? "—"}
          </Text>
        </View>

        <View style={styles.bookIcon}>
          <Ionicons name="book-outline" size={21} color={colors.goldLight} />
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.gold} />
          <Text style={styles.loadingText}>Chargement du tafsir…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons
            name="alert-circle-outline"
            size={34}
            color={colors.goldLight}
          />
          <Text style={styles.errorText}>{error}</Text>

          <Pressable onPress={() => void load()} style={styles.retryButton}>
            <Text style={styles.retryText}>Réessayer</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {verse ? (
            <View style={styles.verseCard}>
              <View style={styles.verseBadge}>
                <Text style={styles.verseBadgeText}>{verse.verseKey}</Text>
              </View>

              <Text selectable style={styles.arabic}>
                {verse.textUthmani}
              </Text>

              {verse.translation ? (
                <Text selectable style={styles.translation}>
                  {verse.translation}
                </Text>
              ) : null}
              <WasilContextButton
                prompt={`Explique-moi ce verset et ce tafsir avec les sources vérifiées d’OUMMAH. Verset ${verse.verseKey} : ${verse.translation ?? verse.textUthmani}. Tafsir affiché : ${tafsir?.text ?? "indisponible"}`}
              />
            </View>
          ) : null}

          <View style={styles.sourceCard}>
            <View style={styles.sourceIcon}>
              <Ionicons
                name="library-outline"
                size={18}
                color={colors.goldLight}
              />
            </View>

            <View style={styles.sourceCopy}>
              <Text style={styles.sourceName}>
                {tafsir?.resourceName ?? "Al-Mukhtasar fi Tafsir al-Qur’an"}
              </Text>

              <Text style={styles.sourceMeta}>
                Source QuranEnc · {languageLabel(tafsir?.languageName)}
              </Text>
            </View>
          </View>

          <Text selectable style={styles.tafsirText}>
            {tafsir?.text}
          </Text>

          <Text style={styles.disclaimer}>
            Commentaire français publié par QuranEnc. Ce texte n’est pas une
            réponse générée ou traduite automatiquement par Dalîl.
          </Text>

          <View style={styles.navigationCard}>
            <View style={styles.navigationHeading}>
              <View style={styles.navigationHeadingIcon}>
                <Ionicons
                  name="compass-outline"
                  size={18}
                  color={colors.goldLight}
                />
              </View>

              <View style={styles.navigationHeadingCopy}>
                <Text style={styles.navigationTitle}>Continuer l’étude</Text>
                <Text style={styles.navigationSubtitle}>
                  Parcourir le tafsir de la sourate
                </Text>
              </View>
            </View>

            <View style={styles.navigationRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Tafsir du verset précédent"
                disabled={!hasPreviousVerse}
                onPress={() => openVerseTafsir(currentVerseNumber - 1)}
                style={({ pressed }) => [
                  styles.navigationButton,
                  !hasPreviousVerse && styles.navigationButtonDisabled,
                  pressed && hasPreviousVerse && styles.navigationButtonPressed,
                ]}
              >
                <Ionicons
                  name="chevron-back"
                  size={18}
                  color={hasPreviousVerse ? colors.goldLight : colors.textMuted}
                />

                <View style={styles.navigationButtonCopy}>
                  <Text
                    style={[
                      styles.navigationButtonLabel,
                      !hasPreviousVerse && styles.navigationButtonLabelDisabled,
                    ]}
                  >
                    Précédent
                  </Text>

                  <Text style={styles.navigationButtonMeta}>
                    {hasPreviousVerse
                      ? `Verset ${currentVerseNumber - 1}`
                      : "Début de la sourate"}
                  </Text>
                </View>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Tafsir du verset suivant"
                disabled={!hasNextVerse}
                onPress={() => openVerseTafsir(currentVerseNumber + 1)}
                style={({ pressed }) => [
                  styles.navigationButton,
                  styles.navigationButtonNext,
                  !hasNextVerse && styles.navigationButtonDisabled,
                  pressed && hasNextVerse && styles.navigationButtonPressed,
                ]}
              >
                <View style={styles.navigationButtonCopy}>
                  <Text
                    style={[
                      styles.navigationButtonLabel,
                      styles.navigationButtonLabelRight,
                      !hasNextVerse && styles.navigationButtonLabelDisabled,
                    ]}
                  >
                    Suivant
                  </Text>

                  <Text
                    style={[
                      styles.navigationButtonMeta,
                      styles.navigationButtonMetaRight,
                    ]}
                  >
                    {hasNextVerse
                      ? `Verset ${currentVerseNumber + 1}`
                      : "Fin de la sourate"}
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={hasNextVerse ? colors.goldLight : colors.textMuted}
                />
              </Pressable>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Retour au verset ${currentVerseNumber}`}
              onPress={returnToVerse}
              style={({ pressed }) => [
                styles.returnButton,
                pressed && styles.returnButtonPressed,
              ]}
            >
              <Ionicons
                name="return-up-back-outline"
                size={18}
                color={colors.background}
              />

              <Text style={styles.returnButtonText}>
                Retour au verset dans la lecture
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    minHeight: 74,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSoft,
    backgroundColor: colors.backgroundSecondary,
  },
  backButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: colors.purpleDeep,
  },
  headerCopy: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 24,
  },
  subtitle: {
    marginTop: 2,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 10,
  },
  bookIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  center: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 14,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 11,
  },
  errorText: {
    marginTop: 14,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 18,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 18,
    backgroundColor: colors.goldLight,
  },
  retryText: {
    color: colors.background,
    fontFamily: typography.sans,
    fontSize: 11,
    fontWeight: "700",
  },
  content: {
    width: "100%",
    maxWidth: 760,
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 60,
    alignSelf: "center",
  },
  verseCard: {
    paddingHorizontal: 18,
    paddingVertical: 22,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(224,188,112,0.24)",
    backgroundColor: colors.backgroundSecondary,
  },
  verseBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: colors.goldDark,
  },
  verseBadgeText: {
    color: colors.background,
    fontFamily: typography.sans,
    fontSize: 9,
    fontWeight: "700",
  },
  arabic: {
    marginTop: 20,
    color: colors.goldLight,
    fontFamily: typography.arabic,
    fontSize: 30,
    lineHeight: 54,
    textAlign: "right",
    writingDirection: "rtl",
  },
  translation: {
    marginTop: 20,
    paddingTop: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(224,188,112,0.18)",
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 15,
    lineHeight: 24,
  },
  sourceCard: {
    marginTop: 20,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
  },
  sourceIcon: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    backgroundColor: "rgba(126,72,148,0.18)",
  },
  sourceCopy: {
    flex: 1,
    marginLeft: 12,
  },
  sourceName: {
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 17,
  },
  sourceMeta: {
    marginTop: 2,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 9.5,
  },
  tafsirText: {
    marginTop: 26,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 16,
    lineHeight: 28,
  },
  disclaimer: {
    marginTop: 30,
    paddingTop: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSoft,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 9.5,
    lineHeight: 16,
    textAlign: "center",
  },
  navigationCard: {
    marginTop: 24,
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(224,188,112,0.28)",
    backgroundColor: colors.backgroundSecondary,
  },
  navigationHeading: {
    flexDirection: "row",
    alignItems: "center",
  },
  navigationHeadingIcon: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    backgroundColor: "rgba(126,72,148,0.18)",
  },
  navigationHeadingCopy: {
    flex: 1,
    marginLeft: 11,
  },
  navigationTitle: {
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 18,
  },
  navigationSubtitle: {
    marginTop: 1,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 9.5,
  },
  navigationRow: {
    marginTop: 16,
    flexDirection: "row",
    gap: 10,
  },
  navigationButton: {
    flex: 1,
    minWidth: 0,
    minHeight: 64,
    paddingHorizontal: 11,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
  },
  navigationButtonNext: {
    justifyContent: "flex-end",
  },
  navigationButtonDisabled: {
    opacity: 0.45,
  },
  navigationButtonPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.99 }],
  },
  navigationButtonCopy: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: 7,
  },
  navigationButtonLabel: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 11,
    fontWeight: "700",
  },
  navigationButtonLabelRight: {
    textAlign: "right",
  },
  navigationButtonLabelDisabled: {
    color: colors.textMuted,
  },
  navigationButtonMeta: {
    marginTop: 3,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 8.5,
  },
  navigationButtonMetaRight: {
    textAlign: "right",
  },
  returnButton: {
    minHeight: 46,
    marginTop: 12,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 16,
    backgroundColor: colors.goldLight,
  },
  returnButtonPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },
  returnButtonText: {
    color: colors.background,
    fontFamily: typography.sans,
    fontSize: 11,
    fontWeight: "700",
  },
});
