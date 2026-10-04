import { StyleSheet, Text, View } from "react-native";
import { WasilContextButton } from "../../../components/wasil/WasilContextButton";
import { fq } from "./FiqhUI";

export function FiqhWasilCTA({ enabled = false, prompt }: { enabled?: boolean; prompt?: string }) {
  if (!enabled) return null;

  return (
    <View style={styles.box}>
      <Text style={styles.title}>Une question sur cette leçon ?</Text>
      <Text style={styles.text}>Wasil peut vous aider à approfondir.</Text>
      <View style={styles.action}>
        <WasilContextButton prompt={prompt ?? "Je souhaite approfondir cette leçon de fiqh."} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { marginTop: 16, padding: 15, borderRadius: 16, backgroundColor: fq.paper },
  title: { color: fq.ink, fontSize: 15, fontWeight: "700" },
  text: { color: fq.inkMuted, fontSize: 13.5, marginTop: 3 },
  action: { marginTop: 12, alignSelf: "flex-start" },
});
