import type { LanguageCode } from "../../i18n";
import type { Problem, ProblemCategory } from "./pilgrimageTypes";

type Localized = Record<LanguageCode, string>;

export const PROBLEM_CATEGORIES: ReadonlyArray<{ id: ProblemCategory; label: Localized; icon: string }> = [
  { id: "tawaf", label: { fr: "Tawâf & Sa‘y", en: "Tawaf & Sa‘y" }, icon: "sync-outline" },
  { id: "ihram", label: { fr: "Ihrâm", en: "Ihram" }, icon: "shirt-outline" },
  { id: "women", label: { fr: "Femmes", en: "Women" }, icon: "woman-outline" },
  { id: "health", label: { fr: "Santé & sécurité", en: "Health & safety" }, icon: "medkit-outline" },
  { id: "hajj", label: { fr: "Rites du Hajj", en: "Hajj rites" }, icon: "flag-outline" },
];

/** Kept word for word from the validated guide. */
export const WHEN_TO_SEEK_HELP: Localized = {
  fr: "Consultez lorsqu’un pilier, une obligation, la validité ou une compensation peut être en jeu.",
  en: "Ask for advice when a pillar, an obligation, validity or a compensation may be at stake.",
};
export const PROBLEMS_DISCLAIMER: Localized = {
  fr: "Les réponses pratiques ne remplacent pas l’avis d’une personne qualifiée pour un pèlerinage en cours. Une divergence juridique est possible selon les circonstances.",
  en: "These practical answers do not replace the advice of a qualified person during a pilgrimage in progress. Scholars may differ depending on the circumstances.",
};

type LocalizedProblem = { id: string; category: ProblemCategory; question: Localized; whatToKnow: Localized; whatToDoNow: Localized };

const problem = (id: string, category: ProblemCategory, fr: [string, string, string], en: [string, string, string]): LocalizedProblem =>
  ({ id, category, question: { fr: fr[0], en: en[0] }, whatToKnow: { fr: fr[1], en: en[1] }, whatToDoNow: { fr: fr[2], en: en[2] } });

const PROBLEMS: LocalizedProblem[] = [
  problem("count", "tawaf",
    ["J’ai oublié combien de tours j’ai faits", "Un doute pendant le Tawâf ou le Sa‘y ne se traite pas automatiquement de la même façon.", "Retenez le nombre certain et consultez si le doute affecte la validité du rite."],
    ["I forgot how many circuits I have done", "A doubt during the Tawaf or the Sa‘y is not automatically handled the same way.", "Go by the number you are sure of, and ask for advice if the doubt affects the validity of the rite."]),
  problem("wudu", "tawaf",
    ["J’ai perdu mes ablutions", "La purification pour le Tawâf fait l’objet d’une divergence juridique ; elle est distincte du Sa‘y.", "Renouvelez vos ablutions si possible et demandez un avis adapté à votre école et à votre situation."],
    ["I lost my wudu", "Scholars differ on purity for the Tawaf; it is a separate matter from the Sa‘y.", "Renew your wudu if you can and ask for an opinion suited to your school and your situation."]),
  problem("stone", "tawaf",
    ["Je n’arrive pas à atteindre la Pierre noire", "Toucher la Pierre noire n’est pas une permission de pousser ou de blesser.", "Saluez-la à distance au niveau du passage et poursuivez votre tour."],
    ["I cannot reach the Black Stone", "Touching the Black Stone is no permission to push or hurt anyone.", "Greet it from a distance as you pass and carry on with your circuit."]),
  problem("doubt", "tawaf",
    ["Que faire en cas de doute pendant le Tawâf ou le Sa‘y ?", "Le doute apparu pendant le rite doit être distingué du doute apparu après son achèvement.", "Notez le nombre certain et consultez avant de recommencer un rite complet."],
    ["What should I do if I have a doubt during the Tawaf or the Sa‘y?", "A doubt that arises during the rite must be distinguished from one that arises after it is finished.", "Note the number you are sure of and ask for advice before starting a whole rite again."]),
  problem("walk", "tawaf",
    ["Je ne peux pas marcher pour le Sa‘y", "L’incapacité à marcher doit être évaluée selon l’état de santé et les moyens officiels disponibles.", "Utilisez les aménagements autorisés et demandez conseil si le rite est interrompu."],
    ["I cannot walk for the Sa‘y", "Being unable to walk must be assessed according to your health and the official means available.", "Use the permitted facilities and ask for advice if the rite is interrupted."]),
  problem("miqat", "ihram",
    ["J’ai dépassé le mîqât", "La conséquence dépend de votre intention avant le mîqât, de l’itinéraire et de la possibilité de revenir.", "Contactez immédiatement un guide qualifié ; ne choisissez pas seul un dam ou une fidya."],
    ["I passed the miqat", "The consequence depends on your intention before the miqat, your route and whether you can go back.", "Contact a qualified guide immediately; do not choose a dam or a fidyah on your own."]),
  problem("after-miqat", "ihram",
    ["Je suis arrivé après le mîqât", "Arriver après le mîqât nécessite de distinguer l’intention formée avant ou après la limite.", "Exposez l’itinéraire et les horaires à une personne qualifiée sans improviser de compensation."],
    ["I arrived after the miqat", "Arriving after the miqat requires distinguishing whether the intention was formed before or after the boundary.", "Explain your route and times to a qualified person without improvising a compensation."]),
  problem("hair", "ihram",
    ["J’ai coupé un cheveu involontairement", "L’oubli, la contrainte et l’acte volontaire ne reçoivent pas nécessairement le même traitement.", "Conservez le contexte exact et consultez si une compensation est envisagée."],
    ["I cut a hair without meaning to", "Forgetfulness, coercion and a deliberate act are not necessarily treated the same way.", "Keep the exact circumstances in mind and ask for advice if a compensation is being considered."]),
  problem("perfume", "ihram",
    ["J’ai utilisé du parfum", "Un produit parfumé, son intention et son usage médical doivent être distingués.", "Cessez l’usage si possible, gardez la composition du produit et demandez un avis."],
    ["I used perfume", "A scented product, the intention behind it and medical use must be distinguished.", "Stop using it if you can, keep the product’s ingredients and ask for an opinion."]),
  problem("shower", "ihram",
    ["Puis-je prendre une douche ?", "Le lavage et l’hygiène ne sont pas identiques à l’usage intentionnel de parfum.", "Utilisez si possible des produits non parfumés et vérifiez leur composition."],
    ["Can I take a shower?", "Washing and hygiene are not the same as deliberately using perfume.", "Use unscented products if you can and check their ingredients."]),
  problem("products", "ihram",
    ["Savon, crème solaire ou produits parfumés ?", "Savon, crème solaire et médicament peuvent avoir des compositions et nécessités différentes.", "Privilégiez le non-parfumé ; ne cessez jamais un traitement sans médecin."],
    ["Soap, sunscreen or scented products?", "Soap, sunscreen and medicine can have different ingredients and different necessity.", "Prefer unscented products; never stop a treatment without a doctor."]),
  problem("intention", "ihram",
    ["J’ai oublié l’intention", "La validité d’une intention dépend de ce qui a été voulu et du moment où le rite a été commencé.", "Décrivez les faits exactement ; ne tentez pas de reconstruire l’intention après coup."],
    ["I forgot the intention", "Whether an intention is valid depends on what was meant and when the rite was begun.", "Describe the facts exactly; do not try to reconstruct the intention afterwards."]),
  problem("exit", "ihram",
    ["Je ne sais pas quand sortir de l’ihrâm", "La sortie de l’ihrâm intervient après les actes requis et la coupe adaptée au rite.", "Vérifiez votre étape et votre type de Hajj avant de lever les restrictions."],
    ["I don’t know when to leave ihram", "You leave ihram after the required acts and the haircut suited to the rite.", "Check your step and your type of Hajj before lifting the restrictions."]),
  problem("period", "women",
    ["Je suis enceinte ou j’ai mes règles", "La grossesse et les menstruations sont deux situations distinctes et ne produisent pas automatiquement les mêmes effets.", "Demandez séparément un avis médical et religieux personnalisé."],
    ["I am pregnant or on my period", "Pregnancy and menstruation are two distinct situations and do not automatically have the same effects.", "Ask separately for personal medical and religious advice."]),
  problem("period-farewell", "women",
    ["Menstruations avant le Tawâf d’adieu", "La femme menstruée qui a achevé les autres rites bénéficie d’une exemption rapportée pour le Tawâf d’adieu.", "Vérifiez avec un guide qu’aucun autre rite ou départ obligatoire ne reste à traiter."],
    ["Period before the Farewell Tawaf", "A menstruating woman who has completed the other rites has a reported exemption from the Farewell Tawaf.", "Check with a guide that no other rite or required departure remains to be dealt with."]),
  problem("sick", "health",
    ["Je suis malade ou en fauteuil roulant", "La maladie ou le handicap peuvent nécessiter des aménagements officiels ; la sécurité reste prioritaire.", "Suivez les dispositifs autorisés et l’encadrement médical et religieux."],
    ["I am ill or in a wheelchair", "Illness or disability may require official arrangements; safety remains the priority.", "Use the permitted arrangements and follow medical and religious guidance."]),
  problem("tired", "health",
    ["Je suis épuisé ou déshydraté", "La déshydratation peut rendre dangereuse la poursuite immédiate du rite.", "Mettez-vous à l’abri, hydratez-vous et prévenez l’encadrement."],
    ["I am exhausted or dehydrated", "Dehydration can make it dangerous to carry on with the rite straight away.", "Get to shelter, drink, and let your group leaders know."]),
  problem("lost", "health",
    ["Je me suis perdu dans la foule", "Se perdre dans la foule est d’abord une situation de sécurité, pas une faute rituelle.", "Rejoignez un point de rassemblement officiel et contactez votre groupe."],
    ["I got lost in the crowd", "Getting lost in the crowd is first a safety situation, not a ritual fault.", "Go to an official meeting point and contact your group."]),
  problem("medicine", "health",
    ["Je dois utiliser un médicament parfumé", "La nécessité d’un médicament parfumé doit être distinguée d’un usage de confort.", "Ne stoppez pas le traitement ; demandez un avis médical et juridique."],
    ["I have to use a scented medicine", "Needing a scented medicine must be distinguished from using something for comfort.", "Do not stop the treatment; ask for medical and legal advice."]),
  problem("step", "hajj",
    ["J’ai oublié une étape", "Un acte oublié peut être un pilier, une obligation ou une recommandation : les conséquences diffèrent.", "Notez l’acte et le moment précis, puis demandez conseil avant de continuer au hasard."],
    ["I missed a step", "A missed act may be a pillar, an obligation or a recommendation: the consequences differ.", "Note the act and the exact time, then ask for advice before carrying on at random."]),
  problem("obligation", "hajj",
    ["J’ai un doute sur une obligation", "Une obligation, un pilier et une recommandation n’ont pas la même conséquence.", "Identifiez la qualification de l’acte auprès d’un référent fiable."],
    ["I have a doubt about an obligation", "An obligation, a pillar and a recommendation do not have the same consequence.", "Find out from a reliable person what kind of act it is."]),
  problem("mina", "hajj",
    ["J’ai quitté Mina avant la fin des jours", "Le départ de Mina le 12 et le séjour jusqu’au 13 ont des conditions distinctes.", "Notez l’heure et les rites accomplis, puis consultez rapidement."],
    ["I left Mina before the end of the days", "Leaving Mina on the 12th and staying until the 13th have separate conditions.", "Note the time and the rites you performed, then ask for advice quickly."]),
  problem("sacrifice", "hajj",
    ["Je ne sais pas si le sacrifice m’incombe", "Le type de Hajj, notamment Tamattu‘, Qirân ou Ifrâd, peut déterminer le hady.", "Vérifiez votre type et votre situation avec une personne qualifiée avant de payer ou d’omettre un sacrifice."],
    ["I don’t know if the sacrifice is due from me", "The type of Hajj, in particular Tamattu‘, Qiran or Ifrad, can determine the hady.", "Check your type and your situation with a qualified person before paying for or leaving out a sacrifice."]),
  problem("farewell", "hajj",
    ["Je n’ai pas pu faire le Tawâf al-Wadâ‘", "Le Tawâf d’adieu comporte des exemptions et des cas particuliers documentés.", "Consultez avant le départ, surtout en cas de menstruations, maladie ou contrainte de transport."],
    ["I could not do Tawaf al-Wada‘", "The Farewell Tawaf has documented exemptions and special cases.", "Ask before leaving, especially in case of menstruation, illness or transport constraints."]),
];

export function getProblems(language: LanguageCode): Problem[] {
  return PROBLEMS.map((item) => ({
    id: item.id,
    category: item.category,
    question: item.question[language],
    whatToKnow: item.whatToKnow[language],
    whatToDoNow: item.whatToDoNow[language],
  }));
}
