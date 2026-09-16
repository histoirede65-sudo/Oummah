export type RestrictionTone = 'forbidden' | 'avoid' | 'disputed' | 'context';

export type RestrictionSource = {
  label: string;
  reference: string;
  url: string;
  note?: string;
};

export type RestrictedNameExample = {
  name: string;
  arabic?: string;
  meaning?: string;
  verdict: string;
  explanation: string;
  variants?: string[];
  sourceIds: string[];
};

export type RestrictionSection = {
  id: string;
  title: string;
  eyebrow: string;
  tone: RestrictionTone;
  summary: string;
  rule: string;
  examples: RestrictedNameExample[];
};

export const RESTRICTION_SOURCES: Record<string, RestrictionSource> = {
  muslim2142: {
    label: 'Sahih Muslim — Barrah et l’auto-éloge',
    reference: 'Sahih Muslim 2142b',
    url: 'https://sunnah.com/muslim/38/24',
    note: 'Le Prophète ﷺ a changé le nom Barrah et a dit de ne pas se déclarer soi-même vertueux.',
  },
  muslim2143: {
    label: 'Sahih Muslim — Malik al-Amlak',
    reference: 'Sahih Muslim 2143a',
    url: 'https://sunnah.com/muslim:2143a',
    note: 'Hadith authentique sur l’interdiction de l’appellation « Roi des rois ».',
  },
  islamqa1692: {
    label: 'IslamQA — Noms interdits et réprouvés',
    reference: 'Fatwa 1692',
    url: 'https://islamqa.info/fr/answers/1692',
    note: 'Synthèse de règles de fiqh et citations d’Ibn al-Qayyim et des juristes.',
  },
  islamqa7180: {
    label: 'IslamQA — Convenances du choix du prénom',
    reference: 'Fatwa 7180',
    url: 'https://islamqa.info/fr/answers/7180',
    note: 'Classe les noms interdits et réprouvés et rappelle la règle générale : le bon sens du prénom compte.',
  },
  islamqa135: {
    label: 'IslamQA — Noms des anges',
    reference: 'Fatwa 135',
    url: 'https://islamqa.info/en/answers/135',
    note: 'Rapporte la réprobation de l’imam Malik, l’avis permissif de nombreux juristes et conclut qu’il est préférable de ne pas utiliser les noms d’anges.',
  },
  uthaymeenMalak: {
    label: 'Cheikh Ibn ‘Uthaymin — prénom Malak',
    reference: 'Al-Liqā’ ash-Shahrī 7',
    url: 'https://old.binothaimeen.net/content/265',
    note: 'Le cheikh dit qu’il n’aime pas ce choix et conseille de délaisser ce qui suscite un doute quand de nombreux autres prénoms existent.',
  },
  uthaymeenNames: {
    label: 'Cheikh Ibn ‘Uthaymin — bien choisir le prénom',
    reference: 'Fatwa sur le droit de nommer l’enfant',
    url: 'https://old.binothaimeen.net/content/653',
    note: 'Mentionne l’interdiction des noms de pharaons et de démons et rapporte que certains savants réprouvent les noms d’anges.',
  },
  uthaymeenIman: {
    label: 'Cheikh Ibn ‘Uthaymin — Iman et noms d’auto-éloge',
    reference: 'Liqā’ al-Bāb al-Maftūh 16',
    url: 'https://old.binothaimeen.net/content/2410',
    note: 'Il range Iman et Abrar parmi les noms à éviter en raison de la tazkiya (auto-éloge).',
  },
  islamqa222715: {
    label: 'IslamQA — prénom Iman',
    reference: 'Fatwa 222715',
    url: 'https://islamqa.info/ar/answers/222715',
    note: 'Expose la divergence contemporaine et cite Ibn ‘Uthaymin, al-Barrak et al-Fawzan sur l’auto-éloge.',
  },
  islamqa141081: {
    label: 'IslamQA — Taqwa et noms semblables',
    reference: 'Fatwa 141081',
    url: 'https://islamqa.info/ar/answers/141081',
    note: 'Classe Taqwa parmi les noms réprouvés en raison de l’auto-éloge.',
  },
  muslimKahin: {
    label: 'Sahih Muslim — les devins (kāhin)',
    reference: 'Sahih Muslim 2228a-b',
    url: 'https://sunnah.com/muslim:2228a',
    note: 'Le texte condamne la pratique des devins et décrit leurs mensonges ; il ne contient pas une interdiction nominative du prénom Kahin/Kahina.',
  },
  islamqa204257: {
    label: 'IslamQA — tout mot coranique n’est pas un prénom',
    reference: 'Fatwa 204257',
    url: 'https://islamqa.info/ar/answers/204257',
    note: 'Cite Fir‘awn, Haman et Qarun comme exemples montrant qu’une présence dans le Coran ne rend pas un nom recommandable.',
  },
  islamqa320821: {
    label: 'IslamQA — prénom Islam',
    reference: 'Fatwa 320821',
    url: 'https://islamqa.info/ar/answers/320821',
    note: 'Rapporte une divergence sur Islam/Iman et conseille de délaisser ce choix au départ pour sortir de la divergence.',
  },
};

export const RESTRICTION_SECTIONS: RestrictionSection[] = [
  {
    id: 'clear-forbidden',
    title: 'Interdictions claires',
    eyebrow: 'À NE PAS DONNER',
    tone: 'forbidden',
    summary: 'Des formes qui contredisent directement un principe religieux : servitude envers autre qu’Allah, nom exclusivement divin, titre condamné, idole ou démon.',
    rule: 'Ici, OUMMAH réserve le mot « interdit » aux cas pour lesquels la règle est clairement établie dans les références utilisées.',
    examples: [
      { name:'Abd an-Nabi', arabic:'عبد النبي', meaning:'« serviteur du Prophète »', verdict:'Interdit', explanation:'La construction ʿAbd exprime la servitude. Elle ne doit pas être dirigée vers un prophète, un saint, un ange ou une créature.', variants:['Abdelnabi','Abd al-Nabi'], sourceIds:['islamqa1692','islamqa7180'] },
      { name:'Abd ar-Rasul', arabic:'عبد الرسول', meaning:'« serviteur du Messager »', verdict:'Interdit', explanation:'Même principe : la servitude exprimée par ʿAbd est réservée à Allah.', variants:['Abderrasoul','Abd al-Rasul'], sourceIds:['islamqa1692','islamqa7180'] },
      { name:'Abd al-Husayn', arabic:'عبد الحسين', meaning:'« serviteur d’al-Husayn »', verdict:'Interdit', explanation:'Le problème n’est pas le nom Husayn lui-même, mais la construction de servitude envers une créature.', variants:['Abdelhussein','Abd al-Hussein'], sourceIds:['islamqa1692'] },
      { name:'Ar-Rahman', arabic:'الرحمن', meaning:'« Le Tout Miséricordieux »', verdict:'Interdit comme nom propre absolu', explanation:'Ar-Rahman fait partie des Noms exclusivement réservés à Allah. Cela ne concerne pas la construction correcte ʿAbd ar-Rahman.', sourceIds:['islamqa1692','islamqa7180'] },
      { name:'Al-Khaliq', arabic:'الخالق', meaning:'« Le Créateur »', verdict:'Interdit comme nom propre absolu', explanation:'Al-Khaliq est cité parmi les Noms exclusivement réservés à Allah. Les adjectifs humains permis n’ont pas tous le même jugement.', sourceIds:['islamqa1692','islamqa7180'] },
      { name:'Malik al-Muluk', arabic:'ملك الملوك', meaning:'« Roi des rois »', verdict:'Interdit', explanation:'Cette appellation est explicitement condamnée dans des hadiths authentiques rapportés par al-Bukhari et Muslim.', variants:['Malik al-Amlak'], sourceIds:['muslim2143','islamqa1692'] },
      { name:'Iblis', arabic:'إبليس', meaning:'nom du diable dans le Coran', verdict:'Interdit', explanation:'Les références de fiqh citées classent les noms de démons parmi les noms qu’il n’est pas permis de donner.', sourceIds:['islamqa1692','islamqa7180','uthaymeenNames'] },
      { name:'Khanzab', arabic:'خنزب', meaning:'nom rapporté d’un démon', verdict:'Interdit', explanation:'Les noms de shayatin sont classés parmi les noms à ne pas donner.', sourceIds:['islamqa1692'] },
      { name:'Al-Lat / Al-ʿUzza / Manat', arabic:'اللات · العزى · مناة', meaning:'noms d’idoles préislamiques', verdict:'Interdit', explanation:'Nommer un enfant d’après une idole ou une fausse divinité entre dans les interdictions mentionnées par les juristes.', sourceIds:['islamqa1692','islamqa7180'] },
    ],
  },
  {
    id: 'tyrants',
    title: 'Pharaons, tyrans et figures de rébellion',
    eyebrow: 'À ÉCARTER',
    tone: 'avoid',
    summary: 'Les savants ont employé des formulations allant de « réprouvé » à « interdit » selon les auteurs pour les noms emblématiques de tyrannie et de rébellion.',
    rule: 'OUMMAH recommande de ne pas choisir ces noms. Lorsque les sources divergent sur le degré juridique exact, la page le dit au lieu d’inventer un consensus.',
    examples: [
      { name:'Firʿawn / Pharaon', arabic:'فرعون', meaning:'titre du souverain tyrannique dans le récit de Musa', verdict:'À proscrire', explanation:'IslamQA le classe parmi les noms réprouvés de pharaons et tyrans. Cheikh Ibn ʿUthaymin emploie une formulation plus sévère et dit qu’il est interdit de se nommer par les noms des pharaons, en donnant Firʿawn comme exemple.', variants:['Firaoun','Firawn'], sourceIds:['islamqa7180','uthaymeenNames','islamqa204257'] },
      { name:'Haman', arabic:'هامان', meaning:'figure associée à Firʿawn dans le Coran', verdict:'À éviter fortement', explanation:'Cité parmi les noms de pécheurs et figures de tyrannie que les références recommandent d’éviter.', sourceIds:['islamqa7180','islamqa204257'] },
      { name:'Qarun', arabic:'قارون', meaning:'figure coranique associée à l’orgueil et à la richesse arrogante', verdict:'À éviter fortement', explanation:'Sa présence dans le Coran n’en fait pas un prénom recommandé ; il est cité parmi les figures dont le nom est réprouvé.', variants:['Karun'], sourceIds:['islamqa7180','islamqa204257'] },
      { name:'Ramsès', arabic:'رمسيس', meaning:'nom dynastique de plusieurs pharaons d’Égypte', verdict:'Prudence : à éviter', explanation:'Ramsès n’est pas cité nommément dans les références ci-dessous. OUMMAH l’écarte par prudence en raison de son association directe à la titulature pharaonique ; on ne lui attribue pas artificiellement le même degré de preuve que Firʿawn.', variants:['Ramses','Ramesses'], sourceIds:['islamqa7180','uthaymeenNames'] },
    ],
  },
  {
    id: 'divination',
    title: 'Divination, sorcellerie et mauvais sens religieux',
    eyebrow: 'SENS PROBLÉMATIQUE',
    tone: 'avoid',
    summary: 'Un prénom peut être problématique par ce qu’il signifie, même s’il sonne bien ou s’il est devenu culturellement courant.',
    rule: 'Le sens doit être vérifié avant de conclure. OUMMAH ne transforme pas une simple ressemblance sonore en verdict religieux.',
    examples: [
      { name:'Kahin', arabic:'كاهن', meaning:'devin / soothsayer', verdict:'À éviter fortement', explanation:'En arabe, kāhin désigne un devin. La kahāna est condamnée dans la Sunna. Il n’existe pas dans les sources retenues un hadith disant textuellement « le prénom Kahin est interdit » : le problème vient de son sens religieux mauvais.', sourceIds:['muslimKahin','islamqa7180'] },
      { name:'Kahina', arabic:'كاهنة', meaning:'devineresse / femme pratiquant la divination', verdict:'À éviter fortement', explanation:'Le mot arabe kāhina est le féminin de kāhin. La pratique de la divination est condamnée ; employer ce mot comme prénom porte donc un sens que l’on recommande d’écarter.', variants:['Kahena','Kahéna'], sourceIds:['muslimKahin','islamqa7180'] },
      { name:'Sariq', arabic:'سارق', meaning:'voleur', verdict:'Déconseillé', explanation:'Les noms qui signifient un péché ou une mauvaise action sont réprouvés.', sourceIds:['islamqa7180'] },
      { name:'Zalim', arabic:'ظالم', meaning:'injuste / oppresseur', verdict:'Déconseillé', explanation:'Le sens est directement négatif et lié à l’injustice.', sourceIds:['islamqa7180'] },
      { name:'Harb', arabic:'حرب', meaning:'guerre', verdict:'Déconseillé', explanation:'Les références de fiqh citent Harb parmi les noms au sens dur ou déplaisant qu’il vaut mieux délaisser.', sourceIds:['islamqa7180'] },
    ],
  },
  {
    id: 'self-praise',
    title: 'Auto-éloge et grands termes religieux',
    eyebrow: 'TAZKIYA',
    tone: 'disputed',
    summary: 'Certains prénoms semblent beaux parce qu’ils signifient foi, piété ou vertu, mais plusieurs savants les ont déconseillés lorsqu’ils ressemblent à une attestation de vertu sur la personne.',
    rule: 'Il existe des divergences sur certains de ces noms. OUMMAH affiche donc « préférable d’éviter » plutôt que « haram » lorsque l’interdiction n’est pas établie.',
    examples: [
      { name:'Barrah', arabic:'برّة', meaning:'très pieuse / vertueuse', verdict:'À éviter : texte explicite sur la tazkiya', explanation:'Le Prophète ﷺ a changé le nom Barrah et a dit de ne pas se déclarer soi-même pur/vertueux. C’est le cas de référence de l’auto-éloge dans les noms.', variants:['Barra','Birra'], sourceIds:['muslim2142','islamqa222715'] },
      { name:'Abrar', arabic:'أبرار', meaning:'les pieux / les vertueux', verdict:'Déconseillé', explanation:'Cheikh Ibn ʿUthaymin rapproche Abrar de Barrah en raison de la tazkiya et recommande de ne pas l’employer.', sourceIds:['uthaymeenIman','islamqa222715'] },
      { name:'Iman', arabic:'إيمان', meaning:'foi', verdict:'Préférable d’éviter selon plusieurs savants', explanation:'Il existe une divergence. Ibn ʿUthaymin y voyait une tazkiya et recommandait de changer ce choix ; d’autres savants ne le déclarent pas interdit. OUMMAH conseille un prénom moins litigieux.', variants:['Imane','Eman'], sourceIds:['uthaymeenIman','islamqa222715','islamqa320821'] },
      { name:'Taqwa', arabic:'تقوى', meaning:'piété / crainte révérencielle d’Allah', verdict:'Déconseillé', explanation:'Des savants l’ont réprouvé pour l’idée d’auto-éloge. Une source de fiqh contemporaine le classe explicitement parmi les choix à éviter.', variants:['Takwa','Taqoua'], sourceIds:['islamqa141081','islamqa222715'] },
      { name:'Islam', arabic:'إسلام', meaning:'soumission à Allah / islam', verdict:'Prudence : préférable de choisir autre chose', explanation:'Les savants contemporains ont divergé sur la présence d’une tazkiya. La recommandation prudente est de ne pas choisir ce prénom au départ, sans déclarer automatiquement illicite celui qui le porte déjà.', sourceIds:['islamqa320821'] },
      { name:'Nur al-Islam / Sayf al-Islam', arabic:'نور الإسلام · سيف الإسلام', meaning:'« lumière de l’islam » / « épée de l’islam »', verdict:'Déconseillé', explanation:'Les constructions ajoutées à « al-Islam » ou « ad-Din » ont été réprouvées par de nombreux savants parce qu’elles attribuent au porteur une grandeur qui dépasse sa personne.', variants:['Nour al-Islam','Saif al-Islam'], sourceIds:['islamqa1692','islamqa7180'] },
    ],
  },
  {
    id: 'angels',
    title: 'Noms des anges',
    eyebrow: 'PRÉFÉRABLE DE NE PAS LES DONNER',
    tone: 'disputed',
    summary: 'Il existe une divergence ancienne : de nombreux juristes les permettent, tandis que l’imam Malik et d’autres les ont réprouvés. La voie prudente retenue ici est de choisir un autre prénom.',
    rule: 'OUMMAH ne les étiquette pas « haram par consensus ». L’application indique toutefois clairement qu’il est préférable de ne pas les donner, conformément à l’avis prudent rapporté et au conseil de savants comme l’imam Malik ; Cheikh Ibn ʿUthaymin déconseille également des choix de ce type lorsqu’ils sont douteux.',
    examples: [
      { name:'Djibril / Jibril', arabic:'جبريل', meaning:'nom de l’ange chargé de la révélation', verdict:'Préférable de ne pas le donner', explanation:'L’imam Malik a réprouvé ce choix. D’autres juristes l’ont permis. La synthèse retenue par la source IslamQA conseille de ne pas utiliser les noms d’anges.', variants:['Jibril','Jibreel','Gabriel'], sourceIds:['islamqa135','uthaymeenNames'] },
      { name:'Mikail', arabic:'ميكائيل', meaning:'nom de l’ange Mikail', verdict:'Préférable de ne pas le donner', explanation:'Même divergence : permission chez de nombreux juristes, réprobation rapportée de l’imam Malik. OUMMAH recommande la prudence.', variants:['Mikaïl','Mikael','Mikhaïl'], sourceIds:['islamqa135','uthaymeenNames'] },
      { name:'Israfil', arabic:'إسرافيل', meaning:'nom traditionnel de l’ange chargé de souffler dans la Trompe', verdict:'Préférable de ne pas le donner', explanation:'Il entre dans la même discussion juridique sur l’usage des noms d’anges.', variants:['Israfel'], sourceIds:['islamqa135','uthaymeenNames'] },
      { name:'Malak', arabic:'مَلَك', meaning:'ange', verdict:'Préférable de ne pas le donner', explanation:'Cheikh Ibn ʿUthaymin a explicitement dit qu’il n’aimait pas ce prénom et a conseillé de laisser ce qui suscite un doute quand de nombreux autres noms existent.', variants:['Malaak','Malek (à distinguer selon le mot arabe visé)'], sourceIds:['uthaymeenMalak'] },
    ],
  },
  {
    id: 'animals',
    title: 'Noms d’animaux : ne pas tout mélanger',
    eyebrow: 'LE SENS COMPTE',
    tone: 'context',
    summary: 'Le simple fait qu’un prénom soit aussi un nom d’animal ne le rend pas interdit. Les juristes ont surtout réprouvé les animaux connus pour des qualités dégradantes.',
    rule: 'On regarde le sens recherché et l’usage. Un animal associé à une qualité noble n’a pas le même jugement qu’un terme utilisé comme insulte ou portant une qualité méprisable.',
    examples: [
      { name:'Asad', arabic:'أسد', meaning:'lion', verdict:'Permis en principe', explanation:'Le lion évoque traditionnellement la force et le courage. La règle citée ne condamne pas tous les noms d’animaux ; elle vise ceux connus pour des caractéristiques méprisables.', variants:['Assad'], sourceIds:['islamqa1692'] },
      { name:'Fahd', arabic:'فهد', meaning:'panthère / léopard selon l’usage lexical', verdict:'Permis en principe', explanation:'Comme pour Asad, il faut regarder la connotation et l’usage. Ce n’est pas automatiquement un nom interdit parce qu’il désigne un animal.', variants:['Fahed'], sourceIds:['islamqa1692'] },
      { name:'Kalb', arabic:'كلب', meaning:'chien', verdict:'Déconseillé', explanation:'Les références citent les animaux connus pour des qualités jugées dégradantes, comme le chien, l’âne ou le singe, parmi les noms réprouvés lorsqu’ils sont employés comme prénoms.', sourceIds:['islamqa1692','islamqa7180'] },
      { name:'Himar', arabic:'حمار', meaning:'âne', verdict:'Déconseillé', explanation:'Exemple cité parmi les noms d’animaux à connotation dépréciative qu’il vaut mieux ne pas donner.', sourceIds:['islamqa1692','islamqa7180'] },
      { name:'Qird', arabic:'قرد', meaning:'singe', verdict:'Déconseillé', explanation:'Même règle : le problème tient à la connotation dégradante, pas à la catégorie « animal » en elle-même.', sourceIds:['islamqa7180'] },
    ],
  },
];
