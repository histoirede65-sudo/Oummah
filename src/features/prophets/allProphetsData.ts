import type { ProphetChapter } from "./prophetsData";

export type ProphetStory = {
  id: string;
  name: string;
  arabic: string;
  epithet: string;
  summary: string;
  chapters: ProphetChapter[];
};

const noImage = 0 as unknown as number;
const ADAM_CHAPTER_IMAGES = [
  require("../../assets/images/prophets/adam-chapter-01.jpg"),
  require("../../assets/images/prophets/adam-chapter-02.jpg"),
  require("../../assets/images/prophets/adam-chapter-03.jpg"),
  require("../../assets/images/prophets/adam-chapter-04.jpg"),
];
const NUH_CHAPTER_IMAGES = [
  require("../../assets/images/prophets/nuh-chapter-01.jpg"),
  require("../../assets/images/prophets/nuh-chapter-02.jpg"),
  require("../../assets/images/prophets/nuh-chapter-03.jpg"),
  require("../../assets/images/prophets/nuh-chapter-04.jpg"),
  require("../../assets/images/prophets/nuh-chapter-05.jpg"),
  require("../../assets/images/prophets/nuh-chapter-06.jpg"),
];
const HUD_CHAPTER_IMAGES = [
  require("../../assets/images/prophets/hud-chapter-01.jpg"),
  require("../../assets/images/prophets/hud-chapter-02.jpg"),
  require("../../assets/images/prophets/hud-chapter-03.jpg"),
];
const SALIH_CHAPTER_IMAGES = [
  require("../../assets/images/prophets/salih-chapter-01.jpg"),
  require("../../assets/images/prophets/salih-chapter-02.jpg"),
  require("../../assets/images/prophets/salih-chapter-03.jpg"),
  require("../../assets/images/prophets/salih-chapter-04.jpg"),
];
const IBRAHIM_CHAPTER_IMAGES = [
  require("../../assets/images/prophets/ibrahim-chapter-07.jpg"),
  require("../../assets/images/prophets/ibrahim-chapter-02.jpg"),
  require("../../assets/images/prophets/ibrahim-chapter-06.jpg"),
  require("../../assets/images/prophets/ibrahim-chapter-01.jpg"),
  require("../../assets/images/prophets/ibrahim-chapter-03.jpg"),
  require("../../assets/images/prophets/ibrahim-chapter-05.jpg"),
  require("../../assets/images/prophets/ibrahim-chapter-04.jpg"),
  require("../../assets/images/prophets/ibrahim-chapter-08.jpg"),
];
const LUT_CHAPTER_IMAGES = [
  require("../../assets/images/prophets/lut-chapter-01.jpg"),
  require("../../assets/images/prophets/lut-chapter-02.jpg"),
  require("../../assets/images/prophets/lut-chapter-03.jpg"),
  require("../../assets/images/prophets/lut-chapter-04.jpg"),
];
const ISMAIL_CHAPTER_IMAGES = [
  require("../../assets/images/prophets/ismail-chapter-03.jpg"),
  require("../../assets/images/prophets/ismail-chapter-01.jpg"),
  require("../../assets/images/prophets/ismail-chapter-02.jpg"),
];
const ISHAQ_CHAPTER_IMAGES = [
  require("../../assets/images/prophets/ishaq-chapter-01.jpg"),
  require("../../assets/images/prophets/ishaq-chapter-02.jpg"),
];

const IDRIS_CHAPTER_IMAGES = [
  require("../../assets/images/prophets/idris-chapter-01.jpg"),
];

const YAQUB_CHAPTER_IMAGES = [
  require("../../assets/images/prophets/yaqub-chapter-01.jpg"),
  require("../../assets/images/prophets/yaqub-chapter-02.jpg"),
  require("../../assets/images/prophets/yaqub-chapter-03.jpg"),
  require("../../assets/images/prophets/yaqub-chapter-04.jpg"),
];

const YUSUF_CHAPTER_IMAGES = [
  require("../../assets/images/prophets/yusuf-chapter-01.jpg"),
  require("../../assets/images/prophets/yusuf-chapter-02.jpg"),
  require("../../assets/images/prophets/yusuf-chapter-03.jpg"),
  require("../../assets/images/prophets/yusuf-chapter-04.jpg"),
  require("../../assets/images/prophets/yusuf-chapter-05.jpg"),
  require("../../assets/images/prophets/yusuf-chapter-06.jpg"),
  require("../../assets/images/prophets/yusuf-chapter-07.jpg"),
  require("../../assets/images/prophets/yusuf-chapter-08.jpg"),
  require("../../assets/images/prophets/yusuf-chapter-09.jpg"),
  require("../../assets/images/prophets/yusuf-chapter-10.jpg"),
];

const SHUAYB_CHAPTER_IMAGES = [
  require("../../assets/images/prophets/shuayb-chapter-01.jpg"),
  require("../../assets/images/prophets/shuayb-chapter-02.jpg"),
  require("../../assets/images/prophets/shuayb-chapter-03.jpg"),
  require("../../assets/images/prophets/shuayb-chapter-04.jpg"),
];

const AYYUB_CHAPTER_IMAGES = [
  require("../../assets/images/prophets/ayyub-chapter-01.jpg"),
  require("../../assets/images/prophets/ayyub-chapter-02.jpg"),
  require("../../assets/images/prophets/ayyub-chapter-03.jpg"),
];

const DHUL_KIFL_CHAPTER_IMAGES = [
  require("../../assets/images/prophets/dhul-kifl-chapter-01.jpg"),
];

const HARUN_CHAPTER_IMAGES = [
  require("../../assets/images/prophets/harun-chapter-01.jpg"),
  require("../../assets/images/prophets/harun-chapter-02.jpg"),
  require("../../assets/images/prophets/harun-chapter-03.jpg"),
];

const DAWUD_CHAPTER_IMAGES = [
  require("../../assets/images/prophets/dawud-chapter-01.jpg"),
  require("../../assets/images/prophets/dawud-chapter-02.jpg"),
  require("../../assets/images/prophets/dawud-chapter-03.jpg"),
  require("../../assets/images/prophets/dawud-chapter-04.jpg"),
];

const SULAYMAN_CHAPTER_IMAGES = [
  require("../../assets/images/prophets/sulayman-chapter-01.jpg"),
  require("../../assets/images/prophets/sulayman-chapter-02.jpg"),
  require("../../assets/images/prophets/sulayman-chapter-03.jpg"),
  require("../../assets/images/prophets/sulayman-chapter-04.jpg"),
  require("../../assets/images/prophets/sulayman-chapter-05.jpg"),
  require("../../assets/images/prophets/sulayman-chapter-06.jpg"),
];

const ILYAS_CHAPTER_IMAGES = [
  require("../../assets/images/prophets/ilyas-chapter-01.jpg"),
  require("../../assets/images/prophets/ilyas-chapter-02.jpg"),
];

const AL_YASA_CHAPTER_IMAGES = [
  require("../../assets/images/prophets/al-yasa-chapter-01.jpg"),
];

const YUNUS_CHAPTER_IMAGES = [
  require("../../assets/images/prophets/yunus-chapter-01.jpg"),
  require("../../assets/images/prophets/yunus-chapter-02.jpg"),
  require("../../assets/images/prophets/yunus-chapter-03.jpg"),
];

const ZAKARIYA_CHAPTER_IMAGES = [
  require("../../assets/images/prophets/zakariya-chapter-01.jpg"),
  require("../../assets/images/prophets/zakariya-chapter-02.jpg"),
  require("../../assets/images/prophets/zakariya-chapter-03.jpg"),
  require("../../assets/images/prophets/zakariya-chapter-04.jpg"),
];

const YAHYA_CHAPTER_IMAGES = [
  require("../../assets/images/prophets/yahya-chapter-01.jpg"),
  require("../../assets/images/prophets/yahya-chapter-02.jpg"),
  require("../../assets/images/prophets/yahya-chapter-03.jpg"),
];

const ISA_CHAPTER_IMAGES = [
  require("../../assets/images/prophets/isa-chapter-01.jpg"),
  require("../../assets/images/prophets/isa-chapter-02.jpg"),
  require("../../assets/images/prophets/isa-chapter-03.jpg"),
  require("../../assets/images/prophets/isa-chapter-04.jpg"),
  require("../../assets/images/prophets/isa-chapter-05.jpg"),
  require("../../assets/images/prophets/isa-chapter-06.jpg"),
  require("../../assets/images/prophets/isa-chapter-07.jpg"),
];

const MUHAMMAD_CHAPTER_IMAGES = [
  require("../../assets/images/prophets/muhammad-chapter-01.jpg"),
  require("../../assets/images/prophets/muhammad-chapter-02.jpg"),
  require("../../assets/images/prophets/muhammad-chapter-03.jpg"),
  require("../../assets/images/prophets/muhammad-chapter-04.jpg"),
  require("../../assets/images/prophets/muhammad-chapter-05.jpg"),
  require("../../assets/images/prophets/muhammad-chapter-06.jpg"),
  require("../../assets/images/prophets/muhammad-chapter-07.jpg"),
  require("../../assets/images/prophets/muhammad-chapter-08.jpg"),
  require("../../assets/images/prophets/muhammad-chapter-09.jpg"),
  require("../../assets/images/prophets/muhammad-chapter-10.jpg"),
  require("../../assets/images/prophets/muhammad-chapter-11.jpg"),
  require("../../assets/images/prophets/muhammad-chapter-12.jpg"),
];

/**
 * Le récit est désormais écrit directement dans `paragraphs`.
 * Les enseignements restent séparés dans `lessons` et les références
 * conservent leurs `surahId` / `verse` afin que les liens vers le Coran
 * continuent de fonctionner. Aucun texte pédagogique générique n’est
 * injecté automatiquement dans la biographie.
 */
const c = (
  id: string,
  index: number,
  title: string,
  subtitle: string,
  atmosphere: string,
  paragraphs: string[],
  references: ProphetChapter["references"],
  lessons: string[],
): ProphetChapter => ({
  id,
  index,
  title,
  subtitle,
  atmosphere,
  paragraphs,
  references,
  lessons,
  image: noImage,
});

export const PROPHET_STORIES: Record<string, ProphetStory> = {
  adam: {
    id: "adam", name: "Âdam", arabic: "آدم", epithet: "Le commencement de l’humanité", summary: "La création d’Âdam, l’épreuve du jardin, le repentir et la responsabilité humaine.",
    chapters: [
      c("creation",1,"La création d’Âdam","Une dignité accordée par Allah","Création · savoir · dignité",[
        "Le récit d’Âdam commence avant même sa vie sur terre. Allah annonce aux anges qu’Il va établir sur la terre un khalîfa. Les anges demandent alors, sans contester l’ordre divin, si y sera placé un être susceptible d’y semer le désordre et d’y verser le sang, alors qu’eux glorifient Allah et proclament Sa sainteté. Allah leur répond qu’Il sait ce qu’ils ne savent pas. Dès l’ouverture du récit, la place de l’être humain est ainsi liée à une responsabilité voulue par Allah et à une sagesse qui dépasse ce que les anges eux-mêmes connaissent.",
        "Allah enseigne ensuite à Âdam les noms, puis demande aux anges de les nommer s’ils sont véridiques dans ce qu’ils avancent. Ils reconnaissent immédiatement leur limite : ils ne possèdent aucun savoir en dehors de celui qu’Allah leur a enseigné. Âdam est alors appelé à exposer les noms qui lui ont été appris. Le Coran place ainsi la connaissance au cœur des premiers éléments rapportés sur l’humanité : Âdam reçoit un savoir qu’il ne possède pas de lui-même, mais qu’Allah lui transmet.",
        "Vient ensuite l’ordre adressé aux anges de se prosterner devant Âdam. Tous se prosternent, à l’exception d’Iblîs, qui refuse et s’enfle d’orgueil. Le Coran rattachera ailleurs ce refus à sa prétention d’être supérieur parce qu’il a été créé de feu tandis qu’Âdam a été créé d’argile. La première confrontation du récit n’oppose donc pas deux forces égales : elle montre une créature qui refuse l’ordre d’Allah en faisant de sa propre appréciation un argument contre l’obéissance.",
        "La Sunna authentique ajoute que le vendredi occupe une place particulière dans l’histoire d’Âdam : le Prophète ﷺ indique qu’il fut créé ce jour-là, qu’il entra au Paradis ce jour-là et qu’il en sortit ce jour-là. Ce complément ne modifie pas la trame coranique ; il précise seulement un repère transmis authentiquement.",
        "Le grand hadith de l’intercession rappellera encore au Jour de la Résurrection les privilèges d’Âdam : père de l’humanité, créé par Allah, honoré par la prosternation des anges et destinataire de l’enseignement des noms. La Sunna relit ainsi les premiers versets d’Al-Baqara comme des éléments constitutifs de son rang."
      ],[{kind:"QURAN",label:"Al-Baqara 2:30–34",surahId:2,verse:30,note:"L’annonce du khalîfa, l’enseignement des noms et la prosternation des anges."},{kind:"SUNNA",label:"Sahih Muslim 854a",note:"Le Prophète ﷺ indique qu’Âdam fut créé un vendredi, entra au Paradis ce jour-là et en sortit ce jour-là."}], ["La connaissance est un dépôt et une responsabilité.","L’orgueil peut transformer un privilège en chute.","La dignité humaine reste liée à l’obéissance à Allah."]),
      c("garden",2,"Le jardin et l’interdit","Une épreuve au cœur de l’abondance","Jardin · liberté · limite",[
        "Après cette première scène, Âdam et son épouse sont installés dans le jardin. Allah leur permet d’y manger largement et à leur convenance, mais leur fixe une limite précise : ne pas approcher d’un arbre déterminé. Leur situation n’est donc pas celle d’une existence privée de bienfaits ; le récit présente au contraire une abondance immense accompagnée d’un seul interdit clairement formulé.",
        "Satan entreprend alors de les faire trébucher. Il leur souffle que l’interdiction cacherait l’accès à une condition angélique ou à une existence qui ne finirait pas, et il leur présente l’arbre comme celui de l’éternité et d’un royaume impérissable. Il va jusqu’à leur jurer qu’il est pour eux un conseiller sincère. Le récit décrit ainsi une tentation qui ne se présente pas comme un mal évident, mais comme une promesse séduisante enveloppée dans un faux conseil.",
        "Lorsqu’ils mangent finalement de l’arbre, leur nudité leur apparaît et ils se mettent à assembler sur eux des feuilles du jardin pour se couvrir. Allah leur rappelle alors l’interdit qui leur avait été donné et l’hostilité déclarée de Satan. Le Coran ne présente pas cette faute comme une corruption héréditaire transmise à toute l’humanité : Âdam et son épouse vont au contraire être conduits vers la reconnaissance de leur faute et vers le repentir.",
        "Le Coran répète l’histoire dans plusieurs sourates avec des accents complémentaires. Dans Tâ-Hâ, Satan promet à Âdam l’arbre de l’éternité et un royaume qui ne disparaît pas ; cette formulation montre comment la tentation vise le désir humain de permanence et de sécurité.",
        "Le récit islamique ne porte pas sur une faute héritée biologiquement par les descendants d’Âdam. Chacun répond de ses propres actes, et la faute du premier homme est suivie d’un repentir accepté. Cette distinction est essentielle pour comprendre la place d’Âdam dans la théologie islamique."
      ],[{kind:"QURAN",label:"Al-A‘râf 7:19–22",surahId:7,verse:19,note:"L’habitation du jardin, l’interdit et la suggestion de Satan."}], ["La tentation embellit souvent ce qui est interdit.","Une limite claire n’annule pas l’étendue des bienfaits.","La faute humaine n’est pas la fin du récit."]),
      c("repentance",3,"Les paroles du repentir","Reconnaître sans se justifier","Repentir · miséricorde · retour",[
        "Âdam et son épouse se tournent vers leur Seigneur avec des paroles que le Coran conserve : ils reconnaissent s’être fait du tort à eux-mêmes et demandent le pardon et la miséricorde d’Allah. Aucun argument n’est avancé pour nier la désobéissance. Après la tromperie de Satan et la faute commise, le récit change donc immédiatement de direction : l’être humain fautif n’est pas enfermé dans sa faute lorsqu’il revient sincèrement vers son Seigneur.",
        "Allah enseigne à Âdam des paroles par lesquelles il revient à Lui, puis accepte son repentir. La sourate Tâ-Hâ rappelle elle aussi la désobéissance d’Âdam, mais elle ne s’arrête pas à celle-ci : son Seigneur le choisit ensuite, accueille son repentir et le guide. Ces versets donnent à la biographie d’Âdam un tournant essentiel : sa faute fait partie du récit, mais son retour vers Allah et la guidance reçue après celle-ci en font également partie.",
        "La descente sur terre est alors annoncée. Mais elle n’est pas présentée comme un abandon de l’humanité : Allah promet que Sa guidance viendra, et que ceux qui la suivront n’auront pas à craindre et ne seront pas affligés ; la sourate Tâ-Hâ ajoute que celui qui suit cette guidance ne s’égarera pas et ne sera pas malheureux. La vie terrestre commence ainsi, dans le récit coranique d’Âdam, avec la responsabilité, la possibilité de la faute, la porte du repentir et la promesse d’une guidance divine.",
        "Le hadith authentique du débat entre Âdam et Mûsâ ne nie ni la faute ni le repentir. Âdam y répond à Mûsâ au sujet du décret d’Allah, après que la faute a déjà été reconnue et pardonnée. Les savants distinguent ainsi l’usage du décret pour expliquer une épreuve accomplie de l’usage du décret comme excuse pour continuer à désobéir.",
        "La biographie d’Âdam se clôt donc sur une tension qui accompagnera toute l’humanité : responsabilité réelle devant les choix, mais aussi certitude que rien n’échappe au décret d’Allah et que la porte du retour reste ouverte."
      ],[{kind:"QURAN",label:"Al-Baqara 2:37–39",surahId:2,verse:37,note:"Le repentir d’Âdam et la promesse de guidance."},{kind:"QURAN",label:"Tâ-Hâ 20:121–123",surahId:20,verse:121,note:"La faute, le choix d’Âdam par Allah et la guidance."},{kind:"SUNNA",label:"Sahih al-Bukhari 6614",note:"Hadith authentique du dialogue entre Âdam et Mûsâ au sujet du décret et de la faute d’Âdam."}], ["Le repentir commence par la reconnaissance.","La miséricorde d’Allah suit le retour sincère.","La vie terrestre est accompagnée d’une guidance."]),
      c("sons",4,"Les deux fils d’Âdam","Quand la jalousie devient violence","Offrande · jalousie · vie humaine",[
        "Après le récit personnel d’Âdam, le Coran rapporte avec vérité l’histoire de deux de ses fils. Tous deux présentent une offrande à Allah ; celle de l’un est acceptée tandis que celle de l’autre ne l’est pas. Au lieu de remettre en question sa propre attitude, celui dont l’offrande n’est pas acceptée laisse la jalousie se transformer en menace et annonce à son frère qu’il le tuera.",
        "Le frère menacé répond qu’Allah n’accepte que de ceux qui Le craignent. Il refuse de faire de la menace reçue une justification pour devenir lui-même agresseur et rappelle à son frère la gravité du péché qu’il s’apprête à porter. Malgré cette parole, l’âme de l’autre finit par lui rendre le meurtre acceptable : il tue son frère et devient parmi les perdants.",
        "Après le meurtre, le coupable se trouve devant le corps de son frère sans savoir quoi en faire. Allah envoie alors un corbeau qui gratte la terre afin de lui montrer comment dissimuler la dépouille. En voyant l’animal, il mesure son propre désarroi et regrette de n’avoir même pas su agir comme ce corbeau. Le passage est immédiatement suivi dans la sourate par un rappel solennel de la gravité du meurtre injuste et de la valeur de la vie humaine.",
        "Le Coran ne nomme pas les deux fils dans ce passage. Les noms Hâbîl et Qâbîl sont connus dans la tradition, mais ne figurent pas dans les versets eux-mêmes ; OUMMAH privilégie donc l’expression coranique « les deux fils d’Adam » lorsqu’il raconte l’épisode.",
        "La révélation tire immédiatement de ce meurtre une règle morale plus large adressée aux Enfants d’Israël : tuer injustement une personne est d’une gravité comparable au meurtre de toute l’humanité, tandis que sauver une vie possède une valeur immense. Le premier meurtre raconté devient ainsi un avertissement pour toutes les générations."
      ],[{kind:"QURAN",label:"Al-Mâ’ida 5:27–31",surahId:5,verse:27,note:"Le récit des deux fils d’Âdam et le premier meurtre mentionné dans le Coran."}], ["La jalousie peut déformer le jugement moral.","Le refus de la violence injuste reste une force.","La vie humaine possède une gravité immense."])
    ]
  },
  idris: {
    id:"idris", name:"Idrîs", arabic:"إدريس", epithet:"Un prophète véridique", summary:"Le Coran parle peu d’Idrîs ; OUMMAH s’en tient strictement à ce qui est établi.",
    chapters:[c("mention",1,"Un véridique élevé en rang","Peu de détails, une mention forte","Véracité · prophétie · élévation",[
      "La biographie d’Idrîs عليه السلام est l’un des endroits où la fidélité aux sources impose de rester sobre. Dans la sourate Maryam, Allah ordonne de le mentionner dans le Livre et lui donne deux qualités immenses : il est un ṣiddîq, d’une véracité profonde, et un prophète. Le Coran ne développe pas ici son enfance, son peuple, la durée de sa mission ou les circonstances de sa vie ; ces détails ne peuvent donc pas être reconstruits comme s’ils étaient certains.",
      "Allah dit ensuite qu’Il a élevé Idrîs à un rang élevé. La Sunna authentique apporte un élément supplémentaire sans fournir pour autant une biographie complète : lors du voyage nocturne et de l’ascension, le Prophète Muhammad ﷺ rencontre Idrîs au quatrième ciel. Ce fait authentiquement rapporté peut être mentionné avec certitude, mais il ne permet pas d’affirmer comment Idrîs est mort ni de transformer les récits tardifs sur son élévation en faits établis.",
      "Ce que les sources authentiques laissent donc d’Idrîs est bref mais remarquable : la véracité, la prophétie, l’élévation à un haut rang et sa présence au quatrième ciel lors du Mi‘râj du dernier Messager ﷺ. Là où le Coran et la Sunna se taisent, le récit s’arrête également. Cette retenue permet de distinguer ce qui appartient réellement à la révélation de ce qui a été ajouté plus tard dans certaines traditions.",
        "Le hadith du Mi‘râj apporte un repère authentique supplémentaire : Muhammad ﷺ rencontre Idrîs au quatrième ciel et échange avec lui le salut. Ce fait permet d’illustrer l’expression coranique du « haut rang » sans prétendre que le verset signifie exclusivement cela.",
        "Des récits racontent qu’Idrîs aurait appris l’écriture, l’astronomie, la couture ou qu’il serait mort dans un ciel déterminé. Ces traditions n’ont pas toutes un fondement authentique remontant au Prophète ﷺ. Elles peuvent appartenir à l’histoire de l’exégèse, mais elles ne sont pas intégrées ici comme biographie certaine."
      ],[{kind:"QURAN",label:"Maryam 19:56–57",surahId:19,verse:56,note:"Idrîs est décrit comme véridique, prophète et élevé à un rang élevé."},{kind:"SUNNA",label:"Sahih al-Bukhari 3887",note:"Lors du Mi‘râj, le Prophète ﷺ rencontre Idrîs au quatrième ciel."}], ["Le peu de détails n’autorise pas l’invention.","La véracité est au cœur du portrait coranique d’Idrîs.","La sobriété peut être une forme de fidélité aux sources."])]
  },
  nuh: {
    id:"nuh", name:"Nûh", arabic:"نوح", epithet:"L’appel patient", summary:"Un long appel, le refus d’un peuple, l’arche et une délivrance qui ne dépend pas des liens de sang.",
    chapters:[
      c("call",1,"Un appel qui dure","Adorer Allah sans associé","Appel · patience · avertissement",[
        "Allah envoie Nûh à son peuple avec un message clair : adorer Allah, Le craindre et obéir au messager. Nûh promet que le retour vers Allah ouvre la porte du pardon et d’un délai accordé.",
        "Dans la sourate Nûh, il décrit une prédication de jour comme de nuit, publique comme privée. Il varie les manières d’appeler, mais son peuple persiste à se détourner.",
        "Le récit insiste donc moins sur un moment spectaculaire que sur la durée : la mission de Nûh est d’abord celle d’une patience répétée face au refus.",
        "Le Coran précise que cette mission s’étend sur neuf cent cinquante années parmi son peuple. Cette durée ne signifie pas que tous les détails de cette période nous sont connus : elle souligne surtout l’endurance exceptionnelle d’un messager qui continue d’appeler malgré des générations de refus.",
        "Nûh décrit lui-même les réactions qu’il rencontre : certains mettent leurs doigts dans leurs oreilles, se couvrent de leurs vêtements, s’obstinent et s’enflent d’orgueil. Il ne répond pas en abandonnant son peuple ; il reprend l’appel sous d’autres formes, cherchant encore une porte vers leur cœur."
      ],[{kind:"QURAN",label:"Nûh 71:1–9",surahId:71,verse:1,note:"L’appel de Nûh de nuit et de jour, en public et en privé."}], ["La constance compte même lorsque les résultats tardent.","L’appel peut changer de forme sans changer de vérité.","Le pardon reste proposé avant le jugement."]),
      c("arguments",2,"Regarder les signes","Le ciel, la terre et les bienfaits","Création · gratitude · rappel",[
        "Nûh rappelle à son peuple la grandeur d’Allah à travers leur propre création et les signes du monde : les cieux superposés, la lune, le soleil et la terre.",
        "Il les invite aussi à demander pardon, en rappelant que les bienfaits matériels ne sont pas séparés de la relation avec Allah. La pluie, les biens et les enfants sont évoqués comme des dons, non comme des preuves d’autonomie.",
        "Malgré ces rappels, les notables s’attachent à leurs idoles et entraînent d’autres personnes dans leur refus.",
        "Il rappelle aussi à son peuple les étapes de leur propre création et leur demande pourquoi ils n’accordent pas à Allah la grandeur qui Lui revient. Le ciel, la lune, le soleil et la terre ne sont pas invoqués comme de simples décorations du récit : ils deviennent les témoins d’un ordre créé que l’idolâtrie refuse de reconnaître.",
        "Les noms de Wadd, Suwâ‘, Yaghûth, Ya‘ûq et Nasr apparaissent dans le Coran comme des idoles auxquelles les meneurs s’attachent. Les détails populaires sur l’origine exacte de chacune de ces idoles ne sont pas nécessaires à la biographie : le texte certain suffit pour montrer comment des symboles deviennent des objets d’adoration lorsque la transmission religieuse se corrompt."
      ],[{kind:"QURAN",label:"Nûh 71:10–24",surahId:71,verse:10,note:"Les signes de la création, l’appel au pardon et l’attachement aux idoles."}], ["Les signes du monde invitent à la gratitude.","Les bienfaits ne justifient pas l’orgueil.","L’influence sociale peut renforcer l’égarement."]),
      c("ark",3,"Construire sous les moqueries","Obéir avant de voir le résultat","Arche · ordre · moquerie",[
        "Lorsque le refus du peuple devient établi, Allah révèle à Nûh qu’aucun nouveau croyant ne viendra parmi eux. Il lui ordonne de construire l’arche sous Sa surveillance et selon Sa révélation.",
        "Les notables passent près de lui et se moquent. Nûh répond que, s’ils se moquent aujourd’hui, viendra un moment où ils sauront sur qui tombera le châtiment humiliant.",
        "La construction de l’arche devient ainsi un acte d’obéissance avant que le danger ne soit visible pour tous.",
        "Nûh invoque alors son Seigneur après avoir épuisé les voies de l’appel. Allah lui révèle que la foi de son peuple ne progressera plus et lui interdit de plaider pour les injustes lorsque le jugement commencera. L’arche naît donc à la fin d’une longue mission, pas comme une décision soudaine prise après quelques refus.",
        "Le Coran ne donne ni les dimensions de l’arche, ni son bois, ni la liste détaillée des animaux embarqués. De nombreuses traditions tardives décrivent ces éléments, mais OUMMAH ne les transforme pas en faits lorsqu’ils ne sont pas établis par le Coran ou une Sunna authentique."
      ],[{kind:"QURAN",label:"Hûd 11:36–39",surahId:11,verse:36,note:"L’ordre de construire l’arche et les moqueries du peuple."}], ["L’obéissance précède parfois la compréhension du résultat.","La moquerie ne change pas la vérité d’un ordre d’Allah.","La préparation fait partie de la confiance en Allah."]),
      c("flood",4,"Quand les eaux se rejoignent","La délivrance des croyants","Déluge · arche · salut",[
        "Le signe annoncé arrive : les eaux jaillissent et Nûh reçoit l’ordre d’embarquer des couples de chaque espèce, sa famille sauf ceux déjà visés par le décret, et les croyants.",
        "L’arche avance au milieu de vagues semblables à des montagnes. Le récit fait ressentir la disproportion entre les moyens humains et l’événement, tout en rappelant que l’arche navigue au nom d’Allah.",
        "Ceux qui avaient traité les avertissements de mensonges ne trouvent alors aucun refuge extérieur à ce qu’Allah a décidé.",
        "Nûh prononce le nom d’Allah au départ et à l’arrivée de l’arche. Ce détail donne au voyage sa véritable orientation : la sécurité n’est pas attribuée au navire lui-même, même si sa construction était indispensable, mais à Allah qui commande, protège et conduit.",
        "Le Coran réunit deux images puissantes : l’eau qui descend du ciel et celle qui jaillit de la terre. Ce n’est pas la description technique d’un phénomène naturel que le texte cherche à fournir ; c’est l’accomplissement d’un jugement annoncé après une longue période de transmission et de refus."
      ],[{kind:"QURAN",label:"Hûd 11:40–44",surahId:11,verse:40,note:"L’embarquement, les vagues et la fin du déluge."}], ["Le salut vient par l’obéissance et la miséricorde d’Allah.","Les moyens sont utilisés sans être divinisés.","Le jugement arrive après de longs avertissements."]),
      c("son",5,"Le fils qui refuse l’arche","La foi ne s’hérite pas automatiquement","Famille · choix · décret",[
        "Nûh appelle un fils resté à l’écart et lui demande de monter avec eux. Celui-ci répond qu’il se réfugiera sur une montagne qui le protégera de l’eau.",
        "Nûh lui rappelle qu’il n’existe ce jour-là aucune protection contre l’ordre d’Allah sauf pour celui à qui Il fait miséricorde. Une vague les sépare et le fils fait partie des noyés.",
        "Après le déluge, Nûh invoque au sujet de son fils. Allah lui enseigne alors que la proximité familiale ne transforme pas un choix de mécréance en salut garanti.",
        "La douleur de Nûh est rendue très humaine par le Coran : il rappelle à Allah que son fils appartient à sa famille et que la promesse divine est vérité. Allah corrige alors sa compréhension de la famille promise au salut et lui demande de ne pas questionner ce dont il n’a pas connaissance.",
        "Nûh accueille immédiatement cette correction : il cherche refuge auprès d’Allah contre le fait de demander ce qu’il ne sait pas et demande pardon et miséricorde. La biographie du prophète ne le montre donc pas seulement avertissant les autres ; elle le montre également recevant lui-même un enseignement et s’y soumettant."
      ],[{kind:"QURAN",label:"Hûd 11:42–47",surahId:11,verse:42,note:"L’appel de Nûh à son fils et l’enseignement sur la parenté et la foi."}], ["Les liens de sang ne remplacent pas la foi.","Le prophète lui-même se soumet au jugement d’Allah.","La miséricorde ne se confond pas avec le favoritisme."]),
      c("landing",6,"La terre retrouve son calme","Une nouvelle étape après l’épreuve","Paix · gratitude · recommencement",[
        "Allah ordonne à la terre d’absorber son eau et au ciel de cesser sa pluie. L’eau baisse, l’ordre est accompli et l’arche se pose sur al-Jûdî.",
        "Nûh reçoit ensuite l’ordre de descendre avec une paix venant d’Allah et des bénédictions sur lui et sur des communautés issues de ceux qui l’accompagnent.",
        "Le récit se referme non sur le spectacle du déluge, mais sur une reprise de la vie accompagnée de paix, de responsabilité et du souvenir de ce qui vient d’avoir lieu.",
        "La Sunna authentique désigne Nûh comme le premier messager envoyé aux habitants de la terre et le décrit, dans le grand hadith de l’intercession, comme un serviteur reconnaissant. Ce témoignage du Prophète Muhammad ﷺ complète le portrait coranique de sa longue patience sans ajouter de légende à son histoire.",
        "Le Coran rappelle enfin que ce récit appartient aux nouvelles de l’invisible révélées au Prophète Muhammad ﷺ : ni lui ni son peuple ne les connaissaient ainsi avant la révélation. La conclusion invite donc à la patience, car l’issue appartient à ceux qui craignent Allah."
      ],[{kind:"QURAN",label:"Hûd 11:44–49",surahId:11,verse:44,note:"La fin du déluge, l’arrêt des eaux et la descente en paix."},{kind:"SUNNA",label:"Sahih al-Bukhari 3340",note:"Dans le grand hadith de l’intercession, Nûh est présenté comme le premier messager envoyé aux habitants de la terre et comme un serviteur reconnaissant."}], ["Après l’épreuve vient la reconstruction.","La paix est un don autant qu’une responsabilité.","Le récit invite à retenir le message, pas seulement l’événement."])
    ]
  },
  hud: {
    id:"hud", name:"Hûd", arabic:"هود", epithet:"Face à la puissance de ‘Âd", summary:"Hûd appelle un peuple puissant à ne pas confondre force matérielle et sécurité devant Allah.",
    chapters:[
      c("ad",1,"Un peuple puissant","La force qui devient arrogance","‘Âd · puissance · orgueil",[
        "Le peuple de ‘Âd est présenté comme doté d’une grande puissance et établi après le peuple de Nûh. Hûd leur rappelle les bienfaits d’Allah et les appelle à L’adorer sans associé.",
        "Ils répondent en contestant son message et en s’attachant aux divinités héritées de leurs pères. Leur confiance dans leur force devient un obstacle à l’écoute.",
        "Hûd ne leur demande pas de salaire. Il rattache son appel à sa responsabilité devant Allah et à leur propre salut.",
        "D’autres passages décrivent ‘Âd comme un peuple qui bâtissait sur les hauteurs des monuments par jeu et construisait des forteresses comme s’il devait demeurer éternellement. Hûd ne condamne pas l’architecture en elle-même : il dénonce la transformation de la puissance en illusion d’immortalité et l’usage brutal de la force.",
        "Le Coran ne fixe pas de localisation certaine d’Iram ou des habitations de ‘Âd permettant de transformer une hypothèse archéologique moderne en fait religieux. Les récits qui identifient avec assurance un site précis dépassent ce que les sources authentiques permettent d’affirmer."
      ],[{kind:"QURAN",label:"Al-A‘râf 7:65–69",surahId:7,verse:65,note:"L’appel de Hûd au peuple de ‘Âd et le rappel de leurs bienfaits."}], ["La puissance peut masquer la dépendance envers Allah.","Un message vrai ne devient pas faux parce qu’il dérange une tradition.","La gratitude protège du sentiment d’autosuffisance."]),
      c("warning",2,"Le refus et l’avertissement","Quand la confiance devient défi","Avertissement · défi · constance",[
        "Les notables accusent Hûd de folie et de mensonge. Il répond qu’il n’est pas fou, mais messager du Seigneur des mondes, chargé de transmettre avec sincérité.",
        "Dans la sourate Hûd, son peuple le défie de faire venir le châtiment s’il dit vrai. Hûd leur répond qu’il place sa confiance en Allah, son Seigneur et le leur.",
        "Le prophète demeure ainsi ferme sans chercher à rivaliser avec leur puissance par une puissance humaine équivalente.",
        "Hûd invite aussi son peuple à demander pardon et à revenir vers Allah, leur annonçant que la pluie leur serait envoyée avec abondance et que leur force serait accrue. Même au cœur de l’avertissement, le message demeure une invitation au retour plutôt qu’une simple annonce de destruction.",
        "Leur réponse révèle cependant leur fermeture : ils affirment qu’ils ne délaisseront pas leurs divinités sur la seule parole de Hûd et vont jusqu’à prétendre qu’une de leurs idoles l’aurait frappé d’un mal. Hûd prend Allah à témoin de son désaveu de leurs associés et les défie tous sans hésitation, fort de sa confiance en son Seigneur."
      ],[{kind:"QURAN",label:"Hûd 11:50–57",surahId:11,verse:50,note:"Le dialogue de Hûd avec son peuple, son tawakkul et son avertissement."}], ["La fermeté n’exige pas l’agressivité.","Le tawakkul libère de la peur de la pression sociale.","Le rôle du messager est de transmettre clairement."]),
      c("wind",3,"Le vent qui renverse les certitudes","Quand la force ne protège plus","Vent · jugement · délivrance",[
        "Lorsque le décret arrive, Allah sauve Hûd et ceux qui ont cru avec lui par une miséricorde venant de Lui.",
        "Le Coran décrit ailleurs un vent violent et glacial envoyé contre ‘Âd pendant plusieurs nuits et jours, laissant les gens renversés comme des troncs de palmiers évidés.",
        "La scène répond directement à leur arrogance : la puissance dont ils se glorifiaient ne peut les protéger contre un élément créé par Allah.",
        "La sourate Al-Ahqâf rapporte qu’ils voient d’abord un nuage se dirigeant vers leurs vallées et pensent qu’il apportera la pluie. Le texte renverse immédiatement leur attente : ce qu’ils accueillent comme une bonne nouvelle est le vent contenant le châtiment qu’ils avaient demandé avec défi.",
        "Le Coran décrit le vent comme détruisant toute chose par l’ordre de son Seigneur jusqu’à ce que seules leurs demeures demeurent visibles. Hûd et ceux qui ont cru, eux, sont sauvés par une miséricorde d’Allah."
      ],[{kind:"QURAN",label:"Al-Hâqqa 69:6–8",surahId:69,verse:6,note:"Le vent violent envoyé contre ‘Âd."},{kind:"QURAN",label:"Hûd 11:58–60",surahId:11,verse:58,note:"La délivrance de Hûd et des croyants."}], ["Aucune puissance créée n’est absolue.","La délivrance des croyants est présentée comme une miséricorde.","Le jugement vient après le rappel et l’avertissement."])
    ]
  },
  salih: {
    id:"salih", name:"Sâlih", arabic:"صالح", epithet:"Le signe de la chamelle", summary:"Sâlih appelle Thamûd à la gratitude ; un signe clair devient lui-même une épreuve d’obéissance.",
    chapters:[
      c("thamud",1,"Thamûd et les demeures taillées","Un peuple établi dans la pierre","Thamûd · maisons · bienfaits",[
        "Sâlih est envoyé à Thamûd et leur rappelle qu’Allah les a établis sur terre après ‘Âd. Ils construisent dans les plaines et taillent des maisons dans les montagnes.",
        "Ces capacités techniques sont citées comme des bienfaits qui devraient conduire à la gratitude, non comme une preuve que le peuple peut se passer d’Allah.",
        "Sâlih les appelle donc à adorer Allah seul et à ne pas répandre la corruption sur terre.",
        "Thamûd connaissait donc une prospérité qui se lisait dans son rapport au territoire : palais dans les plaines et demeures taillées avec habileté dans les montagnes. Sâlih leur demande de se souvenir de ces dons et d’éviter de suivre les fauteurs de désordre qui corrompent au lieu de réformer.",
        "Le Coran ne donne pas le nom moderne d’un site archéologique comme preuve unique de leur histoire. Il mentionne toutefois les demeures creusées dans la roche et rappelle ailleurs aux voyageurs les traces laissées par les peuples détruits. La biographie s’en tient à cette description révélée."
      ],[{kind:"QURAN",label:"Al-A‘râf 7:73–74",surahId:7,verse:73,note:"L’appel de Sâlih et le rappel des demeures de Thamûd."}], ["Les progrès matériels sont des bienfaits, pas des garanties.","La gratitude doit accompagner la maîtrise technique.","La stabilité d’une civilisation reste fragile sans justice."]),
      c("camel",2,"La chamelle comme signe","Un test concret d’obéissance","Chamelle · partage · limite",[
        "Sâlih annonce à son peuple qu’une chamelle d’Allah leur est donnée comme signe. Ils doivent la laisser manger sur la terre d’Allah et ne pas lui faire de mal.",
        "Dans la sourate Ash-Shu‘arâ, le partage de l’eau est mentionné : elle a son jour pour boire et eux ont le leur. Le signe implique donc une règle concrète qui limite leur domination sur les ressources.",
        "Le miracle ne supprime pas l’épreuve : au contraire, il rend leur choix plus clair.",
        "Le signe impose une coexistence et une discipline : la chamelle a droit à l’eau un jour déterminé et le peuple au sien. Le miracle devient ainsi une épreuve de comportement quotidienne, non un spectacle destiné seulement à impressionner.",
        "Les récits populaires donnent parfois une description très détaillée de la manière dont la chamelle serait sortie d’un rocher. Le Coran la nomme clairement « chamelle d’Allah » et signe pour le peuple, mais ces détails supplémentaires ne sont pas établis dans une Sunna authentique et ne sont donc pas présentés ici comme certains."
      ],[{kind:"QURAN",label:"Ash-Shu‘arâ 26:155–156",surahId:26,verse:155,note:"La chamelle, son jour d’eau et l’interdiction de lui nuire."}], ["Un signe peut être accompagné d’une responsabilité pratique.","Respecter une limite fait partie de la foi.","Le miracle n’annule pas la liberté de choisir."]),
      c("hamstring",3,"Le signe attaqué","Quand la transgression devient collective","Désobéissance · avertissement · délai",[
        "Une faction du peuple complote et la chamelle est finalement tuée. Sâlih leur annonce alors qu’ils jouiront encore de leurs demeures pendant trois jours : c’est un avertissement précis.",
        "Le récit ne présente pas ce délai comme une faiblesse. Il devient une dernière fenêtre où l’issue est connue et où la responsabilité du peuple apparaît pleinement.",
        "Ceux qui avaient cru avec Sâlih sont distingués de ceux qui persistent dans l’injustice.",
        "La sourate An-Naml mentionne neuf groupes qui semaient la corruption dans la cité et ne réformaient rien. Ils complotent même pour attaquer Sâlih et sa famille de nuit, puis nier leur participation. Allah déjoue leur complot alors qu’ils ne s’en rendent pas compte.",
        "Après l’atteinte portée à la chamelle, l’avertissement des trois jours rend la responsabilité impossible à confondre avec une surprise. Le peuple dispose encore d’un délai déterminé avant l’accomplissement du châtiment qu’il a lui-même provoqué par son défi."
      ],[{kind:"QURAN",label:"Hûd 11:64–66",surahId:11,verse:64,note:"La chamelle tuée, le délai de trois jours et la délivrance des croyants."}], ["La transgression contre un signe clair aggrave la responsabilité.","L’avertissement précède encore le jugement.","Le croyant n’est pas confondu avec la collectivité qui persiste dans l’injustice."]),
      c("cry",4,"Le cri et la fin de Thamûd","Des demeures qui ne protègent plus","Cri · chute · regret",[
        "Lorsque l’ordre d’Allah arrive, un cri puissant saisit les injustes. Ils se retrouvent sans vie dans leurs demeures, comme s’ils n’y avaient jamais prospéré.",
        "Sâlih se détourne d’eux après avoir transmis le message et rappelle qu’il leur avait donné le conseil sincère de son Seigneur, mais qu’ils n’aimaient pas les conseillers.",
        "Les maisons taillées dans la roche demeurent ainsi un contraste : solides en apparence, elles n’ont pas pu protéger ceux qui avaient rejeté le rappel.",
        "Plusieurs sourates décrivent le jugement avec des termes complémentaires : le cri, le tremblement et le coup foudroyant. Ces formulations ne nécessitent pas de reconstruire un mécanisme physique précis ; elles convergent vers l’idée d’un peuple saisi soudainement après avoir mutilé le signe et rejeté son messager.",
        "Le Prophète Muhammad ﷺ, lorsqu’il passa avec ses compagnons par les demeures de peuples châtiés, leur apprit à ne pas y entrer avec insouciance mais avec crainte et larmes. Ce principe authentique empêche de transformer les traces d’un jugement en simple attraction."
      ],[{kind:"QURAN",label:"Hûd 11:67–68",surahId:11,verse:67,note:"Le cri qui saisit Thamûd et la fin de leur prospérité."}], ["La solidité matérielle ne remplace pas la sécurité auprès d’Allah.","Le conseil sincère peut être rejeté malgré sa clarté.","Le Coran relie la chute à des choix moraux, pas à un hasard aveugle."])
    ]
  },
  ibrahim: {
    id:"ibrahim", name:"Ibrâhîm", arabic:"إبراهيم", epithet:"L’ami intime d’Allah", summary:"Du rejet de l’idolâtrie à l’édification de la Maison sacrée : une vie structurée par le tawhîd et la confiance.",
    chapters:[
      c("stars",1,"Chercher au-delà des astres","Refuser d’adorer ce qui disparaît","Astres · réflexion · tawhîd",[
        "Le Coran rapporte qu’Ibrâhîm montre à son peuple l’incohérence d’adorer les astres. Il évoque une étoile, puis la lune, puis le soleil, et souligne à chaque fois leur disparition.",
        "Le raisonnement conduit à une déclaration claire : il tourne son visage vers Celui qui a créé les cieux et la terre et refuse l’association.",
        "Ce passage n’est pas une hésitation durable sur le Créateur, mais une démonstration adressée à un peuple attaché aux signes créés.",
        "La confrontation d’Ibrâhîm avec l’idolâtrie apparaît aussi dans son dialogue avec son père Âzar. Il l’interroge avec respect mais fermeté : pourquoi adorer ce qui n’entend pas, ne voit pas et ne peut rien apporter ? Il l’invite à suivre une connaissance qui lui est venue et le met en garde contre le chemin de Satan.",
        "Son père répond par la menace et lui ordonne de s’éloigner. Ibrâhîm ne répond pas par l’insulte : il lui souhaite la paix et annonce qu’il demandera pardon pour lui, avant que la révélation ne clarifie plus tard les limites de cette demande lorsque l’hostilité à Allah devient manifeste."
      ],[{kind:"QURAN",label:"Al-An‘âm 6:74–79",surahId:6,verse:74,note:"Le dialogue d’Ibrâhîm avec son peuple à propos des astres."}], ["Ce qui change et disparaît ne mérite pas l’adoration.","Le Coran invite à raisonner à partir des signes de la création.","Le tawhîd recentre le regard sur le Créateur."]),
      c("idols",2,"Les idoles brisées","Une question laissée au cœur du sanctuaire","Idoles · argument · confrontation",[
        "Ibrâhîm interroge son père et son peuple sur les statues auxquelles ils sont attachés. Ils reconnaissent les avoir trouvées chez leurs ancêtres.",
        "Lorsqu’ils s’absentent, il brise les idoles sauf la plus grande. À leur retour, ils l’accusent. Il les renvoie alors à leur propre logique en leur disant de demander à la grande idole si elle peut parler.",
        "Pendant un instant, ils reconnaissent intérieurement leur contradiction, mais reviennent ensuite à leur défense de l’idolâtrie.",
        "Avant de briser les idoles, Ibrâhîm annonce en secret qu’il leur préparera un stratagème après le départ de son peuple. Il laisse la plus grande intacte afin que le dialogue qui suivra révèle l’impuissance des objets auxquels ils donnent pourtant un culte.",
        "Le Coran précise qu’après avoir été ramenés à eux-mêmes, ils reconnaissent un instant leur propre injustice. Puis ils renversent leur raisonnement : ils savent que les idoles ne parlent pas, mais utilisent précisément cette évidence pour refuser la démonstration. La vérité intellectuellement reconnue ne devient pas automatiquement une obéissance."
      ],[{kind:"QURAN",label:"Al-Anbiyâ’ 21:51–67",surahId:21,verse:51,note:"Le rejet des idoles, leur destruction et le débat avec le peuple."}], ["Une tradition héritée n’est pas une preuve en soi.","L’argument d’Ibrâhîm vise à réveiller la conscience du peuple.","Reconnaître une contradiction n’implique pas automatiquement de changer."]),
      c("fire",3,"Le feu rendu frais","Quand l’hostilité cherche à supprimer l’appel","Feu · délivrance · confiance",[
        "Incapables de répondre à l’argument, les gens décident de brûler Ibrâhîm et d’aider leurs divinités. La confrontation intellectuelle se transforme en violence.",
        "Allah ordonne alors au feu d’être fraîcheur et paix pour Ibrâhîm. Ceux qui voulaient lui nuire sont décrits comme les grands perdants.",
        "La délivrance ne vient pas d’une supériorité matérielle d’Ibrâhîm, mais d’un ordre d’Allah qui transforme l’élément même utilisé contre lui.",
        "La décision de brûler Ibrâhîm est présentée comme la réponse d’un peuple à court d’argument. Dans une autre sourate, ils disent : « Tuez-le ou brûlez-le ». Allah le sauve du feu et fait de cette délivrance un signe pour les croyants.",
        "Les récits qui donnent la taille du bûcher, le nom exact de celui qui aurait construit une machine pour le lancer ou des dialogues détaillés autour de l’événement ne reposent pas sur une preuve authentique suffisante. Le Coran dit l’essentiel : le feu reçoit l’ordre d’être fraîcheur et sécurité."
      ],[{kind:"QURAN",label:"Al-Anbiyâ’ 21:68–70",surahId:21,verse:68,note:"La décision de brûler Ibrâhîm et la protection d’Allah."}], ["Allah peut rendre inoffensif ce qui semblait inévitablement destructeur.","La violence n’est pas une réponse à la vérité.","La confiance en Allah ne dépend pas du rapport de forces visible."]),
      c("migration",4,"Quitter pour préserver la foi","Une migration vers la terre bénie","Migration · foi · famille",[
        "Après la confrontation avec son peuple, Ibrâhîm annonce qu’il part vers son Seigneur. Le Coran mentionne qu’Allah le sauve, avec Lût, vers une terre bénie pour les mondes.",
        "Cette migration n’est pas une fuite vide de sens : elle ouvre une nouvelle étape de la mission et de la transmission.",
        "Allah lui accorde ensuite Ishâq et Ya‘qûb et fait de sa descendance une lignée où se poursuivent la prophétie et le Livre.",
        "La Sunna authentique rapporte un épisode de voyage d’Ibrâhîm avec Sârah sur le territoire d’un tyran. Ibrâhîm la désigne comme sa « sœur » dans la foi ; lorsque le tyran cherche à lui nuire, Allah la protège. Le hadith rapporte ensuite que Hâjar est donnée à Sârah. Cet épisode complète la période des migrations d’Ibrâhîm sans provenir d’une reconstruction tardive.",
        "La migration d’Ibrâhîm ouvre ainsi plusieurs lignées de son histoire : Lût est sauvé avec lui vers la terre bénie, tandis qu’Ismâ‘îl et Ishâq deviendront deux branches majeures de sa descendance. Le Coran en fait un imam pour les hommes et lie son héritage à l’épreuve, au tawhîd et à l’obéissance."
      ],[{kind:"QURAN",label:"Al-Anbiyâ’ 21:71–73",surahId:21,verse:71,note:"La délivrance, la terre bénie et la descendance d’Ibrâhîm."},{kind:"SUNNA",label:"Sahih al-Bukhari 3358",note:"Récit authentique d’Ibrâhîm, Sârah et du tyran ; Hâjar est ensuite donnée à Sârah."}], ["Préserver la foi peut nécessiter de quitter un environnement hostile.","La migration peut devenir le début d’une construction.","La transmission dépasse la réussite personnelle."]),
      c("guests",5,"Les visiteurs et la bonne annonce","Hospitalité, étonnement et promesse","Hospitalité · annonce · miséricorde",[
        "Des messagers viennent auprès d’Ibrâhîm avec une bonne annonce. Il leur apporte rapidement un veau rôti, mais constate qu’ils ne mangent pas et ressent de la crainte.",
        "Ils le rassurent et annoncent la naissance d’un fils doué de savoir. Son épouse s’étonne de cette annonce compte tenu de leur âge.",
        "Les visiteurs expliquent ensuite qu’ils sont envoyés vers le peuple de Lût. La même visite réunit donc une bonne annonce pour une maison et l’annonce d’un jugement pour une autre communauté.",
        "La peur d’Ibrâhîm naît du fait que les mains des visiteurs ne se portent pas vers le repas qu’il a préparé. Ils lui révèlent qu’ils sont des anges et le rassurent. La bonne annonce d’Ishâq est accompagnée, dans la sourate Hûd, de celle de Ya‘qûb après lui.",
        "Lorsque leur mission contre le peuple de Lût est annoncée, Ibrâhîm discute encore en faveur de ce peuple. Le Coran décrit sa douceur, sa compassion et son retour constant vers Allah, mais les anges lui annoncent que le décret est désormais venu et qu’il ne peut être détourné."
      ],[{kind:"QURAN",label:"Adh-Dhâriyât 51:24–34",surahId:51,verse:24,note:"Les hôtes d’Ibrâhîm, la bonne annonce et leur mission vers le peuple de Lût."}], ["L’hospitalité d’Ibrâhîm apparaît avant même qu’il connaisse ses visiteurs.","La puissance d’Allah n’est pas limitée par l’âge ou les causes habituelles.","Un même moment peut porter miséricorde et avertissement."]),
      c("sacrifice",6,"Le songe et l’épreuve","Père et fils dans l’obéissance","Songe · sacrifice · soumission",[
        "Ibrâhîm demande à Allah de lui accorder un enfant parmi les vertueux. Le Coran annonce alors un garçon patient. Lorsqu’il atteint l’âge de marcher avec son père, Ibrâhîm lui rapporte le songe où il se voit l’immoler.",
        "Le fils répond à son père d’accomplir ce qui lui est ordonné et exprime l’espoir d’être parmi les patients. Tous deux se soumettent.",
        "Au moment décisif, Allah appelle Ibrâhîm, affirme qu’il a confirmé la vision et rachète l’enfant par une offrande immense. Le texte met au centre l’obéissance, non l’acte sanglant lui-même.",
        "Le passage de la sourate As-Sâffât ne nomme pas explicitement le fils dans la scène du sacrifice. La tradition exégétique majoritaire l’identifie à Ismâ‘îl, et c’est cette lecture que suit le module, tout en distinguant cette identification du texte littéral du verset.",
        "L’épisode intervient après l’annonce d’un fils patient et montre un dialogue père-fils d’une sobriété remarquable. Ibrâhîm expose le rêve sans brutalité, et le fils répond en se plaçant lui-même sous l’ordre d’Allah. Leur soumission commune est le cœur du passage."
      ],[{kind:"QURAN",label:"As-Sâffât 37:100–111",surahId:37,verse:100,note:"La bonne annonce d’un fils patient, le songe et le rachat."}], ["L’épreuve révèle la profondeur de la soumission.","Le fils participe consciemment à l’obéissance.","Allah ne cherche pas le sang : Il manifeste la sincérité de l’obéissance."]),
      c("kaaba",7,"Élever les fondations de la Maison","Construire en demandant l’acceptation","Kaaba · invocation · transmission",[
        "Ibrâhîm et Ismâ‘îl élèvent les fondations de la Maison. Le Coran ne les montre pas satisfaits d’eux-mêmes : pendant l’œuvre, ils demandent à Allah d’accepter ce qu’ils accomplissent.",
        "Ils demandent aussi d’être soumis à Allah, qu’une communauté soumise naisse de leur descendance et qu’un messager soit envoyé parmi elle pour réciter les signes, enseigner le Livre et purifier.",
        "La construction matérielle est ainsi accompagnée d’une vision spirituelle et éducative qui dépasse leur propre génération.",
        "La Sunna authentique développe le séjour de Hâjar et Ismâ‘îl dans la vallée de La Mecque : Ibrâhîm les y laisse sur ordre d’Allah, Hâjar cherche de l’eau entre Safâ et Marwa, et Zamzam jaillit par la permission d’Allah. Plus tard, Ibrâhîm revient et élève avec Ismâ‘îl les fondations de la Maison.",
        "Le hadith de Ibn ‘Abbâs rapporte également les rencontres successives d’Ibrâhîm avec Ismâ‘îl devenu adulte et la reconstruction de la Kaaba. Ces détails appartiennent à Sahih al-Bukhari et peuvent donc être intégrés à la biographie avec un degré de certitude supérieur aux récits populaires."
      ],[{kind:"QURAN",label:"Al-Baqara 2:125–129",surahId:2,verse:125,note:"Ibrâhîm et Ismâ‘îl élèvent les fondations de la Maison et invoquent Allah."},{kind:"SUNNA",label:"Sahih al-Bukhari 3364",note:"Long récit authentique de Hâjar, Ismâ‘îl, Zamzam et de la construction de la Kaaba avec Ibrâhîm."}], ["Une œuvre religieuse demande l’acceptation d’Allah, pas seulement l’effort humain.","La construction matérielle doit servir une finalité spirituelle.","Le croyant pense à la transmission aux générations suivantes."]),
      c("legacy",8,"L’héritage du tawhîd","Une voie qui dépasse les appartenances","Alliance · descendance · modèle",[
        "Le Coran présente Ibrâhîm comme un modèle, obéissant à Allah et éloigné de l’association. Il n’appartient pas aux catégories confessionnelles apparues bien après lui.",
        "Sa voie devient une référence pour comprendre l’islam comme soumission à Allah. Ses épreuves, sa migration, sa famille et ses constructions sont reliées par cette même fidélité.",
        "Le récit invite donc à ne pas réduire Ibrâhîm à un ancêtre prestigieux : son héritage est une orientation active vers Allah seul.",
        "Allah éprouve Ibrâhîm par des commandements qu’il accomplit, puis lui annonce qu’Il fera de lui un guide pour les hommes. Ibrâhîm demande que cette faveur atteigne aussi sa descendance ; Allah répond que Son alliance n’atteint pas les injustes. La filiation ne suffit donc jamais sans la droiture.",
        "La Sunna authentique ajoute qu’Ibrâhîm fut circoncis à un âge avancé et rappelle sa place singulière comme khalîl d’Allah. Le grand hadith de l’intercession le mentionne parmi les prophètes vers lesquels l’humanité se tournera au Jour de la Résurrection."
      ],[{kind:"QURAN",label:"An-Nahl 16:120–123",surahId:16,verse:120,note:"Ibrâhîm comme modèle, reconnaissant et droit, et l’ordre de suivre sa voie."}], ["L’héritage d’Ibrâhîm est d’abord spirituel.","L’identité ne remplace pas l’obéissance.","Le tawhîd relie les différentes étapes de sa vie."])
    ]
  },
  lut: {
    id:"lut", name:"Lût", arabic:"لوط", epithet:"Un appel à la pureté et à la justice", summary:"Lût confronte une société qui normalise des pratiques destructrices et rejette l’avertissement.",
    chapters:[
      c("call",1,"Un peuple qui dépasse les limites","Lût avertit sans se lasser","Appel · transgression · avertissement",[
        "Lût reproche à son peuple une turpitude qu’il décrit comme sans précédent parmi les mondes. Il les appelle à craindre Allah et à obéir au messager.",
        "Le Coran associe aussi leur corruption à d’autres comportements : ils coupent les chemins et commettent le blâmable dans leurs assemblées.",
        "Leur réponse n’est pas une réforme, mais le rejet de Lût et de ceux qui veulent rester purs.",
        "Lût reproche à son peuple une turpitude que le Coran présente comme sans précédent parmi les mondes : ils abordent les hommes avec désir au lieu des femmes et commettent aussi, dans d’autres passages, des actes répréhensibles dans leurs assemblées. Son appel n’est donc pas réduit à une seule scène ; il s’inscrit dans une société où la transgression est devenue collective.",
        "Leur réponse ne consiste pas à réfuter son message : ils menacent d’expulser Lût et sa famille parce qu’ils veulent rester purs. Le renversement moral est frappant : la pudeur devient un motif de bannissement tandis que la transgression publique se présente comme norme sociale."
      ],[{kind:"QURAN",label:"Al-‘Ankabût 29:28–30",surahId:29,verse:28,note:"Les actes reprochés au peuple de Lût et son invocation."}], ["Une société peut normaliser ce qui reste moralement destructeur.","Le rappel vise la réforme, pas l’humiliation.","La pression du groupe peut viser ceux qui refusent la corruption."]),
      c("guests",2,"Des visiteurs dans une ville hostile","L’inquiétude de Lût","Hôtes · protection · menace",[
        "Les messagers envoyés auparavant chez Ibrâhîm arrivent auprès de Lût. Celui-ci est affligé et se sent incapable de les protéger face aux intentions de son peuple.",
        "Les habitants accourent vers lui. Lût leur rappelle la voie licite et leur demande de ne pas le déshonorer au sujet de ses hôtes.",
        "Les messagers révèlent alors leur identité et rassurent Lût : son peuple ne pourra pas les atteindre.",
        "Les visiteurs sont d’abord passés chez Ibrâhîm, où leur identité angélique a été révélée. Chez Lût, en revanche, ils prennent l’apparence de jeunes hommes et leur arrivée plonge le prophète dans l’angoisse, car il connaît les intentions de son peuple.",
        "Lorsque les habitants accourent, Lût cherche à protéger ses hôtes et rappelle la voie licite. Les anges lui révèlent finalement qu’ils sont les messagers de son Seigneur et que les hommes ne pourront pas l’atteindre."
      ],[{kind:"QURAN",label:"Hûd 11:77–81",surahId:11,verse:77,note:"L’arrivée des messagers, l’inquiétude de Lût et l’annonce de la délivrance."}], ["Lût cherche à protéger ses hôtes malgré son isolement.","La voie licite est rappelée face à la transgression.","La délivrance arrive au moment où les moyens humains semblent insuffisants."]),
      c("departure",3,"Sortir avant l’aube","Une famille éprouvée par le choix","Départ · famille · salut",[
        "Lût reçoit l’ordre de partir avec sa famille durant une partie de la nuit et de ne pas se retourner. Le jugement doit frapper la ville au matin.",
        "Son épouse est explicitement exclue de la délivrance. Le récit rappelle ainsi que la proximité familiale avec un prophète n’est pas une garantie indépendante de la foi.",
        "Lût quitte donc une ville à laquelle il a longtemps adressé le rappel, sans que sa mission soit mesurée au nombre de ceux qui l’ont suivi.",
        "L’ordre est précis : Lût doit partir avec sa famille pendant une partie de la nuit et personne ne doit se retourner, sauf son épouse qui sera atteinte par ce qui atteindra les autres. L’heure annoncée est le matin, et les anges rassurent Lût : le matin n’est-il pas proche ?",
        "Le Coran ne donne pas une biographie détaillée de l’épouse de Lût ni le nom de la ville dans ce passage. Les traditions populaires qui complètent ces silences sont distinguées de la révélation et ne deviennent pas des faits certains dans le module."
      ],[{kind:"QURAN",label:"Hûd 11:81",surahId:11,verse:81,note:"L’ordre de partir de nuit et l’exception de l’épouse de Lût."}], ["La parenté ne remplace pas le choix de foi.","Le prophète obéit même lorsque le résultat visible de son appel est limité.","Quitter un lieu corrompu peut devenir une nécessité."]),
      c("judgment",4,"La ville renversée","Un avertissement laissé aux générations suivantes","Jugement · signes · mémoire",[
        "Lorsque l’ordre arrive, les cités sont renversées et une pluie de pierres est envoyée sur les injustes.",
        "Le Coran présente cette fin comme un signe pour ceux qui savent observer. Il ne raconte pas l’événement pour nourrir une fascination pour la catastrophe.",
        "L’histoire se termine donc comme un avertissement moral : une communauté peut atteindre un point où le rejet répété du rappel et la transgression collective portent des conséquences.",
        "Le jugement est décrit comme un renversement de la cité accompagné d’une pluie de pierres d’argile marquées auprès d’Allah. D’autres versets mentionnent le cri au lever du soleil. Les images convergent vers un châtiment total après l’arrivée des anges et la sortie des croyants.",
        "Le Coran précise qu’Allah laisse de cette cité un signe clair pour des gens qui raisonnent. L’histoire de Lût ne doit donc pas être exploitée comme un récit sensationnel : elle est donnée comme rappel moral, avertissement et preuve de la conséquence d’une transgression revendiquée."
      ],[{kind:"QURAN",label:"Hûd 11:82–83",surahId:11,verse:82,note:"Le jugement qui frappe les cités du peuple de Lût."}], ["Le jugement est précédé d’un long avertissement.","Le récit vise la leçon, non le sensationnel.","Les traces du passé doivent nourrir la conscience du présent."])
    ]
  },
  ismail: {
    id:"ismail", name:"Ismâ‘îl", arabic:"إسماعيل", epithet:"Fidèle à sa promesse", summary:"Ismâ‘îl apparaît dans le Coran comme un prophète patient, fidèle à sa parole et associé à Ibrâhîm dans l’édification de la Maison.",
    chapters:[
      c("promise",1,"Fidèle à la promesse","Un portrait bref mais précis","Promesse · prière · responsabilité",[
        "Le Coran demande de mentionner Ismâ‘îl et le décrit comme fidèle à sa promesse, messager et prophète.",
        "Il ordonnait à sa famille la prière et la zakât et était agréé auprès de son Seigneur. Ces éléments forment le cœur du portrait coranique explicite d’Ismâ‘îl.",
        "Le texte ne donne pas ici une longue biographie : il met en avant une cohérence entre parole donnée, culte personnel et responsabilité familiale.",
        "La Sunna authentique raconte l’arrivée d’Ismâ‘îl nourrisson avec sa mère Hâjar dans la vallée de La Mecque, alors dépourvue d’habitants et d’eau. Lorsque Hâjar comprend qu’Ibrâhîm agit sur ordre d’Allah, elle répond avec confiance qu’Allah ne les abandonnera pas.",
        "Après l’épuisement de l’eau, Hâjar se déplace entre Safâ et Marwa à la recherche d’un secours. Zamzam apparaît alors par la permission d’Allah. Des gens de Jurhum s’installent ensuite à proximité, et Ismâ‘îl grandit parmi eux. Cette trame authentique de Sahih al-Bukhari donne un véritable contexte biographique à sa jeunesse."
      ],[{kind:"QURAN",label:"Maryam 19:54–55",surahId:19,verse:54,note:"Ismâ‘îl, fidèle à sa promesse, prophète, et son souci de la prière et de la zakât."},{kind:"SUNNA",label:"Sahih al-Bukhari 3364",note:"Récit authentique de l’installation de Hâjar et Ismâ‘îl à La Mecque et de Zamzam."}], ["Tenir sa parole est une qualité prophétique.","La responsabilité spirituelle commence aussi dans la famille.","La brièveté du texte invite à ne pas inventer de détails."]),
      c("sacrifice",2,"L’épreuve avec son père","Une soumission partagée","Père · fils · patience",[
        "Dans la sourate As-Sâffât, Ibrâhîm reçoit la bonne annonce d’un garçon patient. Plus tard, il lui rapporte le songe où il se voit l’immoler.",
        "Le fils répond qu’il fera ce qui lui est ordonné et espère être trouvé parmi les patients. La scène met en valeur son consentement et sa participation consciente à l’épreuve.",
        "Allah rachète finalement l’enfant par une offrande immense. La tradition musulmane identifie ce fils à Ismâ‘îl ; le verset lui-même ne le nomme pas dans cette scène précise, et OUMMAH conserve cette distinction de formulation.",
        "Le Coran décrit le fils comme ayant atteint l’âge de marcher et travailler avec son père. L’épreuve arrive donc dans une relation déjà construite : Ibrâhîm expose son rêve et demande à son fils ce qu’il en pense, tandis que celui-ci répond par l’obéissance et la patience.",
        "Comme le passage ne nomme pas explicitement le fils, OUMMAH signale que l’identification à Ismâ‘îl correspond à l’interprétation majoritaire des savants musulmans. L’essentiel révélé demeure leur soumission commune et le rachat accordé par Allah."
      ],[{kind:"QURAN",label:"As-Sâffât 37:100–107",surahId:37,verse:100,note:"Le fils patient, le songe et le rachat ; le nom n’est pas donné dans ces versets eux-mêmes."}], ["La patience d’un enfant peut accompagner l’obéissance d’un parent.","Le texte coranique est distingué des identifications traditionnelles.","La soumission n’est pas une passivité inconsciente."]),
      c("house",3,"Élever les fondations avec Ibrâhîm","Une œuvre faite en invoquant","Kaaba · construction · invocation",[
        "Le Coran nomme explicitement Ibrâhîm et Ismâ‘îl lorsqu’ils élèvent les fondations de la Maison.",
        "Pendant qu’ils construisent, ils demandent : « Ô notre Seigneur ! Accepte ceci de notre part ! ». Ils demandent aussi la soumission, une communauté soumise issue de leur descendance et l’envoi d’un messager parmi elle.",
        "Ismâ‘îl apparaît ainsi non seulement comme fils d’un prophète, mais comme partenaire d’une œuvre de culte et de transmission.",
        "Le Coran montre Ibrâhîm et Ismâ‘îl élevant ensemble les fondations de la Maison tout en répétant : « Ô notre Seigneur ! Accepte ceci de notre part ! ». Le chantier n’est jamais présenté comme un monument à leur propre gloire ; leur inquiétude porte sur l’acceptation par Allah.",
        "Le long hadith authentique d’Ibn ‘Abbâs complète cette scène : Ibrâhîm revient retrouver Ismâ‘îl à La Mecque, et lorsque la construction commence, Ismâ‘îl lui apporte les pierres tandis que son père bâtit. Ce récit fournit le cadre historique de la collaboration sans avoir besoin d’ajouter des détails légendaires."
      ],[{kind:"QURAN",label:"Al-Baqara 2:127–129",surahId:2,verse:127,note:"Ibrâhîm et Ismâ‘îl élèvent les fondations de la Maison et invoquent Allah."},{kind:"SUNNA",label:"Sahih al-Bukhari 3364",note:"Récit authentique du séjour de Hâjar et Ismâ‘îl à La Mecque et de la construction de la Kaaba avec Ibrâhîm."}], ["Une œuvre sacrée s’accompagne d’humilité.","La transmission fait partie de la construction.","Le lien familial devient coopération dans l’obéissance."])
    ]
  },
  ishaq: {
    id:"ishaq", name:"Ishâq", arabic:"إسحاق", epithet:"Une bonne annonce inattendue", summary:"Ishâq est présenté comme une bonne annonce accordée à Ibrâhîm et comme un prophète béni.",
    chapters:[
      c("announcement",1,"Une naissance annoncée","Une promesse au-delà des causes habituelles","Annonce · famille · miséricorde",[
        "Les messagers venus auprès d’Ibrâhîm annoncent à son épouse la naissance d’Ishâq, puis celle de Ya‘qûb après lui.",
        "Elle s’étonne de cette annonce compte tenu de leur âge. Les messagers lui rappellent qu’il ne faut pas s’étonner de l’ordre d’Allah et de Sa miséricorde sur cette maison.",
        "Ishâq entre donc dans le récit comme un don explicitement annoncé et comme un maillon d’une descendance bénie.",
        "L’annonce d’Ishâq arrive à Ibrâhîm et Sârah alors qu’ils ont atteint un âge où la naissance paraît humainement improbable. Sârah rit et s’étonne ; les anges lui rappellent qu’il ne faut pas s’étonner du décret d’Allah et invoquent Sa miséricorde et Ses bénédictions sur cette maison.",
        "La bonne annonce ne concerne pas seulement Ishâq : la sourate Hûd annonce également Ya‘qûb après lui. Dès sa naissance annoncée, Ishâq apparaît donc au cœur d’une continuité prophétique qui se prolongera dans les Enfants d’Israël."
      ],[{kind:"QURAN",label:"Hûd 11:69–73",surahId:11,verse:69,note:"Les visiteurs d’Ibrâhîm et la bonne annonce d’Ishâq puis de Ya‘qûb."}], ["La puissance d’Allah dépasse les causes habituelles.","Une bonne annonce peut arriver là où les moyens semblent épuisés.","La bénédiction familiale est présentée comme une miséricorde."]),
      c("prophet",2,"Un prophète parmi les vertueux","Bénédiction et continuité","Prophétie · bénédiction · descendance",[
        "Après l’épreuve du sacrifice, le Coran annonce à Ibrâhîm la bonne nouvelle d’Ishâq comme prophète parmi les vertueux.",
        "Allah bénit Ibrâhîm et Ishâq, tout en précisant que parmi leur descendance se trouveront à la fois des bienfaisants et des personnes clairement injustes envers elles-mêmes.",
        "La noblesse d’une lignée ne supprime donc jamais la responsabilité individuelle.",
        "Le Coran qualifie Ishâq de prophète parmi les vertueux et rappelle qu’Allah bénit Ibrâhîm et Ishâq. Il apparaît régulièrement avec Ibrâhîm et Ya‘qûb dans les listes de prophètes auxquels la guidance et la révélation ont été accordées.",
        "La Sunna authentique, lorsqu’elle décrit Yûsuf comme « le noble, fils du noble, fils du noble, fils du noble », établit la lignée : Yûsuf fils de Ya‘qûb, fils d’Ishâq, fils d’Ibrâhîm. Elle confirme ainsi la place d’Ishâq dans cette chaîne prophétique sans fournir une biographie détaillée supplémentaire."
      ],[{kind:"QURAN",label:"As-Sâffât 37:112–113",surahId:37,verse:112,note:"La bonne annonce d’Ishâq comme prophète et la bénédiction de sa descendance."},{kind:"SUNNA",label:"Sahih al-Bukhari 4688",note:"Le Prophète ﷺ décrit Yûsuf comme fils de Ya‘qûb, fils d’Ishâq, fils d’Ibrâhîm."}], ["La prophétie est un don d’Allah.","Une lignée bénie ne garantit pas la droiture de chaque descendant.","La responsabilité reste individuelle."])
    ]
  },
  yaqub: {
    id:"yaqub", name:"Ya‘qûb", arabic:"يعقوب", epithet:"La belle patience", summary:"Ya‘qûb traverse la séparation, le deuil et l’attente sans perdre son espérance en Allah.",
    chapters:[
      c("legacy",1,"Un héritage de foi","Transmettre avant de quitter ce monde","Famille · testament · tawhîd",[
        "Le Coran rappelle qu’Ibrâhîm et Ya‘qûb recommandent à leurs enfants de demeurer soumis à Allah.",
        "Au moment où la mort approche Ya‘qûb, il demande à ses fils qui ils adoreront après lui. Ils répondent qu’ils adoreront son Dieu et le Dieu de ses pères, le Dieu unique.",
        "Le portrait commence donc par la transmission : Ya‘qûb veut laisser une orientation de foi, pas seulement un héritage familial.",
        "Ya‘qûb est aussi nommé Israël dans le Coran. Il appartient à la descendance bénie d’Ibrâhîm et d’Ishâq, et ses fils deviendront l’origine des tribus des Enfants d’Israël. Sa biographie coranique se lit surtout à travers sa relation à la foi transmise et à ses enfants.",
        "Lorsqu’il approche de la mort, le Coran rapporte qu’il demande à ses fils ce qu’ils adoreront après lui. Ils répondent qu’ils adoreront son Dieu et le Dieu de ses pères Ibrâhîm, Ismâ‘îl et Ishâq, Dieu unique auquel ils se soumettent. Ce testament résume l’héritage qu’il cherche à laisser."
      ],[{kind:"QURAN",label:"Al-Baqara 2:132–133",surahId:2,verse:132,note:"La recommandation de Ya‘qûb à ses enfants et leur engagement envers le Dieu unique."}], ["La transmission spirituelle mérite d’être préparée.","La foi n’est pas supposée : elle est explicitement rappelée.","L’héritage le plus profond est l’orientation vers Allah."]),
      c("yusuf",2,"Le songe de Yûsuf","Un père qui perçoit un danger","Songe · jalousie · protection",[
        "Yûsuf raconte à son père un songe où onze étoiles, le soleil et la lune se prosternent devant lui. Ya‘qûb comprend qu’il s’agit d’un signe important.",
        "Il conseille à son fils de ne pas raconter ce songe à ses frères, de peur qu’ils ne complotent contre lui. Le père combine ainsi confiance en Allah et prudence humaine.",
        "Il annonce aussi que son Seigneur le choisira, lui enseignera l’interprétation des événements et accomplira Son bienfait sur la famille de Ya‘qûb.",
        "Ya‘qûb comprend que la faveur annoncée à Yûsuf s’inscrit dans une chaîne familiale déjà marquée par la prophétie. Il évoque explicitement Ibrâhîm et Ishâq comme ceux sur lesquels Allah avait auparavant complété Son bienfait.",
        "Sa recommandation de garder le songe secret ne relève pas d’une méfiance irrationnelle envers tous ses fils : elle manifeste sa connaissance de la jalousie humaine et sa volonté de protéger Yûsuf d’un mal prévisible."
      ],[{kind:"QURAN",label:"Yûsuf 12:4–6",surahId:12,verse:4,note:"Le songe de Yûsuf et le conseil de Ya‘qûb."}], ["La prudence n’est pas contraire au tawakkul.","Un parent peut percevoir des risques relationnels réels.","La promesse d’Allah n’exclut pas les épreuves intermédiaires."]),
      c("grief",3,"Une belle patience","Pleurer sans désespérer","Deuil · patience · espérance",[
        "Lorsque les frères reviennent sans Yûsuf et présentent leur version des faits, Ya‘qûb ne l’accepte pas naïvement. Il dit que leurs âmes leur ont plutôt suggéré quelque chose.",
        "Il choisit alors ce qu’il appelle une belle patience. Plus tard, son chagrin devient si profond que ses yeux blanchissent, mais il ne tourne pas sa plainte contre Allah.",
        "Il dit : « Je ne me plains qu’à Allah de mon déchirement et de mon chagrin » et affirme savoir d’Allah ce que ses fils ne savent pas.",
        "Lorsque la seconde crise survient avec Binyâmîn, Ya‘qûb répète presque la même formule que des années auparavant : « une belle patience ». La répétition donne à voir une vertu devenue disposition profonde, non une réaction ponctuelle réservée à la première épreuve.",
        "Il demande pourtant à ses fils d’agir : retourner chercher Yûsuf et son frère. Sa patience ne consiste donc pas à attendre passivement ; elle combine plainte adressée à Allah, refus du désespoir et poursuite des moyens possibles."
      ],[{kind:"QURAN",label:"Yûsuf 12:18, 83–87",surahId:12,verse:83,note:"La belle patience de Ya‘qûb, son chagrin et son espérance en Allah."}], ["La patience n’empêche pas la douleur.","Se plaindre à Allah n’est pas se plaindre d’Allah.","L’espérance peut survivre à une attente très longue."]),
      c("reunion",4,"Les yeux retrouvent la lumière","Le retour après les années de séparation","Réunion · pardon · accomplissement",[
        "Lorsque la chemise de Yûsuf arrive, Ya‘qûb affirme sentir son odeur avant même que les autres ne le croient. La chemise est posée sur son visage et sa vue revient.",
        "Ses fils reconnaissent leur faute et lui demandent de solliciter le pardon d’Allah pour eux. Ya‘qûb répond qu’il demandera pardon à son Seigneur.",
        "La famille rejoint finalement Yûsuf en Égypte. L’attente de Ya‘qûb se termine par une réunion qui donne un nouveau sens à des années de perte et de patience.",
        "Ya‘qûb n’abandonne jamais l’espérance : il ordonne à ses fils de retourner chercher Yûsuf et son frère et leur interdit de désespérer de la miséricorde d’Allah. Le dénouement intervient lorsque la chemise de Yûsuf est envoyée et posée sur son visage, rendant sa vue.",
        "La famille se met alors en route vers l’Égypte. Yûsuf accueille ses parents et les fait entrer en sécurité ; le songe de l’enfance trouve son accomplissement. La patience de Ya‘qûb n’était pas la certitude de connaître chaque étape, mais le refus de couper l’espoir en Allah."
      ],[{kind:"QURAN",label:"Yûsuf 12:93–100",surahId:12,verse:93,note:"La chemise de Yûsuf, le retour de la vue de Ya‘qûb et la réunion familiale."}], ["L’espérance peut être confirmée après une très longue attente.","Le pardon familial n’efface pas la reconnaissance des fautes.","Allah peut réunir ce qui semblait définitivement séparé."])
    ]
  },
  yusuf: {
    id:"yusuf", name:"Yûsuf", arabic:"يوسف", epithet:"De l’épreuve à l’élévation", summary:"Une histoire presque continue : jalousie, puits, servitude, tentation, prison, pouvoir et pardon.",
    chapters:[
      c("dream",1,"Le songe de l’enfance","Une promesse cachée dans une vision","Songe · famille · avenir",[
        "Yûsuf raconte à son père un songe où onze étoiles, le soleil et la lune se prosternent devant lui. Ya‘qûb comprend qu’un destin particulier se dessine.",
        "Il lui recommande de ne pas raconter ce songe à ses frères afin d’éviter la jalousie et les complots. La protection du secret devient ici une mesure de prudence.",
        "Le père annonce aussi qu’Allah choisira Yûsuf, lui enseignera l’interprétation des événements et accomplira Son bienfait sur la famille de Ya‘qûb.",
        "Yûsuf grandit dans une famille prophétique : son père est Ya‘qûb, son grand-père Ishâq et son arrière-grand-père Ibrâhîm. La Sunna authentique le qualifie pour cette raison de « noble, fils du noble, fils du noble, fils du noble ».",
        "Le songe ne se réalise pas immédiatement. Il devient le fil conducteur d’une histoire qui passera par la jalousie, l’esclavage, la tentation, la prison et le pouvoir avant que Yûsuf puisse enfin reconnaître que son Seigneur a rendu le songe vrai."
      ],[{kind:"QURAN",label:"Yûsuf 12:4–6",surahId:12,verse:4,note:"Le songe de Yûsuf et le conseil de Ya‘qûb."},{kind:"SUNNA",label:"Sahih al-Bukhari 4688–4689",note:"Yûsuf est qualifié de noble, fils de prophètes et petit-fils d’Ibrâhîm."}], ["Un bienfait annoncé peut nécessiter discrétion et patience.","La jalousie familiale est un risque réel que le Coran ne minimise pas.","La promesse d’Allah peut se déployer sur des années."]),
      c("well",2,"Le puits","Quand les frères choisissent la jalousie","Jalousie · puits · séparation",[
        "Les frères de Yûsuf estiment que leur père aime davantage Yûsuf et son frère. Leur jalousie les pousse à discuter de sa disparition.",
        "Ils convainquent Ya‘qûb de le laisser partir avec eux puis le jettent au fond d’un puits. Allah révèle à Yûsuf qu’un jour il leur rappellera cet acte alors qu’ils ne le reconnaîtront pas.",
        "De retour chez leur père, ils présentent une chemise tachée d’un faux sang. Ya‘qûb comprend que leur récit ne correspond pas à la réalité et choisit une belle patience.",
        "Les frères discutent entre eux de la manière d’éloigner Yûsuf afin que l’attention de leur père se tourne vers eux. L’un d’eux s’oppose au meurtre et propose de le jeter au fond d’un puits afin qu’une caravane le recueille. Ils obtiennent ensuite de Ya‘qûb qu’il le laisse partir avec eux.",
        "Après l’avoir jeté dans le puits, ils reviennent le soir en pleurant avec une chemise tachée d’un faux sang. Ya‘qûb comprend que leurs âmes leur ont embelli quelque chose et répond par la belle patience."
      ],[{kind:"QURAN",label:"Yûsuf 12:7–18",surahId:12,verse:7,note:"La jalousie des frères, le puits et la réaction de Ya‘qûb."}], ["La jalousie peut pousser à rationaliser l’injustice.","La patience n’oblige pas à croire un mensonge évident.","Allah peut rassurer au cœur même de l’épreuve."]),
      c("egypt",3,"De la caravane à l’Égypte","Une vie déplacée sans perdre sa dignité","Caravane · vente · maison",[
        "Une caravane s’arrête près du puits et son porteur d’eau découvre Yûsuf. Il est ensuite vendu à bas prix, comme une marchandise dont on veut se débarrasser rapidement.",
        "L’homme d’Égypte qui l’achète demande à son épouse de bien le traiter, espérant qu’il puisse leur être utile ou qu’ils l’adoptent.",
        "Le Coran souligne qu’Allah établit ainsi Yûsuf dans le pays et lui enseigne l’interprétation des événements, alors même que les causes visibles semblaient n’être qu’une succession de pertes.",
        "Une caravane envoie son puisatier, qui découvre Yûsuf et s’écrie qu’il s’agit d’une bonne nouvelle. Les hommes le cachent comme une marchandise puis il est vendu à vil prix, quelques pièces comptées. Le Coran souligne qu’ils ne connaissaient pas sa véritable valeur.",
        "L’homme d’Égypte qui l’achète demande à son épouse de bien le traiter, espérant qu’il leur soit utile ou qu’ils l’adoptent. Allah établit ainsi Yûsuf dans le pays même où se dérouleront les étapes suivantes et lui enseignera l’interprétation des événements."
      ],[{kind:"QURAN",label:"Yûsuf 12:19–22",surahId:12,verse:19,note:"La découverte de Yûsuf, sa vente et son installation en Égypte."}], ["Une situation humiliante aux yeux des hommes peut devenir une étape d’un plan plus vaste.","La dignité de Yûsuf n’est pas définie par son statut social.","Allah agit au-delà de la perception immédiate."]),
      c("temptation",4,"La porte fermée","Résister quand personne ne semble regarder","Tentation · pudeur · protection",[
        "La femme dans la maison où vit Yûsuf cherche à le séduire et ferme les portes. Yûsuf se réfugie auprès d’Allah et refuse de trahir la confiance qui lui a été accordée.",
        "Tous deux courent vers la porte ; sa chemise est déchirée par derrière. Un témoin de la famille propose un critère simple : la position de la déchirure permet de distinguer les versions.",
        "Lorsque les femmes de la ville commentent l’affaire, Yûsuf préfère la prison à ce vers quoi on l’appelle et demande à Allah de détourner de lui leur ruse.",
        "Après la première accusation démentie par la tunique, l’affaire se diffuse dans la ville. Les femmes parlent de l’épouse du dignitaire ; elle les invite, leur remet des couteaux et fait apparaître Yûsuf. Leur réaction montre que son refus n’était pas dû à une absence de tentation mais à une conscience d’Allah plus forte que l’appel du désir.",
        "Yûsuf invoque alors son Seigneur : la prison lui est préférable à ce à quoi elles l’invitent. Allah détourne de lui leur ruse, mais la décision sociale reste de l’emprisonner pour un temps malgré les signes de son innocence."
      ],[{kind:"QURAN",label:"Yûsuf 12:23–35",surahId:12,verse:23,note:"La tentative de séduction, l’innocence de Yûsuf et son choix de la prison."}], ["La pudeur se manifeste dans des choix concrets.","Chercher refuge auprès d’Allah accompagne l’effort personnel.","Préserver sa foi peut coûter socialement."]),
      c("prison",5,"La prison comme lieu d’appel","Servir même dans l’injustice","Prison · rêve · tawhîd",[
        "En prison, deux jeunes hommes racontent chacun un rêve à Yûsuf et lui demandent de les interpréter. Avant de répondre, il les appelle à l’adoration d’Allah seul.",
        "Il explique ensuite que l’un servira le vin à son maître tandis que l’autre sera exécuté. Il demande au premier, une fois libéré, de parler de lui auprès du roi.",
        "Mais Yûsuf reste encore plusieurs années en prison. Même dans cette attente, le Coran le montre transmettant le tawhîd et utilisant le savoir reçu d’Allah.",
        "Lorsque les femmes de la ville parlent de l’affaire, l’épouse les invite et leur donne des couteaux. À la vue de Yûsuf, elles sont frappées par sa beauté et se blessent les mains. Elle reconnaît alors publiquement avoir cherché à le séduire et menace de prison s’il ne cède pas.",
        "Yûsuf préfère la prison à ce vers quoi on l’appelle. En prison, deux jeunes hommes lui racontent leurs rêves. Avant de les interpréter, Yûsuf utilise l’occasion pour appeler à l’unicité d’Allah et dénoncer la multiplicité des divinités imaginées."
      ],[{kind:"QURAN",label:"Yûsuf 12:36–42",surahId:12,verse:36,note:"Les rêves des deux prisonniers, l’appel au tawhîd et leur interprétation."}], ["L’injustice subie n’empêche pas de servir et d’enseigner.","Yûsuf place le tawhîd avant l’interprétation demandée.","Un délai n’annule pas la promesse."]),
      c("king",6,"Le rêve du roi","Le savoir au service d’une crise","Rêve · famine · planification",[
        "Le roi voit en rêve sept vaches grasses dévorées par sept maigres et sept épis verts avec d’autres secs. Les notables sont incapables de donner une interprétation convaincante.",
        "L’ancien compagnon de prison se souvient alors de Yûsuf. Celui-ci explique que le pays connaîtra sept années d’abondance suivies de sept années difficiles, puis une année de soulagement.",
        "Il ne donne pas seulement une interprétation : il propose aussi une stratégie de stockage et de gestion des récoltes pour traverser la crise.",
        "Le compagnon de prison libéré ne se souvient de Yûsuf qu’après un temps. Il vient lui demander l’interprétation du rêve du roi ; Yûsuf répond sans exiger d’abord sa propre liberté, plaçant la résolution de la crise collective avant son intérêt personnel immédiat.",
        "Son interprétation combine compréhension du rêve et politique économique : conserver les récoltes dans leurs épis, ne consommer qu’une faible part, puis traverser sept années difficiles grâce aux réserves. Le savoir prophétique se traduit ici en organisation concrète."
      ],[{kind:"QURAN",label:"Yûsuf 12:43–49",surahId:12,verse:43,note:"Le rêve du roi et le plan proposé par Yûsuf pour les années de famine."}], ["Le savoir utile anticipe et organise.","Une bonne lecture d’une crise doit conduire à l’action.","La compétence peut émerger d’un lieu où personne ne l’attend."]),
      c("innocence",7,"Sortir avec une innocence établie","Refuser une libération ambiguë","Justice · vérité · réputation",[
        "Lorsque le roi demande que Yûsuf soit amené, celui-ci ne sort pas immédiatement. Il demande que l’affaire des femmes qui s’étaient coupé les mains soit éclaircie.",
        "Les femmes reconnaissent qu’elles ne connaissent aucun mal de lui, et la femme du notable reconnaît finalement avoir tenté de le séduire.",
        "Yûsuf sort donc de prison après que la vérité de l’affaire a été publiquement établie, et non par une grâce laissant planer le doute.",
        "Lorsque le roi demande qu’on amène Yûsuf, celui-ci refuse de quitter immédiatement la prison. Il exige d’abord que soit éclaircie l’affaire des femmes qui s’étaient coupé les mains. Son objectif n’est pas la vengeance, mais que son innocence soit connue publiquement.",
        "Interrogées, les femmes déclarent ne connaître aucun mal en lui. L’épouse du dignitaire reconnaît alors que c’est elle qui l’avait sollicité et que Yûsuf disait vrai. Il sort donc de prison avec une réputation restaurée, non sous l’ombre d’un soupçon."
      ],[{kind:"QURAN",label:"Yûsuf 12:50–53",surahId:12,verse:50,note:"L’enquête demandée par Yûsuf et la reconnaissance de son innocence."}], ["La vérité publique peut compter après une accusation publique.","La patience n’exige pas d’abandonner son honneur.","La justice consiste aussi à clarifier les faits."]),
      c("authority",8,"Une responsabilité sur les réserves","Du prisonnier au gestionnaire","Pouvoir · confiance · compétence",[
        "Le roi reconnaît la valeur de Yûsuf et veut le rapprocher de lui. Yûsuf demande alors à être chargé des réserves du pays, en se présentant comme gardien compétent.",
        "Le Coran décrit son établissement dans le pays comme une faveur d’Allah. Le pouvoir n’est pas présenté comme une revanche personnelle sur ceux qui l’avaient humilié.",
        "Yûsuf utilise au contraire sa position pour gérer une période de crise qui touchera aussi les régions voisines.",
        "Yûsuf ne se contente pas d’être honoré par le roi : il demande explicitement une fonction correspondant à ses capacités, la garde des réserves du pays. Le Coran lie sa demande à deux qualités qu’il affirme posséder : fiabilité et connaissance.",
        "Allah résume ce retournement en disant qu’Il établit Yûsuf dans le pays, libre de s’y installer où il veut. Le jeune homme vendu comme esclave devient responsable de la gestion qui préservera des populations pendant la famine."
      ],[{kind:"QURAN",label:"Yûsuf 12:54–57",surahId:12,verse:54,note:"Yûsuf est établi dans le pays et prend en charge les réserves."}], ["Demander une responsabilité peut être légitime lorsqu’on en connaît la nécessité et sa compétence.","Le pouvoir est une charge avant d’être un prestige.","La réussite n’efface pas les années d’épreuve, elle leur donne un nouveau contexte."]),
      c("brothers",9,"Les frères devant lui","Reconnaître sans humilier","Famille · épreuve · pardon",[
        "La famine conduit les frères de Yûsuf en Égypte pour chercher des provisions. Yûsuf les reconnaît, tandis qu’eux ne le reconnaissent pas.",
        "Les événements qui suivent conduisent à faire venir son frère puis à révéler progressivement la vérité. Lorsque ses frères reconnaissent leurs fautes, Yûsuf ne choisit pas la vengeance.",
        "Il leur dit qu’il n’y aura pas de reproche contre eux ce jour-là et demande à Allah de leur pardonner. Le pardon arrive après la vérité, pas à la place de la vérité.",
        "Yûsuf reconnaît ses frères et organise leur prochain retour avec Binyâmîn. Il fait remettre leur marchandise dans leurs bagages afin qu’ils soient incités à revenir. Ya‘qûb hésite à leur confier un second fils et exige d’eux un engagement solennel.",
        "Lors du voyage suivant, Yûsuf fait rester son frère auprès de lui selon un stratagème permis par Allah. Les frères plaident en faveur du père âgé et l’un d’eux reste en Égypte. Lorsque leur détresse atteint son sommet, Yûsuf leur révèle finalement son identité."
      ],[{kind:"QURAN",label:"Yûsuf 12:58–92",surahId:12,verse:58,note:"Les frères de Yûsuf reviennent en Égypte, l’épreuve avec Benjamin et la révélation de son identité."}], ["Le pardon n’exige pas de nier l’injustice passée.","La position de force peut devenir un lieu de miséricorde.","Yûsuf choisit la réparation familiale plutôt que la revanche."]),
      c("fulfillment",10,"Le songe accompli","Une histoire relue à la lumière de la fin","Réunion · gratitude · accomplissement",[
        "Yûsuf fait venir sa famille en Égypte. Ses parents et ses frères se prosternent devant lui selon la forme de salut autorisée à leur époque, et il reconnaît alors l’accomplissement de son ancien songe.",
        "Il ne résume pas son parcours par ses propres capacités : il rappelle la bonté de son Seigneur, qui l’a sorti de prison et a réuni sa famille après que Satan avait semé la discorde.",
        "Son invocation finale demande à Allah de le faire mourir soumis et de le joindre aux vertueux. L’histoire se termine ainsi par la gratitude et le désir d’une bonne fin.",
        "Lorsque la famille entre auprès de Yûsuf, il rapproche ses parents de lui et leur dit d’entrer en Égypte en sécurité, si Allah le veut. Le Coran fait ainsi de la sécurité finale l’opposé presque exact du puits, de la vente et de la prison qui avaient marqué le début du récit.",
        "Yûsuf conclut par une invocation qui ne s’attarde pas sur son pouvoir : il remercie Allah de lui avoir donné une part de royauté et enseigné l’interprétation, puis demande à mourir soumis et à rejoindre les vertueux. Le sommet de sa réussite devient un retour à la servitude envers Allah."
      ],[{kind:"QURAN",label:"Yûsuf 12:93–101",surahId:12,verse:93,note:"La réunion familiale, l’accomplissement du songe et l’invocation finale de Yûsuf."}], ["Une promesse peut prendre des décennies avant d’être comprise.","La gratitude relit le parcours sans glorifier l’ego.","La bonne fin reste plus importante que le succès terrestre."])
    ]
  },
  shuayb: {
    id:"shuayb", name:"Shu‘ayb", arabic:"شعيب", epithet:"Justice dans les échanges", summary:"Shu‘ayb relie le tawhîd à l’honnêteté économique et à la justice dans la cité.",
    chapters:[
      c("measure",1,"Ne pas diminuer la mesure","La foi jusque dans les transactions","Commerce · justice · tawhîd",[
        "Shu‘ayb appelle son peuple de Madyan à adorer Allah seul et leur demande de ne pas diminuer la mesure ni la balance.",
        "Il les avertit aussi de ne pas enlever aux gens ce qui leur revient et de ne pas semer la corruption sur terre après qu’elle a été réformée.",
        "Le message religieux touche donc directement les pratiques économiques. La foi n’est pas séparée de la manière de vendre, peser et traiter les autres.",
        "Shu‘ayb est envoyé aux gens de Madyan et leur adresse le même fondement que les autres messagers : adorer Allah sans autre divinité. Mais son appel touche aussi directement leurs pratiques commerciales, car leur corruption religieuse s’accompagne d’une injustice économique.",
        "Il leur interdit de diminuer les mesures et les poids, de léser les gens de leurs biens et de semer le désordre sur terre après qu’elle a été réformée. Il leur rappelle que le reste licite laissé par Allah est meilleur pour eux que les gains obtenus par la fraude."
      ],[{kind:"QURAN",label:"Hûd 11:84–86",surahId:11,verse:84,note:"L’appel de Shu‘ayb au tawhîd et à l’honnêteté dans la mesure et la balance."}], ["La justice économique fait partie de la religion.","Le gain injuste n’est pas un succès.","Le tawhîd transforme aussi les pratiques sociales."]),
      c("mockery",2,"Une prière qu’ils tournent en dérision","Quand la morale dérange les intérêts","Moquerie · autonomie · rappel",[
        "Le peuple répond à Shu‘ayb en se moquant : est-ce sa prière qui lui ordonne de leur demander d’abandonner les divinités de leurs pères ou de cesser de disposer librement de leurs biens ?",
        "Shu‘ayb explique qu’il s’appuie sur une preuve venant de son Seigneur et qu’il ne veut pas leur interdire quelque chose pour ensuite le pratiquer lui-même.",
        "Il résume son intention : il ne veut que la réforme autant qu’il le peut, et sa réussite ne dépend que d’Allah.",
        "La moquerie de son peuple révèle une conception séparant religion et économie : ils refusent que la prière ou la foi puissent avoir quelque chose à dire sur la manière de mesurer, vendre et posséder. Shu‘ayb répond précisément en refusant cette séparation.",
        "Il ajoute qu’il ne veut pas faire en secret ce qu’il interdit publiquement. Cette cohérence entre parole et conduite donne à son appel une dimension personnelle : le réformateur est lui-même soumis à la norme qu’il annonce."
      ],[{kind:"QURAN",label:"Hûd 11:87–88",surahId:11,verse:87,note:"La moquerie du peuple et la réponse de Shu‘ayb sur la réforme et la cohérence."}], ["La religion peut être rejetée lorsqu’elle limite des intérêts injustes.","Le réformateur doit éviter le double discours.","La réussite de l’effort reste entre les mains d’Allah."]),
      c("threat",3,"La menace d’expulsion","Rester ferme sans falsifier le choix","Pression · foi · confiance",[
        "Les notables menacent Shu‘ayb et les croyants de les expulser ou de les forcer à revenir à leur religion.",
        "Shu‘ayb refuse l’idée d’un retour forcé à ce qu’Allah les a délivrés de croire. Il place sa confiance en Allah et demande qu’Il tranche avec vérité entre les parties.",
        "La confrontation montre que l’oppression ne vise pas seulement les idées, mais aussi le droit de vivre selon la foi.",
        "Leur menace d’expulsion s’accompagne d’un mépris social : ils affirment ne voir en Shu‘ayb qu’un homme faible et déclarent qu’ils l’auraient lapidé sans la protection de son clan. Shu‘ayb leur demande alors si son clan a plus de valeur à leurs yeux qu’Allah.",
        "Il conclut en invitant chacun à agir selon sa position et à attendre l’issue. Ce n’est pas une incapacité à répondre, mais la reconnaissance que le jugement final sur le message appartient à Allah."
      ],[{kind:"QURAN",label:"Al-A‘râf 7:88–89",surahId:7,verse:88,note:"La menace d’expulsion et la réponse de Shu‘ayb."}], ["La foi ne peut pas être imposée par la contrainte inverse.","Le croyant peut demander à Allah un jugement juste.","La pression sociale ne transforme pas l’erreur en vérité."]),
      c("end",4,"Le cri et la ville silencieuse","Une économie prospère qui ne sauve pas","Jugement · perte · avertissement",[
        "Lorsque l’ordre d’Allah arrive, Shu‘ayb et les croyants sont sauvés par une miséricorde venant d’Allah.",
        "Les injustes sont saisis par le cri et se retrouvent sans vie dans leurs demeures, comme s’ils n’y avaient jamais vécu.",
        "Le récit se referme sur une communauté qui croyait défendre ses habitudes et ses profits, mais qui perd finalement tout ce qu’elle voulait préserver.",
        "Le Coran rapproche parfois le châtiment de Madyan de celui des peuples précédents, mais chaque récit conserve son identité. Shu‘ayb se détourne finalement de son peuple en rappelant qu’il a transmis les messages de son Seigneur et donné un conseil sincère.",
        "L’identification du vieil homme de Madyan rencontré par Mûsâ à Shu‘ayb reste une opinion répandue mais non prouvée par un hadith authentique. Cette précision évite d’ajouter artificiellement un épisode à la biographie de Shu‘ayb."
      ],[{kind:"QURAN",label:"Hûd 11:94–95",surahId:11,verse:94,note:"La délivrance de Shu‘ayb et la fin de Madyan."}], ["La prospérité injuste n’est pas durable.","Le jugement est précédé de conseils détaillés.","La réforme économique et spirituelle sont liées."])
    ]
  },
  ayyub: {
    id:"ayyub", name:"Ayyûb", arabic:"أيوب", epithet:"La patience dans l’épreuve", summary:"Le Coran raconte peu de détails sur la maladie d’Ayyûb, mais souligne son invocation, sa patience et la miséricorde d’Allah.",
    chapters:[
      c("trial",1,"L’épreuve sans récit inventé","Le Coran reste sobre sur les détails","Épreuve · patience · sobriété",[
        "Le Coran mentionne Ayyûb lorsqu’il appelle son Seigneur en disant que le mal l’a touché et qu’Allah est le plus Miséricordieux des miséricordieux.",
        "Il ne détaille pas la nature exacte de sa maladie, sa durée ou les circonstances de toutes ses pertes. Beaucoup de récits populaires ajoutent ces éléments, mais ils ne sont pas nécessaires pour comprendre le message coranique.",
        "L’histoire d’Ayyûb commence donc ici par une règle de méthode : conserver la force de l’épreuve sans fabriquer ce que la révélation n’a pas précisé.",
        "La formulation coranique de l’invocation d’Ayyûb est remarquable par sa retenue : il expose le mal qui l’a touché et appelle Allah « le plus miséricordieux des miséricordieux » sans transformer la prière en accusation ni en exigence.",
        "La sourate Sâd rapporte aussi qu’il attribue à Satan une fatigue et un tourment, mais ne donne pas le récit détaillé souvent raconté dans les livres populaires. La fidélité à la source implique ici de respecter cette sobriété."
      ],[{kind:"QURAN",label:"Al-Anbiyâ’ 21:83",surahId:21,verse:83,note:"L’invocation d’Ayyûb lorsqu’il est touché par le mal."}], ["La sobriété des sources mérite d’être respectée.","L’invocation d’Ayyûb ne contient ni accusation ni désespoir.","La patience n’a pas besoin de détails dramatiques inventés."]),
      c("relief",2,"La réponse et la guérison","Une miséricorde et un rappel","Guérison · famille · miséricorde",[
        "Allah répond à Ayyûb, écarte le mal qui le touchait et lui rend sa famille, avec autant en plus.",
        "Dans la sourate Sâd, il reçoit l’ordre de frapper le sol de son pied : une eau fraîche lui est donnée pour se laver et boire.",
        "Le Coran présente cette délivrance comme une miséricorde venant d’Allah et un rappel pour les adorateurs.",
        "La guérison n’efface pas l’histoire de l’épreuve : Allah dit qu’Il rend à Ayyûb sa famille et autant avec elle « par miséricorde de Notre part et en tant que rappel aux adorateurs ». Le retour des bienfaits devient donc lui-même un enseignement.",
        "Le geste de frapper le sol de son pied avant l’apparition de l’eau montre encore une combinaison familière dans les récits prophétiques : l’ordre divin et le moyen concret se rejoignent, même lorsque la guérison est miraculeuse."
      ],[{kind:"QURAN",label:"Al-Anbiyâ’ 21:84",surahId:21,verse:84,note:"Allah répond à Ayyûb et lui rend sa famille."},{kind:"QURAN",label:"Sâd 38:41–43",surahId:38,verse:41,note:"L’eau donnée à Ayyûb et le retour des bienfaits."}], ["La délivrance peut venir après une longue endurance.","Le soulagement est présenté comme une miséricorde.","L’épreuve d’un croyant peut devenir un rappel pour d’autres."]),
      c("praise",3,"Un excellent serviteur","Patient et constamment tourné vers Allah","Patience · retour · fidélité",[
        "Allah qualifie Ayyûb d’excellent serviteur et souligne qu’il revenait constamment vers Lui.",
        "Cette appréciation divine donne la clé du récit : sa grandeur n’est pas d’avoir été invulnérable à la souffrance, mais d’être resté orienté vers Allah au milieu d’elle.",
        "Le récit d’Ayyûb devient ainsi une école de patience lucide, où l’on peut nommer la douleur tout en gardant l’espérance.",
        "Allah conclut son portrait par deux mots d’une grande densité : « Quel bon serviteur ! Sans cesse il se repentait. ». La qualité centrale n’est pas l’endurance stoïque en elle-même, mais le fait de rester tourné vers Allah au cœur puis au sortir de l’épreuve.",
        "Le hadith des sauterelles d’or montre que cette orientation demeure même après la restauration des biens : Ayyûb ne cherche pas l’or parce qu’il manque de richesse, mais parce qu’il ne veut pas se passer d’une bénédiction venant de son Seigneur."
      ],[{kind:"QURAN",label:"Sâd 38:44",surahId:38,verse:44,note:"Allah loue Ayyûb comme excellent serviteur, patient et revenant vers Lui."}], ["La patience n’est pas l’absence de douleur.","Revenir à Allah est le fil conducteur de l’épreuve.","La louange d’Allah vaut davantage que l’image extérieure de réussite."])
    ]
  },
  "dhul-kifl": {
    id:"dhul-kifl", name:"Dhûl-Kifl", arabic:"ذو الكفل", epithet:"Parmi les patients et les vertueux", summary:"Le Coran le nomme brièvement ; OUMMAH ne transforme pas ces mentions en biographie imaginaire.",
    chapters:[c("mention",1,"Une mention parmi les patients","S’en tenir à ce qui est établi","Patience · vertu · sobriété",[
      "Dhûl-Kifl est mentionné avec Ismâ‘îl et Idrîs parmi ceux qui ont fait preuve de patience. Allah dit les avoir fait entrer dans Sa miséricorde et les compte parmi les vertueux.",
      "Il est aussi mentionné dans la sourate Sâd avec Ismâ‘îl et Al-Yasa‘ parmi les meilleurs.",
      "Le Coran ne fournit pas ici un récit détaillé de sa mission. Le module refuse donc de remplir ce silence avec des histoires non établies.",
        "Dhûl-Kifl n’apparaît que dans de courtes listes coraniques, aux côtés d’Ismâ‘îl et Idrîs parmi les patients puis parmi les meilleurs. Aucun récit biographique détaillé ne lui est consacré dans le Coran.",
        "Des traditions tardives ont proposé plusieurs identifications de Dhûl-Kifl et raconté des épisodes détaillés sur ses engagements ou son jugement. Aucun hadith authentique clair n’établit ces biographies ; le module préfère donc conserver cette limite plutôt que transformer une hypothèse en histoire."
      ],[{kind:"QURAN",label:"Al-Anbiyâ’ 21:85–86",surahId:21,verse:85,note:"Dhûl-Kifl est cité parmi les patients et les vertueux."},{kind:"QURAN",label:"Sâd 38:48",surahId:38,verse:48,note:"Dhûl-Kifl est mentionné parmi les meilleurs."}], ["La patience suffit à donner une orientation forte au portrait.","Le manque de détails appelle la prudence.","Une mention brève peut être plus fidèle qu’une longue légende."])]
  },
  harun: {
    id:"harun", name:"Hârûn", arabic:"هارون", epithet:"Le frère et soutien de Mûsâ", summary:"Hârûn accompagne la mission de Mûsâ, parle à Pharaon et tente de préserver le peuple durant l’épisode du veau.",
    chapters:[
      c("support",1,"Une demande accordée","Un frère comme soutien dans la mission","Fraternité · mission · soutien",[
        "Lorsque Mûsâ reçoit l’ordre d’aller vers Pharaon, il demande qu’Hârûn, son frère, devienne son assistant afin de renforcer sa force et de partager la mission.",
        "Allah répond que sa demande est accordée. Hârûn n’est donc pas un simple accompagnateur : il entre dans la mission comme prophète et soutien choisi.",
        "Le récit rappelle que demander l’aide d’une personne plus à l’aise dans certains domaines n’enlève rien à la responsabilité principale de Mûsâ.",
        "Mûsâ explique pourquoi il demande Hârûn : son frère est plus éloquent dans la parole et pourra le confirmer face à ceux qui risquent de le traiter de menteur. Allah répond qu’Il renforcera son bras par son frère et leur donnera à tous deux une autorité face à Pharaon.",
        "Hârûn n’est donc pas seulement un assistant logistique. Le Coran le nomme prophète et en fait un partenaire du rappel, de la glorification et de la confrontation avec le pouvoir tyrannique."
      ],[{kind:"QURAN",label:"Tâ-Hâ 20:29–36",surahId:20,verse:29,note:"Mûsâ demande qu’Hârûn soit son soutien et Allah accorde sa demande."},{kind:"QURAN",label:"Maryam 19:53",surahId:19,verse:53,note:"Hârûn est donné à Mûsâ comme prophète par miséricorde."}], ["La coopération peut faire partie d’une mission prophétique.","Reconnaître le besoin d’aide est une force.","La fraternité devient ici service commun de la vérité."]),
      c("pharaoh",2,"Parler ensemble à Pharaon","Une mission partagée face au tyran","Pharaon · parole · confiance",[
        "Allah ordonne à Mûsâ et Hârûn d’aller vers Pharaon et de lui parler avec douceur afin qu’il se rappelle ou qu’il craigne.",
        "Les deux frères expriment leur peur d’une réaction violente. Allah les rassure : Il est avec eux, entend et voit.",
        "Hârûn apparaît donc au cœur même de la confrontation avec Pharaon, non en marge de l’histoire de Mûsâ.",
        "Allah leur ordonne tous deux d’aller vers Pharaon, car il a dépassé les limites, mais leur commande malgré cela de lui parler avec douceur. Ils expriment leur crainte qu’il ne les agresse ; Allah les rassure en disant qu’Il est avec eux, qu’Il entend et voit.",
        "Le récit de la confrontation, des signes et des magiciens est principalement centré sur Mûsâ, mais Hârûn demeure son partenaire de mission. La Sunna authentique du Mi‘râj rapporte par ailleurs que Muhammad ﷺ rencontre Hârûn dans les cieux, confirmant sa place parmi les prophètes honorés."
      ],[{kind:"QURAN",label:"Tâ-Hâ 20:42–48",surahId:20,verse:42,note:"Mûsâ et Hârûn envoyés ensemble à Pharaon."},{kind:"SUNNA",label:"Sahih al-Bukhari 3887",note:"Le récit authentique du Mi‘râj mentionne la rencontre du Prophète ﷺ avec Hârûn dans les cieux."}], ["La douceur peut accompagner la fermeté du message.","La peur exprimée n’annule pas le courage.","La présence d’un frère peut renforcer une mission difficile."]),
      c("calf",3,"Hârûn face au veau","Préserver l’unité sans approuver l’erreur","Veau · avertissement · unité",[
        "Pendant l’absence de Mûsâ, le peuple est éprouvé par le veau façonné par as-Sâmirî. Hârûn les avertit qu’ils sont mis à l’épreuve et leur rappelle que leur Seigneur est le Tout Miséricordieux.",
        "Ils refusent de l’écouter et déclarent qu’ils resteront attachés au veau jusqu’au retour de Mûsâ. Hârûn ne possède pas la force suffisante pour imposer seul le retour à l’ordre.",
        "Au retour de Mûsâ, Hârûn explique qu’il a craint qu’une intervention provoquant une fracture violente du peuple ne soit ensuite considérée comme une désobéissance.",
        "Pendant l’absence de Mûsâ au Mont, Hârûn avertit les Enfants d’Israël que le veau n’est qu’une épreuve et que leur Seigneur est le Tout Miséricordieux. Il leur demande de le suivre et d’obéir à son ordre.",
        "Ils refusent et annoncent qu’ils continueront à adorer le veau jusqu’au retour de Mûsâ. Lorsque Mûsâ revient en colère, Hârûn lui explique qu’il a craint qu’une intervention plus dure ne divise définitivement les Enfants d’Israël. Mûsâ invoque alors le pardon pour lui-même et pour son frère."
      ],[{kind:"QURAN",label:"Tâ-Hâ 20:90–94",surahId:20,verse:90,note:"L’avertissement d’Hârûn pendant l’épisode du veau et son explication à Mûsâ."}], ["Préserver l’unité ne signifie pas approuver l’erreur.","Un responsable peut être confronté à des moyens limités.","Hârûn avertit clairement tout en évaluant les conséquences d’une confrontation."])
    ]
  },
  dawud: {
    id:"dawud", name:"Dâwûd", arabic:"داود", epithet:"Roi, prophète et serviteur reconnaissant", summary:"Dâwûd réunit courage, justice, adoration et repentir dans un récit où le pouvoir reste soumis au jugement d’Allah.",
    chapters:[
      c("jalut",1,"Face à Jâlût","Une victoire qui ouvre une responsabilité","Combat · courage · royaume",[
        "Dans le récit de Tâlût, une petite troupe de croyants affronte l’armée de Jâlût. Ils demandent à Allah de déverser sur eux la patience, d’affermir leurs pas et de les secourir.",
        "Dâwûd tue Jâlût. Allah lui accorde ensuite la royauté et la sagesse et lui enseigne ce qu’Il veut.",
        "Le récit relie donc la victoire à une responsabilité plus grande : le courage du champ de bataille devient le prélude à la justice du gouvernement.",
        "Dâwûd apparaît d’abord dans le récit de Tâlût et Jâlût. Après le passage de la rivière, un petit groupe de croyants demeure ferme et invoque Allah pour la patience, l’affermissement et la victoire. Dâwûd tue alors Jâlût.",
        "Allah lui accorde ensuite la royauté et la sagesse et lui enseigne ce qu’Il veut. Le Coran relie donc son entrée dans l’histoire à la foi d’une petite armée, puis à l’octroi d’une autorité et d’un jugement."
      ],[{kind:"QURAN",label:"Al-Baqara 2:249–251",surahId:2,verse:249,note:"La confrontation avec Jâlût, la victoire de Dâwûd et l’octroi de la royauté et de la sagesse."}], ["La victoire vient avec une responsabilité nouvelle.","Le courage est accompagné d’invocation et de patience.","Le pouvoir n’est pas présenté comme une fin en soi."]),
      c("psalms",2,"Une voix de louange","Les montagnes et les oiseaux répondent","Louange · Zabûr · création",[
        "Allah rappelle qu’Il a accordé à Dâwûd une faveur particulière et lui a donné le Zabûr.",
        "Les montagnes et les oiseaux sont décrits comme glorifiant Allah avec lui. La création entière devient ainsi le décor d’une adoration qui dépasse l’homme seul.",
        "Le portrait de Dâwûd ne se limite donc pas au roi : il est aussi un serviteur qui revient souvent vers Allah et dont la vie est marquée par la louange.",
        "Dâwûd reçoit le Zabûr, mentionné explicitement parmi les révélations accordées aux prophètes. Sa voix de louange devient si particulière que montagnes et oiseaux sont décrits comme répétant avec lui la glorification d’Allah.",
        "La Sunna authentique donne un aperçu de sa discipline spirituelle quotidienne, faisant de son rythme de prière et de jeûne une référence jusqu’à la communauté de Muhammad ﷺ. Le roi guerrier apparaît ainsi aussi comme un grand adorateur."
      ],[{kind:"QURAN",label:"Saba’ 34:10",surahId:34,verse:10,note:"Les montagnes et les oiseaux glorifient Allah avec Dâwûd."},{kind:"QURAN",label:"An-Nisâ’ 4:163",surahId:4,verse:163,note:"Le Zabûr est donné à Dâwûd."},{kind:"SUNNA",label:"Sahih al-Bukhari 3420",note:"Le Prophète ﷺ décrit le jeûne et la prière de Dâwûd comme les plus aimés d’Allah."}], ["Le pouvoir n’empêche pas l’adoration profonde.","La création rappelle constamment Allah.","La gratitude peut accompagner les responsabilités publiques."]),
      c("armor",3,"Le fer rendu malléable","Une compétence au service des hommes","Artisanat · protection · gratitude",[
        "Allah rend le fer malléable pour Dâwûd et lui enseigne à fabriquer des cottes de mailles équilibrées.",
        "Cette faveur relie le miracle à un savoir-faire concret utile à la protection des hommes.",
        "Le passage se conclut par l’ordre d’agir avec droiture, rappelant que la compétence technique reste placée sous le regard d’Allah.",
        "La fabrication des armures est liée à une instruction de mesure : Dâwûd doit proportionner correctement les mailles. Le miracle du fer assoupli ne dispense donc pas de précision technique ; le don divin appelle un savoir-faire responsable.",
        "Le Coran demande ensuite à la maison de Dâwûd de travailler avec gratitude, soulignant que peu de serviteurs sont véritablement reconnaissants. Le travail matériel entre ainsi dans une théologie de la gratitude."
      ],[{kind:"QURAN",label:"Saba’ 34:10–11",surahId:34,verse:10,note:"Le fer rendu malléable pour Dâwûd et la fabrication des armures."}], ["Le savoir-faire peut être un don à mettre au service du bien.","La technique n’est pas séparée de l’éthique.","La gratitude se manifeste aussi par l’usage juste des capacités."]),
      c("judgment",4,"Deux plaideurs dans le sanctuaire","Juger et se remettre en question","Justice · erreur · repentir",[
        "Deux hommes entrent soudainement auprès de Dâwûd et lui présentent un litige. L’un dit posséder une seule brebis tandis que l’autre en possède quatre-vingt-dix-neuf et cherche encore à prendre la sienne.",
        "Dâwûd donne un premier jugement puis comprend qu’il s’agit d’une épreuve. Il demande pardon à son Seigneur, se prosterne et revient à Lui.",
        "Allah lui rappelle ensuite sa mission de juger entre les gens avec vérité et de ne pas suivre la passion, car elle détourne du chemin d’Allah.",
        "Après son repentir, Allah lui confirme le pardon et sa proximité, puis lui rappelle directement qu’il a été établi comme khalîfa sur la terre. La justice n’est pas une activité secondaire de son règne : elle est au cœur de la responsabilité qui lui est confiée.",
        "Il lui est interdit de suivre la passion car elle détourne du chemin d’Allah. Le récit des plaideurs devient ainsi une formation du juge lui-même avant d’être une simple résolution de conflit."
      ],[{kind:"QURAN",label:"Sâd 38:21–26",surahId:38,verse:21,note:"Les deux plaideurs, le repentir de Dâwûd et l’ordre de juger avec vérité."}], ["Même un dirigeant juste reste exposé à l’erreur.","Le repentir rapide protège du durcissement du cœur.","La justice exige de résister aux passions et aux impressions immédiates."])
    ]
  },
  sulayman: {
    id:"sulayman", name:"Sulaymân", arabic:"سليمان", epithet:"Un royaume mis au service de la gratitude", summary:"Sulaymân reçoit un royaume exceptionnel et demande constamment que ses capacités deviennent gratitude et justice.",
    chapters:[
      c("inheritance",1,"Hériter de Dâwûd","Un savoir et une responsabilité","Héritage · savoir · gratitude",[
        "Sulaymân hérite de Dâwûd et remercie Allah pour les faveurs particulières qui lui sont accordées.",
        "Le Coran mentionne qu’on lui enseigne le langage des oiseaux et qu’il reçoit de nombreux dons.",
        "Il ne présente pas ces capacités comme un mérite autonome : il les décrit comme une faveur évidente de son Seigneur.",
        "Sulaymân hérite de Dâwûd et remercie Allah pour le savoir particulier qui leur a été accordé. Le Coran mentionne qu’il comprend le langage des oiseaux et que des armées de djinns, d’hommes et d’oiseaux sont organisées sous son autorité.",
        "Son héritage ne doit pas être lu comme une simple accumulation de richesse : Sulaymân se définit lui-même comme bénéficiaire d’une faveur évidente et revient constamment vers Allah."
      ],[{kind:"QURAN",label:"An-Naml 27:15–16",surahId:27,verse:15,note:"Dâwûd et Sulaymân reçoivent le savoir ; Sulaymân hérite de Dâwûd."}], ["L’héritage devient responsabilité.","Reconnaître la source d’un don protège de l’orgueil.","Le savoir mérite gratitude avant prestige."]),
      c("ants",2,"La vallée des fourmis","Le roi qui sourit devant une petite créature","Fourmis · attention · gratitude",[
        "Les armées de Sulaymân, composées d’hommes, de djinns et d’oiseaux, sont rassemblées et organisées.",
        "Lorsqu’elles arrivent dans une vallée de fourmis, une fourmi avertit les autres de rentrer dans leurs demeures pour ne pas être écrasées sans que Sulaymân et son armée s’en rendent compte.",
        "Sulaymân sourit de ses paroles et invoque Allah afin d’être inspiré à remercier pour les bienfaits reçus et à accomplir une œuvre qu’Il agrée.",
        "Lorsque ses armées arrivent à la vallée des fourmis, une fourmi avertit les autres de rentrer dans leurs demeures afin que Sulaymân et ses soldats ne les écrasent pas sans s’en rendre compte. Sulaymân comprend sa parole et sourit.",
        "Sa réaction n’est pas de célébrer son pouvoir, mais d’invoquer Allah afin d’être reconnaissant pour les bienfaits accordés à lui et à ses parents, d’accomplir des œuvres agréées et d’entrer par miséricorde parmi les serviteurs vertueux."
      ],[{kind:"QURAN",label:"An-Naml 27:17–19",surahId:27,verse:17,note:"Les armées de Sulaymân, la fourmi et son invocation de gratitude."}], ["La puissance n’empêche pas l’attention au plus petit.","La gratitude doit devenir une action agréée.","Sulaymân demande à Allah de l’aider même à remercier correctement."]),
      c("hoopoe",3,"L’absence de la huppe","Vérifier avant de juger","Huppe · information · vérification",[
        "Sulaymân inspecte les oiseaux et remarque l’absence de la huppe. Il envisage une sanction, sauf si elle apporte une excuse claire.",
        "La huppe revient avec une information sur Saba’ : une femme y gouverne un peuple prospère, mais elle et son peuple se prosternent devant le soleil au lieu d’Allah.",
        "Sulaymân ne prend pas immédiatement cette information pour acquise. Il annonce qu’il vérifiera si la huppe dit vrai ou si elle ment.",
        "Lors de l’inspection des oiseaux, Sulaymân remarque l’absence de la huppe et annonce qu’elle devra présenter une excuse claire. Elle revient avec une information qu’il ne connaissait pas : un royaume dirigé par une femme à Saba’, doté d’un grand trône, dont le peuple adore le soleil.",
        "Sulaymân ne prend pas immédiatement l’information pour certitude absolue. Il annonce qu’il vérifiera si la huppe dit vrai et lui remet une lettre invitant la reine et son peuple à ne pas s’élever contre lui et à venir soumis à Allah."
      ],[{kind:"QURAN",label:"An-Naml 27:20–27",surahId:27,verse:20,note:"L’absence de la huppe, son rapport sur Saba’ et la vérification de Sulaymân."}], ["Une information importante doit être vérifiée.","L’ordre politique de Sulaymân inclut responsabilité et discipline.","Le souci du tawhîd dépasse les frontières de son royaume."]),
      c("queen",4,"La reine de Saba’","Diplomatie, signes et reconnaissance","Saba’ · lettre · diplomatie",[
        "Sulaymân envoie une lettre à la reine de Saba’ l’invitant à ne pas s’élever et à venir en soumission à Allah.",
        "La reine consulte ses notables, teste Sulaymân par un présent puis se rend auprès de lui. Sulaymân refuse que la richesse offerte remplace le message.",
        "Devant les signes qu’elle observe, elle reconnaît finalement s’être fait du tort à elle-même et se soumet avec Sulaymân à Allah, Seigneur des mondes.",
        "Avant d’entrer dans le palais, la reine est confrontée à une autre épreuve visuelle : un sol de cristal lui paraît être une étendue d’eau. Sulaymân lui explique la réalité de ce qu’elle voit, et elle conclut en reconnaissant s’être fait du tort à elle-même.",
        "Le récit n’a donc pas pour climax la soumission politique d’une reine à un roi, mais sa déclaration de soumission avec Sulaymân à Allah, Seigneur des mondes."
      ],[{kind:"QURAN",label:"An-Naml 27:28–44",surahId:27,verse:28,note:"La lettre à la reine de Saba’, sa visite et sa soumission à Allah."}], ["La diplomatie peut servir un appel clair.","La richesse ne doit pas acheter la vérité.","Reconnaître son erreur reste possible même au sommet du pouvoir."]),
      c("wind",5,"Le vent et les djinns","Des capacités extraordinaires sous contrôle","Vent · djinns · travail",[
        "Allah soumet à Sulaymân le vent et des djinns qui accomplissent pour lui divers travaux, notamment des constructions et des objets de grande taille.",
        "Le Coran présente ces capacités comme des dons d’Allah, avec des limites précises et un ordre.",
        "Sulaymân demande lui-même un royaume particulier après avoir sollicité le pardon de son Seigneur, montrant que le don exceptionnel reste précédé du retour vers Allah.",
        "Allah soumet à Sulaymân le vent qui parcourt de grandes distances sur son ordre ainsi que des djinns qui construisent, plongent et réalisent des ouvrages. Le Coran cite des sanctuaires, statues, bassins et chaudrons immenses parmi les productions réalisées sous son règne.",
        "La Sunna authentique rapporte aussi un épisode où Sulaymân exprime l’intention d’avoir de nombreux fils combattant pour la cause d’Allah mais omet de dire « si Allah veut ». Un seul enfant incomplet naît ; le Prophète ﷺ enseigne que s’il avait prononcé cette formule, le résultat aurait été autre par la permission d’Allah."
      ],[{kind:"QURAN",label:"Saba’ 34:12–13",surahId:34,verse:12,note:"Le vent et les djinns soumis à Sulaymân."},{kind:"QURAN",label:"Sâd 38:35–40",surahId:38,verse:35,note:"La demande de Sulaymân et le royaume qui lui est accordé."},{kind:"SUNNA",label:"Sahih al-Bukhari 3424",note:"Hadith authentique sur Sulaymân, son intention concernant ses épouses et l’importance de dire « si Allah veut »."}], ["Les dons extraordinaires restent sous l’autorité d’Allah.","Le pouvoir doit être précédé et accompagné de repentance.","Une capacité n’est bonne que par son usage."]),
      c("death",6,"Une mort que les djinns ignorent","La limite de la connaissance invisible","Mort · bâton · invisible",[
        "Lorsque Sulaymân meurt, les djinns continuent leur travail sans comprendre immédiatement qu’il est décédé.",
        "Une créature de la terre ronge son bâton ; lorsque son corps tombe, la réalité devient évidente.",
        "Le Coran conclut que si les djinns avaient réellement connu l’invisible, ils ne seraient pas restés dans ce travail humiliant.",
        "Sulaymân meurt alors qu’il s’appuie sur son bâton. Les djinns continuent de travailler, croyant qu’il est encore vivant, jusqu’à ce qu’une créature de la terre ronge le bâton et que son corps tombe.",
        "Le Coran donne lui-même la conclusion : si les djinns connaissaient l’invisible, ils ne seraient pas restés dans ce travail humiliant. La mort de Sulaymân devient ainsi une réfutation directe de la prétention à la connaissance autonome du ghayb."
      ],[{kind:"QURAN",label:"Saba’ 34:14",surahId:34,verse:14,note:"La mort de Sulaymân et la démonstration que les djinns ne connaissent pas l’invisible."}], ["La connaissance de l’invisible appartient à Allah.","Même un royaume exceptionnel se termine par la mort.","Le récit corrige les exagérations sur les capacités des créatures."])
    ]
  },
  ilyas: {
    id:"ilyas", name:"Ilyâs", arabic:"إلياس", epithet:"Appeler à délaisser Ba‘l", summary:"Le Coran rapporte brièvement l’appel d’Ilyâs à un peuple attaché au culte de Ba‘l.",
    chapters:[
      c("baal",1,"Pourquoi invoquer Ba‘l ?","Un appel direct au meilleur des créateurs","Ba‘l · tawhîd · appel",[
        "Ilyâs demande à son peuple s’ils ne craignent pas Allah et s’ils invoquent Ba‘l tout en délaissant le meilleur des créateurs.",
        "Il leur rappelle qu’Allah est leur Seigneur et le Seigneur de leurs premiers ancêtres.",
        "Le cœur du récit explicite tient donc dans cette confrontation entre une divinité locale et la seigneurie universelle d’Allah.",
        "Ilyâs est envoyé à un peuple qu’il interpelle sur son culte de Ba‘l : vont-ils invoquer cette divinité et délaisser le meilleur des créateurs, Allah, leur Seigneur et le Seigneur de leurs premiers ancêtres ?",
        "Le Coran ne donne pas le lieu exact de sa mission, sa généalogie détaillée ni les circonstances de sa mort. Les histoires plus longues parfois racontées à son sujet relèvent souvent de traditions exégétiques non authentifiées et ne sont pas transformées ici en biographie certaine."
      ],[{kind:"QURAN",label:"As-Sâffât 37:123–126",surahId:37,verse:123,note:"L’appel d’Ilyâs contre le culte de Ba‘l."}], ["Le tawhîd dépasse les traditions locales.","Le rappel renvoie au Créateur de toutes les générations.","Un récit bref peut contenir un argument très clair."]),
      c("legacy",2,"Un salut parmi les générations","La récompense du bien","Refus · élus · mémoire",[
        "Le peuple traite Ilyâs de menteur, à l’exception des serviteurs sincères d’Allah.",
        "Le Coran annonce qu’Ilyâs laisse une bonne mention parmi les générations suivantes et lui adresse un salut.",
        "La scène conclut que c’est ainsi qu’Allah récompense les bienfaisants et qu’Ilyâs faisait partie de Ses serviteurs croyants.",
        "La formule de salut laissée à Ilyâs est suivie du même principe que pour les autres prophètes : Allah récompense ainsi les bienfaisants, et Ilyâs faisait partie de Ses serviteurs croyants.",
        "Les biographies très détaillées d’Ilyâs, ses voyages et ses relations supposées avec d’autres prophètes ne reposent pas toutes sur des chaînes authentiques. Le texte coranique certain demeure ici volontairement bref."
      ],[{kind:"QURAN",label:"As-Sâffât 37:127–132",surahId:37,verse:127,note:"Le rejet d’Ilyâs, le salut sur lui et sa mention parmi les croyants."}], ["La popularité immédiate n’est pas la mesure de la vérité.","Allah préserve la mémoire des serviteurs sincères.","La foi est la vraie qualification du prophète."])
    ]
  },
  "al-yasa": {
    id:"al-yasa", name:"Al-Yasa‘", arabic:"اليسع", epithet:"Mentionné parmi les meilleurs", summary:"Al-Yasa‘ est nommé dans le Coran sans récit détaillé ; l’application respecte cette limite.",
    chapters:[c("mention",1,"Parmi les meilleurs","Une mention sans biographie inventée","Mention · vertu · sobriété",[
      "Al-Yasa‘ est nommé dans le Coran avec Ismâ‘îl et Dhûl-Kifl parmi les meilleurs.",
      "Il est également mentionné dans une liste de prophètes guidés par Allah dans la sourate Al-An‘âm.",
      "Aucun récit détaillé de sa mission n’est donné dans ces passages. OUMMAH ne transforme donc pas des traditions ultérieures en certitudes coraniques.",
        "Al-Yasa‘ est cité parmi Ismâ‘îl, Yûnus et Lût dans la liste de ceux qu’Allah a favorisés au-dessus des mondes, puis avec Ismâ‘îl et Dhûl-Kifl parmi les meilleurs.",
        "Le Coran ne raconte aucun épisode distinct de sa mission et aucun hadith authentique n’établit une biographie détaillée. Les liens parfois construits avec Ilyâs ou des récits bibliques peuvent être étudiés en histoire comparée, mais ne sont pas présentés comme Sunna prophétique."
      ],[{kind:"QURAN",label:"Sâd 38:48",surahId:38,verse:48,note:"Al-Yasa‘ est mentionné parmi les meilleurs."},{kind:"QURAN",label:"Al-An‘âm 6:86",surahId:6,verse:86,note:"Al-Yasa‘ est cité parmi les prophètes guidés."}], ["La prudence est nécessaire lorsque les sources sont brèves.","Être compté parmi les meilleurs suffit à établir son mérite.","Ne pas inventer est une forme de respect du récit."])]
  },
  yunus: {
    id:"yunus", name:"Yûnus", arabic:"يونس", epithet:"L’invocation dans les ténèbres", summary:"Yûnus quitte son peuple, est englouti par le poisson puis revient vers Allah dans une invocation devenue un modèle de détresse et de repentance.",
    chapters:[
      c("departure",1,"Partir en colère","Une décision qui devient épreuve","Départ · colère · bateau",[
        "Le Coran mentionne Dhû-n-Nûn, Yûnus, lorsqu’il part en colère et pense qu’Allah ne le mettra pas en difficulté.",
        "Ailleurs, il est décrit montant dans un navire chargé. Un tirage au sort a lieu et il se retrouve parmi ceux qui sont désignés.",
        "Le récit reste sobre sur les détails de son départ, mais établit que son choix conduit à une épreuve qui le ramène vers son Seigneur.",
        "La sourate As-Sâffât raconte que Yûnus s’enfuit vers le navire chargé puis participe au tirage au sort. Le terme utilisé montre qu’il se retrouve parmi les perdants du tirage avant d’être avalé par le poisson.",
        "Le Coran ne dit pas qu’il renie sa prophétie ni qu’il cesse de croire. Son erreur est racontée comme celle d’un serviteur qui agit avant l’autorisation divine et qui reviendra immédiatement vers son Seigneur dans l’épreuve."
      ],[{kind:"QURAN",label:"Al-Anbiyâ’ 21:87",surahId:21,verse:87,note:"Yûnus part en colère puis invoque Allah dans les ténèbres."},{kind:"QURAN",label:"As-Sâffât 37:139–141",surahId:37,verse:139,note:"Yûnus embarque sur un navire chargé et participe au tirage au sort."}], ["Une décision prise sous la colère peut avoir des conséquences.","Le prophète lui-même revient vers Allah lorsqu’il est repris.","Le Coran ne demande pas d’inventer les détails absents."]),
      c("fish",2,"Dans les ténèbres","Une invocation sans justification","Poisson · invocation · repentir",[
        "Le poisson engloutit Yûnus alors qu’il se blâme lui-même. Dans les ténèbres, il invoque : « Pas de [véritable] divinité à part Toi ! Gloire à Toi ! J’ai été vraiment du nombre des injustes ! »",
        "Cette invocation réunit le tawhîd, la glorification d’Allah et la reconnaissance de sa propre faute. Elle ne contient ni accusation contre le destin ni justification.",
        "Allah répond à son invocation et le délivre de l’angoisse. Le verset ajoute : c’est ainsi qu’Allah sauve les croyants.",
        "Son invocation est devenue l’une des plus célèbres du Coran parce qu’elle rassemble tawhîd, glorification et reconnaissance de sa propre faute. Il ne demande même pas explicitement « fais-moi sortir » ; il se replace devant Allah avec vérité.",
        "La réponse divine dépasse Yûnus : après avoir dit qu’Allah le sauva de l’angoisse, le verset ajoute « c’est ainsi que Nous sauvons les croyants ». L’histoire particulière devient une promesse générale de secours pour ceux qui reviennent sincèrement."
      ],[{kind:"QURAN",label:"Al-Anbiyâ’ 21:87–88",surahId:21,verse:87,note:"L’invocation de Yûnus dans les ténèbres et sa délivrance."}], ["La détresse peut devenir un lieu de tawhîd très pur.","Reconnaître sa faute accompagne le retour.","L’invocation de Yûnus est présentée comme un modèle pour les croyants."]),
      c("return",3,"Rejeté sur la rive puis renvoyé","Une communauté qui croit avant le châtiment","Guérison · retour · peuple",[
        "Allah fait rejeter Yûnus sur une terre nue alors qu’il est malade et fait pousser au-dessus de lui une plante pour le protéger.",
        "Il est ensuite envoyé vers cent mille personnes ou davantage. Elles croient, et Allah leur accorde la jouissance de la vie pour un temps.",
        "La sourate Yûnus souligne le caractère particulier de son peuple : leur foi leur profite lorsqu’ils croient avant que le châtiment ne les saisisse définitivement.",
        "Le peuple de Yûnus occupe une place unique : le Coran demande pourquoi aucune cité n’a cru assez tôt pour que sa foi lui profite, « sauf le peuple de Yûnus ». Lorsqu’ils croient, le châtiment d’humiliation est écarté et ils jouissent de la vie pour un temps.",
        "La Sunna protège aussi l’honneur de Yûnus : le Prophète ﷺ interdit des formulations de supériorité personnelle dénigrant Yûnus ibn Mattâ. L’épisode du poisson ne devient jamais un motif de rabaisser un messager d’Allah."
      ],[{kind:"QURAN",label:"As-Sâffât 37:145–148",surahId:37,verse:145,note:"Yûnus rejeté sur la rive, la plante et le retour vers son peuple."},{kind:"QURAN",label:"Yûnus 10:98",surahId:10,verse:98,note:"Le peuple de Yûnus croit et le châtiment humiliant est écarté."}], ["Après la faute peut venir une mission renouvelée.","Une communauté peut encore changer avant qu’il ne soit trop tard.","La miséricorde d’Allah apparaît dans la guérison comme dans le pardon collectif."])
    ]
  },
  zakariya: {
    id:"zakariya", name:"Zakariyyâ", arabic:"زكريا", epithet:"Une invocation murmurée", summary:"Zakariyyâ demande un héritier pour porter la foi, malgré l’âge et les causes humaines qui semblent épuisées.",
    chapters:[
      c("maryam",1,"Auprès de Maryam","Un signe qui réveille l’espérance","Sanctuaire · provision · invocation",[
        "Zakariyyâ prend en charge Maryam. Chaque fois qu’il entre auprès d’elle dans le sanctuaire, il trouve une provision et lui demande d’où elle vient.",
        "Elle répond qu’elle vient d’Allah, qui accorde Ses dons sans compter à qui Il veut.",
        "C’est alors que Zakariyyâ invoque son Seigneur et demande une bonne descendance, comme si le signe observé auprès de Maryam ravivait son espérance.",
        "Zakariyyâ est le gardien de Maryam dans le sanctuaire. Chaque fois qu’il entre auprès d’elle, il trouve une provision et lui demande d’où elle vient. Elle répond qu’elle vient d’Allah, qui donne sans compter à qui Il veut.",
        "La Sunna authentique fournit un détail concret sur sa vie quotidienne : le Prophète Muhammad ﷺ a dit que Zakariyyâ était charpentier. Ce métier n’est pas un élément central de sa mission, mais il rappelle qu’un prophète peut vivre d’un travail manuel tout en portant une fonction spirituelle immense."
      ],[{kind:"QURAN",label:"Âl ‘Imrân 3:37–38",surahId:3,verse:37,note:"Zakariyyâ auprès de Maryam et son invocation pour une descendance."},{kind:"SUNNA",label:"Sahih Muslim 2379",note:"Le Prophète ﷺ a dit que Zakariyyâ était charpentier."}], ["Voir un bienfait peut renouveler l’espérance personnelle.","Zakariyyâ demande à Allah malgré les causes difficiles.","La provision d’Allah ne se limite pas aux calculs humains."]),
      c("secret",2,"Une invocation secrète","Dire sa faiblesse sans perdre confiance","Vieillesse · invocation · héritage",[
        "Dans la sourate Maryam, Zakariyyâ appelle son Seigneur d’un appel discret. Il mentionne la faiblesse de ses os et ses cheveux blanchis par l’âge.",
        "Il ne présente pas ces limites comme une raison d’abandonner l’invocation. Au contraire, il rappelle qu’il n’a jamais été malheureux dans ses invocations à Allah.",
        "Sa demande concerne un héritier qui portera la continuité de la foi et sera agréé par Allah.",
        "Zakariyyâ craint ce qui adviendra après lui et demande un héritier qui recevra l’héritage spirituel de la maison de Ya‘qûb. Son invocation est secrète, humble et construite autour de sa faiblesse physique sans jamais faire de cette faiblesse une limite à la puissance d’Allah.",
        "Il demande que ce fils soit agréé. La demande n’est donc pas seulement celle d’un père désireux de descendance : elle concerne la continuité d’une adoration et d’une mission."
      ],[{kind:"QURAN",label:"Maryam 19:2–6",surahId:19,verse:2,note:"L’invocation discrète de Zakariyyâ malgré son grand âge."}], ["Nommer sa faiblesse n’est pas désespérer.","L’invocation peut être intime et discrète.","La transmission de la foi motive la demande d’un enfant."]),
      c("yahya",3,"La bonne annonce de Yahyâ","Un nom donné par Allah","Annonce · miracle · joie",[
        "Les anges appellent Zakariyyâ alors qu’il prie dans le sanctuaire et lui annoncent Yahyâ, confirmant une parole d’Allah, noble, chaste et prophète parmi les vertueux.",
        "Zakariyyâ s’étonne compte tenu de son âge et de la stérilité de son épouse. La réponse lui rappelle qu’Allah fait ce qu’Il veut.",
        "La bonne annonce ne nie donc pas l’étonnement humain ; elle le replace simplement sous la puissance du Créateur.",
        "La réponse arrive alors qu’il se tient en prière dans le sanctuaire. Les anges annoncent Yahyâ, confirmant une parole d’Allah, noble, chaste et prophète parmi les vertueux.",
        "Zakariyyâ demande comment une naissance peut avoir lieu alors qu’il a atteint un âge extrême et que son épouse est stérile. La réponse ne nie pas les causes : elle rappelle simplement qu’Allah a déjà créé Zakariyyâ lui-même alors qu’il n’était rien."
      ],[{kind:"QURAN",label:"Âl ‘Imrân 3:39–40",surahId:3,verse:39,note:"Les anges annoncent Yahyâ à Zakariyyâ."}], ["L’étonnement n’est pas le refus de croire.","Allah crée des issues au-delà des causes habituelles.","La bonne annonce associe l’enfant à une mission spirituelle."]),
      c("sign",4,"Trois jours de silence","Un signe au milieu de la joie","Signe · dhikr · gratitude",[
        "Zakariyyâ demande un signe. Il lui est annoncé qu’il ne parlera pas aux gens pendant trois jours, tout en étant sain.",
        "Il reçoit l’ordre de multiplier le souvenir d’Allah et de Le glorifier matin et soir.",
        "La réponse à une grande invocation conduit ainsi immédiatement à davantage de dhikr et de gratitude.",
        "Le signe accordé est qu’il ne pourra pas parler aux gens durant trois nuits ou trois jours tout en étant sain. Il sort du sanctuaire et communique alors par gestes avec son peuple afin qu’ils glorifient Allah matin et soir.",
        "Les récits populaires sur la manière précise dont Zakariyyâ serait mort ne reposent pas sur un hadith authentique unanimement établi. Le module ne présente donc pas comme biographie certaine l’histoire très répandue de sa poursuite et de sa mort dans un arbre."
      ],[{kind:"QURAN",label:"Âl ‘Imrân 3:41",surahId:3,verse:41,note:"Le signe donné à Zakariyyâ et l’ordre de multiplier le dhikr."}], ["Un bienfait appelle davantage de souvenir d’Allah.","Le signe ne devient pas un spectacle inutile.","La gratitude prolonge l’invocation exaucée."])
    ]
  },
  yahya: {
    id:"yahya", name:"Yahyâ", arabic:"يحيى", epithet:"Sagesse et pureté dès l’enfance", summary:"Yahyâ est annoncé avant sa naissance et décrit par le Coran avec sagesse, pureté et bonté envers ses parents.",
    chapters:[
      c("name",1,"Un nom jamais donné auparavant","Une naissance annoncée","Annonce · nom · miracle",[
        "Allah annonce à Zakariyyâ un fils nommé Yahyâ et précise qu’Il n’avait donné auparavant ce nom à personne.",
        "Cette naissance survient malgré le grand âge de Zakariyyâ et la stérilité de son épouse.",
        "Le récit fait de Yahyâ un don directement associé à une invocation, à une promesse et à la puissance d’Allah.",
        "Yahyâ est annoncé par son nom avant sa naissance. Le Coran souligne la singularité de ce nom et relie directement sa venue à l’invocation de Zakariyyâ et à la miséricorde d’Allah envers une famille où les causes naturelles semblaient épuisées.",
        "La naissance miraculeuse ne signifie pas absence de filiation humaine : il est bien le fils de Zakariyyâ et de son épouse, mais sa conception après la vieillesse et la stérilité devient un signe de la puissance divine."
      ],[{kind:"QURAN",label:"Maryam 19:7–9",surahId:19,verse:7,note:"L’annonce de Yahyâ et l’étonnement de Zakariyyâ."}], ["Allah peut créer une issue là où les causes semblent fermées.","Le nom de Yahyâ est lui-même présenté comme un signe.","La naissance est liée à une mission, pas seulement à une joie familiale."]),
      c("wisdom",2,"Prends le Livre avec force","Une maturité spirituelle précoce","Livre · sagesse · pureté",[
        "Allah adresse à Yahyâ l’ordre de prendre le Livre avec force et lui accorde la sagesse alors qu’il est encore enfant.",
        "Le Coran lui attribue aussi tendresse, pureté et piété.",
        "Ces qualités montrent une force qui n’est pas dureté : la fermeté envers la révélation coexiste avec la compassion et la pureté intérieure.",
        "L’ordre « Ô Jean (Yahyâ) ! Tiens fermement au Livre ! » indique une relation précoce à la révélation. Allah lui accorde jugement dès l’enfance, ainsi qu’une tendresse venant de Lui, pureté et piété.",
        "Le Coran ne raconte pas une série de miracles spectaculaires autour de Yahyâ. Son miracle biographique tient surtout dans ce portrait spirituel concentré : science, pureté, crainte d’Allah et bonté."
      ],[{kind:"QURAN",label:"Maryam 19:12–13",surahId:19,verse:12,note:"Yahyâ reçoit la sagesse, la tendresse et la pureté."}], ["La fermeté dans la foi peut coexister avec la douceur.","La maturité spirituelle n’est pas seulement une question d’âge.","La pureté intérieure accompagne la connaissance."]),
      c("parents",3,"Bon envers ses parents","Une vie sans arrogance","Parents · humilité · paix",[
        "Yahyâ est décrit comme bon envers ses parents, ni violent ni désobéissant.",
        "Le Coran lui adresse une paix le jour de sa naissance, le jour de sa mort et le jour où il sera ressuscité vivant.",
        "Son portrait est donc concentré sur des qualités de relation, d’humilité et de fidélité, sans récit biographique détaillé supplémentaire.",
        "Yahyâ est décrit comme bienfaisant envers ses parents, ni tyrannique ni désobéissant. Dans le vocabulaire du Coran, cette qualité familiale fait partie intégrante de sa sainteté et empêche de réduire la piété à une relation privée avec Dieu.",
        "Des récits très répandus racontent les circonstances précises de son martyre et identifient les personnes impliquées. Ils sont présents dans certaines chroniques et traditions, mais aucun hadith sahih incontestable ne permet de raconter ces détails comme une biographie certaine ; OUMMAH conserve donc la formulation coranique sur sa mort sans romancer sa fin."
      ],[{kind:"QURAN",label:"Maryam 19:14–15",surahId:19,verse:14,note:"La bonté de Yahyâ envers ses parents et la paix sur les grandes étapes de son existence."}], ["La sainteté ne se sépare pas du comportement envers les parents.","L’absence d’arrogance est une qualité centrale.","La paix d’Allah accompagne la vie, la mort et la résurrection."])
    ]
  },
  isa: {
    id:"isa", name:"‘Îsâ", arabic:"عيسى", epithet:"Messie et serviteur d’Allah", summary:"De l’annonce à Maryam aux signes accordés à ‘Îsâ et à la clarification coranique de sa mission.",
    chapters:[
      c("announcement",1,"Une parole annoncée à Maryam","La naissance sans père","Maryam · annonce · miracle",[
        "Les anges annoncent à Maryam une parole venant d’Allah : le Messie ‘Îsâ fils de Maryam, honoré ici-bas et dans l’au-delà et parmi les rapprochés.",
        "Maryam demande comment elle pourrait avoir un enfant alors qu’aucun homme ne l’a touchée. La réponse rappelle qu’Allah crée ce qu’Il veut : lorsqu’Il décide une chose, Il lui dit seulement d’être.",
        "La naissance miraculeuse est ainsi présentée comme un signe de la puissance créatrice d’Allah, non comme une preuve de divinité de l’enfant.",
        "La Sunna authentique rattache aussi la naissance de ‘Îsâ à la protection divine : le Prophète Muhammad ﷺ enseigne que tout nouveau-né est touché par Satan au moment de sa naissance sauf Maryam et son fils, en lien avec l’invocation de la mère de Maryam pour leur protection.",
        "Le Coran compare ailleurs la création de ‘Îsâ à celle d’Âdam : Allah crée sans être limité par les causes habituelles. Cette comparaison ferme la porte à l’idée que l’absence de père impliquerait une nature divine."
      ],[{kind:"QURAN",label:"Âl ‘Imrân 3:45–47",surahId:3,verse:45,note:"L’annonce de ‘Îsâ à Maryam et la naissance sans père."}], ["Le miracle renvoie à la puissance d’Allah.","Le Coran honore ‘Îsâ sans le diviniser.","La création d’Allah ne dépend pas des causes ordinaires."]),
      c("birth",2,"Sous le palmier","La solitude, la douleur et le secours","Naissance · solitude · provision",[
        "Maryam se retire avec son enfant à venir dans un lieu éloigné. Les douleurs de l’accouchement la conduisent au tronc d’un palmier et elle exprime une détresse profonde.",
        "Elle est rassurée : une source est placée à ses pieds et elle reçoit l’ordre de secouer le tronc du palmier afin que des dattes fraîches tombent vers elle.",
        "Le secours divin est donc accompagné d’un geste demandé à Maryam, même dans un moment où ses forces sont limitées.",
        "Après la naissance, Maryam reçoit aussi l’ordre de manger, boire et se réjouir, puis de déclarer un jeûne de parole si elle rencontre quelqu’un. Le récit prépare ainsi la scène suivante : elle reviendra auprès de son peuple sans se défendre elle-même par un long discours.",
        "Le lieu exact de la naissance de ‘Îsâ n’est pas nommé de manière à permettre une certitude historique absolue dans le texte coranique. OUMMAH ne transforme donc pas une identification traditionnelle en donnée révélée."
      ],[{kind:"QURAN",label:"Maryam 19:22–26",surahId:19,verse:22,note:"La naissance de ‘Îsâ, le palmier, la source et le réconfort de Maryam."}], ["Le secours d’Allah peut être accompagné d’un effort concret.","La détresse n’annule pas la foi.","Allah soutient Maryam dans un moment de grande vulnérabilité."]),
      c("cradle",3,"La parole au berceau","Je suis le serviteur d’Allah","Berceau · servitude · prophétie",[
        "Maryam revient auprès de son peuple avec l’enfant. Ils l’accusent et rappellent la réputation honorable de sa famille.",
        "Elle désigne alors le nourrisson. ‘Îsâ parle et commence par dire : « Je suis vraiment le serviteur d’Allah ». Il annonce qu’Allah lui donnera le Livre et fera de lui un prophète.",
        "Il mentionne aussi la prière, la zakât, la bonté envers sa mère et la paix sur lui aux étapes décisives de son existence.",
        "La parole de ‘Îsâ au berceau constitue à la fois une défense de Maryam et une définition de son identité : serviteur d’Allah, destinataire du Livre, prophète, béni où qu’il soit, chargé de la prière et de la zakât et bienfaisant envers sa mère.",
        "Cette séquence est fondamentale pour toute biographie islamique de ‘Îsâ : avant les miracles de sa mission publique, le Coran place sur ses lèvres la servitude envers Allah."
      ],[{kind:"QURAN",label:"Maryam 19:27–33",surahId:19,verse:27,note:"Le retour de Maryam et la parole de ‘Îsâ au berceau."}], ["La première parole rapportée de ‘Îsâ affirme sa servitude envers Allah.","Le miracle défend l’honneur de Maryam.","La prophétie est associée au culte et à la bonté envers la mère."]),
      c("signs",4,"Des signes par la permission d’Allah","Guérir sans revendiquer la divinité","Miracles · permission · message",[
        "‘Îsâ est envoyé aux Enfants d’Israël avec des signes. Il façonne pour eux, à partir d’argile, une forme d’oiseau qui devient vivant par la permission d’Allah.",
        "Il guérit l’aveugle-né et le lépreux et fait revivre les morts par la permission d’Allah. La formule est répétée afin de rattacher chaque miracle à son véritable Auteur.",
        "Il confirme aussi la Torah antérieure et annonce certaines permissions nouvelles, tout en appelant son peuple à craindre Allah et à lui obéir.",
        "Les signes ne sont jamais détachés de la formule « par la permission d’Allah ». Le Coran répète cette dépendance pour la création de l’oiseau à partir d’argile, la guérison de l’aveugle-né et du lépreux, la résurrection des morts et la connaissance de certaines choses cachées dans les maisons.",
        "‘Îsâ confirme la Torah venue avant lui et rend licite une partie de ce qui avait été interdit aux Enfants d’Israël. Il les appelle donc à craindre Allah, à lui obéir et à adorer Allah comme son Seigneur et le leur."
      ],[{kind:"QURAN",label:"Âl ‘Imrân 3:49–51",surahId:3,verse:49,note:"Les signes accordés à ‘Îsâ, répétés comme accomplis par la permission d’Allah."}], ["Les miracles ne rendent pas le prophète divin.","La répétition de « par la permission d’Allah » protège le tawhîd.","La mission associe signes et appel à l’obéissance."]),
      c("disciples",5,"Qui sont mes soutiens vers Allah ?","Les disciples répondent à l’appel","Disciples · foi · témoignage",[
        "Lorsque ‘Îsâ ressent le refus d’une partie de son peuple, il demande qui seront ses soutiens dans la voie d’Allah.",
        "Les disciples répondent qu’ils sont les soutiens d’Allah, qu’ils croient en Lui et demandent que leur soumission soit attestée.",
        "Le Coran distingue ainsi clairement le messager, ses disciples croyants et ceux qui complotent contre lui.",
        "Les disciples ne sont pas présentés comme des apôtres divinisés mais comme des croyants répondant à l’appel du messager. Ils demandent à être inscrits parmi les témoins et affirment leur foi en Allah et en ce qui a été révélé.",
        "Allah révèle ensuite aux disciples de croire en Lui et en Son messager ; ils répondent qu’ils croient et demandent que leur soumission soit attestée. Leur soutien s’inscrit donc entièrement dans le tawhîd."
      ],[{kind:"QURAN",label:"Âl ‘Imrân 3:52–54",surahId:3,verse:52,note:"L’appel de ‘Îsâ aux disciples et leur réponse."}], ["Une mission prophétique crée aussi une communauté de soutien.","Les disciples orientent leur soutien vers Allah.","La foi demande parfois une prise de position claire."]),
      c("table",6,"La table demandée","Un signe qui augmente la responsabilité","Table · demande · avertissement",[
        "Les disciples demandent à ‘Îsâ si son Seigneur peut faire descendre sur eux une table servie du ciel. ‘Îsâ leur demande d’abord de craindre Allah s’ils sont croyants.",
        "Ils expliquent vouloir en manger, rassurer leurs cœurs, savoir qu’il leur a dit vrai et être témoins du signe.",
        "‘Îsâ invoque Allah, qui annonce qu’Il fera descendre la table mais avertit qu’après un signe aussi clair, le rejet aurait une gravité particulière.",
        "La demande de la table est formulée avec une intention multiple : manger, rassurer les cœurs, vérifier la véracité de la promesse et devenir témoins. ‘Îsâ transforme la requête en invocation, demandant que la table soit une fête pour les premiers et les derniers d’entre eux et un signe venant d’Allah.",
        "Allah accepte mais lie le signe à une responsabilité plus grave : celui qui mécroira ensuite subira un châtiment particulier. Le miracle n’est jamais présenté comme divertissement ; plus la preuve est claire, plus la responsabilité augmente."
      ],[{kind:"QURAN",label:"Al-Mâ’ida 5:112–115",surahId:5,verse:112,note:"La demande de la table servie et l’avertissement qui l’accompagne."}], ["Demander un signe augmente aussi la responsabilité.","‘Îsâ oriente la demande vers Allah.","La certitude recherchée doit conduire à la gratitude."]),
      c("raising",7,"Ils ne l’ont ni tué ni crucifié","La clarification coranique sur la fin de sa mission terrestre","Complot · élévation · vérité",[
        "Le Coran rejette l’affirmation selon laquelle les opposants auraient tué ou crucifié ‘Îsâ avec certitude. Il affirme qu’ils ne l’ont ni tué ni crucifié, mais que la chose leur a été rendue confuse.",
        "Allah dit avoir élevé ‘Îsâ vers Lui. La sourate Âl ‘Imrân annonce également qu’Allah le purifiera de ceux qui ont mécru.",
        "Le Coran insiste enfin sur le fait que ‘Îsâ n’a jamais appelé les hommes à l’adorer lui et sa mère en dehors d’Allah : son message demeure celui de la servitude envers le Seigneur unique.",
        "La Sunna authentique complète ici le Coran en annonçant le retour futur de ‘Îsâ fils de Maryam. Sahih Muslim rapporte qu’il descendra comme juge équitable et, dans le long hadith du Dajjâl, situe sa descente près du minaret blanc à l’est de Damas.",
        "Cette descente future ne signifie pas une nouvelle prophétie ni une nouvelle religion : il revient en serviteur et messager d’Allah, dans la continuité du tawhîd. Les récits faibles ou légendaires sur sa vie après l’élévation ne sont pas nécessaires à cette croyance établie."
      ],[{kind:"QURAN",label:"An-Nisâ’ 4:157–158",surahId:4,verse:157,note:"Le Coran nie la mise à mort et la crucifixion certaine de ‘Îsâ et affirme son élévation par Allah."},{kind:"QURAN",label:"Al-Mâ’ida 5:116–118",surahId:5,verse:116,note:"‘Îsâ se désavoue de toute divinisation et rappelle son appel à adorer Allah seul."},{kind:"SUNNA",label:"Sahih Muslim 155a",note:"Hadith authentique annonçant la descente future de ‘Îsâ fils de Maryam comme juge équitable."},{kind:"SUNNA",label:"Sahih Muslim 2937a",note:"Le long hadith du Dajjâl décrit la descente de ‘Îsâ près du minaret blanc à l’est de Damas."}], ["Le Coran distingue l’honneur de ‘Îsâ de toute divinisation.","Sa mission reste ancrée dans le tawhîd.","La fin du récit terrestre est définie par la révélation, pas par la spéculation."])
    ]
  },
  muhammad: {
    id:"muhammad", name:"Muhammad ﷺ", arabic:"محمد", epithet:"Le dernier des prophètes", summary:"De La Mecque à Médine : une sîra guidée par le Coran et la Sunna authentique, de la première révélation à l’achèvement de la mission.",
    chapters:[
      c("before-revelation",1,"Avant la Révélation","Une vie connue des siens avant l’appel","La Mecque · confiance · préparation",[
        "Muhammad ibn ‘Abd Allah ﷺ naît à La Mecque dans la tribu de Quraysh. Le Coran ne raconte pas son enfance comme une biographie continue, mais rappelle qu’Allah l’a trouvé orphelin et lui a donné refuge, puis dans le besoin et l’a enrichi. Ces versets replacent son parcours personnel sous la protection divine sans donner de place aux légendes ajoutées plus tard.",
        "La Sunna authentique et les récits de sîra les mieux établis montrent qu’avant la prophétie il est connu pour son honnêteté et mène la vie des Mecquois sans participer au culte des idoles. Il épouse Khadîja رضي الله عنها, qui deviendra la première personne à le soutenir lorsque la Révélation commencera.",
        "À l’approche de ses quarante ans, il aime se retirer dans la grotte de Hirâ’ pour adorer Allah et méditer loin de l’agitation de La Mecque. Sahih al-Bukhari rapporte que les rêves véridiques précèdent alors la première Révélation et se réalisent avec la clarté de l’aube.",
        "Parmi les éléments solidement attestés de cette période, le Prophète ﷺ participe à la vie de sa cité sans être connu pour l’idolâtrie ni les pratiques morales les plus dégradantes de Quraysh. Sa réputation de fiabilité explique pourquoi Khadîja رضي الله عنها lui confie des affaires commerciales avant leur mariage.",
        "OUMMAH ne transforme pas pour autant chaque récit traditionnel de son enfance ou de sa jeunesse en fait certain. Les épisodes célèbres de sîra sont distingués selon leurs chaînes et leur solidité ; la biographie ne place au même niveau que le Coran et les hadiths authentiques que ce qui peut être établi avec suffisamment de fiabilité."
      ],[{kind:"QURAN",label:"Ad-Duhâ 93:6–8",surahId:93,verse:6,note:"Allah rappelle au Prophète ﷺ l’orphelinat, le refuge et l’enrichissement."},{kind:"SUNNA",label:"Sahih al-Bukhari 3",note:"Le long hadith de ‘Â’isha décrit les débuts de la Révélation, les retraites à Hirâ’ et le soutien de Khadîja."}], ["La préparation d’une mission peut précéder longtemps son annonce publique.","La protection d’Allah accompagne le Prophète ﷺ dès avant la Révélation.","Les détails de sîra sont distingués des récits faibles ou légendaires."]),
      c("revelation",2,"Lis au nom de ton Seigneur","La première rencontre avec Jibrîl","Hirâ’ · Révélation · Khadîja",[
        "Dans la grotte de Hirâ’, l’ange Jibrîl vient à Muhammad ﷺ et lui ordonne de lire. Après cet échange éprouvant, les premiers versets de la sourate Al-‘Alaq sont révélés : lire au nom du Seigneur qui a créé, qui a créé l’homme d’une adhérence et qui enseigne par la plume.",
        "Le Prophète ﷺ redescend bouleversé et demande à Khadîja de le couvrir. Lorsqu’il lui raconte ce qui s’est passé et exprime sa peur, elle le rassure en rappelant ses qualités : il maintient les liens de parenté, soutient les faibles, aide ceux qui n’ont rien, honore l’hôte et secourt dans les épreuves de la vérité.",
        "Khadîja le conduit auprès de Waraqa ibn Nawfal, qui reconnaît dans l’être venu à Hirâ’ le même messager angélique que celui envoyé à Mûsâ et lui annonce que son peuple finira par l’expulser. La première Révélation est donc immédiatement accompagnée d’une confirmation, d’un soutien familial et de l’annonce que la mission rencontrera l’opposition.",
        "Après les premiers versets, la Révélation connaît une interruption qui augmente l’attente du Prophète ﷺ avant de reprendre. Les sourates Al-Muddaththir et Al-Muzzammil l’appellent ensuite à se lever, avertir, glorifier son Seigneur et se préparer à une parole lourde.",
        "La prophétie n’est donc pas vécue comme un prestige personnel. Elle commence par la peur, la responsabilité, la prière et la charge de transmettre. Khadîja devient un soutien immédiat, tandis que Waraqa annonce que le même type de révélation était venu aux prophètes antérieurs."
      ],[{kind:"QURAN",label:"Al-‘Alaq 96:1–5",surahId:96,verse:1,note:"Les premiers versets révélés."},{kind:"SUNNA",label:"Sahih al-Bukhari 3",note:"Récit authentique de la première Révélation, de Khadîja et de Waraqa ibn Nawfal."}], ["La Révélation commence par la connaissance et le nom d’Allah.","Le soutien de Khadîja occupe une place fondatrice.","La mission prophétique est annoncée avec ses responsabilités et ses épreuves."]),
      c("public-call",3,"Avertir les proches","De l’appel discret à la proclamation publique","La Mecque · tawhîd · opposition",[
        "Après les débuts de la Révélation, le cercle des croyants se forme progressivement. Le Prophète ﷺ reçoit ensuite l’ordre d’avertir ses proches et de proclamer ouvertement le message : Allah seul mérite l’adoration, les hommes seront ressuscités et chacun répondra de ses actes.",
        "La prédication remet en cause les idoles de Quraysh mais aussi l’ordre moral qui permet aux puissants d’oublier les pauvres, les orphelins et les faibles. Le Coran mecquois lie sans cesse le tawhîd à la justice, à l’honnêteté et à la préparation du Jour dernier.",
        "Les opposants passent de la moquerie aux accusations : poète, devin, magicien ou homme possédé. Le Coran répond à ces discours, console le Prophète ﷺ et lui rappelle que les messagers avant lui ont eux aussi été traités de menteurs.",
        "Lorsque le Prophète ﷺ rassemble ses proches, il leur parle comme quelqu’un dont ils connaissent déjà la sincérité. Les sources authentiques rapportent qu’il les avertit du châtiment et que son oncle Abû Lahab réagit avec hostilité, contexte auquel la sourate Al-Masad répond directement.",
        "Les premiers croyants viennent de milieux différents : proches, affranchis, jeunes et notables. La nouvelle communauté n’est pas fondée sur une tribu unique mais sur l’adhésion à la foi, ce qui bouleverse une société où le clan structure l’essentiel de la protection et du prestige."
      ],[{kind:"QURAN",label:"Ash-Shu‘arâ 26:214–220",surahId:26,verse:214,note:"Ordre d’avertir les proches et de soutenir les croyants."}], ["Le tawhîd transforme aussi la conduite sociale.","L’opposition ne constitue pas une preuve contre la vérité.","Le Prophète ﷺ demeure chargé de transmettre, non de forcer les cœurs."]),
      c("persecution",4,"Les années de pression","Persécution, boycott et patience","Patience · épreuves · protection",[
        "À mesure que l’appel grandit, les croyants les plus vulnérables subissent des persécutions sévères. Certains sont contraints à quitter La Mecque pour chercher refuge en Abyssinie, tandis que le Prophète ﷺ continue d’appeler son peuple et de protéger autant que possible sa communauté.",
        "Quraysh impose ensuite un boycott social et économique aux Banû Hâshim et à ceux qui protègent Muhammad ﷺ. La période devient extrêmement dure, puis le boycott prend fin. Peu après, le Prophète perd Khadîja et son oncle Abû Tâlib, deux soutiens très différents mais essentiels dans sa vie mecquoise.",
        "Le Coran ne transforme pas ces années en récit de désespoir : il ordonne la patience, la prière et la confiance, et répète les histoires des prophètes précédents pour inscrire l’épreuve de Muhammad ﷺ dans la continuité des messagers.",
        "La persécution ne touche pas tous les croyants de la même manière. Ceux qui disposent d’une forte protection tribale subissent surtout pressions et boycott, tandis que des esclaves ou personnes sans clan sont torturés physiquement. La sîra authentiquement transmise conserve ainsi des histoires de fermeté très différentes selon les situations.",
        "Le voyage à Tâ’if appartient à cette période de recherche d’un espace où le message pourrait être entendu. Le Prophète ﷺ y rencontre un rejet douloureux ; les récits authentiques montrent néanmoins qu’il refuse que l’ange des montagnes détruise le peuple et espère qu’une descendance adorera un jour Allah seul."
      ],[{kind:"QURAN",label:"Al-Muzzammil 73:10",surahId:73,verse:10,note:"Ordre de patienter face aux paroles des opposants."}], ["La patience prophétique reste active.","La communauté croyante se construit dans l’épreuve autant que dans le succès.","Les pertes personnelles n’interrompent pas la mission."]),
      c("isra-miraj",5,"Le Voyage nocturne et l’Ascension","De la Mosquée sacrée aux signes des cieux","Isrâ’ · Mi‘râj · prière",[
        "Le Coran affirme qu’Allah fait voyager de nuit Son serviteur de la Mosquée sacrée vers la Mosquée la plus lointaine afin de lui montrer certains de Ses signes. La Sunna authentique développe ensuite l’ascension dans les cieux en compagnie de Jibrîl.",
        "Le Prophète ﷺ rencontre plusieurs prophètes : Âdam, ‘Îsâ et Yahyâ, Yûsuf, Idrîs, Hârûn, Mûsâ puis Ibrâhîm selon les versions authentiques. Ces rencontres relient visiblement sa mission à la longue chaîne prophétique que le module raconte.",
        "La prière quotidienne est imposée au cours de cette nuit. Mûsâ conseille à Muhammad ﷺ de demander des allégements jusqu’à ce que cinq prières demeurent avec la récompense de cinquante. Le Mi‘râj devient ainsi un événement central de la relation entre la communauté et Allah.",
        "Le récit authentique de l’Ascension mentionne aussi Sidrat al-Muntahâ et la vision de grands signes d’Allah. Les détails graphiques ou descriptions très élaborées des cieux présents dans certaines œuvres populaires ne doivent pas être présentés comme s’ils provenaient tous des hadiths sahih.",
        "Au retour, l’événement devient une épreuve de foi pour ceux qui l’entendent. Abû Bakr رضي الله عنه est connu pour avoir confirmé le Prophète ﷺ, tandis que Quraysh utilise l’épisode pour redoubler de moquerie. Le Voyage nocturne se situe donc à la fois dans la consolation divine et dans la poursuite de l’épreuve publique."
      ],[{kind:"QURAN",label:"Al-Isrâ’ 17:1",surahId:17,verse:1,note:"Le Voyage nocturne de la Mosquée sacrée à la Mosquée la plus lointaine."},{kind:"SUNNA",label:"Sahih al-Bukhari 3887",note:"Récit authentique de l’Isrâ’ et du Mi‘râj et des rencontres avec les prophètes."}], ["La prière est liée à un événement majeur de la mission.","Muhammad ﷺ s’inscrit dans la continuité des prophètes.","Les récits authentiques sont distingués des détails populaires du Mi‘râj non établis."]),
      c("hijra",6,"Le compagnon dans la grotte","Quitter La Mecque pour bâtir à Médine","Hijra · grotte · communauté",[
        "Lorsque la pression devient un projet d’assassinat, le Prophète ﷺ reçoit la permission de quitter La Mecque. Les croyants ont déjà commencé à rejoindre Yathrib, bientôt appelée Médine, où des habitants ont prêté allégeance et offert leur protection.",
        "Le Coran conserve une scène précise de la Hijra : Muhammad ﷺ se trouve dans la grotte avec son compagnon Abû Bakr رضي الله عنه et lui dit de ne pas s’affliger car Allah est avec eux. La sérénité divine descend alors au cœur même du danger.",
        "À Médine commence une nouvelle phase : construction d’une communauté, fraternisation entre émigrants et auxiliaires, organisation du culte et des responsabilités collectives. La mission n’est plus seulement celle d’un groupe persécuté ; elle doit désormais administrer justice, pactes et coexistence.",
        "Avant la sortie de La Mecque, les Qurayshites complotent pour neutraliser le Prophète ﷺ. ‘Alî رضي الله عنه reste à La Mecque afin de rendre les dépôts confiés au Prophète à leurs propriétaires, détail qui souligne le paradoxe : ses ennemis combattent son message tout en lui confiant encore leurs biens.",
        "À l’arrivée à Médine, la mosquée devient le cœur de la nouvelle communauté. Les liens entre Muhâjirûn et Ansâr sont renforcés et plusieurs pactes organisent les relations avec les groupes présents dans la ville. La Hijra est donc autant une migration qu’un commencement institutionnel."
      ],[{kind:"QURAN",label:"At-Tawba 9:40",surahId:9,verse:40,note:"Le Prophète ﷺ et Abû Bakr dans la grotte pendant la Hijra."}], ["La confiance en Allah accompagne la planification.","La Hijra transforme l’espace de la mission.","Une communauté de foi implique des responsabilités sociales et politiques."]),
      c("badr",7,"Badr","La première grande confrontation","Badr · secours · discipline",[
        "Deux ans après la Hijra, une confrontation majeure oppose les croyants à Quraysh près de Badr. Les musulmans sont moins nombreux et moins équipés, tandis que le Coran rappelle qu’Allah les a secourus alors qu’ils étaient faibles.",
        "Le Prophète ﷺ organise ses rangs, consulte ses compagnons et invoque longuement Allah. Le Coran relie la victoire au secours divin et à l’obéissance, refusant que les croyants attribuent le résultat à leur seule force.",
        "Badr modifie l’équilibre autour de Médine, mais la Révélation encadre immédiatement la victoire : traitement des prisonniers, répartition des biens et rappel que la réussite ne dispense jamais de la crainte d’Allah.",
        "Parmi les moments forts de Badr, la Sunna rapporte l’invocation insistante du Prophète ﷺ avant la bataille, au point que son manteau tombe de ses épaules. Abû Bakr le rassure alors que la promesse de son Seigneur s’accomplira.",
        "Après la bataille, la question des prisonniers montre que même une victoire requiert encore jugement et révélation. Le Coran corrige, oriente et éduque la communauté au lieu de laisser la guerre devenir un domaine soustrait à la morale."
      ],[{kind:"QURAN",label:"Âl ‘Imrân 3:123–125",surahId:3,verse:123,note:"Le secours d’Allah à Badr."},{kind:"QURAN",label:"Al-Anfâl 8:5–19",surahId:8,verse:5,note:"Plusieurs éléments coraniques entourant la bataille de Badr."}], ["La victoire ne justifie pas l’orgueil.","Le secours d’Allah accompagne l’organisation et la discipline.","Les succès militaires restent soumis à une éthique révélée."]),
      c("uhud",8,"Uhud","Une blessure qui éduque la communauté","Uhud · désobéissance · pardon",[
        "L’année suivante, Quraysh revient avec une armée importante. Au début de la bataille d’Uhud, les musulmans prennent l’avantage, mais une partie des archers quitte la position que le Prophète ﷺ leur avait ordonné de tenir, attirée par ce qui semble être la fin du combat.",
        "Le retournement est brutal : les rangs se désorganisent, plusieurs compagnons sont tués et le Prophète ﷺ est blessé. Le Coran analyse l’épisode avec franchise : faiblesse, désaccord et désobéissance apparaissent, mais la porte du pardon n’est pas fermée.",
        "Allah ordonne au Prophète ﷺ de pardonner aux croyants, de demander pardon pour eux et de continuer à les consulter. Uhud devient une école de responsabilité : une communauté peut commettre une faute grave sans être abandonnée si elle apprend et revient à Allah.",
        "La rumeur de la mort du Prophète ﷺ se répand au cœur du combat et provoque un choc. Le Coran répond en rappelant que Muhammad n’est qu’un messager et que des messagers sont passés avant lui : sa mort éventuelle ne doit jamais faire retourner les croyants sur leurs pas.",
        "Hamza رضي الله عنه et de nombreux compagnons sont tués. Le Prophète ﷺ porte lui-même les traces physiques de la bataille, mais il ne transforme pas sa blessure en droit à la vengeance contre ses propres compagnons. La reconstruction morale commence immédiatement."
      ],[{kind:"QURAN",label:"Âl ‘Imrân 3:152–159",surahId:3,verse:152,note:"Analyse coranique d’Uhud, pardon et consultation."}], ["L’erreur doit être analysée sans détruire la communauté.","Le pardon peut accompagner l’exigence.","L’obéissance aux consignes compte au moment du succès comme au moment de la peur."]),
      c("hudaybiyyah",9,"Al-Hudaybiyyah","Une victoire avant qu’elle soit visible","Traité · patience · ouverture",[
        "Le Prophète ﷺ et ses compagnons se dirigent vers La Mecque avec l’intention d’accomplir la ‘umra, mais Quraysh leur barre la route. Des négociations aboutissent à un traité dont plusieurs clauses paraissent très dures aux croyants.",
        "La sourate Al-Fath descend pourtant en qualifiant l’événement de victoire éclatante. Allah mentionne la sérénité placée dans les cœurs et l’allégeance des croyants sous l’arbre, montrant que la fidélité peut se mesurer dans l’acceptation d’une stratégie incomprise sur le moment.",
        "La trêve ouvre l’espace de la prédication et des relations entre tribus. Ce qui semblait être un recul prépare en réalité une expansion beaucoup plus rapide du message.",
        "Le pacte contient notamment une clause selon laquelle les musulmans reviendront cette année sans accomplir la ‘umra et reviendront l’année suivante. Cette condition est très difficile à accepter pour plusieurs compagnons, mais le Prophète ﷺ maintient le traité.",
        "L’affaire d’Abû Jandal, qui arrive enchaîné alors que le traité vient d’être conclu, rend la scène particulièrement douloureuse. Le Prophète ﷺ respecte néanmoins son engagement et demande à Abû Jandal de patienter, illustrant le coût réel de la fidélité à une parole donnée."
      ],[{kind:"QURAN",label:"Al-Fath 48:1–18",surahId:48,verse:1,note:"Hudaybiyyah, la victoire éclatante, la sérénité et l’allégeance sous l’arbre."}], ["Une concession apparente peut préparer une ouverture réelle.","La patience stratégique fait partie de la mission.","La sérénité aide à obéir lorsque le résultat n’est pas encore visible."]),
      c("conquest",10,"Le retour à La Mecque","La victoire sans vengeance générale","Conquête · pardon · purification",[
        "Lorsque les alliés de Quraysh rompent les équilibres du traité, le Prophète ﷺ marche vers La Mecque avec une force importante. La ville qui l’avait expulsé tombe avec relativement peu de combat.",
        "Les idoles autour de la Kaaba sont détruites et le sanctuaire est rendu au tawhîd d’Ibrâhîm. La victoire n’est pas utilisée pour mener une vengeance générale contre la population ; de nombreux anciens adversaires reçoivent la sécurité et entrent progressivement dans l’islam.",
        "La sourate An-Nasr donnera plus tard la lecture spirituelle de cette ouverture : lorsque vient le secours d’Allah et que les gens entrent en foule dans la religion, le Prophète doit glorifier son Seigneur et demander pardon.",
        "À l’entrée de La Mecque, le Prophète ﷺ manifeste l’humilité plutôt que l’orgueil triomphal. La Kaaba est purifiée des idoles et le principe du tawhîd est réaffirmé dans la ville même qui avait été le centre de l’opposition.",
        "La conquête ne règle pas tous les défis de la péninsule : Hunayn et d’autres événements suivent. Mais elle marque un basculement majeur, car Quraysh cesse d’être la puissance qui empêche l’accès au sanctuaire et de nombreuses tribus réévaluent alors leur position face à l’islam."
      ],[{kind:"QURAN",label:"An-Nasr 110:1–3",surahId:110,verse:1,note:"Lecture spirituelle de l’ouverture : glorification et demande de pardon."}], ["La victoire prophétique ramène au tawhîd.","Le pouvoir ne doit pas abolir la miséricorde.","Au sommet du succès, le Prophète ﷺ reçoit l’ordre de demander pardon."]),
      c("farewell",11,"Le pèlerinage d’adieu","Transmettre avant le départ","Hajj · transmission · achèvement",[
        "Dans la dixième année de l’Hégire, le Prophète ﷺ accomplit le pèlerinage avec une immense foule et enseigne publiquement les rites. Le long hadith de Jâbir dans Sahih Muslim conserve de nombreux détails de ce pèlerinage et constitue une source majeure pour la pratique du Hajj.",
        "À ‘Arafât et durant le pèlerinage, il rappelle la sacralité du sang, des biens et de l’honneur, abolit des pratiques de la période préislamique et appelle la communauté à se transmettre le message. Le Coran annonce aussi l’achèvement de la religion et l’accomplissement du bienfait d’Allah.",
        "Peu après, le Prophète ﷺ tombe malade à Médine. Il meurt après avoir transmis la Révélation et laissé à la communauté le Coran et une Sunna abondamment transmise. Sa mort ne met pas fin au message : Abû Bakr rappellera que Muhammad est mort, tandis qu’Allah est Vivant et ne meurt pas.",
        "Le Prophète ﷺ montre les rites en les accomplissant lui-même et demande aux musulmans de prendre de lui leurs pratiques du pèlerinage. La sîra rejoint ici directement le fiqh : les gestes observés durant ce Hajj deviennent une source normative pour les générations suivantes.",
        "Après son retour à Médine, sa maladie finale s’intensifie. Il demande à Abû Bakr de diriger la prière lorsque sa faiblesse l’empêche de le faire. Sa mort provoque un choc immense, mais la communauté doit apprendre immédiatement à distinguer l’amour du messager de l’adoration due à Allah seul."
      ],[{kind:"QURAN",label:"Al-Mâ’ida 5:3",surahId:5,verse:3,note:"Verset de l’achèvement de la religion et de l’accomplissement du bienfait."},{kind:"SUNNA",label:"Sahih Muslim 1218",note:"Long hadith de Jâbir décrivant le pèlerinage d’adieu et les rites du Hajj."}], ["Transmettre fait partie de l’achèvement de la mission.","La dignité des personnes et des biens est rappelée au cœur du pèlerinage.","La religion demeure après la mort du messager."]),
      c("completion",12,"Le dernier des prophètes","Une mission achevée, un modèle qui demeure","Sceau · miséricorde · héritage",[
        "Le Coran décrit Muhammad ﷺ comme le Messager d’Allah et le sceau des prophètes. Sa venue clôt la prophétie tout en confirmant la chaîne des messagers précédents : Âdam, Nûh, Ibrâhîm, Mûsâ, ‘Îsâ et tous ceux qu’Allah a envoyés.",
        "Il est présenté comme miséricorde pour les mondes et comme excellent modèle pour celui qui espère Allah et le Jour dernier. Son héritage n’est donc pas une simple mémoire historique : sa Sunna explique et incarne la Révélation dans la prière, la justice, la famille, le commerce, la guerre, la paix et la miséricorde.",
        "La biographie de Muhammad ﷺ est immensément plus détaillée dans les hadiths et les ouvrages de sîra que ne peut l’être un module synthétique. OUMMAH privilégie ici le Coran et les récits authentiques ; lorsqu’une chronologie ou un détail provient de traditions discutées, il doit être signalé comme tel au lieu d’être présenté avec la même certitude.",
        "La Sunna devient la seconde grande source de cette biographie parce qu’elle transmet non seulement des événements, mais la manière dont le Prophète ﷺ priait, enseignait, plaisantait sans mentir, jugeait, pardonnait, combattait et traitait sa famille. Une histoire fidèle ne peut donc se limiter au calendrier des batailles.",
        "OUMMAH distingue toutefois le hadith authentique des récits faibles de sîra. Les ouvrages historiques peuvent préserver des informations précieuses, mais lorsqu’une narration est faible ou sans chaîne suffisante, elle doit être présentée comme telle et ne pas recevoir le même statut qu’un texte sahih."
      ],[{kind:"QURAN",label:"Al-Ahzâb 33:40",surahId:33,verse:40,note:"Muhammad ﷺ est Messager d’Allah et sceau des prophètes."},{kind:"QURAN",label:"Al-Anbiyâ’ 21:107",surahId:21,verse:107,note:"Le Prophète ﷺ est envoyé comme miséricorde pour les mondes."}], ["La prophétie s’achève avec Muhammad ﷺ.","La Sunna authentique est indispensable pour connaître sa biographie et sa pratique.","La fidélité aux sources exige de distinguer authenticité, faiblesse et récit historique."])
    ]
  }
};

PROPHET_STORIES.adam.chapters = PROPHET_STORIES.adam.chapters.map((chapter, index) => ({
  ...chapter,
  image: ADAM_CHAPTER_IMAGES[index],
}));
PROPHET_STORIES.nuh.chapters = PROPHET_STORIES.nuh.chapters.map((chapter, index) => ({
  ...chapter,
  image: NUH_CHAPTER_IMAGES[index],
}));
PROPHET_STORIES.hud.chapters = PROPHET_STORIES.hud.chapters.map((chapter, index) => ({
  ...chapter,
  image: HUD_CHAPTER_IMAGES[index],
}));
PROPHET_STORIES.salih.chapters = PROPHET_STORIES.salih.chapters.map((chapter, index) => ({
  ...chapter,
  image: SALIH_CHAPTER_IMAGES[index],
}));
PROPHET_STORIES.ibrahim.chapters = PROPHET_STORIES.ibrahim.chapters.map((chapter, index) => ({
  ...chapter,
  image: IBRAHIM_CHAPTER_IMAGES[index],
}));
PROPHET_STORIES.lut.chapters = PROPHET_STORIES.lut.chapters.map((chapter, index) => ({
  ...chapter,
  image: LUT_CHAPTER_IMAGES[index],
}));
PROPHET_STORIES.ismail.chapters = PROPHET_STORIES.ismail.chapters.map((chapter, index) => ({
  ...chapter,
  image: ISMAIL_CHAPTER_IMAGES[index],
}));
PROPHET_STORIES.ishaq.chapters = PROPHET_STORIES.ishaq.chapters.map((chapter, index) => ({
  ...chapter,
  image: ISHAQ_CHAPTER_IMAGES[index],
}));

PROPHET_STORIES["idris"].chapters = PROPHET_STORIES["idris"].chapters.map((chapter, index) => ({
  ...chapter,
  image: IDRIS_CHAPTER_IMAGES[index],
}));

PROPHET_STORIES["yaqub"].chapters = PROPHET_STORIES["yaqub"].chapters.map((chapter, index) => ({
  ...chapter,
  image: YAQUB_CHAPTER_IMAGES[index],
}));

PROPHET_STORIES["yusuf"].chapters = PROPHET_STORIES["yusuf"].chapters.map((chapter, index) => ({
  ...chapter,
  image: YUSUF_CHAPTER_IMAGES[index],
}));

PROPHET_STORIES["shuayb"].chapters = PROPHET_STORIES["shuayb"].chapters.map((chapter, index) => ({
  ...chapter,
  image: SHUAYB_CHAPTER_IMAGES[index],
}));

PROPHET_STORIES["ayyub"].chapters = PROPHET_STORIES["ayyub"].chapters.map((chapter, index) => ({
  ...chapter,
  image: AYYUB_CHAPTER_IMAGES[index],
}));

PROPHET_STORIES["dhul-kifl"].chapters = PROPHET_STORIES["dhul-kifl"].chapters.map((chapter, index) => ({
  ...chapter,
  image: DHUL_KIFL_CHAPTER_IMAGES[index],
}));

PROPHET_STORIES["harun"].chapters = PROPHET_STORIES["harun"].chapters.map((chapter, index) => ({
  ...chapter,
  image: HARUN_CHAPTER_IMAGES[index],
}));

PROPHET_STORIES["dawud"].chapters = PROPHET_STORIES["dawud"].chapters.map((chapter, index) => ({
  ...chapter,
  image: DAWUD_CHAPTER_IMAGES[index],
}));

PROPHET_STORIES["sulayman"].chapters = PROPHET_STORIES["sulayman"].chapters.map((chapter, index) => ({
  ...chapter,
  image: SULAYMAN_CHAPTER_IMAGES[index],
}));

PROPHET_STORIES["ilyas"].chapters = PROPHET_STORIES["ilyas"].chapters.map((chapter, index) => ({
  ...chapter,
  image: ILYAS_CHAPTER_IMAGES[index],
}));

PROPHET_STORIES["al-yasa"].chapters = PROPHET_STORIES["al-yasa"].chapters.map((chapter, index) => ({
  ...chapter,
  image: AL_YASA_CHAPTER_IMAGES[index],
}));

PROPHET_STORIES["yunus"].chapters = PROPHET_STORIES["yunus"].chapters.map((chapter, index) => ({
  ...chapter,
  image: YUNUS_CHAPTER_IMAGES[index],
}));

PROPHET_STORIES["zakariya"].chapters = PROPHET_STORIES["zakariya"].chapters.map((chapter, index) => ({
  ...chapter,
  image: ZAKARIYA_CHAPTER_IMAGES[index],
}));

PROPHET_STORIES["yahya"].chapters = PROPHET_STORIES["yahya"].chapters.map((chapter, index) => ({
  ...chapter,
  image: YAHYA_CHAPTER_IMAGES[index],
}));

PROPHET_STORIES["isa"].chapters = PROPHET_STORIES["isa"].chapters.map((chapter, index) => ({
  ...chapter,
  image: ISA_CHAPTER_IMAGES[index],
}));

PROPHET_STORIES["muhammad"].chapters = PROPHET_STORIES["muhammad"].chapters.map((chapter, index) => ({
  ...chapter,
  image: MUHAMMAD_CHAPTER_IMAGES[index],
}));


export const ALL_PROPHET_IDS = Object.keys(PROPHET_STORIES);
