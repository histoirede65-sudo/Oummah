import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { type Href, router, usePathname } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "../../../theme/colors";
import { typography } from "../../../theme/typography";
import { useProphetAudio } from "./ProphetAudioProvider";

export default function ProphetAudioMiniPlayer() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { episode, isPlaying, progress, togglePlay, close } = useProphetAudio();

  if (!episode || pathname === `/prophets/audio/${episode.prophetId}`) return null;

  return (
    <View style={[styles.container, { bottom: 69 + insets.bottom }]}>
      <LinearGradient
        colors={["#1E1730", "#151022", "#100C19"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Pressable
        onPress={() => router.push(`/prophets/audio/${episode.prophetId}` as Href)}
        style={({ pressed }) => [styles.details, pressed && styles.pressed]}
      >
        <View style={styles.badge}>
          <Ionicons name="headset" size={19} color={colors.goldLight} />
        </View>
        <View style={styles.copy}>
          <Text numberOfLines={1} style={styles.kicker}>RÉCIT AUDIO · {episode.prophetName.toUpperCase()}</Text>
          <Text numberOfLines={1} style={styles.title}>{episode.title}</Text>
        </View>
      </Pressable>

      <Pressable
        accessibilityLabel={isPlaying ? "Mettre en pause" : "Reprendre"}
        onPress={() => void togglePlay()}
        style={({ pressed }) => [styles.playButton, pressed && styles.pressed]}
      >
        <Ionicons name={isPlaying ? "pause" : "play"} size={21} color="#1A0B12" />
      </Pressable>

      <Pressable
        accessibilityLabel="Fermer complètement le récit audio"
        onPress={() => void close()}
        hitSlop={8}
        style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
      >
        <Ionicons name="close" size={18} color="#FFF7EC" />
      </Pressable>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, progress * 100))}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 12,
    right: 12,
    height: 66,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.38)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 12,
    zIndex: 60,
  },
  details: {
    flex: 1,
    minWidth: 0,
    height: "100%",
    paddingLeft: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  badge: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(227,181,90,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
  },
  copy: { flex: 1, minWidth: 0, marginLeft: 10 },
  kicker: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  title: {
    marginTop: 2,
    color: colors.text,
    fontFamily: typography.serifSemibold,
    fontSize: 14.5,
  },
  playButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1C36B",
  },
  closeButton: {
    width: 34,
    height: 34,
    marginHorizontal: 6,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.13)",
  },
  progressTrack: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 0,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  progressFill: { height: 3, backgroundColor: colors.goldLight },
  pressed: { opacity: 0.78 },
});
