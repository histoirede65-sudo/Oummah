import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const moduleSource = fs.readFileSync(path.join(here, 'mosqueImage.ts'), 'utf8');
const listSource = fs.readFileSync(path.join(here, '../../../app/mosques.tsx'), 'utf8');
const detailSource = fs.readFileSync(path.join(here, '../../../app/mosque/[id].tsx'), 'utf8');
const userSource = fs.readFileSync(path.join(here, 'userMosques.ts'), 'utf8');

assert.equal((moduleSource.match(/require\('\.\.\/\.\.\/\.\.\/assets\/images\/mosques\/[^']+\.jpg'\)/g) ?? []).length, 50);
assert.equal(moduleSource.includes('Math.random'), false);
assert.equal(moduleSource.includes('% MOSQUE_IMAGE_KEYS.length'), true);
assert.equal(listSource.includes('getMosqueImageSource(mosque.id, mosque.imageKey)'), true);
assert.equal(detailSource.includes('getMosqueImageSource(displayedMosque.id, displayedMosque.imageKey)'), true);
assert.equal(userSource.includes('getDeterministicMosqueImageKey(row.id)'), true);
assert.equal(userSource.includes('Math.random'), false);
assert.equal(userSource.includes('USER_MOSQUE_IMAGE_ASSIGNMENT_FAILED'), true);
assert.equal(listSource.includes('getMosqueImage(mosque.id)'), false);
assert.equal(detailSource.includes('getMosqueImage(displayedMosque.id)'), false);

console.log('mosqueImage.test: PASS');
