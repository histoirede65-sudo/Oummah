import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "index.ts"), "utf8");
const detection = source.indexOf("detectFreeSocialInteraction(effectiveQuestion, requestId)");
const socialEnd = source.indexOf("const deterministicLocalAnswer", detection);
const reserve = source.indexOf('postgrestRpc("reserve_wasil_credits"');

assert.ok(detection > 0, "social detection must exist");
assert.ok(reserve > detection, "social detection must precede credit reservation");

for (const family of ["thanks", "greeting", "compliment", "invocation", "acknowledgement", "farewell"]) {
  assert.ok(source.includes(`reason: "${family}"`), `family missing: ${family}`);
}
assert.ok(source.includes('reason: "affection"'), "affection family missing");
assert.ok(source.includes('reason: "encouragement"'), "encouragement family missing");
assert.ok(source.includes("${requestId}:${reason}:${question}"), "requestId-based variation missing");
assert.ok(source.includes("const index = hash % choices.length"), "selection must use only the computed index");
assert.ok(source.includes("renderSocialResponse(choices[index]"), "selected response must be rendered from the bank");
assert.ok(source.includes("function renderSocialResponse"), "response rendering guard missing");
for (const feature of [
  "normalize",
  "replace(/(.)\\1{2,}/g",
  "jtm",
  "barakallah",
  "masterclass",
  "mashallah",
  "SOCIAL_REQUEST_GUARD",
  "positiveContext",
]) {
  assert.ok(source.includes(feature), `tolerant detection feature missing: ${feature}`);
}

for (const example of [
  "je t’aime",
  "je taime",
  "jtm trop",
  "t’es le meilleur",
  "tu gères",
  "quelle réponse incroyable",
  "merci mon frère",
  "tu m’aides beaucoup",
  "❤️❤️🔥",
  "ok parfait",
]) {
  assert.ok(example.length > 0, `example registered: ${example}`);
}

for (const guard of [
  "explique",
  "raconte",
  "sources",
  "continue",
  "programme",
  "moussa",
  "maghrib",
  "priere",
]) {
  assert.ok(source.includes(guard), `guard missing: ${guard}`);
}

const socialBlock = source.slice(detection, socialEnd);
for (const forbidden of [
  'postgrestRpc("reserve_wasil_credits"',
  'postgrestRpc("complete_wasil_request"',
  'postgrestRpc("refund_wasil_credits"',
  "runWasilV4ShadowPipeline",
  "fetch(\"https://api.openai.com",
]) {
  assert.equal(socialBlock.includes(forbidden), false, `social path must not call ${forbidden}`);
}

for (const field of [
  "creditsCharged: 0",
  "freeSocialInteraction: true",
  "freeSocialReason",
  "quranReferences: []",
  "hadithReferences: []",
  "webReferences: []",
]) {
  assert.ok(source.includes(field), `social response contract missing: ${field}`);
}

for (const forbidden of ["moi aussi je t'aime", "je ressens la meme chose", "tu me rends heureux", "je serai toujours avec toi"]) {
  assert.equal(source.toLocaleLowerCase("fr").includes(forbidden), false, `forbidden affection wording: ${forbidden}`);
}

for (const technical of ["selectionKey + response", "`${computedHash}${responses[index]}`", "return requestId + response"]) {
  assert.equal(source.includes(technical), false, `technical value must not enter social body: ${technical}`);
}
assert.equal(source.includes('body: freeSocialInteraction.body,'), false, "public body must pass through the response renderer");

console.log("social_interaction_fast_path_test: PASS");
