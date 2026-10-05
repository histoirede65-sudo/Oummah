/** Modules shown on the home screen, in display order. "Tous les modules" lists the same two groups. */
export const HOME_ESSENTIALS = [
  {
    labelKey: "home.shortcutQuran",
    subtitleKey: "home.shortcutQuranSubtitle",
    route: "/quran",
    image: require("../../assets/images/home/shortcuts/quran-real.jpg"),
  },
  {
    labelKey: "home.shortcutHadith",
    subtitleKey: "home.shortcutHadithSubtitle",
    route: "/hadith",
    image: require("../../assets/images/home/shortcuts/hadith-premium.jpg"),
  },
  {
    labelKey: "home.shortcutDhikr",
    subtitleKey: "home.shortcutDhikrCounterSubtitle",
    route: "/dhikr",
    image: require("../../assets/images/home/shortcuts/dhikr-real.jpg"),
  },
  {
    labelKey: "home.shortcutHifz",
    subtitleKey: "home.shortcutHifzSubtitle",
    route: "/hifz",
    image: require("../../assets/images/home/shortcuts/hifz-real.jpg"),
  },
  {
    labelKey: "home.shortcutDua",
    subtitleKey: "home.shortcutDuaSubtitle",
    route: "/dua",
    image: require("../../assets/images/home/shortcuts/dua-real.jpg"),
  },
  {
    labelKey: "home.shortcutMosques",
    subtitleKey: "home.shortcutMosquesSubtitle",
    route: "/mosques",
    image: require("../../assets/images/mosques/mosque-hero-premium.jpg"),
  },
  {
    labelKey: "home.shortcutQibla",
    subtitleKey: "home.shortcutQiblaSubtitle",
    route: "/qibla",
    image: require("../../assets/images/home/shortcuts/qibla-real.jpg"),
  },
  {
    labelKey: "home.shortcutCalendar",
    subtitleKey: "home.shortcutCalendarSubtitle",
    route: "/calendar",
    image: require("../../assets/images/home/shortcuts/calendar-real.jpg"),
  },
  {
    labelKey: "home.shortcutZakat",
    subtitleKey: "home.shortcutZakatSubtitle",
    route: "/zakat",
    image: require("../../assets/images/dua/guides/debt.jpg"),
  },
  {
    labelKey: "home.shortcutZawaj",
    subtitleKey: "home.shortcutZawajSubtitle",
    route: "/zawaj",
    image: require("../../assets/images/dua/guides/marriage.jpg"),
  },
] as const;

export const HOME_DEEPER = [
  {
    labelKey: "home.moduleHalal",
    subtitleKey: "home.moduleHalalSubtitle",
    route: "/halal",
    image: require("../../assets/images/dua/guides/food.jpg"),
  },
  {
    labelKey: "home.moduleFiqh",
    subtitleKey: "home.moduleFiqhSubtitle",
    route: "/fiqh",
    image: require("../../assets/images/fiqh/fiqh-home.png"),
  },
  {
    labelKey: "home.moduleNamesAllah",
    subtitleKey: "home.moduleNamesAllahSubtitle",
    route: "/99-names",
    image: require("../../assets/images/home/shortcuts/allah-names-premium.png"),
  },
  {
    labelKey: "home.moduleProphets",
    subtitleKey: "home.moduleProphetsSubtitle",
    route: "/prophets",
    image: require("../../assets/images/prophets/prophets-home-premium.jpg"),
  },
  {
    labelKey: "home.moduleCompanions",
    subtitleKey: "home.moduleCompanionsSubtitle",
    route: "/companions",
    image: require("../../assets/images/home/shortcuts/companions-premium.png"),
  },
  {
    labelKey: "home.moduleSirah",
    subtitleKey: "home.moduleSirahSubtitle",
    route: "/sirah",
    image: require("../../assets/images/home/shortcuts/sirah-premium.png"),
  },
  {
    labelKey: "home.modulePilgrimage",
    subtitleKey: "home.modulePilgrimageSubtitle",
    route: "/pilgrimage",
    image: require("../../assets/images/home/shortcuts/pilgrimage-premium.png"),
  },
  {
    labelKey: "home.moduleNames",
    subtitleKey: "home.moduleNamesSubtitle",
    route: "/prenoms",
    image: require("../../assets/images/fiqh/family.png"),
  },
  {
    labelKey: "home.moduleAkhira",
    subtitleKey: "home.moduleAkhiraSubtitle",
    route: "/akhira",
    image: require("../../assets/images/dua/guides/sleep.jpg"),
  },
] as const;

export type HomeModule = (typeof HOME_ESSENTIALS)[number] | (typeof HOME_DEEPER)[number];
