import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { InvocationCard, PointRow, SectionTitle, TEXT_SCALES, TextScaleContext, useScaled } from "../../components/pilgrimage/PilgrimBits";
import { PilgrimVisual } from "../../components/pilgrimage/PilgrimVisual";
import { pil, pilType } from "../../components/pilgrimage/theme";
import { BOOKS, bookPages, HAJJ_TYPE_LABELS, hajjTypeGuidance, type BookPage } from "../../features/pilgrimage/pilgrimageBook";
import { INVOCATIONS_BY_ID } from "../../features/pilgrimage/pilgrimageInvocations";
import { updatePilgrimageState, usePilgrimageState } from "../../features/pilgrimage/pilgrimageStorage";
import type { HajjType, Point, Rite, Step, Tool } from "../../features/pilgrimage/pilgrimageTypes";

const TOOL_LABELS: Record<Tool, string> = {
  tawaf: "Ouvrir le compteur de Tawâf",
  sai: "Ouvrir le compteur de Sa‘y",
  jamarat: "Ouvrir le compteur des Jamarât",
};

function onlyLabel(only: HajjType[]) {
  return only.map((type) => HAJJ_TYPE_LABELS[type].title).join(" · ");
}

export default function PilgrimageBookScreen() {
  const params = useLocalSearchParams<{ rite?: string; step?: string }>();
  const rite: Rite = params.rite === "hajj" ? "hajj" : "umrah";
  const book = BOOKS[rite];
  const state = usePilgrimageState();
  const hajjType = rite === "hajj" ? state?.hajjType ?? null : null;
  const pages = useMemo(() => bookPages(book, hajjType), [book, hajjType]);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<BookPage>>(null);
  const [index, setIndex] = useState<number | null>(null);
  const [tocVisible, setTocVisible] = useState(false);
  const [finished, setFinished] = useState(false);
  const [sizeOpen, setSizeOpen] = useState(false);
  const currentStepId = useRef<string | null>(null);

  const done = useMemo(() => new Set(state?.reading[rite].done ?? []), [rite, state]);

  // Opening page: the requested step, else where the reader stopped.
  useEffect(() => {
    if (!state || index !== null) return;
    const target = params.step ?? state.reading[rite].stepId;
    const found = pages.findIndex((page) => page.step.id === target);
    setIndex(found > 0 ? found : 0);
  }, [index, pages, params.step, rite, state]);

  // The Hajj type changes the pages: stay on the same step.
  useEffect(() => {
    if (index === null || !currentStepId.current) return;
    const found = pages.findIndex((page) => page.step.id === currentStepId.current);
    const next = found >= 0 ? found : Math.min(index, pages.length - 1);
    if (next !== index) {
      setIndex(next);
      requestAnimationFrame(() => listRef.current?.scrollToIndex({ index: next, animated: false }));
    }
    // Only when the page list itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages]);

  const page = index === null ? null : pages[index];
  useEffect(() => {
    if (!page) return;
    currentStepId.current = page.step.id;
    void updatePilgrimageState((current) => ({
      ...current,
      reading: { ...current.reading, [rite]: { ...current.reading[rite], stepId: page.step.id } },
    }));
  }, [page, rite]);

  const goTo = useCallback((next: number) => {
    const bounded = Math.max(0, Math.min(pages.length - 1, next));
    setIndex(bounded);
    listRef.current?.scrollToIndex({ index: bounded, animated: true });
  }, [pages.length]);

  const onMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / width);
    if (next !== index) {
      setIndex(next);
      void Haptics.selectionAsync().catch(() => undefined);
    }
  };

  const toggleDone = () => {
    if (!page) return;
    const isDone = done.has(page.step.id);
    void updatePilgrimageState((current) => {
      const list = current.reading[rite].done.filter((id) => id !== page.step.id);
      return {
        ...current,
        reading: { ...current.reading, [rite]: { ...current.reading[rite], done: isDone ? list : [...list, page.step.id] } },
      };
    });
    if (isDone) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    if (index !== null && index < pages.length - 1) setTimeout(() => goTo(index + 1), 380);
    else setFinished(true);
  };

  const chooseType = useCallback((type: HajjType) => {
    void Haptics.selectionAsync().catch(() => undefined);
    void updatePilgrimageState((current) => ({ ...current, hajjType: type }));
  }, []);

  if (!state || index === null || !page) return <View style={styles.screen} />;

  const textScale = state.textScale ?? 1;
  const scaleIndex = Math.max(0, TEXT_SCALES.findIndex((value) => value === textScale));
  const setScale = (next: number) => {
    void Haptics.selectionAsync().catch(() => undefined);
    void updatePilgrimageState((current) => ({ ...current, textScale: TEXT_SCALES[next] }));
  };

  const chapterCounts = book.chapters.map((chapter, chapterIndex) => {
    const inChapter = pages.filter((item) => item.chapterIndex === chapterIndex);
    return { chapter, total: inChapter.length, done: inChapter.filter((item) => done.has(item.step.id)).length, first: inChapter[0]?.index ?? 0 };
  }).filter((item) => item.total > 0);
  const isDone = done.has(page.step.id);

  return (
    <View style={styles.screen}>
      {/* Fixed header: where am I in the book. */}
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <View style={styles.headerRow}>
          <Pressable accessibilityRole="button" accessibilityLabel="Retour" onPress={() => router.back()} hitSlop={8} style={styles.iconButton}>
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>{book.title}{hajjType ? ` · ${HAJJ_TYPE_LABELS[hajjType].title}` : ""}</Text>
            <Text numberOfLines={1} style={styles.headerChapter}>{page.chapter.title}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Taille du texte"
            onPress={() => setSizeOpen((value) => !value)}
            hitSlop={8}
            style={[styles.iconButton, sizeOpen && styles.iconButtonActive]}
          >
            <Text style={[styles.aaText, sizeOpen && styles.aaTextActive]}>Aa</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Sommaire" onPress={() => setTocVisible(true)} hitSlop={8} style={styles.iconButton}>
            <Ionicons name="list" size={21} color="#FFFFFF" />
          </Pressable>
        </View>
        <View style={styles.progress}>
          {chapterCounts.map((item) => {
            const current = item.chapter.id === page.chapter.id;
            return (
              <Pressable
                key={item.chapter.id}
                accessibilityRole="button"
                accessibilityLabel={item.chapter.title}
                onPress={() => goTo(item.first)}
                hitSlop={{ top: 10, bottom: 10 }}
                style={[styles.progressSegment, { flex: item.total }, current && styles.progressSegmentCurrent]}
              >
                <View style={[styles.progressFill, { width: `${(item.done / item.total) * 100}%` }]} />
              </Pressable>
            );
          })}
        </View>
        {sizeOpen ? (
          <View style={styles.sizeBar}>
            <Pressable accessibilityRole="button" accessibilityLabel="Texte plus petit" disabled={scaleIndex === 0} onPress={() => setScale(scaleIndex - 1)} style={[styles.sizeButton, scaleIndex === 0 && styles.disabled]}>
              <Text style={styles.sizeSmall}>A−</Text>
            </Pressable>
            <View style={styles.sizeDots}>
              {TEXT_SCALES.map((value, dot) => (
                <Pressable key={value} onPress={() => setScale(dot)} hitSlop={6} style={[styles.sizeDot, dot <= scaleIndex && styles.sizeDotOn]} />
              ))}
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Texte plus grand" disabled={scaleIndex === TEXT_SCALES.length - 1} onPress={() => setScale(scaleIndex + 1)} style={[styles.sizeButton, scaleIndex === TEXT_SCALES.length - 1 && styles.disabled]}>
              <Text style={styles.sizeLarge}>A+</Text>
            </Pressable>
          </View>
        ) : null}
        <Text style={styles.progressText}>Étape {index + 1} sur {pages.length} · {done.size ? `${pages.filter((item) => done.has(item.step.id)).length} faite${done.size > 1 ? "s" : ""}` : "glissez pour tourner les pages"}</Text>
      </View>

      <TextScaleContext.Provider value={textScale}>
      <FlatList
        ref={listRef}
        data={pages}
        extraData={state}
        keyExtractor={(item) => item.step.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={index}
        getItemLayout={(_, itemIndex) => ({ length: width, offset: width * itemIndex, index: itemIndex })}
        onMomentumScrollEnd={onMomentumEnd}
        windowSize={3}
        initialNumToRender={1}
        maxToRenderPerBatch={2}
        renderItem={({ item }) => (
          <BookPageView
            page={item}
            width={width}
            total={pages.length}
            done={done.has(item.step.id)}
            hajjType={hajjType}
            rite={rite}
            onChooseType={chooseType}
            bottomInset={insets.bottom}
          />
        )}
      />
      </TextScaleContext.Provider>

      {/* Fixed footer: previous · done · next. */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Étape précédente" disabled={index === 0} onPress={() => goTo(index - 1)} style={[styles.navButton, index === 0 && styles.disabled]}>
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </Pressable>
        <Pressable accessibilityRole="button" onPress={toggleDone} style={({ pressed }) => [styles.doneButton, isDone && styles.doneButtonDone, pressed && styles.pressed]}>
          <Ionicons name={isDone ? "checkmark-circle" : "checkmark-circle-outline"} size={21} color={isDone ? pil.green : pil.ink} />
          <Text style={[styles.doneText, isDone && styles.doneTextDone]}>{isDone ? "Étape faite" : "J’ai fait cette étape"}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Étape suivante" disabled={index === pages.length - 1} onPress={() => goTo(index + 1)} style={[styles.navButton, index === pages.length - 1 && styles.disabled]}>
          <Ionicons name="chevron-forward" size={22} color="#FFFFFF" />
        </Pressable>
      </View>

      <TableOfContents
        visible={tocVisible}
        onClose={() => setTocVisible(false)}
        pages={pages}
        current={index}
        done={done}
        rite={rite}
        hajjType={hajjType}
        onChooseType={chooseType}
        onSelect={(next) => {
          setTocVisible(false);
          goTo(next);
        }}
      />

      <Modal visible={finished} transparent animationType="fade" onRequestClose={() => setFinished(false)}>
        <View style={styles.finishBackdrop}>
          <View style={styles.finishCard}>
            <PilgrimVisual visual="done" />
            <Text style={styles.finishArabic}>تقبل الله منا ومنكم</Text>
            <Text style={styles.finishTitle}>{rite === "hajj" ? "Votre Hajj est parcouru" : "Votre ‘Umra est parcourue"}</Text>
            <Text style={styles.finishText}>Qu’Allah l’accepte et vous en accorde la récompense. Ce suivi reste une aide-mémoire : pour toute situation particulière, demandez à une personne qualifiée.</Text>
            <Pressable onPress={() => setFinished(false)} style={styles.finishButton}>
              <Text style={styles.finishButtonText}>Âmîn</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const BookPageView = memo(function BookPageView({ page, width, total, done, hajjType, rite, onChooseType, bottomInset }: {
  page: BookPage;
  width: number;
  total: number;
  done: boolean;
  hajjType: HajjType | null;
  rite: Rite;
  onChooseType: (type: HajjType) => void;
  bottomInset: number;
}) {
  const { step, chapter, chapterIndex, index } = page;
  const scaled = useScaled();
  const warnings = [...(step.avoid ?? []), ...(step.mistakes ?? [])];
  return (
    <ScrollView style={{ width }} contentContainerStyle={[styles.page, { paddingBottom: 110 + bottomInset }]} showsVerticalScrollIndicator={false}>
      <Text style={styles.chapterEyebrow}>CHAPITRE {chapterIndex + 1} · {chapter.marker.toUpperCase()}</Text>
      <View style={styles.titleRow}>
        <Text style={scaled(styles.stepTitle)}>{step.title}</Text>
        {done ? <Ionicons name="checkmark-circle" size={26} color={pil.green} /> : null}
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.stepCount}>Étape {index + 1} / {total}</Text>
        {step.only ? <Text style={styles.onlyBadge}>{onlyLabel(step.only)}</Text> : null}
      </View>

      <View style={styles.visual}>
        <PilgrimVisual visual={step.visual} arabic={step.arabic} />
        {step.arabic && ["tawaf", "sai", "jamarat", "arafat", "mina", "muzdalifa", "types", "done", "ifada", "farewell"].includes(step.visual) ? (
          <Text style={styles.visualArabic}>{step.arabic}</Text>
        ) : null}
      </View>

      <Text style={scaled(styles.summary)}>{step.summary}</Text>

      {rite === "hajj" && step.id === "types" ? <TypeChooser value={hajjType} onChoose={onChooseType} /> : null}

      <SectionTitle icon="footsteps-outline">Ce que je fais</SectionTitle>
      {step.todo.map((point, pointIndex) => <PointRow key={pointIndex} point={point} index={pointIndex} />)}

      {step.tool ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push(`/pilgrimage/pilgrim-mode?tool=${step.tool}`)}
          style={({ pressed }) => [styles.toolButton, pressed && styles.pressed]}
        >
          <Ionicons name="finger-print-outline" size={22} color={pil.ink} />
          <Text style={styles.toolButtonText}>{TOOL_LABELS[step.tool]}</Text>
          <Ionicons name="arrow-forward" size={18} color={pil.ink} />
        </Pressable>
      ) : null}

      {step.say?.length ? (
        <>
          <SectionTitle icon="chatbubble-ellipses-outline">Ce que je dis</SectionTitle>
          {step.say.map((id) => INVOCATIONS_BY_ID[id] ? <InvocationCard key={id} invocation={INVOCATIONS_BY_ID[id]} /> : null)}
        </>
      ) : null}

      {step.men?.length || step.women?.length ? <MenWomen men={step.men} women={step.women} /> : null}

      {step.notes?.length ? (
        <>
          <SectionTitle icon="bulb-outline">Bon à savoir</SectionTitle>
          <View style={styles.card}>
            {step.notes.map((point, pointIndex) => <PointRow key={pointIndex} point={point} bullet="sparkles-outline" />)}
          </View>
        </>
      ) : null}

      {warnings.length ? (
        <>
          <SectionTitle icon="alert-circle-outline" color={pil.red}>À éviter</SectionTitle>
          <View style={[styles.card, styles.warningCard]}>
            {warnings.map((point, pointIndex) => <PointRow key={pointIndex} point={point} bullet="close-circle-outline" />)}
          </View>
        </>
      ) : null}

      {step.differences?.map((difference) => <Difference key={difference.question} difference={difference} />)}

      {index === total - 1 ? null : (
        <View style={styles.turnHint}>
          <Text style={styles.turnHintText}>Glissez vers la gauche pour l’étape suivante</Text>
          <Ionicons name="arrow-forward" size={16} color={pil.muted} />
        </View>
      )}
    </ScrollView>
  );
});

function TypeChooser({ value, onChoose }: { value: HajjType | null; onChoose: (type: HajjType) => void }) {
  return (
    <View style={styles.typeChooser}>
      <Text style={styles.typeChooserTitle}>Quel Hajj accomplissez-vous ?</Text>
      <Text style={styles.typeChooserHint}>Le livre s’adapte à votre choix : seules les étapes qui vous concernent sont affichées.</Text>
      {(Object.keys(HAJJ_TYPE_LABELS) as HajjType[]).map((type) => {
        const selected = value === type;
        return (
          <Pressable
            key={type}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChoose(type)}
            style={({ pressed }) => [styles.typeCard, selected && styles.typeCardSelected, pressed && styles.pressed]}
          >
            <View style={styles.typeCardHead}>
              <Text style={styles.typeCardTitle}>{HAJJ_TYPE_LABELS[type].title}</Text>
              <Text style={styles.typeCardArabic}>{HAJJ_TYPE_LABELS[type].arabic}</Text>
              <Ionicons name={selected ? "radio-button-on" : "radio-button-off"} size={22} color={selected ? pil.gold : "#FFFFFF"} />
            </View>
            <Text style={styles.typeCardShort}>{HAJJ_TYPE_LABELS[type].short}</Text>
            {selected ? <Text style={styles.typeCardGuidance}>{hajjTypeGuidance(type)}</Text> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

function MenWomen({ men, women }: { men?: Point[]; women?: Point[] }) {
  const [tab, setTab] = useState<"men" | "women">(men?.length ? "men" : "women");
  const items = tab === "men" ? men : women;
  return (
    <>
      <SectionTitle icon="people-outline">Hommes et femmes</SectionTitle>
      <View style={styles.card}>
        <View style={styles.tabs}>
          {([["men", "Pour les hommes", men], ["women", "Pour les femmes", women]] as const).map(([id, label, list]) => (
            <Pressable
              key={id}
              disabled={!list?.length}
              onPress={() => setTab(id)}
              style={[styles.tab, tab === id && styles.tabActive, !list?.length && styles.disabled]}
            >
              <Text style={[styles.tabText, tab === id && styles.tabTextActive]}>{label}</Text>
            </Pressable>
          ))}
        </View>
        {items?.map((point, pointIndex) => <PointRow key={pointIndex} point={point} />)}
      </View>
    </>
  );
}

function Difference({ difference }: { difference: NonNullable<Step["differences"]>[number] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <SectionTitle icon="git-compare-outline">Avis des savants</SectionTitle>
      <Pressable onPress={() => setOpen((value) => !value)} style={styles.card}>
        <View style={styles.differenceHead}>
          <Text style={styles.differenceQuestion}>{difference.question}</Text>
          <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} color={pil.gold} />
        </View>
        {difference.establishedPoint ? <Text style={styles.differenceEstablished}>{difference.establishedPoint}</Text> : null}
        {open ? (
          <>
            {difference.views.map((view) => (
              <View key={view.label} style={styles.view}>
                <Text style={styles.viewLabel}>{view.label}</Text>
                <PointRow point={{ text: view.position, sources: view.evidences }} />
                {view.consequence ? <Text style={styles.viewConsequence}>{view.consequence}</Text> : null}
              </View>
            ))}
            {difference.practicalNote ? <Text style={styles.practicalNote}>{difference.practicalNote}</Text> : null}
          </>
        ) : (
          <Text style={styles.differenceMore}>Voir les avis</Text>
        )}
      </Pressable>
    </>
  );
}

function TableOfContents({ visible, onClose, pages, current, done, rite, hajjType, onChooseType, onSelect }: {
  visible: boolean;
  onClose: () => void;
  pages: BookPage[];
  current: number;
  done: Set<string>;
  rite: Rite;
  hajjType: HajjType | null;
  onChooseType: (type: HajjType) => void;
  onSelect: (index: number) => void;
}) {
  const insets = useSafeAreaInsets();
  const chapters = pages.reduce<Array<{ title: string; marker: string; pages: BookPage[] }>>((list, page) => {
    const last = list[list.length - 1];
    if (last && last.title === page.chapter.title) last.pages.push(page);
    else list.push({ title: page.chapter.title, marker: page.chapter.marker, pages: [page] });
    return list;
  }, []);
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.tocBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Fermer le sommaire" />
        <View style={[styles.toc, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.tocHandle} />
          <View style={styles.tocHead}>
            <Text style={styles.tocTitle}>Sommaire</Text>
            <Pressable onPress={onClose} hitSlop={8} style={styles.iconButton}>
              <Ionicons name="close" size={21} color="#FFFFFF" />
            </Pressable>
          </View>
          {rite === "hajj" ? (
            <View style={styles.tocTypes}>
              {(Object.keys(HAJJ_TYPE_LABELS) as HajjType[]).map((type) => (
                <Pressable key={type} onPress={() => onChooseType(type)} style={[styles.tocType, hajjType === type && styles.tocTypeActive]}>
                  <Text style={[styles.tocTypeText, hajjType === type && styles.tocTypeTextActive]}>{HAJJ_TYPE_LABELS[type].title}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
          <ScrollView showsVerticalScrollIndicator={false}>
            {chapters.map((chapter, chapterIndex) => (
              <View key={chapter.title} style={styles.tocChapter}>
                <Text style={styles.tocChapterEyebrow}>CHAPITRE {chapterIndex + 1} · {chapter.marker.toUpperCase()}</Text>
                <Text style={styles.tocChapterTitle}>{chapter.title}</Text>
                {chapter.pages.map((page) => {
                  const isCurrent = page.index === current;
                  const isDone = done.has(page.step.id);
                  return (
                    <Pressable key={page.step.id} onPress={() => onSelect(page.index)} style={[styles.tocRow, isCurrent && styles.tocRowCurrent]}>
                      <Ionicons
                        name={isDone ? "checkmark-circle" : isCurrent ? "bookmark" : "ellipse-outline"}
                        size={18}
                        color={isDone ? pil.green : pil.gold}
                      />
                      <Text style={[styles.tocRowText, isCurrent && styles.tocRowTextCurrent]}>{page.step.title}</Text>
                      <Text style={styles.tocRowNumber}>{page.index + 1}</Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: pil.bg },
  header: { paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: pil.line, backgroundColor: pil.bg },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 21, backgroundColor: pil.surfaceHigh },
  iconButtonActive: { backgroundColor: pil.gold },
  aaText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800", ...pilType.sans },
  aaTextActive: { color: pil.ink },
  sizeBar: { marginTop: 12, padding: 6, flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 18, backgroundColor: pil.surface },
  sizeButton: { width: 48, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: pil.surfaceHigh },
  sizeSmall: { color: "#FFFFFF", fontSize: 14, fontWeight: "800", ...pilType.sans },
  sizeLarge: { color: "#FFFFFF", fontSize: 20, fontWeight: "800", ...pilType.sans },
  sizeDots: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  sizeDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "rgba(255,255,255,0.2)" },
  sizeDotOn: { backgroundColor: pil.gold },
  headerCopy: { flex: 1, alignItems: "center" },
  headerTitle: { color: pil.gold, fontSize: 13, fontWeight: "800", letterSpacing: 0.4, ...pilType.sans },
  headerChapter: { marginTop: 2, color: pil.text, fontSize: 16, fontWeight: "700", ...pilType.sans },
  progress: { marginTop: 12, height: 6, flexDirection: "row", gap: 4 },
  progressSegment: { overflow: "hidden", borderRadius: 3, backgroundColor: "rgba(255,255,255,0.12)" },
  progressSegmentCurrent: { backgroundColor: "rgba(232,187,98,0.35)" },
  progressFill: { height: "100%", borderRadius: 3, backgroundColor: pil.gold },
  progressText: { marginTop: 7, color: pil.textSoft, fontSize: 12.5, textAlign: "center", ...pilType.sans },
  page: { paddingHorizontal: 20, paddingTop: 20 },
  chapterEyebrow: { color: pil.gold, fontSize: 12, fontWeight: "800", letterSpacing: 1.3, ...pilType.sans },
  titleRow: { marginTop: 8, flexDirection: "row", alignItems: "flex-start", gap: 10 },
  stepTitle: { flex: 1, color: pil.text, fontSize: 34, lineHeight: 38, ...pilType.display },
  metaRow: { marginTop: 8, flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  stepCount: { color: pil.textSoft, fontSize: 13.5, fontWeight: "600", ...pilType.sans },
  onlyBadge: { paddingHorizontal: 9, paddingVertical: 3, overflow: "hidden", borderRadius: 8, color: pil.gold, backgroundColor: pil.goldSoft, fontSize: 12, fontWeight: "800", ...pilType.sans },
  visual: { marginTop: 18 },
  visualArabic: { position: "absolute", top: 12, right: 16, color: pil.gold, fontSize: 20, ...pilType.arabic },
  summary: { marginTop: 18, color: pil.text, fontSize: 19.5, lineHeight: 29, fontWeight: "500", ...pilType.sans },
  card: { padding: 14, borderRadius: 20, borderWidth: 1, borderColor: pil.line, backgroundColor: pil.surface },
  warningCard: { borderColor: "rgba(242,165,155,0.30)", backgroundColor: pil.redSoft },
  toolButton: { marginTop: 14, minHeight: 56, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 18, backgroundColor: pil.gold },
  toolButtonText: { flex: 1, color: pil.ink, fontSize: 16, fontWeight: "800", ...pilType.sans },
  tabs: { marginBottom: 6, padding: 4, flexDirection: "row", gap: 4, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.06)" },
  tab: { flex: 1, minHeight: 38, alignItems: "center", justifyContent: "center", borderRadius: 10 },
  tabActive: { backgroundColor: pil.gold },
  tabText: { color: pil.text, fontSize: 14, fontWeight: "700", ...pilType.sans },
  tabTextActive: { color: pil.ink, fontWeight: "800" },
  differenceHead: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  differenceQuestion: { flex: 1, color: pil.text, fontSize: 17, lineHeight: 25, fontWeight: "700", ...pilType.sans },
  differenceEstablished: { marginTop: 8, color: pil.textSoft, fontSize: 15.5, lineHeight: 23, ...pilType.sans },
  differenceMore: { marginTop: 10, color: pil.gold, fontSize: 14, fontWeight: "800", ...pilType.sans },
  view: { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: pil.line },
  viewLabel: { color: pil.gold, fontSize: 13, fontWeight: "800", ...pilType.sans },
  viewConsequence: { marginLeft: 26, color: pil.textSoft, fontSize: 15, lineHeight: 22, ...pilType.sans },
  practicalNote: { marginTop: 12, padding: 12, overflow: "hidden", borderRadius: 14, color: pil.text, backgroundColor: pil.goldSoft, fontSize: 15, lineHeight: 22, fontWeight: "600", ...pilType.sans },
  typeChooser: { marginTop: 20, gap: 10 },
  typeChooserTitle: { color: pil.text, fontSize: 21, fontWeight: "800", ...pilType.sans },
  typeChooserHint: { marginBottom: 4, color: pil.textSoft, fontSize: 15, lineHeight: 22, ...pilType.sans },
  typeCard: { padding: 16, borderRadius: 20, borderWidth: 1.5, borderColor: pil.line, backgroundColor: pil.surface },
  typeCardSelected: { borderColor: pil.gold, backgroundColor: pil.surfaceHigh },
  typeCardHead: { flexDirection: "row", alignItems: "center", gap: 10 },
  typeCardTitle: { color: pil.text, fontSize: 20, fontWeight: "800", ...pilType.sans },
  typeCardArabic: { flex: 1, color: pil.gold, fontSize: 20, ...pilType.arabic },
  typeCardShort: { marginTop: 6, color: pil.textSoft, fontSize: 15.5, ...pilType.sans },
  typeCardGuidance: { marginTop: 10, color: pil.text, fontSize: 15.5, lineHeight: 23, ...pilType.sans },
  turnHint: { marginTop: 28, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  turnHintText: { color: pil.muted, fontSize: 13, ...pilType.sans },
  footer: { position: "absolute", left: 0, right: 0, bottom: 0, paddingTop: 10, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 10, borderTopWidth: 1, borderTopColor: pil.line, backgroundColor: "rgba(12,10,18,0.97)" },
  navButton: { width: 52, height: 52, alignItems: "center", justifyContent: "center", borderRadius: 26, backgroundColor: pil.surfaceHigh },
  doneButton: { flex: 1, minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 26, backgroundColor: pil.gold },
  doneButtonDone: { backgroundColor: pil.greenSoft, borderWidth: 1, borderColor: "rgba(123,212,168,0.45)" },
  doneText: { color: pil.ink, fontSize: 16, fontWeight: "800", ...pilType.sans },
  doneTextDone: { color: pil.green },
  disabled: { opacity: 0.35 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  tocBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.6)" },
  toc: { maxHeight: "86%", paddingHorizontal: 18, paddingTop: 10, borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: pil.surface },
  tocHandle: { width: 42, height: 4, marginBottom: 10, alignSelf: "center", borderRadius: 2, backgroundColor: "rgba(255,255,255,0.25)" },
  tocHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  tocTitle: { color: pil.text, fontSize: 28, ...pilType.display },
  tocTypes: { marginTop: 12, padding: 4, flexDirection: "row", gap: 4, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.06)" },
  tocType: { flex: 1, minHeight: 38, alignItems: "center", justifyContent: "center", borderRadius: 10 },
  tocTypeActive: { backgroundColor: pil.gold },
  tocTypeText: { color: pil.text, fontSize: 14, fontWeight: "700", ...pilType.sans },
  tocTypeTextActive: { color: pil.ink, fontWeight: "800" },
  tocChapter: { marginTop: 18 },
  tocChapterEyebrow: { color: pil.gold, fontSize: 11.5, fontWeight: "800", letterSpacing: 1.2, ...pilType.sans },
  tocChapterTitle: { marginTop: 3, marginBottom: 6, color: pil.text, fontSize: 19, fontWeight: "800", ...pilType.sans },
  tocRow: { minHeight: 46, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12 },
  tocRowCurrent: { backgroundColor: pil.goldSoft },
  tocRowText: { flex: 1, color: pil.text, fontSize: 16, ...pilType.sans },
  tocRowTextCurrent: { fontWeight: "800" },
  tocRowNumber: { color: pil.muted, fontSize: 13, fontWeight: "700", ...pilType.sans },
  finishBackdrop: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "rgba(0,0,0,0.75)" },
  finishCard: { width: "100%", maxWidth: 380, padding: 18, borderRadius: 28, borderWidth: 1, borderColor: pil.goldLine, backgroundColor: pil.surface },
  finishArabic: { marginTop: 18, color: pil.gold, fontSize: 26, textAlign: "center", ...pilType.arabic },
  finishTitle: { marginTop: 8, color: pil.text, fontSize: 28, textAlign: "center", ...pilType.display },
  finishText: { marginTop: 10, color: pil.textSoft, fontSize: 15.5, lineHeight: 23, textAlign: "center", ...pilType.sans },
  finishButton: { marginTop: 18, minHeight: 50, alignItems: "center", justifyContent: "center", borderRadius: 25, backgroundColor: pil.gold },
  finishButtonText: { color: pil.ink, fontSize: 17, fontWeight: "800", ...pilType.sans },
});
