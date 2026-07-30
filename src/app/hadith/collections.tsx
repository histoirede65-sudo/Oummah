import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import type { ImageSourcePropType } from "react-native";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { HADITH_COLLECTIONS } from "../../features/hadith-explorer/domain/HadithCollection";
import HadithScreenHeader from "../../features/hadith-explorer/presentation/HadithScreenHeader";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

const COLLECTION_COVERS: ImageSourcePropType[] = [
  require("../../assets/images/hadith-collections/sahih-bukhari.png"),
  require("../../assets/images/hadith-collections/sahih-muslim.png"),
  require("../../assets/images/hadith-collections/sunan-abu-dawud.png"),
  require("../../assets/images/hadith-collections/jami-tirmidhi.png"),
  require("../../assets/images/hadith-collections/sunan-nasai.png"),
  require("../../assets/images/hadith-collections/sunan-ibn-majah.png"),
  require("../../assets/images/hadith-collections/riyad-as-salihin.png"),
  require("../../assets/images/hadith-collections/al-adab-al-mufrad.png"),
  require("../../assets/images/hadith-collections/forty-nawawi.png"),
];

export default function HadithCollectionsScreen() {
  return (
    <LinearGradient colors={["#080713", "#120A1D", "#080713"]} style={styles.screen}>
      <SafeAreaView edges={["top"]} style={styles.safe}>
        <View style={styles.header}>
          <HadithScreenHeader title="Collections" subtitle="Explorer par source référencée" />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <View style={styles.notice}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={colors.goldLight}
            />
            <Text style={styles.noticeText}>
              HadeethEnc propose une sélection traduite et authentifiée, pas
              nécessairement l’intégralité de chaque recueil. OUMMAH l’indique
              clairement pour ne jamais induire en erreur.
            </Text>
          </View>

          <View style={styles.grid}>
            {HADITH_COLLECTIONS.map((collection, index) => (
              <Pressable
                key={collection.id}
                onPress={() =>
                  router.push({
                    pathname: "/hadith/collection/[collectionId]",
                    params: { collectionId: collection.id },
                  })
                }
                style={({ pressed }) => [
                  styles.card,
                  pressed && styles.pressed,
                ]}
              >
                <LinearGradient
                  colors={[`${collection.tone}E8`, "#17101F"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />

                <View pointerEvents="none" style={styles.bookHalo} />

                {COLLECTION_COVERS[index] ? (
                  <View pointerEvents="none" style={styles.bookWrap}>
                    <Image
                      source={COLLECTION_COVERS[index]}
                      resizeMode="contain"
                      style={styles.cover}
                    />
                  </View>
                ) : null}

                <LinearGradient
                  pointerEvents="none"
                  colors={[
                    "rgba(7,6,15,0)",
                    "rgba(7,6,15,0.08)",
                    "rgba(7,6,15,0.62)",
                  ]}
                  locations={[0, 0.64, 1]}
                  style={StyleSheet.absoluteFill}
                />

                <View style={styles.ornament}>
                  <Text style={styles.ornamentText}>{index + 1}</Text>
                </View>

                <View style={styles.topContent}>
                  <View style={styles.copy}>
                    <Text numberOfLines={2} style={styles.arabic}>
                      {collection.arabicName}
                    </Text>
                    <Text numberOfLines={2} style={styles.title}>
                      {collection.name}
                    </Text>
                  </View>
                </View>

                <View style={styles.descriptionBand}>
                  <Text
                    numberOfLines={3}
                    ellipsizeMode="tail"
                    style={styles.description}
                  >
                    {collection.description}
                  </Text>
                </View>

                <View style={styles.footer}>
                  <Text style={styles.badge}>SÉLECTION RÉFÉRENCÉE</Text>
                  <Ionicons
                    name="arrow-forward"
                    size={16}
                    color="#F4D58A"
                  />
                </View>
              </Pressable>
            ))}
          </View>

          <Text style={styles.credit}>
            Données et classifications : HadeethEnc · flux API courant
          </Text>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safe: { flex: 1 },
  header: { paddingHorizontal: 18 },
  content: {
    paddingHorizontal: 18,
    paddingTop: 15,
    paddingBottom: 110,
  },
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 16,
    borderRadius: 20,
    backgroundColor: "rgba(227,181,90,0.07)",
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.13)",
  },
  noticeText: {
    flex: 1,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 10.5,
    lineHeight: 16,
  },
  grid: {
    marginTop: 15,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  card: {
    width: "48.5%",
    height: 228,
    borderRadius: 23,
    overflow: "hidden",
    padding: 11,
    borderWidth: 1,
    borderColor: "rgba(255,232,183,0.28)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 7,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },
  bookHalo: {
    position: "absolute",
    top: 8,
    right: -8,
    width: 110,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(244,213,138,0.12)",
    shadowColor: "#E3B55A",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.24,
    shadowRadius: 22,
  },
  bookWrap: {
    position: "absolute",
    top: 6,
    right: -4,
    width: "57%",
    height: 128,
    zIndex: 6,
    shadowColor: "#000",
    shadowOffset: { width: -5, height: 12 },
    shadowOpacity: 0.55,
    shadowRadius: 13,
    elevation: 12,
  },
  cover: {
    width: "100%",
    height: "100%",
  },
  ornament: {
    position: "absolute",
    top: 12,
    left: 12,
    width: 31,
    height: 31,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "rgba(8,7,19,0.18)",
    zIndex: 7,
  },
  ornamentText: {
    color: "rgba(255,255,255,0.82)",
    fontFamily: typography.serifMedium,
    fontSize: 12,
  },
  topContent: {
    minHeight: 116,
    paddingTop: 38,
    zIndex: 3,
  },
  copy: {
    width: "44%",
  },
  arabic: {
    color: "#F8E5B5",
    fontFamily: typography.arabic,
    fontSize: 16,
    lineHeight: 20,
    textAlign: "left",
    marginBottom: 4,
  },
  title: {
    color: "#FFF9EF",
    fontFamily: typography.serifSemibold,
    fontSize: 14.2,
    lineHeight: 17,
  },
  descriptionBand: {
    minHeight: 50,
    paddingTop: 4,
    paddingRight: 2,
    justifyContent: "flex-start",
    zIndex: 7,
  },
  description: {
    color: "rgba(255,255,255,0.78)",
    fontFamily: typography.sans,
    fontSize: 10.2,
    lineHeight: 14.5,
  },
  footer: {
    marginTop: "auto",
    paddingTop: 7,
    borderTopWidth: 1,
    borderTopColor: "rgba(244,213,138,0.17)",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 7,
  },
  badge: {
    color: "#F4D58A",
    fontFamily: typography.sans,
    fontSize: 7,
    fontWeight: "800",
    letterSpacing: 0.58,
  },
  credit: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 9.5,
    textAlign: "center",
    marginTop: 24,
  },
});
