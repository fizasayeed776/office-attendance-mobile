/**
 * transform_fonts.js
 * Replaces fontWeight: 'N' with fontFamily: 'Inter_NXxx' in StyleSheet
 * declarations, and adds `fonts` to the theme import in each file.
 *
 * Usage: node scripts/transform_fonts.js <file1> [file2 ...]
 */

const fs   = require('fs');
const path = require('path');

const WEIGHT_MAP = {
  '400': 'Inter_400Regular',
  '500': 'Inter_500Medium',
  '600': 'Inter_600SemiBold',
  '700': 'Inter_700Bold',
  '800': 'Inter_800ExtraBold',
};

function transformFile(filePath) {
  let src = fs.readFileSync(filePath, 'utf8');
  const original = src;

  // 1. Replace every  fontWeight: 'N'  with  fontFamily: 'Inter_NXxx'
  //    Handles both inline (single-line) and multi-line style objects.
  src = src.replace(/fontWeight:\s*'(\d+)'/g, (match, w) => {
    const mapped = WEIGHT_MAP[w];
    if (!mapped) {
      console.warn(`  [WARN] Unknown fontWeight '${w}' in ${filePath} — left unchanged`);
      return match;
    }
    return `fontFamily: '${mapped}'`;
  });

  // 2. Ensure `fonts` is imported from the theme.
  //    The files import from '../theme/colors' or '../../theme/colors' etc.
  //    Pattern: import { ..., colors, ..., typography, ... } from '...theme/colors'
  //    We need to add `fonts` if it isn't already there.
  if (!/\bfonts\b/.test(src.match(/import\s*\{[^}]*\}\s*from\s*['"][^'"]*theme\/colors['"]/)?.[0] ?? '')) {
    // Add `fonts` to the existing theme import
    src = src.replace(
      /(import\s*\{)([^}]*?)(\}\s*from\s*['"][^'"]*theme\/colors['"])/,
      (match, open, members, close) => {
        // Avoid duplicating if somehow already present
        if (/\bfonts\b/.test(members)) return match;
        const trimmed = members.trimEnd();
        const sep = trimmed.endsWith(',') ? ' ' : ', ';
        return `${open}${trimmed}${sep}fonts${close}`;
      }
    );
  }

  if (src !== original) {
    fs.writeFileSync(filePath, src, 'utf8');
    console.log(`  updated: ${path.relative(process.cwd(), filePath)}`);
  } else {
    console.log(`  no-op:   ${path.relative(process.cwd(), filePath)}`);
  }
}

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('Usage: node scripts/transform_fonts.js <file1> [file2 ...]');
  process.exit(1);
}

for (const f of files) {
  transformFile(path.resolve(f));
}
console.log('Done.');
