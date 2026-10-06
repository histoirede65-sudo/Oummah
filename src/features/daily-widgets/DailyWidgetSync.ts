import AsyncStorage from "@react-native-async-storage/async-storage";
import { requireOptionalNativeModule } from "expo-modules-core";
import { Platform } from "react-native";

import { SURAHS } from "../../data/surahs";
import { getActiveLanguage, translate } from "../../i18n";
import { hadithRepository } from "../hadith-explorer/data/hadithRepository";
import { cleanHadithLabel } from "../hadith-explorer/domain/hadithDisplay";
import { verseOfDay } from "../notifications/NotificationCenter";
import { quranFoundationRepository } from "../quranfoundation/QuranFoundationRepository";

/**
 * Home-screen widgets « Verset du jour » and « Hadith du jour »: the same verse
 * and hadith as the home cards, with the same official texts (Quran.com
 * translation, HadeethEnc). Seven days are prepared so the widgets keep
 * changing each day even when the app is not opened.
 */
type DailyWidgetModule = { publishDaily(payload: string): Promise<void> };

const dailyWidget = Platform.OS === "ios"
  ? requireOptionalNativeModule<DailyWidgetModule>("PrayerTimesWidget")
  : Platform.OS === "android"
    ? requireOptionalNativeModule<DailyWidgetModule>("ScanWidget")
    : null;

const DAYS = 7;
const LAST_SYNC_KEY = "oummah.daily-widgets.last-sync.v1";
const RESYNC_MS = 6 * 60 * 60 * 1000;

function dateKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Words of the hadith between quotation marks, as on the home card. */
function hadithQuote(text: string) {
  const french = text.match(/«\s*([^»]+?)\s*»/s)?.[1]?.trim();
  if (french) return french;
  return text.match(/"\s*([^"]+?)\s*"/s)?.[1]?.trim() || text.trim();
}

async function buildDay(date: Date, language: "fr" | "en") {
  const selected = verseOfDay(date);
  const surah = SURAHS.find((item) => item.id === selected.surahId);
  const verses = await quranFoundationRepository.getVerses(selected.surahId, language).catch(() => []);
  const verse = verses.find((item) => item.verseKey === `${selected.surahId}:${selected.verse}`);
  const verseText = verse?.translation?.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const hadith = await hadithRepository.daily(language, date).catch(() => null);
  const hadithText = hadith?.french ? hadithQuote(hadith.french) : "";

  return {
    date: dateKey(date),
    verse: verseText
      ? {
          surahId: selected.surahId,
          verse: selected.verse,
          arabic: verse?.textUthmani ?? "",
          text: verseText,
          reference: `${surah?.transliteration ?? selected.surahId} · ${selected.surahId}:${selected.verse}`,
        }
      : null,
    hadith: hadith && hadithText
      ? {
          id: hadith.id,
          text: hadithText,
          reference: cleanHadithLabel(hadith.reference || hadith.attribution) || "HadeethEnc",
        }
      : null,
  };
}

/** Prepares the coming days for both widgets, at most every six hours. */
export async function syncDailyWidgets(force = false) {
  if (!dailyWidget?.publishDaily) return;
  const language = getActiveLanguage() === "en" ? "en" : "fr";
  const last = await AsyncStorage.getItem(LAST_SYNC_KEY).catch(() => null);
  const [lastLanguage, lastAt] = (last ?? "").split("|");
  if (!force && lastLanguage === language && Date.now() - Number(lastAt || 0) < RESYNC_MS) return;

  const today = new Date();
  const days = [];
  for (let offset = 0; offset < DAYS; offset++) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset, 12);
    days.push(await buildDay(date, language));
  }
  // Nothing usable (offline on first launch): keep what the widget already has.
  if (!days.some((day) => day.verse || day.hadith)) return;

  await dailyWidget.publishDaily(JSON.stringify({
    labels: {
      verse: translate("home.verseToday"),
      hadith: translate("home.hadithToday"),
    },
    days,
  }));
  await AsyncStorage.setItem(LAST_SYNC_KEY, `${language}|${Date.now()}`).catch(() => undefined);
}
