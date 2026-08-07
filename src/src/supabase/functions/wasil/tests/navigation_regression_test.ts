function normalizeQuestion(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim().slice(0, 500);
}
function explicitlyRequestsAppNavigation(question: string): boolean {
  const normalized = normalizeQuestion(question);
  const documentaryQuestion =
    /\b(?:que dit|selon|d apres|explique|pourquoi|quels?|quelles?|donne moi|parle moi)\b/.test(normalized) &&
    /\b(?:coran|quran|sunna|sunnah|hadiths?|versets?)\b/.test(normalized);
  if (documentaryQuestion) return false;
  const explicitCommand =
    /\b(?:ouvre|ouvrir|lance|lancer|va|aller|emmene moi|amene moi|dirige moi|affiche|accede|rends toi)\b/.test(normalized);
  const appDestination =
    /\b(?:coran|quran|sourate|verset|hadiths?|qibla|mosquee|objectifs?|calendrier|profil|audio|ecouter|dhikr|doua)\b/.test(normalized);
  return explicitCommand && appDestination;
}
const cases: Array<[string, boolean]> = [
  ["Que dit l'Islam sur le respect des promesses et des engagements selon le Coran et la Sunna ?", false],
  ["Que dit le Coran sur le mensonge ?", false],
  ["Quels hadiths parlent du voisin ?", false],
  ["Ouvre le Coran", true],
  ["Va à la Qibla", true],
];
for (const [question, expected] of cases) {
  const actual = explicitlyRequestsAppNavigation(question);
  if (actual !== expected) throw new Error(`${question}: attendu ${expected}, reçu ${actual}`);
}
console.log("navigation_regression_test: OK");
