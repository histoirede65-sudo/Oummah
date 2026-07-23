import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { Href } from "expo-router";
import { router, useLocalSearchParams } from "expo-router";
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
} from "../../features/wasil/WasilApiClient";
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
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
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

type WasilDisplaySource = {
  label: string;
  url?: string;
  verified: boolean;
};

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

function deduplicateSources(sources: WasilDisplaySource[]) {
  const seen = new Set<string>();
  return sources.filter((source) => {
    const key = source.url
      ? `url:${canonicalSourceUrl(source.url)}`
      : `label:${source.label.trim().toLowerCase()}`;
    if (!source.label.trim() || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function titleCaseSlug(value: string) {
  return value
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("-");
}

function markdownSourceLabel(label: string, urlValue: string, body: string) {
  try {
    const url = new URL(urlValue);
    if (url.hostname.replace(/^www\./, "").toLowerCase() === "quran.com") {
      const number = body.match(/\bsourate\s+(\d{1,3})\b/i)?.[1];
      const segments = url.pathname.split("/").filter(Boolean);
      const slug = segments.find(
        (segment) => !/^(?:en|fr|info|surah|chapter|verse|verses)$/i.test(segment),
      );
      if (number && slug && !/^\d+$/.test(slug)) {
        return `Coran, Sourate ${number} – ${titleCaseSlug(slug)}`;
      }
      return "Quran.com";
    }
    return label || url.hostname.replace(/^www\./, "");
  } catch {
    return label || "Référence en ligne";
  }
}

function parseWasilAnswer(answer: WasilReply) {
  const extracted = extractMarkdownLinks(answer.body);
  const rawSources: { label: string; url: string }[] = [];
  const withoutRawUrls = extracted.text.replace(/https?:\/\/[^\s)]+/gi, (url) => {
    rawSources.push({ label: "", url });
    return "";
  });
  const structuredSources: WasilDisplaySource[] = answer.reference
    ? [{
        label: answer.reference,
        url: answer.sourceUrl,
        verified: true,
      }]
    : [];
  const extractedSources = [...extracted.sources, ...rawSources].map(
    (source): WasilDisplaySource => ({
      label: markdownSourceLabel(source.label, source.url, answer.body),
      url: source.url,
      verified: structuredSources.some(
        (structured) =>
          !!structured.url &&
          canonicalSourceUrl(structured.url) === canonicalSourceUrl(source.url),
      ),
    }),
  );
  return {
    body: cleanMarkdownText(withoutRawUrls),
    sources: deduplicateSources([...structuredSources, ...extractedSources]),
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

function renderWasilBody(body: string) {
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

function WasilAnswerPresentation({ answer }: { answer: WasilReply }) {
  const parsed = parseWasilAnswer(answer);
  const hasVerifiedSource = parsed.sources.some((source) => source.verified);

  return (
    <>
      {renderWasilBody(parsed.body)}
      {parsed.sources.length > 0 ? (
        <View style={styles.wasilSources}>
          <View style={styles.wasilSourceDivider} />
          <Text style={styles.wasilSourcesTitle}>Référence</Text>
          {parsed.sources.map((source) => {
            const referenceRoute = getWasilReferenceRoute(source.label);
            const canOpen = !!source.url || !!referenceRoute;
            return (
              <Pressable
                accessibilityRole={canOpen ? "link" : undefined}
                key={source.url ?? source.label}
                onPress={
                  source.url
                    ? () => void Linking.openURL(source.url!)
                    : referenceRoute
                      ? () => router.push(referenceRoute)
                      : undefined
                }
                style={({ pressed }) => [
                  styles.wasilSourceRow,
                  pressed && canOpen && styles.pressed,
                ]}
              >
                <Ionicons
                  name="book-outline"
                  size={15}
                  color={colors.goldLight}
                />
                <Text style={styles.wasilSourceLabel}>{source.label}</Text>
                {canOpen ? (
                  <Ionicons
                    name="open-outline"
                    size={13}
                    color={colors.textMuted}
                  />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}
      <View style={styles.wasilAnswerFooter}>
        {hasVerifiedSource ? (
          <View style={styles.wasilVerifiedBadge}>
            <Ionicons
              name="shield-checkmark-outline"
              size={13}
              color={colors.goldLight}
            />
            <Text style={styles.wasilVerifiedText}>Réponse vérifiée</Text>
          </View>
        ) : (
          <View />
        )}
        <View style={styles.wasilAnswerActions}>
          <Pressable accessibilityLabel="Enregistrer la réponse" disabled>
            <Ionicons
              name="bookmark-outline"
              size={17}
              color={colors.textMuted}
            />
          </Pressable>
          <Pressable accessibilityLabel="Partager la réponse" disabled>
            <Ionicons
              name="share-outline"
              size={17}
              color={colors.textMuted}
            />
          </Pressable>
        </View>
      </View>
    </>
  );
}

function getLastAssistantTitle(conversation: WasilConversationThread) {
  for (let index = conversation.messages.length - 1; index >= 0; index -= 1) {
    const message = conversation.messages[index];
    if (message.role === "assistant") {
      return message.reply?.title ?? message.text;
    }
  }
  return "Conversation avec Wasil";
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
  const [prompt, setPrompt] = useState("");
  const [submittedPrompt, setSubmittedPrompt] = useState("");
  const [reply, setReply] = useState<WasilReply | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [deletingConversationId, setDeletingConversationId] = useState("");
  const [conversations, setConversations] = useState<
    WasilConversationThread[]
  >([]);
  const [messages, setMessages] = useState<WasilConversationMessage[]>([]);
  const [lastMisunderstoodPrompt, setLastMisunderstoodPrompt] = useState("");
  const [failedPrompt, setFailedPrompt] = useState("");
  const [pendingReminder, setPendingReminder] =
    useState<PendingWasilReminder | null>(null);
  const [pendingReminderManagement, setPendingReminderManagement] =
    useState<PendingWasilReminderManagement | null>(null);
  const [pendingGoalAction, setPendingGoalAction] =
    useState<PendingWasilGoalAction | null>(null);
  const float = useRef(new Animated.Value(0)).current;
  const autoSubmittedPrompt = useRef("");
  const retryInFlight = useRef(false);
  const submissionInFlight = useRef(false);
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

  const scrollToLatestMessage = useCallback(() => {
    requestAnimationFrame(() => {
      conversationScrollRef.current?.scrollToEnd({ animated: true });
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
    scrollToLatestMessage();
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
    setSubmittedPrompt("");
    setReply(null);
    setFailedPrompt("");
    setLastMisunderstoodPrompt("");
    setPendingReminder(null);
    setPendingReminderManagement(null);
    setPendingGoalAction(null);
    setHistoryVisible(false);
  };

  useEffect(() => {
    void ensureConversationsLoaded().then(syncConversationsWithCloud);
    getWasilBalance()
      .then(setBalance)
      .catch(() => setBalance(null));
  }, []);

  useEffect(() => {
    const incomingPrompt = getSingleParam(contextualPrompt);
    if (incomingPrompt) setPrompt(incomingPrompt);
  }, [contextualPrompt]);

  useEffect(() => {
    if (submittedPrompt) scrollToLatestMessage();
  }, [reply, scrollToLatestMessage, submittedPrompt]);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: -5,
          duration: 1700,
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 1700,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [float]);

  const openRoute = (route: string) => {
    Keyboard.dismiss();
    router.push(route as Href);
  };

  const submitPrompt = async (promptOverride?: string) => {
    const trimmedPrompt = (promptOverride ?? prompt).trim();
    if (!trimmedPrompt || loading || submissionInFlight.current) return;

    submissionInFlight.current = true;
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
          body: "Wasil n’a pas pu gérer vos rappels. Aucun crédit n’a été utilisé.",
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
          title: "Rappel non créé",
          body: "Wasil n’a pas pu programmer ce rappel. Aucun crédit n’a été utilisé.",
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
          body: "Wasil n’a pas pu adapter vos objectifs. Aucun crédit n’a été utilisé.",
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
              ? "Profil requis"
              : "Mémoire indisponible",
          body:
            apiError?.message ??
            "Wasil n’a pas pu accéder à sa mémoire. Aucun crédit n’a été utilisé.",
          action:
            apiError?.code === "AUTH_REQUIRED"
              ? { label: "Ouvrir mon profil", route: "/profile" }
              : undefined,
        };
        setReply(errorReply);
        await commitTurn(trimmedPrompt, errorReply);
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
    try {
      const response = await askWasil(
        trimmedPrompt,
        localContext,
        "standard",
        lastMisunderstoodPrompt || undefined,
        activeMessages.current.map((message) => ({
          role: message.role,
          content: message.text,
        })),
      );
      setReply(response.reply);
      setFailedPrompt("");
      setBalance(response.balance);
      if (
        response.classification === "out_of_scope" ||
        response.classification === "insufficient_sources" ||
        response.classification === "clarification"
      ) {
        setLastMisunderstoodPrompt(trimmedPrompt);
      } else {
        setLastMisunderstoodPrompt("");
      }
      await commitTurn(trimmedPrompt, response.reply);
    } catch (error) {
      const apiError = error instanceof WasilApiError ? error : null;
      if (typeof apiError?.balance === "number") setBalance(apiError.balance);
      const errorReply: WasilReply = {
        kind: "unsupported-religious",
        title:
          apiError?.code === "AUTH_REQUIRED"
            ? "Profil requis"
            : "Wasil est indisponible",
        body:
          apiError?.message ??
          "Réessayez dans quelques instants. Aucun crédit n’a été consommé.",
        action:
          apiError?.code === "AUTH_REQUIRED"
            ? { label: "Ouvrir mon profil", route: "/profile" }
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
        "Suppression impossible",
        error instanceof Error
          ? error.message
          : "La conversation nâ€™a pas pu Ãªtre supprimÃ©e.",
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
      "Supprimer cette conversation ?",
      "Cette suppression est dÃ©finitive.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
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
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Revenir en arrière"
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
              <Text style={styles.statusText}>Compagnon OUMMAH</Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              accessibilityLabel="Anciennes conversations"
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
            {balance === null ? null : (
              <View style={styles.creditPill}>
                <Ionicons name="sparkles" size={11} color={colors.goldLight} />
                <Text style={styles.creditText}>{balance}</Text>
              </View>
            )}
          </View>
        </View>

        <ScrollView
          ref={conversationScrollRef}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
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
              <Text style={styles.heroTitle}>Que souhaitez-vous faire ?</Text>
              <Text style={styles.heroText}>
                Posez une question religieuse ou demandez à Wasil d’ouvrir un
                espace d’OUMMAH.
              </Text>
            </View>

            <Animated.View
              pointerEvents="none"
              style={[
                styles.mascotWrap,
                { transform: [{ translateY: float }] },
              ]}
            >
              <View style={styles.mascotHalo} />
              <Image
                source={require("../../assets/images/home/dalil-mascot.png")}
                resizeMode="contain"
                style={styles.mascot}
              />
            </Animated.View>
          </View>

          {messages.length > 0 ||
          (submittedPrompt && (reply || loading)) ? (
            <View style={styles.previewConversation}>
              {messages.map((message) => {
                if (message.role === "user") {
                  return (
                    <View key={message.id} style={styles.userMessage}>
                      <Text style={styles.messageAuthor}>Vous</Text>
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
                <View style={styles.userMessage}>
                  <Text style={styles.messageAuthor}>Vous</Text>
                  <Text style={styles.userMessageText}>{submittedPrompt}</Text>
                </View>
              ) : null}

              {loading ? (
                <View style={styles.wasilLoading}>
                  <ActivityIndicator size="small" color={colors.goldLight} />
                  <Text style={styles.wasilLoadingText}>
                    Wasil vérifie les sources…
                  </Text>
                </View>
              ) : reply ? (
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
                  </View>
                  <Text style={styles.wasilMessageTitle}>{reply.title}</Text>
                  <WasilAnswerPresentation answer={reply} />
                  {failedPrompt ? (
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
                      <Text style={styles.retryActionText}>RÃ©essayer</Text>
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
                </View>
              ) : null}
            </View>
          ) : null}

          <View style={styles.scopeNotice}>
            <Ionicons
              name="shield-checkmark-outline"
              size={18}
              color={colors.goldLight}
            />
            <Text style={styles.scopeNoticeText}>
              Wasil répond uniquement aux questions religieuses et s’appuie sur
              des références vérifiées lorsqu’elles sont disponibles.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.composerWrap}>
          <View style={styles.composer}>
            <TextInput
              accessibilityLabel="Écrire à Wasil"
              blurOnSubmit={false}
              multiline
              onChangeText={setPrompt}
              onSubmitEditing={() => void submitPrompt()}
              placeholder="Demandez quelque chose à Wasil…"
              placeholderTextColor={colors.textMuted}
              returnKeyType="send"
              style={styles.input}
              value={prompt}
            />
            <Pressable
              accessibilityLabel="Envoyer à Wasil"
              disabled={!prompt.trim() || loading}
              onPress={() => void submitPrompt()}
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
              <Text style={styles.historyTitle}>Conversations</Text>
              <Pressable
                accessibilityLabel="Fermer l’historique"
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
                    Nouvelle conversation
                  </Text>
                  <Text style={styles.historyAnswer}>
                    Commencer un nouvel échange avec Wasil
                  </Text>
                </View>
              </Pressable>
              {conversations.length === 0 ? (
                <Text style={styles.historyEmpty}>
                  Vos anciennes conversations apparaîtront ici.
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
                        {getLastAssistantTitle(conversation)}
                      </Text>
                    </View>
                    <Pressable
                      accessibilityLabel={`Supprimer la conversation ${conversation.title}`}
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
    right: -2,
    bottom: -4,
    width: 105,
    height: 124,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  mascotHalo: {
    position: "absolute",
    right: 5,
    bottom: 9,
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(227,181,90,0.08)",
  },
  mascot: {
    width: 102,
    height: 119,
  },
  previewConversation: {
    marginTop: 18,
    gap: 9,
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
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  wasilSourceLabel: {
    flex: 1,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 12,
    lineHeight: 17,
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
  wasilAnswerActions: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  retryAction: {
    alignSelf: "flex-start",
    minHeight: 34,
    marginTop: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.28)",
    backgroundColor: "rgba(227,181,90,0.07)",
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
  scopeNotice: {
    marginTop: 19,
    paddingHorizontal: 13,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.14)",
    backgroundColor: "rgba(200,148,58,0.055)",
  },
  scopeNoticeText: {
    flex: 1,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 9.8,
    lineHeight: 14,
  },
  composerWrap: {
    paddingHorizontal: 13,
    paddingTop: 9,
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
    opacity: 0.72,
    transform: [{ scale: 0.96 }],
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
