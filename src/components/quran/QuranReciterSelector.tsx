import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useGlobalAudioPlayer } from "../../context/AudioPlayerProvider";
import { useReciter } from "../../context/ReciterProvider";
import { getTrackSurahId } from "../../core/audio";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

export default function QuranReciterSelector({ compact = false }: { compact?: boolean }) {
  const [visible, setVisible] = useState(false);
  const { currentReciter, reciters, setCurrentReciter } = useReciter();
  const audio = useGlobalAudioPlayer();
  const orderedReciters = useMemo(
    () =>
      [...reciters].sort((left, right) =>
        left.name.localeCompare(right.name, "fr"),
      ),
    [reciters],
  );

  const selectReciter = async (reciterId: string) => {
    const reciter = reciters.find((item) => item.id === reciterId);
    if (!reciter || reciter.id === currentReciter?.id) {
      setVisible(false);
      return;
    }

    const playingSurahId = audio.track
      ? getTrackSurahId(audio.track)
      : undefined;
    const shouldResume = audio.isPlaying;

    await setCurrentReciter(reciter);
    if (playingSurahId) {
      await audio.loadSurah(playingSurahId, shouldResume, reciter.id);
    }
    setVisible(false);
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Changer de récitateur"
        onPress={() => setVisible(true)}
        style={({ pressed }) => [
          styles.selector,
          compact && styles.selectorCompact,
          pressed && styles.selectorPressed,
        ]}
      >
        <View style={[styles.iconShell, compact && styles.iconShellCompact]}>
          <Ionicons name="mic-outline" size={compact ? 14 : 17} color={colors.goldLight} />
        </View>
        <View style={styles.copy}>
          {!compact ? <Text style={styles.eyebrow}>RÉCITATEUR SÉLECTIONNÉ</Text> : null}
          <Text numberOfLines={1} style={[styles.name, compact && styles.nameCompact]}>
            {currentReciter?.name ?? "Choisir une voix"}
          </Text>
        </View>
        <View style={styles.changeAction}>
          <Text style={[styles.changeText, compact && styles.changeTextCompact]}>
            Changer
          </Text>
          <Ionicons name="chevron-forward" size={14} color={colors.goldMuted} />
        </View>
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setVisible(false)}
      >
        <Pressable onPress={() => setVisible(false)} style={styles.backdrop}>
          <Pressable
            onPress={(event) => event.stopPropagation()}
            style={styles.sheet}
          >
            <View style={styles.handle} />
            <View style={styles.header}>
              <View>
                <Text style={styles.sheetEyebrow}>ÉCOUTE DU CORAN</Text>
                <Text style={styles.title}>Choisir un récitateur</Text>
              </View>
              <Pressable onPress={() => setVisible(false)} style={styles.close}>
                <Ionicons name="close" size={21} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.list}
            >
              {orderedReciters.map((reciter) => {
                const selected = reciter.id === currentReciter?.id;
                return (
                  <Pressable
                    key={reciter.id}
                    onPress={() => void selectReciter(reciter.id)}
                    style={[
                      styles.reciterRow,
                      selected && styles.reciterRowSelected,
                    ]}
                  >
                    {selected ? (
                      <LinearGradient
                        colors={["rgba(241,187,75,0.16)", "transparent"]}
                        style={StyleSheet.absoluteFill}
                      />
                    ) : null}
                    <View
                      style={[
                        styles.avatar,
                        selected && styles.avatarSelected,
                      ]}
                    >
                      <Ionicons
                        name="mic"
                        size={15}
                        color={selected ? "#24151A" : colors.goldMuted}
                      />
                    </View>
                    <View style={styles.reciterCopy}>
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.reciterName,
                          selected && styles.reciterNameSelected,
                        ]}
                      >
                        {reciter.name}
                      </Text>
                      <Text style={styles.reciterMeta}>
                        {reciter.country} · {reciter.style}
                      </Text>
                    </View>
                    <Ionicons
                      name={selected ? "checkmark-circle" : "play-circle-outline"}
                      size={21}
                      color={selected ? colors.goldLight : colors.textMuted}
                    />
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  selector: {
    minHeight: 64,
    marginTop: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(232,185,91,0.20)",
    backgroundColor: "rgba(255,255,255,0.035)",
  },
  selectorPressed: { opacity: 0.76, transform: [{ scale: 0.99 }] },
  selectorCompact: {
    minHeight: 52,
    marginTop: 0,
    borderRadius: 16,
    borderColor: "rgba(241,187,75,0.42)",
    backgroundColor: "rgba(241,187,75,0.075)",
  },
  iconShell: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: "rgba(232,185,91,0.10)",
  },
  iconShellCompact: { width: 30, height: 30, borderRadius: 11 },
  copy: { flex: 1, minWidth: 0, marginLeft: 10 },
  eyebrow: {
    color: colors.goldMuted,
    fontFamily: typography.sans,
    fontSize: 7.8,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  name: {
    marginTop: 2,
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 14,
  },
  nameCompact: { marginTop: 0, fontSize: 12.5 },
  changeAction: { marginLeft: 8, flexDirection: "row", alignItems: "center" },
  changeText: {
    marginRight: 2,
    color: colors.goldMuted,
    fontFamily: typography.sans,
    fontSize: 10,
    fontWeight: "700",
  },
  changeTextCompact: { color: colors.goldLight, fontSize: 10.5 },
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(3,4,10,0.74)",
  },
  sheet: {
    maxHeight: "78%",
    paddingTop: 9,
    paddingHorizontal: 18,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: "rgba(255,229,180,0.17)",
    backgroundColor: colors.backgroundSecondary,
  },
  handle: {
    width: 42,
    height: 4,
    marginBottom: 15,
    alignSelf: "center",
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.19)",
  },
  header: {
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetEyebrow: {
    color: colors.goldMuted,
    fontFamily: typography.sans,
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1.1,
  },
  title: {
    marginTop: 2,
    color: colors.text,
    fontFamily: typography.serifSemibold,
    fontSize: 22,
  },
  close: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  list: { paddingBottom: 28, gap: 7 },
  reciterRow: {
    minHeight: 58,
    overflow: "hidden",
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(255,255,255,0.025)",
  },
  reciterRowSelected: { borderColor: "rgba(241,187,75,0.38)" },
  avatar: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "rgba(232,185,91,0.08)",
  },
  avatarSelected: { backgroundColor: colors.goldLight },
  reciterCopy: { flex: 1, minWidth: 0, marginHorizontal: 10 },
  reciterName: {
    color: colors.textSecondary,
    fontFamily: typography.serifMedium,
    fontSize: 13.5,
  },
  reciterNameSelected: { color: colors.goldLight },
  reciterMeta: {
    marginTop: 2,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 9,
    textTransform: "capitalize",
  },
});
