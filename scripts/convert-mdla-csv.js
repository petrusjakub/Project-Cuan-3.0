#!/usr/bin/env node
/**
 * Converts Source/MDLA/tabel_premi_mylife_flat.csv into public/assets/mdla-premi.js
 * Output format: var MDLA_PREMI_DATA = { 'Gender|Age|Plan|Term|PPP': { 'UP_label': 'premi_value', ... }, ... };
 */

const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '..', 'Source', 'MDLA', 'tabel_premi_mylife_flat.csv');
const outPath = path.join(__dirname, '..', 'public', 'assets', 'mdla-premi.js');

const csv = fs.readFileSync(csvPath, 'utf8');
const lines = csv.trim().split('\n');

// Skip header: Gender,Usia,Plan,Term,PPP,UP,Premi
const data = {};

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;

  // Parse CSV - handle potential commas in Premi values like "1,234.5"
  const parts = line.split(',');
  // The CSV has 7 columns: Gender, Usia, Plan, Term, PPP, UP, Premi
  // Premi may contain commas (e.g., "1,234.5"), so we join everything from index 6 onward
  const gender = parts[0];
  const age = parts[1];
  const plan = parts[2];
  const term = parts[3];
  const ppp = parts[4];
  const up = parts[5];
  const premi = parts.slice(6).join(',').replace(/^"|"$/g, '');

  const key = `${gender}|${age}|${plan}|${term}|${ppp}`;
  const value = premi === 'Kombinasi tidak tersedia' ? '-' : premi;

  if (!data[key]) {
    data[key] = {};
  }
  data[key][up] = value;
}

// Write output
const json = JSON.stringify(data);
const output = `var MDLA_PREMI_DATA = ${json};\n`;

fs.writeFileSync(outPath, output, 'utf8');

const keyCount = Object.keys(data).length;
console.log(`Generated ${outPath}`);
console.log(`Total keys: ${keyCount}`);
console.log(`File size: ${(Buffer.byteLength(output) / 1024 / 1024).toFixed(2)} MB`);
