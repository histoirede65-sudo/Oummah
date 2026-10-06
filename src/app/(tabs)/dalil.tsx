import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import type { Href } from "expo-router";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useReciter } from "../../context/ReciterProvider";
import {
  getWasilLocalReply,
  type WasilReply,
} from "../../features/wasil/WasilLocalResponder";
import {
  askWasil,
  deleteWasilConversation,
  getWasilBalance,
  syncWasilConversations,
  WasilApiError,
  type WasilLocationContext,
} from "../../features/wasil/WasilApiClient";
import {
  loadWasilEnergyPacks,
  purchaseWasilEnergy,
  refreshWasilEnergyBalance,
  type WasilEnergyPack,
} from "../../features/wasil/WasilEnergyService";
import {
  appendWasilConversationTurn,
  createWasilConversationId,
  loadWasilConversations,
  mergeWasilConversations,
  saveWasilConversations,
  type WasilConversationMessage,
  type WasilConversationThread,
} from "../../features/wasil/WasilConversationStore";
import { resolveWasilFreeAction } from "../../features/wasil/WasilActionRouter";
import {
  isWasilGoalActionFollowUp,
  isWasilGoalActionIntent,
  manageWasilGoals,
  type PendingWasilGoalAction,
} from "../../features/wasil/WasilGoalService";
import {
  isWasilMemoryIntent,
  manageWasilMemory,
} from "../../features/wasil/WasilMemoryService";
import {
  isWasilReminderManagementFollowUp,
  isWasilReminderManagementIntent,
  isWasilReminderFollowUp,
  manageWasilReminders,
  resolveWasilReminder,
  scheduleWasilReminder,
  type PendingWasilReminder,
  type PendingWasilReminderManagement,
} from "../../features/wasil/WasilReminderService";
import { SURAHS } from "../../data/surahs";
import { getNearbyMosques } from "../../features/mosques/data/nearbyMosques";
import { searchNearbyHalalPlaces } from "../../features/halal/data/HalalPlacesRepository";
import type { HalalPlace } from "../../features/halal/domain/HalalPlace";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { getValidSession } from "../../features/auth/SupabaseAuthService";
import { useI18n } from "../../i18n";

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function asksForNearbyMosque(value: string) {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  const mentionsMosque =
    /\b(mosquee|mosque|masjid|salle de priere)\b/.test(normalized);
  const mentionsProximity =
    /\b(proche|pres|autour|alentour|a cote|plus proche|nearest|nearby)\b/.test(
      normalized,
    ) ||
    normalized.includes("chez moi") ||
    normalized.includes("de moi") ||
    normalized.includes("autour de moi") ||
    normalized.includes("pres de moi");

  return mentionsMosque && mentionsProximity;
}

async function resolveWasilLocationContext(
  question: string,
): Promise<WasilLocationContext | undefined> {
  if (!asksForNearbyMosque(question)) return undefined;

  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== Location.PermissionStatus.GRANTED) return undefined;

  const lastKnown = await Location.getLastKnownPositionAsync({
    maxAge: 5 * 60 * 1000,
    requiredAccuracy: 2_000,
  });
  const position =
    lastKnown ??
    (await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    }));

  const { latitude, longitude, accuracy } = position.coords;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const mosques = await getNearbyMosques(
      latitude,
      longitude,
      controller.signal,
    ).catch(() => []);
    return {
      latitude,
      longitude,
      accuracyMeters: accuracy ?? undefined,
      mosques: mosques.slice(0, 5).map((mosque) => ({
        name: mosque.name,
        address: mosque.address,
        distanceMeters: mosque.distanceMeters,
        distanceLabel: mosque.distanceLabel,
        walkingTimeLabel: mosque.walkingTimeLabel,
        latitude: mosque.latitude,
        longitude: mosque.longitude,
      })),
    };
  } finally {
    clearTimeout(timeout);
  }
}


type Translate = ReturnType<typeof useI18n>["t"];

function buildNearbyMosqueLocalReply(
  t: Translate,
  locationContext?: WasilLocationContext,
): WasilReply {
  const mosques = locationContext?.mosques ?? [];

  if (!locationContext) {
    return {
      kind: "answer",
      title: t("wasil.locationNeeded"),
      body: t("wasil.nearbyMosqueNeedsLocation"),
      action: { label: t("wasil.openMosques"), route: "/mosques" },
    };
  }

  if (mosques.length === 0) {
    return {
      kind: "answer",
      title: t("wasil.noMosqueNearby"),
      body: t("wasil.noMosqueNearbyBody"),
      action: { label: t("wasil.openMosques"), route: "/mosques" },
    };
  }

  const body = mosques
    .map(
      (mosque, index) =>
        `${index + 1}. ${mosque.name}\n${mosque.distanceLabel} · ${mosque.walkingTimeLabel}\n${mosque.address}`,
    )
    .join("\n\n");

  return {
    kind: "answer",
    title: mosques.length === 1 ? t("wasil.nearbyMosqueOne") : t("wasil.nearbyMosqueMany"),
    body: `${body}\n\n${t("wasil.localSearchNoCredit")}`,
    action: { label: t("wasil.seeInMosques"), route: "/mosques" },
  };
}

function buildNearbyMosqueQuestion(
  question: string,
  locationContext?: WasilLocationContext,
) {
  if (!locationContext) return question;

  const mosqueLines = (locationContext.mosques ?? []).map(
    (mosque, index) =>
      `${index + 1}. ${mosque.name} — ${mosque.distanceLabel} — ${mosque.walkingTimeLabel} — ${mosque.address}`,
  );

  return `${question}

[CONTEXTE DE LOCALISATION FOURNI AUTOMATIQUEMENT PAR OUMMAH]
La position actuelle de l’utilisateur a été autorisée et obtenue : latitude ${locationContext.latitude.toFixed(6)}, longitude ${locationContext.longitude.toFixed(6)}.
${
    mosqueLines.length > 0
      ? `Mosquées trouvées autour de cette position, déjà classées de la plus proche à la plus éloignée :\n${mosqueLines.join("\n")}`
      : "La position a bien été obtenue, mais la recherche locale OUMMAH n’a retourné aucune mosquée."
  }
Réponds directement à la demande à partir de ces données. Ne demande ni ville, ni quartier, ni code postal et ne dis pas que tu ne connais pas la position.
[FIN DU CONTEXTE DE LOCALISATION]`;
}

function getWasilReferenceRoute(reference: string): Href | null {
  const quranReference = reference.match(
    /\bCoran\s+(\d{1,3}):(\d{1,3})(?:-\d{1,3})?/i,
  );
  if (quranReference) {
    return {
      pathname: "/surah/[id]",
      params: { id: quranReference[1], verse: quranReference[2] },
    };
  }

  const normalizedReference = reference
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (
    /\b(sahih|hadith|hadeeth|sunan|jami|muwatta|musnad|al-bukhari|al-boukhari)\b/.test(
      normalizedReference,
    ) || /\bmuslim\s+n[°o]?\s*\d+/i.test(normalizedReference)
  ) {
    return {
      pathname: "/hadith/search",
      params: { q: reference },
    };
  }

  return null;
}

/** A HadeethEnc page opens the same hadith in the app (its catalogue comes from HadeethEnc). */
function resolveHadithNativeTarget(sourceUrl: string | undefined): HadithNativeTarget | null {
  if (!sourceUrl) return null;
  try {
    const url = new URL(sourceUrl);
    if (url.hostname.replace(/^www\./, "").toLowerCase() !== "hadeethenc.com") return null;
    const id = url.pathname.match(/\/hadith\/(\d+)\/?$/)?.[1];
    return id ? { pathname: "/hadith/[hadithId]", params: { hadithId: id } } : null;
  } catch {
    return null;
  }
}

/** Web pages that the app can open itself: Quran pages always, HadeethEnc hadiths. */
function toNativeSource(source: WasilDisplaySource): WasilDisplaySource {
  const quranTarget = resolveQuranNativeTarget(source.url, "");
  if (quranTarget) {
    return { label: "OUMMAH", detail: formatQuranPassage(quranTarget), verified: source.verified, quranTarget };
  }
  const hadithTarget = resolveHadithNativeTarget(source.url);
  if (hadithTarget) {
    return { label: "OUMMAH · Hadith", detail: source.label, verified: source.verified, hadithTarget };
  }
  return source;
}

type HadithNativeTarget =
  | { pathname: "/hadith/[hadithId]"; params: { hadithId: string } }
  | { pathname: "/hadith/search"; params: { q: string } };

type WasilDisplaySource = {
  label: string;
  detail?: string;
  url?: string;
  verified: boolean;
  quranTarget?: QuranNativeTarget;
  hadithTarget?: HadithNativeTarget;
};

type QuranNativeTarget = {
  pathname: "/wasil/quran-passage";
  params: {
    id: string;
    verseStart?: string;
    verseEnd?: string;
  };
};

type WasilVisualPose =
  | "idle"
  | "blink"
  | "wave"
  | "thinking"
  | "reading-quran"
  | "success"
  | "error";

/** Reply action that opens the Energy sheet instead of navigating. */
const ENERGY_ROUTE = "wasil:energy";

/** Balance colour: green from 10, yellow from 5 to 9, red from 4 down. */
function energyTone(balance: number) {
  if (balance >= 10) return "#5BC489";
  if (balance >= 5) return "#E8C547";
  return "#E5675C";
}

const ENERGY_FACT_KEYS = [
  "wasil.energyFact1",
  "wasil.energyFact2",
  "wasil.energyFact3",
  "wasil.energyFact4",
  "wasil.energyFact5",
  "wasil.energyFact6",
] as const;

const WASIL_QUESTION_EXAMPLE_KEYS = [
  "wasil.example1",
  "wasil.example2",
  "wasil.example3",
  "wasil.example4",
  "wasil.example5",
] as const;

const wasilPoseSources = {
  idle: require("../../assets/images/home/wasil-idle.png"),
  blink: require("../../assets/images/home/wasil-blink.png"),
  "wave-1": require("../../assets/images/home/wasil-wave-1.png"),
  "wave-2": require("../../assets/images/home/wasil-wave-2.png"),
  "wave-3": require("../../assets/images/home/wasil-wave-3.png"),
  thinking: require("../../assets/images/home/wasil-thinking.png"),
  "reading-quran-1": require("../../assets/images/home/wasil-reading-quran-1.png"),
  "reading-quran-2": require("../../assets/images/home/wasil-reading-quran-2.png"),
} as const;

function getWasilPoseSource(pose: WasilVisualPose, frame: number) {
  switch (pose) {
    case "blink":
      return wasilPoseSources.blink;
    case "thinking":
      return wasilPoseSources.thinking;
    case "reading-quran":
      return wasilPoseSources["reading-quran-1"];
    case "wave":
      return wasilPoseSources["wave-2"];
    default:
      return wasilPoseSources.idle;
  }
}

const CONFIRMED_QURAN_COM_SURAH_SLUGS: Readonly<Record<string, number>> = {
  "al-kawthar": 108,
};

function decodeQuranReference(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function createQuranNativeTarget(
  surahValue: string | number | undefined,
  verseStartValue?: string | number,
  verseEndValue?: string | number,
): QuranNativeTarget | null {
  const surahId = Number(surahValue);
  const verseStart =
    verseStartValue === undefined ? undefined : Number(verseStartValue);
  const verseEnd =
    verseEndValue === undefined ? undefined : Number(verseEndValue);

  if (!Number.isInteger(surahId) || surahId < 1 || surahId > 114) {
    return null;
  }
  if (
    (verseStart !== undefined &&
      (!Number.isInteger(verseStart) || verseStart < 1)) ||
    (verseEnd !== undefined &&
      (!Number.isInteger(verseEnd) ||
        verseEnd < 1 ||
        verseStart === undefined ||
        verseEnd < verseStart))
  ) {
    return null;
  }
  const knownSurah = SURAHS.find((surah) => surah.id === surahId);
  if (
    !knownSurah ||
    (verseStart !== undefined && verseStart > knownSurah.verses) ||
    (verseEnd !== undefined && verseEnd > knownSurah.verses)
  ) {
    return null;
  }

  return {
    pathname: "/wasil/quran-passage",
    params: {
      id: String(surahId),
      ...(verseStart !== undefined
        ? { verseStart: String(verseStart) }
        : {}),
      ...(verseEnd !== undefined ? { verseEnd: String(verseEnd) } : {}),
    },
  };
}

function resolveQuranNativeTarget(
  sourceUrl: string | undefined,
  referenceLabel: string,
): QuranNativeTarget | null {
  if (sourceUrl) {
    try {
    const url = new URL(sourceUrl);
    const hostname = url.hostname.replace(/^www\./, "").toLowerCase();
      const decodedPath = decodeQuranReference(url.pathname);

      if (hostname === "quran.com") {
        const numericPath = decodedPath.match(
          /^\/(?:(?:en|fr)\/)?(\d{1,3})(?:(?:\/|:)(\d+)(?:-(\d+))?)?\/?$/i,
        );
        const textualPath = decodedPath.match(
          /^\/(?:(?:en|fr)\/)?([a-z0-9-]+)(?:\/info)?\/?$/i,
        );
        const confirmedTextualSurah = textualPath?.[1]
          ? CONFIRMED_QURAN_COM_SURAH_SLUGS[
              textualPath[1].toLowerCase()
            ]
          : undefined;
        const urlTarget = createQuranNativeTarget(
          numericPath?.[1] ?? confirmedTextualSurah,
          numericPath?.[2],
          numericPath?.[3],
        );
        if (urlTarget) return urlTarget;
      }

      if (hostname === "quranenc.com") {
        const browsePath = decodedPath.match(
          /^\/[a-z]{2,3}\/browse\/[^/]+\/(\d{1,3})(?:\/(\d+)(?:-(\d+))?)?\/?$/i,
        );
        const apiSurahPath = decodedPath.match(
          /^\/api\/v1\/translation\/sura\/[^/]+\/(\d{1,3})\/?$/i,
        );
        const apiVersePath = decodedPath.match(
          /^\/api\/v1\/translation\/aya\/[^/]+\/(\d{1,3})\/(\d+)\/?$/i,
        );
        const urlTarget = createQuranNativeTarget(
          browsePath?.[1] ?? apiSurahPath?.[1] ?? apiVersePath?.[1],
          browsePath?.[2] ?? apiVersePath?.[2],
          browsePath?.[3],
        );
        if (urlTarget) return urlTarget;
      }
    } catch {
      // Le libellé exact reste analysable pour les anciennes conversations.
    }
  }

  const decodedLabel = decodeQuranReference(referenceLabel).trim();
  const explicitReference = decodedLabel.match(
    /^(?:Coran\s+)?(\d{1,3})(?::|\/)(\d+)(?:-(\d+))?$/i,
  );
  const namedReference = decodedLabel.match(
    /^Sourate\s+(\d{1,3})\s*,?\s*versets?\s+(\d+)(?:\s*(?:à|-)\s*(\d+))?$/i,
  );
  const coranReference = decodedLabel.match(
    /\bCoran\s+(\d{1,3}):(\d+)(?:-(\d+))?\b/i,
  );
  const targetMatch = explicitReference ?? namedReference ?? coranReference;
  return createQuranNativeTarget(
    targetMatch?.[1],
    targetMatch?.[2],
    targetMatch?.[3],
  );
}

function extractMarkdownLinks(body: string) {
  const sources: { label: string; url: string }[] = [];
  const text = body.replace(
    /\[([^\]\r\n]+)\]\((https?:\/\/[^\s)]+)\)/gi,
    (_match, label: string, url: string) => {
      sources.push({ label: label.trim(), url: url.trim() });
      return "";
    },
  );
  return { text, sources };
}

function cleanMarkdownText(body: string) {
  return body
    .replace(/(^|\n)\s*\(\s*\)\s*(?=\n|$)/g, "$1")
    .replace(/\(\s*\)/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

/** Text shown while the answer streams: links are hidden until the final answer turns them into source cards. */
function streamingDisplayText(body: string) {
  return cleanMarkdownText(
    extractMarkdownLinks(body).text
      .replace(/https?:\/\/[^\s)]+/gi, "")
      // A link still being written ("[sunnah.com](https://sun…").
      .replace(/\[[^\]\n]*\]?\(?[^\s)]*$/, ""),
  );
}

function removeDuplicateQuranCoordinates(body: string) {
  return body
    .replace(
      /\s*\((?:Coran\s+)?\d{1,3}\s*:\s*\d+(?:\s*[-–—]\s*\d+)?\)\s*/gi,
      " ",
    )
    .replace(
      /(^|\n)\s*(?:[-•*]\s*)?(?:Coran\s+)?\d{1,3}\s*:\s*\d+(?:\s*[-–—]\s*\d+)?\s*(?=\n|$)/gi,
      "$1",
    )
    .replace(/[ \t]{2,}/g, " ")
    .replace(/ +([,.;:!?])/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function canonicalSourceUrl(value: string) {
  try {
    const url = new URL(value);
    [...url.searchParams.keys()].forEach((key) => {
      if (/^utm_/i.test(key)) url.searchParams.delete(key);
    });
    url.hash = "";
    const pathname = url.pathname.replace(/\/$/, "") || "/";
    return `${url.protocol}//${url.hostname.toLowerCase()}${pathname}${url.search}`;
  } catch {
    return value.trim().toLowerCase();
  }
}

function deduplicateSources(sources: WasilDisplaySource[], t: Translate) {
  const quranSources: WasilDisplaySource[] = [];
  const otherSources: WasilDisplaySource[] = [];

  sources.forEach((source) => {
    const urlTarget = resolveQuranNativeTarget(source.url, "");
    const targets = [
      ...(source.quranTarget ? [source.quranTarget] : []),
      ...(urlTarget ? [urlTarget] : []),
      ...extractQuranTextTargets(source.label),
    ];
    const uniqueTargets = new Map(
      targets.map((target) => [quranPassageKey(target), target]),
    );

    if (uniqueTargets.size === 0) {
      otherSources.push(
        isQuranSourceUrl(source.url)
          ? {
              ...source,
              label: t("wasil.quranReference"),
              detail: undefined,
            }
          : source,
      );
      return;
    }

    uniqueTargets.forEach((target) => {
      const existing = quranSources.find(
        (item) =>
          item.quranTarget &&
          quranPassageKey(item.quranTarget) === quranPassageKey(target),
      );
      if (existing) {
        existing.verified ||= source.verified;
        existing.url ??= source.url;
        return;
      }
      quranSources.push({
        label: "OUMMAH",
        detail: formatQuranPassage(target),
        url: source.url,
        verified: source.verified,
        quranTarget: target,
      });
    });
  });

  const seen = new Set<string>();
  const uniqueOtherSources = otherSources.filter((source) => {
    if (
      isQuranSourceUrl(source.url) ||
      /^(?:quran\.com|quranenc(?:\.com)?|référence coranique)$/i.test(
        source.label.trim(),
      )
    ) {
      return false;
    }
    const key = source.url
      ? `url:${canonicalSourceUrl(source.url)}`
      : `label:${source.label.trim().toLowerCase()}`;
    if (!source.label.trim() || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return [...quranSources, ...uniqueOtherSources];
}

function isQuranSourceUrl(value?: string) {
  if (!value) return false;
  try {
    const hostname = new URL(value).hostname
      .replace(/^www\./, "")
      .toLowerCase();
    return hostname === "quran.com" || hostname === "quranenc.com";
  } catch {
    return false;
  }
}

function quranPassageKey(target: QuranNativeTarget) {
  return [
    target.params.id,
    target.params.verseStart ?? "",
    target.params.verseEnd ?? "",
  ].join(":");
}

function extractQuranTextTargets(value: string) {
  const decoded = decodeQuranReference(value);
  const targets: QuranNativeTarget[] = [];
  const patterns = [
    /(?:\bCoran\s+)?\(?\b(\d{1,3})\s*:\s*(\d+)(?:\s*[-\u2013\u2014]\s*(\d+))?\b\)?/gi,
    /\bSourate\s+(\d{1,3})\s*,?\s*versets?\s+(\d+)(?:\s*(?:à|[-–—])\s*(\d+))?/gi,
  ];
  patterns.forEach((pattern) => {
    let match = pattern.exec(decoded);
    while (match) {
      const target = createQuranNativeTarget(match[1], match[2], match[3]);
      if (target) targets.push(target);
      match = pattern.exec(decoded);
    }
  });
  const exact = decoded.trim().match(
    /^\(?(?:Coran\s+)?(\d{1,3})(?::|\/)(\d+)(?:\s*[-–—]\s*(\d+))?\)?$/i,
  );
  const exactTarget = createQuranNativeTarget(
    exact?.[1],
    exact?.[2],
    exact?.[3],
  );
  if (exactTarget) targets.push(exactTarget);
  const namedPattern =
    /\bSourate\s+([^,—\d]+?)\s*,?\s*versets?\s+(\d+)(?:\s*(?:à|[-–—])\s*(\d+))?/gi;
  let namedMatch = namedPattern.exec(decoded);
  while (namedMatch) {
    const surahId = resolveExplicitSurahName(namedMatch[1]);
    const target = createQuranNativeTarget(
      surahId,
      namedMatch[2],
      namedMatch[3],
    );
    if (target) targets.push(target);
    namedMatch = namedPattern.exec(decoded);
  }
  const surahOnlyPattern = /\b(?:Coran,\s*)?Sourate\s+(\d{1,3})\b/gi;
  let surahOnlyMatch = surahOnlyPattern.exec(decoded);
  while (surahOnlyMatch) {
    const target = createQuranNativeTarget(surahOnlyMatch[1]);
    if (target) targets.push(target);
    surahOnlyMatch = surahOnlyPattern.exec(decoded);
  }
  return targets;
}

function resolveExplicitSurahName(value: string) {
  const normalized = value.trim().toLocaleLowerCase("fr");
  const matches = SURAHS.filter(
    (surah) =>
      surah.transliteration.toLocaleLowerCase("fr") === normalized ||
      surah.frenchName.toLocaleLowerCase("fr") === normalized,
  );
  return matches.length === 1 ? matches[0].id : undefined;
}

function formatQuranPassage(target: QuranNativeTarget) {
  const surahId = Number(target.params.id);
  const surah = SURAHS.find((item) => item.id === surahId);
  const name = surah?.transliteration ?? String(surahId);
  const verseStart = target.params.verseStart;
  const verseEnd = target.params.verseEnd;
  if (!verseStart) return `Sourate ${name}`;
  if (verseEnd && verseEnd !== verseStart) {
    return `Sourate ${name} — versets ${verseStart} à ${verseEnd}`;
  }
  return `Sourate ${name} — verset ${verseStart}`;
}

function markdownSourceLabel(label: string, urlValue: string, t: Translate) {
  try {
    const url = new URL(urlValue);
    const hostname = url.hostname.replace(/^www\./, "").toLowerCase();
    if (hostname === "quran.com" || hostname === "quranenc.com") {
      return label && !/^(?:quran\.com|quranenc)$/i.test(label.trim())
        ? decodeQuranReference(label)
        : t("wasil.quranReference");
    }
    return label || url.hostname.replace(/^www\./, "");
  } catch {
    return label || t("wasil.onlineReference");
  }
}

function parseWasilAnswer(answer: WasilReply, t: Translate) {
  const extracted = extractMarkdownLinks(answer.body);
  const rawSources: { label: string; url: string }[] = [];
  const withoutRawUrls = extracted.text.replace(/https?:\/\/[^\s)]+/gi, (url) => {
    rawSources.push({ label: "", url });
    return "";
  });
  const hasExplicitNativeReferences =
    (answer.quranReferences?.length ?? 0) > 0 ||
    (answer.hadithReferences?.length ?? 0) > 0;
  const structuredReferenceLabel = (() => {
    if (!answer.reference || !answer.sourceUrl) return answer.reference;
    try {
      const host = new URL(answer.sourceUrl).hostname.replace(/^www\./, "");
      const segments = answer.reference.split(/\s+·\s+/);
      if (host === "binbaz.org.sa") {
        return segments.find((segment) => /\bibn b(?:a|â)z\b/i.test(segment)) ??
          answer.reference;
      }
    } catch {
      // An invalid URL will still be shown as an unlinked reference below.
    }
    return answer.reference;
  })();
  const structuredSources: WasilDisplaySource[] =
    answer.reference && !hasExplicitNativeReferences
      ? [toNativeSource({
          label: structuredReferenceLabel ?? answer.reference,
          url: answer.sourceUrl,
          verified: true,
        })]
      : [];
  const explicitQuranSources = (answer.quranReferences ?? []).flatMap(
    (reference): WasilDisplaySource[] => {
      const target = createQuranNativeTarget(
        reference.surah,
        reference.verseStart,
        reference.verseEnd ?? undefined,
      );
      return target
        ? [{
            label: "OUMMAH",
            detail: formatQuranPassage(target),
            verified: true,
            quranTarget: target,
          }]
        : [];
    },
  );
  const explicitHadithSources = (answer.hadithReferences ?? []).flatMap(
    (reference): WasilDisplaySource[] => {
      const directId = reference.id?.trim();
      const searchQuery = reference.searchQuery.trim();
      if (!directId && !searchQuery) return [];
      return [{
        label: "OUMMAH · Hadith",
        detail: [
          reference.collection && reference.collection !== "HadeethEnc"
            ? reference.collection
            : null,
          reference.reference && !reference.reference.startsWith("Hadith ")
            ? reference.reference
            : null,
          reference.grade || null,
        ].filter(Boolean).join(" · ") || t("wasil.verifiedHadith"),
        verified: true,
        hadithTarget: directId
          ? { pathname: "/hadith/[hadithId]", params: { hadithId: directId } }
          : { pathname: "/hadith/search", params: { q: searchQuery } },
      }];
    },
  );
  const explicitWebSources = (answer.webReferences ?? []).map(
    (source): WasilDisplaySource => toNativeSource({
      label: markdownSourceLabel(source.title, source.url, t),
      url: source.url,
      verified: true,
    }),
  );
  const bodyTargets = extractQuranTextTargets(answer.body);
  const bodyQuranSources = bodyTargets.map(
    (target): WasilDisplaySource => ({
      label: "OUMMAH",
      detail: formatQuranPassage(target),
      verified: structuredSources.length > 0,
      quranTarget: target,
    }),
  );
  const extractedSources = [...extracted.sources, ...rawSources].map(
    (source): WasilDisplaySource => toNativeSource({
      label: markdownSourceLabel(source.label, source.url, t),
      url: source.url,
      verified: structuredSources.some(
        (structured) =>
          !!structured.url &&
          canonicalSourceUrl(structured.url) === canonicalSourceUrl(source.url),
      ),
    }),
  );
  const normalizedSources = [
    ...explicitQuranSources,
    ...explicitHadithSources,
    ...structuredSources,
    ...bodyQuranSources,
    ...explicitWebSources,
    ...extractedSources,
  ];
  const sources = deduplicateSources(normalizedSources, t);
  const urlTargets = [
    ...structuredSources,
    ...extractedSources,
  ].flatMap((source) => {
    const target = resolveQuranNativeTarget(source.url, "");
    return target ? [target] : [];
  });
  const nativeTargets = sources.flatMap((source) =>
    source.quranTarget ? [source.quranTarget] : [],
  );
  if (__DEV__) {
    const serializeTarget = (target: QuranNativeTarget) => ({
      kind: "quran" as const,
      surahId: Number(target.params.id),
      verseStart: target.params.verseStart
        ? Number(target.params.verseStart)
        : undefined,
      verseEnd: target.params.verseEnd
        ? Number(target.params.verseEnd)
        : undefined,
    });
    console.log("[WASIL_QURAN_PIPELINE]", {
      rawAnswer: answer.body,
      structuredSources: structuredSources.map((source) => ({
        label: source.label,
        url: source.url,
      })),
      bodyTargets: bodyTargets.map(serializeTarget),
      urlTargets: urlTargets.map(serializeTarget),
      nativeTargets: nativeTargets.map(serializeTarget),
      renderedSources: sources.map((source) => ({
        kind: source.quranTarget ? "quran" : "external",
        label: source.label,
        detail: source.detail,
        url: source.quranTarget ? undefined : source.url,
      })),
    });
  }
  return {
    body: removeDuplicateQuranCoordinates(cleanMarkdownText(withoutRawUrls)),
    sources,
  };
}

function renderInlineWasilMarkdown(text: string) {
  return text.split(/(\*\*[^*\r\n]+\*\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <Text key={`wasil-bold-${index}`} style={styles.wasilMessageBold}>
          {part.slice(2, -2)}
        </Text>
      );
    }
    return part.replace(/\*\*/g, "");
  });
}

function normalizeWasilLiteralNewlines(body: string) {
  return body
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n");
}

function asksForNearbyHalalPlace(value: string) {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const mentionsPlace = /\b(restaurant|resto|fast food|boucherie|epicerie|commerce|manger|repas)\b/.test(normalized);
  const mentionsHalal = /\bhalal\b/.test(normalized);
  const mentionsProximity = /\b(proche|pres|autour|alentour|a cote|plus proche|nearest|nearby)\b/.test(normalized)
    || normalized.includes("chez moi")
    || normalized.includes("de moi");
  return mentionsHalal && (mentionsProximity || (mentionsPlace && normalized.includes("ou")));
}

type WasilHalalLocationContext = {
  places: HalalPlace[];
};

async function resolveWasilHalalContext(question: string): Promise<WasilHalalLocationContext | undefined> {
  if (!asksForNearbyHalalPlace(question)) return undefined;
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== Location.PermissionStatus.GRANTED) return undefined;
  const lastKnown = await Location.getLastKnownPositionAsync({
    maxAge: 5 * 60 * 1000,
    requiredAccuracy: 2_000,
  });
  const position = lastKnown ?? await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  const result = await searchNearbyHalalPlaces(
    { latitude: position.coords.latitude, longitude: position.coords.longitude },
    10_000,
  );
  return { places: result.places.slice(0, 5) };
}

function buildNearbyHalalLocalReply(t: Translate, context?: WasilHalalLocationContext): WasilReply {
  if (!context) {
    return {
      kind: "answer",
      title: t("wasil.locationNeeded"),
      body: t("wasil.nearbyHalalNeedsLocation"),
      action: { label: t("wasil.openHalalNearby"), route: "/halal" },
    };
  }
  if (context.places.length === 0) {
    return {
      kind: "answer",
      title: t("wasil.noHalalNearby"),
      body: t("wasil.noHalalNearbyBody"),
      action: { label: t("wasil.exploreHalal"), route: "/halal" },
    };
  }
  const body = context.places.map((place, index) =>
    `${index + 1}. ${place.name}\n${place.distanceLabel} · ${place.verificationLabel}\n${place.address}`,
  ).join("\n\n");
  const googleAttribution = context.places.some((place) => place.source === "google")
    ? `\n\n${t("wasil.googleAttribution")}`
    : "";
  return {
    kind: "answer",
    title: context.places.length === 1 ? t("wasil.nearbyHalalOne") : t("wasil.nearbyHalalMany"),
    body: `${body}${googleAttribution}\n\n${t("wasil.halalEvidenceNote")}`,
    action: { label: t("wasil.seeOnMap"), route: "/halal" },
  };
}

function renderWasilBody(body: string) {
  body = normalizeWasilLiteralNewlines(body);
  const paragraphs: { start: number; text: string }[] = [];
  const separator = /(?:\r\n|\n|\r){2,}/g;
  let paragraphStart = 0;
  let match = separator.exec(body);

  while (match) {
    paragraphs.push({
      start: paragraphStart,
      text: body.slice(paragraphStart, match.index),
    });
    paragraphStart = separator.lastIndex;
    match = separator.exec(body);
  }
  paragraphs.push({
    start: paragraphStart,
    text: body.slice(paragraphStart),
  });

  return paragraphs.map((paragraph, index) => (
    <Text
      key={`wasil-paragraph-${paragraph.start}`}
      style={[
        styles.wasilMessageText,
        index > 0 && styles.wasilMessageParagraph,
      ]}
    >
      {renderInlineWasilMarkdown(paragraph.text)}
    </Text>
  ));
}

function WasilAnswerPresentation({
  answer,
  animateReferences = false,
}: {
  answer: WasilReply;
  animateReferences?: boolean;
}) {
  const { t } = useI18n();
  const parsed = parseWasilAnswer(answer, t);
  const referenceOpacity = useRef(new Animated.Value(animateReferences ? 0 : 1)).current;
  const referenceTranslateY = useRef(new Animated.Value(animateReferences ? 7 : 0)).current;
  const visibleSources = parsed.sources.filter(
    (source) =>
      !!source.quranTarget ||
      !!source.hadithTarget ||
      (source.verified && !!source.url) ||
      (!source.url && !!getWasilReferenceRoute(source.label)),
  );
  const hasExternalSource = visibleSources.some(
    (source) => !!source.url && !source.quranTarget && !source.hadithTarget,
  );
  const documentaryStatus = answer.documentaryStatus ??
    (visibleSources.some((source) => source.verified) ? "verified" : "none");

  useEffect(() => {
    if (!animateReferences) return;
    referenceOpacity.setValue(0);
    referenceTranslateY.setValue(7);
    const animation = Animated.parallel([
      Animated.timing(referenceOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(referenceTranslateY, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [animateReferences, referenceOpacity, referenceTranslateY]);

  return (
    <>
      {renderWasilBody(parsed.body)}
      {visibleSources.length > 0 ? (
        <View style={styles.wasilSources}>
          <View style={styles.wasilSourceDivider} />
          <Text style={styles.wasilSourcesTitle}>
            {hasExternalSource
              ? t(visibleSources.length > 1
                ? "wasil.verifiedReferences"
                : "wasil.verifiedReference")
              : t(visibleSources.length > 1
                ? "wasil.oummahReferences"
                : "wasil.oummahReference")}
          </Text>
          {visibleSources.map((source) => {
            const referenceRoute = source.url
              ? null
              : getWasilReferenceRoute(source.label);
            const nativeRoute =
              source.quranTarget ?? source.hadithTarget ?? referenceRoute;
            const canOpen = !!nativeRoute || !!source.url;
            const isNative = !!nativeRoute;
            const isQuranReference = !!source.quranTarget;
            const isHadithReference = !!source.hadithTarget;
            const referenceHint = isQuranReference
              ? t("wasil.openInQuran")
              : isHadithReference
                ? t("wasil.openHadith")
                : undefined;
            const visibleReferenceHint = animateReferences
              ? referenceHint
              : undefined;
            return (
              <Animated.View
                key={
                  source.quranTarget
                    ? `quran:${quranPassageKey(source.quranTarget)}`
                    : source.hadithTarget
                      ? `hadith:${"hadithId" in source.hadithTarget.params ? source.hadithTarget.params.hadithId : source.hadithTarget.params.q}:${source.detail ?? source.label}`
                      : (source.url ?? source.label)
                }
                style={
                  animateReferences
                    ? {
                        opacity: referenceOpacity,
                        transform: [{ translateY: referenceTranslateY }],
                      }
                    : undefined
                }
              >
                <Pressable
                  accessibilityLabel={visibleReferenceHint ?? source.label}
                  accessibilityRole={canOpen ? "link" : undefined}
                  onPress={
                    source.quranTarget
                      ? () => router.push(source.quranTarget!)
                      : source.hadithTarget
                        ? () => router.push(source.hadithTarget!)
                        : nativeRoute
                          ? () => router.push(nativeRoute)
                          : source.url
                            ? () => void Linking.openURL(source.url!)
                            : undefined
                  }
                  style={({ pressed }) => [
                    styles.wasilSourceRow,
                    pressed && canOpen && styles.pressed,
                  ]}
                >
                  <Ionicons
                    name={
                      animateReferences && isHadithReference
                        ? "library-outline"
                        : "book-outline"
                    }
                    size={16}
                    color={colors.goldLight}
                  />
                  <View style={styles.wasilSourceCopy}>
                    <Text style={styles.wasilSourceLabel}>{source.label}</Text>
                    {source.detail ? (
                      <Text style={styles.wasilSourceDetail}>
                        {source.detail}
                      </Text>
                    ) : null}
                    {visibleReferenceHint ? (
                      <Text style={styles.wasilSourceHint}>{visibleReferenceHint}</Text>
                    ) : null}
                  </View>
                  {canOpen ? (
                    <Ionicons
                      name={isNative ? "chevron-forward" : "open-outline"}
                      size={13}
                      color={colors.textMuted}
                    />
                  ) : null}
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      ) : null}
      <View style={styles.wasilAnswerFooter}>
        {documentaryStatus === "verified" ? (
          <View style={styles.wasilVerifiedBadge}>
            <Ionicons
              name="shield-checkmark-outline"
              size={13}
              color={colors.goldLight}
            />
            <Text style={styles.wasilVerifiedText}>{t("wasil.verifiedAnswer")}</Text>
          </View>
        ) : documentaryStatus === "partial" ? (
          <View style={styles.wasilVerifiedBadge}>
            <Ionicons
              name="information-circle-outline"
              size={13}
              color={colors.goldLight}
            />
            <Text style={styles.wasilVerifiedText}>{t("wasil.partialSources")}</Text>
          </View>
        ) : (
          <View />
        )}
      </View>
    </>
  );
}

function getLastAssistantTitle(
  conversation: WasilConversationThread,
  fallbackTitle: string,
) {
  for (let index = conversation.messages.length - 1; index >= 0; index -= 1) {
    const message = conversation.messages[index];
    if (message.role === "assistant") {
      return message.reply?.title ?? message.text;
    }
  }
  return fallbackTitle;
}

export default function DalilScreen() {
  const {
    prompt: contextualPrompt,
    autoSubmit,
    requestKey,
  } = useLocalSearchParams<{
    prompt?: string | string[];
    autoSubmit?: string | string[];
    requestKey?: string | string[];
  }>();
  const { language, t } = useI18n();
  const [prompt, setPrompt] = useState("");
  const [examplesExpanded, setExamplesExpanded] = useState(false);
  const [noticeExpanded, setNoticeExpanded] = useState(false);
  // Answer text received while Wasil is still writing it.
  const [streamingText, setStreamingText] = useState("");
  const streamBuffer = useRef("");
  const streamFlushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [submittedPrompt, setSubmittedPrompt] = useState("");
  const [reply, setReply] = useState<WasilReply | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [energyVisible, setEnergyVisible] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [energyPacks, setEnergyPacks] = useState<WasilEnergyPack[]>([]);
  const [energyLoading, setEnergyLoading] = useState(false);
  const [energyPurchaseId, setEnergyPurchaseId] = useState<string | null>(null);
  const [energyFeedback, setEnergyFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(() =>
    t("wasil.loadingUnderstand"),
  );
  const [historyVisible, setHistoryVisible] = useState(false);
  const [deletingConversationId, setDeletingConversationId] = useState("");
  const [conversations, setConversations] = useState<
    WasilConversationThread[]
  >([]);
  const [messages, setMessages] = useState<WasilConversationMessage[]>([]);
  const [lastMisunderstoodPrompt, setLastMisunderstoodPrompt] = useState("");
  const [failedPrompt, setFailedPrompt] = useState("");
  // Balance when a question was refused for lack of Energy: « Réessayer » comes back once it has grown.
  const [energyBlockedAt, setEnergyBlockedAt] = useState<number | null>(null);
  const [pendingReminder, setPendingReminder] =
    useState<PendingWasilReminder | null>(null);
  const [pendingReminderManagement, setPendingReminderManagement] =
    useState<PendingWasilReminderManagement | null>(null);
  const [pendingGoalAction, setPendingGoalAction] =
    useState<PendingWasilGoalAction | null>(null);
  const [visualPose, setVisualPose] = useState<WasilVisualPose>("idle");
  const [visualFrame, setVisualFrame] = useState(0);
  const [loadingVisualPose, setLoadingVisualPose] = useState<WasilVisualPose | null>(null);

  const float = useRef(new Animated.Value(0)).current;
  const poseTranslateX = useRef(new Animated.Value(0)).current;
  const poseRotate = useRef(new Animated.Value(0)).current;
  const poseScale = useRef(new Animated.Value(1)).current;
  const poseOpacity = useRef(new Animated.Value(1)).current;
  const answerReadyHalo = useRef(new Animated.Value(0)).current;
  const poseMotion = useRef<Animated.CompositeAnimation | null>(null);
  const thinkingPulse = useRef(new Animated.Value(0)).current;
  const currentReplyOpacity = useRef(new Animated.Value(0)).current;
  const currentReplyTranslateY = useRef(new Animated.Value(10)).current;
  const failedReactionOpacity = useRef(new Animated.Value(1)).current;
  const failedReactionTranslateY = useRef(new Animated.Value(0)).current;
  const blinkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const poseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadingVariationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadingStatusTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const lastLoadingVariation = useRef<"calm" | "search" | "consult" | "focus" | null>(null);
  const recentLoadingVariations = useRef<("calm" | "search" | "consult" | "focus")[]>([]);
  const inactivityReaction = useRef<"attentive" | "curious" | "wave" | null>(null);
  const recentInactivityReactions = useRef<("attentive" | "curious" | "wave")[]>([]);
  const specialAnimationInProgress = useRef(false);
  const idleCooldownUntil = useRef(0);
  const inactivityReactionsSinceWave = useRef(2);
  const inputFocused = useRef(false);
  const greetingPlayed = useRef(false);
  const processedQuranReplyId = useRef("");
  const answerReadyReplyId = useRef("");
  const wasLoading = useRef(false);
  const answerReadyAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const autoSubmittedPrompt = useRef("");
  const retryInFlight = useRef(false);
  const submissionInFlight = useRef(false);
  const newTurnAnchorY = useRef<number | null>(null);
  const newTurnScrollDone = useRef(false);
  const deletingConversationIdRef = useRef("");
  const conversationScrollRef = useRef<ScrollView>(null);
  const activeConversationId = useRef(createWasilConversationId());
  const activeMessages = useRef<WasilConversationMessage[]>([]);
  const storedConversations = useRef<WasilConversationThread[]>([]);
  const conversationsLoaded = useRef(false);
  const conversationsLoad = useRef<Promise<WasilConversationThread[]> | null>(
    null,
  );
  const { reciters, setCurrentReciter } = useReciter();
  const currentHour = new Date().getHours();
  const wasilGreeting =
    currentHour >= 5 && currentHour < 12
      ? t("wasil.greetingMorning")
      : currentHour >= 12 && currentHour < 18
        ? t("wasil.greetingAfternoon")
        : t("wasil.greetingEvening");
  const hasActiveConversation =
    messages.length > 0 || Boolean(submittedPrompt && (reply || loading));

  const scrollToLatestMessage = useCallback(() => {
    requestAnimationFrame(() => {
      conversationScrollRef.current?.scrollToEnd({ animated: true });
    });
  }, []);

  const scrollToNewTurnAnchor = useCallback((anchorY: number) => {
    newTurnAnchorY.current = anchorY;
    if (newTurnScrollDone.current) return;
    newTurnScrollDone.current = true;
    requestAnimationFrame(() => {
      conversationScrollRef.current?.scrollTo({
        y: Math.max(0, anchorY - 24),
        animated: true,
      });
    });
  }, []);

  const ensureConversationsLoaded = async () => {
    if (!conversationsLoad.current) {
      conversationsLoad.current = loadWasilConversations();
    }
    const loaded = await conversationsLoad.current;
    if (!conversationsLoaded.current) {
      conversationsLoaded.current = true;
      storedConversations.current = loaded;
      setConversations(loaded);
    }
    return storedConversations.current;
  };

  const commitTurn = async (question: string, answer: WasilReply) => {
    const current = await ensureConversationsLoaded();
    const next = appendWasilConversationTurn(
      current,
      activeConversationId.current,
      question,
      answer,
    );
    storedConversations.current = next.conversations;
    activeMessages.current = next.conversation.messages;
    setConversations(next.conversations);
    setMessages(next.conversation.messages);
    setSubmittedPrompt("");
    setReply(null);
    await saveWasilConversations(next.conversations).catch(() => undefined);
    void syncConversationsWithCloud(next.conversations);
  };

  const syncConversationsWithCloud = async (
    local: readonly WasilConversationThread[],
  ) => {
    try {
      const remote = await syncWasilConversations(local);
      const merged = mergeWasilConversations(local, remote);
      storedConversations.current = merged;
      setConversations(merged);
      const active = merged.find(
        (conversation) => conversation.id === activeConversationId.current,
      );
      if (active) {
        activeMessages.current = active.messages;
        setMessages(active.messages);
      }
      await saveWasilConversations(merged).catch(() => undefined);
    } catch {
      // Le stockage local reste disponible si la synchronisation échoue.
    }
  };

  const startNewConversation = () => {
    if (loading) return;
    activeConversationId.current = createWasilConversationId();
    activeMessages.current = [];
    setMessages([]);
    setPrompt("");
    setSubmittedPrompt("");
    setReply(null);
    setFailedPrompt("");
    setLastMisunderstoodPrompt("");
    setPendingReminder(null);
    setPendingReminderManagement(null);
    setPendingGoalAction(null);
    setExamplesExpanded(false);
    setHistoryVisible(false);
    Keyboard.dismiss();
    requestAnimationFrame(() => {
      conversationScrollRef.current?.scrollTo({ y: 0, animated: true });
    });
  };

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getValidSession()
        .then((session) => {
          if (!active) return;
          const authenticated = Boolean(session);
          setIsAuthenticated(authenticated);
          if (!authenticated) {
            setBalance(null);
            setEnergyVisible(false);
            setConversations([]);
            setMessages([]);
            setSubmittedPrompt("");
            setReply(null);
            setFailedPrompt("");
            setPrompt("");
            setHistoryVisible(false);
            return;
          }
          void ensureConversationsLoaded().then(syncConversationsWithCloud);
          getWasilBalance()
            .then((nextBalance) => {
              if (active) setBalance(nextBalance);
            })
            .catch(() => {
              if (active) setBalance(null);
            });
        })
        .catch(() => {
          if (active) {
            setIsAuthenticated(false);
            setBalance(null);
            setEnergyVisible(false);
            setConversations([]);
            setMessages([]);
            setSubmittedPrompt("");
            setReply(null);
            setFailedPrompt("");
            setPrompt("");
            setHistoryVisible(false);
          }
        });
      return () => {
        active = false;
      };
    }, []),
  );

  const openEnergy = async () => {
    setEnergyVisible(true);
    setEnergyLoading(true);
    setEnergyFeedback(null);
    const result = await loadWasilEnergyPacks().catch(() => ({
      status: "error" as const,
      code: "offering-unavailable" as const,
      message: t("wasil.shopUnavailable"),
    }));
    if (result.status === "success") {
      setEnergyPacks(result.packs);
    } else {
      setEnergyPacks([]);
      setEnergyFeedback(result.message);
    }
    setEnergyLoading(false);
  };

  const refreshEnergy = async () => {
    setEnergyFeedback(null);
    const result = await refreshWasilEnergyBalance();
    if (result.status === "success") {
      setBalance(result.balance);
      setEnergyFeedback(t("wasil.energyRefreshed"));
    } else if (result.status === "error") {
      setEnergyFeedback(result.message);
    }
  };

  const purchaseEnergy = async (pack: WasilEnergyPack) => {
    if (energyPurchaseId || balance === null) return;
    setEnergyPurchaseId(pack.identifier);
    setEnergyFeedback(null);
    const result = await purchaseWasilEnergy(pack, balance);
    if (result.status === "completed") {
      setBalance(result.balance);
      setEnergyVisible(false);
    } else if (result.status === "pending") {
      setBalance(result.balance);
      setEnergyFeedback(
        t("wasil.purchaseConfirmed"),
      );
    } else if (result.status === "cancelled") {
      setEnergyFeedback(t("wasil.purchaseCancelled"));
    } else if (result.status === "error") {
      setEnergyFeedback(result.message);
    }
    setEnergyPurchaseId(null);
  };

  useEffect(() => {
    const incomingPrompt = getSingleParam(contextualPrompt);
    if (incomingPrompt) setPrompt(incomingPrompt);
  }, [contextualPrompt]);

  useEffect(() => {
    poseMotion.current?.stop();
    poseTranslateX.stopAnimation();
    float.stopAnimation();
    poseRotate.stopAnimation();
    poseScale.stopAnimation();
    poseTranslateX.setValue(0);
    float.setValue(0);
    poseRotate.setValue(0);
    poseScale.setValue(1);

    const reset = Animated.parallel([
      Animated.timing(poseTranslateX, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(float, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(poseRotate, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(poseScale, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
    ]);

    if (visualPose === "wave") {
      poseMotion.current = Animated.sequence([
        Animated.parallel([
          Animated.timing(poseTranslateX, { toValue: 1.5, duration: 1100, useNativeDriver: true }),
          Animated.timing(poseRotate, { toValue: -0.8, duration: 1100, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(poseTranslateX, { toValue: -1.5, duration: 1100, useNativeDriver: true }),
          Animated.timing(poseRotate, { toValue: 0.8, duration: 1100, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(poseTranslateX, { toValue: 0, duration: 220, useNativeDriver: true }),
          Animated.timing(poseRotate, { toValue: 0, duration: 220, useNativeDriver: true }),
        ]),
      ]);
    } else if (visualPose === "thinking") {
      poseMotion.current = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(float, { toValue: -2, duration: 1900, useNativeDriver: true }),
            Animated.timing(poseRotate, { toValue: -1, duration: 1900, useNativeDriver: true }),
            Animated.timing(poseScale, { toValue: 1.012, duration: 1900, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(float, { toValue: 0, duration: 1900, useNativeDriver: true }),
            Animated.timing(poseRotate, { toValue: 0, duration: 1900, useNativeDriver: true }),
            Animated.timing(poseScale, { toValue: 1, duration: 1900, useNativeDriver: true }),
          ]),
        ]),
      );
    } else if (visualPose === "reading-quran") {
      poseMotion.current = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(float, { toValue: -1, duration: 1600, useNativeDriver: true }),
            Animated.timing(poseRotate, { toValue: -0.3, duration: 1600, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(float, { toValue: 0, duration: 1600, useNativeDriver: true }),
            Animated.timing(poseRotate, { toValue: 0, duration: 1600, useNativeDriver: true }),
          ]),
        ]),
      );
    } else {
      poseMotion.current = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(float, { toValue: -3, duration: 2100, useNativeDriver: true }),
            Animated.timing(poseScale, { toValue: 1.008, duration: 2100, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(float, { toValue: 0, duration: 2100, useNativeDriver: true }),
            Animated.timing(poseScale, { toValue: 1, duration: 2100, useNativeDriver: true }),
          ]),
        ]),
      );
    }

    poseMotion.current.start();
    return () => {
      poseMotion.current?.stop();
      poseMotion.current = null;
    };
  }, [float, poseRotate, poseScale, poseTranslateX, visualPose]);

  useEffect(() => {
    poseOpacity.stopAnimation();
    poseOpacity.setValue(1);
    const transition = Animated.sequence([
      Animated.timing(poseOpacity, {
        toValue: 0.78,
        duration: 45,
        useNativeDriver: true,
      }),
      Animated.timing(poseOpacity, {
        toValue: 1,
        duration: 75,
        useNativeDriver: true,
      }),
    ]);
    transition.start();
    return () => transition.stop();
  }, [loadingVisualPose, poseOpacity, visualFrame, visualPose]);

  useEffect(() => {
    loadingStatusTimers.current.forEach(clearTimeout);
    loadingStatusTimers.current = [];

    if (!loading) {
      setLoadingStatus(t("wasil.loadingUnderstand"));
      return;
    }

    setLoadingStatus(t("wasil.loadingUnderstand"));

    const scheduleStatus = (delay: number, value: string) => {
      const timer = setTimeout(() => {
        setLoadingStatus(value);
      }, delay);
      loadingStatusTimers.current.push(timer);
    };

    scheduleStatus(900, t("wasil.loadingGather"));
    scheduleStatus(2300, t("wasil.loadingSources"));
    scheduleStatus(4600, t("wasil.loadingVerify"));
    scheduleStatus(7200, t("wasil.loadingPrepare"));

    return () => {
      loadingStatusTimers.current.forEach(clearTimeout);
      loadingStatusTimers.current = [];
    };
  }, [loading, t]);

  useEffect(() => {
    if (loadingVariationTimer.current) {
      clearTimeout(loadingVariationTimer.current);
      loadingVariationTimer.current = null;
    }
    poseMotion.current?.stop();
    setLoadingVisualPose(null);
    setVisualFrame(0);

    if (!loading || failedPrompt) return;

    const randomDelay = (minimum: number, maximum: number) =>
      minimum + Math.floor(Math.random() * (maximum - minimum + 1));
    const chooseVariation = () => {
      const variations = (["calm", "search", "consult", "focus"] as const).filter(
        (variation) => !recentLoadingVariations.current.includes(variation),
      );
      const variation = variations.length
        ? variations[Math.floor(Math.random() * variations.length)]
        : "calm";
      lastLoadingVariation.current = variation;
      recentLoadingVariations.current = [
        ...recentLoadingVariations.current,
        variation,
      ].slice(-2);
      return variation;
    };
    const startThinkingMotion = () => {
      poseMotion.current = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(float, { toValue: -2, duration: 1900, useNativeDriver: true }),
            Animated.timing(poseRotate, { toValue: -1, duration: 1900, useNativeDriver: true }),
            Animated.timing(poseScale, { toValue: 1.012, duration: 1900, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(float, { toValue: 0, duration: 1900, useNativeDriver: true }),
            Animated.timing(poseRotate, { toValue: 0, duration: 1900, useNativeDriver: true }),
            Animated.timing(poseScale, { toValue: 1, duration: 1900, useNativeDriver: true }),
          ]),
        ]),
      );
      poseMotion.current.start();
    };
    const scheduleVariation = (minimum: number, maximum: number) => {
      loadingVariationTimer.current = setTimeout(() => {
        loadingVariationTimer.current = null;
        if (!loading || failedPrompt) {
          specialAnimationInProgress.current = false;
          return;
        }
        if (
          specialAnimationInProgress.current ||
          Date.now() < idleCooldownUntil.current
        ) {
          loadingVariationTimer.current = setTimeout(() => {
            if (loading && !failedPrompt) scheduleVariation(4000, 6000);
          }, 5000);
          return;
        }

        const variation = chooseVariation();
        specialAnimationInProgress.current = true;
        poseMotion.current?.stop();
        setLoadingVisualPose(variation === "search" || variation === "consult" ? variation === "search" ? "idle" : "reading-quran" : "thinking");
        if (variation === "consult") setVisualFrame(0);

        let animation: Animated.CompositeAnimation;
        if (variation === "search") {
          animation = Animated.sequence([
            Animated.parallel([
              Animated.timing(poseTranslateX, { toValue: 1.5, duration: 900, useNativeDriver: true }),
              Animated.timing(poseRotate, { toValue: 0.8, duration: 900, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(poseTranslateX, { toValue: 0, duration: 900, useNativeDriver: true }),
              Animated.timing(poseRotate, { toValue: 0, duration: 900, useNativeDriver: true }),
            ]),
          ]);
        } else if (variation === "consult") {
          animation = Animated.sequence([
            Animated.delay(100),
            Animated.timing(poseTranslateX, { toValue: 1, duration: 450, useNativeDriver: true }),
            Animated.timing(poseTranslateX, { toValue: 0, duration: 450, useNativeDriver: true }),
            Animated.delay(700),
          ]);
        } else if (variation === "focus") {
          animation = Animated.sequence([
            Animated.parallel([
              Animated.timing(poseScale, { toValue: 1.008, duration: 800, useNativeDriver: true }),
              Animated.timing(poseOpacity, { toValue: 0.88, duration: 800, useNativeDriver: true }),
            ]),
            Animated.delay(700),
            Animated.parallel([
              Animated.timing(poseScale, { toValue: 1, duration: 800, useNativeDriver: true }),
              Animated.timing(poseOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
            ]),
          ]);
        } else {
          animation = Animated.sequence([
            Animated.timing(poseRotate, { toValue: -0.5, duration: 1100, useNativeDriver: true }),
            Animated.timing(poseRotate, { toValue: 0, duration: 1100, useNativeDriver: true }),
          ]);
        }

        poseMotion.current = animation;
        const consultationListener =
          variation === "consult"
            ? poseTranslateX.addListener(({ value }) => {
                if (value >= 0.9) setVisualFrame(1);
              })
            : null;
        animation.start(({ finished }) => {
          if (consultationListener) poseTranslateX.removeListener(consultationListener);
          if (!finished || !loading || failedPrompt) {
            specialAnimationInProgress.current = false;
            return;
          }
          setVisualFrame(0);
          setLoadingVisualPose(null);
          poseTranslateX.setValue(0);
          poseRotate.setValue(0);
          poseScale.setValue(1);
          poseOpacity.setValue(1);
          specialAnimationInProgress.current = false;
          idleCooldownUntil.current = Date.now() + 3000;
          startThinkingMotion();
          scheduleVariation(4000, 6000);
        });
      }, randomDelay(minimum, maximum));
    };

    scheduleVariation(3000, 4000);
    return () => {
      if (loadingVariationTimer.current) clearTimeout(loadingVariationTimer.current);
      loadingVariationTimer.current = null;
      poseMotion.current?.stop();
      setLoadingVisualPose(null);
      specialAnimationInProgress.current = false;
    };
  }, [failedPrompt, float, loading, poseOpacity, poseRotate, poseScale, poseTranslateX]);

  useEffect(() => {
    const clearInactivity = () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      inactivityTimer.current = null;
    };

    const randomDelay = (minimum: number, maximum: number) =>
      minimum + Math.floor(Math.random() * (maximum - minimum + 1));

    const chooseReaction = () => {
      const available = (["attentive", "curious", "wave"] as const).filter(
        (reaction) =>
          !recentInactivityReactions.current.includes(reaction) &&
          !(reaction === "wave" && inactivityReactionsSinceWave.current < 2),
      );
      const reaction = available.length
        ? available[Math.floor(Math.random() * available.length)]
        : null;
      if (!reaction) return null;
      inactivityReaction.current = reaction;
      recentInactivityReactions.current = [
        ...recentInactivityReactions.current,
        reaction,
      ].slice(-2);
      if (reaction === "wave") inactivityReactionsSinceWave.current = 0;
      else inactivityReactionsSinceWave.current += 1;
      return reaction;
    };

    const startIdleMotion = () => {
      poseMotion.current = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(float, { toValue: -3, duration: 2100, useNativeDriver: true }),
            Animated.timing(poseScale, { toValue: 1.008, duration: 2100, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(float, { toValue: 0, duration: 2100, useNativeDriver: true }),
            Animated.timing(poseScale, { toValue: 1, duration: 2100, useNativeDriver: true }),
          ]),
        ]),
      );
      poseMotion.current.start();
    };

    const scheduleReaction = (minimum: number, maximum: number) => {
      inactivityTimer.current = setTimeout(() => {
        inactivityTimer.current = null;
        if (
          loading ||
          !!failedPrompt ||
          energyVisible ||
          historyVisible ||
          inputFocused.current ||
          (visualPose !== "idle" && visualPose !== "blink")
        ) {
          scheduleReaction(18000, 28000);
          return;
        }
        if (
          specialAnimationInProgress.current ||
          Date.now() < idleCooldownUntil.current
        ) {
          scheduleReaction(18000, 28000);
          return;
        }
        const reaction = chooseReaction();
        if (!reaction) {
          scheduleReaction(18000, 28000);
          return;
        }
        specialAnimationInProgress.current = true;
        poseMotion.current?.stop();
        const finish = () => {
          poseTranslateX.setValue(0);
          poseRotate.setValue(0);
          float.setValue(0);
          poseScale.setValue(1);
          specialAnimationInProgress.current = false;
          idleCooldownUntil.current = Date.now() + 8000;
          startIdleMotion();
          scheduleReaction(18000, 28000);
        };

        if (reaction === "attentive") {
          poseMotion.current = Animated.sequence([
            Animated.parallel([
              Animated.timing(poseTranslateX, { toValue: 1.5, duration: 650, useNativeDriver: true }),
              Animated.timing(poseRotate, { toValue: 0.8, duration: 650, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(poseTranslateX, { toValue: 0, duration: 650, useNativeDriver: true }),
              Animated.timing(poseRotate, { toValue: 0, duration: 650, useNativeDriver: true }),
            ]),
          ]);
        } else if (reaction === "curious") {
          poseMotion.current = Animated.sequence([
            Animated.parallel([
              Animated.timing(float, { toValue: -1.5, duration: 600, useNativeDriver: true }),
              Animated.timing(poseScale, { toValue: 1.01, duration: 600, useNativeDriver: true }),
            ]),
            Animated.delay(600),
            Animated.parallel([
              Animated.timing(float, { toValue: 0, duration: 800, useNativeDriver: true }),
              Animated.timing(poseScale, { toValue: 1, duration: 800, useNativeDriver: true }),
            ]),
          ]);
        } else {
          setVisualFrame(0);
          setVisualPose("wave");
          poseMotion.current = Animated.sequence([
            Animated.timing(poseRotate, { toValue: -1.2, duration: 900, useNativeDriver: true }),
            Animated.timing(poseRotate, { toValue: 0, duration: 900, useNativeDriver: true }),
          ]);
        }

        poseMotion.current.start(({ finished }) => {
          if (finished) {
            setVisualFrame(0);
            setVisualPose("idle");
            finish();
          }
        });
      }, randomDelay(minimum, maximum));
    };

    clearInactivity();
    if (
      !loading &&
      !failedPrompt &&
      !energyVisible &&
      !historyVisible &&
      !inputFocused.current &&
      (visualPose === "idle" || visualPose === "blink")
    ) {
      scheduleReaction(12000, 18000);
    }

    return clearInactivity;
  }, [energyVisible, failedPrompt, float, historyVisible, loading, poseRotate, poseScale, poseTranslateX, visualPose]);

  useEffect(() => {
    if (!loading) {
      Animated.timing(thinkingPulse, {
        toValue: 0,
        duration: 420,
        useNativeDriver: true,
      }).start();
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(thinkingPulse, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(thinkingPulse, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [loading, thinkingPulse]);

  useEffect(() => {
    if (!reply) {
      currentReplyOpacity.setValue(0);
      currentReplyTranslateY.setValue(10);
      return;
    }

    currentReplyOpacity.setValue(0);
    currentReplyTranslateY.setValue(10);
    const animation = Animated.parallel([
      Animated.timing(currentReplyOpacity, {
        toValue: 1,
        duration: 320,
        useNativeDriver: true,
      }),
      Animated.timing(currentReplyTranslateY, {
        toValue: 0,
        duration: 320,
        useNativeDriver: true,
      }),
    ]);

    animation.start();
    return () => animation.stop();
  }, [currentReplyOpacity, currentReplyTranslateY, reply]);

  useEffect(() => {
    const hadCompletedLoading = wasLoading.current;
    wasLoading.current = loading;

    if (
      loading ||
      !hadCompletedLoading ||
      !reply ||
      failedPrompt ||
      reply.quranReferences?.length
    ) {
      return;
    }

    const replyId = `${reply.title}:${reply.body}`;
    if (answerReadyReplyId.current === replyId) return;
    answerReadyReplyId.current = replyId;

    answerReadyAnimation.current?.stop();
    specialAnimationInProgress.current = true;
    poseMotion.current?.stop();
    poseOpacity.stopAnimation();
    answerReadyHalo.stopAnimation();
    poseTranslateX.setValue(0);
    poseRotate.setValue(0);
    poseScale.setValue(1);
    poseOpacity.setValue(1);
    answerReadyHalo.setValue(0);

    answerReadyAnimation.current = Animated.sequence([
      Animated.parallel([
        Animated.timing(poseScale, {
          toValue: 1.015,
          duration: 190,
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: -2,
          duration: 190,
          useNativeDriver: true,
        }),
        Animated.timing(answerReadyHalo, {
          toValue: 1,
          duration: 190,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(100),
      Animated.parallel([
        Animated.timing(poseScale, {
          toValue: 1,
          duration: 210,
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 210,
          useNativeDriver: true,
        }),
        Animated.timing(answerReadyHalo, {
          toValue: 0,
          duration: 210,
          useNativeDriver: true,
        }),
      ]),
    ]);

    answerReadyAnimation.current.start(() => {
      answerReadyAnimation.current = null;
      specialAnimationInProgress.current = false;
      idleCooldownUntil.current = Date.now() + 10000;
      if (!loading && !failedPrompt && visualPose === "idle") {
        poseMotion.current = Animated.loop(
          Animated.sequence([
            Animated.parallel([
              Animated.timing(float, { toValue: -3, duration: 2100, useNativeDriver: true }),
              Animated.timing(poseScale, { toValue: 1.008, duration: 2100, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(float, { toValue: 0, duration: 2100, useNativeDriver: true }),
              Animated.timing(poseScale, { toValue: 1, duration: 2100, useNativeDriver: true }),
            ]),
          ]),
        );
        poseMotion.current.start();
      }
    });

    return () => {
      answerReadyAnimation.current?.stop();
      answerReadyAnimation.current = null;
      specialAnimationInProgress.current = false;
      answerReadyHalo.stopAnimation();
      answerReadyHalo.setValue(0);
    };
  }, [answerReadyHalo, failedPrompt, float, loading, poseScale, reply, visualPose]);

  useEffect(() => {
    if (!failedPrompt) {
      failedReactionOpacity.setValue(1);
      failedReactionTranslateY.setValue(0);
      return;
    }

    failedReactionOpacity.setValue(0);
    failedReactionTranslateY.setValue(5);
    const animation = Animated.parallel([
      Animated.timing(failedReactionOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(failedReactionTranslateY, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]);

    animation.start();
    return () => animation.stop();
  }, [failedPrompt, failedReactionOpacity, failedReactionTranslateY]);

  useEffect(() => {
    const clearPoseTimers = () => {
      if (blinkTimer.current) clearTimeout(blinkTimer.current);
      if (poseTimer.current) clearTimeout(poseTimer.current);
      blinkTimer.current = null;
      poseTimer.current = null;
    };

    const scheduleBlink = () => {
      blinkTimer.current = setTimeout(() => {
        setVisualFrame(0);
        setVisualPose("blink");
        poseTimer.current = setTimeout(() => {
          setVisualPose("idle");
          scheduleBlink();
        }, 160);
      }, 4000 + Math.floor(Math.random() * 4001));
    };

    clearPoseTimers();

    if (failedPrompt) {
      setVisualFrame(0);
      setVisualPose("error");
      return clearPoseTimers;
    }

    if (loading) {
      setVisualFrame(0);
      setVisualPose("thinking");
      return clearPoseTimers;
    }

    const currentQuranReplyId = reply?.quranReferences?.length
      ? `${reply.title}:${reply.body}`
      : "";
    if (
      currentQuranReplyId &&
      processedQuranReplyId.current !== currentQuranReplyId
    ) {
      processedQuranReplyId.current = currentQuranReplyId;
      setVisualFrame(0);
      setVisualPose("reading-quran");
      poseTimer.current = setTimeout(() => {
        setVisualFrame(1);
          poseTimer.current = setTimeout(() => {
            setVisualFrame(0);
            setVisualPose("idle");
            scheduleBlink();
          }, 450);
      }, 450);
      return clearPoseTimers;
    }

    if (!greetingPlayed.current) {
      greetingPlayed.current = true;
      setVisualPose("wave");
      setVisualFrame(0);
      poseTimer.current = setTimeout(() => {
        setVisualPose("idle");
        scheduleBlink();
      }, 2200);
      return clearPoseTimers;
    }

    setVisualFrame(0);
    setVisualPose("idle");
    scheduleBlink();
    return clearPoseTimers;
  }, [failedPrompt, loading, reply]);

  const openRoute = (route: string) => {
    Keyboard.dismiss();
    if (route === ENERGY_ROUTE) {
      void openEnergy();
      return;
    }
    router.push(route as Href);
  };

  const submitPrompt = async (promptOverride?: string) => {
    const trimmedPrompt = (promptOverride ?? prompt).trim();
    if (!trimmedPrompt || loading || submissionInFlight.current) return;
    const session = await getValidSession().catch(() => null);
    if (!session) {
      setIsAuthenticated(false);
      setBalance(null);
      Keyboard.dismiss();
      return;
    }
    setIsAuthenticated(true);

    submissionInFlight.current = true;
    newTurnAnchorY.current = null;
    newTurnScrollDone.current = false;
    setFailedPrompt("");
    setReply(null);

    try {

    const managementPrompt =
      pendingReminderManagement &&
      isWasilReminderManagementFollowUp(
        trimmedPrompt,
        pendingReminderManagement.missing,
      )
        ? `${pendingReminderManagement.prompt} ${trimmedPrompt}`
        : trimmedPrompt;
    if (isWasilReminderManagementIntent(managementPrompt)) {
      Keyboard.dismiss();
      setSubmittedPrompt(managementPrompt);
      setPrompt("");
      setReply(null);
      setLoading(true);
      setPendingReminder(null);
      try {
        const result = await manageWasilReminders(managementPrompt);
        setReply(result.reply);
        setPendingReminderManagement(result.pending ?? null);
        await commitTurn(managementPrompt, result.reply);
      } catch {
        const errorReply: WasilReply = {
          kind: "unsupported-religious",
          title: "Rappels indisponibles",
          body: t("wasil.remindersFailed"),
        };
        setReply(errorReply);
        await commitTurn(managementPrompt, errorReply);
      } finally {
        setLoading(false);
      }
      return;
    }
    if (pendingReminderManagement) setPendingReminderManagement(null);

    const reminderPrompt =
      pendingReminder &&
      isWasilReminderFollowUp(trimmedPrompt, pendingReminder.missing)
        ? `${pendingReminder.prompt} ${trimmedPrompt}`
        : trimmedPrompt;
    const continuedReminder = reminderPrompt !== trimmedPrompt;
    const reminderResolution = resolveWasilReminder(reminderPrompt);
    if (reminderResolution.kind === "clarification") {
      Keyboard.dismiss();
      setSubmittedPrompt(trimmedPrompt);
      setPrompt("");
      setReply(reminderResolution.reply);
      setPendingReminder(reminderResolution.pending);
      await commitTurn(trimmedPrompt, reminderResolution.reply);
      return;
    }
    if (reminderResolution.kind === "ready") {
      Keyboard.dismiss();
      setSubmittedPrompt(continuedReminder ? reminderPrompt : trimmedPrompt);
      setPrompt("");
      setReply(null);
      setLoading(true);
      try {
        const reminderReply = await scheduleWasilReminder(
          reminderResolution.request,
        );
        setReply(reminderReply);
        setPendingReminder(null);
        await commitTurn(reminderPrompt, reminderReply);
      } catch {
        const errorReply: WasilReply = {
          kind: "unsupported-religious",
          title: t("wasil.reminderNotCreated"),
          body: t("wasil.reminderFailed"),
          action: {
            label: "Ouvrir mes notifications",
            route: "/notifications",
          },
        };
        setReply(errorReply);
        await commitTurn(reminderPrompt, errorReply);
      } finally {
        setLoading(false);
      }
      return;
    }
    if (pendingReminder) setPendingReminder(null);

    const goalPrompt =
      pendingGoalAction && isWasilGoalActionFollowUp(trimmedPrompt)
        ? `${pendingGoalAction.prompt} ${trimmedPrompt}`
        : trimmedPrompt;
    if (isWasilGoalActionIntent(goalPrompt)) {
      Keyboard.dismiss();
      setSubmittedPrompt(goalPrompt);
      setPrompt("");
      setReply(null);
      setLoading(true);
      setPendingReminder(null);
      setPendingReminderManagement(null);
      try {
        const result = await manageWasilGoals(goalPrompt);
        setReply(result.reply);
        setPendingGoalAction(result.pending ?? null);
        await commitTurn(goalPrompt, result.reply);
      } catch {
        const errorReply: WasilReply = {
          kind: "unsupported-religious",
          title: "Objectifs indisponibles",
          body: t("wasil.goalsFailed"),
          action: {
            label: "Ouvrir mes objectifs",
            route: "/daily-goals",
          },
        };
        setReply(errorReply);
        await commitTurn(goalPrompt, errorReply);
      } finally {
        setLoading(false);
      }
      return;
    }
    if (pendingGoalAction) setPendingGoalAction(null);

    if (isWasilMemoryIntent(trimmedPrompt)) {
      Keyboard.dismiss();
      setSubmittedPrompt(trimmedPrompt);
      setPrompt("");
      setReply(null);
      setLoading(true);
      setPendingReminder(null);
      setPendingReminderManagement(null);
      setPendingGoalAction(null);
      try {
        const memoryReply = await manageWasilMemory(trimmedPrompt);
        setReply(memoryReply);
        await commitTurn(trimmedPrompt, memoryReply);
      } catch (error) {
        const apiError = error instanceof WasilApiError ? error : null;
        const errorReply: WasilReply = {
          kind: "unsupported-religious",
          title:
            apiError?.code === "AUTH_REQUIRED"
              ? t("wasil.profileRequired")
              : t("wasil.memoryUnavailable"),
          body:
            apiError?.message ??
            t("wasil.memoryFailed"),
          action:
            apiError?.code === "AUTH_REQUIRED"
              ? { label: t("wasil.openProfile"), route: "/profile" }
              : undefined,
        };
        setReply(errorReply);
        await commitTurn(trimmedPrompt, errorReply);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (asksForNearbyHalalPlace(trimmedPrompt)) {
      Keyboard.dismiss();
      setSubmittedPrompt(trimmedPrompt);
      setPrompt("");
      setReply(null);
      setLoading(true);
      try {
        const halalContext = await resolveWasilHalalContext(trimmedPrompt).catch(() => undefined);
        const halalReply = buildNearbyHalalLocalReply(t, halalContext);
        setReply(halalReply);
        setFailedPrompt("");
        setLastMisunderstoodPrompt("");
        await commitTurn(trimmedPrompt, halalReply);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (asksForNearbyMosque(trimmedPrompt)) {
      Keyboard.dismiss();
      setSubmittedPrompt(trimmedPrompt);
      setPrompt("");
      setReply(null);
      setLoading(true);
      try {
        const locationContext = await resolveWasilLocationContext(trimmedPrompt).catch(
          () => undefined,
        );
        const nearbyReply = buildNearbyMosqueLocalReply(t, locationContext);
        setReply(nearbyReply);
        setFailedPrompt("");
        setLastMisunderstoodPrompt("");
        await commitTurn(trimmedPrompt, nearbyReply);
      } finally {
        setLoading(false);
      }
      return;
    }

    const freeAction = resolveWasilFreeAction(trimmedPrompt, reciters);
    if (freeAction) {
      if (freeAction.reciterId) {
        const selectedReciter = reciters.find(
          (reciter) => reciter.id === freeAction.reciterId,
        );
        if (selectedReciter) {
          void setCurrentReciter(selectedReciter).catch(() => undefined);
        }
      }
      openRoute(freeAction.href);
      return;
    }

    Keyboard.dismiss();
    setSubmittedPrompt(trimmedPrompt);
    setPrompt("");
    const localContext = getWasilLocalReply(trimmedPrompt);

    setReply(null);
    setLoading(true);
    const clearStream = () => {
      if (streamFlushTimer.current) clearTimeout(streamFlushTimer.current);
      streamFlushTimer.current = null;
      streamBuffer.current = "";
      setStreamingText("");
    };
    clearStream();
    try {
      const locationContext = await resolveWasilLocationContext(trimmedPrompt).catch(
        () => undefined,
      );
      const isClarificationFollowUp = Boolean(lastMisunderstoodPrompt);
      const response = await askWasil(
        buildNearbyMosqueQuestion(trimmedPrompt, locationContext),
        localContext,
        "standard",
        lastMisunderstoodPrompt || undefined,
        activeMessages.current.map((message) => ({
          role: message.role,
          content: message.text,
        })),
        locationContext,
        {
          onDelta: (text) => {
            streamBuffer.current += text;
            // Batch small deltas into one render every 50 ms.
            if (streamFlushTimer.current) return;
            streamFlushTimer.current = setTimeout(() => {
              streamFlushTimer.current = null;
              setStreamingText(streamBuffer.current);
            }, 50);
          },
          onReset: clearStream,
          onStage: (name) => {
            if (name === "web_search") setLoadingStatus(t("wasil.loadingSources"));
          },
        },
        language,
      );
      clearStream();
      setReply(response.reply);
      setFailedPrompt("");
      setBalance(response.balance);
      if (
        response.classification === "clarification" &&
        !isClarificationFollowUp
      ) {
        // Grant one free message only: the next reply to Wasil's clarification.
        setLastMisunderstoodPrompt(trimmedPrompt);
      } else {
        // Consume the free clarification turn immediately. A second clarification
        // does not open another free message.
        setLastMisunderstoodPrompt("");
      }
      await commitTurn(trimmedPrompt, response.reply);
    } catch (error) {
      clearStream();
      const apiError = error instanceof WasilApiError ? error : null;
      const outOfEnergy = apiError?.code === "INSUFFICIENT_CREDITS";
      const balanceLeft = typeof apiError?.balance === "number" ? apiError.balance : outOfEnergy ? 0 : null;
      if (balanceLeft !== null) setBalance(balanceLeft);
      setEnergyBlockedAt(outOfEnergy ? balanceLeft ?? 0 : null);
      const errorReply: WasilReply = {
        kind: "unsupported-religious",
        title:
          apiError?.code === "AUTH_REQUIRED"
            ? t("wasil.profileRequired")
            : outOfEnergy
              ? balanceLeft
                ? t("wasil.lowEnergyTitle")
                : t("wasil.noEnergyTitle")
              : t("wasil.unavailable"),
        body: outOfEnergy
          ? balanceLeft
            ? t("wasil.lowEnergyBody")
            : t("wasil.noEnergyBody")
          : language === "fr" && apiError?.message
            ? apiError.message
            : t("wasil.retryNoCredit"),
        action:
          apiError?.code === "AUTH_REQUIRED"
            ? { label: t("wasil.openProfile"), route: "/profile" }
            : outOfEnergy
              ? { label: t("wasil.noEnergyAction"), route: ENERGY_ROUTE }
              : undefined,
      };
      setReply(errorReply);
      setFailedPrompt(trimmedPrompt);
    } finally {
      setLoading(false);
    }
    } finally {
      submissionInFlight.current = false;
    }
  };

  const retryFailedPrompt = async () => {
    if (!failedPrompt || loading || retryInFlight.current) return;
    const question = failedPrompt;
    retryInFlight.current = true;
    setFailedPrompt("");
    try {
      await submitPrompt(question);
    } finally {
      retryInFlight.current = false;
    }
  };

  useEffect(() => {
    const incomingPrompt = getSingleParam(contextualPrompt).trim();
    const shouldAutoSubmit = getSingleParam(autoSubmit) === "1";
    const incomingRequestKey = getSingleParam(requestKey) || incomingPrompt;
    if (
      !shouldAutoSubmit ||
      !incomingPrompt ||
      autoSubmittedPrompt.current === incomingRequestKey
    ) {
      return;
    }

    autoSubmittedPrompt.current = incomingRequestKey;
    setPrompt(incomingPrompt);
    void submitPrompt(incomingPrompt);
  }, [autoSubmit, contextualPrompt, requestKey]);

  const openHistory = () => {
    void ensureConversationsLoaded().then(setConversations);
    setHistoryVisible(true);
  };

  const restoreConversation = (conversation: WasilConversationThread) => {
    if (loading || deletingConversationIdRef.current) return;
    activeConversationId.current = conversation.id;
    activeMessages.current = conversation.messages;
    setMessages(conversation.messages);
    setSubmittedPrompt("");
    setReply(null);
    setFailedPrompt("");
    setLastMisunderstoodPrompt("");
    setPendingReminder(null);
    setPendingReminderManagement(null);
    setPendingGoalAction(null);
    setHistoryVisible(false);
    scrollToLatestMessage();
  };

  const deleteConversation = async (
    conversation: WasilConversationThread,
  ) => {
    const conversationId = conversation.id.trim();
    if (
      !conversationId ||
      loading ||
      deletingConversationIdRef.current
    ) {
      return;
    }

    deletingConversationIdRef.current = conversationId;
    setDeletingConversationId(conversationId);
    try {
      await deleteWasilConversation(conversationId);
      const nextConversations = storedConversations.current.filter(
        (item) => item.id !== conversationId,
      );
      await saveWasilConversations(nextConversations);
      storedConversations.current = nextConversations;
      setConversations(nextConversations);

      if (activeConversationId.current === conversationId) {
        startNewConversation();
      }
    } catch (error) {
      Alert.alert(
        t("wasil.deletionFailed"),
        language === "fr" && error instanceof Error
          ? error.message
          : t("wasil.conversationDeletionFailed"),
      );
    } finally {
      deletingConversationIdRef.current = "";
      setDeletingConversationId("");
    }
  };

  const confirmConversationDeletion = (
    conversation: WasilConversationThread,
  ) => {
    if (!conversation.id.trim() || loading || deletingConversationIdRef.current) {
      return;
    }
    Alert.alert(
      t("wasil.deleteConversationQuestion"),
      t("wasil.deletionPermanent"),
      [
        { text: t("wasil.cancel"), style: "cancel" },
        {
          text: t("wasil.delete"),
          style: "destructive",
          onPress: () => void deleteConversation(conversation),
        },
      ],
    );
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <LinearGradient
        pointerEvents="none"
        colors={["#080713", "#140B20", "#080713"]}
        locations={[0, 0.48, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={styles.ambientGlow} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityLabel={t("common.back")}
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.headerButton,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="arrow-back" size={21} color={colors.goldLight} />
          </Pressable>

          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>Wasil</Text>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>{t("wasil.oummahCompanion")}</Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              accessibilityLabel={t("wasil.newConversationWithWasil")}
              accessibilityRole="button"
              disabled={loading}
              onPress={startNewConversation}
              style={({ pressed }) => [
                styles.newConversationButton,
                loading && styles.headerActionDisabled,
                pressed && !loading && styles.pressed,
              ]}
            >
              <Ionicons
                name="create-outline"
                size={18}
                color={colors.goldLight}
              />
            </Pressable>
            <Pressable
              accessibilityLabel={t("wasil.previousConversations")}
              onPress={openHistory}
              style={({ pressed }) => [
                styles.historyButton,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name="time-outline"
                size={18}
                color={colors.goldLight}
              />
            </Pressable>
            {!isAuthenticated || balance === null ? null : (
              <View style={[styles.creditPill, { borderColor: `${energyTone(balance)}66` }]}>
                <Ionicons name="sparkles" size={11} color={energyTone(balance)} />
                <Text style={[styles.creditText, { color: energyTone(balance) }]}>{balance}</Text>
                <Pressable
                  accessibilityLabel={t("wasil.buyEnergy")}
                  accessibilityRole="button"
                  hitSlop={6}
                  onPress={() => void openEnergy()}
                  style={({ pressed }) => [
                    styles.energyAddButton,
                    { backgroundColor: energyTone(balance) },
                    pressed && styles.energyAddButtonPressed,
                  ]}
                >
                  <Text style={styles.energyAddText}>+</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>

        <ScrollView
          ref={conversationScrollRef}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={[
            styles.conversationScroll,
            isAuthenticated &&
              !hasActiveConversation &&
              styles.conversationScrollCompact,
          ]}
        >
          <View style={styles.hero}>
            <LinearGradient
              colors={[
                "rgba(91,45,115,0.46)",
                "rgba(33,19,49,0.86)",
                "rgba(14,10,27,0.96)",
              ]}
              locations={[0, 0.44, 1]}
              style={StyleSheet.absoluteFill}
            />
            <View pointerEvents="none" style={styles.heroGlow} />
            <View pointerEvents="none" style={styles.heroShine} />

            <View style={styles.heroCopy}>
              <View style={styles.wasilPill}>
                <Ionicons name="sparkles" size={13} color={colors.goldLight} />
                <Text style={styles.wasilPillText}>WASIL</Text>
              </View>
              <Text style={styles.heroTitle}>{wasilGreeting}</Text>
              <Text style={styles.heroText}>{t("wasil.helpText")}</Text>
            </View>

            <Animated.View
              pointerEvents="none"
              style={[
                styles.mascotWrap,
                {
                  transform: [
                    { translateX: poseTranslateX },
                    { translateY: float },
                    {
                      rotate: poseRotate.interpolate({
                        inputRange: [-1.5, 1.5],
                        outputRange: ["-1.5deg", "1.5deg"],
                      }),
                    },
                    { scale: poseScale },
                  ],
                },
              ]}
            >
              <Animated.View
                style={[
                  styles.mascotHalo,
                  {
                    opacity: Animated.add(
                      thinkingPulse.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.82, 1],
                      }),
                      answerReadyHalo.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 0.16],
                      }),
                    ),
                    transform: [
                      {
                        scale: thinkingPulse.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.16],
                        }),
                      },
                    ],
                  },
                ]}
              />
              <Animated.Image
                source={getWasilPoseSource(loadingVisualPose ?? visualPose, visualFrame)}
                resizeMode="contain"
                style={[styles.mascot, { opacity: poseOpacity }]}
              />
            </Animated.View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: noticeExpanded }}
            accessibilityLabel={t("wasil.about")}
            onPress={() => setNoticeExpanded((expanded) => !expanded)}
            style={({ pressed }) => [styles.aiNotice, pressed && styles.pressed]}
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={16}
              color={colors.goldLight}
              style={styles.aiNoticeIcon}
            />
            <View style={styles.aiNoticeCopy}>
              <Text style={styles.aiNoticeText}>
                {t("wasil.noticeShort")}{" "}
                <Text style={styles.aiNoticeLink}>
                  {noticeExpanded ? t("wasil.noticeLess") : t("wasil.noticeMore")}
                </Text>
              </Text>
              {noticeExpanded ? (
                <>
                  <Text style={styles.aiNoticeDetail}>{t("wasil.aiNotice")}</Text>
                  <Text style={styles.aiNoticeDetail}>{t("wasil.scopeNotice")}</Text>
                </>
              ) : null}
            </View>
          </Pressable>

          {isAuthenticated && !hasActiveConversation ? (
            <View style={styles.starterList}>
              <Text style={styles.starterTitle}>{t("wasil.tryAsking")}</Text>
              {WASIL_QUESTION_EXAMPLE_KEYS.map((key) => (
                <Pressable
                  key={key}
                  accessibilityRole="button"
                  onPress={() => setPrompt(t(key))}
                  style={({ pressed }) => [
                    styles.starterItem,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text numberOfLines={2} style={styles.starterText}>
                    {t(key)}
                  </Text>
                  <Ionicons name="arrow-up" size={15} color={colors.goldLight} />
                </Pressable>
              ))}
            </View>
          ) : null}

          {hasActiveConversation ? (
            <View style={styles.previewConversation}>
              {messages.map((message) => {
                if (message.role === "user") {
                  return (
                    <View key={message.id} style={styles.userMessage}>
                      <Text style={styles.messageAuthor}>{t("wasil.you")}</Text>
                      <Text style={styles.userMessageText}>{message.text}</Text>
                    </View>
                  );
                }

                const savedReply = message.reply;
                return (
                  <View key={message.id} style={styles.wasilMessage}>
                    <View style={styles.wasilMessageHeader}>
                      <View style={styles.wasilMessageIcon}>
                        <Ionicons
                          name="sparkles"
                          size={14}
                          color={colors.goldLight}
                        />
                      </View>
                      <Text style={styles.messageAuthor}>Wasil</Text>
                    </View>
                    {savedReply ? (
                      <>
                        <Text style={styles.wasilMessageTitle}>
                          {savedReply.title}
                        </Text>
                        <WasilAnswerPresentation answer={savedReply} />
                      </>
                    ) : (
                      <Text style={styles.wasilMessageText}>
                        {message.text}
                      </Text>
                    )}
                    {savedReply?.action ? (
                      <Pressable
                        onPress={() => openRoute(savedReply.action!.route)}
                        style={({ pressed }) => [
                          styles.replyAction,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text style={styles.replyActionText}>
                          {savedReply.action.label}
                        </Text>
                        <Ionicons
                          name="arrow-forward"
                          size={15}
                          color="#17111C"
                        />
                      </Pressable>
                    ) : null}
                  </View>
                );
              })}

              {submittedPrompt && (reply || loading) ? (
                <View
                  style={styles.userMessage}
                  onLayout={(event) =>
                    scrollToNewTurnAnchor(event.nativeEvent.layout.y)
                  }
                >
                  <Text style={styles.messageAuthor}>{t("wasil.you")}</Text>
                  <Text style={styles.userMessageText}>{submittedPrompt}</Text>
                </View>
              ) : null}

              {loading && streamingDisplayText(streamingText) ? (
                <View style={styles.wasilMessage}>
                  <View style={styles.wasilMessageHeader}>
                    <View style={styles.wasilMessageIcon}>
                      <Ionicons
                        name="sparkles"
                        size={14}
                        color={colors.goldLight}
                      />
                    </View>
                    <Text style={styles.messageAuthor}>Wasil</Text>
                    <ActivityIndicator
                      size="small"
                      color={colors.goldLight}
                      style={styles.wasilStreamingIndicator}
                    />
                  </View>
                  {renderWasilBody(streamingDisplayText(streamingText))}
                </View>
              ) : loading ? (
                <View style={styles.wasilLoading}>
                  <ActivityIndicator size="small" color={colors.goldLight} />
                  <Text style={styles.wasilLoadingText}>
                    {loadingStatus}
                  </Text>
                </View>
              ) : reply ? (
                <Animated.View
                  style={[
                    styles.wasilMessage,
                    failedPrompt && styles.wasilErrorMessage,
                    {
                      opacity: Animated.multiply(
                        currentReplyOpacity,
                        failedReactionOpacity,
                      ),
                      transform: [
                        { translateY: currentReplyTranslateY },
                        { translateY: failedReactionTranslateY },
                      ],
                    },
                  ]}
                >
                  <View style={styles.wasilMessageHeader}>
                    <View style={styles.wasilMessageIcon}>
                      <Ionicons
                        name="sparkles"
                        size={14}
                        color={colors.goldLight}
                      />
                    </View>
                    <Text style={styles.messageAuthor}>Wasil</Text>
                  </View>
                  <Text style={styles.wasilMessageTitle}>
                    {reply.title}
                  </Text>
                  <WasilAnswerPresentation answer={reply} />
                  {failedPrompt && (energyBlockedAt === null || (balance ?? 0) > energyBlockedAt) ? (
                    <Pressable
                      accessibilityRole="button"
                      disabled={loading}
                      onPress={() => void retryFailedPrompt()}
                      style={({ pressed }) => [
                        styles.retryAction,
                        pressed && !loading && styles.pressed,
                      ]}
                    >
                      <Ionicons
                        name="refresh"
                        size={14}
                        color={colors.goldLight}
                      />
                      <Text style={styles.retryActionText}>{t("wasil.retry")}</Text>
                    </Pressable>
                  ) : null}
                  {reply.action ? (
                    <Pressable
                      onPress={() => openRoute(reply.action!.route)}
                      style={({ pressed }) => [
                        styles.replyAction,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text style={styles.replyActionText}>
                        {reply.action.label}
                      </Text>
                      <Ionicons
                        name="arrow-forward"
                        size={15}
                        color="#17111C"
                      />
                    </Pressable>
                  ) : null}
                </Animated.View>
              ) : null}
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.composerWrap}>
          {!isAuthenticated ? (
            <Pressable
              onPress={() => router.push('/profile')}
              style={({ pressed }) => [styles.guestWasilCard, pressed && styles.pressed]}
            >
              <View style={styles.guestWasilIcon}>
                <Ionicons name="person-add-outline" size={22} color="#16111B" />
              </View>
              <View style={styles.guestWasilCopy}>
                <Text style={styles.guestWasilTitle}>{t("wasil.signUpFree")}</Text>
                <Text style={styles.guestWasilText}>{`${t("home.wasilTrustVerse")} ${t("wasil.guestInviteCredits")}`}</Text>
                <Text style={styles.guestWasilLink}>{t("wasil.createProfile")}</Text>
              </View>
            </Pressable>
          ) : (
          <View style={styles.composer}>
            <TextInput
              accessibilityLabel={t("home.writeWasilQuestion")}
              blurOnSubmit={false}
              multiline
              onBlur={() => {
                inputFocused.current = false;
              }}
              onChangeText={(value) => {
                inputFocused.current = true;
                setPrompt(value);
              }}
              onFocus={() => {
                inputFocused.current = true;
              }}
              onSubmitEditing={() => void submitPrompt()}
              placeholder={t("home.askWasil")}
              placeholderTextColor={colors.textMuted}
              returnKeyType="send"
              style={styles.input}
              value={prompt}
            />
            <Pressable
              accessibilityLabel={t("home.sendToWasil")}
              disabled={!prompt.trim() || loading}
              onPress={() => {
                console.log("[WASIL_SEND_PRESS]");
                void submitPrompt();
              }}
              style={({ pressed }) => [
                styles.sendButton,
                (!prompt.trim() || loading) && styles.sendButtonDisabled,
                pressed &&
                  prompt.trim() &&
                  !loading &&
                  styles.sendButtonPressed,
              ]}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#16111B" />
              ) : (
                <Ionicons name="navigate" size={21} color="#16111B" />
              )}
            </Pressable>
          </View>
          )}
          {isAuthenticated && hasActiveConversation ? (
            <View style={styles.questionExamples}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: examplesExpanded }}
                onPress={() => setExamplesExpanded((expanded) => !expanded)}
                style={({ pressed }) => [
                  styles.questionExamplesToggle,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.questionExamplesTitle}>
                  {t("wasil.questionExamples")}
                </Text>
                <Ionicons
                  name={examplesExpanded ? "chevron-up" : "chevron-down"}
                  size={15}
                  color={colors.goldLight}
                />
              </Pressable>
              {examplesExpanded ? (
                <View style={styles.questionExamplesList}>
                  {WASIL_QUESTION_EXAMPLE_KEYS.map((key) => (
                    <Pressable
                      key={key}
                      onPress={() => {
                        setPrompt(t(key));
                        setExamplesExpanded(false);
                      }}
                      style={({ pressed }) => [
                        styles.questionExampleItem,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text style={styles.questionExampleText}>{t(key)}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      </KeyboardAvoidingView>

      <Modal
        animationType="slide"
        onRequestClose={() => setHistoryVisible(false)}
        transparent
        visible={historyVisible}
      >
        <Pressable
          onPress={() => setHistoryVisible(false)}
          style={styles.historyBackdrop}
        >
          <Pressable
            onPress={(event) => event.stopPropagation()}
            style={styles.historySheet}
          >
            <View style={styles.historyHandle} />
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>{t("wasil.conversations")}</Text>
              <Pressable
                accessibilityLabel={t("wasil.closeHistory")}
                onPress={() => setHistoryVisible(false)}
                style={styles.historyClose}
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Pressable
                disabled={loading || Boolean(deletingConversationId)}
                onPress={startNewConversation}
                style={({ pressed }) => [
                  styles.historyItem,
                  (loading || Boolean(deletingConversationId)) &&
                    styles.historyItemDisabled,
                  pressed &&
                    !loading &&
                    !deletingConversationId &&
                    styles.pressed,
                ]}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={18}
                  color={colors.goldLight}
                />
                <View style={styles.historyItemCopy}>
                  <Text style={styles.historyQuestion}>
                    {t("wasil.newConversation")}
                  </Text>
                  <Text style={styles.historyAnswer}>
                    {t("wasil.startNewExchange")}
                  </Text>
                </View>
              </Pressable>
              {conversations.length === 0 ? (
                <Text style={styles.historyEmpty}>
                  {t("wasil.historyEmpty")}
                </Text>
              ) : (
                conversations.map((conversation) => (
                  <Pressable
                    key={conversation.id}
                    disabled={loading || Boolean(deletingConversationId)}
                    onPress={() => restoreConversation(conversation)}
                    style={({ pressed }) => [
                      styles.historyItem,
                      (loading || Boolean(deletingConversationId)) &&
                        styles.historyItemDisabled,
                      pressed &&
                        !loading &&
                        !deletingConversationId &&
                        styles.pressed,
                    ]}
                  >
                    <Ionicons
                      name="chatbubble-outline"
                      size={17}
                      color={colors.goldLight}
                    />
                    <View style={styles.historyItemCopy}>
                      <Text numberOfLines={1} style={styles.historyQuestion}>
                        {conversation.title}
                      </Text>
                      <Text numberOfLines={1} style={styles.historyAnswer}>
                        {getLastAssistantTitle(conversation, t("wasil.conversationWithWasil"))}
                      </Text>
                    </View>
                    <Pressable
                      accessibilityLabel={t("wasil.deleteConversation", { title: conversation.title })}
                      disabled={loading || Boolean(deletingConversationId)}
                      hitSlop={8}
                      onPress={(event) => {
                        event.stopPropagation();
                        confirmConversationDeletion(conversation);
                      }}
                      style={({ pressed }) => [
                        styles.historyDelete,
                        pressed &&
                          !loading &&
                          !deletingConversationId &&
                          styles.pressed,
                      ]}
                    >
                      {deletingConversationId === conversation.id ? (
                        <ActivityIndicator size="small" color={colors.danger} />
                      ) : (
                        <Ionicons
                          name="trash-outline"
                          size={17}
                          color={colors.danger}
                        />
                      )}
                    </Pressable>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={colors.textMuted}
                    />
                  </Pressable>
                ))
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        animationType="slide"
        onRequestClose={() => setEnergyVisible(false)}
        transparent
        visible={energyVisible}
      >
        <View style={styles.energyBackdrop}>
          <Pressable
            accessibilityLabel={t("wasil.energyClose")}
            onPress={() => setEnergyVisible(false)}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.energySheet}>
            <ScrollView
              alwaysBounceVertical
              bounces
              contentContainerStyle={styles.energyScrollContent}
              decelerationRate="normal"
              directionalLockEnabled
              nestedScrollEnabled
              overScrollMode="always"
              scrollEventThrottle={16}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.energyHandle} />
              <View style={styles.energyHero}>
                <View style={styles.energyHeroGlow} />
                <View style={styles.energyHeroGlowSecondary} />
                <Image
                  source={require("../../assets/images/home/dalil-mascot.png")}
                  resizeMode="contain"
                  style={styles.energyMascot}
                />
                <View style={styles.energyHeader}>
                  <View style={styles.energyHeaderCopy}>
                  <View style={styles.energyEyebrow}>
                    <Ionicons name="flash" size={13} color={colors.goldLight} />
                    <Text style={styles.energyEyebrowText}>WASIL PREMIUM</Text>
                  </View>
                  <Text style={styles.energyTitle}>{t("wasil.energyTitle")}</Text>
                  <Text style={styles.energySubtitle}>
                    {t("wasil.energySubtitle")}
                  </Text>
                  </View>
                  <Pressable
                    accessibilityLabel={t("wasil.energyClose")}
                    hitSlop={8}
                    onPress={() => setEnergyVisible(false)}
                    style={styles.energyClose}
                  >
                    <Ionicons name="close" size={20} color={colors.text} />
                  </Pressable>
                </View>
              </View>
              <View style={styles.energyBalanceCard}>
                <View style={styles.energyBalanceValueWrap}>
                  <Ionicons name="flash" size={26} color={colors.goldLight} />
                  <Text style={styles.energyBalanceValue}>{balance ?? "—"}</Text>
                </View>
                <Text style={styles.energyBalanceLabel}>{t("wasil.energyAvailable")}</Text>
                <Text style={styles.energyBalanceHint}>
                  {t("wasil.energyPerExchange")}
                </Text>
              </View>
              <Text style={styles.energyPackPrompt}>
                {t("wasil.energyChoosePack")}
              </Text>
              {energyLoading ? (
                <ActivityIndicator color={colors.goldLight} style={styles.energyLoader} />
              ) : energyPacks.length === 0 ? (
                <Text style={styles.energyFeedback}>
                  {energyFeedback ?? t("wasil.energyPacksUnavailable")}
                </Text>
              ) : (
                <View style={styles.energyPackList}>
                  {energyPacks.map((pack) => {
                    const energyCount = pack.identifier.replace("energy_", "");
                    const isPopular = pack.identifier === "energy_75";
                    const isBestValue = pack.identifier === "energy_400";
                    return (
                      <View
                        key={pack.identifier}
                        style={[
                          styles.energyPackRow,
                          (isPopular || isBestValue) && styles.energyPackFeatured,
                          isBestValue && styles.energyPackBestValue,
                        ]}
                      >
                        {(isPopular || isBestValue) ? (
                          <View style={styles.energyBadge}>
                            <Text style={styles.energyBadgeText}>
                              {isPopular ? t("wasil.energyPopular") : t("wasil.energyBestValue")}
                            </Text>
                          </View>
                        ) : null}
                        <View style={styles.energyPackIcon}>
                          <Ionicons name="flash" size={19} color={colors.goldLight} />
                        </View>
                        <View style={styles.energyPackCopy}>
                          <Text style={styles.energyPackTitle}>{t("wasil.energyPackTitle", { count: energyCount })}</Text>
                          <Text style={styles.energyPackPrice}>
                            {(
                              pack.revenueCatPackage.product as typeof pack.revenueCatPackage.product & {
                                localizedPrice?: string;
                              }
                            ).localizedPrice ?? pack.price}
                          </Text>
                        </View>
                        <Pressable
                          accessibilityLabel={t("wasil.energyBuyPack", { count: energyCount })}
                          disabled={Boolean(energyPurchaseId)}
                          onPress={() => void purchaseEnergy(pack)}
                          style={({ pressed }) => [
                            styles.energyBuyButton,
                            Boolean(energyPurchaseId) && styles.energyDisabled,
                            pressed && !energyPurchaseId && styles.pressed,
                          ]}
                        >
                          {energyPurchaseId === pack.identifier ? (
                            <ActivityIndicator color="#16111B" size="small" />
                          ) : (
                            <Text style={styles.energyBuyText}>{t("wasil.energyBuy")}</Text>
                          )}
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              )}
              {energyFeedback && energyPacks.length > 0 ? (
                <Text style={styles.energyFeedback}>{energyFeedback}</Text>
              ) : null}
              <View style={styles.energyInfoCard}>
                <View style={styles.energyInfoIcon}>
                  <Ionicons name="sparkles-outline" size={18} color={colors.goldLight} />
                </View>
                <Text style={styles.energyInfoTitle}>{t("wasil.energyWhyTitle")}</Text>
                <Text style={styles.energyInfoIntro}>
                  {t("wasil.energyWhyIntro")}
                </Text>
                <View style={styles.energyInfoList}>
                  {ENERGY_FACT_KEYS.map((key) => t(key)).map((item) => (
                    <View key={item} style={styles.energyInfoRow}>
                      <Ionicons name="checkmark-circle" size={16} color={colors.goldLight} />
                      <Text style={styles.energyInfoText}>{item}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.energyReassurance}>
                  <Ionicons name="shield-checkmark-outline" size={16} color={colors.goldLight} />
                  <Text style={styles.energyReassuranceText}>
                    {t("wasil.energyNoExpiry")}
                  </Text>
                </View>
                <Text style={styles.energyTrustLine}>
                  {t("wasil.energySecurePayment")}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                disabled={Boolean(energyPurchaseId)}
                onPress={() => void refreshEnergy()}
                style={({ pressed }) => [
                  styles.energyRefreshButton,
                  pressed && !energyPurchaseId && styles.pressed,
                ]}
              >
                <Ionicons name="refresh" size={15} color={colors.goldLight} />
                <Text style={styles.energyRefreshText}>{t("wasil.energyRefresh")}</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  ambientGlow: {
    position: "absolute",
    top: 70,
    right: -110,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(90,43,115,0.14)",
  },
  header: {
    height: 62,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.28)",
    backgroundColor: "rgba(23,16,38,0.82)",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 7,
  },
  newConversationButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.36)",
    backgroundColor: "rgba(227,181,90,0.10)",
  },
  headerActionDisabled: {
    opacity: 0.42,
  },
  historyButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.25)",
    backgroundColor: "rgba(23,16,38,0.82)",
  },
  creditPill: {
    minWidth: 40,
    height: 30,
    paddingHorizontal: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.25)",
    backgroundColor: "rgba(23,16,38,0.82)",
  },
  energyAddButton: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.goldLight,
  },
  energyAddButtonPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.92 }],
  },
  energyAddText: {
    color: "#16111B",
    fontFamily: typography.sans,
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 20,
  },
  creditText: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 10,
    fontWeight: "700",
  },
  headerCopy: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    color: colors.text,
    fontFamily: typography.serifSemibold,
    fontSize: 25,
  },
  statusRow: {
    marginTop: -2,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  statusText: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 9,
    letterSpacing: 0.35,
  },
  content: {
    paddingHorizontal: 15,
    paddingBottom: 18,
  },
  conversationScroll: {
    flex: 1,
    flexShrink: 1,
  },
  conversationScrollCompact: {
    flex: 0,
  },
  hero: {
    minHeight: 122,
    marginTop: 4,
    overflow: "hidden",
    borderRadius: 27,
    borderWidth: 1,
    borderColor: "rgba(255,235,210,0.18)",
    backgroundColor: colors.surface,
  },
  heroGlow: {
    position: "absolute",
    top: -52,
    right: -12,
    width: 145,
    height: 145,
    borderRadius: 73,
    backgroundColor: "rgba(227,181,90,0.10)",
  },
  heroShine: {
    position: "absolute",
    top: 0,
    right: 30,
    left: 30,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.42)",
    shadowColor: colors.goldLight,
    shadowOpacity: 0.7,
    shadowRadius: 10,
  },
  heroCopy: {
    zIndex: 2,
    width: "70%",
    paddingTop: 14,
    paddingBottom: 14,
    paddingLeft: 17,
  },
  wasilPill: {
    alignSelf: "flex-start",
    height: 22,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.27)",
    backgroundColor: "rgba(200,148,58,0.10)",
  },
  wasilPillText: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.4,
  },
  heroTitle: {
    marginTop: 8,
    color: colors.text,
    fontFamily: typography.serifSemibold,
    fontSize: 18,
    lineHeight: 22,
  },
  heroText: {
    marginTop: 4,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 11,
    lineHeight: 15,
  },
  mascotWrap: {
    position: "absolute",
    right: 2,
    bottom: -4,
    width: 126,
    height: 148,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  mascotHalo: {
    position: "absolute",
    right: -1,
    bottom: 1,
    width: 126,
    height: 126,
    borderRadius: 63,
    backgroundColor: "rgba(227,181,90,0.18)",
    shadowColor: colors.goldLight,
    shadowOpacity: 0.42,
    shadowRadius: 18,
    elevation: 5,
  },
  mascot: {
    width: 124,
    height: 145,
  },
  previewConversation: {
    marginTop: 18,
    gap: 9,
  },
  aiNotice: {
    marginTop: 10,
    paddingHorizontal: 4,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  aiNoticeIcon: {
    marginTop: 1,
  },
  aiNoticeCopy: {
    flex: 1,
    gap: 6,
  },
  aiNoticeText: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 11,
    lineHeight: 16,
  },
  aiNoticeLink: {
    color: colors.goldLight,
    fontWeight: "700",
  },
  aiNoticeDetail: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 11,
    lineHeight: 16,
  },
  starterList: {
    marginTop: 18,
    gap: 8,
  },
  starterTitle: {
    marginBottom: 2,
    paddingHorizontal: 4,
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  starterItem: {
    minHeight: 50,
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.16)",
    backgroundColor: "rgba(23,16,38,0.62)",
  },
  starterText: {
    flex: 1,
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 13,
    lineHeight: 18,
  },
  userMessage: {
    maxWidth: "88%",
    alignSelf: "flex-end",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 17,
    borderBottomRightRadius: 5,
    backgroundColor: "rgba(90,43,115,0.72)",
  },
  wasilMessage: {
    maxWidth: "92%",
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 17,
    borderBottomLeftRadius: 5,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.17)",
    backgroundColor: "rgba(23,16,38,0.92)",
  },
  wasilErrorMessage: {
    borderColor: "rgba(227,181,90,0.30)",
    backgroundColor: "rgba(42,27,49,0.94)",
  },
  wasilLoading: {
    minHeight: 52,
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.17)",
    backgroundColor: "rgba(23,16,38,0.92)",
  },
  wasilLoadingText: {
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 11,
  },
  wasilMessageHeader: {
    marginBottom: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  wasilStreamingIndicator: {
    marginLeft: "auto",
    transform: [{ scale: 0.8 }],
  },
  wasilMessageIcon: {
    width: 25,
    height: 25,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: "rgba(200,148,58,0.11)",
  },
  messageAuthor: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 9.5,
    fontWeight: "700",
  },
  userMessageText: {
    marginTop: 4,
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 16,
    lineHeight: 24,
  },
  wasilMessageText: {
    marginTop: 6,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 16,
    lineHeight: 24,
  },
  wasilMessageBold: {
    color: colors.text,
    fontWeight: "700",
  },
  wasilMessageParagraph: {
    marginTop: 10,
  },
  wasilMessageTitle: {
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 16,
    fontWeight: "700",
  },
  wasilSources: {
    marginTop: 15,
  },
  wasilSourceDivider: {
    height: 1,
    marginBottom: 12,
    backgroundColor: "rgba(227,181,90,0.18)",
  },
  wasilSourcesTitle: {
    marginBottom: 8,
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 12,
    fontWeight: "700",
  },
  wasilSourceRow: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  wasilSourceCopy: {
    flex: 1,
  },
  wasilSourceLabel: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 14,
  },
  wasilSourceDetail: {
    marginTop: 2,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 12,
    lineHeight: 17,
  },
  wasilSourceHint: {
    marginTop: 4,
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 10,
    fontWeight: "700",
  },
  wasilAnswerFooter: {
    minHeight: 34,
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  wasilVerifiedBadge: {
    minHeight: 30,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.34)",
    backgroundColor: "rgba(227,181,90,0.07)",
  },
  wasilVerifiedText: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 10,
    fontWeight: "700",
  },
  retryAction: {
    alignSelf: "flex-start",
    minHeight: 40,
    marginTop: 10,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.40)",
    backgroundColor: "rgba(227,181,90,0.12)",
    shadowColor: colors.goldLight,
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 2,
  },
  retryActionText: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 10.5,
    fontWeight: "700",
  },
  replyAction: {
    height: 40,
    marginTop: 11,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 13,
    backgroundColor: colors.goldLight,
  },
  replyActionText: {
    color: "#17111C",
    fontFamily: typography.sans,
    fontSize: 10.5,
    fontWeight: "700",
  },
  guestWasilCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 13,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(227,181,90,0.38)',
    backgroundColor: '#181520',
  },
  guestWasilIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    backgroundColor: colors.goldLight,
  },
  guestWasilCopy: { flex: 1 },
  guestWasilTitle: {
    color: colors.goldLight,
    fontFamily: typography.serifMedium,
    fontSize: 15,
  },
  guestWasilText: {
    marginTop: 3,
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 10,
    lineHeight: 14,
  },
  guestWasilLink: {
    marginTop: 5,
    color: '#F5B735',
    fontFamily: typography.sans,
    fontSize: 10,
    fontWeight: '800',
  },
  composerWrap: {
    position: "relative",
    zIndex: 11,
    elevation: 11,
    flexShrink: 0,
    paddingHorizontal: 13,
    paddingTop: 7,
    paddingBottom: Platform.OS === "ios" ? 10 : 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.055)",
    backgroundColor: "rgba(8,7,19,0.97)",
  },
  composer: {
    minHeight: 52,
    maxHeight: 112,
    paddingLeft: 18,
    paddingRight: 8,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "flex-end",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.13)",
    backgroundColor: "rgba(24,20,31,0.96)",
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 96,
    paddingTop: 9,
    paddingBottom: 8,
    paddingRight: 8,
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 16,
    lineHeight: 22,
  },
  sendButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: colors.goldLight,
    shadowColor: colors.goldLight,
    shadowOpacity: 0.48,
    shadowRadius: 9,
  },
  sendButtonDisabled: {
    opacity: 0.34,
    shadowOpacity: 0,
  },
  sendButtonPressed: {
    opacity: 0.68,
    transform: [{ scale: 0.94 }],
  },
  questionExamples: {
    marginTop: 6,
  },
  questionExamplesToggle: {
    minHeight: 38,
    marginTop: 2,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.42)",
    backgroundColor: "rgba(227,181,90,0.12)",
  },
  questionExamplesTitle: {
    flex: 1,
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 12,
    fontWeight: "700",
  },
  questionExamplesList: {
    paddingTop: 2,
    paddingBottom: 3,
  },
  questionExampleItem: {
    marginTop: 3,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.035)",
  },
  questionExampleText: {
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 11,
    lineHeight: 16,
  },
  historyBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.56)",
  },
  historySheet: {
    maxHeight: "66%",
    minHeight: 250,
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 24,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "#120D1C",
  },
  historyHandle: {
    width: 38,
    height: 4,
    alignSelf: "center",
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  historyHeader: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
  },
  historyTitle: {
    flex: 1,
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 18,
    fontWeight: "700",
  },
  historyClose: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  energyBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(4,3,10,0.78)",
  },
  energySheet: {
    maxHeight: "92%",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.20)",
    backgroundColor: "#100B19",
    overflow: "hidden",
  },
  energyScrollContent: {
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  energyHandle: {
    width: 40,
    height: 4,
    alignSelf: "center",
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.24)",
  },
  energyHeader: {
    minHeight: 194,
    marginTop: 10,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  energyHero: {
    minHeight: 236,
    marginTop: 18,
    paddingHorizontal: 18,
    paddingTop: 10,
    overflow: "hidden",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.24)",
    backgroundColor: "#1A1226",
    shadowColor: colors.goldLight,
    shadowOpacity: 0.12,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  energyHeroGlow: {
    position: "absolute",
    top: -84,
    right: -52,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(227,181,90,0.22)",
  },
  energyHeroGlowSecondary: {
    position: "absolute",
    bottom: -110,
    left: -70,
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: "rgba(106,63,155,0.32)",
  },
  energyMascot: {
    position: "absolute",
    right: -12,
    bottom: -16,
    width: 164,
    height: 190,
    opacity: 0.98,
    shadowColor: colors.goldLight,
    shadowOpacity: 0.24,
    shadowRadius: 18,
  },
  energyHeaderCopy: {
    flex: 1,
  },
  energyEyebrow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  energyEyebrowText: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  energyTitle: {
    marginTop: 7,
    color: colors.text,
    fontFamily: typography.serifSemibold,
    fontSize: 26,
  },
  energySubtitle: {
    maxWidth: 310,
    marginTop: 6,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 12.5,
    lineHeight: 18,
  },
  energyClose: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  energyBalanceCard: {
    minHeight: 176,
    marginTop: 20,
    paddingHorizontal: 18,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.22)",
    backgroundColor: "rgba(227,181,90,0.08)",
  },
  energyBalanceLabel: {
    marginTop: 7,
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  energyBalanceHint: {
    maxWidth: 245,
    marginTop: 6,
    textAlign: "center",
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 11.5,
    lineHeight: 17,
  },
  energyPackPrompt: {
    marginTop: 22,
    marginBottom: -5,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 11,
    textAlign: "center",
  },
  energyBalanceValueWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  energyBalanceValue: {
    color: colors.text,
    fontFamily: typography.serifSemibold,
    fontSize: 56,
    lineHeight: 62,
  },
  energyLoader: { marginVertical: 32 },
  energyPackList: { marginTop: 18, gap: 10 },
  energyPackRow: {
    minHeight: 102,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.13)",
    backgroundColor: "rgba(255,255,255,0.045)",
    shadowColor: "#000",
    shadowOpacity: 0.30,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 9 },
    elevation: 6,
  },
  energyPackFeatured: {
    borderColor: "rgba(227,181,90,0.48)",
    backgroundColor: "rgba(227,181,90,0.10)",
    shadowColor: colors.goldLight,
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 6,
  },
  energyPackBestValue: {
    minHeight: 114,
    borderColor: "rgba(246,205,111,0.72)",
    backgroundColor: "rgba(147,93,34,0.24)",
    shadowColor: colors.goldLight,
    shadowOpacity: 0.30,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  energyBadge: {
    position: "absolute",
    top: -10,
    left: 13,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 9,
    backgroundColor: colors.goldLight,
  },
  energyBadgeText: {
    color: "#16111B",
    fontFamily: typography.sans,
    fontSize: 9,
    fontWeight: "800",
  },
  energyPackIcon: {
    width: 48,
    height: 48,
    marginRight: 13,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: "rgba(227,181,90,0.12)",
  },
  energyPackCopy: { flex: 1 },
  energyPackTitle: {
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 17,
    fontWeight: "700",
  },
  energyPackPrice: {
    marginTop: 3,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 13,
  },
  energyBuyButton: {
    minWidth: 94,
    minHeight: 50,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 25,
    shadowColor: colors.goldLight,
    shadowOpacity: 0.25,
    shadowRadius: 9,
    elevation: 3,
    backgroundColor: colors.goldLight,
  },
  energyBuyText: {
    color: "#16111B",
    fontFamily: typography.sans,
    fontSize: 12,
    fontWeight: "800",
  },
  energyDisabled: { opacity: 0.45 },
  energyTrustLine: {
    marginTop: 16,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 10,
    textAlign: "center",
  },
  energyFeedback: {
    marginTop: 16,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 12,
    lineHeight: 17,
  },
  energyInfoCard: {
    marginTop: 22,
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.035)",
  },
  energyInfoIcon: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: "rgba(227,181,90,0.12)",
  },
  energyInfoTitle: {
    marginTop: 12,
    color: colors.text,
    fontFamily: typography.serifSemibold,
    fontSize: 20,
  },
  energyInfoIntro: {
    marginTop: 8,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 12,
    lineHeight: 18,
  },
  energyInfoList: {
    marginTop: 14,
    gap: 11,
  },
  energyInfoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  energyInfoText: {
    flex: 1,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 12,
    lineHeight: 18,
  },
  energyReassurance: {
    marginTop: 14,
    paddingHorizontal: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  energyReassuranceText: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 10.5,
  },
  energyRefreshButton: {
    minHeight: 46,
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.28)",
  },
  energyRefreshText: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 12,
    fontWeight: "700",
  },
  historyEmpty: {
    marginTop: 42,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 14,
    textAlign: "center",
  },
  historyItem: {
    minHeight: 64,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.07)",
  },
  historyItemDisabled: {
    opacity: 0.45,
  },
  historyItemCopy: { flex: 1 },
  historyDelete: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
  },
  historyQuestion: {
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 15,
  },
  historyAnswer: {
    marginTop: 4,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 12,
  },
  pressed: {
    opacity: 0.66,
    transform: [{ scale: 0.985 }],
  },
});
