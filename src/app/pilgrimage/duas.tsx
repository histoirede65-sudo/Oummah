import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { pil, pilType } from "../../components/pilgrimage/theme";
import { sourceReference } from "../../features/pilgrimage/pilgrimageI18n";
import { updatePilgrimageState, usePilgrimageState, type DuaRequest } from "../../features/pilgrimage/pilgrimageStorage";
import { useI18n, type LanguageCode } from "../../i18n";

/** Where the dua was made: offered when it is ticked. The French name is what is stored. */
const PLACES = ["‘Arafa", "Multazam", "Tawâf", "Sa‘y", "Zamzam", "Rawda", "Sujûd", "Ailleurs"] as const;
const ELSEWHERE = "Ailleurs";
const PLACES_EN: Record<string, string> = {
  "‘Arafa": "‘Arafah", Multazam: "Multazam", "Tawâf": "Tawaf", "Sa‘y": "Sa‘y", Zamzam: "Zamzam", Rawda: "Rawdah", "Sujûd": "Sujud", Ailleurs: "Elsewhere",
};

const placeLabel = (place: string, language: LanguageCode) => (language === "en" ? PLACES_EN[place] ?? place : place);

const formatDate = (timestamp: number, language: LanguageCode) =>
  new Date(timestamp).toLocaleDateString(language === "en" ? "en-GB" : "fr-FR", { day: "numeric", month: "long" });

export default function PilgrimageDuas() {
  const insets = useSafeAreaInsets();
  const state = usePilgrimageState();
  const { language, t } = useI18n();
  const [person, setPerson] = useState("");
  const [request, setRequest] = useState("");
  const [tab, setTab] = useState<"todo" | "done">("todo");
  const [placing, setPlacing] = useState<DuaRequest | null>(null);
  const [reading, setReading] = useState(false);
  const [readingPlace, setReadingPlace] = useState<string>(PLACES[0]);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const all = useMemo(() => state?.duaRequests ?? [], [state]);
  const todo = all.filter((item) => !item.doneAt);
  const done = all.filter((item) => item.doneAt).sort((a, b) => (b.doneAt ?? 0) - (a.doneAt ?? 0));
  const shown = tab === "todo" ? todo : done;

  const add = () => {
    const text = request.trim();
    if (!text) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const item: DuaRequest = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      person: person.trim(),
      request: text,
      createdAt: Date.now(),
      doneAt: null,
      place: null,
    };
    void updatePilgrimageState((current) => ({ ...current, duaRequests: [item, ...current.duaRequests] }));
    setRequest("");
    setPerson("");
    setTab("todo");
  };

  const markDone = (id: string, place: string) => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    void updatePilgrimageState((current) => ({
      ...current,
      duaRequests: current.duaRequests.map((item) => (item.id === id ? { ...item, doneAt: Date.now(), place } : item)),
    }));
  };

  const undo = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    void updatePilgrimageState((current) => ({
      ...current,
      duaRequests: current.duaRequests.map((item) => (item.id === id ? { ...item, doneAt: null, place: null } : item)),
    }));
  };

  const remove = (id: string) => {
    if (confirmDelete !== id) {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete((current) => (current === id ? null : current)), 2500);
      return;
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    void updatePilgrimageState((current) => ({ ...current, duaRequests: current.duaRequests.filter((item) => item.id !== id) }));
    setConfirmDelete(null);
  };

  const tell = (item: DuaRequest) => {
    const where = item.place && item.place !== ELSEWHERE ? ` (${placeLabel(item.place, language)})` : "";
    void Share.share({
      message: item.person
        ? t("pilgrimage.duas.shareNamed", { person: item.person, where, request: item.request })
        : t("pilgrimage.duas.share", { where, request: item.request }),
    }).catch(() => undefined);
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <Pressable accessibilityRole="button" accessibilityLabel={t("common.back")} onPress={() => router.back()} hitSlop={8} style={styles.iconButton}>
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>{t("pilgrimage.duas.eyebrow")}</Text>
          <Text style={styles.title}>{t("pilgrimage.duasTitle")}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.hadith}>
          <Ionicons name="sparkles" size={18} color={pil.gold} />
          <Text style={styles.hadithText}>{language === "fr" ? `« ${t("pilgrimage.duas.hadith")} »` : `“${t("pilgrimage.duas.hadith")}”`}</Text>
          <Text style={styles.hadithSource}>{sourceReference("Sahîh Muslim 2733", language)}</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            value={person}
            onChangeText={setPerson}
            placeholder={t("pilgrimage.duas.personPlaceholder")}
            placeholderTextColor="rgba(255,255,255,0.55)"
            style={styles.input}
            maxLength={40}
          />
          <TextInput
            value={request}
            onChangeText={setRequest}
            placeholder={t("pilgrimage.duas.requestPlaceholder")}
            placeholderTextColor="rgba(255,255,255,0.55)"
            style={[styles.input, styles.inputMultiline]}
            multiline
            maxLength={300}
          />
          <Pressable accessibilityRole="button" disabled={!request.trim()} onPress={add} style={({ pressed }) => [styles.addButton, !request.trim() && styles.disabled, pressed && styles.pressed]}>
            <Ionicons name="add" size={20} color={pil.ink} />
            <Text style={styles.addText}>{t("pilgrimage.duas.add")}</Text>
          </Pressable>
        </View>

        <View style={styles.tabs}>
          {([["todo", t("pilgrimage.duas.tabTodo", { count: todo.length })], ["done", t("pilgrimage.duas.tabDone", { count: done.length })]] as const).map(([id, label]) => (
            <Pressable key={id} onPress={() => setTab(id)} style={[styles.tab, tab === id && styles.tabActive]}>
              <Text style={[styles.tabText, tab === id && styles.tabTextActive]}>{label}</Text>
            </Pressable>
          ))}
        </View>

        {tab === "todo" && todo.length > 0 ? (
          <Pressable accessibilityRole="button" onPress={() => setReading(true)} style={({ pressed }) => [styles.readButton, pressed && styles.pressed]}>
            <Ionicons name="book-outline" size={19} color={pil.gold} />
            <Text style={styles.readText}>{t("pilgrimage.duas.readLarge")}</Text>
            <Ionicons name="chevron-forward" size={17} color={pil.gold} />
          </Pressable>
        ) : null}

        {shown.map((item) => (
          <View key={item.id} style={[styles.card, item.doneAt ? styles.cardDone : null]}>
            <View style={styles.cardHead}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{(item.person || t("pilgrimage.duas.me")).slice(0, 1).toUpperCase()}</Text>
              </View>
              <Text style={styles.person}>{item.person || t("pilgrimage.duas.forMe")}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel={t("pilgrimage.duas.delete")} onPress={() => remove(item.id)} hitSlop={8} style={[styles.deleteButton, confirmDelete === item.id && styles.deleteConfirm]}>
                {confirmDelete === item.id ? <Text style={styles.deleteConfirmText}>{t("pilgrimage.duas.deleteConfirm")}</Text> : <Ionicons name="trash-outline" size={17} color="#FFFFFF" />}
              </Pressable>
            </View>
            <Text style={styles.request}>{item.request}</Text>
            {item.doneAt ? (
              <View style={styles.doneRow}>
                <Ionicons name="checkmark-circle" size={18} color={pil.green} />
                <Text style={styles.doneText}>{t("pilgrimage.duas.done")}{item.place ? ` · ${placeLabel(item.place, language)}` : ""} · {formatDate(item.doneAt, language)}</Text>
                <Pressable onPress={() => tell(item)} hitSlop={6} style={styles.smallButton}>
                  <Ionicons name="paper-plane-outline" size={15} color={pil.ink} />
                  <Text style={styles.smallButtonText}>{t("pilgrimage.duas.tell")}</Text>
                </Pressable>
                <Pressable onPress={() => undo(item.id)} hitSlop={6}>
                  <Ionicons name="arrow-undo-outline" size={18} color="#FFFFFF" />
                </Pressable>
              </View>
            ) : (
              <Pressable accessibilityRole="button" onPress={() => setPlacing(item)} style={({ pressed }) => [styles.doneButton, pressed && styles.pressed]}>
                <Ionicons name="hand-left-outline" size={18} color={pil.ink} />
                <Text style={styles.doneButtonText}>{t("pilgrimage.duas.markDone")}</Text>
              </Pressable>
            )}
          </View>
        ))}

        {shown.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name={tab === "todo" ? "heart-outline" : "hourglass-outline"} size={32} color={pil.gold} />
            <Text style={styles.emptyText}>
              {tab === "todo" ? t("pilgrimage.duas.emptyTodo") : t("pilgrimage.duas.emptyDone")}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Where was it made? */}
      <Modal visible={placing !== null} transparent animationType="fade" onRequestClose={() => setPlacing(null)}>
        <View style={styles.sheetBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setPlacing(null)} />
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 18 }]}>
            <Text style={styles.sheetTitle}>{t("pilgrimage.duas.whereTitle")}</Text>
            <Text numberOfLines={2} style={styles.sheetText}>{placing?.person ? `${placing.person} · ` : ""}{placing?.request}</Text>
            <View style={styles.places}>
              {PLACES.map((place) => (
                <Pressable
                  key={place}
                  onPress={() => {
                    if (placing) markDone(placing.id, place);
                    setPlacing(null);
                  }}
                  style={({ pressed }) => [styles.place, pressed && styles.pressed]}
                >
                  <Text style={styles.placeText}>{placeLabel(place, language)}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Large reading on site: one tap ticks the dua at the chosen place. */}
      <Modal visible={reading} animationType="slide" onRequestClose={() => setReading(false)} statusBarTranslucent>
        <View style={[styles.reading, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 10 }]}>
          <View style={styles.readingHead}>
            <Text style={styles.readingTitle}>{todo.length > 1 ? t("pilgrimage.duas.readingMany", { count: todo.length }) : t("pilgrimage.duas.readingOne")}</Text>
            <Pressable onPress={() => setReading(false)} accessibilityLabel={t("pilgrimage.close")} hitSlop={10} style={styles.iconButton}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.readingPlacesBar} contentContainerStyle={styles.readingPlaces}>
            {PLACES.map((place) => (
              <Pressable key={place} onPress={() => setReadingPlace(place)} style={[styles.readingPlace, readingPlace === place && styles.readingPlaceActive]}>
                <Text style={[styles.readingPlaceText, readingPlace === place && styles.readingPlaceTextActive]}>{placeLabel(place, language)}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <ScrollView contentContainerStyle={styles.readingList} showsVerticalScrollIndicator={false}>
            {todo.map((item) => (
              <View key={item.id} style={styles.readingItem}>
                {item.person ? <Text style={styles.readingPerson}>{item.person}</Text> : null}
                <Text style={styles.readingRequest}>{item.request}</Text>
                <Pressable onPress={() => markDone(item.id, readingPlace)} style={({ pressed }) => [styles.readingDone, pressed && styles.pressed]}>
                  <Ionicons name="checkmark" size={22} color={pil.ink} />
                  <Text style={styles.readingDoneText}>{t("pilgrimage.duas.done")}</Text>
                </Pressable>
              </View>
            ))}
            {todo.length === 0 ? <Text style={styles.readingEnd}>{t("pilgrimage.duas.allDone")}</Text> : null}
          </ScrollView>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: pil.bg },
  header: { paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 12 },
  iconButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 21, backgroundColor: pil.surfaceHigh },
  headerCopy: { flex: 1 },
  eyebrow: { color: pil.gold, fontSize: 12, fontWeight: "800", letterSpacing: 1.3, ...pilType.sans },
  title: { color: pil.text, fontSize: 30, ...pilType.display },
  content: { paddingHorizontal: 18, paddingTop: 16, gap: 12 },
  hadith: { padding: 16, gap: 8, borderRadius: 20, borderWidth: 1, borderColor: pil.goldLine, backgroundColor: pil.surfaceHigh },
  hadithText: { color: pil.text, fontSize: 18, lineHeight: 26, ...pilType.display },
  hadithSource: { color: pil.gold, fontSize: 12.5, fontWeight: "800", ...pilType.sans },
  form: { padding: 14, gap: 10, borderRadius: 20, backgroundColor: pil.surface },
  input: { minHeight: 48, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, color: pil.text, backgroundColor: pil.surfaceHigh, fontSize: 16, ...pilType.sans },
  inputMultiline: { minHeight: 84, textAlignVertical: "top" },
  addButton: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 24, backgroundColor: pil.gold },
  addText: { color: pil.ink, fontSize: 16, fontWeight: "800", ...pilType.sans },
  tabs: { padding: 4, flexDirection: "row", gap: 4, borderRadius: 16, backgroundColor: pil.surface },
  tab: { flex: 1, minHeight: 42, alignItems: "center", justifyContent: "center", borderRadius: 12 },
  tabActive: { backgroundColor: pil.gold },
  tabText: { color: pil.text, fontSize: 15, fontWeight: "700", ...pilType.sans },
  tabTextActive: { color: pil.ink, fontWeight: "800" },
  readButton: { minHeight: 52, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 16, borderWidth: 1, borderColor: pil.goldLine, backgroundColor: pil.goldSoft },
  readText: { flex: 1, color: pil.text, fontSize: 15.5, fontWeight: "700", ...pilType.sans },
  card: { padding: 14, gap: 10, borderRadius: 20, borderWidth: 1, borderColor: pil.line, backgroundColor: pil.surface },
  cardDone: { borderColor: "rgba(123,212,168,0.35)" },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 34, height: 34, alignItems: "center", justifyContent: "center", borderRadius: 17, backgroundColor: pil.goldSoft },
  avatarText: { color: pil.gold, fontSize: 16, fontWeight: "800", ...pilType.sans },
  person: { flex: 1, color: pil.text, fontSize: 16.5, fontWeight: "800", ...pilType.sans },
  deleteButton: { minWidth: 34, height: 34, paddingHorizontal: 8, alignItems: "center", justifyContent: "center", borderRadius: 17, backgroundColor: pil.surfaceHigh },
  deleteConfirm: { backgroundColor: pil.red },
  deleteConfirmText: { color: pil.ink, fontSize: 12.5, fontWeight: "800", ...pilType.sans },
  request: { color: pil.text, fontSize: 17, lineHeight: 25, ...pilType.sans },
  doneButton: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 22, backgroundColor: pil.gold },
  doneButtonText: { color: pil.ink, fontSize: 15, fontWeight: "800", ...pilType.sans },
  doneRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  doneText: { flex: 1, color: pil.green, fontSize: 14, fontWeight: "700", ...pilType.sans },
  smallButton: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, backgroundColor: pil.gold },
  smallButtonText: { color: pil.ink, fontSize: 12.5, fontWeight: "800", ...pilType.sans },
  empty: { alignItems: "center", gap: 10, padding: 24 },
  emptyText: { color: pil.textSoft, fontSize: 15, lineHeight: 22, textAlign: "center", ...pilType.sans },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  sheetBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.6)" },
  sheet: { padding: 20, gap: 10, borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: pil.surface },
  sheetTitle: { color: pil.text, fontSize: 24, ...pilType.display },
  sheetText: { color: pil.textSoft, fontSize: 15, lineHeight: 22, ...pilType.sans },
  places: { marginTop: 6, flexDirection: "row", flexWrap: "wrap", gap: 8 },
  place: { minHeight: 46, paddingHorizontal: 16, alignItems: "center", justifyContent: "center", borderRadius: 23, backgroundColor: pil.surfaceHigh, borderWidth: 1, borderColor: pil.goldLine },
  placeText: { color: pil.text, fontSize: 15.5, fontWeight: "700", ...pilType.sans },
  reading: { flex: 1, paddingHorizontal: 18, backgroundColor: pil.bg },
  readingHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  readingTitle: { color: pil.text, fontSize: 28, ...pilType.display },
  readingPlacesBar: { flexGrow: 0, marginTop: 12 },
  readingPlaces: { gap: 8 },
  readingPlace: { minHeight: 40, paddingHorizontal: 14, alignItems: "center", justifyContent: "center", borderRadius: 20, backgroundColor: pil.surface },
  readingPlaceActive: { backgroundColor: pil.gold },
  readingPlaceText: { color: pil.text, fontSize: 15, fontWeight: "700", ...pilType.sans },
  readingPlaceTextActive: { color: pil.ink, fontWeight: "800" },
  readingList: { paddingVertical: 16, gap: 14 },
  readingItem: { padding: 18, gap: 12, borderRadius: 24, backgroundColor: pil.surfaceHigh },
  readingPerson: { color: pil.gold, fontSize: 18, fontWeight: "800", ...pilType.sans },
  readingRequest: { color: pil.text, fontSize: 24, lineHeight: 34, ...pilType.sans },
  readingDone: { alignSelf: "flex-start", minHeight: 48, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 24, backgroundColor: pil.gold },
  readingDoneText: { color: pil.ink, fontSize: 17, fontWeight: "800", ...pilType.sans },
  readingEnd: { marginTop: 30, color: pil.green, fontSize: 20, lineHeight: 28, textAlign: "center", ...pilType.sans },
});
