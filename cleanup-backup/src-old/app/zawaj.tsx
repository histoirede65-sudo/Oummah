import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

const BENEFITS = [
  { icon: 'shield-checkmark-outline' as const, title: 'Se préserver', text: 'Avancer dans un cadre licite et protéger sa pudeur.' },
  { icon: 'heart-outline' as const, title: 'Trouver la sérénité', text: 'Construire un foyer fondé sur l’affection et la miséricorde.' },
  { icon: 'people-outline' as const, title: 'Fonder une famille', text: 'Transmettre la foi, les valeurs et le bon comportement.' },
  { icon: 'leaf-outline' as const, title: 'Grandir ensemble', text: 'S’encourager dans le bien et progresser dans la foi.' },
];

const VERSES = [
  {
    reference: 'Ar-Rûm · 30:21',
    text: 'Et parmi Ses signes, Il a créé de vous, pour vous, des épouses afin que vous trouviez auprès d’elles la tranquillité, et Il a mis entre vous affection et miséricorde.',
  },
  {
    reference: 'An-Nûr · 24:32',
    text: 'Mariez les célibataires d’entre vous et les gens de bien parmi vos serviteurs et vos servantes.',
  },
  {
    reference: 'Al-Baqara · 2:187',
    text: 'Elles sont un vêtement pour vous et vous êtes un vêtement pour elles.',
  },
];

const HADITHS = [
  {
    text: 'Ô jeunes gens ! Que celui d’entre vous qui en a la capacité se marie, car cela aide davantage à baisser le regard et à préserver la chasteté.',
    source: 'Rapporté par Al-Bukhari et Muslim',
  },
  {
    text: 'Le meilleur d’entre vous est celui qui est le meilleur envers sa famille.',
    source: 'Rapporté par At-Tirmidhi',
  },
];


const STORIES = [
  {
    icon: 'rose-outline' as const,
    title: 'Khadija et le Prophète ﷺ',
    subtitle: 'Le soutien, la confiance et la loyauté',
    story: 'Khadija رضي الله عنها fut un soutien immense pour le Prophète ﷺ dès les premiers instants de la Révélation. Elle l’a rassuré, cru en lui et accompagné avec fidélité dans les épreuves.',
    lesson: 'Un foyer solide se construit lorsque chacun devient pour l’autre une source de paix, de confiance et de soutien dans le bien.',
    reference: 'Sîra · Début de la Révélation',
  },
  {
    icon: 'home-outline' as const,
    title: 'Ali et Fatima',
    subtitle: 'La simplicité, la pudeur et l’entraide',
    story: 'Le foyer de Ali et Fatima رضي الله عنهما était simple matériellement, mais riche de foi, d’efforts partagés et d’attachement à Allah.',
    lesson: 'La valeur d’un mariage ne dépend pas du luxe. Elle repose sur la foi, la patience, l’entraide et la gratitude.',
    reference: 'Récits authentiques de leur vie familiale',
  },
  {
    icon: 'water-outline' as const,
    title: 'Moussa à Madyan',
    subtitle: 'Le bon caractère avant les apparences',
    story: 'Après avoir aidé deux femmes avec pudeur et générosité, Moussa عليه السلام fut reconnu pour sa force et sa fiabilité. Ces qualités ouvrirent la voie à une proposition de mariage honorable.',
    lesson: 'Le comportement, la pudeur, la responsabilité et la confiance sont des fondations essentielles dans le choix d’un conjoint.',
    reference: 'Al-Qasas · 28:23–28',
  },
  {
    icon: 'compass-outline' as const,
    title: 'Choisir avec discernement',
    subtitle: 'La religion et le caractère comme repères',
    story: 'Les enseignements prophétiques invitent à regarder au-delà de l’apparence et du statut, en donnant une place centrale à la religion, au caractère et à la capacité d’assumer ses responsabilités.',
    lesson: 'Un bon choix se fait avec lucidité, consultation, vérification et confiance en Allah, sans idéaliser ni précipiter la décision.',
    reference: 'Enseignements prophétiques sur le choix du conjoint',
  },
];

const BLESSED_HOME = [
  {
    icon: 'heart-outline' as const,
    title: 'Affection et miséricorde',
    text: 'Entretenir la douceur, les gestes d’attention et la compassion, surtout lorsque la fatigue ou les difficultés apparaissent.',
    reference: 'Ar-Rûm · 30:21',
  },
  {
    icon: 'refresh-outline' as const,
    title: 'Patience et pardon',
    text: 'Ne pas laisser chaque erreur devenir une blessure durable. Savoir dialoguer, pardonner et rechercher la réconciliation.',
    reference: 'Ash-Shûrâ · 42:40',
  },
  {
    icon: 'sparkles-outline' as const,
    title: 'Gratitude',
    text: 'Reconnaître les efforts de son conjoint et exprimer sa gratitude protège le foyer de l’habitude et du mépris.',
    reference: 'Ibrâhîm · 14:7',
  },
  {
    icon: 'chatbubbles-outline' as const,
    title: 'Consultation',
    text: 'Les décisions importantes gagnent à être discutées avec respect, écoute et recherche sincère de l’intérêt du foyer.',
    reference: 'Ash-Shûrâ · 42:38',
  },
  {
    icon: 'school-outline' as const,
    title: 'Transmettre la foi',
    text: 'Faire du foyer un lieu où la prière, le bon comportement et l’amour d’Allah se transmettent naturellement aux enfants.',
    reference: 'At-Tahrîm · 66:6',
  },
];

const ADVICE = [
  'Renouveler son intention et rechercher la satisfaction d’Allah.',
  'Donner de l’importance à la religion et au bon comportement.',
  'Consulter les personnes sages et faire salat al-istikhara.',
  'Être honnête sur ses attentes et ne pas précipiter la décision.',
];

export default function ZawajScreen() {
  const [openStory, setOpenStory] = useState<number | null>(0);
  const openNourAlZawaj = async () => {
    const url = 'https://nouralzawaj.com';
    if (await Linking.canOpenURL(url)) await Linking.openURL(url);
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
              <Text style={styles.eyebrowText}>UN CHEMIN VERS LE MARIAGE</Text>
            </View>
            <Text style={styles.heroTitle}>Zawaj</Text>
            <Text style={styles.heroSubtitle}>Prépare ton cœur, ton intention et ton futur foyer.</Text>


          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.introCard}>
            <View style={styles.quoteMark}>
              <Ionicons name="sparkles" size={18} color="#D8B767" />
            </View>
            <Text style={styles.introTitle}>Le mariage en Islam</Text>
            <Text style={styles.introText}>
              Le mariage est un engagement, une protection et une source de sérénité. Il se construit avec une intention sincère, du respect et la volonté d’avancer ensemble vers le bien.
            </Text>
          </View>

          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Accéder à Nour Al Zawaj"
            onPress={openNourAlZawaj}
            style={({ pressed }) => [styles.heroNourCard, styles.bodyNourCard, pressed && styles.heroNourCardPressed]}
          >
            <View style={styles.heroNourIcon}>
              <Ionicons name="people-outline" size={24} color="#17312E" />
            </View>
            <View style={styles.heroNourContent}>
              <Text style={styles.heroNourKicker}>NOUR AL ZAWAJ</Text>
              <Text style={styles.heroNourTitle}>Rencontres sérieuses entre musulmans</Text>
              <Text style={styles.heroNourText}>Une plateforme dédiée au mariage, dans un cadre respectueux des valeurs islamiques.</Text>
            </View>
            <View style={styles.heroNourArrow}>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </View>
          </Pressable>

          <SectionHeader eyebrow="POURQUOI SE MARIER ?" title="Les bienfaits du mariage" />
          <View style={styles.benefitsGrid}>
            {BENEFITS.map((benefit) => (
              <View key={benefit.title} style={styles.benefitCard}>
                <View style={styles.iconCircle}>
                  <Ionicons name={benefit.icon} size={22} color="#D8B767" />
                </View>
                <Text style={styles.benefitTitle}>{benefit.title}</Text>
                <Text style={styles.benefitText}>{benefit.text}</Text>
              </View>
            ))}
          </View>

          <SectionHeader eyebrow="PAROLES D’ALLAH" title="Versets sur le mariage" />
          {VERSES.map((verse, index) => (
            <View key={verse.reference} style={styles.scriptureCard}>
              <View style={styles.scriptureTopline}>
                <Text style={styles.scriptureIndex}>{String(index + 1).padStart(2, '0')}</Text>
                <Text style={styles.scriptureReference}>{verse.reference}</Text>
              </View>
              <Text style={styles.scriptureText}>« {verse.text} »</Text>
            </View>
          ))}

          <SectionHeader eyebrow="PAROLES PROPHÉTIQUES" title="Hadiths essentiels" />
          {HADITHS.map((hadith) => (
            <View key={hadith.text} style={styles.hadithCard}>
              <View style={styles.hadithAccent} />
              <View style={styles.hadithContent}>
                <Text style={styles.hadithText}>« {hadith.text} »</Text>
                <Text style={styles.hadithSource}>{hadith.source}</Text>
              </View>
            </View>
          ))}

          <SectionHeader eyebrow="RÉCITS ET LEÇONS" title="Histoires inspirantes" />
          <Text style={styles.sectionIntro}>
            Des récits courts pour méditer sur les qualités qui font grandir un couple.
          </Text>
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
                      <Text style={styles.storyTitle}>{story.title}</Text>
                      <Text style={styles.storySubtitle}>{story.subtitle}</Text>
                    </View>
                    <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={19} color="#C8A45B" />
                  </View>
                  {isOpen && (
                    <View style={styles.storyExpanded}>
                      <Text style={styles.storyText}>{story.story}</Text>
                      <View style={styles.lessonBox}>
                        <Text style={styles.lessonLabel}>À RETENIR</Text>
                        <Text style={styles.lessonText}>{story.lesson}</Text>
                      </View>
                      <Text style={styles.storyReference}>{story.reference}</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          <SectionHeader eyebrow="INVOCATION" title="Demander un foyer béni" />
          <LinearGradient colors={['#173A35', '#0F2D29']} style={styles.duaCard}>
            <Text style={styles.arabic}>
              رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ وَاجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا
            </Text>
            <View style={styles.divider} />
            <Text style={styles.phonetic}>
              Rabbanâ hab lanâ min azwâjinâ wa dhurriyyâtinâ qurrata a‘yunin waj‘alnâ lil-muttaqîna imâmâ.
            </Text>
            <Text style={styles.translation}>
              Seigneur, accorde-nous en nos épouses et nos descendants la joie des yeux, et fais de nous un guide pour les pieux.
            </Text>
            <Text style={styles.duaReference}>Al-Furqân · 25:74</Text>
          </LinearGradient>

          <SectionHeader eyebrow="AVANT DE S’ENGAGER" title="Quelques repères" />
          <View style={styles.adviceCard}>
            {ADVICE.map((item, index) => (
              <View key={item} style={[styles.adviceRow, index === ADVICE.length - 1 && styles.adviceRowLast]}>
                <View style={styles.adviceNumber}><Text style={styles.adviceNumberText}>{index + 1}</Text></View>
                <Text style={styles.adviceText}>{item}</Text>
              </View>
            ))}
          </View>

          <SectionHeader eyebrow="AU QUOTIDIEN" title="Construire un foyer béni" />
          <Text style={styles.sectionIntro}>
            Cinq fondations simples à cultiver avec constance dans la vie de famille.
          </Text>
          <View style={styles.homeFoundations}>
            {BLESSED_HOME.map((item) => (
              <View key={item.title} style={styles.foundationCard}>
                <View style={styles.foundationIcon}>
                  <Ionicons name={item.icon} size={20} color="#17312E" />
                </View>
                <View style={styles.foundationContent}>
                  <Text style={styles.foundationTitle}>{item.title}</Text>
                  <Text style={styles.foundationText}>{item.text}</Text>
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
            <Text style={styles.ctaTitle}>Prêt à franchir une nouvelle étape ?</Text>
            <Text style={styles.ctaDescription}>
              Découvre une plateforme pensée pour les musulmans et musulmanes à la recherche d’un mariage sérieux.
            </Text>
            <Pressable accessibilityRole="link" onPress={openNourAlZawaj} style={styles.ctaButton}>
              <Text style={styles.ctaButtonText}>Découvrir Nour Al Zawaj</Text>
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
