import fs from 'node:fs';
const source = fs.readFileSync(new URL('../index.ts', import.meta.url), 'utf8');
const required = [
  'resolveDeterministicDailyGuidance',
  'WASIL_LOCAL_GUIDANCE_FAST_PATH',
  '"dua:sleep"',
  '"dua:wakeup"',
  '"guide:ghusl"',
  '"guide:tayammum"',
  'openAiMs = 0',
];
for (const token of required) {
  if (!source.includes(token)) throw new Error(`Missing contract token: ${token}`);
}
console.log('local_guidance_fast_path_contract_test: OK');
