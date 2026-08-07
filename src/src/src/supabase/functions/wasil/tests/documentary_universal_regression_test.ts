import { extractIntentConcepts, buildQuranSearchTerms, buildHadithSearchTerms } from "../engine/UniversalIntent.ts";
import { rankDocuments } from "../engine/RelevanceScorer.ts";

type Candidate = { reference: string; text: string };

const cases: Array<{
  question: string;
  expectedConcept: string;
  direct: Candidate;
  distractor: Candidate;
}> = [
  { question: "Que dit l’Islam sur la colère selon le Coran et la Sunna ?", expectedConcept: "anger", direct: { reference: "3:134", text: "ceux qui maîtrisent leur colère et pardonnent" }, distractor: { reference: "112:1-4", text: "Allah est Unique" } },
  { question: "Que dit l’Islam sur la jalousie et l’envie ?", expectedConcept: "envy", direct: { reference: "113:5", text: "contre le mal de l'envieux lorsqu'il envie" }, distractor: { reference: "114:1-6", text: "je cherche protection auprès du Seigneur des hommes" } },
  { question: "Que dit l’Islam sur les promesses et engagements ?", expectedConcept: "promise", direct: { reference: "16:91", text: "respectez l'engagement envers Allah après l'avoir contracté" }, distractor: { reference: "9:117-119", text: "récit de l'expédition et des trois compagnons" } },
  { question: "Que dit l’Islam sur le mensonge ?", expectedConcept: "truth", direct: { reference: "16:105", text: "ce sont eux les menteurs qui inventent le mensonge" }, distractor: { reference: "9:117-119", text: "histoire de Tabuk et repentir des trois compagnons" } },
  { question: "Que dit l’Islam sur l’orgueil ?", expectedConcept: "pride", direct: { reference: "17:37", text: "ne marche pas sur terre avec arrogance" }, distractor: { reference: "1:1-7", text: "guide nous dans le droit chemin" } },
  { question: "Que dit l’Islam sur la patience dans l’épreuve ?", expectedConcept: "patience", direct: { reference: "2:153", text: "cherchez secours dans la patience et la prière" }, distractor: { reference: "24:35", text: "Allah est la lumière des cieux et de la terre" } },
  { question: "Comment se repentir sincèrement ?", expectedConcept: "repentance", direct: { reference: "39:53", text: "ne désespérez pas de la miséricorde d'Allah" }, distractor: { reference: "33:40", text: "Muhammad est le messager d'Allah" } },
  { question: "Quels sont les droits du voisin ?", expectedConcept: "neighbors", direct: { reference: "4:36", text: "agissez avec bonté envers le voisin proche et le voisin lointain" }, distractor: { reference: "5:6", text: "lavez vos visages pour les ablutions" } },
  { question: "Quels devoirs envers les parents ?", expectedConcept: "parents", direct: { reference: "17:23", text: "ne leur dis pas ouf et sois bienfaisant envers tes parents" }, distractor: { reference: "2:183", text: "le jeûne vous est prescrit" } },
  { question: "Que dit l’Islam sur la pudeur ?", expectedConcept: "modesty", direct: { reference: "24:30", text: "qu'ils baissent leurs regards et préservent leur chasteté" }, distractor: { reference: "106:1-4", text: "le pacte des Quraysh" } },
  { question: "Que dit l’Islam sur les dettes ?", expectedConcept: "debt", direct: { reference: "2:282", text: "quand vous contractez une dette écrivez la" }, distractor: { reference: "55:1-78", text: "les bienfaits du Miséricordieux" } },
  { question: "Que dit l’Islam sur la médisance ?", expectedConcept: "backbiting", direct: { reference: "49:12", text: "ne médisez pas les uns des autres comme manger la chair de son frère" }, distractor: { reference: "97:1-5", text: "la nuit du destin" } },
];

for (const test of cases) {
  const concepts = extractIntentConcepts(test.question).map((item) => item.id);
  if (!concepts.includes(test.expectedConcept)) throw new Error(`Intent manquant: ${test.expectedConcept}`);
  if (buildQuranSearchTerms(test.question).length === 0) throw new Error(`Termes Coran absents: ${test.question}`);
  if (buildHadithSearchTerms(test.question).length === 0) throw new Error(`Termes Hadith absents: ${test.question}`);
  const ranked = rankDocuments(
    [test.direct, test.distractor],
    (item) => ({ text: item.text, reference: item.reference, queryTerms: [test.question], canonicalName: test.question }),
    0,
    2,
    true,
  );
  if (ranked[0]?.item.reference !== test.direct.reference) {
    throw new Error(`Mauvais classement pour ${test.question}: ${ranked[0]?.item.reference}`);
  }
}

console.log(`documentary universal regression: ${cases.length} cas OK`);
