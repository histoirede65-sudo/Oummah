import type { Book, Chapter, HajjType, Point, Source, Step } from "./pilgrimageTypes";

/**
 * The two books (‘Umra, Hajj). The original validated texts and sources are kept as they were;
 * additions carry their own precise reference.
 */

const H = (reference: string): Source => ({ kind: "AUTHENTIC_HADITH", reference });
const Q = (reference: string): Source => ({ kind: "QURAN", reference });
const F = (reference: string): Source => ({ kind: "FIQH", reference });
const D = (reference: string): Source => ({ kind: "JURISTIC_DIFFERENCE", reference });
const p = (text: string, sources: Source[] = [], importance?: Point["importance"]): Point => ({ text, sources, importance });

// ----- Shared pages (‘Umra, and the start of the Hajj) ----------------------------------------

const preparation: Step = {
  id: "preparation",
  title: "Préparer son départ",
  arabic: "الاستعداد",
  visual: "preparation",
  summary: "Se renseigner, régler ses affaires et apprendre les rites.",
  todo: [
    p("Préparez vos besoins pratiques et votre état spirituel avant le voyage."),
    p("Apprenez les rites, vérifiez l’itinéraire et préparez vos besoins de santé et de sécurité."),
  ],
  notes: [
    p("Celui qui accomplit le pèlerinage sans propos indécents ni péchés revient comme au jour où sa mère l’a mis au monde.", [H("Sahîh al-Bukhârî 1521")]),
    p("Quand : avant le mîqât."),
  ],
  say: ["travel"],
};

const miqat: Step = {
  id: "miqat",
  title: "Le mîqât — la limite d’entrée",
  arabic: "الميقات",
  visual: "miqat",
  summary: "Le mîqât est la limite à ne pas franchir vers La Mecque sans ihrâm pour celui qui a l’intention du pèlerinage.",
  todo: [
    p("Ne franchissez pas le mîqât en repoussant volontairement l’ihrâm.", [H("Sahîh al-Bukhârî 1526")]),
    p("Entrez en ihrâm avant de franchir le mîqât si vous avez l’intention de la ‘Umra.", [H("Sahîh al-Bukhârî 1526")]),
  ],
  notes: [
    p("Le Prophète ﷺ a fixé Dhul-Hulayfa pour les gens de Médine, al-Juhfa pour ceux du Shâm, Qarn al-Manâzil pour ceux du Najd et Yalamlam pour ceux du Yémen ; ces limites valent aussi pour ceux qui y passent.", [H("Sahîh al-Bukhârî 1526")]),
    p("Dhât ‘Irq a été fixé pour les gens de l’Irak.", [H("Sahîh al-Bukhârî 1531")]),
    p("En avion, préparez-vous avant le passage annoncé ; si le mîqât est dépassé, consultez rapidement.", [H("Sahîh al-Bukhârî 1526")]),
  ],
  tool: "miqat",
};

const ihram: Step = {
  id: "ihram",
  title: "Entrer en ihrâm",
  arabic: "الإحرام",
  visual: "ihram",
  summary: "L’ihrâm est l’état rituel du pèlerin, avec une intention et des règles particulières.",
  todo: [
    p("L’intention se fait dans le cœur ; la talbiya accompagne l’entrée dans le rite.", [Q("Coran 2:196")]),
    p("L’ihrâm est l’état rituel qui commence avec l’intention ; ce n’est pas seulement un vêtement.", [Q("Coran 2:196")]),
  ],
  men: [p("L’homme porte les deux pièces prévues et respecte les interdits de l’ihrâm.", [Q("Coran 2:196")])],
  women: [p("La femme porte une tenue pudique habituelle ; les détails du visage et des gants relèvent du fiqh.", [Q("Coran 2:196")])],
};

const talbiyah: Step = {
  id: "talbiyah",
  title: "La talbiya",
  arabic: "التلبية",
  visual: "talbiya",
  summary: "Répétez la formule de talbiya et évitez les disputes et les paroles déplacées.",
  todo: [
    p("Répétez-la après l’entrée en ihrâm jusqu’au rite qui met fin à cette récitation.", [H("Sahîh al-Bukhârî 1549")]),
  ],
  say: ["talbiyah"],
};

const prohibitions: Step = {
  id: "prohibitions",
  title: "Les interdits de l’ihrâm",
  arabic: "محظورات الإحرام",
  visual: "prohibitions",
  summary: "Les interdits varient selon les personnes et les situations ; ne transformez pas un conseil pratique en règle universelle.",
  todo: [
    p("Évitez parfum, chasse et actes interdits ; les questions de compensation nécessitent un avis qualifié.", [Q("Coran 2:197"), F("Fiqh : détails selon les écoles")]),
  ],
  avoid: [
    p("Évitez les rapports conjugaux, le parfum intentionnel, la chasse et les autres interdits ; la conséquence dépend du cas.", [Q("Coran 2:197")]),
    p("La chasse est interdite en état d’ihrâm.", [Q("Coran 5:95")]),
    p("Le muhrim ne conclut pas de mariage.", [H("Sahîh Muslim 1409")]),
  ],
  men: [p("L’homme ne porte ni chemise, ni turban, ni pantalon, ni burnous, ni chaussures montantes, ni vêtement touché par le safran ou le wars.", [H("Sahîh al-Bukhârî 1542")])],
  women: [p("La femme ne porte ni niqâb ni gants.", [H("Sahîh al-Bukhârî 1838")])],
  mistakes: [p("Ne donnez pas automatiquement la même conséquence à l’oubli, la contrainte et l’acte volontaire.", [Q("Coran 2:197")])],
};

const haram: Step = {
  id: "haram",
  title: "Arriver à la Mosquée sacrée",
  arabic: "المسجد الحرام",
  visual: "haram",
  summary: "Entrez avec recueillement et dirigez-vous vers le Tawâf.",
  todo: [
    p("Aucune invocation obligatoire spécifique n’est établie pour chaque déplacement.", [H("Sahîh Muslim 1218")]),
    p("Entrez avec recueillement et rejoignez le Tawâf sans bloquer les passages.", [H("Sahîh Muslim 1218")]),
  ],
};

const tawafPrep: Step = {
  id: "tawaf-prep",
  title: "Se préparer au Tawâf",
  arabic: "الطواف",
  visual: "tawaf",
  summary: "Le Tawâf consiste à tourner autour de la Kaaba. La purification est une question juridique importante avec des avis détaillés.",
  todo: [
    p("Suivez l’avis qualifié correspondant à votre situation ; évitez de gêner les autres.", [D("Divergence juridique : purification du Tawâf")]),
    p("Repérez le départ, gardez la Kaaba à gauche et préservez les flux ; la purification est une question de fiqh distincte.", [D("Divergence juridique : purification du Tawâf")]),
  ],
  women: [p("Une femme menstruée peut entrer en ihrâm et accomplir les rites autres que le Tawâf ; le Tawâf est normalement différé jusqu’à la purification. Si elle doit partir avant, demandez rapidement un avis qualifié.")],
  differences: [{
    question: "Les ablutions sont-elles une condition de validité du Tawâf ?",
    establishedPoint: "La purification est la pratique recommandée et la précaution à suivre.",
    views: [
      { label: "Avis majoritaire", position: "La purification est une condition de validité du Tawâf.", consequence: "Renouveler les ablutions et demander la conduite à tenir si elles sont perdues.", evidences: [F("Al-Nawawî, Al-Majmû‘, chapitre du Tawâf")] },
      { label: "Avis juridique différent", position: "Des juristes hanafites et une opinion rapportée d’Ahmad ne la considèrent pas comme une condition de validité.", consequence: "La conséquence dépend du cas et de l’école suivie ; ne pas recommencer seul.", evidences: [F("Ibn Qudâma, Al-Mughnî, chapitre du Tawâf")] },
    ],
    practicalNote: "Une situation en cours nécessite l’avis rapide d’une personne qualifiée.",
  }],
};

const tawaf: Step = {
  id: "tawaf",
  title: "Tawâf — 7 tours",
  arabic: "سبعة أشواط",
  visual: "tawaf",
  summary: "Comptez sept tours complets, en gardant la Kaaba à gauche.",
  todo: [
    p("Accomplissez sept tours complets autour de la Kaaba, sans imposer une invocation à chaque tour.", [H("Sahîh Muslim 1218")]),
    p("Al-Wajîz : le tawâf commence à la Pierre noire et s’y termine, la Maison à gauche.", [F("Al-Wajîz fî fiqh as-sunna, Badawî — Kitâb al-Hajj, p. 256")]),
  ],
  notes: [p("Il n’existe pas d’invocation authentique obligatoire pour chaque tour.", [H("Sahîh Muslim 1218")])],
  mistakes: [p("Ne comptez pas les allers-retours comme des tours et ne poussez pas.", [H("Sahîh Muslim 1218")])],
  say: ["takbir", "rabbana", "free"],
  tool: "tawaf",
  duas: true,
};

const blackStone: Step = {
  id: "black-stone",
  title: "Pierre noire et angle yéménite",
  arabic: "الحجر الأسود",
  visual: "stone",
  summary: "Saluez la Pierre noire si cela est possible sans pousser. Entre les deux angles, invoquez librement.",
  todo: [
    p("Saluez la Pierre noire sans bousculer ; si l’accès est impossible, faites un signe au niveau du passage.", [H("Sahîh al-Bukhârî 1611")]),
    p("Pour l’angle yéménite, touchez-le si possible sans danger ; ne le saluez pas à distance par un geste.", [H("Sahîh al-Bukhârî 1611")]),
  ],
  avoid: [p("Ne vous mettez pas en danger et ne blessez personne.", [H("Sahîh al-Bukhârî 1611")])],
  say: ["takbir", "rabbana"],
};

const ramal: Step = {
  id: "ramal",
  title: "Ramal et idtibâ‘",
  arabic: "الرمل والاضطباع",
  visual: "tawaf",
  summary: "Ces pratiques concernent certains hommes dans certaines circonstances ; elles ne concernent pas les femmes.",
  todo: [p("Ne forcez jamais le passage dans la foule.", [H("Sahîh Muslim 1218"), F("Fiqh : conditions d’application")])],
  men: [
    p("Le ramal et l’idtibâ‘ sont des pratiques masculines dont les conditions relèvent du fiqh ; la sécurité prime.", [F("Fiqh : conditions d’application")]),
    p("Le Prophète ﷺ a pressé le pas sur trois tours et marché sur quatre.", [H("Sahîh Muslim 1218")]),
  ],
  women: [p("La femme marche normalement et privilégie pudeur et sécurité.")],
};

const prayer: Step = {
  id: "prayer",
  title: "Deux rak‘ât après le Tawâf",
  arabic: "ركعتا الطواف",
  visual: "prayer",
  summary: "Priez si possible derrière Maqâm Ibrâhîm, sans gêner les flux.",
  todo: [
    p("La sécurité et la facilité priment dans l’organisation pratique.", [Q("Coran 2:125")]),
    p("Après les sept tours, priez deux rak‘ât dans un lieu autorisé sans bloquer les flux.", [Q("Coran 2:125")]),
  ],
  notes: [p("Le Prophète ﷺ y a récité les sourates al-Kâfirûn et al-Ikhlâs.", [H("Sahîh Muslim 1218")])],
};

const zamzam: Step = {
  id: "zamzam",
  title: "Zamzam",
  arabic: "زمزم",
  visual: "zamzam",
  summary: "Buvez si vous le pouvez et invoquez Allah librement.",
  todo: [
    p("Aucune formule unique obligatoire n’est établie ici.", [H("Sahîh al-Bukhârî 1636")]),
    p("Buvez de Zamzam si possible sans gêner les autres ; invoquez Allah librement.", [H("Sahîh al-Bukhârî 1636")]),
  ],
  say: ["free"],
};

const sai: Step = {
  id: "sai",
  title: "Safâ et Marwa — le Sa‘y",
  arabic: "السعي",
  visual: "sai",
  summary: "Le Sa‘y est composé de sept trajets : Safâ→Marwa = 1, puis Marwa→Safâ = 2, jusqu’à Safâ→Marwa = 7.",
  todo: [
    p("Faites sept trajets : Safâ vers Marwa compte un, puis retour deux, jusqu’à terminer à Marwa.", [Q("Coran 2:158"), H("Sahîh Muslim 1218")]),
    p("En montant sur Safâ, le Prophète ﷺ a récité le verset de Safâ et Marwa, puis s’est tourné vers la Kaaba pour proclamer l’unicité et la grandeur d’Allah et invoquer ; il a fait de même sur Marwa.", [H("Sahîh Muslim 1218")]),
  ],
  men: [p("Le Prophète ﷺ a couru au fond de la vallée ; al-Wajîz : courir fortement entre les deux repères verts.", [H("Sahîh Muslim 1218"), F("Al-Wajîz fî fiqh as-sunna, Badawî — Kitâb al-Hajj, p. 251")])],
  women: [p("La femme marche normalement.", [Q("Coran 2:158")])],
  say: ["safa", "safa-dhikr", "forgiveness", "free"],
  tool: "sai",
  duas: true,
};

const hair: Step = {
  id: "hair",
  title: "Halq ou taqsîr",
  arabic: "الحلق أو التقصير",
  visual: "hair",
  summary: "Le halq est le rasage et le taqsîr la coupe des cheveux. Les règles diffèrent entre hommes et femmes.",
  todo: [
    p("Ne coupez pas avant le moment rituel approprié.", [H("Sahîh Muslim 1301")]),
    p("Après les actes requis, l’homme rase ou raccourcit ; la femme raccourcit une partie des pointes.", [H("Sahîh Muslim 1301")]),
  ],
  men: [p("Le Prophète ﷺ a invoqué trois fois la miséricorde pour ceux qui se rasent la tête, puis pour ceux qui raccourcissent.", [H("Sahîh al-Bukhârî 1727")])],
  women: [p("Le rasage ne concerne pas les femmes : elles raccourcissent seulement.", [H("Sunan Abî Dâwûd 1985")])],
};

const exitStep: Step = {
  id: "exit",
  title: "Sortie de l’ihrâm",
  arabic: "التحلل",
  visual: "exit",
  summary: "Après les actes requis et la coupe des cheveux, les restrictions prennent fin selon le rite accompli.",
  todo: [
    p("En cas d’incertitude sur l’ordre ou une compensation, consultez une personne qualifiée.", [Q("Coran 2:196")]),
    p("Après les actes requis et la coupe, la sortie de l’ihrâm intervient selon le rite.", [Q("Coran 2:196")]),
  ],
};

// ----- Medina (optional visit, in both books) ------------------------------------------------

const medinaChapter: Chapter = {
  id: "medina",
  title: "Visite de Médine",
  marker: "Médine",
  steps: [
    {
      id: "arrive-medina",
      title: "Arriver à Médine",
      arabic: "المدينة المنورة",
      visual: "medina",
      summary: "Al-Wajîz : la visite de la Mosquée du Prophète ﷺ est une Sunnah, sans lien avec le Hajj : elle ne fait pas partie de ses rites.",
      todo: [
        p("Faites le voyage avec l’intention de prier dans la Mosquée du Prophète ﷺ : on ne voyage spécialement que vers trois mosquées.", [H("Sahîh al-Bukhârî 1189")]),
        p("Entrez dans la mosquée du pied droit, avec l’invocation d’entrée.", [H("Sahîh Muslim 713"), F("Al-Wajîz fî fiqh as-sunna, Badawî — Kitâb al-Hajj, p. 270")]),
      ],
      notes: [
        p("Une prière dans cette mosquée vaut mieux que mille prières ailleurs, sauf dans la Mosquée sacrée.", [H("Sahîh al-Bukhârî 1190")]),
        p("Al-Wajîz : la visite de la Mosquée du Prophète ﷺ ne fait pas partie des rites du Hajj ; elle est légiférée pour elle-même.", [F("Al-Wajîz fî fiqh as-sunna, Badawî — Kitâb al-Hajj, p. 273")]),
      ],
      say: ["mosque-entry"],
    },
    {
      id: "rawda",
      title: "Ar-Rawda",
      arabic: "الروضة الشريفة",
      visual: "rawda",
      summary: "« Entre ma maison et ma chaire, il y a un jardin parmi les jardins du Paradis. »",
      todo: [
        p("Al-Wajîz : que le désir de prier dans la Rawda ne vous fasse pas quitter les premiers rangs ; la prière dans la Rawda n’a pas de mérite qui la distingue du reste de la mosquée.", [H("Sahîh al-Bukhârî 1196"), F("Al-Wajîz fî fiqh as-sunna, Badawî — Kitâb al-Hajj, p. 271")]),
        p("L’accès se fait généralement sur réservation : renseignez-vous auprès de votre groupe."),
      ],
    },
    {
      id: "salam",
      title: "Saluer le Prophète ﷺ",
      arabic: "السلام على النبي ﷺ",
      visual: "salam",
      summary: "Devant la tombe du Prophète ﷺ, on le salue, puis ses deux compagnons Abû Bakr et ‘Umar, sans élever la voix.",
      todo: [
        p("Al-Wajîz : saluez-le avec les formules qu’il utilisait pour saluer les gens d’al-Baqî‘, et saluez de même Abû Bakr et ‘Umar.", [F("Al-Wajîz fî fiqh as-sunna, Badawî — Kitâb al-Hajj, p. 270")]),
      ],
      notes: [
          p("« Certes, Allah et Ses Anges prient sur le Prophète ; ô vous qui croyez priez sur lui et adressez [lui] vos salutations. »", [Q("Coran 33:56")]),
          p("« Ne faites pas de ma tombe un lieu de fête. Invoquez plutôt des bénédictions sur moi, car vos bénédictions me parviennent où que vous soyez. »", [H("Sunan Abî Dâwûd 2042")]),
        ],
      avoid: [
        p("N’élevez pas la voix : « N’élevez pas vos voix au-dessus de la voix du Prophète. »", [Q("Coran 49:2")]),
        p("Al-Wajîz : éviter de mettre les mains sur la poitrine, de baisser la tête et de s’humilier devant la tombe, et d’implorer le secours du Prophète ﷺ : « n’invoquez donc personne avec Allah. »", [F("Al-Wajîz fî fiqh as-sunna, Badawî — Kitâb al-Hajj, p. 270"), Q("Coran 72:18")]),
      ],
    },
    {
      id: "quba",
      title: "La mosquée de Qubâ’",
      arabic: "مسجد قباء",
      visual: "quba",
      summary: "Al-Wajîz : il est recommandé à celui qui vient à Médine d’aller prier à la mosquée de Qubâ’, comme le faisait le Prophète ﷺ.",
      todo: [p("Le Prophète ﷺ s’y rendait chaque samedi, à pied ou monté, et y priait deux rak‘ât.", [H("Sahîh al-Bukhârî 1193")])],
      notes: [p("Celui qui se purifie chez lui puis vient prier à Qubâ’ obtient une récompense comparable à une ‘Umra.", [H("Sunan Ibn Mâjah 1412")])],
    },
    {
      id: "baqi",
      title: "Al-Baqî‘",
      arabic: "البقيع",
      visual: "baqi",
      summary: "Al-Wajîz : le cimetière des musulmans de Médine, où sont enterrés de nombreux Compagnons.",
      todo: [p("Saluez les défunts et invoquez Allah pour eux.", [H("Sahîh Muslim 975")])],
      avoid: [p("Al-Wajîz : il faut se garder de chercher la bénédiction auprès des tombes et d’implorer le secours de ceux qui y reposent.", [F("Al-Wajîz fî fiqh as-sunna, Badawî — Kitâb al-Hajj, p. 272")])],
      say: ["baqi"],
    },
    {
      id: "uhud",
      title: "Le mont Uhud",
      arabic: "جبل أحد",
      visual: "uhud",
      summary: "Al-Wajîz : au pied du mont Uhud sont enterrés environ soixante-dix martyrs de la bataille qui porte son nom.",
      todo: [p("Saluez les martyrs et invoquez Allah pour eux, comme pour tout défunt.", [H("Sahîh Muslim 975")])],
      notes: [p("En voyant Uhud, le Prophète ﷺ a dit : « Cette montagne nous aime et nous l’aimons. »", [H("Sahîh al-Bukhârî 1482")])],
      say: ["baqi"],
    },
  ],
};

// ----- ‘Umra ---------------------------------------------------------------------------------

export const UMRAH_BOOK: Book = {
  rite: "umrah",
  title: "‘Umra",
  arabic: "العمرة",
  chapters: [
    { id: "u-before", title: "Avant le départ", marker: "Préparer", steps: [preparation] },
    { id: "u-ihram", title: "Entrer dans le rite", marker: "Ihrâm", steps: [miqat, ihram, talbiyah, prohibitions] },
    { id: "u-tawaf", title: "Le Tawâf", marker: "Tawâf", steps: [haram, tawafPrep, tawaf, blackStone, ramal, prayer, zamzam] },
    { id: "u-sai", title: "Le Sa‘y", marker: "Sa‘y", steps: [sai] },
    {
      id: "u-end",
      title: "Clore la ‘Umra",
      marker: "Fin",
      steps: [hair, exitStep, {
        id: "complete",
        title: "‘Umra terminée",
        arabic: "تقبل الله",
        visual: "done",
        summary: "La ‘Umra est achevée ; conservez les enseignements et la gratitude.",
        todo: [
          p("Le compteur est une aide mémoire, pas une validation religieuse.", [H("Sahîh Muslim 1218")]),
          p("Vérifiez les actes accomplis ; le suivi local est une aide-mémoire et non un jugement de validité.", [H("Sahîh Muslim 1218")]),
        ],
        notes: [
          p("Une ‘Umra à une autre expie ce qui est entre elles.", [H("Sahîh al-Bukhârî 1773")]),
          p("Une ‘Umra accomplie en Ramadan équivaut à un Hajj.", [H("Sahîh al-Bukhârî 1782")]),
        ],
        say: ["acceptance"],
      }],
    },
    medinaChapter,
  ],
};

// ----- Hajj ----------------------------------------------------------------------------------

const WITH_HADY: HajjType[] = ["tamattu", "qiran"];

export const HAJJ_TYPE_LABELS: Record<HajjType, { title: string; arabic: string; short: string }> = {
  tamattu: { title: "Tamattu‘", arabic: "التمتع", short: "‘Umra, pause, puis Hajj" },
  qiran: { title: "Qirân", arabic: "القران", short: "‘Umra et Hajj, un seul ihrâm" },
  ifrad: { title: "Ifrâd", arabic: "الإفراد", short: "Le Hajj seul" },
};

export function hajjTypeGuidance(type: HajjType): string {
  if (type === "tamattu") return "Tamattu‘ : vous accomplissez d’abord la ‘Umra, sortez de l’ihrâm, puis entrez à nouveau en ihrâm pour le Hajj ; le hady (sacrifice) s’applique selon les conditions établies.";
  if (type === "qiran") return "Qirân : vous réunissez la ‘Umra et le Hajj dans un même ihrâm ; le hady s’applique selon les conditions établies.";
  return "Ifrâd : vous accomplissez le Hajj seul ; le sacrifice spécifique au Tamattu‘ ou au Qirân ne s’applique pas du seul fait de l’Ifrâd.";
}

const hajjIhram: Step = {
  ...ihram,
  notes: [p("Tamattu‘ : l’intention est celle de la ‘Umra. Qirân : ‘Umra et Hajj ensemble. Ifrâd : le Hajj seul.", [Q("Coran 2:196")])],
};

export const HAJJ_BOOK: Book = {
  rite: "hajj",
  title: "Hajj",
  arabic: "الحج",
  chapters: [
    {
      id: "h-types",
      title: "Choisir son Hajj",
      marker: "Type",
      steps: [{
        id: "types",
        title: "Les trois types de Hajj",
        arabic: "أنساك الحج",
        visual: "types",
        summary: "Tamattu‘, Qirân et Ifrâd sont trois formes distinctes.",
        todo: [
          p("Tamattu‘ : ‘Umra puis sortie de l’ihrâm avant le Hajj ; Qirân : ‘Umra et Hajj dans un même ihrâm ; Ifrâd : Hajj seul.", [Q("Coran 2:196")]),
          p("Le sacrifice s’applique notamment au Tamattu‘ et au Qirân selon les conditions ; demandez un avis qualifié si votre situation est particulière.", [Q("Coran 2:196"), D("Hady du Tamattu‘ et du Qirân : divergence juridique")], "DIVERGENCE JURIDIQUE"),
        ],
        notes: [p("Le Hajj accepté (mabrûr) n’a d’autre récompense que le Paradis.", [H("Sahîh al-Bukhârî 1773")])],
      }],
    },
    { id: "h-before", title: "Avant le 8 Dhul-Hijja", marker: "Ihrâm", steps: [preparation, miqat, hajjIhram, talbiyah, prohibitions] },
    {
      id: "h-arrival",
      title: "Arrivée à La Mecque",
      marker: "La Mecque",
      steps: [
        {
          id: "tamattu-umrah",
          title: "La ‘Umra du Tamattu‘",
          arabic: "عمرة التمتع",
          visual: "tawaf",
          summary: "Le pèlerin en Tamattu‘ accomplit une ‘Umra complète : Tawâf, Sa‘y, puis coupe des cheveux.",
          todo: [
            p("Accomplissez le Tawâf de la ‘Umra (sept tours), les deux rak‘ât, puis le Sa‘y (sept trajets).", [H("Sahîh Muslim 1218")]),
            p("Raccourcissez ou rasez les cheveux, puis sortez de l’ihrâm jusqu’au 8 Dhul-Hijja.", [Q("Coran 2:196"), H("Sahîh Muslim 1218")]),
          ],
          notes: [p("Le livre ‘Umra détaille chacune de ces étapes.")],
          tool: "tawaf",
          only: ["tamattu"],
        },
        {
          id: "qudum",
          title: "Tawâf d’arrivée (al-qudûm)",
          arabic: "طواف القدوم",
          visual: "tawaf",
          summary: "En Qirân et en Ifrâd, le pèlerin reste en ihrâm et accomplit à son arrivée le Tawâf d’arrivée.",
          todo: [
            p("Accomplissez sept tours, puis les deux rak‘ât, comme pour tout Tawâf. La première chose que fit le Prophète ﷺ en arrivant à La Mecque fut ses ablutions, puis le Tawâf.", [H("Sahîh Muslim 1218"), H("Sahîh al-Bukhârî 1614")]),
            p("Restez en ihrâm : il n’y a pas de coupe des cheveux à ce moment.", [H("Sahîh Muslim 1218")]),
          ],
          notes: [p("Le Prophète ﷺ et ceux de ses Compagnons qui avaient amené leur bête n’ont fait le sa‘y entre Safâ et Marwa qu’une seule fois, pour le Hajj et la ‘Umra.", [H("Sahîh Muslim 1215")])],
          tool: "tawaf",
          only: ["qiran", "ifrad"],
        },
      ],
    },
    {
      id: "h-mina",
      title: "8 Dhul-Hijja — Mina",
      marker: "8 · Mina",
      steps: [{
        id: "mina-8",
        title: "Jour de Tarwiya à Mina",
        arabic: "يوم التروية",
        visual: "mina",
        summary: "Le pèlerin rejoint Mina selon son programme et les dispositions de son rite.",
        todo: [
          p("Organisez la journée et la nuit selon les instructions officielles et votre encadrement.", [H("Sahîh Muslim 1218")]),
          p("Le 8 Dhul-Hijjah, rejoignez Mina selon l’organisation officielle et préparez ‘Arafât.", [H("Sahîh Muslim 1218")]),
          p("Le Prophète ﷺ y a prié Dhuhr, ‘Asr, Maghrib, ‘Isha et Fajr.", [H("Sahîh Muslim 1218")]),
        ],
        notes: [p("Tamattu‘ : entrez de nouveau en ihrâm pour le Hajj depuis votre lieu de séjour, avant de partir pour Mina.", [H("Sahîh Muslim 1218"), F("Al-Wajîz fî fiqh as-sunna, Badawî — Kitâb al-Hajj, p. 252")])],
        say: ["talbiyah"],
      }],
    },
    {
      id: "h-arafat",
      title: "9 Dhul-Hijja — ‘Arafa",
      marker: "9 · ‘Arafa",
      steps: [{
        id: "arafat-9",
        title: "La station à ‘Arafât",
        arabic: "الوقوف بعرفة",
        visual: "arafat",
        summary: "Le wuqûf est la station à ‘Arafât, moment central du Hajj.",
        todo: [
          p("Soyez présent à ‘Arafât pendant le temps du wuqûf, station centrale du Hajj, et invoquez Allah.", [H("Sahîh Muslim 1218")], "PILIER"),
          p("Le Prophète ﷺ y a prié Dhuhr et ‘Asr ensemble, puis s’est consacré à l’invocation jusqu’au coucher du soleil.", [H("Sahîh Muslim 1218")]),
        ],
        notes: [
          p("« Le Hajj, c’est ‘Arafa. »", [H("Sunan at-Tirmidhî 889")]),
          p("Il n’est pas de jour où Allah affranchit du Feu plus de serviteurs que le jour de ‘Arafa.", [H("Sahîh Muslim 1348")]),
        ],
        avoid: [p("« Toute la plaine de ‘Arafat est un lieu de station, mais évitez l’intérieur de ‘Uranah. »", [H("Sunan Ibn Mâjah 3012")])],
        say: ["arafa", "rabbana", "free"],
        duas: true,
      }],
    },
    {
      id: "h-muzdalifa",
      title: "Nuit de Muzdalifa",
      marker: "Muzdalifa",
      steps: [{
        id: "muzdalifah",
        title: "Nuit à Muzdalifa",
        arabic: "المزدلفة",
        visual: "muzdalifa",
        summary: "Le pèlerin se rend à Muzdalifah après ‘Arafât.",
        todo: [
          p("Après ‘Arafât, rejoignez Muzdalifah et suivez les horaires et consignes de sécurité de l’encadrement.", [H("Sahîh Muslim 1218")]),
          p("Le Prophète ﷺ y a prié Maghrib et ‘Isha ensemble, a passé la nuit, puis s’est tenu après Fajr pour invoquer jusqu’à la clarté.", [H("Sahîh Muslim 1218")]),
        ],
        notes: [p("Le cas normal est de rester à Muzdalifah après ‘Arafât. Une permission de départ nocturne est rapportée pour certaines personnes vulnérables afin d’éviter la foule ; ce n’est pas une règle générale.", [H("Sahîh Muslim 1218")])],
        say: ["mashar", "free"],
      }],
    },
    {
      id: "h-nahr",
      title: "10 Dhul-Hijja — Jour du sacrifice",
      marker: "10 · Nahr",
      steps: [
        {
          id: "nahr-10",
          title: "Les rites du jour",
          arabic: "يوم النحر",
          visual: "jamarat",
          summary: "Journée des rites majeurs : Jamrat al-‘Aqaba, sacrifice lorsqu’il s’applique, cheveux et Tawâf al-Ifâda.",
          todo: [
            p("Le 10, accomplissez les rites qui vous incombent selon votre type de Hajj et votre encadrement.", [H("Sahîh Muslim 1218")]),
            p("Respectez l’ordre et les conditions selon votre type de Hajj ; les détails juridiques peuvent diverger.", [H("Sahîh Muslim 1218"), D("Ordre des rites du 10 Dhul-Hijjah : divergence juridique")], "DIVERGENCE JURIDIQUE"),
          ],
          notes: [p("Interrogé ce jour-là sur un rite accompli avant un autre, le Prophète ﷺ a répondu : « Fais-le, il n’y a pas de mal. »", [H("Sahîh Muslim 1306")])],
        },
        {
          id: "aqaba",
          title: "Jamrat al-‘Aqaba",
          arabic: "جمرة العقبة",
          visual: "jamarat",
          summary: "Ce jour-là, seule la grande stèle est lapidée : sept cailloux, un à un.",
          todo: [
            p("Lancez sept cailloux, l’un après l’autre, en disant « Allâhu akbar » à chaque caillou.", [H("Sahîh Muslim 1218")]),
            p("Le Prophète ﷺ a récité la talbiya jusqu’à cette lapidation.", [H("Sahîh al-Bukhârî 1685")]),
          ],
          avoid: [p("Ne vous mettez pas en danger dans la foule ; suivez les horaires attribués à votre groupe.")],
          say: ["takbir"],
          tool: "jamarat",
        },
        {
          id: "sacrifice",
          title: "Le sacrifice (hady)",
          arabic: "الهدي",
          visual: "sacrifice",
          summary: "Le sacrifice incombe au pèlerin en Tamattu‘ ou en Qirân.",
          todo: [
            p("Le sacrifice s’applique notamment au Tamattu‘ et au Qirân selon les conditions ; demandez un avis qualifié si votre situation est particulière.", [Q("Coran 2:196"), D("Hady du Tamattu‘ et du Qirân : divergence juridique")], "DIVERGENCE JURIDIQUE"),
            p("Celui qui n’en trouve pas les moyens jeûne trois jours pendant le Hajj et sept à son retour.", [Q("Coran 2:196")]),
          ],
          notes: [p("Il est généralement organisé par coupon officiel : gardez votre reçu et l’heure annoncée.")],
          only: WITH_HADY,
        },
        { ...hair, id: "nahr-hair", summary: "Après la lapidation (et le sacrifice s’il vous incombe), l’homme rase ou raccourcit ; la femme raccourcit." },
        {
          id: "ifada",
          title: "Tawâf al-Ifâda",
          arabic: "طواف الإفاضة",
          visual: "ifada",
          summary: "Le Tawâf al-Ifâda est un pilier du Hajj.",
          todo: [
            p("Accomplissez sept tours, puis les deux rak‘ât.", [Q("Coran 22:29")], "PILIER"),
            p("Tamattu‘ : accomplissez ensuite le Sa‘y du Hajj. Qirân et Ifrâd : seulement si vous ne l’avez pas fait après le Tawâf d’arrivée.", [H("Sahîh Muslim 1218"), F("Fiqh : moment du Sa‘y du Hajj")]),
          ],
          notes: [
            p("‘Â’isha parfumait le Prophète ﷺ quand il sortait de l’ihrâm, avant le Tawâf autour de la Maison.", [H("Sahîh al-Bukhârî 1539")]),
            p("Al-Wajîz : le rapport conjugal après la lapidation de Jamrat al-‘Aqaba et avant le Tawâf al-Ifâda n’annule pas le Hajj, mais c’est un péché.", [F("Al-Wajîz fî fiqh as-sunna, Badawî — Kitâb al-Hajj, p. 259")]),
          ],
          tool: "tawaf",
        },
      ],
    },
    {
      id: "h-tashriq",
      title: "Les jours de Tashrîq",
      marker: "11–13 · Mina",
      steps: [
        {
          id: "tashriq-11",
          title: "11 Dhul-Hijja",
          arabic: "أيام التشريق",
          visual: "jamarat",
          summary: "Les trois Jamarât sont accomplies dans l’ordre.",
          todo: [
            p("Lapidez les trois Jamarât, sept cailloux chacune : la petite, puis la moyenne, puis la grande, aux horaires officiels.", [H("Sahîh Muslim 1299")]),
            p("Après la petite et la moyenne, arrêtez-vous face à la qibla pour invoquer longuement ; après la grande, partez sans vous arrêter.", [H("Sahîh al-Bukhârî 1751")]),
          ],
          notes: [
            p("Ces jours-là, le Prophète ﷺ a lapidé après le passage du soleil au zénith.", [H("Sahîh Muslim 1299")]),
            p("Le séjour nocturne à Mina est le principe pour les jours concernés ; les dispenses et leurs conséquences dépendent de la nécessité et des avis juridiques.", [H("Sahîh Muslim 1299")]),
          ],
          say: ["takbir", "free"],
          tool: "jamarat",
        },
        {
          id: "tashriq-12",
          title: "12 Dhul-Hijja",
          arabic: "اليوم الثاني عشر",
          visual: "jamarat",
          summary: "Le pèlerin peut partir après les rites du jour selon les conditions établies.",
          todo: [
            p("Respectez les horaires et ne quittez pas précipitamment avant d’avoir accompli ce qui vous incombe.", [H("Sahîh Muslim 1299"), D("Départ anticipé : fiqh comparé")], "DIVERGENCE JURIDIQUE"),
            p("Le 12, accomplissez les Jamarât ; le départ anticipé est soumis à des conditions.", [H("Sahîh Muslim 1299")]),
          ],
          notes: [p("« Ensuite, il n’y a pas de péché, pour qui se comporte en piété, à partir au bout de deux jours, à s’attarder non plus. »", [Q("Coran 2:203")])],
          say: ["takbir"],
          tool: "jamarat",
        },
        {
          id: "tashriq-13",
          title: "13 Dhul-Hijja — pour celui qui reste",
          arabic: "اليوم الثالث عشر",
          visual: "jamarat",
          summary: "Celui qui reste accomplit les rites du treizième jour.",
          todo: [
            p("Accomplissez les trois Jamarât si vous restez jusqu’au treizième.", [H("Sahîh Muslim 1299")]),
          ],
          say: ["takbir"],
          tool: "jamarat",
        },
      ],
    },
    {
      id: "h-farewell",
      title: "Le départ",
      marker: "Adieu",
      steps: [
        {
          id: "farewell",
          title: "Tawâf al-Wadâ‘ — le Tawâf d’adieu",
          arabic: "طواف الوداع",
          visual: "farewell",
          summary: "Il clôt le séjour à La Mecque, avec des exemptions et détails juridiques à vérifier selon les situations.",
          todo: [
            p("Accomplissez le Tawâf d’adieu lorsque vous quittez La Mecque, sauf exemption établie pour certaines personnes.", [H("Sahîh Muslim 1327"), D("Exemptions : divergence juridique")], "DIVERGENCE JURIDIQUE"),
          ],
          women: [p("Il a été allégé pour la femme qui a ses menstrues.", [H("Sahîh al-Bukhârî 1755")])],
          tool: "tawaf",
        },
        {
          id: "complete-hajj",
          title: "Hajj terminé",
          arabic: "حج مبرور",
          visual: "done",
          summary: "Le Hajj est achevé.",
          todo: [
            p("Le suivi local est une aide mémoire et ne remplace pas l’avis d’un guide qualifié.", [H("Sahîh Muslim 1218")]),
            p("Vérifiez votre programme avec l’encadrement avant le départ.", [H("Sahîh Muslim 1218")]),
          ],
          notes: [p("Le Hajj accepté (mabrûr) n’a d’autre récompense que le Paradis.", [H("Sahîh al-Bukhârî 1773")])],
          say: ["acceptance"],
        },
      ],
    },
    { ...medinaChapter, id: "h-medina" },
  ],
};

export const BOOKS = { umrah: UMRAH_BOOK, hajj: HAJJ_BOOK } as const;

export type BookPage = { step: Step; chapter: Chapter; chapterIndex: number; index: number };

/** Pages of a book, in reading order, for a Hajj type (all types when null). */
export function bookPages(book: Book, hajjType: HajjType | null): BookPage[] {
  const pages: BookPage[] = [];
  book.chapters.forEach((chapter, chapterIndex) => {
    for (const step of chapter.steps) {
      if (book.rite === "hajj" && hajjType && step.only && !step.only.includes(hajjType)) continue;
      pages.push({ step, chapter, chapterIndex, index: pages.length });
    }
  });
  return pages;
}

/** Every reference a page relies on, without duplicates. */
export function stepSources(step: Step): Source[] {
  const all = [
    ...step.todo, ...(step.notes ?? []), ...(step.men ?? []), ...(step.women ?? []),
    ...(step.avoid ?? []), ...(step.mistakes ?? []),
  ].flatMap((point) => point.sources ?? []);
  for (const difference of step.differences ?? []) {
    for (const view of difference.views) all.push(...view.evidences);
  }
  const seen = new Set<string>();
  return all.filter((source) => {
    const key = `${source.kind}|${source.reference}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
