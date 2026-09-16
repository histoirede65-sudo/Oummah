export type ProphetSourceKind = "QURAN" | "SUNNA" | "TAFSIR";

export type ProphetReference = {
  kind: ProphetSourceKind;
  label: string;
  surahId?: number;
  verse?: number;
  note: string;
};

export type ProphetChapter = {
  id: string;
  index: number;
  title: string;
  subtitle: string;
  image: number;
  atmosphere: string;
  paragraphs: string[];
  references: ProphetReference[];
  lessons: string[];
};

export const MUSA_CHAPTERS: ProphetChapter[] = [
  {
    id: "nile", index: 1, title: "L’enfant confié au fleuve", subtitle: "Une promesse au milieu de la peur",
    image: require("../../assets/images/prophets/musa-scenes/musa-board-01.jpg"), atmosphere: "Le Nil · l’enfance · la confiance",
    paragraphs: [
      "Pharaon domine alors l’Égypte et opprime une partie de ses habitants : il affaiblit les Enfants d’Israël et fait tuer leurs fils tout en laissant vivre leurs femmes. C’est dans ce contexte de peur que commence l’histoire de Moussa telle que la raconte la sourate Al-Qasas.",
      "Allah inspire à la mère de Moussa de l’allaiter. Lorsqu’elle craint pour lui, elle reçoit un ordre qui paraît humainement vertigineux : le placer dans le fleuve. Mais cet ordre est accompagné d’une promesse précise : ne pas avoir peur ni s’attrister, car Allah le lui rendra et fera de lui l’un des messagers.",
      "Le courant conduit l’enfant jusqu’à la famille de Pharaon. La femme de Pharaon demande qu’il ne soit pas tué et espère qu’il puisse devenir une joie pour eux. Pendant ce temps, le cœur de la mère de Moussa est bouleversé ; Allah l’affermit afin qu’elle demeure parmi les croyants.",
      "La sœur de Moussa suit discrètement sa trace. Allah lui fait refuser les nourrices, jusqu’à ce que sa sœur propose une famille capable de prendre soin de lui. Ainsi, sa propre mère retrouve son enfant et peut de nouveau l’allaiter.",
      "Le Coran donne lui-même le sens de ce retour : que l’œil de sa mère se réjouisse, qu’elle ne s’afflige plus et qu’elle sache que la promesse d’Allah est vraie. Dès le début du récit, la délivrance se construit au cœur même du lieu du danger."
    ],
    references: [{ kind: "QURAN", label: "Al-Qasas 28:3–13", surahId: 28, verse: 3, note: "L’oppression de Pharaon, l’inspiration donnée à la mère de Moussa, le fleuve et le retour auprès de sa mère." }],
    lessons: ["La confiance en Allah accompagne l’action et les moyens concrets.", "La promesse d’Allah peut se réaliser par des chemins impossibles à prévoir.", "Le récit coranique suffit : aucun détail romancé n’a besoin d’être ajouté."]
  },
  {
    id: "youth", index: 2, title: "Une erreur, puis le retour", subtitle: "Reconnaître sa faute et demander pardon",
    image: require("../../assets/images/prophets/musa-scenes/musa-board-02.jpg"), atmosphere: "Égypte · erreur · repentir",
    paragraphs: [
      "Lorsque Moussa atteint sa pleine force et sa maturité, Allah lui accorde jugement et savoir. Un jour, il entre dans la ville à un moment où ses habitants sont inattentifs et y trouve deux hommes qui se battent : l’un appartient à son peuple, l’autre au camp de son ennemi.",
      "Celui de son peuple lui demande secours. Moussa frappe l’autre homme et le coup entraîne sa mort. Le récit ne transforme pas l’événement en victoire : Moussa reconnaît immédiatement la gravité de ce qui vient de se produire et demande pardon à son Seigneur.",
      "Allah lui pardonne. Moussa promet alors de ne plus être un soutien pour les criminels. Le lendemain, il se retrouve pourtant de nouveau face à une situation de conflit et comprend que sa position dans la ville est devenue dangereuse.",
      "Un homme arrive en courant depuis l’extrémité de la ville et l’avertit que les notables délibèrent à son sujet et veulent le tuer. Il lui conseille de partir. Moussa quitte alors l’Égypte, seul, dans la crainte et sur ses gardes.",
      "Son départ commence par une invocation : il demande à son Seigneur de le sauver des gens injustes. Le récit passe ainsi de la faute reconnue au repentir, puis du repentir à une nouvelle étape de sa vie."
    ],
    references: [{ kind: "QURAN", label: "Al-Qasas 28:14–21", surahId: 28, verse: 14, note: "L’altercation, la mort involontaire, le repentir puis le départ d’Égypte." }],
    lessons: ["Le Coran montre la faute sans l’embellir et le repentir sans délai.", "Reconnaître son erreur est une force spirituelle.", "Se mettre à l’abri d’un danger réel fait partie des moyens permis."]
  },
  {
    id: "madyan", index: 3, title: "Le refuge de Madyan", subtitle: "Servir alors que l’on manque de tout",
    image: require("../../assets/images/prophets/musa-scenes/musa-board-03.jpg"), atmosphere: "Madyan · eau · secours",
    paragraphs: [
      "Après avoir quitté l’Égypte, Moussa se dirige vers Madyan. Il ne présente pas son voyage comme maîtrisé d’avance : il demande à son Seigneur de le guider vers la voie droite. Cette invocation accompagne un homme qui vient de laisser derrière lui sa ville et sa sécurité.",
      "À son arrivée au point d’eau de Madyan, il trouve un groupe d’hommes faisant boire leurs troupeaux. À l’écart, deux femmes retiennent leurs bêtes. Lorsqu’il leur demande pourquoi elles attendent, elles expliquent qu’elles ne peuvent abreuver leur troupeau avant le départ des bergers et que leur père est âgé.",
      "Moussa abreuve alors leur troupeau pour elles. Il ne demande rien en retour. Après les avoir aidées, il se retire à l’ombre et adresse à Allah une invocation très simple : il se reconnaît dans le besoin de tout bien que son Seigneur voudra faire descendre vers lui.",
      "L’une des deux femmes revient ensuite vers lui en marchant avec pudeur. Elle lui annonce que son père souhaite le rencontrer afin de le récompenser pour son aide. Moussa lui raconte son histoire et reçoit cette parole rassurante : il n’a plus à craindre les gens injustes.",
      "L’une des femmes propose à son père de l’engager, en soulignant la force et la fiabilité. Un accord est alors proposé à Moussa pour qu’il travaille plusieurs années. Après la fuite et l’incertitude, Madyan devient pour lui un lieu de sécurité, de travail et de stabilité."
    ],
    references: [{ kind: "QURAN", label: "Al-Qasas 28:22–28", surahId: 28, verse: 22, note: "L’arrivée à Madyan, le service au point d’eau, l’invocation et l’accord conclu." }],
    lessons: ["Même dans le besoin, Moussa commence par rendre service.", "L’invocation peut être simple, directe et profondément confiante.", "Après la peur vient une période de stabilité accordée par Allah."]
  },
  {
    id: "tuwa", index: 4, title: "L’appel dans la vallée sacrée", subtitle: "Ṭuwâ : lorsque la mission commence",
    image: require("../../assets/images/prophets/musa-scenes/musa-board-04.jpg"), atmosphere: "Ṭuwâ · nuit · révélation",
    paragraphs: [
      "Lorsque Moussa a accompli la période convenue à Madyan, il repart avec sa famille. Sur la route, il aperçoit un feu du côté du mont. Il dit aux siens de rester là pendant qu’il s’en approche, espérant rapporter une information sur le chemin ou une braise pour se réchauffer.",
      "Lorsqu’il atteint le feu, il est appelé dans la vallée sacrée de Ṭuwâ. Allah lui ordonne de retirer ses sandales et lui annonce qu’Il l’a choisi. Il lui commande de L’adorer et d’accomplir la prière pour se souvenir de Lui.",
      "Moussa reçoit ensuite deux signes. Son bâton, qu’il utilisait dans sa vie quotidienne, devient par la permission d’Allah un signe extraordinaire ; sa main ressort également lumineuse, sans mal. Ces signes ne sont pas des artifices : ils accompagnent la mission qui va lui être confiée.",
      "Allah lui ordonne d’aller vers Pharaon, qui a dépassé les limites. Face à l’ampleur de la tâche, Moussa ne prétend pas pouvoir tout accomplir seul. Il demande que sa poitrine soit ouverte, que sa mission soit facilitée et que le nœud de sa langue soit délié afin que sa parole soit comprise.",
      "Il demande aussi que son frère Hârûn devienne son soutien. Allah lui répond que sa demande est accordée. Le retour vers l’Égypte n’est donc plus celui d’un fugitif : Moussa revient désormais porteur d’une mission."
    ],
    references: [
      { kind: "QURAN", label: "Tâ-Hâ 20:9–36", surahId: 20, verse: 9, note: "Le feu, Ṭuwâ, les signes et l’invocation de Moussa." },
      { kind: "QURAN", label: "Al-Qasas 28:29–35", surahId: 28, verse: 29, note: "Le retour depuis Madyan et la mission confiée à Moussa." }
    ],
    lessons: ["Une mission immense peut commencer dans un moment de solitude.", "Moussa demande les capacités nécessaires avant le résultat.", "Demander l’aide d’un proche compétent fait partie des moyens."]
  },
  {
    id: "pharaoh-call", index: 5, title: "Parler à Pharaon", subtitle: "La vérité, sans perdre la justesse",
    image: require("../../assets/images/prophets/musa-scenes/musa-board-05.jpg"), atmosphere: "Palais · appel · signes",
    paragraphs: [
      "Moussa et Hârûn reçoivent l’ordre d’aller ensemble vers Pharaon. Malgré la tyrannie de celui-ci, Allah leur commande de lui adresser une parole douce, dans l’espoir qu’il se rappelle ou qu’il craigne. La douceur du discours n’efface donc ni la vérité du message ni la gravité de l’injustice.",
      "Les deux frères expriment leur crainte que Pharaon ne se précipite contre eux ou ne dépasse encore les limites. Allah les rassure : Il est avec eux, entend et voit. Ils doivent se présenter comme les messagers de leur Seigneur et demander que les Enfants d’Israël soient laissés partir.",
      "Pharaon rappelle à Moussa son enfance passée parmi eux et l’événement qui avait entraîné sa fuite. Moussa ne nie pas son passé. Il répond qu’il avait agi alors qu’il était parmi ceux qui ne savaient pas, qu’il avait fui lorsqu’il les craignait, puis que son Seigneur lui avait accordé jugement et l’avait fait messager.",
      "Le dialogue se poursuit autour du Seigneur des mondes. Moussa parle du Seigneur des cieux, de la terre et de ce qui se trouve entre eux, puis du Seigneur de leurs ancêtres et du Seigneur de l’Orient et de l’Occident. Pharaon répond par la dérision et la menace.",
      "Moussa présente alors les signes qui lui ont été donnés. Pharaon les qualifie de magie et cherche une confrontation publique. La vérité va désormais être exposée devant la population."
    ],
    references: [
      { kind: "QURAN", label: "Tâ-Hâ 20:43–56", surahId: 20, verse: 43, note: "L’ordre de parler avec douceur et les premiers échanges avec Pharaon." },
      { kind: "QURAN", label: "Ash-Shu‘arâ 26:10–33", surahId: 26, verse: 10, note: "La mission de Moussa et Hârûn et la présentation des signes." }
    ],
    lessons: ["La fermeté dans la vérité n’exige pas la brutalité.", "Le pouvoir ne transforme pas le faux en vrai.", "La mission reste centrée sur le rappel d’Allah."]
  },
  {
    id: "magicians", index: 6, title: "Le jour des magiciens", subtitle: "Quand ceux qui savent reconnaissent le signe",
    image: require("../../assets/images/prophets/musa-scenes/musa-board-06.jpg"), atmosphere: "Rassemblement · bâtons · prosternation",
    paragraphs: [
      "Pharaon fait rassembler les magiciens et fixe un rendez-vous public. La confrontation doit avoir lieu devant les gens, afin que le pouvoir puisse transformer l’événement en démonstration contre Moussa.",
      "Les magiciens demandent à Pharaon s’ils recevront une récompense en cas de victoire. Il leur promet non seulement une récompense, mais aussi de les rapprocher de lui. Ils arrivent donc avec la volonté de l’emporter et avec la reconnaissance du pouvoir en perspective.",
      "Lorsque vient leur tour, ils jettent leurs cordes et leurs bâtons. Par leur magie, ils donnent l’impression qu’ils se déplacent. Le Coran rapporte que Moussa ressent alors une crainte en lui-même, mais Allah le rassure et lui annonce qu’il aura le dessus.",
      "Moussa jette son bâton sur ordre d’Allah. Le signe engloutit ce qu’ils avaient fabriqué. Ceux qui connaissent le mieux les procédés de la magie comprennent immédiatement qu’ils ne sont pas devant une technique semblable à la leur.",
      "Les magiciens tombent prosternés et déclarent croire au Seigneur de Hârûn et de Moussa. Pharaon les menace de mutilation et de crucifixion. Mais leur regard a changé : ils préfèrent désormais ce qu’ils ont reconnu comme vérité aux menaces du souverain."
    ],
    references: [
      { kind: "QURAN", label: "Tâ-Hâ 20:57–73", surahId: 20, verse: 57, note: "La confrontation publique et la foi des magiciens." },
      { kind: "QURAN", label: "Al-A‘râf 7:111–126", surahId: 7, verse: 111, note: "Le rassemblement, le signe et la réaction des magiciens." }
    ],
    lessons: ["La connaissance peut permettre de reconnaître plus vite ce qui dépasse l’art humain.", "La vérité peut bouleverser une vie en un instant.", "La foi des magiciens devient plus forte que la peur du tyran."]
  },
  {
    id: "signs-egypt", index: 7, title: "Les signes en Égypte", subtitle: "Des avertissements répétés, puis oubliés",
    image: require("../../assets/images/prophets/musa-scenes/musa-board-07.jpg"), atmosphere: "Égypte · avertissements · obstination",
    paragraphs: [
      "Après la confrontation avec les magiciens, l’obstination de Pharaon et des siens ne disparaît pas. Le Coran mentionne d’abord des années de disette et une diminution des récoltes afin qu’ils se rappellent.",
      "Lorsqu’un bien leur arrive, ils se l’attribuent ; lorsqu’un mal les atteint, ils cherchent un mauvais présage du côté de Moussa et de ceux qui sont avec lui. Le récit montre ainsi comment les signes peuvent être détournés par celui qui refuse d’en tirer une leçon.",
      "Allah envoie ensuite plusieurs signes distincts : le déluge, les sauterelles, les poux, les grenouilles et le sang. Le Coran les présente comme des signes détaillés, mais Pharaon et les siens continuent de s’enorgueillir.",
      "À chaque fois que l’épreuve les atteint, ils demandent à Moussa d’invoquer son Seigneur en s’appuyant sur l’engagement qu’Allah a pris avec lui. Ils promettent alors de croire et de laisser partir les Enfants d’Israël.",
      "Mais lorsque l’épreuve est levée jusqu’au terme qui leur est fixé, ils rompent leur promesse. L’histoire insiste ainsi sur une succession d’avertissements, de promesses et de rechutes avant le dénouement final."
    ],
    references: [{ kind: "QURAN", label: "Al-A‘râf 7:130–135", surahId: 7, verse: 130, note: "Les années difficiles, les signes successifs et les engagements rompus." }],
    lessons: ["Un signe ne profite pas à celui qui choisit continuellement l’obstination.", "Les promesses faites dans la difficulté doivent survivre au retour de l’aisance.", "Le récit insiste sur la répétition du refus avant le dénouement."]
  },
  {
    id: "exodus", index: 8, title: "Le départ dans la nuit", subtitle: "Quitter l’oppression sur ordre d’Allah",
    image: require("../../assets/images/prophets/musa-scenes/musa-board-08.jpg"), atmosphere: "Nuit · exode · poursuite",
    paragraphs: [
      "Après les avertissements répétés, Allah ordonne à Moussa de partir de nuit avec Ses serviteurs. Il ne s’agit plus seulement de demander leur libération à Pharaon : le moment est venu de quitter effectivement l’Égypte.",
      "Le départ se fait sous la menace d’une poursuite. Pharaon envoie dans les villes des rassembleurs afin de réunir ses forces. Le Coran rapporte son discours méprisant sur le groupe qui vient de partir, alors même qu’il mobilise une armée pour les rattraper.",
      "Les forces de Pharaon se lancent à leur poursuite et finissent par apercevoir les Enfants d’Israël au lever du soleil. Devant eux se trouve la mer ; derrière eux approche l’armée qui les opprimait.",
      "Les compagnons de Moussa s’écrient qu’ils vont être rejoints. La réponse de Moussa est brève : non. Il affirme que son Seigneur est avec lui et qu’Il le guidera.",
      "À cet instant, aucune issue ordinaire n’est encore visible. Le récit place donc la confiance juste avant l’ouverture du chemin, et non après."
    ],
    references: [
      { kind: "QURAN", label: "Ash-Shu‘arâ 26:52–62", surahId: 26, verse: 52, note: "L’ordre de partir, la poursuite et la parole de confiance de Moussa." },
      { kind: "QURAN", label: "Tâ-Hâ 20:77", surahId: 20, verse: 77, note: "L’ordre donné à Moussa de partir de nuit avec les Enfants d’Israël." }
    ],
    lessons: ["La confiance apparaît pleinement lorsque les causes visibles semblent se fermer.", "Moussa ne nie pas le danger : il affirme la guidance d’Allah au cœur du danger.", "La délivrance arrive après une longue patience."]
  },
  {
    id: "sea", index: 9, title: "La mer s’ouvre", subtitle: "Un passage là où aucune route n’existait",
    image: require("../../assets/images/prophets/musa-scenes/musa-board-09.jpg"), atmosphere: "Mer · passage · délivrance",
    paragraphs: [
      "Alors que la mer bloque le passage, Allah ordonne à Moussa de la frapper avec son bâton. La mer se fend. La sourate Ash-Shu‘arâ décrit chacune de ses parties comme une immense montagne.",
      "Un passage s’ouvre pour Moussa et les Enfants d’Israël. La sourate Tâ-Hâ précise qu’un chemin sec leur est tracé dans la mer : ils n’ont pas à craindre d’être rejoints ni à redouter la noyade pendant leur traversée.",
      "Pharaon et ses soldats s’engagent à leur suite. La route qui a été une délivrance pour les opprimés devient le lieu où s’achève la poursuite de leurs oppresseurs.",
      "Lorsque Moussa et ceux qui l’accompagnent sont sauvés, les eaux recouvrent Pharaon et son armée. Au moment de la noyade, Pharaon proclame croire, mais le Coran lui rappelle son ancienne désobéissance et sa corruption.",
      "Le récit mentionne que son corps sera préservé afin qu’il soit un signe pour ceux qui viendront après lui. La traversée n’est donc pas seulement la fin d’une poursuite : elle devient un rappel transmis aux générations suivantes."
    ],
    references: [
      { kind: "QURAN", label: "Ash-Shu‘arâ 26:63–68", surahId: 26, verse: 63, note: "La mer fendue, le passage et la noyade des poursuivants." },
      { kind: "QURAN", label: "Yûnus 10:90–92", surahId: 10, verse: 90, note: "La noyade de Pharaon et le signe laissé aux générations suivantes." }
    ],
    lessons: ["Allah peut ouvrir une issue là où aucune route n’est visible.", "La puissance politique ne protège pas du jugement d’Allah.", "La délivrance est un signe à méditer, pas seulement une scène spectaculaire."]
  },
  {
    id: "after-sea", index: 10, title: "Après la délivrance", subtitle: "Être sauvé ne met pas fin aux épreuves",
    image: require("../../assets/images/prophets/musa-scenes/musa-board-10.jpg"), atmosphere: "Désert · rappel · impatience",
    paragraphs: [
      "À peine la mer traversée, les Enfants d’Israël passent auprès d’un peuple attaché à ses idoles. Ils demandent alors à Moussa de leur établir une divinité semblable à celles de ce peuple. La demande survient après une délivrance extraordinaire dont ils viennent d’être témoins.",
      "Moussa leur répond qu’ils sont dans l’ignorance et leur rappelle que ce à quoi ces gens s’attachent est voué à disparaître. Il leur demande comment il pourrait rechercher pour eux une autre divinité qu’Allah alors qu’Il les a favorisés.",
      "Le Coran rappelle également les bienfaits accordés dans le désert : l’ombre des nuages, la manne et les cailles, ainsi que l’eau obtenue lorsque Moussa frappe la pierre et que douze sources en jaillissent pour les groupes du peuple.",
      "Pourtant, les réactions d’ingratitude et d’impatience apparaissent encore. Certains réclament d’autres nourritures et le récit leur rappelle les conséquences de la désobéissance et de l’agression injuste.",
      "La traversée a mis fin à la domination de Pharaon sur eux, mais elle n’a pas instantanément transformé leurs habitudes ni leurs cœurs. Une nouvelle phase commence : celle de l’éducation d’une communauté libérée."
    ],
    references: [
      { kind: "QURAN", label: "Al-A‘râf 7:138–141", surahId: 7, verse: 138, note: "La demande d’une idole après la traversée et le rappel de Moussa." },
      { kind: "QURAN", label: "Al-Baqara 2:57–61", surahId: 2, verse: 57, note: "Des bienfaits accordés aux Enfants d’Israël et certaines de leurs réactions dans le désert." }
    ],
    lessons: ["Une délivrance extérieure ne produit pas automatiquement une réforme intérieure.", "Les bienfaits demandent gratitude et fidélité.", "L’histoire continue après le miracle : l’éducation d’une communauté prend du temps."]
  },
  {
    id: "mount", index: 11, title: "Le rendez-vous du Mont", subtitle: "Les Tables et la parole adressée à Moussa",
    image: require("../../assets/images/prophets/musa-scenes/musa-board-11.jpg"), atmosphere: "Mont · révélation · alliance",
    paragraphs: [
      "Allah fixe à Moussa un rendez-vous de trente nuits, puis les complète par dix autres. Avant de partir, Moussa confie son peuple à son frère Hârûn et lui demande de le remplacer, d’œuvrer à la réforme et de ne pas suivre la voie des corrupteurs.",
      "Lorsque Moussa arrive au rendez-vous et que son Seigneur lui parle, il demande à voir Allah. Il lui est répondu qu’il ne Le verra pas, puis son regard est orienté vers le mont : s’il demeure en place, alors il pourra voir.",
      "Lorsque son Seigneur se manifeste au mont, celui-ci est réduit en poussière et Moussa tombe foudroyé. À son réveil, il glorifie Allah, se repent et affirme être le premier des croyants dans ce contexte.",
      "Allah lui annonce qu’Il l’a choisi parmi les hommes par Ses messages et par Sa parole. Il lui ordonne de prendre ce qui lui est donné et d’être parmi les reconnaissants.",
      "Des exhortations et une explication de toute chose nécessaire lui sont inscrites sur les Tables. Moussa reçoit l’ordre de les tenir avec force et d’ordonner à son peuple d’en prendre le meilleur. La révélation devient ainsi une responsabilité à porter et à transmettre."
    ],
    references: [{ kind: "QURAN", label: "Al-A‘râf 7:142–145", surahId: 7, verse: 142, note: "Le rendez-vous, la parole adressée à Moussa et les Tables." }],
    lessons: ["La proximité accordée à Moussa ne supprime pas sa condition de serviteur.", "La révélation s’accompagne de responsabilité.", "Les Tables sont reçues pour être tenues avec force et transmises au peuple."]
  },
  {
    id: "calf", index: 12, title: "L’épreuve du veau", subtitle: "Une communauté éprouvée pendant l’absence de Moussa",
    image: require("../../assets/images/prophets/musa-scenes/musa-board-12.jpg"), atmosphere: "Camp · veau · retour",
    paragraphs: [
      "Pendant que Moussa se trouve au rendez-vous de son Seigneur, son peuple est éprouvé en son absence. Le Coran rapporte qu’al-Sâmirî les conduit vers un veau doté d’un mugissement, et certains disent alors qu’il s’agit de leur divinité et de celle de Moussa.",
      "Hârûn les avait pourtant avertis avant le retour de son frère : ils sont seulement mis à l’épreuve par ce veau, leur Seigneur est le Tout Miséricordieux et ils doivent le suivre et lui obéir. Une partie du peuple refuse et affirme qu’elle restera attachée au veau jusqu’au retour de Moussa.",
      "Moussa revient en colère et profondément attristé. Il reproche au peuple d’avoir rompu l’engagement et se tourne aussi vers Hârûn. Celui-ci lui explique qu’il a craint qu’une rupture plus grave ne se produise parmi les Enfants d’Israël et qu’on lui reproche ensuite d’avoir divisé le peuple.",
      "Moussa interroge ensuite al-Sâmirî. Le Coran rapporte sa réponse puis la sanction qui lui est annoncée. Moussa se tourne enfin vers le veau lui-même : il annonce qu’il sera brûlé puis dispersé dans la mer.",
      "Le passage se conclut par un rappel sans ambiguïté : leur véritable divinité est Allah, il n’y a de divinité que Lui et Sa science embrasse toute chose. L’épreuve du veau devient ainsi un rappel du tawhîd après la délivrance."
    ],
    references: [
      { kind: "QURAN", label: "Tâ-Hâ 20:83–98", surahId: 20, verse: 83, note: "L’épreuve du veau, Hârûn, le retour de Moussa et al-Sâmirî." },
      { kind: "QURAN", label: "Al-A‘râf 7:148–154", surahId: 7, verse: 148, note: "Le veau, le retour de Moussa et les Tables." }
    ],
    lessons: ["Les grandes expériences spirituelles n’immunisent pas une communauté contre l’égarement.", "Hârûn cherche à préserver l’unité tout en rappelant la vérité.", "La correction d’une faute collective demande vérité, responsabilité et retour à Allah."]
  },
  {
    id: "holy-land", index: 13, title: "Aux portes de la Terre sainte", subtitle: "Quand la peur empêche d’avancer",
    image: require("../../assets/images/prophets/musa-scenes/musa-board-13.jpg"), atmosphere: "Terre sainte · peur · refus",
    paragraphs: [
      "Moussa rappelle aux Enfants d’Israël les bienfaits qu’Allah leur a accordés. Il leur demande de se souvenir des prophètes suscités parmi eux et des faveurs reçues, puis leur ordonne d’entrer dans la Terre sainte qu’Allah leur a prescrite.",
      "Le peuple répond qu’il s’y trouve des gens d’une grande force et refuse d’entrer tant qu’ils n’en seront pas sortis. La peur de l’adversaire prend le dessus sur l’ordre qui leur est adressé.",
      "Deux hommes parmi ceux qui craignent Allah, et qu’Allah a favorisés, les encouragent pourtant : qu’ils franchissent la porte et, une fois entrés, qu’ils placent leur confiance en Allah s’ils sont réellement croyants.",
      "Le refus persiste jusqu’à une parole particulièrement dure adressée à Moussa : ils lui disent d’aller combattre avec son Seigneur tandis qu’eux resteront assis. Moussa expose alors à Allah qu’il ne maîtrise que lui-même et son frère et demande qu’une séparation soit faite avec les gens désobéissants.",
      "La Terre leur est interdite pendant quarante années durant lesquelles ils erreront. Le passage montre qu’une communauté délivrée de Pharaon peut encore être empêchée d’avancer par ses propres refus.",
      "La Sunna authentique rapporte un élément de la fin de la vie de Moussa : lorsque l’ange de la mort vient à lui puis revient sur ordre d’Allah, Moussa choisit finalement la mort et demande à Allah de le rapprocher de la Terre sainte à la distance d’un jet de pierre. Le Prophète ﷺ indique qu’il aurait pu montrer l’emplacement de sa tombe près d’une dune rouge. Le hadith complète ainsi la biographie sans prétendre identifier aujourd’hui avec certitude un tombeau précis."
    ],
    references: [{ kind: "QURAN", label: "Al-Mâ’ida 5:20–26", surahId: 5, verse: 20, note: "L’ordre d’entrer dans la Terre sainte, le refus du peuple et les quarante années." }, { kind: "SUNNA", label: "Sahih al-Bukhari 1339", note: "Hadith authentique sur la fin de Moussa et sa demande d’être rapproché de la Terre sainte." }],
    lessons: ["La peur peut empêcher de profiter d’un bienfait pourtant annoncé.", "Le tawakkul ne signifie pas ignorer les obstacles, mais obéir malgré eux.", "Une communauté porte les conséquences de ses choix collectifs."]
  },
  {
    id: "khidr", index: 14, title: "Ce que Moussa ne savait pas encore", subtitle: "Un voyage pour apprendre les limites du regard humain",
    image: require("../../assets/images/prophets/musa-scenes/musa-board-14.jpg"), atmosphere: "Voyage · patience · connaissance",
    paragraphs: [
      "Dans la sourate Al-Kahf, Moussa annonce à son jeune compagnon qu’il poursuivra sa route jusqu’à atteindre le confluent des deux mers, même si le voyage doit durer longtemps. Un signe lié au poisson leur permet finalement de reconnaître le lieu qu’ils recherchaient.",
      "Ils y trouvent un serviteur parmi les serviteurs d’Allah, auquel Allah a accordé une miséricorde venant de Lui et enseigné une science. Moussa lui demande avec respect s’il peut le suivre afin d’apprendre de ce qui lui a été enseigné.",
      "Le serviteur lui répond qu’il ne pourra pas patienter avec lui face à des choses dont il ne possède pas la connaissance complète. Moussa promet d’être patient. Commence alors un voyage marqué par trois événements qui le surprennent profondément.",
      "Le bateau de gens modestes est endommagé ; un jeune garçon est tué ; puis, dans une ville dont les habitants ont refusé de les accueillir, un mur sur le point de s’effondrer est redressé sans qu’aucun salaire ne soit demandé. À chaque étape, Moussa réagit à ce qu’il voit selon ce qui lui apparaît immédiatement.",
      "Au moment de la séparation, les explications sont données : derrière le bateau se trouvait un roi qui saisissait de force tout bateau intact ; les parents du garçon étaient croyants et Allah voulait leur accorder à sa place un enfant meilleur ; sous le mur se trouvait un trésor appartenant à deux orphelins dont le père était vertueux.",
      "Le serviteur conclut qu’il n’a pas agi de sa propre initiative. Le passage ne demande donc pas d’abandonner le jugement moral ordinaire : il enseigne que la connaissance humaine reste limitée et que certaines réalités ne deviennent compréhensibles qu’une fois leur contexte dévoilé par Allah.",
      "Sahih al-Bukhari transmet de la bouche du Prophète ﷺ le contexte de cette rencontre : après avoir été interrogé sur l’homme le plus savant, Moussa répond qu’il l’est et Allah lui enseigne à attribuer la science absolue à Lui seul. Il lui indique alors qu’un serviteur au confluent des deux mers possède une connaissance que Moussa n’a pas, tandis que Moussa possède lui-même une science que cet homme n’a pas. Cette Sunna authentique renforce le thème d’humilité scientifique déjà présent dans les versets."
    ],
    references: [{ kind: "QURAN", label: "Al-Kahf 18:60–82", surahId: 18, verse: 60, note: "Le voyage de Moussa, sa rencontre avec le serviteur d’Allah et l’explication des trois événements." }, { kind: "SUNNA", label: "Sahih al-Bukhari 122", note: "Le Prophète ﷺ explique le contexte du voyage de Moussa vers al-Khidr et l’enseignement sur l’attribution de la science à Allah." }],
    lessons: ["Même Moussa poursuit l’apprentissage avec humilité.", "Ce qui paraît mauvais à première vue peut cacher une réalité inaccessible à notre connaissance immédiate.", "Le passage enseigne la patience devant ce dont on ne possède pas encore l’explication."]
  },
  {
    id: "qarun", index: 15, title: "Qârûn et l’illusion de la richesse", subtitle: "Un dernier contraste au sein du peuple de Moussa",
    image: require("../../assets/images/prophets/musa-scenes/musa-board-15.jpg"), atmosphere: "Richesse · arrogance · chute",
    paragraphs: [
      "Le Coran présente Qârûn comme appartenant au peuple de Moussa, mais précise qu’il se montre arrogant envers eux. Allah lui a accordé des trésors si importants que leurs seules clés représentent déjà une lourde charge pour un groupe d’hommes forts.",
      "Des gens de son peuple lui adressent plusieurs conseils : ne pas exulter avec arrogance, rechercher par ce qu’Allah lui a donné la demeure dernière, ne pas oublier sa part en ce monde, faire le bien comme Allah lui a fait du bien et ne pas rechercher la corruption sur terre.",
      "Qârûn répond que cette richesse lui a été donnée en raison d’un savoir qu’il possède. Le Coran lui rappelle pourtant qu’Allah a détruit avant lui des générations plus fortes et plus riches. L’abondance matérielle n’est donc pas la preuve qu’un homme se suffit à lui-même.",
      "Un jour, Qârûn sort devant son peuple dans tout son apparat. Ceux qui désirent la vie d’ici-bas envient ce qui lui a été donné et le considèrent comme immensément chanceux. Ceux qui ont reçu la connaissance leur rappellent que la récompense d’Allah est meilleure pour celui qui croit et agit avec droiture.",
      "Allah fait alors engloutir Qârûn et sa demeure par la terre. Aucun groupe ne peut le secourir contre Allah et il ne peut se sauver lui-même.",
      "Le lendemain, ceux qui enviaient sa position reconnaissent que c’est Allah qui étend ou restreint la subsistance et que, sans la grâce d’Allah, ils auraient pu subir le même sort. La scène renverse ainsi le regard porté sur la réussite : ce qui impressionnait la veille devient un avertissement."
    ],
    references: [{ kind: "QURAN", label: "Al-Qasas 28:76–82", surahId: 28, verse: 76, note: "Qârûn, son arrogance, les conseils de son peuple et sa chute." }],
    lessons: ["La richesse est une épreuve autant qu’un bienfait.", "Attribuer entièrement ses bienfaits à soi-même nourrit l’orgueil.", "Le récit de Moussa comporte aussi l’éducation de son peuple face aux épreuves intérieures."]
  }
];

const PROPHETS_PREVIEW_BASE = [
  { id: "adam", name: "Âdam", arabic: "آدم", status: "available" as const },
  { id: "idris", name: "Idrîs", arabic: "إدريس", status: "available" as const },
  { id: "nuh", name: "Nûh", arabic: "نوح", status: "available" as const },
  { id: "hud", name: "Hûd", arabic: "هود", status: "available" as const },
  { id: "salih", name: "Sâlih", arabic: "صالح", status: "available" as const },
  { id: "ibrahim", name: "Ibrâhîm", arabic: "إبراهيم", status: "available" as const },
  { id: "lut", name: "Lût", arabic: "لوط", status: "available" as const },
  { id: "ismail", name: "Ismâ‘îl", arabic: "إسماعيل", status: "available" as const },
  { id: "ishaq", name: "Ishâq", arabic: "إسحاق", status: "available" as const },
  { id: "yaqub", name: "Ya‘qûb", arabic: "يعقوب", status: "available" as const },
  { id: "yusuf", name: "Yûsuf", arabic: "يوسف", status: "available" as const },
  { id: "shuayb", name: "Shu‘ayb", arabic: "شعيب", status: "available" as const },
  { id: "ayyub", name: "Ayyûb", arabic: "أيوب", status: "available" as const },
  { id: "dhul-kifl", name: "Dhûl-Kifl", arabic: "ذو الكفل", status: "available" as const },
  { id: "musa", name: "Moussa", arabic: "موسى", status: "available" as const },
  { id: "harun", name: "Hârûn", arabic: "هارون", status: "available" as const },
  { id: "dawud", name: "Dâwûd", arabic: "داود", status: "available" as const },
  { id: "sulayman", name: "Sulaymân", arabic: "سليمان", status: "available" as const },
  { id: "ilyas", name: "Ilyâs", arabic: "إلياس", status: "available" as const },
  { id: "al-yasa", name: "Al-Yasa‘", arabic: "اليسع", status: "available" as const },
  { id: "yunus", name: "Yûnus", arabic: "يونس", status: "available" as const },
  { id: "zakariya", name: "Zakariyyâ", arabic: "زكريا", status: "available" as const },
  { id: "yahya", name: "Yahyâ", arabic: "يحيى", status: "available" as const },
  { id: "isa", name: "‘Îsâ", arabic: "عيسى", status: "available" as const },
  { id: "muhammad", name: "Muhammad ﷺ", arabic: "محمد", status: "available" as const },
];

export const PROPHET_FRENCH_NAMES: Record<string, string> = {
  adam: "Adam", idris: "Énoch", nuh: "Noé", hud: "Houd", salih: "Sâlih",
  ibrahim: "Abraham", lut: "Loth", ismail: "Ismaël", ishaq: "Isaac", yaqub: "Jacob",
  yusuf: "Joseph", shuayb: "Chouaïb", ayyub: "Job", "dhul-kifl": "Dhul-Kifl",
  musa: "Moïse", harun: "Aaron", dawud: "David", sulayman: "Salomon", ilyas: "Élie",
  "al-yasa": "Élisée", yunus: "Jonas", zakariya: "Zacharie", yahya: "Jean",
  isa: "Jésus", muhammad: "Muhammad ﷺ",
};

export const PROPHETS_PREVIEW = PROPHETS_PREVIEW_BASE.map((prophet) => ({
  ...prophet,
  frenchName: PROPHET_FRENCH_NAMES[prophet.id] ?? prophet.name,
  coverImage:
    prophet.id === "adam" ? require("../../assets/images/prophets/adam-cover.png")
    : prophet.id === "idris" ? require("../../assets/images/prophets/idris-cover.png")
    : prophet.id === "nuh" ? require("../../assets/images/prophets/nuh-cover.png")
    : prophet.id === "hud" ? require("../../assets/images/prophets/hud-cover.png")
    : prophet.id === "salih" ? require("../../assets/images/prophets/salih-cover.png")
    : prophet.id === "ibrahim" ? require("../../assets/images/prophets/ibrahim-cover.png")
    : prophet.id === "lut" ? require("../../assets/images/prophets/lut-cover.png")
    : prophet.id === "ismail" ? require("../../assets/images/prophets/ismail-cover.png")
    : prophet.id === "ishaq" ? require("../../assets/images/prophets/ishaq-cover.png")
    : prophet.id === "yaqub" ? require("../../assets/images/prophets/yaqub-cover.jpg")
    : prophet.id === "yusuf" ? require("../../assets/images/prophets/yusuf-cover.jpg")
    : prophet.id === "shuayb" ? require("../../assets/images/prophets/shuayb-cover.jpg")
    : prophet.id === "ayyub" ? require("../../assets/images/prophets/ayyub-cover.jpg")
    : prophet.id === "dhul-kifl" ? require("../../assets/images/prophets/dhul-kifl-cover.jpg")
    : prophet.id === "musa" ? require("../../assets/images/prophets/musa-scenes/moussa.png")
    : prophet.id === "harun" ? require("../../assets/images/prophets/harun-cover.jpg")
    : prophet.id === "dawud" ? require("../../assets/images/prophets/dawud-cover.jpg")
    : prophet.id === "sulayman" ? require("../../assets/images/prophets/sulayman-cover.jpg")
    : prophet.id === "ilyas" ? require("../../assets/images/prophets/ilyas-cover.jpg")
    : prophet.id === "al-yasa" ? require("../../assets/images/prophets/al-yasa-cover.jpg")
    : prophet.id === "yunus" ? require("../../assets/images/prophets/yunus-cover.jpg")
    : prophet.id === "zakariya" ? require("../../assets/images/prophets/zakariya-cover.jpg")
    : prophet.id === "yahya" ? require("../../assets/images/prophets/yahya-cover.jpg")
    : prophet.id === "isa" ? require("../../assets/images/prophets/isa-cover.jpg")
    : prophet.id === "muhammad" ? require("../../assets/images/prophets/muhammad-cover.jpg")
    : null,
}));;
