import type { Problem, ProblemCategory } from "./pilgrimageTypes";

export const PROBLEM_CATEGORIES: ReadonlyArray<{ id: ProblemCategory; label: string; icon: string }> = [
  { id: "tawaf", label: "Tawâf & Sa‘y", icon: "sync-outline" },
  { id: "ihram", label: "Ihrâm", icon: "shirt-outline" },
  { id: "women", label: "Femmes", icon: "woman-outline" },
  { id: "health", label: "Santé & sécurité", icon: "medkit-outline" },
  { id: "hajj", label: "Rites du Hajj", icon: "flag-outline" },
];

/** Kept word for word from the validated guide. */
export const WHEN_TO_SEEK_HELP = "Consultez lorsqu’un pilier, une obligation, la validité ou une compensation peut être en jeu.";
export const PROBLEMS_DISCLAIMER = "Les réponses pratiques ne remplacent pas l’avis d’une personne qualifiée pour un pèlerinage en cours. Une divergence juridique est possible selon les circonstances.";

const problem = (id: string, category: ProblemCategory, question: string, whatToKnow: string, whatToDoNow: string): Problem =>
  ({ id, category, question, whatToKnow, whatToDoNow });

export const PROBLEMS: Problem[] = [
  problem("count", "tawaf", "J’ai oublié combien de tours j’ai faits", "Un doute pendant le Tawâf ou le Sa‘y ne se traite pas automatiquement de la même façon.", "Retenez le nombre certain et consultez si le doute affecte la validité du rite."),
  problem("wudu", "tawaf", "J’ai perdu mes ablutions", "La purification pour le Tawâf fait l’objet d’une divergence juridique ; elle est distincte du Sa‘y.", "Renouvelez vos ablutions si possible et demandez un avis adapté à votre école et à votre situation."),
  problem("stone", "tawaf", "Je n’arrive pas à atteindre la Pierre noire", "Toucher la Pierre noire n’est pas une permission de pousser ou de blesser.", "Saluez-la à distance au niveau du passage et poursuivez votre tour."),
  problem("doubt", "tawaf", "Que faire en cas de doute pendant le Tawâf ou le Sa‘y ?", "Le doute apparu pendant le rite doit être distingué du doute apparu après son achèvement.", "Notez le nombre certain et consultez avant de recommencer un rite complet."),
  problem("walk", "tawaf", "Je ne peux pas marcher pour le Sa‘y", "L’incapacité à marcher doit être évaluée selon l’état de santé et les moyens officiels disponibles.", "Utilisez les aménagements autorisés et demandez conseil si le rite est interrompu."),
  problem("miqat", "ihram", "J’ai dépassé le mîqât", "La conséquence dépend de votre intention avant le mîqât, de l’itinéraire et de la possibilité de revenir.", "Contactez immédiatement un guide qualifié ; ne choisissez pas seul un dam ou une fidya."),
  problem("after-miqat", "ihram", "Je suis arrivé après le mîqât", "Arriver après le mîqât nécessite de distinguer l’intention formée avant ou après la limite.", "Exposez l’itinéraire et les horaires à une personne qualifiée sans improviser de compensation."),
  problem("hair", "ihram", "J’ai coupé un cheveu involontairement", "L’oubli, la contrainte et l’acte volontaire ne reçoivent pas nécessairement le même traitement.", "Conservez le contexte exact et consultez si une compensation est envisagée."),
  problem("perfume", "ihram", "J’ai utilisé du parfum", "Un produit parfumé, son intention et son usage médical doivent être distingués.", "Cessez l’usage si possible, gardez la composition du produit et demandez un avis."),
  problem("shower", "ihram", "Puis-je prendre une douche ?", "Le lavage et l’hygiène ne sont pas identiques à l’usage intentionnel de parfum.", "Utilisez si possible des produits non parfumés et vérifiez leur composition."),
  problem("products", "ihram", "Savon, crème solaire ou produits parfumés ?", "Savon, crème solaire et médicament peuvent avoir des compositions et nécessités différentes.", "Privilégiez le non-parfumé ; ne cessez jamais un traitement sans médecin."),
  problem("intention", "ihram", "J’ai oublié l’intention", "La validité d’une intention dépend de ce qui a été voulu et du moment où le rite a été commencé.", "Décrivez les faits exactement ; ne tentez pas de reconstruire l’intention après coup."),
  problem("exit", "ihram", "Je ne sais pas quand sortir de l’ihrâm", "La sortie de l’ihrâm intervient après les actes requis et la coupe adaptée au rite.", "Vérifiez votre étape et votre type de Hajj avant de lever les restrictions."),
  problem("period", "women", "Je suis enceinte ou j’ai mes règles", "La grossesse et les menstruations sont deux situations distinctes et ne produisent pas automatiquement les mêmes effets.", "Demandez séparément un avis médical et religieux personnalisé."),
  problem("period-farewell", "women", "Menstruations avant le Tawâf d’adieu", "La femme menstruée qui a achevé les autres rites bénéficie d’une exemption rapportée pour le Tawâf d’adieu.", "Vérifiez avec un guide qu’aucun autre rite ou départ obligatoire ne reste à traiter."),
  problem("sick", "health", "Je suis malade ou en fauteuil roulant", "La maladie ou le handicap peuvent nécessiter des aménagements officiels ; la sécurité reste prioritaire.", "Suivez les dispositifs autorisés et l’encadrement médical et religieux."),
  problem("tired", "health", "Je suis épuisé ou déshydraté", "La déshydratation peut rendre dangereuse la poursuite immédiate du rite.", "Mettez-vous à l’abri, hydratez-vous et prévenez l’encadrement."),
  problem("lost", "health", "Je me suis perdu dans la foule", "Se perdre dans la foule est d’abord une situation de sécurité, pas une faute rituelle.", "Rejoignez un point de rassemblement officiel et contactez votre groupe."),
  problem("medicine", "health", "Je dois utiliser un médicament parfumé", "La nécessité d’un médicament parfumé doit être distinguée d’un usage de confort.", "Ne stoppez pas le traitement ; demandez un avis médical et juridique."),
  problem("step", "hajj", "J’ai oublié une étape", "Un acte oublié peut être un pilier, une obligation ou une recommandation : les conséquences diffèrent.", "Notez l’acte et le moment précis, puis demandez conseil avant de continuer au hasard."),
  problem("obligation", "hajj", "J’ai un doute sur une obligation", "Une obligation, un pilier et une recommandation n’ont pas la même conséquence.", "Identifiez la qualification de l’acte auprès d’un référent fiable."),
  problem("mina", "hajj", "J’ai quitté Mina avant la fin des jours", "Le départ de Mina le 12 et le séjour jusqu’au 13 ont des conditions distinctes.", "Notez l’heure et les rites accomplis, puis consultez rapidement."),
  problem("sacrifice", "hajj", "Je ne sais pas si le sacrifice m’incombe", "Le type de Hajj, notamment Tamattu‘, Qirân ou Ifrâd, peut déterminer le hady.", "Vérifiez votre type et votre situation avec une personne qualifiée avant de payer ou d’omettre un sacrifice."),
  problem("farewell", "hajj", "Je n’ai pas pu faire le Tawâf al-Wadâ‘", "Le Tawâf d’adieu comporte des exemptions et des cas particuliers documentés.", "Consultez avant le départ, surtout en cas de menstruations, maladie ou contrainte de transport."),
];
