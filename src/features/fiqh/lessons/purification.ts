import { c, p, type LessonEntry } from "./types";

export const PURIFICATION_LESSONS: Record<string, LessonEntry> = {
  "water-impurities": {
    short: "Al-Wajîz : toute eau tombée du ciel ou sortie de la terre purifie. Elle ne devient impure que si une impureté qui y tombe la change.",
    rules: [
      p("L’eau qui descend du ciel est pure et sert à se purifier.", "quran-25-48", "quran-8-11"),
      p("L’eau de mer purifie. Le Prophète ﷺ a dit : « Son eau est pure et ce qui y meurt est une nourriture licite. »", "abudawud-83"),
      p("Interrogé sur le puits de Budâ‘a, il a dit : « L’eau est pure et rien ne la rend impure. »", "abudawud-66"),
      p("Al-Wajîz : on ne juge pas l’eau impure, même si une impureté y tombe, sauf si elle en est changée.", "wajiz-taharah"),
      p("Al-Wajîz : l’eau reste purifiante même si une chose pure s’y mêle, tant qu’elle reste de l’eau, comme l’eau et le jujubier du lavage du défunt.", "wajiz-taharah"),
      p("L’eau déjà utilisée pour les ablutions reste pure : le Prophète ﷺ a versé l’eau de ses ablutions sur Jâbir malade.", "bukhari-194"),
    ],
    cases: [
      c("L’eau du robinet convient-elle ?", "Al-Wajîz : toute eau tombée du ciel ou sortie de la terre est purifiante, tant qu’une impureté ne l’a pas changée.", "wajiz-taharah"),
      c("Une goutte d’urine est tombée dans un peu d’eau, sans rien changer. Puis-je l’utiliser ?", "Al-Wajîz : on ne juge pas l’eau impure tant que l’impureté ne l’a pas changée.", "wajiz-taharah"),
      c("Je doute que l’eau soit pure. Que faire ?", "Al-Wajîz : le principe des choses est la licéité et la pureté ; celui qui affirme qu’une chose est impure doit en apporter la preuve.", "wajiz-taharah"),
    ],
  },

  najasat: {
    title: "Les impuretés à connaître",
    arabic: "النجاسات",
    chapter: "purification-water",
    aliases: ["najasa", "najassa", "impur", "urine", "sang", "chien", "porc", "madhy"],
    sourceIds: ["wajiz-taharah"],
    short: "Al-Wajîz : le principe des choses est la pureté. Ce dont l’impureté est prouvée : l’urine et les selles humaines, le madhy et le wady, le crottin des animaux qu’on ne mange pas, le sang des règles, la salive du chien et la bête morte.",
    rules: [
      p("L’urine et les selles humaines sont impures. Ne pas se préserver de l’urine fait partie des causes du châtiment de la tombe.", "bukhari-218", "bukhari-220"),
      p("Le madhy, liquide transparent lié à l’excitation, est impur : on lave la partie intime et on refait le wudû’.", "bukhari-269"),
      p("Le sang des règles est impur : on le gratte, le frotte avec de l’eau puis on rince.", "bukhari-227"),
      p("Un récipient léché par un chien se lave sept fois, la première avec de la terre.", "muslim-279d"),
      p("La viande de porc, le sang répandu et la bête morte sont une souillure.", "quran-6-145"),
      p("Al-Wajîz : la bête morte est impure, sauf les poissons et les sauterelles, les petites bêtes sans sang qui coule (mouches, fourmis, abeilles), et les os, cornes, ongles, poils et plumes de la bête morte, qui restent purs.", "wajiz-taharah"),
      p("La peau d’une bête morte devient pure une fois tannée.", "muslim-366"),
      p("Le corps du croyant n’est jamais impur, même en état de janâba.", "bukhari-283"),
    ],
    cases: [
      c("Le sperme est-il impur ?", "‘Â’isha grattait le sperme du vêtement du Prophète ﷺ, qui priait ensuite avec.", "muslim-288"),
      c("Les poissons et sauterelles morts sont-ils impurs ?", "Non : les bêtes mortes de la mer sont licites.", "abudawud-83"),
    ],
  },

  wudu: {
    sourceIds: ["bukhari-201", "wajiz-taharah"],
    short: "Le wudû’ est la petite purification exigée pour la prière : on lave le visage, les bras jusqu’aux coudes, on passe les mains mouillées sur la tête, puis on lave les pieds jusqu’aux chevilles.",
    rules: [
      p("Aucune prière n’est acceptée sans purification.", "muslim-224"),
      p("Allah n’accepte pas la prière de celui qui a perdu ses ablutions tant qu’il ne les a pas refaites.", "bukhari-135"),
      p("Le Coran nomme les membres à purifier : le visage, les bras jusqu’aux coudes, la tête à essuyer, les pieds jusqu’aux chevilles.", "quran-5-6"),
      p("« La propreté est la moitié de la foi. »", "muslim-223"),
      p("Al-Wajîz : rien d’authentique n’est rapporté comme invocation pendant le wudû’.", "wajiz-taharah"),
    ],
    steps: [
      p("Ayez l’intention de vous purifier, dans le cœur, sans la prononcer.", "bukhari-1"),
      p("Dites « Bismillâh » : al-Wajîz compte la basmala parmi les conditions du wudû’.", "wajiz-taharah"),
      p("Lavez vos mains trois fois.", "muslim-226"),
      p("Rincez-vous la bouche, puis aspirez l’eau par le nez et rejetez-la, trois fois.", "muslim-226"),
      p("Lavez le visage trois fois.", "muslim-226", "quran-5-6"),
      p("Lavez le bras droit puis le gauche, jusqu’aux coudes, trois fois.", "muslim-226"),
      p("Passez vos mains mouillées sur toute la tête, de l’avant vers la nuque puis retour ; al-Wajîz compte les oreilles avec la tête.", "bukhari-185", "wajiz-taharah"),
      p("Lavez le pied droit puis le gauche jusqu’aux chevilles, trois fois, sans oublier les talons.", "muslim-226", "muslim-241"),
      p("Dites ensuite : « Ash-hadu an lâ ilâha illa-llâhu waḥdahu lâ sharîka lah, wa ash-hadu anna Muḥammadan ‘abduhu wa rasûluh. »", "muslim-234"),
    ],
    cases: [
      c("Laver chaque membre une seule fois suffit-il ?", "Oui. Le Prophète ﷺ a fait ses ablutions une fois, deux fois et trois fois.", "bukhari-157", "bukhari-158", "muslim-226"),
      c("Faut-il prononcer l’intention ?", "Non. Al-Wajîz : sa prononciation n’est pas établie du Prophète ﷺ. Ibn Bâz dit aussi que l’intention est dans le cœur.", "wajiz-taharah", "scholar-ibn-baz-niyyah-prayer"),
      c("Mon vernis ou une colle empêche l’eau d’atteindre la peau.", "Le Prophète ﷺ a renvoyé refaire ses ablutions un homme qui avait laissé sur son pied une partie sèche de la taille d’un ongle.", "muslim-243"),
    ],
  },

  "wudu-obligations": {
    sourceIds: ["wajiz-taharah"],
    short: "Al-Wajîz : trois conditions (l’intention, la basmala, la continuité) et des obligations : laver le visage avec le rinçage de la bouche et du nez, laver les bras jusqu’aux coudes, essuyer toute la tête avec les oreilles, laver les pieds jusqu’aux chevilles, passer l’eau dans la barbe et entre les doigts.",
    rules: [
      p("Laver le visage, laver les bras jusqu’aux coudes, essuyer la tête, laver les pieds jusqu’aux chevilles : ces quatre membres sont cités par le verset.", "quran-5-6"),
      p("L’intention est requise : « La récompense des actions dépend des intentions. »", "bukhari-1"),
      p("Chaque membre doit être entièrement atteint par l’eau.", "muslim-243", "muslim-241"),
      p("Al-Wajîz : le rinçage de la bouche et du nez fait partie du lavage du visage, car le Prophète ﷺ ne les a jamais délaissés.", "wajiz-taharah"),
      p("Al-Wajîz : l’ordre est une Sunnah : c’était la manière habituelle du Prophète ﷺ, mais il est authentique qu’il a rincé une fois la bouche et le nez après les bras.", "wajiz-taharah"),
    ],
    cases: [
      c("J’ai laissé une partie sèche.", "Le Prophète ﷺ a vu un homme prier avec, sur le pied, une partie sèche ; il lui a ordonné de refaire le wudû’ et la prière. Al-Wajîz en tire la condition de continuité.", "abudawud-175", "wajiz-taharah"),
    ],
  },

  "wudu-sunnas": {
    sourceIds: ["wajiz-taharah"],
    short: "Al-Wajîz compte parmi les sunnas du wudû’ : le siwâk, laver les mains trois fois au début, rincer la bouche et le nez d’une même poignée, bien aspirer l’eau sauf en jeûnant, commencer par la droite, frotter, laver trois fois, l’ordre, l’invocation finale et deux rak‘ât.",
    rules: [
      p("Le Prophète ﷺ a dit : « Si cela n’avait pas été difficile pour mes fidèles ou pour les gens, je leur aurais ordonné de se nettoyer les dents avec le siwak avant chaque prière. »", "bukhari-887"),
      p("Le Prophète ﷺ aimait commencer par la droite dans sa purification.", "bukhari-168"),
      p("Laver trois fois est la Sunnah ; une ou deux fois est valable.", "muslim-226", "bukhari-157", "bukhari-158"),
      p("Passer l’eau entre les doigts et bien aspirer l’eau par le nez, sauf quand on jeûne.", "abudawud-142"),
      p("Économiser l’eau : un mudd suffisait au Prophète ﷺ.", "bukhari-201"),
      p("Après le wudû’, l’attestation de foi ouvre les huit portes du Paradis.", "muslim-234"),
      p("Prier deux rak‘ât après le wudû’, sans s’entretenir avec soi-même, efface les péchés passés.", "muslim-226"),
    ],
  },

  "wudu-invalidators": {
    short: "Al-Wajîz : le wudû’ est annulé par ce qui sort des deux voies (urine, selles, gaz, madhy, wady), par le sommeil profond, par la perte de la raison, par le toucher des parties intimes avec désir et par la viande de chameau.",
    rules: [
      p("L’urine, les selles et les gaz annulent le wudû’.", "bukhari-135", "wajiz-taharah"),
      p("Le madhy annule le wudû’ : on lave la partie intime et on refait les ablutions, sans ghusl.", "bukhari-269"),
      p("Al-Wajîz : le sommeil profond, où l’on ne perçoit plus rien, l’annule ; les Compagnons somnolaient assis puis priaient sans refaire leurs ablutions.", "wajiz-taharah", "muslim-376c"),
      p("Celui qui doute : « Qu’il ne quitte pas la prière à moins d’entendre un son ou de sentir une odeur. »", "bukhari-137", "muslim-361"),
      p("Al-Wajîz : toucher directement ses parties intimes annule le wudû’ s’il y a du désir ; sans désir, ce n’est qu’une partie du corps, comme l’a dit le Prophète ﷺ.", "abudawud-181", "abudawud-182", "wajiz-taharah"),
      p("Le Prophète ﷺ a ordonné le wudû’ après la viande de chameau ; al-Wajîz le compte parmi ce qui annule le wudû’.", "muslim-360", "wajiz-taharah"),
    ],
    cases: [
      c("J’ai un doute : mes ablutions sont-elles annulées ?", "Celui qui ressent quelque chose dans son ventre et doute ne quitte pas la mosquée tant qu’il n’entend pas un son ou ne sent pas une odeur.", "muslim-361", "muslim-362"),
      c("Je me suis assoupi assis à la mosquée.", "Les Compagnons somnolaient assis puis priaient sans refaire leurs ablutions.", "muslim-376c"),
      c("Le vomissement annule-t-il le wudû’ ?", "Al-Wajîz ne le compte pas parmi ce qui annule le wudû’ ; il le cite parmi les cas où le wudû’ est recommandé, d’après le hadith d’Abû ad-Dardâ’ : le Prophète ﷺ a vomi, puis a fait le wudû’.", "wajiz-taharah"),
    ],
  },

  ghusl: {
    sourceIds: ["wajiz-taharah"],
    short: "Le ghusl consiste à faire couler l’eau sur tout le corps avec l’intention de se purifier. Le Prophète ﷺ commençait par laver ses mains et sa partie intime, faisait le wudû’, puis versait l’eau sur sa tête et sur tout son corps.",
    rules: [
      p("Le ghusl est obligatoire en état de janâba : « Et si vous êtes en état d’impureté majeure (Junuban), alors purifiez-vous (par un bain). »", "quran-5-6", "quran-4-43"),
      p("Al-Wajîz : ses piliers sont l’intention et que l’eau atteigne tout le corps.", "bukhari-1", "wajiz-taharah"),
      p("La femme n’a pas à défaire ses tresses pour le ghusl de la janâba : trois poignées d’eau sur la tête suffisent.", "muslim-330"),
      p("Le Prophète ﷺ faisait le ghusl avec un sâ‘ d’eau.", "bukhari-201"),
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
      c("Le ghusl du vendredi est-il obligatoire ?", "Le Prophète ﷺ a dit : « Celui d’entre vous qui assiste à la prière du vendredi doit prendre un bain. » Et : « Prendre un bain le vendredi est obligatoire pour tout homme (musulman) ayant atteint la puberté. » Al-Wajîz le compte parmi les ghusl obligatoires.", "bukhari-877", "bukhari-879", "wajiz-taharah"),
    ],
  },

  "ghusl-required": {
    sourceIds: ["quran-5-6", "quran-4-43", "wajiz-taharah"],
    short: "Le ghusl devient obligatoire après un rapport sexuel (même sans éjaculation), après l’émission de sperme (éveillé ou en rêve), à la fin des règles ou des lochies, et en entrant en islam.",
    rules: [
      p("Le rapport sexuel impose le ghusl, même sans éjaculation.", "muslim-349"),
      p("L’émission de sperme impose le ghusl, y compris après un rêve si l’on constate le liquide ; cela vaut pour l’homme comme pour la femme.", "bukhari-282"),
      p("Al-Wajîz : éveillé, il faut que le sperme sorte avec désir ; ce qui sort sans désir, par maladie ou par froid, n’impose pas le ghusl.", "wajiz-taharah"),
      p("La fin des règles impose le ghusl avant de reprendre la prière.", "bukhari-320"),
      p("Al-Wajîz : la fin des lochies (nifâs) aussi, par consensus.", "wajiz-taharah"),
      p("Le madhy n’impose pas le ghusl, seulement le wudû’.", "bukhari-269"),
    ],
    cases: [
      c("J’ai rêvé mais je ne trouve aucune trace.", "Pas de ghusl : le Prophète ﷺ l’a lié au fait de voir le liquide.", "bukhari-282"),
      c("Je trouve une trace sans me souvenir d’un rêve.", "Al-Wajîz : celui qui trouve l’humidité sans se souvenir d’un rêve fait le ghusl. S’il s’agit de madhy, on lave la partie intime et on fait le wudû’.", "wajiz-taharah", "bukhari-269"),
      c("Faut-il faire le ghusl en entrant en islam ?", "Le Prophète ﷺ l’a ordonné à Qays ibn ‘Âsim lors de sa conversion ; al-Wajîz le compte parmi ce qui rend le ghusl obligatoire.", "abudawud-355", "wajiz-taharah"),
    ],
  },

  tayammum: {
    short: "Quand l’eau manque ou qu’on ne peut pas l’utiliser (maladie, grand froid), on frappe la terre des mains, puis on essuie le visage et les mains. Le tayammum remplace le wudû’ et le ghusl.",
    rules: [
      p("Le Coran le permet à celui qui ne trouve pas d’eau, ou qui est malade : « alors recourez à une terre pure ».", "quran-4-43", "quran-5-6"),
      p("« La terre m’a été rendue pure et lieu de prière. »", "bukhari-335"),
      p("Il remplace aussi le ghusl : ‘Ammâr, en état de janâba, s’était roulé dans la poussière ; le Prophète ﷺ lui a montré qu’il suffisait d’essuyer le visage et les mains.", "bukhari-338"),
      p("Al-Wajîz : il est permis quand on ne peut pas utiliser l’eau, faute d’en avoir, ou par crainte d’un mal à cause d’une maladie ou d’un grand froid.", "wajiz-taharah"),
      p("Al-Wajîz : il est annulé par ce qui annule le wudû’, et par la découverte de l’eau ou la capacité de l’utiliser.", "wajiz-taharah"),
    ],
    steps: [
      p("Ayez l’intention de vous purifier.", "bukhari-1"),
      p("Frappez la terre (al-Wajîz : la surface de la terre, sable, pierre ou mur) du plat des mains.", "bukhari-338", "bukhari-337", "wajiz-taharah"),
      p("Soufflez légèrement sur vos mains.", "bukhari-338"),
      p("Essuyez le visage, puis les mains.", "bukhari-341", "bukhari-343"),
    ],
    cases: [
      c("J’ai prié avec le tayammum, puis j’ai trouvé l’eau avant la fin de l’heure.", "Votre prière est valable. Deux Compagnons ont vécu ce cas ; le Prophète ﷺ a dit à celui qui n’avait pas refait sa prière : « Tu as suivi la sunna, et ta première prière te suffit. »", "abudawud-338"),
      c("Un seul tayammum suffit-il pour plusieurs prières ?", "Al-Wajîz : le tayammum tient lieu de wudû’ : on peut le faire avant l’heure et prier avec autant de prières qu’on veut, tant qu’il n’est pas annulé.", "wajiz-taharah"),
      c("J’ai un pansement ou un plâtre.", "Al-Wajîz, citant Ibn Hazm : on ne lave pas l’endroit d’une blessure bandée ou d’une fracture plâtrée, et on n’a ni à essuyer dessus ni à faire le tayammum pour lui, car « Allah n’impose à aucune âme une charge supérieure à sa capacité ».", "wajiz-taharah", "quran-2-286"),
    ],
  },

  khuff: {
    sourceIds: ["wajiz-taharah"],
    short: "Celui qui a mis ses khuff (chaussures montantes en cuir) en état d’ablution peut, quand il refait son wudû’, passer la main mouillée sur le dessus au lieu de laver ses pieds : un jour et une nuit pour le résident, trois jours et trois nuits pour le voyageur.",
    rules: [
      p("Condition : les avoir enfilés après un wudû’ complet. Al-Mughîra voulut retirer les khuff du Prophète ﷺ : « Il m’a ordonné de les laisser, car il les avait mis après avoir fait ses ablutions. »", "bukhari-206"),
      p("Durée : un jour et une nuit pour le résident, trois jours et trois nuits pour le voyageur.", "muslim-276a"),
      p("On essuie le dessus, pas le dessous.", "abudawud-162"),
      p("La janâba oblige à les retirer pour faire le ghusl.", "tirmidhi-96"),
    ],
    steps: [
      p("Faites un wudû’ complet, pieds lavés, puis enfilez vos khuff.", "bukhari-206"),
      p("Lors des ablutions suivantes, passez la main mouillée sur le dessus des khuff.", "abudawud-162"),
    ],
    cases: [
      c("Et les chaussettes ?", "Al-Wajîz : on peut essuyer sur les chaussettes (jawrab) et les sandales comme sur les khuff : le Prophète ﷺ a fait ses ablutions en essuyant sur ses chaussettes et ses sandales.", "wajiz-taharah"),
      c("Qu’est-ce qui met fin à l’essuyage ?", "Al-Wajîz : la fin de la durée, la janâba, et le fait de les retirer. Si l’on avait encore son wudû’ à ce moment-là, il reste valable jusqu’à ce qu’on le perde.", "wajiz-taharah"),
    ],
  },

  menstruation: {
    sensitive: true,
    short: "Pendant ses règles, la femme ne prie pas et ne jeûne pas. Elle rattrape les jours de jeûne mais pas les prières. À la fin, elle fait le ghusl et reprend.",
    rules: [
      p("Elle ne prie pas et ne jeûne pas.", "bukhari-304"),
      p("Elle rattrape le jeûne mais pas la prière.", "muslim-335a", "muslim-335c"),
      p("Le rapport conjugal est interdit jusqu’à la purification ; tout le reste de l’intimité est permis.", "quran-2-222", "muslim-302", "muslim-293"),
      p("Elle accomplit tous les rites du Hajj, sauf le tawâf autour de la Ka‘ba.", "bukhari-305"),
      p("Al-Wajîz : la Charia ne fixe ni minimum ni maximum aux règles ; on se réfère à l’habitude.", "wajiz-taharah"),
      p("Le saignement d’une veine (istihâda) n’est pas des règles : la femme prie et fait le wudû’ pour chaque prière.", "bukhari-320", "bukhari-228"),
      p("Les pertes jaunâtres ou brunâtres après la purification ne comptent pas comme des règles.", "abudawud-307"),
    ],
    steps: [
      p("Arrêtez la prière et le jeûne dès l’apparition du sang des règles.", "bukhari-304"),
      p("À la fin des règles, faites le ghusl et reprenez la prière.", "bukhari-320"),
    ],
    cases: [
      c("Comment distinguer les règles d’un saignement qui se prolonge ?", "Al-Wajîz : la femme qui a une habitude compte comme règles la durée habituelle, le reste est istihâda ; celle qui distingue les deux sangs compte comme règles le sang noir connu ; celle qui ne peut ni l’un ni l’autre suit l’habitude la plus courante des femmes, six ou sept jours.", "wajiz-taharah"),
    ],
  },

  postpartum: {
    sensitive: true,
    short: "Le nifâs est le saignement qui suit l’accouchement. Il suit les règles des menstrues ; il dure au plus quarante jours selon al-Wajîz, et prend fin dès que la femme est pure, même plus tôt.",
    rules: [
      p("Al-Wajîz : pendant le nifâs, est interdit ce qui l’est pendant les règles.", "wajiz-taharah"),
      p("Al-Wajîz : il dure au plus quarante jours ; à l’époque du Prophète ﷺ, la femme qui avait accouché restait quarante jours.", "wajiz-taharah"),
      p("Al-Wajîz : si elle voit la purification avant les quarante jours, elle fait le ghusl et elle est pure.", "wajiz-taharah"),
    ],
    steps: [
      p("Al-Wajîz : arrêtez prière et jeûne tant que le sang lié à l’accouchement coule.", "wajiz-taharah"),
      p("Dès la purification, faites le ghusl et reprenez la prière.", "wajiz-taharah"),
      p("Rattrapez les jours de jeûne manqués, pas les prières.", "muslim-335c"),
    ],
    cases: [
      c("Le sang s’arrête au vingtième jour.", "Al-Wajîz : faites le ghusl et vous êtes pure ; il n’y a pas à attendre quarante jours.", "wajiz-taharah"),
      c("Le sang continue après quarante jours.", "Al-Wajîz : elle fait le ghusl à la fin des quarante jours et elle est pure.", "wajiz-taharah"),
    ],
  },

  "purification-doubt": {
    short: "Celui qui est sûr d’avoir fait le wudû’ ne le quitte pas pour un doute : le Prophète ﷺ a dit de ne quitter la prière que si l’on entend un son ou sent une odeur.",
    rules: [
      p("Celui qui doute pendant la prière : « Qu’il ne quitte pas la prière à moins d’entendre un son ou de sentir une odeur. »", "bukhari-137", "muslim-361"),
      p("Celui qui ressent quelque chose dans son ventre et ne sait pas s’il a perdu ses ablutions ne quitte pas la mosquée sans certitude.", "muslim-362"),
    ],
  },

  "soiled-clothing": {
    sourceIds: ["bukhari-218", "wajiz-taharah"],
    short: "Le corps, les vêtements et le lieu de prière doivent être propres de toute impureté. On lave l’impureté comme le Prophète ﷺ l’a enseigné ; il suffit d’asperger l’urine d’un nourrisson garçon.",
    rules: [
      p("Le vêtement doit être purifié : « Et tes vêtements, purifie-les. »", "quran-74-4"),
      p("Le sang des règles sur un vêtement : on le gratte, on le frotte avec de l’eau, on rince, puis on peut prier avec.", "bukhari-227", "muslim-291a"),
      p("Un sol souillé d’urine se purifie en y versant de l’eau.", "bukhari-220", "muslim-284a"),
      p("L’urine d’un nourrisson garçon qui ne mange pas encore se purifie par aspersion d’eau.", "bukhari-223"),
      p("Les sandales souillées se purifient en les frottant contre la terre.", "abudawud-385", "abudawud-386"),
      p("Un récipient léché par un chien se lave sept fois, dont la première avec de la terre.", "muslim-279a", "muslim-279d"),
    ],
    cases: [
      c("J’ai découvert une impureté sur mon vêtement après la prière.", "Le Prophète ﷺ, informé pendant la prière que ses sandales étaient souillées, les a retirées et a poursuivi sans recommencer.", "abudawud-650"),
      c("Une tache reste après le lavage.", "Khawla bint Yasâr a demandé : « Et si la tache ne part pas ? » Le Prophète ﷺ a répondu : « Il te suffit de laver le sang, la trace ne te fera aucun mal. »", "abudawud-365", "wajiz-taharah"),
      c("Faut-il laver l’urine d’une petite fille comme celle d’un garçon ?", "« Seule l’urine d’une fille doit être lavée ; celle d’un garçon doit être simplement aspergée d’eau. »", "abudawud-376", "bukhari-223", "wajiz-taharah"),
    ],
  },
};
