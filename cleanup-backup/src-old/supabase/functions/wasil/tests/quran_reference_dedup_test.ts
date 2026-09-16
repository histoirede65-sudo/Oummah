import {
  deduplicateQuranReferences,
  deduplicateSelectedQuranSourceIds,
  parseQuranReference,
} from "../engine/QuranReferenceUtils.ts";

const references = deduplicateQuranReferences([
  { surah: 113, verseStart: 1, verseEnd: 5 },
  { surah: 113, verseStart: 5, verseEnd: null },
  { surah: 113, verseStart: 5, verseEnd: 5 },
  { surah: 4, verseStart: 32, verseEnd: null },
  { surah: 4, verseStart: 32, verseEnd: null },
]);

const keys = references.map((reference) =>
  `${reference.surah}:${reference.verseStart}:${reference.verseEnd ?? reference.verseStart}`
);
if (keys.join(",") !== "4:32:32,113:5:5") {
  throw new Error(`Déduplication inattendue: ${keys.join(",")}`);
}

const sources = {
  broad: { reference: "Coran 113:1-5" },
  precise: { reference: "Coran 113:5" },
  duplicate: { reference: "Coran 113:5" },
  other: { reference: "Coran 4:32" },
  hadith: { reference: "Sahih Muslim n°1" },
};
const ids = deduplicateSelectedQuranSourceIds(
  ["broad", "precise", "duplicate", "other", "hadith"],
  sources,
);
if (ids.includes("broad")) throw new Error("La plage large aurait dû être retirée");
if (!ids.includes("precise")) throw new Error("Le verset précis doit être conservé");
if (ids.filter((id) => id === "precise" || id === "duplicate").length !== 1) {
  throw new Error(`Un seul doublon précis doit rester: ${ids.join(",")}`);
}
if (!ids.includes("other") || !ids.includes("hadith")) {
  throw new Error(`Les autres sources doivent rester: ${ids.join(",")}`);
}

if (parseQuranReference("Coran 115:1") !== null) {
  throw new Error("Une sourate invalide ne doit pas être acceptée");
}
if (parseQuranReference("Coran 2:10-4") !== null) {
  throw new Error("Une plage inversée ne doit pas être acceptée");
}

console.log("quran_reference_dedup_test: OK");
