/** Modules shown on the home screen, in display order. "Tous les modules" lists the same two groups. */
export const HOME_ESSENTIALS = [
  {
    labelKey: "home.shortcutQuran",
    subtitleKey: "home.shortcutQuranSubtitle",
    route: "/quran",
    image: require("../../assets/images/home/shortcuts/quran-real.webp"),
  },
  {
    labelKey: "home.shortcutHadith",
    subtitleKey: "home.shortcutHadithSubtitle",
    route: "/hadith",
    image: require("../../assets/images/home/shortcuts/hadith-premium.webp"),
  },
  {
    labelKey: "home.shortcutDhikr",
    subtitleKey: "home.shortcutDhikrCounterSubtitle",
    route: "/dhikr",
    image: require("../../assets/images/home/shortcuts/dhikr-real.webp"),
  },
  {
    labelKey: "home.shortcutHifz",
    subtitleKey: "home.shortcutHifzSubtitle",
    route: "/hifz",
    image: require("../../assets/images/home/shortcuts/hifz-real.webp"),
  },
  {
    labelKey: "home.shortcutDua",
    subtitleKey: "home.shortcutDuaSubtitle",
    route: "/dua",
    image: require("../../assets/images/home/shortcuts/dua-real.webp"),
  },
  {
    labelKey: "home.shortcutMosques",
    subtitleKey: "home.shortcutMosquesSubtitle",
    route: "/mosques",
    image: require("../../assets/images/mosques/mosque-hero-premium.webp"),
  },
  {
    labelKey: "home.shortcutQibla",
    subtitleKey: "home.shortcutQiblaSubtitle",
    route: "/qibla",
    image: require("../../assets/images/home/shortcuts/qibla-real.webp"),
  },
  {
    labelKey: "home.shortcutCalendar",
    subtitleKey: "home.shortcutCalendarSubtitle",
    route: "/calendar",
    image: require("../../assets/images/home/shortcuts/calendar-real.webp"),
  },
  {
    labelKey: "home.shortcutZakat",
    subtitleKey: "home.shortcutZakatSubtitle",
    route: "/zakat",
    image: require("../../assets/images/dua/guides/debt.webp"),
  },
  {
    labelKey: "home.shortcutZawaj",
    subtitleKey: "home.shortcutZawajSubtitle",
    route: "/zawaj",
    image: require("../../assets/images/dua/guides/marriage.webp"),
  },
] as const;

export const HOME_DEEPER = [
  {
    labelKey: "home.moduleHalal",
    subtitleKey: "home.moduleHalalSubtitle",
    route: "/halal",
    image: require("../../assets/images/dua/guides/food.webp"),
  },
  {
    labelKey: "home.moduleFiqh",
    subtitleKey: "home.moduleFiqhSubtitle",
    route: "/fiqh",
    image: require("../../assets/images/fiqh/fiqh-home.webp"),
  },
  {
    labelKey: "home.moduleNamesAllah",
    subtitleKey: "home.moduleNamesAllahSubtitle",
    route: "/99-names",
    image: require("../../assets/images/home/shortcuts/allah-names-premium.webp"),
  },
  {
    labelKey: "home.moduleProphets",
    subtitleKey: "home.moduleProphetsSubtitle",
    route: "/prophets",
    image: require("../../assets/images/prophets/prophets-home-premium.webp"),
  },
  {
    labelKey: "home.moduleCompanions",
    subtitleKey: "home.moduleCompanionsSubtitle",
    route: "/companions",
    image: require("../../assets/images/home/shortcuts/companions-premium.webp"),
  },
  {
    labelKey: "home.moduleSirah",
    subtitleKey: "home.moduleSirahSubtitle",
    route: "/sirah",
    image: require("../../assets/images/home/shortcuts/sirah-premium.webp"),
  },
  {
    labelKey: "home.modulePilgrimage",
    subtitleKey: "home.modulePilgrimageSubtitle",
    route: "/pilgrimage",
    image: require("../../assets/images/home/shortcuts/pilgrimage-premium.webp"),
  },
  {
    labelKey: "home.moduleNames",
    subtitleKey: "home.moduleNamesSubtitle",
    route: "/prenoms",
    image: require("../../assets/images/fiqh/family.webp"),
  },
  {
    labelKey: "home.moduleAkhira",
    subtitleKey: "home.moduleAkhiraSubtitle",
    route: "/akhira",
    image: require("../../assets/images/akhira/card.webp"),
  },
] as const;

export type HomeModule = (typeof HOME_ESSENTIALS)[number] | (typeof HOME_DEEPER)[number];
