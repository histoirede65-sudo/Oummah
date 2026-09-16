import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../../theme/colors";
import { WasilContextButton } from "../../../components/wasil/WasilContextButton";

export function FiqhWasilCTA({ enabled = false, prompt }: { enabled?: boolean; prompt?: string }) {
  if (!enabled) return null;

  return (
    <View style={styles.box}>
      <View style={styles.topRow}>
        <View style={styles.icon}>
          <Ionicons name="sparkles-outline" size={16} color={colors.goldLight} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.kicker}>UNE QUESTION SUR CETTE LEÇON ?</Text>
          <Text style={styles.title}>Wasil peut vous aider à approfondir ce sujet.</Text>
        </View>
      </View>
      <View style={styles.action}>
        <WasilContextButton prompt={prompt ?? "Je souhaite approfondir cette leçon de fiqh."} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    marginTop: 18,
    padding: 13,
    borderRadius: 18,
    backgroundColor: colors.purpleDeep,
    borderWidth: 1,
    borderColor: colors.border,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  icon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceAlt,
  },
  copy: {
    flex: 1,
  },
  kicker: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  title: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "800",
    marginTop: 2,
  },
  action: {
    marginTop: 10,
    alignSelf: "flex-start",
  },
});
