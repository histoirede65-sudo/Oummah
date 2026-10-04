/**
 * Contenu religieux de l'espace Tahajjud : court, sourcé. Les numéros de hadiths suivent la
 * numérotation courante (Bukhari / Muslim : Fath al-Bari / ‘Abd al-Baqi).
 * À faire relire avant publication.
 */

export type Source = { arabic?: string; /** Phonetic transcription of the Arabic. */ phonetic?: string; text: string; source: string };

export type GuideStep = {
  id: string;
  icon: string;
  title: string;
  body: string;
  /** Sourced text shown under the step. */
  proof?: Source;
  tip?: string;
  action?: { label: string; route: string };
};

export type GuideTab = { id: 'understand' | 'pray' | 'tips'; label: string; intro: string; steps: GuideStep[] };

export const NIGHT_VERSES: Source[] = [
  {
    arabic: 'وَمِنَ ٱلَّيْلِ فَتَهَجَّدْ بِهِۦ نَافِلَةً لَّكَ عَسَىٰٓ أَن يَبْعَثَكَ رَبُّكَ مَقَامًا مَّحْمُودًا',
    phonetic: 'Wa mina-l-layli fa-tahajjad bihî nâfilatan lak, ‘asâ an yab‘athaka rabbuka maqâman mahmûdâ',
    text: 'Et de la nuit, consacre une partie à la prière (Tahajjud), une prière surérogatoire pour toi. Il se peut que ton Seigneur te ressuscite en une position de gloire.',
    source: 'Sourate Al-Isra, 17:79',
  },
  {
    arabic: 'تَتَجَافَىٰ جُنُوبُهُمْ عَنِ ٱلْمَضَاجِعِ يَدْعُونَ رَبَّهُمْ خَوْفًا وَطَمَعًا',
    phonetic: 'Tatajâfâ junûbuhum ‘ani-l-madâji‘i yad‘ûna rabbahum khawfan wa tama‘â',
    text: 'Ils s’arrachent de leurs lits pour invoquer leur Seigneur, par crainte et par espoir.',
    source: 'Sourate As-Sajda, 32:16',
  },
  {
    arabic: 'كَانُوا۟ قَلِيلًا مِّنَ ٱلَّيْلِ مَا يَهْجَعُونَ ۝ وَبِٱلْأَسْحَارِ هُمْ يَسْتَغْفِرُونَ',
    phonetic: 'Kânû qalîlan mina-l-layli mâ yahja‘ûn. Wa bi-l-ashâri hum yastaghfirûn',
    text: 'Ils dormaient peu la nuit, et aux dernières heures de la nuit, ils imploraient le pardon.',
    source: 'Sourate Adh-Dhariyat, 51:17-18',
  },
  {
    arabic: 'وَٱلَّذِينَ يَبِيتُونَ لِرَبِّهِمْ سُجَّدًا وَقِيَٰمًا',
    phonetic: 'Wa-lladhîna yabîtûna li-rabbihim sujjadan wa qiyâmâ',
    text: 'Et ceux qui passent la nuit prosternés et debout devant leur Seigneur.',
    source: 'Sourate Al-Furqan, 25:64',
  },
];

export const NIGHT_HADITHS: Source[] = [
  {
    text: 'Notre Seigneur descend chaque nuit au ciel de ce bas monde lorsqu’il reste le dernier tiers de la nuit, et Il dit : « Qui M’invoque, que Je lui réponde ? Qui Me demande, que Je lui donne ? Qui implore Mon pardon, que Je lui pardonne ? »',
    source: 'Al-Bukhari 1145, Muslim 758',
  },
  {
    text: 'La meilleure prière après les prières obligatoires est la prière de la nuit.',
    source: 'Muslim 1163',
  },
  {
    text: 'Les œuvres les plus aimées d’Allah sont les plus régulières, même si elles sont peu nombreuses.',
    source: 'Al-Bukhari 6464, Muslim 783',
  },
];

export const WAKING_DUA: Source = {
  arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ',
  phonetic: 'Al-hamdu lillâhi-lladhî ahyânâ ba‘da mâ amâtanâ wa ilayhi-n-nushûr',
  text: 'Louange à Allah qui nous a rendu la vie après nous avoir fait mourir, et c’est vers Lui que se fera la résurrection.',
  source: 'Al-Bukhari 6312',
};

export const NIGHT_DUAS: Source[] = [
  WAKING_DUA,
  {
    arabic: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، الْحَمْدُ لِلَّهِ، وَسُبْحَانَ اللَّهِ، وَلَا إِلَهَ إِلَّا اللَّهُ، وَاللَّهُ أَكْبَرُ، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ، اللَّهُمَّ اغْفِرْ لِي',
    phonetic: 'Lâ ilâha illa-llâhu wahdahu lâ sharîka lah, lahu-l-mulku wa lahu-l-hamd, wa huwa ‘alâ kulli shay’in qadîr. Al-hamdu lillâh, wa subhâna-llâh, wa lâ ilâha illa-llâh, wa-llâhu akbar, wa lâ hawla wa lâ quwwata illâ billâh. Allâhumma-ghfir lî',
    text: 'Celui qui se réveille la nuit et dit ces paroles puis « Ô Allah, pardonne-moi », ou invoque, est exaucé ; et s’il fait ses ablutions et prie, sa prière est acceptée.',
    source: 'Al-Bukhari 1154',
  },
  {
    arabic: 'اللَّهُمَّ اهْدِنِي فِيمَنْ هَدَيْتَ، وَعَافِنِي فِيمَنْ عَافَيْتَ، وَتَوَلَّنِي فِيمَنْ تَوَلَّيْتَ، وَبَارِكْ لِي فِيمَا أَعْطَيْتَ، وَقِنِي شَرَّ مَا قَضَيْتَ، فَإِنَّكَ تَقْضِي وَلَا يُقْضَى عَلَيْكَ، وَإِنَّهُ لَا يَذِلُّ مَنْ وَالَيْتَ، تَبَارَكْتَ رَبَّنَا وَتَعَالَيْتَ',
    phonetic: 'Allâhumma-hdinî fîman hadayt, wa ‘âfinî fîman ‘âfayt, wa tawallanî fîman tawallayt, wa bârik lî fîmâ a‘tayt, wa qinî sharra mâ qadayt, fa-innaka taqdî wa lâ yuqdâ ‘alayk, wa innahu lâ yadhillu man wâlayt, tabârakta rabbanâ wa ta‘âlayt',
    text: 'Ô Allah, guide-moi parmi ceux que Tu as guidés, préserve-moi parmi ceux que Tu as préservés, prends-moi sous Ta protection parmi ceux que Tu as pris sous Ta protection, bénis pour moi ce que Tu m’as donné, protège-moi du mal de ce que Tu as décrété… Béni sois-Tu, notre Seigneur, et exalté. (Qunut du Witr)',
    source: 'Abu Dawud 1425, At-Tirmidhi 464, An-Nasa’i 1745',
  },
  {
    arabic: 'سُبْحَانَ الْمَلِكِ الْقُدُّوسِ',
    phonetic: 'Subhâna-l-Maliki-l-Quddûs',
    text: 'Gloire au Roi, le Très-Saint. — trois fois, après le Witr.',
    source: 'Abu Dawud 1430, An-Nasa’i 1699',
  },
];

/** Passages to read at night, opened in OUMMAH's Quran (sourate, and first verse when relevant). */
export const NIGHT_READINGS: { id: string; title: string; reference: string; why: string; surah: number; verse?: number }[] = [
  { id: 'mulk', title: 'Al-Mulk', reference: 'Sourate 67', surah: 67, why: 'Le Prophète ﷺ ne dormait pas avant de l’avoir lue (At-Tirmidhi 2892).' },
  { id: 'sajda', title: 'As-Sajda', reference: 'Sourate 32', surah: 32, why: 'Lue chaque soir avec Al-Mulk (At-Tirmidhi 2892). « Ils s’arrachent de leurs lits… » (32:16).' },
  { id: 'imran', title: 'Fin d’Al ‘Imran', reference: '3:190-200', surah: 3, verse: 190, why: 'Récitée par le Prophète ﷺ en se réveillant la nuit (Al-Bukhari 4569).' },
  { id: 'baqara', title: 'Fin d’Al-Baqara', reference: '2:285-286', surah: 2, verse: 285, why: 'Ces deux versets suffisent à celui qui les récite la nuit (Al-Bukhari 5009, Muslim 807).' },
  { id: 'muzzammil', title: 'Al-Muzzammil', reference: 'Sourate 73', surah: 73, why: 'La sourate de la prière de la nuit : « Lève-toi la nuit, sauf une petite partie ».' },
  { id: 'isra', title: 'Al-Isra', reference: '17:78-82', surah: 17, verse: 78, why: 'Le verset de Tahajjud (17:79).' },
];

export const GUIDE: GuideTab[] = [
  {
    id: 'understand',
    label: 'Comprendre',
    intro: 'Une prière volontaire, la nuit, après un temps de sommeil. Le moment le plus précieux : le dernier tiers.',
    steps: [
      {
        id: 'what', icon: 'moon-outline', title: 'Qu’est-ce que Tahajjud ?',
        body: 'Le mot vient de « hujud », le sommeil : Tahajjud est la prière que l’on accomplit après s’être levé de son sommeil. Elle fait partie de la prière de la nuit (qiyam al-layl), qui se prie entre ‘Isha et Fajr.',
        proof: NIGHT_VERSES[0],
      },
      {
        id: 'when', icon: 'time-outline', title: 'Le dernier tiers de la nuit',
        body: 'La nuit va du coucher du soleil (Maghrib) à l’aube (Fajr). On la divise en trois : le dernier tiers est le moment où Allah descend au ciel de ce bas monde. OUMMAH le calcule chaque jour à partir de vos horaires.',
        proof: NIGHT_HADITHS[0],
        action: { label: 'Régler mon réveil', route: '/tahajjud/alarm' },
      },
      {
        id: 'virtue', icon: 'sparkles-outline', title: 'Sa valeur',
        body: 'C’est la meilleure prière après les prières obligatoires, et un moment d’intimité avec Allah, loin des regards.',
        proof: NIGHT_HADITHS[1],
      },
      {
        id: 'regular', icon: 'leaf-outline', title: 'Peu, mais régulier',
        body: 'Deux unités de prière suffisent pour commencer. Mieux vaut un peu chaque nuit que beaucoup une seule fois.',
        proof: NIGHT_HADITHS[2],
      },
    ],
  },
  {
    id: 'pray',
    label: 'Comment prier',
    intro: 'Six étapes simples, du réveil au Witr.',
    steps: [
      {
        id: 'wake', icon: 'alarm-outline', title: '1. Se réveiller',
        body: 'Au réveil, passez la main sur le visage pour chasser le sommeil, puis évoquez Allah.',
        proof: WAKING_DUA,
        tip: 'Le Prophète ﷺ nettoyait ses dents avec le siwak lorsqu’il se levait la nuit (Al-Bukhari 245, Muslim 255).',
      },
      {
        id: 'wudu', icon: 'water-outline', title: '2. Faire ses ablutions',
        body: 'Le sommeil annule les ablutions : faites un wudu complet, calmement. Le Shaytan noue trois nœuds sur la nuque du dormeur ; l’évocation d’Allah, les ablutions et la prière les défont un à un.',
        proof: { text: 'Le Shaytan noue trois nœuds sur la nuque de l’un de vous quand il dort… S’il se réveille et évoque Allah, un nœud se défait ; s’il fait ses ablutions, un autre se défait ; s’il prie, tous se défont.', source: 'Al-Bukhari 1142, Muslim 776' },
      },
      {
        id: 'start', icon: 'play-circle-outline', title: '3. Commencer par deux rak‘at légères',
        body: 'Ouvrez votre prière par deux unités courtes, puis priez deux par deux, à votre rythme.',
        proof: { text: 'Quand l’un de vous se lève la nuit, qu’il commence sa prière par deux rak‘at légères.', source: 'Muslim 768' },
      },
      {
        id: 'count', icon: 'layers-outline', title: '4. Combien de rak‘at ?',
        body: 'Il n’y a pas de nombre imposé : deux par deux, autant que vous le pouvez. Le Prophète ﷺ priait le plus souvent onze rak‘at, Witr compris.',
        proof: { text: 'Le Messager d’Allah ﷺ ne dépassait pas onze rak‘at, ni pendant le Ramadan ni en dehors.', source: '‘Aïcha · Al-Bukhari 1147, Muslim 738' },
      },
      {
        id: 'sujud', icon: 'heart-outline', title: '5. Prolonger la récitation et les prosternations',
        body: 'Récitez ce que vous connaissez, sans vous presser. Dans la prosternation, demandez à Allah tout ce dont vous avez besoin, dans votre langue en dehors de la prière obligatoire.',
        action: { label: 'Que réciter dans ma prière ?', route: '/tahajjud/recite' },
      },
      {
        id: 'witr', icon: 'star-outline', title: '6. Terminer par le Witr',
        body: 'Le Witr (une ou trois rak‘at) clôt la prière de la nuit. Après, dites trois fois « Subhana al-Malik al-Quddus ».',
        proof: { text: 'Faites du Witr la dernière de vos prières de la nuit.', source: 'Al-Bukhari 998, Muslim 751' },
      },
    ],
  },
  {
    id: 'tips',
    label: 'Conseils',
    intro: 'Pour se lever plus facilement, et sans culpabiliser.',
    steps: [
      {
        id: 'prepare', icon: 'bed-outline', title: 'Préparer ma nuit',
        body: 'Dormez tôt après ‘Isha, faites vos ablutions avant de vous coucher, formulez l’intention de vous lever et réglez votre réveil. Préparez aussi les invocations que vous voulez faire.',
        action: { label: 'Préparer mes duas', route: '/tahajjud/duas' },
      },
      {
        id: 'intention', icon: 'shield-checkmark-outline', title: 'L’intention compte déjà',
        body: 'Si vous vous couchez avec l’intention sincère de prier la nuit et que le sommeil l’emporte, la récompense de votre intention vous est inscrite.',
        proof: { text: 'Celui qui se couche avec l’intention de se lever pour prier la nuit, et que le sommeil l’emporte jusqu’au matin, il lui est inscrit ce qu’il avait l’intention de faire, et son sommeil est une aumône de la part de son Seigneur.', source: 'An-Nasa’i 1787, Ibn Majah 1344' },
      },
      {
        id: 'missed', icon: 'sunny-outline', title: 'Une nuit manquée ?',
        body: 'Le Prophète ﷺ, lorsqu’il manquait sa prière de nuit à cause d’une douleur ou d’autre chose, priait douze rak‘at dans la journée.',
        proof: { text: 'Lorsqu’il manquait sa prière de nuit à cause d’une douleur ou d’autre chose, il priait douze rak‘at dans la journée.', source: 'Muslim 746' },
      },
      {
        id: 'istighfar', icon: 'chatbubble-ellipses-outline', title: 'Le pardon avant l’aube',
        body: 'Les dernières heures de la nuit sont le moment de l’istighfar. Avant Fajr, prenez quelques minutes pour demander pardon et faire vos invocations.',
        proof: NIGHT_VERSES[2],
        action: { label: 'Ouvrir les duas', route: '/dua' },
      },
      {
        id: 'dhikr', icon: 'ellipse-outline', title: 'Après la prière',
        body: 'Restez un moment en dhikr, lisez quelques versets, puis reposez-vous avant Fajr si vous le souhaitez.',
        action: { label: 'Ouvrir le dhikr', route: '/dhikr' },
      },
    ],
  },
];

/** One sourced line per night, the same all night long. */
export function verseOfTheNight(nightKey: string): Source {
  const all = [...NIGHT_VERSES, ...NIGHT_HADITHS];
  const seed = [...nightKey].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return all[seed % all.length];
}
