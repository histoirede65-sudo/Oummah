import { rankDocuments } from "../engine/RelevanceScorer.ts";

type Case = {
  name: string;
  evidenceTerms: string[];
  queryTerms: string[];
  direct: string;
  indirect: string;
  unrelated: string;
};

const cases: Case[] = [
  {
    name: "mensonge",
    evidenceTerms: ["mensonge", "parole mensongère", "mentir"],
    queryTerms: ["vérité", "sincérité", "mensonge"],
    direct: "Prenez garde au mensonge : le mensonge mène au vice. Écartez-vous de la parole mensongère.",
    indirect: "Ka'b raconta l'histoire de l'expédition de Tabuk et la façon dont il fut pardonné après avoir dit la vérité.",
    unrelated: "Les croyants accomplissent la prière et donnent l'aumône.",
  },
  {
    name: "secret et confidence",
    evidenceTerms: ["secret", "confidence", "divulguer une confidence"],
    queryTerms: ["trahison", "discrétion", "secret"],
    direct: "Il est interdit de divulguer une confidence confiée comme un secret et il faut préserver le dépôt.",
    indirect: "Un homme voyagea puis raconta une histoire au sujet d'un dépôt confié dans une autre ville.",
    unrelated: "Le jeûne est prescrit aux croyants.",
  },
  {
    name: "moquerie",
    evidenceTerms: ["moquerie", "se moquer", "ridiculiser"],
    queryTerms: ["respect", "dignité", "moquerie"],
    direct: "Ne vous moquez pas les uns des autres et ne vous ridiculisez pas.",
    indirect: "Un peuple ancien fut puni après une longue histoire d'arrogance.",
    unrelated: "Accomplissez le pèlerinage pour Allah.",
  },
  {
    name: "soupçon",
    evidenceTerms: ["soupçon", "mauvais soupçon", "éviter les soupçons"],
    queryTerms: ["présomption", "juger", "soupçon"],
    direct: "Évitez beaucoup de soupçons, car certains soupçons sont un péché.",
    indirect: "Un homme demanda alors comment juger une affaire entre deux personnes.",
    unrelated: "Mangez de ce qui est licite et bon.",
  },
  {
    name: "gaspillage",
    evidenceTerms: ["gaspillage", "gaspiller", "dépense excessive"],
    queryTerms: ["modération", "dépense", "gaspillage"],
    direct: "Ne gaspillez pas et évitez toute dépense excessive.",
    indirect: "Un roi riche dépensa pour son peuple lors d'un voyage.",
    unrelated: "Soyez constants dans la prière.",
  },
  {
    name: "corruption et pot-de-vin",
    evidenceTerms: ["pot de vin", "corruption", "acheter un jugement"],
    queryTerms: ["justice", "argent illicite", "corruption"],
    direct: "Il est interdit de verser un pot-de-vin pour acheter un jugement ou consommer injustement les biens d'autrui.",
    indirect: "Un gouverneur rencontra un commerçant au cours d'un long voyage.",
    unrelated: "Le Paradis est préparé pour les pieux.",
  },
  {
    name: "orphelins",
    evidenceTerms: ["biens des orphelins", "orphelin", "consommer injustement"],
    queryTerms: ["protection", "tutelle", "orphelin"],
    direct: "Ne consommez pas injustement les biens des orphelins et rendez-leur leurs biens.",
    indirect: "Un enfant grandit dans une famille pieuse après la mort de son père.",
    unrelated: "Mentionnez Allah matin et soir.",
  },
  {
    name: "réconciliation",
    evidenceTerms: ["réconciliation", "réconcilier", "faire la paix"],
    queryTerms: ["conflit", "paix", "réconciliation"],
    direct: "Réconciliez les croyants en conflit et faites la paix avec justice.",
    indirect: "Deux tribus se rencontrèrent après une longue expédition.",
    unrelated: "Le pèlerinage a lieu en des mois connus.",
  },
  {
    name: "gratitude",
    evidenceTerms: ["gratitude", "remercier", "reconnaître les bienfaits"],
    queryTerms: ["bienfait", "reconnaissance", "gratitude"],
    direct: "Remerciez Allah et reconnaissez Ses bienfaits; si vous êtes reconnaissants, le bien augmente.",
    indirect: "Un prophète raconta l'histoire d'un peuple ayant reçu de nombreux bienfaits.",
    unrelated: "Respectez le délai de viduité.",
  },
  {
    name: "justice dans le témoignage",
    evidenceTerms: ["témoignage juste", "témoigner avec justice", "cacher le témoignage"],
    queryTerms: ["justice", "témoignage", "vérité"],
    direct: "Témoignez avec justice et ne cachez pas le témoignage.",
    indirect: "Un juge interrogea plusieurs témoins dans une histoire ancienne.",
    unrelated: "La nuit du destin vaut mieux que mille mois.",
  },
  {
    name: "dette",
    evidenceTerms: ["dette", "rembourser la dette", "débiteur"],
    queryTerms: ["créancier", "échéance", "dette"],
    direct: "Écrivez la dette, accordez un délai au débiteur en difficulté et remboursez ce que vous devez.",
    indirect: "Un marchand voyagea et rencontra un débiteur dans une ville lointaine.",
    unrelated: "Les anges glorifient leur Seigneur.",
  },
  {
    name: "voisin",
    evidenceTerms: ["voisin", "ne pas nuire au voisin", "droits du voisin"],
    queryTerms: ["bienfaisance", "proximité", "voisin"],
    direct: "Faites du bien au voisin et ne nuisez pas à votre voisin.",
    indirect: "Un compagnon raconta qu'il avait un voisin pendant un voyage.",
    unrelated: "Le mois de Ramadan est celui du Coran.",
  },
  {
    name: "pudeur",
    evidenceTerms: ["pudeur", "baisser le regard", "préserver la chasteté"],
    queryTerms: ["modestie", "regard", "pudeur"],
    direct: "Baissez le regard, préservez la chasteté; la pudeur fait partie de la foi.",
    indirect: "Une personne vertueuse marcha avec modestie dans une histoire.",
    unrelated: "Le commerce est permis et l'usure interdite.",
  },
  {
    name: "parents",
    evidenceTerms: ["parents", "bienfaisance envers les parents", "ne pas dire ouf"],
    queryTerms: ["mère", "père", "parents"],
    direct: "Soyez bienfaisants envers les parents et ne leur dites pas même ouf.",
    indirect: "Un homme raconta un voyage entrepris avec son père.",
    unrelated: "Les croyants se consultent entre eux.",
  },
  {
    name: "amanah",
    evidenceTerms: ["dépôt", "rendre les dépôts", "trahir la confiance"],
    queryTerms: ["confiance", "responsabilité", "dépôt"],
    direct: "Rendez les dépôts à leurs ayants droit et ne trahissez pas la confiance.",
    indirect: "Un récit relate qu'un homme porta un objet durant une expédition.",
    unrelated: "Jeûnez afin d'atteindre la piété.",
  },
  {
    name: "fréquentations",
    evidenceTerms: ["bonne compagnie", "mauvais compagnon", "choisir ses amis"],
    queryTerms: ["ami", "compagnie", "fréquentation"],
    direct: "Choisissez une bonne compagnie; le bon compagnon est comme le vendeur de musc et le mauvais comme le forgeron.",
    indirect: "Un voyageur rencontra plusieurs amis au marché.",
    unrelated: "Allah a créé les cieux et la terre.",
  },
  {
    name: "patience",
    evidenceTerms: ["patience", "patienter dans l'épreuve", "endurants"],
    queryTerms: ["épreuve", "sabr", "patience"],
    direct: "Soyez patients dans l'épreuve; Allah est avec les endurants.",
    indirect: "Un peuple traversa une longue épreuve racontée en détail.",
    unrelated: "Donnez la mesure et le poids exacts.",
  },
  {
    name: "repentir",
    evidenceTerms: ["repentir", "revenir à Allah", "pardon des péchés"],
    queryTerms: ["miséricorde", "péché", "repentir"],
    direct: "Revenez à Allah par un repentir sincère et ne désespérez pas du pardon des péchés.",
    indirect: "Un homme pécheur voyagea puis son histoire fut racontée.",
    unrelated: "Les héritiers ont des parts déterminées.",
  },
  {
    name: "colère",
    evidenceTerms: ["colère", "maîtriser la colère", "ne te mets pas en colère"],
    queryTerms: ["pardon", "douceur", "colère"],
    direct: "Maîtrisez votre colère, pardonnez et ne te mets pas en colère.",
    indirect: "Un homme en colère participa à une longue bataille.",
    unrelated: "Le divorce est permis deux fois.",
  },
  {
    name: "orgueil",
    evidenceTerms: ["orgueil", "arrogance", "mépriser les gens"],
    queryTerms: ["humilité", "modestie", "orgueil"],
    direct: "Ne marchez pas avec arrogance; l'orgueil consiste à rejeter la vérité et mépriser les gens.",
    indirect: "Un roi puissant fut mentionné dans une longue histoire.",
    unrelated: "Acquittez la zakat sur les biens.",
  },
  {
    name: "espionnage et vie privée",
    evidenceTerms: ["espionner", "vie privée", "chercher les défauts"],
    queryTerms: ["secret", "soupçon", "espionnage"],
    direct: "N'espionnez pas et ne cherchez pas les défauts cachés des gens.",
    indirect: "Un voyageur observa de loin une maison au cours d'un récit ancien.",
    unrelated: "Rompez le jeûne lorsque le soleil se couche.",
  },
  {
    name: "salaire du travailleur",
    evidenceTerms: ["salaire", "travailleur", "payer sans retard"],
    queryTerms: ["employeur", "justice", "rémunération"],
    direct: "Payez le travailleur sans retard et ne retenez pas injustement son salaire.",
    indirect: "Un artisan voyagea avec son employeur pendant plusieurs années.",
    unrelated: "La prière de l'aube est attestée.",
  },
  {
    name: "serment",
    evidenceTerms: ["serment", "respecter le serment", "expiation du serment"],
    queryTerms: ["jurer", "engagement", "serment"],
    direct: "Préservez vos serments et accomplissez l'expiation prévue lorsqu'un serment est rompu.",
    indirect: "Un homme jura durant une histoire de voyage puis rencontra son peuple.",
    unrelated: "Les montagnes glorifient leur Seigneur.",
  },
  {
    name: "consultation",
    evidenceTerms: ["consultation", "se consulter", "prendre conseil"],
    queryTerms: ["shura", "décision", "consultation"],
    direct: "Consultez-vous dans vos affaires et prenez conseil avant la décision.",
    indirect: "Un chef raconta une longue réunion entre plusieurs tribus.",
    unrelated: "Le bétail vous est rendu licite.",
  },
  {
    name: "douceur envers les animaux",
    evidenceTerms: ["animaux", "bien traiter un animal", "cruauté envers les animaux"],
    queryTerms: ["miséricorde", "créature", "animal"],
    direct: "Traitez les animaux avec bonté et ne leur infligez aucune cruauté.",
    indirect: "Un cavalier traversa le désert avec sa monture dans un long récit.",
    unrelated: "Établissez les rangs pour la prière.",
  },
  {
    name: "racisme et tribalisme",
    evidenceTerms: ["racisme", "tribalisme", "supériorité par l'origine"],
    queryTerms: ["peuples", "tribus", "égalité"],
    direct: "Aucune origine ne justifie la supériorité; les peuples et tribus doivent se connaître sans racisme.",
    indirect: "Une tribu ancienne connut une succession de rois puissants.",
    unrelated: "L'eau pure sert à la purification.",
  },
  {
    name: "modération alimentaire",
    evidenceTerms: ["manger sans excès", "modération alimentaire", "ne pas dépasser la mesure"],
    queryTerms: ["nourriture", "excès", "modération"],
    direct: "Mangez et buvez sans excès et ne dépassez pas la mesure.",
    indirect: "Un banquet fut servi lors du voyage d'un roi.",
    unrelated: "Soyez témoins lors du divorce.",
  },
  {
    name: "connaissance",
    evidenceTerms: ["rechercher la connaissance", "savoir utile", "apprendre"],
    queryTerms: ["science", "enseignement", "connaissance"],
    direct: "Recherchez la connaissance utile, apprenez et transmettez avec fidélité.",
    indirect: "Un savant voyagea longtemps et rencontra de nombreux élèves.",
    unrelated: "Les héritiers reçoivent leurs parts.",
  },
  {
    name: "réparer un tort",
    evidenceTerms: ["réparer le tort", "rendre le droit", "demander pardon à la victime"],
    queryTerms: ["injustice", "préjudice", "réparation"],
    direct: "Rendez le droit à la victime, réparez le tort et demandez-lui pardon.",
    indirect: "Un homme injuste fut mentionné dans une histoire ancienne.",
    unrelated: "La nuit est un vêtement.",
  },
  {
    name: "divorce équitable",
    evidenceTerms: ["divorce", "se séparer convenablement", "ne pas nuire au conjoint"],
    queryTerms: ["séparation", "justice", "divorce"],
    direct: "Lors du divorce, séparez-vous convenablement et ne retenez pas le conjoint pour lui nuire.",
    indirect: "Une famille voyagea après une longue dispute conjugale.",
    unrelated: "Les étoiles guident les voyageurs.",
  },
  {
    name: "héritage",
    evidenceTerms: ["parts d'héritage", "héritiers", "ne pas détourner la succession"],
    queryTerms: ["succession", "legs", "héritage"],
    direct: "Respectez les parts d'héritage des héritiers et ne détournez pas la succession.",
    indirect: "Un riche marchand mourut au terme d'une longue histoire familiale.",
    unrelated: "Les croyants jeûnent durant Ramadan.",
  },
  {
    name: "concentration dans la prière",
    evidenceTerms: ["recueillement dans la prière", "khushu", "ne pas distraire la prière"],
    queryTerms: ["prière", "concentration", "recueillement"],
    direct: "Priez avec recueillement et écartez ce qui distrait la prière.",
    indirect: "Un compagnon voyagea pour apprendre les horaires de prière.",
    unrelated: "Honorez vos contrats commerciaux.",
  },
  {
    name: "jeûne et maladie",
    evidenceTerms: ["malade pendant le jeûne", "reporter le jeûne", "jours à rattraper"],
    queryTerms: ["ramadan", "maladie", "jeûne"],
    direct: "La personne malade peut reporter le jeûne et rattraper les jours selon la règle applicable.",
    indirect: "Un malade raconta son voyage pendant le mois de Ramadan.",
    unrelated: "Ne cachez pas le témoignage.",
  },
  {
    name: "commerce honnête",
    evidenceTerms: ["commerce honnête", "ne pas tromper", "défaut de la marchandise"],
    queryTerms: ["vente", "marchand", "honnêteté"],
    direct: "Ne trompez pas dans la vente et indiquez clairement le défaut de la marchandise.",
    indirect: "Un marchand parcourut plusieurs marchés dans une histoire ancienne.",
    unrelated: "La patience accompagne la prière.",
  },
  {
    name: "protection de l'environnement",
    evidenceTerms: ["ne pas corrompre la terre", "préserver la création", "gaspiller les ressources"],
    queryTerms: ["terre", "création", "ressources"],
    direct: "Ne semez pas la corruption sur la terre et ne gaspillez pas les ressources confiées.",
    indirect: "Un peuple ancien habitait une terre fertile avant une longue migration.",
    unrelated: "L'appel à la prière annonce son heure.",
  },
  {
    name: "excuses sincères",
    evidenceTerms: ["présenter ses excuses", "reconnaître sa faute", "réparer le préjudice"],
    queryTerms: ["faute", "pardon", "excuse"],
    direct: "Reconnaissez votre faute, présentez des excuses sincères et réparez le préjudice.",
    indirect: "Un homme raconta une faute ancienne au terme d'un voyage.",
    unrelated: "La zakat purifie les biens.",
  },
  {
    name: "tenir une confidence",
    evidenceTerms: ["confidence", "secret confié", "ne pas divulguer"],
    queryTerms: ["discrétion", "dépôt", "secret"],
    direct: "Une confidence est un dépôt: ne la divulguez pas sans droit.",
    indirect: "Une personne reçut une lettre secrète au cours d'un récit historique.",
    unrelated: "Le pèlerinage rassemble les croyants.",
  },
  {
    name: "équité entre enfants",
    evidenceTerms: ["équité entre les enfants", "cadeaux aux enfants", "ne pas favoriser un enfant"],
    queryTerms: ["parents", "justice", "enfants"],
    direct: "Soyez équitables entre vos enfants et ne favorisez pas injustement l'un d'eux dans les cadeaux.",
    indirect: "Un père voyagea avec l'un de ses enfants pendant plusieurs années.",
    unrelated: "Les ablutions précèdent la prière.",
  },
  {
    name: "répondre au mal par le bien",
    evidenceTerms: ["repousser le mal par le bien", "répondre avec bonté", "ne pas rendre l'injustice"],
    queryTerms: ["pardon", "bien", "mal"],
    direct: "Repoussez le mal par ce qui est meilleur et répondez avec bonté sans commettre d'injustice.",
    indirect: "Deux ennemis se rencontrèrent après une longue bataille.",
    unrelated: "Le jeûne commence à l'aube.",
  },
  {
    name: "protéger l'honneur",
    evidenceTerms: ["protéger l'honneur", "accusation sans preuve", "diffamer"],
    queryTerms: ["réputation", "témoignage", "honneur"],
    direct: "Ne diffamez personne et n'accusez pas sans preuve; protégez l'honneur des gens.",
    indirect: "Un accusé fut mentionné dans le récit d'une ancienne cité.",
    unrelated: "Accomplissez la circumambulation autour de la Maison.",
  },
];

for (const testCase of cases) {
  const candidates = [
    { id: "direct", text: testCase.direct, reference: "preuve directe" },
    { id: "indirect", text: testCase.indirect, reference: "récit historique 1:1-12" },
    { id: "unrelated", text: testCase.unrelated, reference: "autre sujet" },
  ];
  const ranked = rankDocuments(
    candidates,
    (candidate) => ({
      canonicalName: testCase.evidenceTerms[0],
      queryTerms: testCase.queryTerms,
      evidenceTerms: testCase.evidenceTerms,
      relatedTerms: testCase.queryTerms.filter((term) =>
        !testCase.evidenceTerms.includes(term)
      ),
      reference: candidate.reference,
      text: candidate.text,
      kind: "other",
      retrievalHits: candidate.id === "direct" ? 2 : 1,
    }),
    0,
    3,
    true,
  );

  if (ranked[0]?.item.id !== "direct") {
    throw new Error(
      `${testCase.name}: la preuve directe n'est pas première: ${JSON.stringify(ranked)}`,
    );
  }
  const directScore = ranked.find((entry) => entry.item.id === "direct")?.score ?? 0;
  const indirectScore = ranked.find((entry) => entry.item.id === "indirect")?.score ?? 0;
  const unrelatedScore = ranked.find((entry) => entry.item.id === "unrelated")?.score ?? 0;
  if (directScore < indirectScore + 0.20) {
    throw new Error(
      `${testCase.name}: marge directe insuffisante (${directScore} vs ${indirectScore})`,
    );
  }
  if (unrelatedScore >= 0.34) {
    throw new Error(
      `${testCase.name}: source sans rapport trop élevée (${unrelatedScore})`,
    );
  }
}

console.log(`universal_relevance_regression_test: OK (${cases.length} thèmes)`);
