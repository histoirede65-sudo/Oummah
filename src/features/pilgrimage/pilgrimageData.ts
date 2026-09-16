import type { HajjType, Invocation, Problem, Source, Step } from "./pilgrimageTypes";
const H = (reference: string) => ({ kind: "AUTHENTIC_HADITH" as const, reference });
const Q = (reference: string) => ({ kind: "QURAN" as const, reference });
const F = (reference: string) => ({ kind: "FIQH" as const, reference });
const D = (reference: string) => ({ kind: "JURISTIC_DIFFERENCE" as const, reference });
const a = (id: string, text: string, sources: Source[] = [H("Sahîh Muslim 1218")], importance?: Step["do"][number]["importance"]) => ({ id, text, sources, importance });
export const UMRAH_STEPS: Step[] = [
  ["preparation","Préparer son départ","Se renseigner, régler ses affaires et apprendre les rites.","Préparez vos besoins pratiques et votre état spirituel avant le voyage."],
  ["miqat","Le mîqât — la limite d’entrée","Le mîqât est la limite à ne pas franchir vers La Mecque sans ihrâm pour celui qui a l’intention du pèlerinage.","Ne franchissez pas le mîqât en repoussant volontairement l’ihrâm.","Sahîh al-Bukhârî 1526"],
  ["ihram","Entrer en ihrâm","L’ihrâm est l’état rituel du pèlerin, avec une intention et des règles particulières.","L’intention se fait dans le cœur ; la talbiya accompagne l’entrée dans le rite.","Coran 2:196"],
  ["talbiyah","La talbiya","Répétez la formule de talbiya et évitez les disputes et les paroles déplacées.","Labbayka Allâhumma labbayk… — Me voici, ô Allah, me voici…","Sahîh al-Bukhârî 1549"],
  ["prohibitions","Les interdits de l’ihrâm","Les interdits varient selon les personnes et les situations ; ne transformez pas un conseil pratique en règle universelle.","Évitez parfum, chasse et actes interdits ; les questions de compensation nécessitent un avis qualifié.","Coran 2:197", "Fiqh : détails selon les écoles"],
  ["haram","Arriver à la Mosquée sacrée","Entrez avec recueillement et dirigez-vous vers le Tawâf.","Aucune invocation obligatoire spécifique n’est établie pour chaque déplacement.","Sahîh Muslim 1218"],
  ["tawaf-prep","Se préparer au Tawâf","Le Tawâf consiste à tourner autour de la Kaaba. La purification est une question juridique importante avec des avis détaillés.","Suivez l’avis qualifié correspondant à votre situation ; évitez de gêner les autres.","Divergence juridique : purification du Tawâf"],
  ["tawaf","Tawâf — 7 tours","Comptez sept tours complets, en gardant la Kaaba à gauche.","Il n’existe pas d’invocation authentique obligatoire pour chaque tour.","Sahîh Muslim 1218"],
  ["black-stone","Pierre noire et angle yéménite","Saluez la Pierre noire si cela est possible sans pousser. Entre les deux angles, invoquez librement.","Ne vous mettez pas en danger et ne blessez personne.","Sahîh al-Bukhârî 1611"],
  ["ramal","Ramal et idtibâ‘","Ces pratiques concernent certains hommes dans certaines circonstances ; elles ne concernent pas les femmes.","Ne forcez jamais le passage dans la foule.","Sahîh Muslim 1218", "Fiqh : conditions d’application"],
  ["prayer","Deux rak‘ât après le Tawâf","Priez si possible derrière Maqâm Ibrâhîm, sans gêner les flux.","La sécurité et la facilité priment dans l’organisation pratique.","Coran 2:125"],
  ["zamzam","Zamzam","Buvez si vous le pouvez et invoquez Allah librement.","Aucune formule unique obligatoire n’est établie ici.","Sahîh al-Bukhârî 1636"],
  ["sai","Safâ et Marwa — le Sa‘y","Le Sa‘y est composé de sept trajets : Safâ→Marwa = 1, puis Marwa→Safâ = 2, jusqu’à Safâ→Marwa = 7.","Les hommes accélèrent entre les repères lorsqu’ils le peuvent ; les femmes marchent normalement.","Coran 2:158", "Sahîh Muslim 1218"],
  ["hair","Halq ou taqsîr","Le halq est le rasage et le taqsîr la coupe des cheveux. Les règles diffèrent entre hommes et femmes.","Ne coupez pas avant le moment rituel approprié.","Sahîh Muslim 1301"],
  ["exit","Sortie de l’ihrâm","Après les actes requis et la coupe des cheveux, les restrictions prennent fin selon le rite accompli.","En cas d’incertitude sur l’ordre ou une compensation, consultez une personne qualifiée.","Coran 2:196"],
  ["complete","‘Umra terminée","La ‘Umra est achevée ; conservez les enseignements et la gratitude.","Le compteur est une aide mémoire, pas une validation religieuse.","Sahîh Muslim 1218"]
].map(([id,title,summary,doText,source,extra]) => ({ id, title, summary, do: [a(`${id}-do`, doText, [source?.startsWith("Sahîh") ? H(source) : source?.startsWith("Coran") ? Q(source) : F(source), ...(extra ? [F(extra)] : [])]) ] } as Step));
export const HAJJ_STEPS: Step[] = [
  { id:"types", title:"Les trois types de Hajj", summary:"Tamattu‘, Qirân et Ifrâd sont trois formes distinctes.", do:[a("types-explain","Tamattu‘ : ‘Umra puis sortie de l’ihrâm avant le Hajj ; Qirân : ‘Umra et Hajj dans un même ihrâm ; Ifrâd : Hajj seul.",[Q("Coran 2:196")]),a("types-sacrifice","Le sacrifice s’applique notamment au Tamattu‘ et au Qirân selon les conditions ; demandez un avis qualifié si votre situation est particulière.",[Q("Coran 2:196"),D("Hady du Tamattu‘ et du Qirân : divergence juridique")],"DIVERGENCE JURIDIQUE")]},
  ...UMRAH_STEPS.slice(0,7).filter(s=>s.id!=="complete"),
  { id:"mina-8", title:"8 Dhul-Hijjah — Mina", summary:"Le pèlerin rejoint Mina selon son programme et les dispositions de son rite.", do:[a("mina-stay","Organisez la journée et la nuit selon les instructions officielles et votre encadrement.",[H("Sahîh Muslim 1218")])]},
  { id:"arafat-9", title:"9 Dhul-Hijjah — ‘Arafât", summary:"Le wuqûf est la station à ‘Arafât, moment central du Hajj.", do:[a("wuquf","Soyez présent à ‘Arafât dans le temps établi et invoquez Allah.",[H("Sahîh Muslim 1218")],"PILIER")]},
  { id:"muzdalifah", title:"Nuit à Muzdalifah", summary:"Le pèlerin se rend à Muzdalifah après ‘Arafât.", do:[a("muzdalifah","Suivez les horaires et les consignes de sécurité de l’encadrement.",[H("Sahîh Muslim 1218")])]},
  { id:"nahr-10", title:"10 Dhul-Hijjah — Yawm an-Nahr", summary:"Journée des rites majeurs : Jamrat al-‘Aqaba, sacrifice lorsqu’il s’applique, cheveux et Tawâf al-Ifâda.", do:[a("nahr","Respectez l’ordre et les conditions selon votre type de Hajj ; les détails juridiques peuvent diverger.",[H("Sahîh Muslim 1218"),D("Ordre des rites du 10 Dhul-Hijjah : divergence juridique")],"DIVERGENCE JURIDIQUE")]},
  { id:"tashriq-11", title:"11 Dhul-Hijjah — Tashrîq", summary:"Les trois Jamarât sont accomplies dans l’ordre.", do:[a("jamarat-11","Commencez par la petite, puis la moyenne, puis la grande Jamarah, selon les horaires autorisés.",[H("Sahîh Muslim 1299")])]},
  { id:"tashriq-12", title:"12 Dhul-Hijjah — Tashrîq", summary:"Le pèlerin peut partir après les rites du jour selon les conditions établies.", do:[a("jamarat-12","Respectez les horaires et ne quittez pas précipitamment avant d’avoir accompli ce qui vous incombe.",[H("Sahîh Muslim 1299"),D("Départ anticipé : fiqh comparé")],"DIVERGENCE JURIDIQUE")]},
  { id:"tashriq-13", title:"13 Dhul-Hijjah — pour celui qui reste", summary:"Celui qui reste accomplit les rites du treizième jour.", do:[a("jamarat-13","Accomplissez les trois Jamarât si vous restez jusqu’au treizième.",[H("Sahîh Muslim 1299")])]},
  { id:"farewell", title:"Tawâf al-Wadâ‘ — le Tawâf d’adieu", summary:"Il clôt le séjour à La Mecque, avec des exemptions et détails juridiques à vérifier selon les situations.", do:[a("farewell-do","Accomplissez le Tawâf d’adieu lorsque vous quittez La Mecque, sauf exemption établie pour certaines personnes.",[H("Sahîh Muslim 1327"),D("Exemptions : divergence juridique")],"DIVERGENCE JURIDIQUE")]},
  { id:"complete-hajj", title:"Hajj terminé", summary:"Le Hajj est achevé.", do:[a("hajj-complete","Le suivi local est une aide mémoire et ne remplace pas l’avis d’un guide qualifié.",[H("Sahîh Muslim 1218")])]}
];
export const INVOCATIONS: Invocation[] = [{id:"talbiyah",arabic:"لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ",transliteration:"Labbayka Allâhumma labbayk",translation:"Me voici, ô Allah, me voici.",context:"À partir de l’entrée en ihrâm.",status:"SUNNAH AUTHENTIQUE",sources:[H("Sahîh al-Bukhârî 1549")]},{id:"free",arabic:"—",transliteration:"Invocation libre",translation:"Le pèlerin invoque Allah avec ses propres paroles.",context:"Pendant le Tawâf et le Sa‘y lorsqu’aucune formule spécifique n’est établie.",status:"INVOCATION LIBRE",sources:[]}];
export const PROBLEMS: Problem[] = ["J’ai oublié combien de tours j’ai faits","J’ai perdu mes ablutions","Je n’arrive pas à atteindre la Pierre noire","J’ai dépassé le mîqât","J’ai oublié une étape","J’ai coupé un cheveu involontairement","J’ai utilisé du parfum","Je suis malade ou en fauteuil roulant","Je suis enceinte ou j’ai mes règles","Puis-je prendre une douche ?","Savon, crème solaire ou produits parfumés ?","Que faire en cas de doute pendant le Tawâf ou le Sa‘y ?"].map((question,index)=>({id:`problem-${index}`,question,answer:"La réponse dépend des circonstances et parfois de l’école juridique suivie. Pour une conséquence sur la validité du rite, une fidya ou un dam, consultez rapidement une personne qualifiée.",sources:[],difference:"DIVERGENCE JURIDIQUE possible selon les circonstances."}));

export const ADDITIONAL_INVOCATIONS: Invocation[] = [
  { id:"rabbana", arabic:"رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ", transliteration:"Rabbanâ âtinâ fî d-dunyâ hasanatan wa fî l-âkhirati hasanatan wa qinâ ‘adhâba n-nâr", translation:"Seigneur, accorde-nous un bien ici-bas et un bien dans l’au-delà, et protège-nous du châtiment du Feu.", context:"Invocation coranique générale pendant les rites, sans l’imposer à un tour particulier.", status:"INVOCATION CORANIQUE GÉNÉRALE", sources:[Q("Coran 2:201")] },
  { id:"safa", arabic:"إِنَّ الصَّفَا وَالْمَرْوَةَ مِنْ شَعَائِرِ اللَّهِ", transliteration:"Inna s-Safâ wa-l-Marwata min sha‘â’iri llâh", translation:"Safâ et Marwa font partie des rites d’Allah.", context:"Verset coranique rappelant le statut de Safâ et Marwa ; ce n’est pas une formule obligatoire à chaque passage.", status:"VERSET CORANIQUE", sources:[Q("Coran 2:158")] },
  { id:"forgiveness", arabic:"رَبِّ اغْفِرْ وَارْحَمْ", transliteration:"Rabbi’ghfir warham", translation:"Seigneur, pardonne et fais miséricorde.", context:"Invocation coranique générale pendant les déplacements et les rites, sans la présenter comme une formule propre à ce rite.", status:"INVOCATION CORANIQUE GÉNÉRALE", sources:[Q("Coran 23:118")] },
  { id:"acceptance", arabic:"رَبَّنَا تَقَبَّلْ مِنَّا إِنَّكَ أَنْتَ السَّمِيعُ الْعَلِيمُ", transliteration:"Rabbanâ taqabbal minnâ innaka anta s-Samî‘u l-‘Alîm", translation:"Seigneur, accepte de nous, car Tu es Celui qui entend et qui sait.", context:"Invocation coranique générale après une œuvre, sans la présenter comme une formule spécifique du rite.", status:"INVOCATION CORANIQUE GÉNÉRALE", sources:[Q("Coran 2:127")] },
];

export const ADDITIONAL_PROBLEMS: Problem[] = [
  "Menstruations avant le Tawâf d’adieu", "Je suis arrivé après le mîqât", "J’ai un doute sur une obligation", "Je suis épuisé ou déshydraté", "Je me suis perdu dans la foule", "Je dois utiliser un médicament parfumé", "Je ne peux pas marcher pour le Sa‘y", "J’ai quitté Mina avant la fin des jours", "Je ne sais pas si le sacrifice m’incombe", "Je n’ai pas pu faire le Tawâf al-Wadâ‘", "J’ai oublié l’intention", "Je ne sais pas quand sortir de l’ihrâm"
].map((question,index)=>({id:`additional-problem-${index}`,question,answer:"La réponse dépend du détail précis, du rite et parfois de l’école juridique. Préservez votre sécurité, n’improvisez pas une compensation et demandez rapidement l’avis d’une personne qualifiée.",sources:[],difference:"DIVERGENCE JURIDIQUE possible selon les circonstances."}));

export function hajjTypeGuidance(type: HajjType): string {
  if (type === "tamattu") return "Tamattu‘ : vous accomplissez d’abord la ‘Umra, sortez de l’ihrâm, puis entrez à nouveau en ihrâm pour le Hajj ; le hady (sacrifice) s’applique selon les conditions établies.";
  if (type === "qiran") return "Qirân : vous réunissez la ‘Umra et le Hajj dans un même ihrâm ; le hady s’applique selon les conditions établies.";
  return "Ifrâd : vous accomplissez le Hajj seul ; le sacrifice spécifique au Tamattu‘ ou au Qirân ne s’applique pas du seul fait de l’Ifrâd.";
}










