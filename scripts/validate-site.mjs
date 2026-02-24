import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const htmlFiles = fs.readdirSync(root).filter((f) => f.endsWith('.html'));
const issues = [];
const warnings = [];

function existsLocal(assetPath) {
  const clean = assetPath.split('#')[0].split('?')[0];
  return fs.existsSync(path.join(root, clean));
}

for (const file of htmlFiles) {
  const full = path.join(root, file);
  const html = fs.readFileSync(full, 'utf8');

  if (!html.includes('<meta charset=')) issues.push(`${file}: missing charset meta`);
  if (!html.includes('name="viewport"')) issues.push(`${file}: missing viewport meta`);

  const headingMatches = [...html.matchAll(/<h([1-6])\b/gi)].map((m) => Number(m[1]));
  for (let i = 1; i < headingMatches.length; i += 1) {
    if (headingMatches[i] - headingMatches[i - 1] > 1) {
      warnings.push(`${file}: heading jump h${headingMatches[i - 1]} -> h${headingMatches[i]}`);
      break;
    }
  }

  const srcHrefMatches = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1]);
  for (const ref of srcHrefMatches) {
    if (/^(https?:|mailto:|#)/.test(ref)) continue;
    if (!existsLocal(ref)) issues.push(`${file}: missing local asset/link ${ref}`);
  }

  const imgs = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
  for (const imgTag of imgs) {
    if (!/\balt="[^"]*"/i.test(imgTag)) issues.push(`${file}: img missing alt`);
  }

  const blankLinks = [...html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/gi)].map((m) => m[0]);
  for (const linkTag of blankLinks) {
    if (!/rel="[^"]*noopener[^"]*"/i.test(linkTag)) issues.push(`${file}: target=_blank missing noopener`);
  }
}

if (issues.length > 0) {
  console.error('Validation failed:\n' + issues.map((i) => `- ${i}`).join('\n'));
  process.exit(1);
}

console.log(`Validation passed for ${htmlFiles.length} HTML files.`);
if (warnings.length) {
  console.log('Warnings:\n' + warnings.map((w) => `- ${w}`).join('\n'));
}