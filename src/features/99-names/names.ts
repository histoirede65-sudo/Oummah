export type QuranReference = {
  surah: string;
  verse: string;
  note: string;
};

export type AllahName = {
  id: number;
  arabic: string;
  transliteration: string;
  translation: string;
  explanation: string;
  reflection: string;
  practice: string;
  quranReferences?: QuranReference[];
};

export const ALLAH_NAMES_SOURCE = {
  label: "Islamic Relief UK · contenu vérifié par un savant",
  reviewer: "Sheikh Dr. Saalim Al-Azhari",
  url: "https://www.islamic-relief.org.uk/resources/knowledge-base/99-names-of-allah/",
};

const rawNames = [
  ["الرَّحْمَنُ", "Ar-Raḥmān", "Le Tout Miséricordieux"],
  ["الرَّحِيمُ", "Ar-Raḥīm", "Le Très Miséricordieux"],
  ["الْمَلِكُ", "Al-Malik", "Le Souverain"],
  ["الْقُدُّوسُ", "Al-Quddūs", "Le Très Saint"],
  ["السَّلاَمُ", "As-Salām", "La Source de paix, Le Parfait"],
  ["الْمُؤْمِنُ", "Al-Mu’min", "Celui qui accorde la sécurité"],
  ["الْمُهَيْمِنُ", "Al-Muhaymin", "Le Protecteur, Le Gardien"],
  ["الْعَزِيزُ", "Al-‘Azīz", "Le Tout-Puissant"],
  ["الْجَبَّارُ", "Al-Jabbār", "Le Contraignant, Celui qui restaure"],
  ["الْمُتَكَبِّرُ", "Al-Mutakabbir", "Le Suprême, Le Majestueux"],
  ["الْخَالِقُ", "Al-Khāliq", "Le Créateur"],
  ["الْبَارِئُ", "Al-Bāri’", "Celui qui donne l’existence"],
  ["الْمُصَوِّرُ", "Al-Muṣawwir", "Celui qui façonne les formes"],
  ["الْغَفَّارُ", "Al-Ghaffār", "Celui qui pardonne sans cesse"],
  ["الْقَهَّارُ", "Al-Qahhār", "Le Dominateur suprême"],
  ["الْوَهَّابُ", "Al-Wahhāb", "Le Grand Donateur"],
  ["الرَّزَّاقُ", "Ar-Razzāq", "Le Pourvoyeur"],
  ["الْفَتَّاحُ", "Al-Fattāḥ", "Celui qui ouvre et accorde la victoire"],
  ["اَلْعَلِيْمُ", "Al-‘Alīm", "L’Omniscient"],
  ["الْقَابِضُ", "Al-Qābiḍ", "Celui qui retient"],
  ["الْبَاسِطُ", "Al-Bāsiṭ", "Celui qui étend"],
  ["الْخَافِضُ", "Al-Khāfiḍ", "Celui qui abaisse"],
  ["الرَّافِعُ", "Ar-Rāfi’", "Celui qui élève"],
  ["الْمُعِزُّ", "Al-Mu‘izz", "Celui qui honore"],
  ["ٱلْمُذِلُّ", "Al-Mudhill", "Celui qui humilie"],
  ["السَّمِيعُ", "As-Samī‘", "Celui qui entend tout"],
  ["الْبَصِيرُ", "Al-Baṣīr", "Celui qui voit tout"],
  ["الْحَكَمُ", "Al-Ḥakam", "Le Juge"],
  ["الْعَدْلُ", "Al-‘Adl", "Le Parfaitement Juste"],
  ["اللَّطِيفُ", "Al-Laṭīf", "Le Subtil, Le Très Doux"],
  ["الْخَبِيرُ", "Al-Khabīr", "Le Parfaitement Informé"],
  ["الْحَلِيمُ", "Al-Ḥalīm", "Le Très Clément"],
  ["الْعَظِيمُ", "Al-‘Aẓīm", "L’Immense, Le Magnifique"],
  ["الْغَفُورُ", "Al-Ghafūr", "Le Grand Pardonneur"],
  ["الشَّكُورُ", "Ash-Shakūr", "Celui qui récompense abondamment"],
  ["الْعَلِيُّ", "Al-‘Aliyy", "Le Très-Haut"],
  ["الْكَبِيرُ", "Al-Kabīr", "Le Très Grand"],
  ["الْحَفِيظُ", "Al-Ḥafīẓ", "Le Préservateur"],
  ["المُقيِت", "Al-Muqīt", "Le Nourricier, Le Soutien"],
  ["اﻟْﺣَسِيبُ", "Al-Ḥasīb", "Celui qui suffit et tient compte"],
  ["الْجَلِيلُ", "Al-Jalīl", "Le Majestueux"],
  ["الْكَرِيمُ", "Al-Karīm", "Le Très Généreux"],
  ["الرَّقِيبُ", "Ar-Raqīb", "Le Vigilant"],
  ["ٱلْمُجِيبُ", "Al-Mujīb", "Celui qui répond"],
  ["الْوَاسِعُ", "Al-Wāsi‘", "L’Immense, Celui qui embrasse toute chose"],
  ["الْحَكِيمُ", "Al-Ḥakīm", "Le Parfaitement Sage"],
  ["الْوَدُودُ", "Al-Wadūd", "Le Très Aimant"],
  ["الْمَجِيدُ", "Al-Majīd", "Le Glorieux"],
  ["الْبَاعِثُ", "Al-Bā‘ith", "Celui qui ressuscite"],
  ["الشَّهِيدُ", "Ash-Shahīd", "Le Témoin de toute chose"],
  ["الْحَقُّ", "Al-Ḥaqq", "La Vérité absolue"],
  ["الْوَكِيلُ", "Al-Wakīl", "Le Garant, Celui à qui l’on confie ses affaires"],
  ["الْقَوِيُّ", "Al-Qawiyy", "Le Très Fort"],
  ["الْمَتِينُ", "Al-Matīn", "L’Inébranlable"],
  ["الْوَلِيُّ", "Al-Waliyy", "Le Protecteur proche"],
  ["الْحَمِيدُ", "Al-Ḥamīd", "Le Digne de louange"],
  ["الْمُحْصِي", "Al-Muḥṣī", "Celui qui dénombre toute chose"],
  ["الْمُبْدِئُ", "Al-Mubdi’", "Celui qui initie la création"],
  ["ٱلْمُعِيدُ", "Al-Mu‘īd", "Celui qui ramène et restaure"],
  ["الْمُحْيِي", "Al-Muḥyī", "Celui qui donne la vie"],
  ["اَلْمُمِيتُ", "Al-Mumīt", "Celui qui donne la mort"],
  ["الْحَيُّ", "Al-Ḥayy", "Le Vivant"],
  ["الْقَيُّومُ", "Al-Qayyūm", "Celui qui subsiste par Lui-même et soutient toute chose"],
  ["الْوَاجِدُ", "Al-Wājid", "Celui qui ne manque de rien"],
  ["الْمَاجِدُ", "Al-Mājid", "L’Illustre, Le Magnifique"],
  ["الْواحِدُ", "Al-Wāḥid", "L’Unique"],
  ["اَلاَحَدُ", "Al-Aḥad", "L’Un, L’Absolument Unique"],
  ["الصَّمَدُ", "Aṣ-Ṣamad", "L’Absolu, Celui dont tous dépendent"],
  ["الْقَادِرُ", "Al-Qādir", "Le Tout-Capable"],
  ["الْمُقْتَدِرُ", "Al-Muqtadir", "Le Parfaitement Puissant"],
  ["الْمُقَدِّمُ", "Al-Muqaddim", "Celui qui fait avancer"],
  ["الْمُؤَخِّرُ", "Al-Mu’akhkhir", "Celui qui retarde"],
  ["الأوَّلُ", "Al-Awwal", "Le Premier"],
  ["الآخِرُ", "Al-Ākhir", "Le Dernier"],
  ["الظَّاهِرُ", "Aẓ-Ẓāhir", "Le Manifeste"],
  ["الْبَاطِنُ", "Al-Bāṭin", "Le Caché, Celui qui connaît l’invisible"],
  ["الْوَالِي", "Al-Wālī", "Le Gouverneur suprême"],
  ["الْمُتَعَالِي", "Al-Muta‘ālī", "Le Très Élevé"],
  ["الْبَرُّ", "Al-Barr", "La Source de toute bonté"],
  ["التَّوَابُ", "At-Tawwāb", "Celui qui accueille sans cesse le repentir"],
  ["الْمُنْتَقِمُ", "Al-Muntaqim", "Celui qui rétribue avec justice"],
  ["العَفُوُّ", "Al-‘Afūw", "Celui qui efface les fautes"],
  ["الرَّؤُوفُ", "Ar-Ra’ūf", "Le Très Compatissant"],
  ["مَالِكُ ٱلْمُلْكُ", "Mālik-ul-Mulk", "Le Maître de la royauté"],
  ["ذُوالْجَلاَلِ وَالإكْرَامِ", "Dhū-l-Jalāli wa-l-Ikrām", "Le Détenteur de la majesté et de la générosité"],
  ["الْمُقْسِطُ", "Al-Muqsiṭ", "Le Parfaitement Équitable"],
  ["الْجَامِعُ", "Al-Jāmi‘", "Le Rassembleur"],
  ["ٱلْغَنيُّ", "Al-Ghaniyy", "Celui qui se suffit à Lui-même"],
  ["ٱلْمُغْنِيُّ", "Al-Mughnī", "Celui qui enrichit"],
  ["اَلْمَانِعُ", "Al-Māni‘", "Celui qui empêche et protège"],
  ["الضَّارُّ", "Aḍ-Ḍārr", "Celui qui permet l’épreuve"],
  ["النَّافِعُ", "An-Nāfi‘", "Celui qui accorde le bienfait"],
  ["النُّورُ", "An-Nūr", "La Lumière"],
  ["الْهَادِي", "Al-Hādī", "Le Guide"],
  ["الْبَدِيعُ", "Al-Badī‘", "L’Incomparable Créateur"],
  ["اَلْبَاقِي", "Al-Bāqī", "L’Éternel, Celui qui demeure"],
  ["الْوَارِثُ", "Al-Wārith", "L’Héritier ultime"],
  ["الرَّشِيدُ", "Ar-Rashīd", "Le Guide vers la droiture"],
  ["الصَّبُورُ", "Aṣ-Ṣabūr", "Le Très Patient"],
] as const;

const reflectionByKeyword: Array<[string, string, string]> = [
  ["Miséricord", "Ce nom invite à ne jamais désespérer de la miséricorde d’Allah et à cultiver soi-même la compassion envers les créatures.", "Chercher la miséricorde d’Allah, revenir à Lui et faire preuve de douceur avec les autres."],
  ["Pard", "Ce nom rappelle l’immensité du pardon d’Allah et la nécessité de revenir sincèrement à Lui après une faute.", "Multiplier le repentir sincère, demander pardon et apprendre à pardonner lorsque cela est juste."],
  ["Cré", "Ce nom rappelle que toute existence, toute forme et toute capacité viennent d’Allah seul.", "Contempler la création avec gratitude et utiliser ses capacités dans ce qui est bon."],
  ["Guide", "Ce nom rappelle que la vraie guidance vient d’Allah et qu’elle doit être demandée avec humilité.", "Demander la guidance, rechercher la vérité et agir selon ce que l’on apprend."],
  ["Just", "Ce nom rappelle la perfection de la justice divine, sans erreur ni oppression.", "Être équitable dans ses paroles, ses jugements et ses relations, même lorsque c’est difficile."],
  ["Sage", "Ce nom enseigne que la sagesse d’Allah est parfaite, même lorsque nous ne comprenons pas immédiatement un événement.", "Cultiver la confiance en Allah tout en prenant les moyens licites et raisonnables."],
  ["Pourvoy", "Ce nom rappelle que les moyens de subsistance sont sous la maîtrise d’Allah.", "Travailler de manière licite, remercier pour ce qui est accordé et éviter l’angoisse excessive face au rizq."],
  ["Protect", "Ce nom rappelle qu’Allah protège, préserve et veille sur Ses serviteurs comme Il veut.", "Chercher la protection d’Allah par les invocations authentiques et agir avec prudence."],
  ["Unique", "Ce nom renforce le tawḥīd : Allah est unique, sans associé ni égal.", "Renouveler la sincérité dans l’adoration et diriger son cœur vers Allah seul."],
];

function buildReflection(translation: string) {
  const match = reflectionByKeyword.find(([keyword]) => translation.includes(keyword));
  if (match) return { reflection: match[1], practice: match[2] };
  return {
    reflection: `Méditer ce nom, c’est reconnaître qu’Allah est ${translation.toLowerCase()} d’une manière parfaite qui convient à Sa majesté.`,
    practice: "Faire grandir la connaissance d’Allah, L’invoquer par Ses beaux noms et laisser cette connaissance améliorer l’adoration et le comportement.",
  };
}

export const ALLAH_NAMES: AllahName[] = rawNames.map((name, index) => {
  const [arabic, transliteration, translation] = name;
  const { reflection, practice } = buildReflection(translation);
  return {
    id: index + 1,
    arabic,
    transliteration,
    translation,
    explanation: `${transliteration} exprime que seul Allah est ${translation.toLowerCase()} avec perfection, sans limite ni ressemblance avec les créatures. Ce nom aide à mieux connaître Allah et à orienter l’adoration vers Lui avec confiance, crainte révérencielle et espérance.`,
    reflection,
    practice,
  };
});

export const ALLAH_NAMES_FOUNDATION = [
  {
    surah: "Al-A‘rāf",
    verse: "7:180",
    note: "À Allah appartiennent les plus beaux noms : invoquez-Le par ces noms.",
  },
  {
    surah: "Ṭā-Hā",
    verse: "20:8",
    note: "Allah, nulle divinité en dehors de Lui. À Lui appartiennent les plus beaux noms.",
  },
];

export function getAllahName(id: number) {
  return ALLAH_NAMES.find((name) => name.id === id);
}
