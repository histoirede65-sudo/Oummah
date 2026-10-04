import { Ionicons } from "@expo/vector-icons";
import { usePathname } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { storageService } from "../core/storage/StorageService";
import { useI18n } from "../i18n";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";

type GuideSlide = {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  eyebrow?: string;
};

type GuideDefinition = {
  id: string;
  slides: readonly GuideSlide[];
};

const GUIDE_VERSION = 1;
const STORAGE_PREFIX = `oummah:first-visit-guide:v${GUIDE_VERSION}:`;

const APP_GUIDE: GuideDefinition = {
  id: "app",
  slides: [
    {
      eyebrow: "BIENVENUE DANS OUMMAH",
      title: "Tout votre quotidien, au même endroit",
      description:
        "Horaires de prière, Coran, apprentissage et outils du quotidien : OUMMAH rassemble l’essentiel sans vous laisser chercher seul.",
      icon: "sparkles-outline",
    },
    {
      eyebrow: "EXPLOREZ À VOTRE RYTHME",
      title: "De nombreux modules vous attendent",
      description:
        "Coran, Hadith, Hifz, Fiqh, histoires des prophètes, Sîra, invocations, Qibla, lieux halal et bien plus encore.",
      icon: "grid-outline",
    },
    {
      eyebrow: "UN PETIT GUIDE À CHAQUE NOUVEAUTÉ",
      title: "OUMMAH vous accompagne",
      description:
        "La première fois que vous ouvrirez un module, une courte présentation vous montrera ce que vous pouvez y faire. Elle ne s’affichera qu’une seule fois.",
      icon: "navigate-circle-outline",
    },
  ],
};

const MODULE_GUIDES: Record<string, GuideDefinition> = {
  "/notifications": {
    id: "notifications",
    slides: [{
      eyebrow: "CENTRE DE NOTIFICATIONS",
      title: "Choisissez les rappels qui vous accompagnent",
      description:
        "Retrouvez vos rappels OUMMAH et personnalisez ceux que vous souhaitez recevoir sur votre téléphone : prières, apprentissage et autres notifications utiles.",
      icon: "notifications-outline",
    }],
  },
  "/quran": {
    id: "quran",
    slides: [{
      eyebrow: "MODULE CORAN",
      title: "Lire, écouter et reprendre facilement",
      description:
        "Parcourez les sourates, écoutez vos récitateurs, utilisez les marque-pages et accédez directement au verset que vous cherchez.",
      icon: "book-outline",
    }],
  },
  "/listen": {
    id: "listen",
    slides: [{
      eyebrow: "ÉCOUTER LE CORAN",
      title: "Votre écoute, simplement",
      description:
        "Choisissez un récitateur, une sourate et laissez le lecteur vous accompagner, y compris lorsque votre téléphone est verrouillé.",
      icon: "headset-outline",
    }],
  },
  "/hadith": {
    id: "hadith",
    slides: [{
      eyebrow: "MODULE HADITH",
      title: "Explorer des hadiths avec leurs références",
      description:
        "Recherchez par thème ou recueil, ouvrez les références disponibles et retrouvez facilement vos lectures.",
      icon: "library-outline",
    }],
  },
  "/hadiths": {
    id: "hadith",
    slides: [{
      eyebrow: "MODULE HADITH",
      title: "Explorer des hadiths avec leurs références",
      description:
        "Recherchez par thème ou recueil, ouvrez les références disponibles et retrouvez facilement vos lectures.",
      icon: "library-outline",
    }],
  },
  "/dhikr": {
    id: "dhikr",
    slides: [{
      eyebrow: "MODULE DHIKR",
      title: "Gardez le rythme de vos rappels",
      description:
        "Utilisez le compteur, choisissez vos formules de dhikr et avancez à votre rythme au quotidien.",
      icon: "radio-button-on-outline",
    }],
  },
  "/hifz": {
    id: "hifz",
    slides: [{
      eyebrow: "MODULE HIFZ",
      title: "Mémoriser, répéter, réviser",
      description:
        "Choisissez une sourate, travaillez une plage de versets et retrouvez vos révisions du jour dans un parcours pensé pour la mémorisation.",
      icon: "school-outline",
    }],
  },
  "/dua": {
    id: "dua",
    slides: [{
      eyebrow: "MODULE DOU‘Ā",
      title: "Les invocations du quotidien",
      description:
        "Parcourez les invocations par situation et gardez sous la main celles dont vous avez besoin au bon moment.",
      icon: "heart-outline",
    }],
  },
  "/mosques": {
    id: "mosques",
    slides: [{
      eyebrow: "MODULE MOSQUÉES",
      title: "Trouvez une mosquée autour de vous",
      description:
        "Consultez les mosquées proches, leurs informations et, lorsqu’ils sont disponibles, leurs horaires de prière.",
      icon: "business-outline",
    }],
  },
  "/zawaj": {
    id: "zawaj",
    slides: [{
      eyebrow: "MODULE ZAWAJ",
      title: "Comprendre le mariage en Islam",
      description:
        "Retrouvez des repères structurés autour du mariage, de la préparation aux responsabilités de la vie conjugale.",
      icon: "people-outline",
    }],
  },
  "/zakat": {
    id: "zakat",
    slides: [{
      eyebrow: "MODULE ZAKAT",
      title: "Comprendre et calculer plus facilement",
      description:
        "Utilisez les outils disponibles pour vous repérer dans le calcul et consultez les explications associées.",
      icon: "calculator-outline",
    }],
  },
  "/calendar": {
    id: "calendar",
    slides: [{
      eyebrow: "CALENDRIER ISLAMIQUE",
      title: "Dates hégiriennes et événements",
      description:
        "Consultez le calendrier hégirien et retrouvez les principaux événements et rappels liés aux dates islamiques.",
      icon: "calendar-outline",
    }],
  },
  "/fiqh": {
    id: "fiqh",
    slides: [{
      eyebrow: "MODULE FIQH",
      title: "Des livres interactifs pour apprendre",
      description:
        "Entrez dans les grandes catégories du fiqh, ouvrez les chapitres puis avancez sujet par sujet avec les sources affichées.",
      icon: "book-outline",
    }],
  },
  "/prophets": {
    id: "prophets",
    slides: [{
      eyebrow: "HISTOIRES DES PROPHÈTES",
      title: "Lire, écouter et relier les histoires",
      description:
        "Découvrez les récits, écoutez les histoires complètes et explorez l’arbre des prophètes sans quitter le module.",
      icon: "git-network-outline",
    }],
  },
  "/sirah": {
    id: "sirah",
    slides: [{
      eyebrow: "SÎRA DU PROPHÈTE ﷺ",
      title: "Parcourir sa vie étape par étape",
      description:
        "Suivez les grandes périodes de la Sîra dans l’ordre et ouvrez chaque étape pour approfondir le récit et ses sources.",
      icon: "map-outline",
    }],
  },
  "/boycott": {
    id: "boycott",
    slides: [{
      eyebrow: "CONSOMMATION RESPONSABLE",
      title: "Scannez ou recherchez avant d’acheter",
      description:
        "Utilisez le scanner ou la recherche et consultez la méthodologie OUMMAH derrière les classifications affichées.",
      icon: "scan-outline",
    }],
  },
  "/99-names": {
    id: "99-names",
    slides: [{
      eyebrow: "LES NOMS D’ALLAH",
      title: "Découvrir et mémoriser",
      description:
        "Parcourez les Noms, ouvrez leur fiche et progressez à votre rythme dans leur apprentissage.",
      icon: "sparkles-outline",
    }],
  },
  "/prenoms": {
    id: "prenoms",
    slides: [{
      eyebrow: "MODULE PRÉNOMS",
      title: "Chercher un prénom et comprendre son sens",
      description:
        "Explorez les prénoms garçons et filles, recherchez rapidement un nom et consultez son sens, son origine et les informations disponibles.",
      icon: "person-outline",
    }],
  },
  "/names": {
    id: "prenoms",
    slides: [{
      eyebrow: "MODULE PRÉNOMS",
      title: "Chercher un prénom et comprendre son sens",
      description:
        "Explorez les prénoms garçons et filles, recherchez rapidement un nom et consultez son sens, son origine et les informations disponibles.",
      icon: "person-outline",
    }],
  },
  "/companions": {
    id: "companions",
    slides: [{
      eyebrow: "COMPAGNONS",
      title: "Découvrir celles et ceux qui ont accompagné le Prophète ﷺ",
      description:
        "Parcourez les biographies disponibles et ouvrez chaque fiche pour découvrir leur parcours.",
      icon: "people-circle-outline",
    }],
  },
  "/jumuah": {
    id: "jumuah",
    slides: [{
      eyebrow: "JUMU‘AH",
      title: "Préparer votre vendredi",
      description:
        "Retrouvez en un seul endroit les rappels et actions utiles pour accompagner votre journée du vendredi.",
      icon: "moon-outline",
    }],
  },
  "/pilgrimage": {
    id: "pilgrimage",
    slides: [{
      eyebrow: "HAJJ & ‘UMRA",
      title: "Votre pèlerinage, comme un livre",
      description:
        "Deux livres à suivre étape par étape, des compteurs pour le Tawâf, le Sa‘y et les Jamarât, et des réponses quand vous avez un doute.",
      icon: "walk-outline",
    }],
  },
  "/dreams": {
    id: "dreams",
    slides: [{
      eyebrow: "RÊVES",
      title: "Des repères avant toute interprétation",
      description:
        "Consultez les explications et précautions du module pour distinguer les différents types de rêves avec mesure.",
      icon: "cloudy-night-outline",
    }],
  },
  "/dalil": {
    id: "wasil",
    slides: [{
      eyebrow: "WASIL",
      title: "Posez votre question",
      description:
        "Écrivez votre question à Wasil. Lorsqu’une réponse religieuse est donnée, les références utilisées sont affichées lorsque disponibles.",
      icon: "chatbubble-ellipses-outline",
    }],
  },
};

function storageKey(id: string) {
  return `${STORAGE_PREFIX}${id}`;
}

export default function FirstVisitGuideHost({
  enabled = true,
}: {
  enabled?: boolean;
}) {
  const { t } = useI18n();
  const pathname = usePathname();
  const [guide, setGuide] = useState<GuideDefinition | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const requestIdRef = useRef(0);

  const candidate = useMemo(() => {
    if (!enabled) return null;
    if (pathname === "/") return APP_GUIDE;
    const moduleGuide = MODULE_GUIDES[pathname] ?? null;
    if (moduleGuide?.id !== "dhikr") return moduleGuide;
    return {
      ...moduleGuide,
      slides: moduleGuide.slides.map((slide) => ({
        ...slide,
        eyebrow: t("dhikr.guideEyebrow"),
        title: t("dhikr.guideTitle"),
        description: t("dhikr.guideDescription"),
      })),
    };
  }, [enabled, pathname, t]);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    setVisible(false);
    setSlideIndex(0);
    setGuide(null);

    if (!candidate) return;

    const timer = setTimeout(() => {
      void storageService
        .get<boolean>(storageKey(candidate.id))
        .then((seen) => {
          if (requestId !== requestIdRef.current || seen === true) return;
          setGuide(candidate);
          setVisible(true);
        })
        .catch(() => {
          // Une erreur de stockage ne doit pas bloquer l'accompagnement.
          if (requestId !== requestIdRef.current) return;
          setGuide(candidate);
          setVisible(true);
        });
    }, 650);

    return () => clearTimeout(timer);
  }, [candidate]);

  if (!guide) return null;

  const slide = guide.slides[slideIndex];
  const isLast = slideIndex >= guide.slides.length - 1;

  const closeGuide = async () => {
    setVisible(false);
    await storageService.set(storageKey(guide.id), true).catch(() => undefined);
    setGuide(null);
    setSlideIndex(0);
  };

  const next = () => {
    if (isLast) {
      void closeGuide();
      return;
    }
    setSlideIndex((current) => current + 1);
  };

  return (
    <Modal
      animationType="fade"
      onRequestClose={() => void closeGuide()}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.glow} />
          <View style={styles.iconWrap}>
            <Ionicons name={slide.icon} size={28} color={colors.goldLight} />
          </View>

          {slide.eyebrow ? (
            <Text style={styles.eyebrow}>{slide.eyebrow}</Text>
          ) : null}

          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.description}>{slide.description}</Text>

          {guide.slides.length > 1 ? (
            <View style={styles.dots}>
              {guide.slides.map((_, index) => (
                <View
                  key={`${guide.id}-${index}`}
                  style={[styles.dot, index === slideIndex && styles.dotActive]}
                />
              ))}
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            onPress={next}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>
              {guide.id === "dhikr"
                ? t("dhikr.guideDiscover")
                : isLast
                  ? "Découvrir"
                  : "Suivant"}
            </Text>
            <Ionicons
              name={isLast ? "checkmark" : "arrow-forward"}
              size={18}
              color="#17111C"
            />
          </Pressable>

          {guide.slides.length > 1 && !isLast ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => void closeGuide()}
              style={({ pressed }) => [
                styles.skipButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.skipText}>Passer le guide</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
    backgroundColor: "rgba(5, 3, 13, 0.82)",
  },
  card: {
    width: "100%",
    maxWidth: 390,
    overflow: "hidden",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(239, 190, 74, 0.42)",
    backgroundColor: "#17111F",
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 14 },
    elevation: 18,
  },
  glow: {
    position: "absolute",
    top: -90,
    width: 220,
    height: 180,
    borderRadius: 110,
    backgroundColor: "rgba(116, 47, 145, 0.22)",
  },
  iconWrap: {
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(239, 190, 74, 0.34)",
    backgroundColor: "rgba(82, 39, 101, 0.70)",
  },
  eyebrow: {
    marginTop: 17,
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 2.2,
    textAlign: "center",
  },
  title: {
    marginTop: 8,
    color: colors.text,
    fontFamily: typography.serifSemibold,
    fontSize: 25,
    lineHeight: 30,
    textAlign: "center",
  },
  description: {
    marginTop: 10,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  dots: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.20)",
  },
  dotActive: {
    width: 18,
    backgroundColor: colors.goldLight,
  },
  primaryButton: {
    width: "100%",
    minHeight: 50,
    marginTop: 22,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 18,
    backgroundColor: colors.goldLight,
  },
  primaryButtonText: {
    color: "#17111C",
    fontFamily: typography.sans,
    fontSize: 14,
    fontWeight: "800",
  },
  skipButton: {
    marginTop: 11,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  skipText: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 12,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.72,
  },
});
