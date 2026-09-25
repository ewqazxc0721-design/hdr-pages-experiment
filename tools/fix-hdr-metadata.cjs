// Repair this specific fixture without recompressing its image data.
// AV1 syntax: https://aomediacodec.github.io/av1-spec/
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'assets/hdr-pq-test.avif'));
assert.equal(createHash('sha256').update(source).digest('hex'),
  '42b0633ce4e261cd72bc4da53a383a5f61a9de2e85ea60dae12bb9a3b1b567f5',
  'Unexpected source: fixed offsets are only valid for the original fixture.');
assert.equal(source.subarray(243, 251).toString('ascii'), 'colrnclx');
assert.equal(source.subarray(289, 301).toString('hex'), '0a0a3a2ab1fce1ef02020990');

const fixed = Buffer.from(source);
// HEIF colr/nclx: 16-bit big-endian CICP primaries and transfer.
fixed.writeUInt16BE(9, 251); // BT.2020
fixed.writeUInt16BE(16, 253); // SMPTE ST 2084 (PQ)
// Matching 8-bit fields in the AV1 reduced still-picture sequence header.
// Profile 1, 10-bit, color_description_present_flag=1; fields are byte aligned.
fixed[297] = 9;
fixed[298] = 16;
assert.deepEqual([...fixed.keys()].filter(i => fixed[i] !== source[i]), [252, 254, 297, 298]);
// Every byte of the encoded frame OBU remains unchanged.
assert.ok(fixed.subarray(301).equals(source.subarray(301)));
fs.writeFileSync(path.join(root, 'assets/hdr-pq-test-tagged.avif'), fixed);
console.log('Corrected container and AV1 CICP: 2/2/9 -> 9/16/9; only 4 bytes changed.');
