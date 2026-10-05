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
    text: 'Et de la nuit consacre une partie [avant l’aube] pour des Salât surérogatoires : afin que ton Seigneur te ressuscite en une position de gloire.',
    source: 'Sourate Al-Isra, 17:79',
  },
  {
    arabic: 'تَتَجَافَىٰ جُنُوبُهُمْ عَنِ ٱلْمَضَاجِعِ يَدْعُونَ رَبَّهُمْ خَوْفًا وَطَمَعًا',
    phonetic: 'Tatajâfâ junûbuhum ‘ani-l-madâji‘i yad‘ûna rabbahum khawfan wa tama‘â',
    text: 'Ils s’arrachent de leurs lits pour invoquer leur Seigneur, par crainte et espoir.',
    source: 'Sourate As-Sajda, 32:16',
  },
  {
    arabic: 'كَانُوا۟ قَلِيلًا مِّنَ ٱلَّيْلِ مَا يَهْجَعُونَ ۝ وَبِٱلْأَسْحَارِ هُمْ يَسْتَغْفِرُونَ',
    phonetic: 'Kânû qalîlan mina-l-layli mâ yahja‘ûn. Wa bi-l-ashâri hum yastaghfirûn',
    text: 'Ils dormaient peu, la nuit, et aux dernières heures de la nuit ils imploraient le pardon [d’Allah].',
    source: 'Sourate Adh-Dhariyat, 51:17-18',
  },
  {
    arabic: 'وَٱلَّذِينَ يَبِيتُونَ لِرَبِّهِمْ سُجَّدًا وَقِيَٰمًا',
    phonetic: 'Wa-lladhîna yabîtûna li-rabbihim sujjadan wa qiyâmâ',
    text: '[Ceux] qui passent les nuits prosternés et debout devant leur Seigneur.',
    source: 'Sourate Al-Furqan, 25:64',
  },
];

export const NIGHT_HADITHS: Source[] = [
  {
    text: 'Notre Seigneur, le Béni, le Suprême, descend chaque nuit au ciel le plus proche de nous quand il ne reste qu’un tiers de la nuit, et Il dit : « Y a-t-il quelqu’un qui M’invoque pour que Je lui réponde ? Y a-t-il quelqu’un qui Me demande pour que Je lui accorde sa demande ? Y a-t-il quelqu’un qui cherche Mon pardon pour que Je lui pardonne ? »',
    source: 'Al-Bukhari 1145, Muslim 758',
  },
  {
    text: 'La meilleure prière après les prières obligatoires est la prière de nuit.',
    source: 'Muslim 1163',
  },
  {
    text: 'L’action la plus aimée d’Allah est celle qui est faite régulièrement, même si elle est petite.',
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
  { id: 'mulk', title: 'Al-Mulk', reference: 'Sourate 67', surah: 67, why: 'Le Prophète ﷺ ne dormait pas avant de l’avoir lue (At-Tirmidhi 3404).' },
  { id: 'sajda', title: 'As-Sajda', reference: 'Sourate 32', surah: 32, why: 'Le Prophète ﷺ ne dormait pas avant de l’avoir lue, avec Al-Mulk (At-Tirmidhi 3404).' },
  { id: 'imran', title: 'Fin d’Al ‘Imran', reference: '3:190-200', surah: 3, verse: 190, why: 'Récitée par le Prophète ﷺ en se réveillant la nuit (Al-Bukhari 4569).' },
  { id: 'baqara', title: 'Fin d’Al-Baqara', reference: '2:285-286', surah: 2, verse: 285, why: 'Ces deux versets suffisent à celui qui les récite la nuit (Al-Bukhari 5009, Muslim 807).' },
  { id: 'muzzammil', title: 'Al-Muzzammil', reference: 'Sourate 73', surah: 73, why: '« Lève-toi [pour prier], toute la nuit, excepté une petite partie » (73:2).' },
  { id: 'isra', title: 'Al-Isra', reference: '17:78-82', surah: 17, verse: 78, why: 'Le verset de Tahajjud (17:79).' },
];

export const GUIDE: GuideTab[] = [
  {
    id: 'understand',
    label: 'Comprendre',
    intro: 'Une prière volontaire, la nuit. Le dernier tiers de la nuit est le moment où Allah descend au ciel le plus proche.',
    steps: [
      {
        id: 'what', icon: 'moon-outline', title: 'Qu’est-ce que Tahajjud ?',
        body: 'C’est la prière surérogatoire de la nuit, mentionnée par le Coran. Le Prophète ﷺ priait la nuit entre ‘Isha et Fajr.',
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
        body: 'C’est la meilleure prière après les prières obligatoires.',
        proof: NIGHT_HADITHS[1],
      },
      {
        id: 'regular', icon: 'leaf-outline', title: 'Peu, mais régulier',
        body: 'L’action la plus aimée d’Allah est celle qui est faite régulièrement, même si elle est petite.',
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
        body: 'Au réveil, évoquez Allah avec l’invocation du réveil.',
        proof: WAKING_DUA,
        tip: 'Le Prophète ﷺ nettoyait ses dents avec le siwak lorsqu’il se levait la nuit (Al-Bukhari 245, Muslim 255).',
      },
      {
        id: 'wudu', icon: 'water-outline', title: '2. Faire ses ablutions',
        body: 'Le Shaytan noue trois nœuds sur la nuque du dormeur ; l’évocation d’Allah, les ablutions et la prière les défont un à un.',
        proof: { text: 'Satan fait trois nœuds à l’arrière de la tête de l’un de vous lorsqu’il dort. […] Quand on se réveille et qu’on se souvient d’Allah, un nœud se défait ; quand on fait les ablutions, un deuxième nœud se défait ; et quand on prie, le troisième nœud se défait.', source: 'Al-Bukhari 1142, Muslim 776' },
      },
      {
        id: 'start', icon: 'play-circle-outline', title: '3. Commencer par deux rak‘at légères',
        body: 'Ouvrez votre prière par deux unités courtes, puis priez deux par deux.',
        proof: { text: 'Lorsque l’un d’entre vous se lève la nuit, qu’il commence la prière par deux courtes unités de prière (rak‘a).', source: 'Muslim 768' },
      },
      {
        id: 'count', icon: 'layers-outline', title: '4. Combien de rak‘at ?',
        body: 'La prière de la nuit se fait deux par deux. Le Prophète ﷺ ne dépassait pas onze rak‘at, Witr compris.',
        proof: { text: 'Le Messager d’Allah (ﷺ) ne dépassait jamais onze unités de prière, que ce soit pendant le Ramadan ou en dehors.', source: '‘Aïcha · Al-Bukhari 1147, Muslim 738' },
      },
      {
        id: 'sujud', icon: 'heart-outline', title: '5. Prolonger la récitation et les prosternations',
        body: 'Le serviteur est au plus près de son Seigneur quand il est prosterné : multipliez-y les invocations (Muslim 482).',
        action: { label: 'Que réciter dans ma prière ?', route: '/tahajjud/recite' },
      },
      {
        id: 'witr', icon: 'star-outline', title: '6. Terminer par le Witr',
        body: 'Le Witr clôt la prière de la nuit. Après, dites trois fois « Subhana al-Malik al-Quddus ».',
        proof: { text: 'Faites du witr votre dernière prière de la nuit.', source: 'Al-Bukhari 998, Muslim 751' },
      },
    ],
  },
  {
    id: 'tips',
    label: 'Conseils',
    intro: 'Ce que rapportent les textes pour la nuit.',
    steps: [
      {
        id: 'prepare', icon: 'bed-outline', title: 'Préparer ma nuit',
        body: 'Le Prophète ﷺ a dit : « Chaque fois que tu vas te coucher, fais les ablutions comme pour la prière, allonge-toi sur le côté droit… » (Al-Bukhari 247). Préparez ici les invocations que vous voulez faire.',
        action: { label: 'Préparer mes duas', route: '/tahajjud/duas' },
      },
      {
        id: 'intention', icon: 'shield-checkmark-outline', title: 'L’intention compte déjà',
        body: 'Celui qui se couche avec l’intention de prier la nuit et que le sommeil l’emporte a la récompense de son intention.',
        proof: { text: 'Celui qui va se coucher avec l’intention de se lever pour prier la nuit, puis le sommeil l’emporte jusqu’au matin, aura la récompense de ce qu’il avait l’intention de faire, et son sommeil sera une aumône que son Seigneur, le Tout-Puissant et Majestueux, lui a accordée.', source: 'An-Nasa’i 1787, Ibn Majah 1344' },
      },
      {
        id: 'missed', icon: 'sunny-outline', title: 'Une nuit manquée ?',
        body: 'Le Prophète ﷺ, lorsqu’il manquait sa prière de nuit à cause d’une douleur ou d’autre chose, priait douze rak‘at dans la journée.',
        proof: { text: '‘Aïcha rapporte que lorsqu’il manquait sa prière de nuit à cause d’une douleur ou d’autre chose, il priait douze rak‘at dans la journée.', source: 'Muslim 746' },
      },
      {
        id: 'istighfar', icon: 'chatbubble-ellipses-outline', title: 'Le pardon avant l’aube',
        body: 'Allah décrit les pieux : « et aux dernières heures de la nuit ils imploraient le pardon [d’Allah] ».',
        proof: NIGHT_VERSES[2],
        action: { label: 'Ouvrir les duas', route: '/dua' },
      },
      {
        id: 'dhikr', icon: 'ellipse-outline', title: 'Après la prière',
        body: 'L’évocation d’Allah défait l’un des nœuds du Shaytan (Al-Bukhari 1142).',
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

// ----- Ramadan · les dix dernières nuits ---------------------------------------------------------

export const LAYLAT_AL_QADR_DUA: Source = {
  arabic: 'اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي',
  phonetic: 'Allâhumma innaka ‘afuwwun tuhibbu-l-‘afwa fa‘fu ‘annî',
  text: 'Ô Allah, Tu es Celui qui pardonne, Tu aimes le pardon, alors pardonne-moi. — enseignée par le Prophète ﷺ à ‘Aïcha pour la nuit d’al-Qadr.',
  source: 'At-Tirmidhi 3513, Ibn Majah 3850',
};

export const LAST_TEN_HADITHS: Source[] = [
  {
    text: 'Cherchez la nuit du Qadr dans les nuits impaires des dix derniers jours de Ramadan.',
    source: 'Al-Bukhari 2017',
  },
  {
    text: 'Celui qui prie pendant la nuit du destin avec une foi sincère et dans l’espoir d’une récompense d’Allah, tous ses péchés passés seront pardonnés.',
    source: 'Al-Bukhari 1901, Muslim 760',
  },
];

/** The evening-intention proof, shared by the guide and the « intention » card. */
export const INTENTION_PROOF: Source = {
  text: 'Celui qui va se coucher avec l’intention de se lever pour prier la nuit, puis le sommeil l’emporte jusqu’au matin, aura la récompense de ce qu’il avait l’intention de faire, et son sommeil sera une aumône que son Seigneur, le Tout-Puissant et Majestueux, lui a accordée.',
  source: 'An-Nasa’i 1787, Ibn Majah 1344',
};
