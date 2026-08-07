import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const source = fs.readFileSync(path.join(here, "..", "index.ts"), "utf8");

assert.match(source, /const isFreeClarificationFollowUp = Boolean\(clarificationOf\)/);
assert.match(source, /const credits = isFreeClarificationFollowUp\s*\? 0/);
assert.match(source, /if \(isFreeClarificationFollowUp\) \{[\s\S]*WASIL_FREE_CLARIFICATION_FOLLOW_UP/);
assert.match(source, /if \(hasCreditReservation\) runInBackground\([\s\S]*complete_wasil_request/);
assert.match(source, /const refundedBalance = hasCreditReservation[\s\S]*refund\(user\.id, requestId, parsed\.status\)[\s\S]*: balance/);

console.log("clarification_follow_up_credit_test: OK");
