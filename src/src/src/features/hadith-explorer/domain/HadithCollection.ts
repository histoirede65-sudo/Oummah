export type HadithCollectionTheme = {
  id: string;
  name: string;
  icon: string;
  query: string;
};

export type HadithCollection = {
  id: string;
  name: string;
  arabicName: string;
  description: string;
  query: string;
  queryAliases?: readonly string[];
  tone: string;
  availability: "selection" | "dedicated";
};

export type HadithDocumentaryCategory = {
  id: string;
  name: string;
  hadithCount: number;
};

export const HADITH_COLLECTION_THEMES: readonly HadithCollectionTheme[] = [
  { id: "faith", name: "Foi et croyance", icon: "moon-outline", query: "foi croyance" },
  { id: "purification", name: "Purification", icon: "water-outline", query: "purification ablutions" },
  { id: "prayer", name: "Prière", icon: "sparkles-outline", query: "prière" },
  { id: "zakat", name: "Zakât et aumône", icon: "heart-outline", query: "zakat aumône charité" },
  { id: "fasting", name: "Jeûne", icon: "sunny-outline", query: "jeûne ramadan" },
  { id: "pilgrimage", name: "Pèlerinage", icon: "location-outline", query: "pèlerinage hajj omra" },
  { id: "family", name: "Famille et mariage", icon: "people-outline", query: "famille mariage époux enfants" },
  { id: "manners", name: "Comportement", icon: "leaf-outline", query: "comportement bonnes manières caractère" },
  { id: "knowledge", name: "Science et transmission", icon: "book-outline", query: "science savoir enseignement" },
  { id: "invocations", name: "Invocations", icon: "chatbubble-ellipses-outline", query: "invocation dhikr rappel" },
  { id: "transactions", name: "Commerce et relations", icon: "briefcase-outline", query: "commerce vente dette relations" },
  { id: "afterlife", name: "Au-delà", icon: "hourglass-outline", query: "mort résurrection paradis enfer" },
] as const;

export const HADITH_COLLECTIONS: readonly HadithCollection[] = [
  { id: "bukhari", name: "Sahih al-Bukhari", arabicName: "صحيح البخاري", description: "Hadiths référencés dans le recueil de l’imam al-Bukhari.", query: "al-Bukhari", queryAliases: ["Al-Bukhârî", "Al-Bûkhârî", "Al Bukhârî", "Al Bûkhârî", "Bukhari", "Bukhârî"], tone: "#A87245", availability: "selection" },
  { id: "muslim", name: "Sahih Muslim", arabicName: "صحيح مسلم", description: "Hadiths référencés dans le recueil de l’imam Muslim.", query: "Muslim", tone: "#567B72", availability: "selection" },
  { id: "abu-dawud", name: "Sunan Abu Dawud", arabicName: "سنن أبي داود", description: "Sélection issue des Sunan d’Abu Dawud.", query: "Abû Dâwud", queryAliases: ["Abu Dawud", "Abou Daoud", "Abu Daoud", "Sunan Abu Dawud", "Sunan Abi Dawud"], tone: "#6E628A", availability: "selection" },
  { id: "tirmidhi", name: "Jami‘ at-Tirmidhi", arabicName: "جامع الترمذي", description: "Sélection référencée du Jami‘ at-Tirmidhi.", query: "At-Tirmidhî", queryAliases: ["Tirmidhi", "At-Tirmidhi", "Jami at-Tirmidhi", "Jami Tirmidhi"], tone: "#977452", availability: "selection" },
  { id: "nasai", name: "Sunan an-Nasa’i", arabicName: "سنن النسائي", description: "Sélection référencée des Sunan an-Nasa’i.", query: "An-Nasâ'î", queryAliases: ["Nasa'i", "Nasai", "An-Nasai", "An-Nasa'i", "Sunan an-Nasa'i"], tone: "#47717F", availability: "selection" },
  { id: "ibn-majah", name: "Sunan Ibn Majah", arabicName: "سنن ابن ماجه", description: "Sélection référencée des Sunan Ibn Majah.", query: "Ibn Mâjah", queryAliases: ["Ibn Majah"], tone: "#7B5A75", availability: "selection" },
  { id: "riyad", name: "Riyad as-Salihin", arabicName: "رياض الصالحين", description: "Parcours thématique autour des vertus et du comportement.", query: "Riyadh Al-Salheen", queryAliases: ["Riyad as-Salihin", "Riyad Al-Salihin", "Riyad As-Salihin", "Riyad as Salihin", "Riyadh as Salihin", "Riyâd as-Sâlihîn", "Riyad al-Salihin", "Riyad Al Salihin", "Riyadh Al Salihin", "Riyadh as-Salihin", "Riyad As Salihin"], tone: "#65713E", availability: "selection" },
  { id: "adab", name: "Al-Adab al-Mufrad", arabicName: "الأدب المفرد", description: "Sélection autour de l’éthique et des relations.", query: "Al-adab Al-Mufrad", queryAliases: ["Al-Adab al-Mufrad", "Al-Adab Al-Mufrad", "Adab Al-Mufrad", "Al-Adab", "Al Adab Al Mufrad", "Al Adab al Mufrad", "Adab al-Mufrad"], tone: "#85584F", availability: "selection" },
  { id: "nawawi", name: "40 Hadiths d’an-Nawawi", arabicName: "الأربعون النووية", description: "Un parcours essentiel, présenté avec ses références vérifiables.", query: "Les 40 Hadiths d'An-Nawawî", queryAliases: ["An-Nawawî", "An-Nawawi"], tone: "#8F7A3F", availability: "selection" },
  { id: "ahmad", name: "Musnad Ahmad", arabicName: "Musnad Ahmad", description: "Hadiths référencés dans le Musnad de l’imam Ahmad.", query: "Ahmad", queryAliases: ["Musnad Ahmad", "Ahmad ibn Hanbal"], tone: "#6B637C", availability: "selection" },
] as const;

export function getHadithCollection(id?: string) {
  return HADITH_COLLECTIONS.find((collection) => collection.id === id);
}

export function getHadithCollectionTheme(id?: string) {
  return HADITH_COLLECTION_THEMES.find((theme) => theme.id === id);
}
