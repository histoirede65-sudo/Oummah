import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import DalilCard from "../../components/DalilCard";
import HomeGoalsSection from "../../components/HomeGoalsSection";
import HomeShortcuts from "../../components/HomeShortcuts";
import PrayerCard from "../../components/PrayerCard";
import { colors } from "../../theme/colors";

export default function HomeScreen() {
  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <PrayerCard />
        <View style={styles.dashboard}>
          <DalilCard />
          <HomeShortcuts />
          <HomeGoalsSection />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 12 },
  dashboard: {
    paddingTop: 12,
    paddingHorizontal: 11,
    backgroundColor: colors.background,
  },
});
