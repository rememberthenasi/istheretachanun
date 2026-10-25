#!/usr/bin/env node
/*
 * Build the machine-readable Tachanun feed.
 *
 *   node scripts/build-feed.js [--out feed] [--years 2026,2027] [--now ISO]
 *
 * Writes, under --out (default ./feed):
 *   tachanun-<year>.json   one civil year, every date
 *   latest.json            this civil year and the next, in one file
 *   index.json             what is published and at which versions
 *
 * Every file carries schema_version, logic_version and generated_at. The
 * decisions are made by lib/tachanun.js using data/omissions.js, exactly as
 * the website does, so the feed can never disagree with the page.
 *
 * Shape of each day (see Tachanun.decide()):
 *   days["2026-10-25"] = {
 *     weekday, today: {hebrew_date, hebrew, shacharit, mincha},
 *     after_sunset: {hebrew_date, hebrew, shacharit, mincha},   // = next civil day's "today"
 *     krias_shema: {recite, reason, varies, until_midnight, note}
 *   }
 * `today` is for the daytime of that civil date; `after_sunset` is the Hebrew
 * day that begins at nightfall, for consumers (such as the TT Luach) that
 * switch at their own local sunset. Days with varies:true are the three
 * Chabad "custom varies" days; the consumer's own policy decides them.
 */
const fs = require('node:fs');
const path = require('node:path');

require(path.join(__dirname, '..', 'data', 'omissions.js'));
const T = require(path.join(__dirname, '..', 'lib', 'tachanun.js'));

function parseArgs(argv) {
  const out = { out: 'feed', years: null, now: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out') out.out = argv[++i];
    else if (a === '--years') out.years = argv[++i].split(',').map((y) => Number(y.trim())).filter(Boolean);
    else if (a === '--now') out.now = argv[++i];
    else if (a === '--help' || a === '-h') { console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0]); process.exit(0); }
    else throw new Error(`Unknown argument ${a}`);
  }
  return out;
}

function dayEntry(date) {
  const today = T.decide(date);
  const tomorrow = T.decide(T.nextDay(date));
  const strip = (d) => ({ hebrew_date: d.hebrew_date, hebrew: d.hebrew, shacharit: d.shacharit, mincha: d.mincha });
  return {
    weekday: today.weekday,
    today: strip(today),
    after_sunset: strip(tomorrow),
    krias_shema: today.krias_shema
  };
}

function metadata(generatedAt) {
  return {
    schema_version: T.SCHEMA_VERSION,
    logic_version: T.LOGIC_VERSION,
    generated_at: generatedAt,
    source: 'https://istheretachanun.com',
    minhag: 'Chabad-Lubavitch',
    calendar: 'Hebrew dates by civil day (ICU); fixed-date omissions only, diaspora',
    license: 'CC BY-NC 4.0 — "Is There Tachanun?" by Menachem Spielman. Attribution required; non-commercial.',
    varies_policy: 'Entries with varies:true (3 Tammuz, 18 Elul, 5 Teves) are decided by the consumer\'s own setting; recite is the public default.'
  };
}

function buildYear(year, generatedAt) {
  const days = {};
  for (let d = new Date(year, 0, 1, 12); d.getFullYear() === year; d.setDate(d.getDate() + 1)) {
    days[T.isoDate(d)] = dayEntry(new Date(d));
  }
  return { ...metadata(generatedAt), year, range: { from: `${year}-01-01`, to: `${year}-12-31` }, days };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const now = args.now ? new Date(args.now) : new Date();
  const generatedAt = now.toISOString();
  const years = args.years && args.years.length ? args.years : [now.getFullYear(), now.getFullYear() + 1];
  const outDir = path.resolve(args.out);
  fs.mkdirSync(outDir, { recursive: true });

  const built = years.map((y) => buildYear(y, generatedAt));
  const files = [];
  for (const y of built) {
    const name = `tachanun-${y.year}.json`;
    fs.writeFileSync(path.join(outDir, name), JSON.stringify(y));
    files.push({ file: name, year: y.year, range: y.range, days: Object.keys(y.days).length });
  }

  const latestDays = Object.assign({}, ...built.map((y) => y.days));
  const keys = Object.keys(latestDays).sort();
  const latest = { ...metadata(generatedAt), range: { from: keys[0], to: keys[keys.length - 1] }, days: latestDays };
  fs.writeFileSync(path.join(outDir, 'latest.json'), JSON.stringify(latest));
  files.push({ file: 'latest.json', range: latest.range, days: keys.length });

  fs.writeFileSync(path.join(outDir, 'index.json'), JSON.stringify({ ...metadata(generatedAt), files }, null, 2));
  for (const f of files) console.log(`${f.file}: ${f.days} days (${f.range.from} .. ${f.range.to})`);
  console.log(`schema_version ${T.SCHEMA_VERSION}, logic_version ${T.LOGIC_VERSION}`);
}

if (require.main === module) main();
module.exports = { buildYear, dayEntry, metadata };
