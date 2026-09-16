import { Ionicons } from "@expo/vector-icons";
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as Sharing from "expo-sharing";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "../theme/colors";
import { typography } from "../theme/typography";

type Wallpaper = {
  id: string;
  title: string;
  category: string;
  source: number;
  isNew?: boolean;
};

const WALLPAPERS: readonly Wallpaper[] = [
  { id: "patience", title: "Les endurants", category: "Coran", source: require("../assets/images/wallpapers/wallpaper-03.jpg"), isNew: true },
  { id: "trust", title: "La confiance", category: "Coran", source: require("../assets/images/wallpapers/wallpaper-07.jpg"), isNew: true },
  { id: "emerald", title: "Le rappel", category: "Coran", source: require("../assets/images/wallpapers/wallpaper-08.jpg"), isNew: true },
  { id: "mercy", title: "La miséricorde", category: "Coran", source: require("../assets/images/wallpapers/wallpaper-09.jpg"), isNew: true },
  { id: "intentions", title: "Les intentions", category: "Hadith", source: require("../assets/images/wallpapers/wallpaper-10.jpg"), isNew: true },
  { id: "gentleness", title: "La douceur", category: "Hadith", source: require("../assets/images/wallpapers/wallpaper-11.jpg"), isNew: true },
  { id: "light", title: "La lumière", category: "Hadith", source: require("../assets/images/wallpapers/wallpaper-12.jpg"), isNew: true },
  { id: "beauty", title: "La beauté", category: "Hadith", source: require("../assets/images/wallpapers/wallpaper-01.jpg") },
  { id: "ease", title: "La facilité", category: "Coran", source: require("../assets/images/wallpapers/wallpaper-02.jpg") },
  { id: "remember", title: "Souvenez-vous", category: "Coran", source: require("../assets/images/wallpapers/wallpaper-04.jpg") },
  { id: "hearts", title: "Les cœurs", category: "Coran", source: require("../assets/images/wallpapers/wallpaper-05.jpg") },
  { id: "invocation", title: "L’évocation", category: "Coran", source: require("../assets/images/wallpapers/wallpaper-06.jpg") },
];

export default function WallpapersScreen() {
  const { width } = useWindowDimensions();
  const cardWidth = useMemo(() => Math.floor((width - 46) / 2), [width]);
  const [selected, setSelected] = useState<Wallpaper | null>(null);
  const [sharingId, setSharingId] = useState<string | null>(null);

  const saveOrShare = async (wallpaper: Wallpaper) => {
    if (sharingId) return;
    setSharingId(wallpaper.id);

    try {
      const asset = Asset.fromModule(wallpaper.source);
      await asset.downloadAsync();
      const uri = asset.localUri ?? asset.uri;

      if (!uri || !(await Sharing.isAvailableAsync())) {
        throw new Error("SHARING_UNAVAILABLE");
      }

      if (!FileSystem.cacheDirectory) {
        throw new Error("CACHE_UNAVAILABLE");
      }

      const readableTitle = wallpaper.title
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      const shareDirectory = `${FileSystem.cacheDirectory}oummah-wallpapers/`;
      const shareUri = `${shareDirectory}Fond-OUMMAH-${readableTitle}.jpg`;
      await FileSystem.makeDirectoryAsync(shareDirectory, { intermediates: true });
      await FileSystem.deleteAsync(shareUri, { idempotent: true });
      await FileSystem.copyAsync({ from: uri, to: shareUri });

      await Sharing.shareAsync(shareUri, {
        dialogTitle: "Enregistrer le fond d’écran OUMMAH",
        mimeType: "image/jpeg",
        UTI: "public.jpeg",
      });
    } catch {
      Alert.alert(
        "Enregistrement indisponible",
        "Impossible d’ouvrir les options d’enregistrement pour le moment.",
      );
    } finally {
      setSharingId(null);
    }
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Retour"
          onPress={() => router.back()}
          style={styles.headerButton}
        >
          <Ionicons name="arrow-back" size={22} color={colors.goldLight} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>COLLECTION OUMMAH</Text>
          <Text style={styles.headerTitle}>Fonds d’écran</Text>
        </View>
        <View style={styles.countPill}>
          <Text style={styles.countText}>{WALLPAPERS.length}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={["rgba(92,47,115,0.72)", "rgba(31,18,47,0.88)"]}
          style={styles.hero}
        >
          <View style={styles.heroIcon}>
            <Ionicons name="phone-portrait-outline" size={25} color={colors.goldLight} />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>Un rappel qui vous accompagne</Text>
            <Text style={styles.heroText}>
              Choisissez un fond, ouvrez-le puis enregistrez-le sur votre téléphone.
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Toute la collection</Text>
          <Text style={styles.sectionMeta}>12 fonds · faites défiler</Text>
        </View>

        <View style={styles.grid}>
          {WALLPAPERS.map((wallpaper) => (
            <Pressable
              accessibilityLabel={`Voir le fond ${wallpaper.title}`}
              key={wallpaper.id}
              onPress={() => setSelected(wallpaper)}
              style={({ pressed }) => [
                styles.card,
                { width: cardWidth, height: cardWidth * 1.72 },
                pressed && styles.pressed,
              ]}
            >
              <Image
                contentFit="cover"
                source={wallpaper.source}
                style={StyleSheet.absoluteFill}
                transition={180}
              />
              <LinearGradient
                colors={["transparent", "rgba(4,3,9,0.08)", "rgba(4,3,9,0.9)"]}
                locations={[0.48, 0.68, 1]}
                style={StyleSheet.absoluteFill}
              />
              {wallpaper.isNew ? (
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>NOUVEAU</Text>
                </View>
              ) : null}
              <View style={styles.cardFooter}>
                <Text numberOfLines={1} style={styles.cardTitle}>{wallpaper.title}</Text>
                <Text style={styles.cardCategory}>{wallpaper.category}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <Modal
        animationType="fade"
        onRequestClose={() => setSelected(null)}
        statusBarTranslucent
        visible={Boolean(selected)}
      >
        <View style={styles.previewScreen}>
          {selected ? (
            <Image contentFit="contain" source={selected.source} style={StyleSheet.absoluteFill} />
          ) : null}
          <LinearGradient
            colors={["rgba(0,0,0,0.72)", "transparent", "rgba(0,0,0,0.86)"]}
            locations={[0, 0.28, 1]}
            pointerEvents="none"
            style={StyleSheet.absoluteFill}
          />
          <SafeAreaView edges={["top", "bottom"]} style={styles.previewSafe}>
            <View style={styles.previewTop}>
              <View>
                <Text style={styles.previewEyebrow}>APERÇU</Text>
                <Text style={styles.previewTitle}>{selected?.title}</Text>
              </View>
              <Pressable
                accessibilityLabel="Fermer l’aperçu"
                onPress={() => setSelected(null)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={23} color="#FFF" />
              </Pressable>
            </View>

            <View style={styles.previewBottom}>
              <Pressable
                disabled={!selected || Boolean(sharingId)}
                onPress={() => selected && void saveOrShare(selected)}
                style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}
              >
                {sharingId ? (
                  <ActivityIndicator color={colors.background} size="small" />
                ) : (
                  <Ionicons name="download-outline" size={20} color={colors.background} />
                )}
                <Text style={styles.saveButtonText}>Enregistrer ou partager</Text>
              </Pressable>
              <Text style={styles.saveHint}>
                Dans le menu du téléphone, choisissez « Enregistrer l’image ».
              </Text>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { height: 72, paddingHorizontal: 17, flexDirection: "row", alignItems: "center" },
  headerButton: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: "rgba(255,255,255,0.04)" },
  headerCopy: { flex: 1, alignItems: "center" },
  eyebrow: { color: colors.goldMuted, fontFamily: typography.sans, fontSize: 8, fontWeight: "800", letterSpacing: 1.5 },
  headerTitle: { marginTop: 2, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 24 },
  countPill: { width: 44, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(227,181,90,0.11)", borderWidth: 1, borderColor: "rgba(227,181,90,0.24)" },
  countText: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 12, fontWeight: "800" },
  content: { paddingHorizontal: 16, paddingBottom: 38 },
  hero: { minHeight: 112, marginTop: 6, padding: 17, borderRadius: 24, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "rgba(227,181,90,0.2)" },
  heroIcon: { width: 48, height: 48, marginRight: 14, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(227,181,90,0.1)", borderWidth: 1, borderColor: "rgba(227,181,90,0.2)" },
  heroCopy: { flex: 1 },
  heroTitle: { color: colors.text, fontFamily: typography.serifSemibold, fontSize: 19 },
  heroText: { marginTop: 5, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 11, lineHeight: 16 },
  sectionRow: { marginTop: 25, marginBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { color: colors.text, fontFamily: typography.serifSemibold, fontSize: 21 },
  sectionMeta: { color: colors.goldMuted, fontFamily: typography.sans, fontSize: 10, fontWeight: "700" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  card: { overflow: "hidden", borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,230,180,0.16)", backgroundColor: colors.surface },
  newBadge: { position: "absolute", top: 9, right: 9, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 9, backgroundColor: "rgba(17,11,27,0.86)", borderWidth: 1, borderColor: "rgba(242,190,85,0.45)" },
  newBadgeText: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 7, fontWeight: "900", letterSpacing: 0.7 },
  cardFooter: { position: "absolute", left: 11, right: 11, bottom: 11 },
  cardTitle: { color: "#FFF9EF", fontFamily: typography.serifSemibold, fontSize: 16 },
  cardCategory: { marginTop: 2, color: "rgba(255,244,231,0.62)", fontFamily: typography.sans, fontSize: 8, fontWeight: "700", letterSpacing: 0.7, textTransform: "uppercase" },
  pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
  previewScreen: { flex: 1, backgroundColor: "#020204" },
  previewSafe: { flex: 1, justifyContent: "space-between" },
  previewTop: { paddingHorizontal: 18, paddingTop: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  previewEyebrow: { color: "rgba(255,255,255,0.62)", fontFamily: typography.sans, fontSize: 8, fontWeight: "800", letterSpacing: 1.4 },
  previewTitle: { marginTop: 2, color: "#FFF", fontFamily: typography.serifSemibold, fontSize: 23 },
  closeButton: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.46)", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
  previewBottom: { paddingHorizontal: 18, paddingBottom: 10 },
  saveButton: { height: 54, borderRadius: 18, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, backgroundColor: colors.goldLight },
  saveButtonText: { color: colors.background, fontFamily: typography.sans, fontSize: 13, fontWeight: "900" },
  saveHint: { marginTop: 9, color: "rgba(255,255,255,0.7)", fontFamily: typography.sans, fontSize: 9.5, textAlign: "center" },
});
