#!/usr/bin/env node
/**
 * Converts Source/MDLA/tabel_premi_mylife_flat.csv into public/data/mdla-premi.json
 * 
 * Output JSON structure:
 * {
 *   "data": { "Gender|Age|Plan|Term|PPP": { "UP_label": "premi_value", ... }, ... },
 *   "terms": { "Gender|Age|Plan": ["20", "30", ...] },
 *   "ppp": { "Gender|Age|Plan|Term": ["5", "10", ...] }
 * }
 *
 * - Entries where ALL UP values are "-" (unavailable) are omitted from "data"
 * - A term is "available" if at least one PPP+UP combo for that Gender|Age|Plan|Term has a non-"-" value
 * - A PPP is "available" if at least one UP value for that Gender|Age|Plan|Term|PPP is non-"-"
 */

const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '..', 'Source', 'MDLA', 'tabel_premi_mylife_flat.csv');
const outDir = path.join(__dirname, '..', 'public', 'data');
const outPath = path.join(outDir, 'mdla-premi.json');

// Ensure output directory exists
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const csv = fs.readFileSync(csvPath, 'utf8');
const lines = csv.trim().split('\n');

// Skip header: Gender,Usia,Plan,Term,PPP,UP,Premi
const rawData = {};

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;

  // Parse CSV - handle potential commas in Premi values like "1,234.5"
  const parts = line.split(',');
  const gender = parts[0];
  const age = parts[1];
  const plan = parts[2];
  const term = parts[3];
  const ppp = parts[4];
  const up = parts[5];
  const premi = parts.slice(6).join(',').replace(/^"|"$/g, '');

  const key = `${gender}|${age}|${plan}|${term}|${ppp}`;
  const value = premi === 'Kombinasi tidak tersedia' ? '-' : premi;

  if (!rawData[key]) {
    rawData[key] = {};
  }
  rawData[key][up] = value;
}

// Build the optimized output
const data = {};
const termsIndex = {};
const pppIndex = {};

// Track availability sets
const termAvailability = {}; // "Gender|Age|Plan" -> Set of available terms
const pppAvailability = {}; // "Gender|Age|Plan|Term" -> Set of available PPPs

for (const [key, upValues] of Object.entries(rawData)) {
  // Check if ALL UP values are "-"
  const hasValidValue = Object.values(upValues).some(v => v !== '-');

  if (hasValidValue) {
    // Include in data (omit entries where all values are "-")
    data[key] = upValues;
  }

  // Parse key components for availability indices
  const [gender, age, plan, term, ppp] = key.split('|');
  const termKey = `${gender}|${age}|${plan}`;
  const pppKey = `${gender}|${age}|${plan}|${term}`;

  // A term is available if at least one UP in any PPP for that combo has a non-"-" value
  if (hasValidValue) {
    if (!termAvailability[termKey]) {
      termAvailability[termKey] = new Set();
    }
    termAvailability[termKey].add(term);

    // A PPP is available if at least one UP value for that combo is non-"-"
    if (!pppAvailability[pppKey]) {
      pppAvailability[pppKey] = new Set();
    }
    pppAvailability[pppKey].add(ppp);
  }
}

// Convert Sets to sorted arrays for the indices
for (const [key, termSet] of Object.entries(termAvailability)) {
  termsIndex[key] = Array.from(termSet).sort((a, b) => parseInt(a) - parseInt(b));
}

for (const [key, pppSet] of Object.entries(pppAvailability)) {
  pppIndex[key] = Array.from(pppSet).sort((a, b) => parseInt(a) - parseInt(b));
}

// Write output JSON
const output = JSON.stringify({ data, terms: termsIndex, ppp: pppIndex });
fs.writeFileSync(outPath, output, 'utf8');

const dataKeyCount = Object.keys(data).length;
const termsKeyCount = Object.keys(termsIndex).length;
const pppKeyCount = Object.keys(pppIndex).length;
const fileSizeMB = (Buffer.byteLength(output) / 1024 / 1024).toFixed(2);

console.log(`Generated ${outPath}`);
console.log(`Data entries: ${dataKeyCount} (omitted ${Object.keys(rawData).length - dataKeyCount} all-unavailable entries)`);
console.log(`Terms index entries: ${termsKeyCount}`);
console.log(`PPP index entries: ${pppKeyCount}`);
console.log(`File size: ${fileSizeMB} MB`);
