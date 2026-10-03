import assert from "node:assert/strict";
import {
  findQuranDirectLookupTopic,
  getQuranDirectLookupAnswer,
  isSimpleQuranVerseLookup,
} from "../engine/QuranDirectLookup.ts";
import { parseQuranReference } from "../engine/QuranReferenceUtils.ts";

const mercyQuestion = "Quel est le verset sur la miséricorde ?";
assert.equal(isSimpleQuranVerseLookup(mercyQuestion), true);
assert.equal(findQuranDirectLookupTopic(mercyQuestion)?.id, "mercy");

const mercy = getQuranDirectLookupAnswer(mercyQuestion);
assert.ok(mercy, "The mercy question must resolve locally");
assert.deepEqual(
  mercy.sourceIds,
  ["quran-topic:mercy:hope", "quran-topic:mercy:embraces"],
);
assert.equal(mercy.sources["quran-topic:mercy:hope"].reference, "Coran 39:53");
assert.equal(mercy.sources["quran-topic:mercy:embraces"].reference, "Coran 7:156");
assert.deepEqual(parseQuranReference("Coran 39:53"), { surah: 39, verseStart: 53, verseEnd: null });
assert.deepEqual(parseQuranReference("Coran 2:155-157"), { surah: 2, verseStart: 155, verseEnd: 157 });

assert.equal(
  getQuranDirectLookupAnswer("Donne-moi un verset sur la patience")?.topicId,
  "patience",
);
assert.equal(
  getQuranDirectLookupAnswer("Quel verset parle des parents ?")?.topicId,
  "parents",
);

// Explanations and legal/personal questions must keep Wasil's full verified pipeline.
assert.equal(
  getQuranDirectLookupAnswer("Explique-moi le verset sur la miséricorde"),
  null,
);
assert.equal(
  getQuranDirectLookupAnswer("Est-ce que le mariage est halal ?"),
  null,
);

console.log("quran_direct_lookup_test: ok");
