
import { tx } from './tahajjudI18n';/**
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
    get text() { return tx('Et de la nuit consacre une partie [avant l’aube] pour des prières surérogatoires afin que ton Seigneur te ressuscite en une position de gloire.'); },
    get source() { return tx('Sourate Al-Isra, 17:79'); },
  },
  {
    arabic: 'تَتَجَافَىٰ جُنُوبُهُمْ عَنِ ٱلْمَضَاجِعِ يَدْعُونَ رَبَّهُمْ خَوْفًا وَطَمَعًا',
    phonetic: 'Tatajâfâ junûbuhum ‘ani-l-madâji‘i yad‘ûna rabbahum khawfan wa tama‘â',
    get text() { return tx('Ils s’arrachent de leurs lits pour invoquer leur Seigneur, par crainte et espoir.'); },
    get source() { return tx('Sourate As-Sajda, 32:16'); },
  },
  {
    arabic: 'كَانُوا۟ قَلِيلًا مِّنَ ٱلَّيْلِ مَا يَهْجَعُونَ ۝ وَبِٱلْأَسْحَارِ هُمْ يَسْتَغْفِرُونَ',
    phonetic: 'Kânû qalîlan mina-l-layli mâ yahja‘ûn. Wa bi-l-ashâri hum yastaghfirûn',
    get text() { return tx('Ils dormaient peu, la nuit, et aux dernières heures de la nuit ils imploraient le pardon [d’Allah].'); },
    get source() { return tx('Sourate Adh-Dhariyat, 51:17-18'); },
  },
  {
    arabic: 'وَٱلَّذِينَ يَبِيتُونَ لِرَبِّهِمْ سُجَّدًا وَقِيَٰمًا',
    phonetic: 'Wa-lladhîna yabîtûna li-rabbihim sujjadan wa qiyâmâ',
    get text() { return tx('Ceux qui passent les nuits prosternés et debout devant leur Seigneur.'); },
    get source() { return tx('Sourate Al-Furqan, 25:64'); },
  },
];

export const NIGHT_HADITHS: Source[] = [
  {
    get text() { return tx('Notre Seigneur, le Béni, le Suprême, descend chaque nuit au ciel le plus proche de nous quand il ne reste qu’un tiers de la nuit, et Il dit : « Y a-t-il quelqu’un qui M’invoque pour que Je lui réponde ? Y a-t-il quelqu’un qui Me demande pour que Je lui accorde sa demande ? Y a-t-il quelqu’un qui cherche Mon pardon pour que Je lui pardonne ? »'); },
    get source() { return tx('Al-Bukhari 1145, Muslim 758'); },
  },
  {
    get text() { return tx('La meilleure prière après les prières obligatoires est la prière de nuit.'); },
    get source() { return tx('Muslim 1163'); },
  },
  {
    get text() { return tx('L’action la plus aimée d’Allah est celle qui est faite régulièrement, même si elle est petite.'); },
    get source() { return tx('Al-Bukhari 6464, Muslim 783'); },
  },
];

export const WAKING_DUA: Source = {
  arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ',
  phonetic: 'Al-hamdu lillâhi-lladhî ahyânâ ba‘da mâ amâtanâ wa ilayhi-n-nushûr',
  get text() { return tx('Louange à Allah qui nous a rendu la vie après nous avoir fait mourir, et c’est vers Lui que se fera la résurrection.'); },
  get source() { return tx('Al-Bukhari 6312'); },
};

export const NIGHT_DUAS: Source[] = [
  WAKING_DUA,
  {
    arabic: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، الْحَمْدُ لِلَّهِ، وَسُبْحَانَ اللَّهِ، وَلَا إِلَهَ إِلَّا اللَّهُ، وَاللَّهُ أَكْبَرُ، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ، اللَّهُمَّ اغْفِرْ لِي',
    phonetic: 'Lâ ilâha illa-llâhu wahdahu lâ sharîka lah, lahu-l-mulku wa lahu-l-hamd, wa huwa ‘alâ kulli shay’in qadîr. Al-hamdu lillâh, wa subhâna-llâh, wa lâ ilâha illa-llâh, wa-llâhu akbar, wa lâ hawla wa lâ quwwata illâ billâh. Allâhumma-ghfir lî',
    get text() { return tx('Celui qui se réveille la nuit et dit ces paroles puis « Ô Allah, pardonne-moi », ou invoque, est exaucé ; et s’il fait ses ablutions et prie, sa prière est acceptée.'); },
    get source() { return tx('Al-Bukhari 1154'); },
  },
  {
    arabic: 'اللَّهُمَّ اهْدِنِي فِيمَنْ هَدَيْتَ، وَعَافِنِي فِيمَنْ عَافَيْتَ، وَتَوَلَّنِي فِيمَنْ تَوَلَّيْتَ، وَبَارِكْ لِي فِيمَا أَعْطَيْتَ، وَقِنِي شَرَّ مَا قَضَيْتَ، فَإِنَّكَ تَقْضِي وَلَا يُقْضَى عَلَيْكَ، وَإِنَّهُ لَا يَذِلُّ مَنْ وَالَيْتَ، تَبَارَكْتَ رَبَّنَا وَتَعَالَيْتَ',
    phonetic: 'Allâhumma-hdinî fîman hadayt, wa ‘âfinî fîman ‘âfayt, wa tawallanî fîman tawallayt, wa bârik lî fîmâ a‘tayt, wa qinî sharra mâ qadayt, fa-innaka taqdî wa lâ yuqdâ ‘alayk, wa innahu lâ yadhillu man wâlayt, tabârakta rabbanâ wa ta‘âlayt',
    get text() { return tx('Ô Allah, guide-moi parmi ceux que Tu as guidés, préserve-moi parmi ceux que Tu as préservés, prends-moi sous Ta protection parmi ceux que Tu as pris sous Ta protection, bénis pour moi ce que Tu m’as donné, protège-moi du mal de ce que Tu as décrété… Béni sois-Tu, notre Seigneur, et exalté. (Qunut du Witr)'); },
    get source() { return tx('Abu Dawud 1425, At-Tirmidhi 464, An-Nasa’i 1745'); },
  },
  {
    arabic: 'سُبْحَانَ الْمَلِكِ الْقُدُّوسِ',
    phonetic: 'Subhâna-l-Maliki-l-Quddûs',
    get text() { return tx('Gloire au Roi, le Très-Saint. — trois fois, après le Witr.'); },
    get source() { return tx('Abu Dawud 1430, An-Nasa’i 1699'); },
  },
];

/** Passages to read at night, opened in OUMMAH's Quran (sourate, and first verse when relevant). */
export const NIGHT_READINGS: { id: string; title: string; reference: string; why: string; surah: number; verse?: number }[] = [
  { id: 'mulk', title: 'Al-Mulk', get reference() { return tx('Sourate 67'); }, surah: 67, get why() { return tx('Le Prophète ﷺ ne dormait pas avant de l’avoir lue (At-Tirmidhi 3404).'); } },
  { id: 'sajda', title: 'As-Sajda', get reference() { return tx('Sourate 32'); }, surah: 32, get why() { return tx('Le Prophète ﷺ ne dormait pas avant de l’avoir lue, avec Al-Mulk (At-Tirmidhi 3404).'); } },
  { id: 'imran', get title() { return tx('Fin d’Al ‘Imran'); }, reference: '3:190-200', surah: 3, verse: 190, get why() { return tx('Récitée par le Prophète ﷺ en se réveillant la nuit (Al-Bukhari 4569).'); } },
  { id: 'baqara', get title() { return tx('Fin d’Al-Baqara'); }, reference: '2:285-286', surah: 2, verse: 285, get why() { return tx('Ces deux versets suffisent à celui qui les récite la nuit (Al-Bukhari 5009, Muslim 807).'); } },
  { id: 'muzzammil', title: 'Al-Muzzammil', get reference() { return tx('Sourate 73'); }, surah: 73, get why() { return tx('« Lève-toi [pour prier], toute la nuit, excepté une petite partie » (73:2).'); } },
  { id: 'isra', title: 'Al-Isra', reference: '17:78-82', surah: 17, verse: 78, get why() { return tx('Le verset de Tahajjud (17:79).'); } },
];

export const GUIDE: GuideTab[] = [
  {
    id: 'understand',
    label: 'Comprendre',
    get intro() { return tx('Une prière volontaire, la nuit. Le dernier tiers de la nuit est le moment où Allah descend au ciel le plus proche.'); },
    steps: [
      {
        id: 'what', icon: 'moon-outline', get title() { return tx('Qu’est-ce que Tahajjud ?'); },
        get body() { return tx('C’est la prière surérogatoire de la nuit, mentionnée par le Coran. Le Prophète ﷺ priait la nuit entre ‘Isha et Fajr.'); },
        proof: NIGHT_VERSES[0],
      },
      {
        id: 'when', icon: 'time-outline', get title() { return tx('Le dernier tiers de la nuit'); },
        get body() { return tx('La nuit va du coucher du soleil (Maghrib) à l’aube (Fajr). On la divise en trois : le dernier tiers est le moment où Allah descend au ciel de ce bas monde. OUMMAH le calcule chaque jour à partir de vos horaires.'); },
        proof: NIGHT_HADITHS[0],
        action: { get label() { return tx('Régler mon réveil'); }, route: '/tahajjud/alarm' },
      },
      {
        id: 'virtue', icon: 'sparkles-outline', get title() { return tx('Sa valeur'); },
        get body() { return tx('C’est la meilleure prière après les prières obligatoires.'); },
        proof: NIGHT_HADITHS[1],
      },
      {
        id: 'regular', icon: 'leaf-outline', get title() { return tx('Peu, mais régulier'); },
        get body() { return tx('L’action la plus aimée d’Allah est celle qui est faite régulièrement, même si elle est petite.'); },
        proof: NIGHT_HADITHS[2],
      },
    ],
  },
  {
    id: 'pray',
    get label() { return tx('Comment prier'); },
    get intro() { return tx('Six étapes simples, du réveil au Witr.'); },
    steps: [
      {
        id: 'wake', icon: 'alarm-outline', get title() { return tx('1. Se réveiller'); },
        get body() { return tx('Au réveil, évoquez Allah avec l’invocation du réveil.'); },
        proof: WAKING_DUA,
        get tip() { return tx('Le Prophète ﷺ nettoyait ses dents avec le siwak lorsqu’il se levait la nuit (Al-Bukhari 245, Muslim 255).'); },
      },
      {
        id: 'wudu', icon: 'water-outline', get title() { return tx('2. Faire ses ablutions'); },
        get body() { return tx('Le Shaytan noue trois nœuds sur la nuque du dormeur ; l’évocation d’Allah, les ablutions et la prière les défont un à un.'); },
        proof: { get text() { return tx('Satan fait trois nœuds à l’arrière de la tête de l’un de vous lorsqu’il dort. […] Quand on se réveille et qu’on se souvient d’Allah, un nœud se défait ; quand on fait les ablutions, un deuxième nœud se défait ; et quand on prie, le troisième nœud se défait.'); }, get source() { return tx('Al-Bukhari 1142, Muslim 776'); } },
      },
      {
        id: 'start', icon: 'play-circle-outline', get title() { return tx('3. Commencer par deux rak‘at légères'); },
        get body() { return tx('Ouvrez votre prière par deux unités courtes, puis priez deux par deux.'); },
        proof: { get text() { return tx('Lorsque l’un d’entre vous se lève la nuit, qu’il commence la prière par deux courtes unités de prière (rak‘a).'); }, get source() { return tx('Muslim 768'); } },
      },
      {
        id: 'count', icon: 'layers-outline', get title() { return tx('4. Combien de rak‘at ?'); },
        get body() { return tx('La prière de la nuit se fait deux par deux. Le Prophète ﷺ ne dépassait pas onze rak‘at, Witr compris.'); },
        proof: { get text() { return tx('Le Messager d’Allah (ﷺ) ne dépassait jamais onze unités de prière, que ce soit pendant le Ramadan ou en dehors.'); }, get source() { return tx('‘Aïcha · Al-Bukhari 1147, Muslim 738'); } },
      },
      {
        id: 'sujud', icon: 'heart-outline', get title() { return tx('5. Prolonger la récitation et les prosternations'); },
        get body() { return tx('Le serviteur est au plus près de son Seigneur quand il est prosterné : multipliez-y les invocations (Muslim 482).'); },
        action: { get label() { return tx('Que réciter dans ma prière ?'); }, route: '/tahajjud/recite' },
      },
      {
        id: 'witr', icon: 'star-outline', get title() { return tx('6. Terminer par le Witr'); },
        get body() { return tx('Le Witr clôt la prière de la nuit. Après, dites trois fois « Subhana al-Malik al-Quddus ».'); },
        proof: { get text() { return tx('Faites du witr votre dernière prière de la nuit.'); }, get source() { return tx('Al-Bukhari 998, Muslim 751'); } },
      },
    ],
  },
  {
    id: 'tips',
    label: 'Conseils',
    get intro() { return tx('Ce que rapportent les textes pour la nuit.'); },
    steps: [
      {
        id: 'prepare', icon: 'bed-outline', get title() { return tx('Préparer ma nuit'); },
        get body() { return tx('Le Prophète ﷺ a dit : « Chaque fois que tu vas te coucher, fais les ablutions comme pour la prière, allonge-toi sur le côté droit… » (Al-Bukhari 247). Préparez ici les invocations que vous voulez faire.'); },
        action: { get label() { return tx('Préparer mes duas'); }, route: '/tahajjud/duas' },
      },
      {
        id: 'intention', icon: 'shield-checkmark-outline', get title() { return tx('L’intention compte déjà'); },
        get body() { return tx('Celui qui se couche avec l’intention de prier la nuit et que le sommeil l’emporte a la récompense de son intention.'); },
        proof: { get text() { return tx('Celui qui va se coucher avec l’intention de se lever pour prier la nuit, puis le sommeil l’emporte jusqu’au matin, aura la récompense de ce qu’il avait l’intention de faire, et son sommeil sera une aumône que son Seigneur, le Tout-Puissant et Majestueux, lui a accordée.'); }, get source() { return tx('An-Nasa’i 1787, Ibn Majah 1344'); } },
      },
      {
        id: 'missed', icon: 'sunny-outline', get title() { return tx('Une nuit manquée ?'); },
        get body() { return tx('Le Prophète ﷺ, lorsqu’il manquait sa prière de nuit à cause d’une douleur ou d’autre chose, priait douze rak‘at dans la journée.'); },
        proof: { get text() { return tx('‘Aïcha rapporte que lorsqu’il manquait sa prière de nuit à cause d’une douleur ou d’autre chose, il priait douze rak‘at dans la journée.'); }, get source() { return tx('Muslim 746'); } },
      },
      {
        id: 'istighfar', icon: 'chatbubble-ellipses-outline', get title() { return tx('Le pardon avant l’aube'); },
        get body() { return tx('Allah décrit les pieux : « et aux dernières heures de la nuit ils imploraient le pardon [d’Allah] ».'); },
        proof: NIGHT_VERSES[2],
        action: { get label() { return tx('Ouvrir les duas'); }, route: '/dua' },
      },
      {
        id: 'dhikr', icon: 'ellipse-outline', get title() { return tx('Après la prière'); },
        get body() { return tx('L’évocation d’Allah défait l’un des nœuds du Shaytan (Al-Bukhari 1142).'); },
        action: { get label() { return tx('Ouvrir le dhikr'); }, route: '/dhikr' },
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
  get text() { return tx('Ô Allah, Tu es Celui qui pardonne, Tu aimes le pardon, alors pardonne-moi. — enseignée par le Prophète ﷺ à ‘Aïcha pour la nuit d’al-Qadr.'); },
  get source() { return tx('At-Tirmidhi 3513, Ibn Majah 3850'); },
};

export const LAST_TEN_HADITHS: Source[] = [
  {
    get text() { return tx('Cherchez la nuit du Qadr dans les nuits impaires des dix derniers jours de Ramadan.'); },
    get source() { return tx('Al-Bukhari 2017'); },
  },
  {
    get text() { return tx('Celui qui prie pendant la nuit du destin avec une foi sincère et dans l’espoir d’une récompense d’Allah, tous ses péchés passés seront pardonnés.'); },
    get source() { return tx('Al-Bukhari 1901, Muslim 760'); },
  },
];

/** The evening-intention proof, shared by the guide and the « intention » card. */
export const INTENTION_PROOF: Source = {
  get text() { return tx('Celui qui va se coucher avec l’intention de se lever pour prier la nuit, puis le sommeil l’emporte jusqu’au matin, aura la récompense de ce qu’il avait l’intention de faire, et son sommeil sera une aumône que son Seigneur, le Tout-Puissant et Majestueux, lui a accordée.'); },
  get source() { return tx('An-Nasa’i 1787, Ibn Majah 1344'); },
};
