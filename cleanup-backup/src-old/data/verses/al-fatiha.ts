export type Verse = {
  id: number;
  arabic: string;
  french: string;
};

export const AL_FATIHA_VERSES: Verse[] = [
  {
    id: 1,
    arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    french: 'Au nom d’Allah, le Tout Miséricordieux, le Très Miséricordieux.',
  },
  {
    id: 2,
    arabic: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
    french: 'Louange à Allah, Seigneur des mondes.',
  },
  {
    id: 3,
    arabic: 'الرَّحْمَٰنِ الرَّحِيمِ',
    french: 'Le Tout Miséricordieux, le Très Miséricordieux.',
  },
  {
    id: 4,
    arabic: 'مَالِكِ يَوْمِ الدِّينِ',
    french: 'Maître du Jour de la rétribution.',
  },
  {
    id: 5,
    arabic: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ',
    french: 'C’est Toi seul que nous adorons, et Toi seul dont nous implorons l’aide.',
  },
  {
    id: 6,
    arabic: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ',
    french: 'Guide-nous sur le chemin droit,',
  },
  {
    id: 7,
    arabic: 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ',
    french: 'le chemin de ceux que Tu as comblés de bienfaits, non de ceux qui ont encouru Ta colère, ni des égarés.',
  },
];
