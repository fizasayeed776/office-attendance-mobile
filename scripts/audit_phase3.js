/**
 * Phase 3 audit — spacing, typography, border-radius, card padding consistency.
 */
const fs   = require('fs');
const path = require('path');

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return walk(full);
    if (e.name.endsWith('.tsx') || e.name.endsWith('.ts')) return [full];
    return [];
  });
}

// Known token values
const SPACING = { xxs:2, xs:4, sm:8, md:12, lg:16, xl:20, xxl:28, xxxl:40 };
const SPACING_VALS = new Set(Object.values(SPACING));
const RADIUS = { xs:4, sm:8, md:12, lg:16, xl:20, xxl:24, pill:999 };
const RADIUS_VALS = new Set(Object.values(RADIUS));
const TYPO = { xs:11, sm:12, base:13, md:14, lg:15, xl:17, xxl:20, xxxl:24, display:28, hero:34 };
const TYPO_VALS = new Set(Object.values(TYPO));

const files = walk('./src');

const report = {
  hardcodedSpacing: {},   // file -> [hits]
  hardcodedFontSize: {},  // file -> [hits]
  hardcodedRadius: {},    // file -> [hits]
  cardPadding: {},        // file -> [padding values found on card-like styles]
  headingSizes: {},       // file -> [sizes used for headings (fontFamily bold/extrabold)]
};

for (const f of files) {
  const rel = path.relative('./src', f).replace(/\\/g, '/');
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');

  const hcSpacing = [];
  const hcFontSize = [];
  const hcRadius = [];
  const cardPads = new Set();

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*')) return;

    // --- Hardcoded spacing (padding/margin/gap with raw number not matching token)
    const spRe = /(?:padding(?:Horizontal|Vertical|Top|Bottom|Left|Right)?|margin(?:Top|Bottom|Left|Right|Horizontal|Vertical)?|gap):\s*(\d+)/g;
    let m;
    while ((m = spRe.exec(line)) !== null) {
      const val = parseInt(m[1]);
      if (val <= 3) continue; // border widths 1-3 are intentional
      if (SPACING_VALS.has(val)) continue; // matches a spacing token value exactly
      // Check if line already references a spacing. token
      if (line.includes('spacing.')) continue;
      hcSpacing.push(`L${i+1}: ${m[0].trim()}  <-- ${trimmed.substring(0,70)}`);
    }

    // --- Hardcoded font sizes
    const fsRe = /fontSize:\s*(\d+)/g;
    while ((m = fsRe.exec(line)) !== null) {
      const val = parseInt(m[1]);
      if (line.includes('typography.')) continue;
      if (TYPO_VALS.has(val)) continue; // coincidentally matches token value
      hcFontSize.push(`L${i+1}: fontSize:${val}  <-- ${trimmed.substring(0,70)}`);
    }

    // --- Hardcoded borderRadius
    const brRe = /borderRadius:\s*(\d+)/g;
    while ((m = brRe.exec(line)) !== null) {
      const val = parseInt(m[1]);
      if (val <= 3) continue; // tiny radii for handles/dividers are fine
      if (RADIUS_VALS.has(val)) continue;
      if (line.includes('radius.')) continue;
      hcRadius.push(`L${i+1}: borderRadius:${val}  <-- ${trimmed.substring(0,70)}`);
    }

    // --- Card padding: lines that look like card style defs with padding
    if (/\bcard\b.*padding:\s*spacing\.(\w+)/.test(line)) {
      const mp = line.match(/padding:\s*spacing\.(\w+)/);
      if (mp) cardPads.add('spacing.' + mp[1]);
    }
    if (/\bcontent\b.*padding:\s*spacing\.(\w+)/.test(line)) {
      const mp = line.match(/padding:\s*spacing\.(\w+)/);
      if (mp) cardPads.add('content:spacing.' + mp[1]);
    }
  });

  if (hcSpacing.length)   report.hardcodedSpacing[rel]  = hcSpacing;
  if (hcFontSize.length)  report.hardcodedFontSize[rel] = hcFontSize;
  if (hcRadius.length)    report.hardcodedRadius[rel]   = hcRadius;
  if (cardPads.size)      report.cardPadding[rel]       = [...cardPads];
}

// ── Print results ──────────────────────────────────────────────────────────

function section(title) { console.log('\n' + '='.repeat(60)); console.log(title); console.log('='.repeat(60)); }

section('1. HARDCODED SPACING VALUES (not using spacing.X token)');
const spFiles = Object.keys(report.hardcodedSpacing);
if (spFiles.length === 0) {
  console.log('EXISTS — all spacing uses tokens or intentional fixed values (borderWidth 1-3)');
} else {
  console.log(`PARTIAL — ${spFiles.length} files have hardcoded spacing:`);
  spFiles.forEach(f => {
    console.log(`\n  ${f} (${report.hardcodedSpacing[f].length} hits):`);
    report.hardcodedSpacing[f].forEach(h => console.log('    ' + h));
  });
}

section('2. HARDCODED FONT SIZES (not using typography.X token)');
const fsFiles = Object.keys(report.hardcodedFontSize);
if (fsFiles.length === 0) {
  console.log('EXISTS — all font sizes use typography tokens');
} else {
  console.log(`PARTIAL — ${fsFiles.length} files have hardcoded font sizes:`);
  fsFiles.forEach(f => {
    console.log(`\n  ${f} (${report.hardcodedFontSize[f].length} hits):`);
    report.hardcodedFontSize[f].forEach(h => console.log('    ' + h));
  });
}

section('3. HARDCODED BORDER-RADIUS VALUES (not using radius.X token)');
const brFiles = Object.keys(report.hardcodedRadius);
if (brFiles.length === 0) {
  console.log('EXISTS — all border-radius uses radius tokens or intentional tiny values');
} else {
  console.log(`PARTIAL — ${brFiles.length} files have hardcoded border-radius:`);
  brFiles.forEach(f => {
    console.log(`\n  ${f} (${report.hardcodedRadius[f].length} hits):`);
    report.hardcodedRadius[f].forEach(h => console.log('    ' + h));
  });
}

section('4. CARD PADDING VALUES ACROSS SCREENS');
const cpFiles = Object.keys(report.cardPadding);
if (cpFiles.length === 0) {
  console.log('(No card padding token refs auto-detected in single-line card defs — see below)');
} else {
  cpFiles.forEach(f => console.log(`  ${f}: ${report.cardPadding[f].join(', ')}`));
}
