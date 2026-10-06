import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useI18n, type TranslationKey } from '../i18n';

const BENEFITS = [
  { icon: 'shield-checkmark-outline' as const, title: "zawaj.b1Title", text: "zawaj.b1Text" },
  { icon: 'heart-outline' as const, title: "zawaj.b2Title", text: "zawaj.b2Text" },
  { icon: 'people-outline' as const, title: "zawaj.b3Title", text: "zawaj.b3Text" },
  { icon: 'leaf-outline' as const, title: "zawaj.b4Title", text: "zawaj.b4Text" },
];

const VERSES = [
  {
    reference: 'Ar-Rûm · 30:21',
    text: "zawaj.v1",
  },
  {
    reference: 'An-Nûr · 24:32',
    text: "zawaj.v2",
  },
  {
    reference: 'Al-Baqara · 2:187',
    text: "zawaj.v3",
  },
];

const HADITHS = [
  {
    text: "zawaj.h1",
    source: "zawaj.h1Source",
  },
  {
    text: "zawaj.h2",
    source: "zawaj.h2Source",
  },
];


const STORIES = [
  {
    icon: 'rose-outline' as const,
    title: "zawaj.s1Title",
    subtitle: "zawaj.s1Subtitle",
    story: "zawaj.s1Story",
    lesson: "zawaj.s1Lesson",
    reference: "zawaj.s1Ref",
  },
  {
    icon: 'home-outline' as const,
    title: "zawaj.s2Title",
    subtitle: "zawaj.s2Subtitle",
    story: "zawaj.s2Story",
    lesson: "zawaj.s2Lesson",
    reference: "zawaj.s2Ref",
  },
  {
    icon: 'water-outline' as const,
    title: "zawaj.s3Title",
    subtitle: "zawaj.s3Subtitle",
    story: "zawaj.s3Story",
    lesson: "zawaj.s3Lesson",
    reference: 'Al-Qasas · 28:23–28',
  },
  {
    icon: 'compass-outline' as const,
    title: "zawaj.s4Title",
    subtitle: "zawaj.s4Subtitle",
    story: "zawaj.s4Story",
    lesson: "zawaj.s4Lesson",
    reference: "zawaj.s4Ref",
  },
];

const BLESSED_HOME = [
  {
    icon: 'heart-outline' as const,
    title: "zawaj.f1Title",
    text: "zawaj.f1Text",
    reference: 'Ar-Rûm · 30:21',
  },
  {
    icon: 'refresh-outline' as const,
    title: "zawaj.f2Title",
    text: "zawaj.f2Text",
    reference: 'Ash-Shûrâ · 42:40',
  },
  {
    icon: 'sparkles-outline' as const,
    title: "zawaj.f3Title",
    text: "zawaj.f3Text",
    reference: 'Ibrâhîm · 14:7',
  },
  {
    icon: 'chatbubbles-outline' as const,
    title: "zawaj.f4Title",
    text: "zawaj.f4Text",
    reference: 'Ash-Shûrâ · 42:38',
  },
  {
    icon: 'school-outline' as const,
    title: "zawaj.f5Title",
    text: "zawaj.f5Text",
    reference: 'At-Tahrîm · 66:6',
  },
];

const ADVICE = [
  "zawaj.a1",
  "zawaj.a2",
  "zawaj.a3",
  "zawaj.a4",
];

export default function ZawajScreen() {
  const { t } = useI18n();
  const [openStory, setOpenStory] = useState<number | null>(0);
  const openNourAlZawaj = async () => {
    const url = 'https://nouralzawaj.com';
    // No canOpenURL check: on Android 11+ it answers false for web links unless the app declares them,
    // and the button then did nothing. Open the site in the in-app browser, or the default browser.
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch {
      await Linking.openURL(url).catch(() => undefined);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Image
            source={require('../assets/images/dua/guides/marriage.jpg')}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
          <LinearGradient
            colors={['rgba(5,24,22,0.20)', 'rgba(5,24,22,0.74)', '#071F1D']}
            locations={[0, 0.58, 1]}
            style={StyleSheet.absoluteFill}
          />
          <SafeAreaView edges={['top']} style={styles.safeHeader}>
            <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
            </Pressable>
          </SafeAreaView>

          <View style={styles.heroCopy}>
            <View style={styles.eyebrow}>
              <Ionicons name="heart" size={13} color="#F3D797" />
              <Text style={styles.eyebrowText}>{t("zawaj.eyebrow")}</Text>
            </View>
            <Text style={styles.heroTitle}>Zawaj</Text>
            <Text style={styles.heroSubtitle}>{t("zawaj.subtitle")}</Text>


          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.introCard}>
            <View style={styles.quoteMark}>
              <Ionicons name="sparkles" size={18} color="#D8B767" />
            </View>
            <Text style={styles.introTitle}>{t("zawaj.introTitle")}</Text>
            <Text style={styles.introText}>{t('zawaj.introText')}</Text>
          </View>

          <Pressable
            accessibilityRole="link"
            accessibilityLabel={t("zawaj.nourA11y")}
            onPress={openNourAlZawaj}
            style={({ pressed }) => [styles.heroNourCard, styles.bodyNourCard, pressed && styles.heroNourCardPressed]}
          >
            <View style={styles.heroNourIcon}>
              <Ionicons name="people-outline" size={24} color="#17312E" />
            </View>
            <View style={styles.heroNourContent}>
              <Text style={styles.heroNourKicker}>NOUR AL ZAWAJ</Text>
              <Text style={styles.heroNourTitle}>{t("zawaj.nourTitle")}</Text>
              <Text style={styles.heroNourText}>{t("zawaj.nourText")}</Text>
            </View>
            <View style={styles.heroNourArrow}>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </View>
          </Pressable>

          <SectionHeader eyebrow={t('zawaj.whyEyebrow')} title={t('zawaj.whyTitle')} />
          <View style={styles.benefitsGrid}>
            {BENEFITS.map((benefit) => (
              <View key={benefit.title} style={styles.benefitCard}>
                <View style={styles.iconCircle}>
                  <Ionicons name={benefit.icon} size={22} color="#D8B767" />
                </View>
                <Text style={styles.benefitTitle}>{t(benefit.title as TranslationKey)}</Text>
                <Text style={styles.benefitText}>{t(benefit.text as TranslationKey)}</Text>
              </View>
            ))}
          </View>

          <SectionHeader eyebrow={t('zawaj.versesEyebrow')} title={t('zawaj.versesTitle')} />
          {VERSES.map((verse, index) => (
            <View key={verse.reference} style={styles.scriptureCard}>
              <View style={styles.scriptureTopline}>
                <Text style={styles.scriptureIndex}>{String(index + 1).padStart(2, '0')}</Text>
                <Text style={styles.scriptureReference}>{verse.reference}</Text>
              </View>
              <Text style={styles.scriptureText}>« {t(verse.text as TranslationKey)} »</Text>
            </View>
          ))}

          <SectionHeader eyebrow={t('zawaj.hadithEyebrow')} title={t('zawaj.hadithTitle')} />
          {HADITHS.map((hadith) => (
            <View key={hadith.text} style={styles.hadithCard}>
              <View style={styles.hadithAccent} />
              <View style={styles.hadithContent}>
                <Text style={styles.hadithText}>« {t(hadith.text as TranslationKey)} »</Text>
                <Text style={styles.hadithSource}>{t(hadith.source as TranslationKey)}</Text>
              </View>
            </View>
          ))}

          <SectionHeader eyebrow={t('zawaj.storiesEyebrow')} title={t('zawaj.storiesTitle')} />
          <Text style={styles.sectionIntro}>{t('zawaj.storiesIntro')}</Text>
          <View style={styles.storiesList}>
            {STORIES.map((story, index) => {
              const isOpen = openStory === index;
              return (
                <Pressable
                  key={story.title}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: isOpen }}
                  onPress={() => setOpenStory(isOpen ? null : index)}
                  style={[styles.storyCard, isOpen && styles.storyCardOpen]}
                >
                  <View style={styles.storyHeader}>
                    <View style={styles.storyIcon}>
                      <Ionicons name={story.icon} size={22} color="#D8B767" />
                    </View>
                    <View style={styles.storyHeading}>
                      <Text style={styles.storyTitle}>{t(story.title as TranslationKey)}</Text>
                      <Text style={styles.storySubtitle}>{t(story.subtitle as TranslationKey)}</Text>
                    </View>
                    <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={19} color="#C8A45B" />
                  </View>
                  {isOpen && (
                    <View style={styles.storyExpanded}>
                      <Text style={styles.storyText}>{t(story.story as TranslationKey)}</Text>
                      <View style={styles.lessonBox}>
                        <Text style={styles.lessonLabel}>{t("zawaj.remember")}</Text>
                        <Text style={styles.lessonText}>{t(story.lesson as TranslationKey)}</Text>
                      </View>
                      <Text style={styles.storyReference}>{t(story.reference as TranslationKey)}</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          <SectionHeader eyebrow={t('zawaj.duaEyebrow')} title={t('zawaj.duaTitle')} />
          <LinearGradient colors={['#173A35', '#0F2D29']} style={styles.duaCard}>
            <Text style={styles.arabic}>
              رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ وَاجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا
            </Text>
            <View style={styles.divider} />
            <Text style={styles.phonetic}>
              Rabbanâ hab lanâ min azwâjinâ wa dhurriyyâtinâ qurrata a‘yunin waj‘alnâ lil-muttaqîna imâmâ.
            </Text>
            <Text style={styles.translation}>{t('zawaj.duaTranslation')}</Text>
            <Text style={styles.duaReference}>Al-Furqân · 25:74</Text>
          </LinearGradient>

          <SectionHeader eyebrow={t('zawaj.adviceEyebrow')} title={t('zawaj.adviceTitle')} />
          <View style={styles.adviceCard}>
            {ADVICE.map((item, index) => (
              <View key={item} style={[styles.adviceRow, index === ADVICE.length - 1 && styles.adviceRowLast]}>
                <View style={styles.adviceNumber}><Text style={styles.adviceNumberText}>{index + 1}</Text></View>
                <Text style={styles.adviceText}>{t(item as TranslationKey)}</Text>
              </View>
            ))}
          </View>

          <SectionHeader eyebrow={t('zawaj.dailyEyebrow')} title={t('zawaj.dailyTitle')} />
          <Text style={styles.sectionIntro}>{t('zawaj.dailyIntro')}</Text>
          <View style={styles.homeFoundations}>
            {BLESSED_HOME.map((item) => (
              <View key={item.title} style={styles.foundationCard}>
                <View style={styles.foundationIcon}>
                  <Ionicons name={item.icon} size={20} color="#17312E" />
                </View>
                <View style={styles.foundationContent}>
                  <Text style={styles.foundationTitle}>{t(item.title as TranslationKey)}</Text>
                  <Text style={styles.foundationText}>{t(item.text as TranslationKey)}</Text>
                  <Text style={styles.foundationReference}>{item.reference}</Text>
                </View>
              </View>
            ))}
          </View>

          <LinearGradient colors={['#C8A45B', '#E6CF94']} style={styles.ctaCard}>
            <View style={styles.ctaIcon}>
              <Ionicons name="heart-circle-outline" size={28} color="#17312E" />
            </View>
            <Text style={styles.ctaKicker}>NOUR AL ZAWAJ</Text>
            <Text style={styles.ctaTitle}>{t("zawaj.ctaTitle")}</Text>
            <Text style={styles.ctaDescription}>{t('zawaj.ctaText')}</Text>
            <Pressable accessibilityRole="link" onPress={openNourAlZawaj} style={styles.ctaButton}>
              <Text style={styles.ctaButtonText}>{t("zawaj.ctaButton")}</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </Pressable>
          </LinearGradient>
        </View>
      </ScrollView>
    </View>
  );
}

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionEyebrow}>{eyebrow}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#071F1D' },
  content: { paddingBottom: 44 },
  hero: { minHeight: 520, justifyContent: 'space-between', overflow: 'hidden' },
  safeHeader: { paddingHorizontal: 18 },
  backButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(6,27,25,0.58)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)' },
  heroCopy: { paddingHorizontal: 22, paddingBottom: 26 },
  eyebrow: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: 'rgba(9,34,31,0.70)', borderWidth: 1, borderColor: 'rgba(243,215,151,0.26)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, marginBottom: 13 },
  eyebrowText: { color: '#F3D797', fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  heroTitle: { color: '#FFFFFF', fontFamily: 'CormorantGaramond-SemiBold', fontSize: 54, lineHeight: 58 },
  heroSubtitle: { color: 'rgba(255,255,255,0.86)', fontSize: 17, lineHeight: 24, maxWidth: 330, marginTop: 4 },
  heroNourCard: { marginTop: 22, minHeight: 132, borderRadius: 24, padding: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(242,235,221,0.96)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.72)' },
  heroNourCardPressed: { opacity: 0.92, transform: [{ scale: 0.992 }] },
  bodyNourCard: { marginTop: 18, marginBottom: 4 },
  heroNourIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#DFC786', marginRight: 13 },
  heroNourContent: { flex: 1, paddingRight: 10 },
  heroNourKicker: { color: '#8B6A2D', fontSize: 9, fontWeight: '900', letterSpacing: 1.25, marginBottom: 4 },
  heroNourTitle: { color: '#17312E', fontSize: 16, fontWeight: '900', lineHeight: 21 },
  heroNourText: { color: '#566762', fontSize: 12, lineHeight: 17, marginTop: 5 },
  heroNourArrow: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: '#17312E' },
  body: { paddingHorizontal: 18 },
  introCard: { marginTop: -8, backgroundColor: '#102D2A', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: 'rgba(216,183,103,0.18)' },
  quoteMark: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(216,183,103,0.11)', marginBottom: 13 },
  introTitle: { color: '#FFFFFF', fontSize: 21, fontWeight: '800', marginBottom: 8 },
  introText: { color: '#C7D3D0', fontSize: 15, lineHeight: 23 },
  sectionHeader: { marginTop: 34, marginBottom: 14 },
  sectionEyebrow: { color: '#C8A45B', fontSize: 10, fontWeight: '900', letterSpacing: 1.35, marginBottom: 5 },
  sectionTitle: { color: '#F8FAF9', fontFamily: 'CormorantGaramond-SemiBold', fontSize: 29, lineHeight: 33 },
  benefitsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  benefitCard: { width: '48.5%', minHeight: 178, backgroundColor: '#0E2926', borderRadius: 20, padding: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  iconCircle: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(216,183,103,0.10)', marginBottom: 15 },
  benefitTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', marginBottom: 7 },
  benefitText: { color: '#AEBFBB', fontSize: 13, lineHeight: 19 },
  scriptureCard: { backgroundColor: '#F2EBDD', borderRadius: 22, padding: 18, marginBottom: 11 },
  scriptureTopline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 },
  scriptureIndex: { color: 'rgba(23,49,46,0.32)', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  scriptureReference: { color: '#8B6A2D', fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
  scriptureText: { color: '#17312E', fontFamily: 'CormorantGaramond-Medium', fontSize: 21, lineHeight: 29 },
  hadithCard: { flexDirection: 'row', backgroundColor: '#0E2926', borderRadius: 20, overflow: 'hidden', marginBottom: 11, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  hadithAccent: { width: 4, backgroundColor: '#C8A45B' },
  hadithContent: { flex: 1, padding: 18 },
  hadithText: { color: '#F6F8F7', fontSize: 15, lineHeight: 23 },
  hadithSource: { color: '#C8A45B', fontSize: 11, fontWeight: '800', marginTop: 11 },
  duaCard: { borderRadius: 24, padding: 21, borderWidth: 1, borderColor: 'rgba(216,183,103,0.18)' },
  arabic: { color: '#FFFFFF', fontFamily: 'UthmanicHafs', fontSize: 27, lineHeight: 46, textAlign: 'right', writingDirection: 'rtl' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.10)', marginVertical: 18 },
  phonetic: { color: '#E6D3A7', fontSize: 14, fontStyle: 'italic', lineHeight: 22 },
  translation: { color: '#C6D2CF', fontSize: 14, lineHeight: 22, marginTop: 10 },
  duaReference: { color: '#C8A45B', fontSize: 11, fontWeight: '900', marginTop: 13 },
  adviceCard: { backgroundColor: '#0E2926', borderRadius: 22, paddingHorizontal: 17, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  adviceRow: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)' },
  adviceRowLast: { borderBottomWidth: 0 },
  adviceNumber: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(200,164,91,0.12)' },
  adviceNumberText: { color: '#D8B767', fontWeight: '900', fontSize: 12 },
  adviceText: { flex: 1, color: '#D6DFDD', fontSize: 14, lineHeight: 21 },

  sectionIntro: { color: '#AEBFBB', fontSize: 14, lineHeight: 21, marginTop: -7, marginBottom: 14 },
  storiesList: { gap: 10 },
  storyCard: { backgroundColor: '#0E2926', borderRadius: 21, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  storyCardOpen: { borderColor: 'rgba(216,183,103,0.30)', backgroundColor: '#102F2B' },
  storyHeader: { flexDirection: 'row', alignItems: 'center' },
  storyIcon: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(216,183,103,0.11)', marginRight: 12 },
  storyHeading: { flex: 1, paddingRight: 8 },
  storyTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  storySubtitle: { color: '#AEBFBB', fontSize: 12, lineHeight: 17, marginTop: 3 },
  storyExpanded: { paddingTop: 15, marginTop: 15, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)' },
  storyText: { color: '#D6DFDD', fontSize: 14, lineHeight: 22 },
  lessonBox: { backgroundColor: 'rgba(200,164,91,0.10)', borderRadius: 15, padding: 13, marginTop: 13, borderWidth: 1, borderColor: 'rgba(200,164,91,0.15)' },
  lessonLabel: { color: '#C8A45B', fontSize: 9, fontWeight: '900', letterSpacing: 1.2, marginBottom: 5 },
  lessonText: { color: '#F0E8D6', fontSize: 13, lineHeight: 20 },
  storyReference: { color: '#829994', fontSize: 10, fontWeight: '700', marginTop: 11 },
  homeFoundations: { gap: 10 },
  foundationCard: { flexDirection: 'row', backgroundColor: '#F2EBDD', borderRadius: 21, padding: 16 },
  foundationIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#DFC786', marginRight: 13 },
  foundationContent: { flex: 1 },
  foundationTitle: { color: '#17312E', fontSize: 15, fontWeight: '900', marginBottom: 5 },
  foundationText: { color: '#4E5F5B', fontSize: 13, lineHeight: 19 },
  foundationReference: { color: '#8B6A2D', fontSize: 10, fontWeight: '900', marginTop: 8 },
  ctaCard: { marginTop: 34, borderRadius: 28, padding: 22 },
  ctaIcon: { width: 48, height: 48, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.34)', marginBottom: 18 },
  ctaKicker: { color: '#5D4820', fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  ctaTitle: { color: '#17312E', fontFamily: 'CormorantGaramond-SemiBold', fontSize: 31, lineHeight: 34, marginTop: 7 },
  ctaDescription: { color: '#4A482F', fontSize: 14, lineHeight: 21, marginTop: 9 },
  ctaButton: { marginTop: 20, minHeight: 52, borderRadius: 17, backgroundColor: '#17312E', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, paddingHorizontal: 18 },
  ctaButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
});
