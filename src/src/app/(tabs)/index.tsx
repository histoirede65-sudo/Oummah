import { Animated, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";

import DalilCard from "../../components/DalilCard";
import HomeGoalsSection from "../../components/HomeGoalsSection";
import HomeAnnouncementBanner from "../../components/HomeAnnouncementBanner";
import HomeShortcuts from "../../components/HomeShortcuts";
import PrayerCard from "../../components/PrayerCard";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

export default function HomeScreen() {
  const { welcome } = useLocalSearchParams<{ welcome?: string }>();
  const [showWelcome, setShowWelcome] = useState(false);
  const welcomeOpacity = useRef(new Animated.Value(0)).current;
  const welcomeScale = useRef(new Animated.Value(0.88)).current;
  const scrollRef = useRef<ScrollView>(null);
  const wasilOffset = useRef(0);


  useEffect(() => {
    if (welcome !== "1") return;
    setShowWelcome(true);
    welcomeOpacity.setValue(0);
    welcomeScale.setValue(0.88);
    Animated.sequence([
      Animated.parallel([
        Animated.timing(welcomeOpacity, {
          toValue: 1,
          duration: 420,
          useNativeDriver: true,
        }),
        Animated.spring(welcomeScale, {
          toValue: 1,
          friction: 6,
          tension: 70,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(1450),
      Animated.timing(welcomeOpacity, {
        toValue: 0,
        duration: 380,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowWelcome(false);
      router.setParams({ welcome: "" });
    });
  }, [welcome, welcomeOpacity, welcomeScale]);

  const revealWasilInput = () => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        y: Math.max(0, wasilOffset.current - 260),
        animated: true,
      });
    }, 120);
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoiding}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <PrayerCard />
          <HomeAnnouncementBanner />
          <View
            onLayout={(event) => {
              wasilOffset.current = event.nativeEvent.layout.y;
            }}
            style={styles.dashboard}
          >
            <DalilCard onPromptFocus={revealWasilInput} />
            <HomeShortcuts />
            <HomeGoalsSection />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      {showWelcome ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.welcomeOverlay,
            { opacity: welcomeOpacity },
          ]}
        >
          <Animated.View
            style={[
              styles.welcomeCard,
              { transform: [{ scale: welcomeScale }] },
            ]}
          >
            <View style={styles.welcomeIcon}>
              <Ionicons name="checkmark" size={34} color="#17131D" />
            </View>
            <Text style={styles.welcomeTitle}>Bienvenue dans OUMMAH</Text>
            <Text style={styles.welcomeText}>
              Votre profil est prêt. Qu’Allah mette de la baraka dans votre cheminement.
            </Text>
          </Animated.View>
        </Animated.View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  keyboardAvoiding: { flex: 1 },
  content: { paddingBottom: 12 },
  dashboard: {
    paddingTop: 12,
    paddingHorizontal: 11,
    backgroundColor: colors.background,
  },
  welcomeOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    backgroundColor: "rgba(7, 7, 14, 0.72)",
    zIndex: 20,
  },
  welcomeCard: {
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
    paddingHorizontal: 26,
    paddingVertical: 30,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(242, 190, 86, 0.42)",
    backgroundColor: "#18131F",
  },
  welcomeIcon: {
    width: 68,
    height: 68,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 34,
    backgroundColor: colors.goldLight,
  },
  welcomeTitle: {
    marginTop: 18,
    color: colors.goldLight,
    fontFamily: typography.serifMedium,
    fontSize: 25,
    textAlign: "center",
  },
  welcomeText: {
    marginTop: 10,
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
});
