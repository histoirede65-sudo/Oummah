export type HadithCollection = {
  id: string;
  name: string;
  arabicName: string;
  description: string;
  query: string;
  tone: string;
  availability: "selection" | "dedicated";
};

export const HADITH_COLLECTIONS: readonly HadithCollection[] = [
  { id: "bukhari", name: "Sahih al-Bukhari", arabicName: "صحيح البخاري", description: "Hadiths référencés dans le recueil de l’imam al-Bukhari.", query: "al-Bukhari", tone: "#A87245", availability: "selection" },
  { id: "muslim", name: "Sahih Muslim", arabicName: "صحيح مسلم", description: "Hadiths référencés dans le recueil de l’imam Muslim.", query: "Muslim", tone: "#567B72", availability: "selection" },
  { id: "abu-dawud", name: "Sunan Abu Dawud", arabicName: "سنن أبي داود", description: "Sélection issue des Sunan d’Abu Dawud.", query: "Abû Dâwud", tone: "#6E628A", availability: "selection" },
  { id: "tirmidhi", name: "Jami‘ at-Tirmidhi", arabicName: "جامع الترمذي", description: "Sélection référencée du Jami‘ at-Tirmidhi.", query: "At-Tirmidhî", tone: "#977452", availability: "selection" },
  { id: "nasai", name: "Sunan an-Nasa’i", arabicName: "سنن النسائي", description: "Sélection référencée des Sunan an-Nasa’i.", query: "An-Nasâ'î", tone: "#47717F", availability: "selection" },
  { id: "ibn-majah", name: "Sunan Ibn Majah", arabicName: "سنن ابن ماجه", description: "Sélection référencée des Sunan Ibn Majah.", query: "Ibn Mâjah", tone: "#7B5A75", availability: "selection" },
  { id: "riyad", name: "Riyad as-Salihin", arabicName: "رياض الصالحين", description: "Parcours thématique autour des vertus et du comportement.", query: "Riyâd", tone: "#65713E", availability: "selection" },
  { id: "adab", name: "Al-Adab al-Mufrad", arabicName: "الأدب المفرد", description: "Sélection autour de l’éthique et des relations.", query: "Al-Adab", tone: "#85584F", availability: "selection" },
  { id: "nawawi", name: "Les 40 de l’imam an-Nawawi", arabicName: "الأربعون النووية", description: "Un parcours essentiel, présenté avec ses références vérifiables.", query: "An-Nawawî", tone: "#8F7A3F", availability: "selection" },
] as const;

