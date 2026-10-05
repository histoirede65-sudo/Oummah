import { c, p, type LessonEntry } from "./types";

const W = "wajiz-taharah";

export const PURIFICATION_LESSONS: Record<string, LessonEntry> = {
  "water-impurities": {
    short: "L’eau de pluie, de mer, de source, de puits ou du robinet purifie. Elle ne devient impure que si une impureté en change la couleur, le goût ou l’odeur.",
    rules: [
      p("L’eau qui descend du ciel est pure et sert à se purifier.", "quran-25-48", "quran-8-11"),
      p("L’eau de mer purifie. Le Prophète ﷺ a dit : « Son eau est pure et ce qui y meurt est une nourriture licite. »", "abudawud-83"),
      p("Interrogé sur le puits de Budâ‘a, il a dit : « L’eau est pure et rien ne la rend impure. »", "abudawud-66"),
      p("Si une impureté change la couleur, le goût ou l’odeur de l’eau, elle devient impure : les savants sont unanimes sur ce point.", W),
      p("L’eau déjà utilisée pour les ablutions reste pure : le Prophète ﷺ a versé l’eau de ses ablutions sur Jâbir malade.", "bukhari-194"),
    ],
    cases: [
      c("L’eau du robinet convient-elle ?", "Oui. C’est de l’eau dans son état naturel ; elle purifie tant qu’aucune impureté n’en a changé la couleur, le goût ou l’odeur.", W),
      c("Une goutte d’urine est tombée dans un peu d’eau, sans rien changer. Puis-je l’utiliser ?", "Selon Al-Wajîz, oui, car l’eau n’a pas changé. Les shafi‘ites et les hanbalites considèrent qu’une petite quantité d’eau (moins de deux qullas) devient impure au simple contact. Par prudence, prenez une autre eau si vous en avez.", "abudawud-63", W),
      c("Je doute que l’eau soit pure. Que faire ?", "L’eau est pure à l’origine. Un simple doute, sans trace visible, ne la rend pas impure.", W),
    ],
    avoid: [
      "Refaire ses ablutions ou jeter une eau par simple crainte, sans aucun signe d’impureté.",
      "Utiliser une eau dont l’odeur, la couleur ou le goût a été changé par une impureté.",
    ],
    note: ["Les deux qullas sont une mesure ancienne. Leur conversion en litres varie selon les savants."],
  },

  najasat: {
    title: "Les impuretés à connaître",
    arabic: "النجاسات",
    chapter: "purification-water",
    aliases: ["najasa", "najassa", "impur", "urine", "sang", "chien", "porc", "madhy"],
    short: "Les impuretés (najâsât) sont des matières qu’il faut retirer du corps, des vêtements et du lieu de prière : principalement l’urine, les selles, le madhy, le sang des règles, la salive du chien, la viande de porc et la bête morte.",
    rules: [
      p("L’urine et les selles humaines sont impures. Ne pas se préserver de l’urine fait partie des causes du châtiment de la tombe.", "bukhari-218", "bukhari-220"),
      p("Le madhy, liquide transparent lié à l’excitation, est impur : on lave la partie intime et on refait le wudû’.", "bukhari-269"),
      p("Le sang des règles est impur : on le gratte, le frotte avec de l’eau puis on rince.", "bukhari-227"),
      p("Un récipient léché par un chien se lave sept fois, la première avec de la terre.", "muslim-279d"),
      p("La viande de porc, le sang répandu et la bête morte sont une souillure.", "quran-6-145"),
      p("La peau d’une bête morte devient pure une fois tannée.", "muslim-366"),
      p("Le corps du croyant n’est jamais impur, même en état de janâba.", "bukhari-283"),
    ],
    cases: [
      c("Le sperme est-il impur ?", "‘Â’isha grattait le sperme du vêtement du Prophète ﷺ qui priait ensuite avec. Pour les shafi‘ites et les hanbalites, il est pur ; pour les hanafites et les malikites, il est impur et se lave. Dans tous les cas, on le retire.", "muslim-288"),
      c("Les poissons et sauterelles morts sont-ils impurs ?", "Non : les bêtes mortes de la mer sont licites.", "abudawud-83"),
    ],
    avoid: [
      "Confondre l’état de janâba avec une impureté du corps : la personne en janâba peut être touchée et saluée.",
      "Laisser des traces d’urine sur soi par négligence.",
    ],
    sourceIds: [W],
  },

  wudu: {
    short: "Le wudû’ est la petite purification exigée pour la prière : on lave le visage, les bras jusqu’aux coudes, on passe les mains mouillées sur la tête, puis on lave les pieds jusqu’aux chevilles.",
    rules: [
      p("Aucune prière n’est acceptée sans purification.", "muslim-224"),
      p("Allah n’accepte pas la prière de celui qui a perdu ses ablutions tant qu’il ne les a pas refaites.", "bukhari-135"),
      p("Le Coran nomme les membres à purifier : le visage, les bras jusqu’aux coudes, la tête à essuyer, les pieds jusqu’aux chevilles.", "quran-5-6"),
      p("« La propreté est la moitié de la foi. »", "muslim-223"),
    ],
    steps: [
      p("Ayez l’intention de vous purifier, dans le cœur, sans la prononcer.", "bukhari-1"),
      p("Dites « Bismillâh ».", W),
      p("Lavez vos mains trois fois.", "muslim-226"),
      p("Rincez-vous la bouche, puis aspirez l’eau par le nez et rejetez-la, trois fois.", "muslim-226"),
      p("Lavez le visage trois fois, du haut du front jusqu’au menton et d’une oreille à l’autre.", "muslim-226", "quran-5-6"),
      p("Lavez le bras droit puis le gauche, des doigts jusqu’aux coudes compris, trois fois.", "muslim-226"),
      p("Passez vos mains mouillées sur la tête, de l’avant vers la nuque puis retour, et essuyez les oreilles.", "bukhari-185", W),
      p("Lavez le pied droit puis le gauche jusqu’aux chevilles comprises, trois fois, sans oublier les talons.", "muslim-226", "muslim-241"),
      p("Dites ensuite : « Ash-hadu an lâ ilâha illa-llâhu waḥdahu lâ sharîka lah, wa ash-hadu anna Muḥammadan ‘abduhu wa rasûluh. »", "muslim-234"),
    ],
    cases: [
      c("Laver chaque membre une seule fois suffit-il ?", "Oui. Le Prophète ﷺ a fait ses ablutions une fois, deux fois et trois fois. Trois fois est le plus complet.", "bukhari-157", "bukhari-158", "muslim-226"),
      c("Faut-il prononcer l’intention ?", "Non. L’intention est dans le cœur ; sa prononciation n’a pas été enseignée.", "bukhari-1", "scholar-ibn-baz-niyyah-prayer"),
      c("Mon vernis ou une colle empêche l’eau d’atteindre la peau.", "Retirez-le avant le wudû’. L’eau doit atteindre toute la surface : le Prophète ﷺ a renvoyé refaire ses ablutions un homme qui avait laissé sur son pied une tache sèche de la taille d’un ongle.", "muslim-243"),
    ],
    avoid: [
      "Laisser une partie sèche, surtout les talons, les coudes ou le bord du visage.",
      "Gaspiller l’eau : le Prophète ﷺ faisait ses ablutions avec environ un mudd (deux mains jointes remplies).",
      "Réciter des invocations particulières pour chaque membre : elles ne sont pas authentiques.",
    ],
    sourceIds: ["bukhari-201", W],
  },

  "wudu-obligations": {
    short: "Quatre gestes sont obligatoires par le Coran : laver le visage, laver les bras jusqu’aux coudes, essuyer la tête et laver les pieds jusqu’aux chevilles. S’y ajoutent l’intention et, selon plusieurs écoles, l’ordre et la continuité.",
    rules: [
      p("Laver le visage, laver les bras jusqu’aux coudes, essuyer la tête, laver les pieds jusqu’aux chevilles : ces quatre membres sont cités par le verset.", "quran-5-6"),
      p("L’intention est requise : « La récompense des actions dépend des intentions. »", "bukhari-1"),
      p("Chaque membre doit être entièrement atteint par l’eau. Une tache sèche oblige à reprendre.", "muslim-243", "muslim-241"),
      p("Le Prophète ﷺ a ordonné de refaire ablutions et prière à un homme qui avait laissé une partie sèche sur son pied : c’est la base de la continuité (ne pas laisser sécher un membre avant de passer au suivant).", "abudawud-175"),
      p("Le Prophète ﷺ a toujours suivi l’ordre du verset : visage, bras, tête, pieds.", "quran-5-6", "muslim-226"),
    ],
    cases: [
      c("J’ai oublié de laver un membre. Que faire ?", "Si vous vous en rendez compte peu après, lavez ce membre puis ceux qui le suivent. Si un long moment est passé, refaites le wudû’ en entier.", "muslim-243", "abudawud-175"),
      c("Le rinçage de la bouche et du nez est-il obligatoire ?", "Le Prophète ﷺ ne les a jamais délaissés. Les hanbalites les comptent parmi les obligations ; les autres écoles les jugent fortement recommandés. Ne les omettez pas.", "muslim-226"),
    ],
    avoid: ["Passer rapidement la main sur la tête sans eau, ou essuyer les pieds au lieu de les laver (sauf avec des khuff)."],
    note: ["L’intention est obligatoire pour les malikites, les shafi‘ites et les hanbalites. L’ordre est obligatoire pour les shafi‘ites et les hanbalites, la continuité pour les malikites et les hanbalites."],
    sourceIds: [W],
  },

  "wudu-sunnas": {
    short: "Des gestes de la Sunnah complètent le wudû’ : le siwâk, laver les mains au début, répéter trois fois, commencer par la droite, passer l’eau entre les doigts, l’invocation finale, puis prier deux rak‘ât.",
    rules: [
      p("Le Prophète ﷺ a dit : « Si cela n’avait pas été difficile pour mes fidèles ou pour les gens, je leur aurais ordonné de se nettoyer les dents avec le siwak avant chaque prière. »", "bukhari-887"),
      p("Le Prophète ﷺ aimait commencer par la droite dans sa purification.", "bukhari-168"),
      p("Laver trois fois est la Sunnah ; une ou deux fois est valable.", "muslim-226", "bukhari-157", "bukhari-158"),
      p("Passer l’eau entre les doigts et bien aspirer l’eau par le nez, sauf quand on jeûne.", "abudawud-142"),
      p("Économiser l’eau : un mudd suffisait au Prophète ﷺ.", "bukhari-201"),
      p("Après le wudû’, l’attestation de foi ouvre les huit portes du Paradis.", "muslim-234"),
      p("Prier deux rak‘ât après le wudû’, avec concentration, efface les péchés passés.", "muslim-226"),
    ],
    avoid: [
      "Dépasser trois fois par scrupule.",
      "Réciter des invocations inventées pour chaque membre.",
    ],
    sourceIds: [W],
  },

  "wudu-invalidators": {
    short: "Le wudû’ est annulé par ce qui sort des voies naturelles (urine, selles, gaz, madhy), par le sommeil profond et la perte de conscience. Un simple doute ne l’annule pas.",
    rules: [
      p("L’urine, les selles et les gaz annulent le wudû’.", "bukhari-135", W),
      p("Le madhy annule le wudû’ : on lave la partie intime et on refait les ablutions, sans ghusl.", "bukhari-269"),
      p("Le sommeil profond et la perte de conscience l’annulent ; la simple somnolence assise ne l’annule pas.", "muslim-376c", W),
      p("Celui qui doute : « Qu’il ne quitte pas la prière à moins d’entendre un son ou de sentir une odeur. »", "bukhari-137", "muslim-361"),
      p("Pour le toucher direct des parties intimes, deux hadiths authentiques semblent différer ; Al-Wajîz les concilie en retenant l’annulation. Les écoles divergent.", "abudawud-181", "abudawud-182", W),
      p("Le Prophète ﷺ a ordonné le wudû’ après la viande de chameau. Al-Wajîz et les hanbalites le rendent obligatoire ; la majorité le juge recommandé.", "muslim-360", W),
    ],
    cases: [
      c("J’ai un doute : mes ablutions sont-elles annulées ?", "Non. Si vous étiez sûr d’être en état de purification, un doute ne l’annule pas. Ne refaites le wudû’ que si vous êtes certain.", "muslim-361", "muslim-362"),
      c("Je me suis assoupi assis à la mosquée.", "Les Compagnons somnolaient assis puis priaient sans refaire leurs ablutions. Seul le sommeil où l’on perd conscience de ce qui nous entoure les annule.", "muslim-376c"),
      c("Le sang d’une coupure ou un vomissement annulent-ils le wudû’ ?", "Les hanafites et les hanbalites l’affirment lorsque la quantité est importante ; les malikites et les shafi‘ites ne le retiennent pas. Refaire le wudû’ dans ce cas est une précaution.", W),
    ],
    avoid: [
      "Refaire ses ablutions à chaque hésitation : c’est la porte des waswâs.",
      "Croire que fermer les yeux un instant annule le wudû’.",
    ],
    note: ["Les écoulements continus (incontinence, stomie) suivent une règle allégée : faire le wudû’ au moment de chaque prière."],
  },

  ghusl: {
    short: "Le ghusl consiste à faire couler l’eau sur tout le corps avec l’intention de se purifier. Le Prophète ﷺ commençait par laver ses mains et sa partie intime, faisait le wudû’, puis versait l’eau sur sa tête et sur tout son corps.",
    rules: [
      p("Le ghusl est obligatoire en état de janâba : « Et si vous êtes pollués junub, alors purifiez-vous (par un bain). »", "quran-5-6", "quran-4-43"),
      p("Ce qui est obligatoire : l’intention, et que l’eau atteigne tout le corps, cheveux et peau compris.", "bukhari-1", W),
      p("La femme n’a pas à défaire ses tresses : trois poignées d’eau sur la tête suffisent, si l’eau atteint les racines.", "muslim-330"),
      p("Le Prophète ﷺ faisait le ghusl avec un sâ‘ (environ quatre mudd) d’eau.", "bukhari-201"),
    ],
    steps: [
      p("Ayez l’intention, dans le cœur, de lever l’état d’impureté majeure.", "bukhari-1"),
      p("Lavez vos mains, puis lavez la partie intime avec la main gauche.", "bukhari-248", "bukhari-249"),
      p("Faites le wudû’ comme pour la prière.", "bukhari-248"),
      p("Passez vos doigts mouillés dans les racines des cheveux, puis versez trois poignées d’eau sur la tête.", "bukhari-248"),
      p("Versez l’eau sur tout le corps, en commençant par le côté droit.", "bukhari-248", "bukhari-168"),
      p("Lavez vos pieds en dernier, en vous décalant légèrement.", "bukhari-249"),
    ],
    cases: [
      c("Dois-je refaire le wudû’ après le ghusl pour prier ?", "Non, si vous l’avez fait au début du ghusl et que rien ne l’a annulé pendant le bain.", "bukhari-248", W),
      c("Le ghusl du vendredi est-il obligatoire ?", "Le Prophète ﷺ a dit : « Celui d’entre vous qui assiste à la prière du vendredi doit prendre un bain. » Et : « Prendre un bain le vendredi est obligatoire pour tout homme (musulman) ayant atteint la puberté. »", "bukhari-877", "bukhari-879"),
    ],
    avoid: [
      "Laisser des parties sèches : nombril, dessous des bras, arrière des oreilles, racines des cheveux.",
      "Gaspiller l’eau.",
    ],
    sourceIds: [W],
  },

  "ghusl-required": {
    short: "Le ghusl devient obligatoire après un rapport sexuel (même sans éjaculation), après l’émission de sperme (éveillé ou en rêve), et à la fin des règles ou des lochies.",
    rules: [
      p("Le rapport sexuel impose le ghusl, même sans éjaculation.", "muslim-349"),
      p("L’émission de sperme impose le ghusl, y compris après un rêve si l’on constate le liquide ; cela vaut pour l’homme comme pour la femme.", "bukhari-282"),
      p("La fin des règles impose le ghusl avant de reprendre la prière.", "bukhari-320"),
      p("La fin des lochies (nifâs) aussi.", W),
      p("Le madhy n’impose pas le ghusl, seulement le wudû’.", "bukhari-269"),
    ],
    cases: [
      c("J’ai rêvé mais je ne trouve aucune trace.", "Pas de ghusl : le Prophète ﷺ l’a lié au fait de voir le liquide.", "bukhari-282"),
      c("Je trouve une trace sans me souvenir d’un rêve.", "Si c’est du sperme, faites le ghusl. S’il s’agit de madhy, lavez la partie intime et faites le wudû’.", "bukhari-282", "bukhari-269"),
      c("Faut-il faire le ghusl en entrant en islam ?", "Le Prophète ﷺ l’a ordonné à Qays ibn ‘Âsim lors de sa conversion. Les écoles divergent entre obligation et recommandation.", "abudawud-355"),
    ],
    avoid: ["Retarder le ghusl au point de laisser passer l’heure d’une prière."],
    sourceIds: ["quran-5-6", "quran-4-43", W],
  },

  tayammum: {
    short: "Quand l’eau manque ou qu’on ne peut pas l’utiliser (maladie, danger), on frappe une seule fois la terre propre des mains, puis on essuie le visage et le dos des mains. Le tayammum remplace le wudû’ et le ghusl.",
    rules: [
      p("Le Coran le permet à celui qui ne trouve pas d’eau, ou qui est malade : « Recourez à une terre pure. »", "quran-4-43", "quran-5-6"),
      p("« La terre m’a été rendue pure et lieu de prière. »", "bukhari-335"),
      p("Il remplace aussi le ghusl : ‘Ammâr, en état de janâba, s’était roulé dans la poussière ; le Prophète ﷺ lui a montré qu’il suffisait d’essuyer le visage et les mains.", "bukhari-338"),
      p("Il est annulé par ce qui annule le wudû’, et par la découverte de l’eau.", "abudawud-332", W),
    ],
    steps: [
      p("Ayez l’intention de vous purifier et dites « Bismillâh ».", "bukhari-1", W),
      p("Frappez une fois la terre (sable, pierre, mur poussiéreux) du plat des mains.", "bukhari-338", "abudawud-327", "bukhari-337"),
      p("Soufflez légèrement sur vos mains.", "bukhari-338"),
      p("Essuyez le visage, puis le dos des mains.", "bukhari-341", "bukhari-343"),
    ],
    cases: [
      c("J’ai prié avec le tayammum, puis j’ai trouvé l’eau avant la fin de l’heure.", "Votre prière est valable. Deux Compagnons ont vécu ce cas ; le Prophète ﷺ a dit à celui qui n’avait pas refait sa prière : « Tu as suivi la sunna, et ta première prière te suffit. »", "abudawud-338"),
      c("Un seul tayammum suffit-il pour plusieurs prières ?", "Pour les hanafites, oui : il vaut comme le wudû’ tant qu’il n’est pas annulé. Pour les malikites, les shafi‘ites et les hanbalites, on le refait pour chaque prière obligatoire.", W),
      c("J’ai un pansement ou un plâtre.", "Lavez ce qui peut l’être et passez la main mouillée sur le pansement. Si l’eau est dangereuse pour vous, recourez au tayammum. Demandez conseil pour les cas complexes.", W),
    ],
    avoid: [
      "Faire le tayammum alors que l’eau est disponible et utilisable.",
      "Frapper sur une surface sale.",
    ],
  },

  khuff: {
    short: "Celui qui a mis ses khuff (chaussures montantes en cuir) en état d’ablution peut, quand il refait son wudû’, passer la main mouillée sur le dessus au lieu de laver ses pieds : un jour et une nuit pour le résident, trois jours et trois nuits pour le voyageur.",
    rules: [
      p("Condition : les avoir enfilés après un wudû’ complet. Al-Mughîra voulut retirer les khuff du Prophète ﷺ : « Il m’a ordonné de les laisser, car il les avait mis après avoir fait ses ablutions. »", "bukhari-206"),
      p("Durée : un jour et une nuit pour le résident, trois jours et trois nuits pour le voyageur.", "muslim-276a"),
      p("On essuie le dessus, pas le dessous.", "abudawud-162"),
      p("La janâba oblige à les retirer pour faire le ghusl.", "tirmidhi-96"),
    ],
    steps: [
      p("Faites un wudû’ complet, pieds lavés, puis enfilez vos khuff.", "bukhari-206"),
      p("Lors des ablutions suivantes, après la tête, passez une fois la main droite mouillée sur le dessus du pied droit, et la gauche sur le gauche.", "abudawud-162"),
    ],
    cases: [
      c("À partir de quand compte-t-on la durée ?", "Les écoles la comptent à partir de la première perte d’ablutions après les avoir enfilés ; d’autres savants, à partir du premier essuyage.", W),
      c("Et les chaussettes ?", "De nombreux savants permettent d’essuyer sur des chaussettes épaisses, d’autres le restreignent. Renseignez-vous auprès d’une personne de science.", W),
    ],
    avoid: ["Essuyer sur des khuff enfilés sans être en état de wudû’."],
    sourceIds: [W],
  },

  menstruation: {
    short: "Pendant ses règles, la femme ne prie pas et ne jeûne pas. Elle rattrape les jours de jeûne mais pas les prières. À la fin, elle fait le ghusl et reprend.",
    rules: [
      p("Elle ne prie pas et ne jeûne pas.", "bukhari-304"),
      p("Elle rattrape le jeûne mais pas la prière.", "muslim-335a", "muslim-335c"),
      p("Le rapport conjugal est interdit jusqu’à la purification ; tout le reste de l’intimité est permis.", "quran-2-222", "muslim-302", "muslim-293"),
      p("Elle accomplit tous les rites du Hajj, sauf le tawâf autour de la Ka‘ba.", "bukhari-305"),
      p("Le saignement d’une veine (istihâda) n’est pas des règles : la femme prie et fait le wudû’ pour chaque prière.", "bukhari-320", "bukhari-228"),
      p("Les pertes jaunâtres ou brunâtres après la purification ne comptent pas comme des règles.", "abudawud-307"),
    ],
    steps: [
      p("Arrêtez la prière et le jeûne dès l’apparition du sang des règles.", "bukhari-304"),
      p("Attendez la fin certaine : les pertes blanches ou l’assèchement complet.", W),
      p("Faites le ghusl et reprenez la prière à partir de l’heure en cours.", "bukhari-320"),
    ],
    cases: [
      c("Mes règles s’arrêtent avant l’aube en Ramadan, mais je fais le ghusl après.", "Jeûnez ce jour-là : le jeûne est valable même si le ghusl est fait après l’aube.", "bukhari-1926", W),
      c("Puis-je faire des invocations et du dhikr ?", "Oui, sans restriction.", W),
      c("Puis-je lire le Coran ?", "Les savants divergent. Beaucoup le permettent de mémoire, surtout pour ne pas oublier ou pour enseigner ; d’autres l’interdisent.", W),
    ],
    avoid: [
      "Rattraper les prières manquées pendant les règles.",
      "Reprendre la prière sans s’être assurée de la fin des règles.",
    ],
    note: ["Pour des cycles irréguliers ou un saignement qui se prolonge, exposez votre situation à une personne de science."],
    sensitive: true,
  },

  postpartum: {
    short: "Le nifâs est le saignement qui suit l’accouchement. Il suit les règles des menstrues ; il dure au plus quarante jours selon Al-Wajîz, et prend fin dès que la femme est pure, même plus tôt.",
    rules: [
      p("Pendant le nifâs, la femme ne prie pas et ne jeûne pas, comme pendant les règles.", W),
      p("Il n’y a pas de durée minimale : dès que le sang s’arrête, elle fait le ghusl et reprend.", W),
      p("Al-Wajîz retient quarante jours comme durée maximale.", W),
    ],
    steps: [
      p("Arrêtez prière et jeûne tant que le sang lié à l’accouchement coule.", W),
      p("Dès la purification, faites le ghusl et reprenez la prière.", W),
      p("Rattrapez les jours de jeûne manqués, pas les prières.", "muslim-335c"),
    ],
    cases: [
      c("Le sang s’arrête au vingtième jour.", "Faites le ghusl et reprenez : il n’y a pas à attendre quarante jours.", W),
      c("Le sang continue après quarante jours.", "Selon Al-Wajîz, au-delà de quarante jours ce n’est plus du nifâs : faites le ghusl et priez, sauf si cela coïncide avec vos règles habituelles.", W),
    ],
    avoid: ["Rester quarante jours sans prier alors que la purification est revenue."],
    note: ["Fausse couche, césarienne, saignement intermittent : ces cas demandent l’avis d’une personne de science."],
    sensitive: true,
  },

  "purification-doubt": {
    short: "La certitude n’est pas effacée par le doute. Si vous étiez sûr d’avoir fait le wudû’, un doute ne l’annule pas ; si vous étiez sûr de l’avoir perdu, un doute ne le rétablit pas.",
    rules: [
      p("Celui qui doute pendant la prière : « Qu’il ne quitte pas la prière à moins d’entendre un son ou de sentir une odeur. »", "bukhari-137", "muslim-361"),
      p("Celui qui ressent quelque chose dans son ventre et ne sait pas s’il a perdu ses ablutions ne quitte pas la mosquée sans certitude.", "muslim-362"),
    ],
    cases: [
      c("Je ne sais plus si j’ai fait le wudû’ après être allé aux toilettes.", "Vous êtes certain d’être allé aux toilettes et doutez du wudû’ : refaites-le.", W),
      c("Je doute d’avoir lavé un membre trois fois.", "Retenez le nombre le plus petit dont vous êtes sûr, puis passez à la suite. Si le doute survient après avoir fini, ne revenez pas en arrière.", W),
      c("Je doute sans arrêt.", "Ce sont des waswâs. Ignorez-les et ne recommencez pas : c’est ainsi qu’on s’en libère.", "bukhari-137"),
    ],
    avoid: ["Céder aux waswâs en recommençant ablutions ou prière à chaque hésitation."],
    sourceIds: [W],
  },

  "soiled-clothing": {
    short: "Le corps, les vêtements et le lieu de prière doivent être propres de toute impureté. On lave l’impureté jusqu’à ce qu’elle disparaisse ; il suffit d’asperger l’urine d’un nourrisson garçon.",
    rules: [
      p("Le vêtement doit être purifié : « Et tes vêtements, purifie-les. »", "quran-74-4"),
      p("Le sang des règles sur un vêtement : on le gratte, on le frotte avec de l’eau, on rince, puis on peut prier avec.", "bukhari-227", "muslim-291a"),
      p("Un sol souillé d’urine se purifie en y versant de l’eau.", "bukhari-220", "muslim-284a"),
      p("L’urine d’un nourrisson garçon qui ne mange pas encore se purifie par aspersion d’eau.", "bukhari-223"),
      p("Les sandales souillées se purifient en les frottant contre la terre.", "abudawud-385", "abudawud-386"),
      p("Un récipient léché par un chien se lave sept fois, dont la première avec de la terre.", "muslim-279a", "muslim-279d"),
    ],
    cases: [
      c("J’ai découvert une impureté sur mon vêtement après la prière.", "Votre prière est valable. Le Prophète ﷺ, informé pendant la prière que ses sandales étaient souillées, les a retirées et a poursuivi sans recommencer.", "abudawud-650"),
      c("Une tache reste après le lavage.", "Si l’impureté a été lavée et qu’il ne reste qu’une couleur difficile à enlever, cela ne pose pas de problème.", W),
      c("Faut-il laver l’urine d’une petite fille comme celle d’un garçon ?", "L’urine de la petite fille se lave ; l’allègement par aspersion concerne le nourrisson garçon.", "bukhari-223", W),
    ],
    avoid: ["Négliger les éclaboussures d’urine : c’est une cause du châtiment de la tombe."],
    sourceIds: ["bukhari-218", W],
  },
};
