import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useI18n, type TranslationKey } from '../../i18n';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

const SECTIONS: Array<{ icon: React.ComponentProps<typeof Ionicons>['name']; title: TranslationKey; text: TranslationKey }> = [
  {
    icon: 'document-text-outline' as const,
    title: "boycottMethod.s1Title",
    text: "boycottMethod.s1Text"
  },
  {
    icon: 'shield-outline' as const,
    title: "boycottMethod.s2Title",
    text: "boycottMethod.s2Text"
  },
  {
    icon: 'git-branch-outline' as const,
    title: "boycottMethod.s3Title",
    text: "boycottMethod.s3Text"
  },
  {
    icon: 'library-outline' as const,
    title: "boycottMethod.s4Title",
    text: "boycottMethod.s4Text"
  },
  {
    icon: 'checkmark-circle-outline' as const,
    title: "boycottMethod.s5Title",
    text: "boycottMethod.s5Text"
  },
  {
    icon: 'refresh-outline' as const,
    title: "boycottMethod.s6Title",
    text: "boycottMethod.s6Text"
  },
];

export default function BoycottMethodologyScreen() {
  const { t } = useI18n();
  return (
    <LinearGradient colors={['#090713', '#110A1B', '#090713']} style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={21} color={colors.goldLight} />
          </Pressable>
          <Text style={styles.headerTitle}>{t("additiveSheet.methodology")}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.hero}>
            <View style={styles.heroIcon}><Ionicons name="shield-checkmark-outline" size={26} color={colors.goldLight} /></View>
            <Text style={styles.kicker}>{t("boycottMethod.kicker")}</Text>
            <Text style={styles.title}>{t("boycottMethod.title")}</Text>
            <Text style={styles.subtitle}>{t("boycottMethod.subtitle")}</Text>
          </View>

          {SECTIONS.map((section) => (
            <View key={section.title} style={styles.card}>
              <View style={styles.cardIcon}><Ionicons name={section.icon} size={20} color={colors.goldLight} /></View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{t(section.title)}</Text>
                <Text style={styles.cardText}>{t(section.text)}</Text>
              </View>
            </View>
          ))}

          <View style={styles.warning}>
            <Ionicons name="alert-circle-outline" size={21} color="#E2BF72" />
            <Text style={styles.warningText}>{t("boycottMethod.warning")}</Text>
          </View>

          <Pressable onPress={() => router.push('/boycott/add')} style={styles.action}>
            <Ionicons name="create-outline" size={20} color="#17111C" />
            <Text style={styles.actionText}>{t("boycottMethod.report")}</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safe: { flex: 1 },
  header: { height: 58, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerButton: { width: 42, height: 42, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.045)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  headerSpacer: { width: 42 },
  headerTitle: { color: colors.text, fontFamily: typography.serifSemibold, fontSize: 22 },
  content: { paddingHorizontal: 16, paddingBottom: 44 },
  hero: { marginTop: 8, padding: 20, borderRadius: 28, backgroundColor: 'rgba(27,18,39,0.84)', borderWidth: 1, borderColor: 'rgba(221,183,101,0.18)' },
  heroIcon: { width: 48, height: 48, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(221,183,101,0.10)' },
  kicker: { marginTop: 14, color: colors.goldLight, fontFamily: typography.sans, fontSize: 10.5, fontWeight: '800', letterSpacing: 1.35 },
  title: { marginTop: 7, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 27, lineHeight: 32 },
  subtitle: { marginTop: 8, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 13, lineHeight: 20 },
  card: { marginTop: 11, padding: 15, borderRadius: 22, flexDirection: 'row', gap: 12, backgroundColor: 'rgba(255,255,255,0.035)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  cardIcon: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(221,183,101,0.09)' },
  cardBody: { flex: 1 },
  cardTitle: { color: colors.text, fontFamily: typography.sans, fontSize: 14, fontWeight: '800' },
  cardText: { marginTop: 5, color: colors.textMuted, fontFamily: typography.sans, fontSize: 12.2, lineHeight: 18.5 },
  warning: { marginTop: 15, padding: 15, borderRadius: 20, flexDirection: 'row', gap: 10, backgroundColor: 'rgba(226,191,114,0.07)', borderWidth: 1, borderColor: 'rgba(226,191,114,0.18)' },
  warningText: { flex: 1, color: '#CFC5D4', fontFamily: typography.sans, fontSize: 11.8, lineHeight: 18 },
  action: { marginTop: 16, minHeight: 54, borderRadius: 19, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 16, backgroundColor: colors.goldLight },
  actionText: { color: '#17111C', fontFamily: typography.sans, fontSize: 12.5, fontWeight: '900', textAlign: 'center' },
});
