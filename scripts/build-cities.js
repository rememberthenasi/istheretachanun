#!/usr/bin/env node
/*
 * Builds data/cities.json, the location list the page searches when a visitor
 * chooses a city instead of sharing GPS.
 *
 * Source: the world city list from the `city-timezones` npm package (MIT),
 * plus data/cities-extra.js. Run when either changes:
 *
 *   npm pack city-timezones && tar xzf city-timezones-*.tgz
 *   node scripts/build-cities.js package/data/cityMap.json
 *
 * Output shape (kept compact; the page loads it only when needed):
 *   { version, tz: [timeZone...], countries: {ISO2: name},
 *     cities: [[name, province, iso2, lat, lng, tzIndex, population, aliases?]] }
 * sorted by population, largest first.
 */
const fs = require('fs');
const path = require('path');

const src = process.argv[2];
if (!src) {
  console.error('usage: node scripts/build-cities.js path/to/cityMap.json');
  process.exit(1);
}
const base = JSON.parse(fs.readFileSync(src, 'utf8'));
const extra = require('../data/cities-extra.js');

const countries = {};
const rows = [];
for (const c of base) {
  if (!c.timezone || !Number.isFinite(c.lat) || !Number.isFinite(c.lng)) continue;
  countries[c.iso2] = c.country;
  const aliases = c.city_ascii && c.city_ascii !== c.city ? [c.city_ascii] : [];
  rows.push({ name: c.city, province: c.province || '', iso2: c.iso2, lat: c.lat, lng: c.lng, tz: c.timezone, pop: Math.round(c.pop || 0), aliases });
}

for (const [name, iso2, more, renameTo] of extra.aliases) {
  const row = rows.find((r) => r.iso2 === iso2 && r.name === name);
  if (!row) throw new Error(`alias target not found: ${name}, ${iso2}`);
  if (renameTo) { row.aliases.push(row.name); row.name = renameTo; }
  row.aliases.push(...more);
}

const near = (a, b) => Math.abs(a.lat - b.lat) < 0.05 && Math.abs(a.lng - b.lng) < 0.05;
for (const [name, province, iso2, lat, lng, tz, aliases] of extra.add) {
  const row = { name, province, iso2, lat, lng, tz, pop: 0, aliases: aliases ? aliases.slice() : [] };
  if (rows.some((r) => r.iso2 === iso2 && r.name === name && near(r, row))) continue;
  if (!countries[iso2]) countries[iso2] = { GI: 'Gibraltar' }[iso2] || iso2;
  rows.push(row);
}

rows.sort((a, b) => b.pop - a.pop || a.name.localeCompare(b.name));
const tzList = [...new Set(rows.map((r) => r.tz))].sort();
const tzIndex = new Map(tzList.map((t, i) => [t, i]));
const round = (n) => Math.round(n * 10000) / 10000;

const out = {
  version: 1,
  source: 'city-timezones (MIT) + data/cities-extra.js',
  tz: tzList,
  countries,
  cities: rows.map((r) => {
    const row = [r.name, r.province, r.iso2, round(r.lat), round(r.lng), tzIndex.get(r.tz), r.pop];
    const aliases = [...new Set(r.aliases)].filter((a) => a && a !== r.name);
    if (aliases.length) row.push(aliases);
    return row;
  })
};

const dest = path.join(__dirname, '..', 'data', 'cities.json');
fs.writeFileSync(dest, JSON.stringify(out));
console.log(`wrote ${dest}: ${out.cities.length} places, ${tzList.length} time zones, ${Object.keys(countries).length} countries`);
