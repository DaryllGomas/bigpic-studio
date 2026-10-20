#!/usr/bin/env node
// Security gate for public game devlogs (the JSON the game hub renders on a public page).
// Usage: node tools/hub/check-devlog.mjs <devlog.json> [more.json ...]
// Exits 1 and prints each offending line when a devlog holds anything private: contact details, internal
// addresses, machine names, file paths, personal topics, people, money, commit hashes or secrets. It also
// checks the shape the hub expects. Plain node, no npm. Run it before every publish; extend RULES as needed.
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

/** [label, pattern]. Every pattern runs against every string in the devlog (keys and values) and every raw line. */
export const RULES = [
  // contact details and addresses
  ['email address', /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i],
  ['@ handle or address', /(^|\s)@[A-Za-z0-9_]{2,}/],
  ['IPv4 address', /\b\d{1,3}(?:\.\d{1,3}){3}\b/],
  ['private network (192.168.)', /192\.168\./],
  ['localhost', /\blocalhost\b|127\.0\.0\.1/i],
  ['port number', /(?<![\d\w]):\d{2,5}\b|\d:\d{4,5}\b/],
  ['internal URL', /\bhttps?:\/\/(?!(?:studio|thepath)\.bigpicsolutions\.com\b)/i],
  // file paths and source files
  ['file path (/home/)', /\/home\//i],
  ['file path (~/)', /~\//],
  ['file path (C:\\)', /\b[A-Z]:\\/i],
  ['file path (/Users/, /mnt/, /tmp/, /etc/)', /\/(?:Users|mnt|tmp|etc|var|opt|srv)\//],
  ['source file name', /\b[\w-]+\.(?:md|sh|py|ts|mjs|cjs|tsx|jsx|env|yml|yaml|toml|ini|log)\b/i],
  ['.local hostname', /\.local\b/i],
  ['Telegram / Slack / Discord admin', /\b(?:telegram|slack)\b/i],
  ['payments (Stripe, PayPal, Ko-fi admin, invoice)', /\b(?:stripe|paypal|invoice|invoices|ko-?fi\s+admin|payout|bank)\b/i],
  ['repo or branch talk', /\b(?:git|github|commit|branch|merge|worktree|deploy|pull request|PR #?\d+)\b/i],
  // tools and people behind the work (the devlog is about the game, not how it was made)
  ['AI or build tooling', /\b(?:claude|codex|sonnet|opus|chatgpt|gpt-?\d|grok|gemini|qwen|kokoro|blender|playwright|playbot|vite|three\.js|npm|node)\b/i],
  ['agent or session talk', /\b(?:agent|agents|subagent|session|prompt|lane|swarm)\b/i],
  // personal topics
  ['personal: lease / rent', /\b(?:lease|rent|rental|landlord|mortgage)\b/i],
  ['personal: health', /\bhealth\b(?!\s+bars?\b)|\b(?:disability|disabled|medical|therapy|therapist|doctor|hospital|diagnos\w*|medication|surgery)\b/i],
  ['personal: money', /\b(?:salary|debt|loan|income|paycheck|runway|broke)\b/i],
  ['money amount', /[$€£]\s?\d|\b\d+(?:\.\d+)?\s?(?:USD|dollars|bucks)\b/i],
  // identifiers and secrets
  ['commit hash', /\b(?=[0-9a-f]*\d)(?=[0-9a-f]*[a-f])[0-9a-f]{7,40}\b/i],
  ['API key or token', /\b(?:sk|pk|rk)[-_](?:live|test|ant|proj)?[-_]?[A-Za-z0-9_-]{8,}|\bgh[pousr]_[A-Za-z0-9]{16,}|\bAKIA[0-9A-Z]{12,}|\bxox[abpr]-[A-Za-z0-9-]{8,}|\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{4,}/],
  ['secret-looking assignment', /\b(?:api[_-]?key|secret|token|password|passwd|bearer|auth)\b\s*[:=]/i],
  ['long random string', /\b(?=[A-Za-z0-9_-]*\d)(?=[A-Za-z0-9_-]*[A-Za-z])[A-Za-z0-9_-]{28,}\b/],
  ['UUID', /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i],
  // markup that would never render (the hub uses textContent) and usually means a copy-paste from somewhere else
  ['HTML or script', /<\s*\/?\s*[a-z!][^>]*>|javascript:/i],
];

// Names of people, machines and private services live OUTSIDE the repo, because this file is published with the site.
// Format: [{"label": "...", "pattern": "regex source", "flags": "i"}]. Missing file = refuse to run (fail closed).
const PRIVATE = process.env.DEVLOG_PRIVATE_RULES || join(homedir(), '.config', 'bigpic-studio', 'devlog-private.json');
try {
  for (const r of JSON.parse(readFileSync(PRIVATE, 'utf8'))) RULES.push([r.label, new RegExp(r.pattern, r.flags || '')]);
} catch (e) {
  console.error(`✗ private rules missing or invalid at ${PRIVATE} (${e.code || e.message}); refusing to check without them`);
  process.exit(2);
}

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const shape = (d) => {
  const errs = [];
  const need = (ok, msg) => { if (!ok) errs.push(msg); };
  need(d && typeof d === 'object' && !Array.isArray(d), 'devlog must be a JSON object');
  if (errs.length) return errs;
  need(typeof d.game === 'string' && /^[a-z0-9-]{2,40}$/.test(d.game), '"game" must be a short slug');
  need(typeof d.title === 'string' && d.title.length <= 60, '"title" must be a string (<= 60)');
  need(typeof d.version === 'string' && d.version.length <= 24, '"version" must be a string (<= 24)');
  need(typeof d.updated === 'string' && ISO.test(d.updated), '"updated" must be YYYY-MM-DD');
  need(Array.isArray(d.now) && d.now.every((s) => typeof s === 'string' && s.length <= 240), '"now" must be a list of short strings (<= 240)');
  need(Array.isArray(d.ask) && d.ask.every((a) => a && typeof a.q === 'string' && a.q.length <= 200 && (a.hint == null || (typeof a.hint === 'string' && a.hint.length <= 240))),
    '"ask" must be a list of {q (<= 200), hint? (<= 240)}');
  need(Array.isArray(d.releases) && d.releases.length > 0, '"releases" must be a non-empty list');
  (d.releases || []).forEach((r, i) => {
    need(r && typeof r.version === 'string' && typeof r.title === 'string', `releases[${i}] needs "version" and "title"`);
    need(r && typeof r.date === 'string' && ISO.test(r.date), `releases[${i}].date must be YYYY-MM-DD`);
    need(r && Array.isArray(r.items) && r.items.every((it) => typeof it === 'string' || (it && typeof it === 'object' && (typeof it.h === 'string' || typeof it.t === 'string' || typeof it.group === 'string'))),
      `releases[${i}].items must be strings, {h, t} or {group}`);
  });
  const dates = (d.releases || []).map((r) => r && r.date).filter(Boolean);
  need(dates.every((x, i) => i === 0 || x <= dates[i - 1]), '"releases" must be newest first');
  return errs;
};

const walk = (v, path, out) => {
  if (typeof v === 'string') out.push([path, v]);
  else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`, out));
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) { out.push([`${path}{key}`, k]); walk(x, `${path}.${k}`, out); }
  return out;
};

const files = process.argv.slice(2);
if (!files.length) { console.error('usage: node tools/hub/check-devlog.mjs <devlog.json> [...]'); process.exit(2); }
let bad = 0;
for (const file of files) {
  let raw;
  try { raw = readFileSync(file, 'utf8'); } catch (e) { console.error(`✗ ${file}: can't read (${e.code || e.message})`); bad++; continue; }
  const lines = raw.split('\n');
  let data;
  try { data = JSON.parse(raw); } catch (e) { console.error(`✗ ${file}: not valid JSON (${e.message})`); bad++; continue; }
  const hits = [];
  // 1. every raw line (catches anything, including escaped text seen as written)
  lines.forEach((line, i) => { for (const [label, re] of RULES) { const m = line.match(re); if (m) hits.push({ where: `line ${i + 1}`, label, match: m[0], text: line.trim() }); } });
  // 2. every decoded string (catches \u escapes that hide a match from the raw line)
  for (const [path, s] of walk(data, '$', [])) {
    for (const [label, re] of RULES) {
      const m = s.match(re);
      if (m && !hits.some((h) => h.label === label && h.text.includes(m[0]))) hits.push({ where: path, label, match: m[0], text: s });
    }
  }
  const shapeErrs = shape(data);
  if (!hits.length && !shapeErrs.length) { console.log(`✓ ${file}: clean (${RULES.length} rules, ${lines.length} lines)`); continue; }
  bad++;
  console.error(`✗ ${file}: ${hits.length} privacy hit(s), ${shapeErrs.length} shape problem(s)`);
  for (const h of hits) console.error(`  ${h.where}  [${h.label}]  "${h.match}"\n    ${h.text.length > 200 ? h.text.slice(0, 200) + '…' : h.text}`);
  for (const e of shapeErrs) console.error(`  shape: ${e}`);
}
process.exit(bad ? 1 : 0);
