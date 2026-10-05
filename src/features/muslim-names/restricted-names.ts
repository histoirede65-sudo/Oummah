import type { NameSourceId } from './scholar-sources';

export type RestrictionTone = 'forbidden' | 'avoid' | 'disputed' | 'allowed';

/** What one source says about one name, kept as close as possible to the translated text. */
export type RestrictionVerdict = { source: NameSourceId; says: string };

export type RestrictedNameExample = {
  name: string;
  arabic?: string;
  meaning?: string;
  tone: RestrictionTone;
  verdicts: RestrictionVerdict[];
};

export type RestrictionSection = {
  id: string;
  title: string;
  tone: RestrictionTone;
  examples: RestrictedNameExample[];
};

/**
 * Every verdict below is taken from the hadith or the fatwa it cites (scholar-sources.ts). When Ibn Bâz and
 * Ibn ‘Uthaymîn differ, both are shown and no verdict is added on top.
 */
export const RESTRICTION_SECTIONS: RestrictionSection[] = [
  {
    id: 'taabid',
    title: 'Serviteur d’un autre qu’Allah',
    tone: 'forbidden',
    examples: [
      { name: '‘Abd an-Nabî', arabic: 'عبد النبي', meaning: '« serviteur du Prophète »', tone: 'forbidden', verdicts: [
        { source: 'bazTaabid', says: 'Illicite ; unanimité rapportée par Ibn Hazm.' },
        { source: 'bazTaabidChange', says: 'Si le père est vivant, il est obligatoire de changer ce nom.' },
      ] },
      { name: '‘Abd ar-Rasûl', arabic: 'عبد الرسول', meaning: '« serviteur du Messager »', tone: 'forbidden', verdicts: [
        { source: 'bazTaabid', says: 'Illicite ; unanimité rapportée par Ibn Hazm.' },
      ] },
      { name: '‘Abd al-Husayn', arabic: 'عبد الحسين', meaning: '« serviteur d’al-Husayn »', tone: 'forbidden', verdicts: [
        { source: 'bazTaabid', says: 'Illicite ; unanimité rapportée par Ibn Hazm.' },
      ] },
      { name: '‘Abd al-Ka‘ba', arabic: 'عبد الكعبة', meaning: '« serviteur de la Ka‘ba »', tone: 'forbidden', verdicts: [
        { source: 'bazBestNames', says: 'Pas permis ; Ibn Hazm a rapporté l’unanimité des savants sur son interdiction.' },
      ] },
    ],
  },
  {
    id: 'divine-names',
    title: 'Noms propres à Allah',
    tone: 'forbidden',
    examples: [
      { name: 'Ar-Rahmân, Al-Khallâq, Ar-Razzâq', arabic: 'الرحمن · الخلاق · الرزاق', tone: 'forbidden', verdicts: [
        { source: 'bazGodNames', says: 'Noms propres à Allah : ils ne sont pas donnés à un autre qu’Allah.' },
      ] },
      { name: 'Al-‘Azîz, Al-Hakîm, As-Sayyid (avec « al- »)', arabic: 'العزيز · الحكيم · السيد', tone: 'forbidden', verdicts: [
        { source: 'uthGodNames', says: 'Avec « al- », ou en visant l’attribut, on n’en nomme pas un autre qu’Allah.' },
        { source: 'abuDawud4955', says: 'Le Prophète ﷺ a changé la kunya Abû al-Hakam : « Allah est le Juge (al-Hakam). »' },
      ] },
      { name: 'Jabbâr', arabic: 'جبار', tone: 'avoid', verdicts: [
        { source: 'uthGodNames', says: 'Il ne convient pas de le porter, même sans viser l’attribut.' },
      ] },
      { name: 'Malik al-Amlâk', arabic: 'ملك الأملاك', meaning: '« Roi des rois »', tone: 'forbidden', verdicts: [
        { source: 'muslim2143', says: 'Le plus misérable auprès d’Allah au Jour de la Résurrection.' },
      ] },
      { name: '‘Azîz, Basîr, Hakîm (sans « al- »)', arabic: 'عزيز · بصير · حكيم', tone: 'allowed', verdicts: [
        { source: 'bazGodNames', says: 'Pas de mal.' },
        { source: 'uthGodNames', says: 'Sans « al- » et sans viser l’attribut, pas de mal (Hakîm).' },
      ] },
    ],
  },
  {
    id: 'pharaohs',
    title: 'Pharaons, démons, noms du Coran',
    tone: 'forbidden',
    examples: [
      { name: 'Fir‘awn', arabic: 'فرعون', meaning: 'Pharaon', tone: 'forbidden', verdicts: [
        { source: 'uthNaming', says: 'Interdit : les noms des pharaons.' },
      ] },
      { name: 'Iblîs', arabic: 'إبليس', tone: 'forbidden', verdicts: [
        { source: 'uthNaming', says: 'Interdit : les noms des démons.' },
      ] },
      { name: 'Furqân', arabic: 'فرقان', meaning: 'un des noms du Coran', tone: 'forbidden', verdicts: [
        { source: 'uthNaming', says: 'Les savants ont dit : pas permis, les noms du Coran lui sont propres.' },
      ] },
      { name: 'Qârûn', arabic: 'قارون', tone: 'avoid', verdicts: [
        { source: 'bazBestNames', says: 'Permis faute de preuve qui l’interdise ; mieux vaut choisir un nom de servitude envers Allah ou un nom connu.' },
      ] },
    ],
  },
  {
    id: 'tazkiya',
    title: 'Auto-éloge (tazkiya)',
    tone: 'disputed',
    examples: [
      { name: 'Barra', arabic: 'برّة', meaning: 'Vertueuse (Muslim 2140)', tone: 'forbidden', verdicts: [
        { source: 'muslim2142', says: '« Ne vous considérez pas comme vertueuse » : changé en Zaynab.' },
        { source: 'bukhari6192', says: 'Changé en Zaynab.' },
        { source: 'uthQuranNames', says: 'Interdit : on le change.' },
      ] },
      { name: 'Abrâr', arabic: 'أبرار', meaning: 'pluriel de barr', tone: 'disputed', verdicts: [
        { source: 'uthMalak', says: 'On ne nomme pas Abrâr.' },
        { source: 'bazImanAbrar', says: 'Rien d’interdit à sa connaissance ; mieux vaut le laisser pour un nom connu.' },
      ] },
      { name: 'Îmân', arabic: 'إيمان', tone: 'disputed', verdicts: [
        { source: 'uthQuranNames', says: 'Comporte une part d’auto-éloge : on le change.' },
        { source: 'bazHuda', says: 'Pas de mal à sa connaissance.' },
        { source: 'bazImanAbrar', says: 'Mieux vaut le laisser pour un nom connu.' },
      ] },
      { name: 'Bayân', arabic: 'بيان', tone: 'disputed', verdicts: [
        { source: 'uthQuranNames', says: 'Il n’est pas d’avis qu’on le donne.' },
        { source: 'bazBayan', says: 'Aucun mal.' },
      ] },
      { name: 'Shams ad-Dîn, Muhyî ad-Dîn, Qamar ad-Dîn', arabic: 'شمس الدين · محيي الدين · قمر الدين', tone: 'avoid', verdicts: [
        { source: 'uthDinTitles', says: 'Inconnus au temps du Prophète ﷺ ; son avis est de délaisser ces titres.' },
      ] },
    ],
  },
  {
    id: 'bad-meaning',
    title: 'Sens mauvais',
    tone: 'avoid',
    examples: [
      { name: '‘Âṣiya', arabic: 'عاصية', meaning: 'désobéissante', tone: 'avoid', verdicts: [
        { source: 'muslim2139', says: 'Changé par le Prophète ﷺ : « Tu es Jamila. »' },
      ] },
      { name: 'Harb, Murra', arabic: 'حرب · مرة', tone: 'avoid', verdicts: [
        { source: 'abuDawud4950', says: '« Les pires sont Harb et Murrah. »' },
      ] },
    ],
  },
  {
    id: 'angels',
    title: 'Noms des anges',
    tone: 'disputed',
    examples: [
      { name: 'Jibrîl, Mîkâ’îl, Isrâfîl', arabic: 'جبريل · ميكائيل · إسرافيل', tone: 'disputed', verdicts: [
        { source: 'uthNaming', says: 'Certains savants l’ont réprouvé.' },
        { source: 'bazMalak', says: '« comme on nomme Jibrîl et Mîkâ’îl ».' },
      ] },
      { name: 'Malak, Milâk', arabic: 'مَلاك · مِلاك', tone: 'disputed', verdicts: [
        { source: 'uthMalak', says: 'Il le réprouve : « laisse ce qui te fait douter ».' },
        { source: 'bazMalak', says: 'On en nomme l’homme comme la femme, comme on nomme Jibrîl et Mîkâ’îl.' },
      ] },
    ],
  },
  {
    id: 'allowed',
    title: 'Souvent demandés, déclarés permis',
    tone: 'allowed',
    examples: [
      { name: 'Tâhâ, Yâsîn', arabic: 'طه · يس', tone: 'allowed', verdicts: [
        { source: 'bazBestNames', says: 'Permis ; ce ne sont pas des noms du Prophète ﷺ, mais des lettres isolées au début des sourates.' },
      ] },
      { name: 'Afnân, Âlâ’', arabic: 'أفنان · آلاء', meaning: 'branches · bienfaits', tone: 'allowed', verdicts: [
        { source: 'bazQuranWords', says: 'Pas de mal, ce sont des choses créées.' },
        { source: 'uthQuranNames', says: 'Afnân, Aghsân, Janâ : pas de mal.' },
      ] },
      { name: 'Hudâ, Nûr, Du‘â’', arabic: 'هدى · نور · دعاء', tone: 'allowed', verdicts: [
        { source: 'bazHuda', says: 'Pas de mal à sa connaissance.' },
      ] },
      { name: 'Khabbâb, Al-Walîd', arabic: 'خباب · الوليد', tone: 'allowed', verdicts: [
        { source: 'bazBestNames', says: 'Permis faute de preuve qui l’interdise.' },
      ] },
    ],
  },
];
