import { Animated, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";

import DalilCard from "../../components/DalilCard";
import HomeGoalsSection from "../../components/HomeGoalsSection";
import HomeAnnouncementBanner from "../../components/HomeAnnouncementBanner";
import AllahNamesHomeSection from "../../components/AllahNamesHomeSection";
import HomeShortcuts from "../../components/HomeShortcuts";
import HomeDailyRow from "../../components/home/HomeDailyRow";
import PrayerCard from "../../components/PrayerCard";
import HomeTahajjudCard from "../../components/HomeTahajjudCard";
import type { MosquePrayerSchedule } from "../../features/mosques/data/mosquePrayerTimes";
import { saveTasbihPrayerSchedule } from "../../features/dhikr/TasbihStore";
import { useI18n } from "../../i18n";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

export default function HomeScreen() {
  const { t } = useI18n();
  const { width } = useWindowDimensions();
  const dashboardHorizontalPadding = width < 350 ? 7 : width < 390 ? 9 : width > 430 ? 16 : 11;
  const { welcome } = useLocalSearchParams<{ welcome?: string }>();
  const [showWelcome, setShowWelcome] = useState(false);
  const [prayerSchedule, setPrayerSchedule] = useState<MosquePrayerSchedule | null>(null);
  const welcomeOpacity = useRef(new Animated.Value(0)).current;
  const welcomeScale = useRef(new Animated.Value(0.88)).current;
  const scrollRef = useRef<ScrollView>(null);
  const dashboardOffset = useRef(0);
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
        y: Math.max(0, dashboardOffset.current + wasilOffset.current - 260),
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
          <PrayerCard onScheduleChange={(schedule) => {
            setPrayerSchedule(schedule);
            void saveTasbihPrayerSchedule(schedule).catch(() => undefined);
          }} />
          <HomeTahajjudCard schedule={prayerSchedule} />
          <HomeAnnouncementBanner />
          <View
            onLayout={(event) => {
              dashboardOffset.current = event.nativeEvent.layout.y;
            }}
            style={[styles.dashboard, { paddingHorizontal: dashboardHorizontalPadding }]}
          >
            <HomeDailyRow />
            <View
              onLayout={(event) => {
                wasilOffset.current = event.nativeEvent.layout.y;
              }}
            >
              <DalilCard onPromptFocus={revealWasilInput} />
            </View>
            <HomeShortcuts />
            <AllahNamesHomeSection />
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
            <Text style={styles.welcomeTitle}>{t("home.welcomeTitle")}</Text>
            <Text style={styles.welcomeText}>
              {t("home.welcomeText")}
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
    ...StyleSheet.absoluteFill,
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
