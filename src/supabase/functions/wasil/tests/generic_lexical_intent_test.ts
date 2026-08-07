import {
  buildHadithSearchTerms,
  buildQuranSearchTerms,
  extractIntentConcepts,
  extractSalientTerms,
} from "../engine/UniversalIntent.ts";

const cases = [
  ["Que dit l’Islam sur le fait de divulguer une confidence ?", ["divulguer", "confidence"]],
  ["Comment éviter l'espionnage et respecter la vie privée selon la Sunna ?", ["espionnage", "vie", "privee"]],
  ["Quels sont les droits du travailleur concernant son salaire ?", ["travailleur", "salaire"]],
  ["Que dit le Coran sur la modération dans la nourriture ?", ["moderation", "nourriture"]],
  ["Comment réparer le tort causé à une personne ?", ["reparer", "tort", "cause"]],
  ["Quelle est la règle sur le consentement dans le mariage ?", ["regle", "consentement", "mariage"]],
  ["Comment préserver l'environnement et ne pas gaspiller l'eau ?", ["preserver", "environnement", "gaspiller", "eau"]],
  ["Que dit la Sunna sur l'équité entre les enfants ?", ["equite", "enfants"]],
  ["Comment demander pardon après avoir diffamé quelqu'un ?", ["demander", "pardon", "diffame"]],
  ["Que dit l'Islam sur les pots-de-vin dans le commerce ?", ["pots", "vin", "commerce"]],
] as const;

for (const [question, expected] of cases) {
  const combined = [
    ...extractSalientTerms(question),
    ...buildQuranSearchTerms(question),
    ...buildHadithSearchTerms(question),
    ...extractIntentConcepts(question).flatMap((concept) => concept.aliases),
  ].join(" ");
  for (const token of expected) {
    if (!combined.includes(token)) {
      throw new Error(`${question}: terme essentiel absent: ${token} dans ${combined}`);
    }
  }
  if (/\b(?:coran|sunna|islam|selon|comment|quelle|quels)\b/u.test(combined)) {
    throw new Error(`${question}: bruit documentaire encore présent: ${combined}`);
  }
}

console.log(`generic_lexical_intent_test: OK (${cases.length} formulations inédites)`);
