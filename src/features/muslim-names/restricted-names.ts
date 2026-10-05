import type { NameSourceId } from './scholar-sources';

export type RestrictionTone = 'forbidden' | 'avoid' | 'disputed' | 'allowed';

/** What one source says about one name, kept as close as possible to the translated text. */
export type RestrictionVerdict = { source: NameSourceId; says: string; saysEn: string };

export type RestrictedNameExample = {
  name: string;
  /** English heading when the French one carries French words. */
  nameEn?: string;
  arabic?: string;
  meaning?: string;
  meaningEn?: string;
  tone: RestrictionTone;
  verdicts: RestrictionVerdict[];
};

export type RestrictionSection = {
  id: string;
  title: string;
  titleEn: string;
  tone: RestrictionTone;
  examples: RestrictedNameExample[];
};

/**
 * Every verdict below is taken from the hadith or the fatwa it cites (scholar-sources.ts). When Ibn Bâz and
 * Ibn ‘Uthaymîn differ, both are shown and no verdict is added on top. The English follows the English text of
 * the same source.
 */
export const RESTRICTION_SECTIONS: RestrictionSection[] = [
  {
    id: 'taabid',
    title: 'Serviteur d’un autre qu’Allah',
    titleEn: 'Servant of other than Allah',
    tone: 'forbidden',
    examples: [
      { name: '‘Abd an-Nabî', arabic: 'عبد النبي', meaning: '« serviteur du Prophète »', meaningEn: '“servant of the Prophet”', tone: 'forbidden', verdicts: [
        { source: 'bazTaabid', says: 'Illicite ; unanimité rapportée par Ibn Hazm.', saysEn: 'Unlawful; consensus reported by Ibn Hazm.' },
        { source: 'bazTaabidChange', says: 'Si le père est vivant, il est obligatoire de changer ce nom.', saysEn: 'If the father is alive, this name must be changed.' },
      ] },
      { name: '‘Abd ar-Rasûl', arabic: 'عبد الرسول', meaning: '« serviteur du Messager »', meaningEn: '“servant of the Messenger”', tone: 'forbidden', verdicts: [
        { source: 'bazTaabid', says: 'Illicite ; unanimité rapportée par Ibn Hazm.', saysEn: 'Unlawful; consensus reported by Ibn Hazm.' },
      ] },
      { name: '‘Abd al-Husayn', arabic: 'عبد الحسين', meaning: '« serviteur d’al-Husayn »', meaningEn: '“servant of al-Husayn”', tone: 'forbidden', verdicts: [
        { source: 'bazTaabid', says: 'Illicite ; unanimité rapportée par Ibn Hazm.', saysEn: 'Unlawful; consensus reported by Ibn Hazm.' },
      ] },
      { name: '‘Abd al-Ka‘ba', arabic: 'عبد الكعبة', meaning: '« serviteur de la Ka‘ba »', meaningEn: '“servant of the Ka‘ba”', tone: 'forbidden', verdicts: [
        { source: 'bazBestNames', says: 'Pas permis ; Ibn Hazm a rapporté l’unanimité des savants sur son interdiction.', saysEn: 'Not permitted; Ibn Hazm reported the scholars’ consensus that it is forbidden.' },
      ] },
    ],
  },
  {
    id: 'divine-names',
    title: 'Noms propres à Allah',
    titleEn: 'Names that belong to Allah alone',
    tone: 'forbidden',
    examples: [
      { name: 'Ar-Rahmân, Al-Khallâq, Ar-Razzâq', arabic: 'الرحمن · الخلاق · الرزاق', tone: 'forbidden', verdicts: [
        { source: 'bazGodNames', says: 'Noms propres à Allah : ils ne sont pas donnés à un autre qu’Allah.', saysEn: 'Names that belong to Allah alone: they are not given to other than Allah.' },
      ] },
      { name: 'Al-‘Azîz, Al-Hakîm, As-Sayyid (avec « al- »)', nameEn: 'Al-‘Azîz, Al-Hakîm, As-Sayyid (with “al-”)', arabic: 'العزيز · الحكيم · السيد', tone: 'forbidden', verdicts: [
        { source: 'uthGodNames', says: 'Avec « al- », ou en visant l’attribut, on n’en nomme pas un autre qu’Allah.', saysEn: 'With “al-”, or when the attribute is meant, no one other than Allah is named by it.' },
        { source: 'abuDawud4955', says: 'Le Prophète ﷺ a changé la kunya Abû al-Hakam : « Allah est le Juge (al-Hakam). »', saysEn: 'The Prophet ﷺ changed the kunya AbulHakam: “Allah is the judge (al-Hakam).”' },
      ] },
      { name: 'Jabbâr', arabic: 'جبار', tone: 'avoid', verdicts: [
        { source: 'uthGodNames', says: 'Il ne convient pas de le porter, même sans viser l’attribut.', saysEn: 'One should not take it, even if the attribute is not intended.' },
      ] },
      { name: 'Malik al-Amlâk', arabic: 'ملك الأملاك', meaning: '« Roi des rois »', meaningEn: '“King of Kings”', tone: 'forbidden', verdicts: [
        { source: 'muslim2143', says: 'Le plus misérable auprès d’Allah au Jour de la Résurrection.', saysEn: 'The most wretched person in the sight of Allah on the Day of Resurrection.' },
      ] },
      { name: '‘Azîz, Basîr, Hakîm (sans « al- »)', nameEn: '‘Azîz, Basîr, Hakîm (without “al-”)', arabic: 'عزيز · بصير · حكيم', tone: 'allowed', verdicts: [
        { source: 'bazGodNames', says: 'Pas de mal.', saysEn: 'No harm.' },
        { source: 'uthGodNames', says: 'Sans « al- » et sans viser l’attribut, pas de mal (Hakîm).', saysEn: 'Without “al-” and without meaning the attribute, no harm (Hakîm).' },
      ] },
    ],
  },
  {
    id: 'pharaohs',
    title: 'Pharaons, démons, noms du Coran',
    titleEn: 'Pharaohs, devils, names of the Quran',
    tone: 'forbidden',
    examples: [
      { name: 'Fir‘awn', arabic: 'فرعون', meaning: 'Pharaon', meaningEn: 'Pharaoh', tone: 'forbidden', verdicts: [
        { source: 'uthNaming', says: 'Interdit : les noms des pharaons.', saysEn: 'Forbidden: the names of the pharaohs.' },
      ] },
      { name: 'Iblîs', arabic: 'إبليس', tone: 'forbidden', verdicts: [
        { source: 'uthNaming', says: 'Interdit : les noms des démons.', saysEn: 'Forbidden: the names of the devils.' },
      ] },
      { name: 'Furqân', arabic: 'فرقان', meaning: 'un des noms du Coran', meaningEn: 'one of the names of the Quran', tone: 'forbidden', verdicts: [
        { source: 'uthNaming', says: 'Les savants ont dit : pas permis, les noms du Coran lui sont propres.', saysEn: 'The scholars said: not permitted, as one of the names of the Quran.' },
      ] },
      { name: 'Qârûn', arabic: 'قارون', tone: 'avoid', verdicts: [
        { source: 'bazBestNames', says: 'Permis faute de preuve qui l’interdise ; mieux vaut choisir un nom de servitude envers Allah ou un nom connu.', saysEn: 'Permitted, as no evidence forbids it; better to choose a name of servitude to Allah or a well-known name.' },
      ] },
    ],
  },
  {
    id: 'tazkiya',
    title: 'Auto-éloge (tazkiya)',
    titleEn: 'Self-praise (tazkiya)',
    tone: 'disputed',
    examples: [
      { name: 'Barra', arabic: 'برّة', meaning: 'Vertueuse (Muslim 2140)', meaningEn: 'Pious (Muslim 2140)', tone: 'forbidden', verdicts: [
        { source: 'muslim2142', says: '« Ne vous considérez pas comme vertueuse » : changé en Zaynab.', saysEn: '“Don’t hold yourself to be pious”: changed to Zaynab.' },
        { source: 'bukhari6192', says: 'Changé en Zaynab.', saysEn: 'Changed to Zaynab.' },
        { source: 'uthQuranNames', says: 'Interdit : on le change.', saysEn: 'Forbidden: it is changed.' },
      ] },
      { name: 'Abrâr', arabic: 'أبرار', meaning: 'pluriel de barr', meaningEn: 'plural of barr', tone: 'disputed', verdicts: [
        { source: 'uthMalak', says: 'On ne nomme pas Abrâr.', saysEn: 'One does not name Abrâr.' },
        { source: 'bazImanAbrar', says: 'Rien d’interdit à sa connaissance ; mieux vaut le laisser pour un nom connu.', saysEn: 'Nothing forbidden that he knows of; better to leave it for a well-known name.' },
      ] },
      { name: 'Îmân', arabic: 'إيمان', tone: 'disputed', verdicts: [
        { source: 'uthQuranNames', says: 'Comporte une part d’auto-éloge : on le change.', saysEn: 'There is some self-praise in it: it is changed.' },
        { source: 'bazHuda', says: 'Pas de mal à sa connaissance.', saysEn: 'No harm that he knows of.' },
        { source: 'bazImanAbrar', says: 'Mieux vaut le laisser pour un nom connu.', saysEn: 'Better to leave it for a well-known name.' },
      ] },
      { name: 'Bayân', arabic: 'بيان', tone: 'disputed', verdicts: [
        { source: 'uthQuranNames', says: 'Il n’est pas d’avis qu’on le donne.', saysEn: 'He does not think it should be given.' },
        { source: 'bazBayan', says: 'Aucun mal.', saysEn: 'No harm.' },
      ] },
      { name: 'Shams ad-Dîn, Muhyî ad-Dîn, Qamar ad-Dîn', arabic: 'شمس الدين · محيي الدين · قمر الدين', tone: 'avoid', verdicts: [
        { source: 'uthDinTitles', says: 'Inconnus au temps du Prophète ﷺ ; son avis est de délaisser ces titres.', saysEn: 'Unknown in the time of the Prophet ﷺ; his view is to turn away from these titles.' },
      ] },
    ],
  },
  {
    id: 'bad-meaning',
    title: 'Sens mauvais',
    titleEn: 'Bad meaning',
    tone: 'avoid',
    examples: [
      { name: '‘Âṣiya', arabic: 'عاصية', meaning: 'désobéissante', meaningEn: 'disobedient', tone: 'avoid', verdicts: [
        { source: 'muslim2139', says: 'Changé par le Prophète ﷺ : « Tu es Jamila. »', saysEn: 'Changed by the Prophet ﷺ: “You are Jamila.”' },
      ] },
      { name: 'Harb, Murra', arabic: 'حرب · مرة', tone: 'avoid', verdicts: [
        { source: 'abuDawud4950', says: '« Les pires sont Harb et Murrah. »', saysEn: '“The worst are Harb and Murrah.”' },
      ] },
    ],
  },
  {
    id: 'angels',
    title: 'Noms des anges',
    titleEn: 'Names of the angels',
    tone: 'disputed',
    examples: [
      { name: 'Jibrîl, Mîkâ’îl, Isrâfîl', arabic: 'جبريل · ميكائيل · إسرافيل', tone: 'disputed', verdicts: [
        { source: 'uthNaming', says: 'Certains savants l’ont réprouvé.', saysEn: 'Some scholars disliked it.' },
        { source: 'bazMalak', says: '« comme on nomme Jibrîl et Mîkâ’îl ».', saysEn: '“just as one is named Jibrîl and Mîkâ’îl”.' },
      ] },
      { name: 'Malak, Milâk', arabic: 'مَلاك · مِلاك', tone: 'disputed', verdicts: [
        { source: 'uthMalak', says: 'Il le réprouve : « laisse ce qui te fait douter ».', saysEn: 'He dislikes it: “leave what makes you doubt”.' },
        { source: 'bazMalak', says: 'On en nomme l’homme comme la femme, comme on nomme Jibrîl et Mîkâ’îl.', saysEn: 'A man is named by it as a woman is, just as one is named Jibrîl and Mîkâ’îl.' },
      ] },
    ],
  },
  {
    id: 'allowed',
    title: 'Souvent demandés, déclarés permis',
    titleEn: 'Often asked about, declared permitted',
    tone: 'allowed',
    examples: [
      { name: 'Tâhâ, Yâsîn', arabic: 'طه · يس', tone: 'allowed', verdicts: [
        { source: 'bazBestNames', says: 'Permis ; ce ne sont pas des noms du Prophète ﷺ, mais des lettres isolées au début des sourates.', saysEn: 'Permitted; they are not names of the Prophet ﷺ but separate letters at the beginning of the surahs.' },
      ] },
      { name: 'Afnân, Âlâ’', arabic: 'أفنان · آلاء', meaning: 'branches · bienfaits', meaningEn: 'branches · blessings', tone: 'allowed', verdicts: [
        { source: 'bazQuranWords', says: 'Pas de mal, ce sont des choses créées.', saysEn: 'No harm, these are created things.' },
        { source: 'uthQuranNames', says: 'Afnân, Aghsân, Janâ : pas de mal.', saysEn: 'Afnân, Aghsân, Janâ: no harm.' },
      ] },
      { name: 'Hudâ, Nûr, Du‘â’', arabic: 'هدى · نور · دعاء', tone: 'allowed', verdicts: [
        { source: 'bazHuda', says: 'Pas de mal à sa connaissance.', saysEn: 'No harm that he knows of.' },
      ] },
      { name: 'Khabbâb, Al-Walîd', arabic: 'خباب · الوليد', tone: 'allowed', verdicts: [
        { source: 'bazBestNames', says: 'Permis faute de preuve qui l’interdise.', saysEn: 'Permitted, as no evidence forbids it.' },
      ] },
    ],
  },
];
