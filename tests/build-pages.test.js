// Run with: node --test tests/
// The generated SEO pages: well-formed, unique, linked, and in step with the rules.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { build, occurrences, gematria, ORIGIN } = require('../scripts/build-pages.js');
const { OCCASIONS, FAQ } = require('../scripts/site-content.js');
const T = require('../lib/tachanun.js');

const NOW = new Date('2026-11-23T12:00:00');
const { files, ctx } = build({ now: NOW });
const htmlFiles = files.filter((f) => f.file.endsWith('.html'));
const byPath = new Map(files.map((f) => [f.path, f]));

const pick = (html, re) => { const m = re.exec(html); return m ? m[1] : null; };

test('every page has a title, description, h1 and canonical (or noindex)', () => {
  for (const f of htmlFiles) {
    if (f.path === '/404.html') { assert.match(f.html, /noindex/); continue; }
    const title = pick(f.html, /<title>([^<]+)<\/title>/);
    const desc = pick(f.html, /<meta name="description" content="([^"]+)"/);
    assert.ok(title && title.length >= 15 && title.length <= 75, `${f.path} title length ${title && title.length}`);
    assert.ok(desc && desc.length >= 50 && desc.length <= 200, `${f.path} description length ${desc && desc.length}`);
    assert.match(f.html, /<h1>[^<]+<\/h1>/, `${f.path} h1`);
    assert.ok(f.html.includes(`<link rel="canonical" href="${ORIGIN}${f.path}" />`), `${f.path} canonical`);
  }
});

test('titles and descriptions are unique', () => {
  const indexable = htmlFiles.filter((f) => f.path !== '/404.html');
  const titles = indexable.map((f) => pick(f.html, /<title>([^<]+)<\/title>/));
  const descs = indexable.map((f) => pick(f.html, /<meta name="description" content="([^"]+)"/));
  assert.equal(new Set(titles).size, titles.length);
  assert.equal(new Set(descs).size, descs.length);
});

test('structured data is valid JSON', () => {
  for (const f of htmlFiles.filter((x) => x.path !== '/404.html')) {
    const blocks = [...f.html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    assert.ok(blocks.length >= 1, `${f.path} has JSON-LD`);
    for (const b of blocks) {
      const o = JSON.parse(b[1]);
      assert.equal(o['@context'], 'https://schema.org');
    }
  }
  const home = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const homeLd = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(home);
  assert.ok(JSON.parse(homeLd[1])['@graph'].length >= 3);
});

test('internal links point at pages that exist', () => {
  const known = new Set(['/', '/kiosk', '/feed/latest.json', ...files.map((f) => f.path)]);
  for (const y of ctx.feedYears) known.add(`/feed/tachanun-${y}.json`);
  for (const f of htmlFiles) {
    for (const m of f.html.matchAll(/href="(\/[^"#?]*)/g)) {
      const href = m[1];
      if (/^\/(assets|manifest\.webmanifest)/.test(href)) continue;
      assert.ok(known.has(href), `${f.path} links to missing ${href}`);
    }
  }
});

test('the sitemap lists the home page and every indexable page', () => {
  const xml = byPath.get('/sitemap.xml').html;
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.ok(locs.includes(`${ORIGIN}/`));
  for (const f of htmlFiles) {
    if (f.path === '/404.html') assert.ok(!locs.includes(ORIGIN + f.path));
    else assert.ok(locs.includes(ORIGIN + f.path), `${f.path} in sitemap`);
  }
});

test('each occasion page says the same as the rules', () => {
  for (const o of OCCASIONS) {
    const runs = occurrences(o, new Date(2025, 0, 1, 12), 366 * 6);
    assert.ok(runs.length >= 3, `${o.slug} has dates`);
    for (const r of runs) {
      for (const d of r.days) {
        if (o.varies && d.date.getDay() === 6) continue; // Shabbos: no Tachanun regardless
        assert.equal(d.decision.shacharit.recite, Boolean(o.varies), `${o.slug} ${T.isoDate(d.date)} shacharis`);
      }
      if (r.eve.getDay() === 5 || r.eve.getDay() === 6) continue; // Friday Mincha / Shabbos omit anyway
      const copySaysOmit = /^Not said/.test(o.mincha);
      assert.equal(!r.eveMincha.recite, copySaysOmit, `${o.slug}: Mincha before ${T.isoDate(r.start)}`);
    }
  }
});

test('occasion pages show their next date', () => {
  const chanukah = byPath.get('/holidays/chanukah/').html;
  assert.match(chanukah, /Next Chanukah/);
  assert.match(chanukah, /25 Kislev/);
  assert.match(chanukah, /כ״ה כסלו/);
});

test('a year page lists the year’s no-Tachanun days and no plain Shabbos', () => {
  const html = byPath.get('/tachanun-calendar/2027/').html;
  assert.match(html, /No Tachanun days in 2027/);
  assert.match(html, /Lag BaOmer/);
  assert.match(html, /Erev Rosh Chodesh/);
  assert.ok(!/<td><a href="\/holidays\/shabbos\/">Shabbos<\/a><\/td>/.test(html));
  for (const y of ctx.years) assert.ok(byPath.has(`/tachanun-calendar/${y}/`));
});

test('the FAQ page marks up every question', () => {
  const html = byPath.get('/faq/').html;
  const ld = JSON.parse(/<script type="application\/ld\+json">(\{"@context":"https:\/\/schema.org","@type":"FAQPage"[\s\S]*?)<\/script>/.exec(html)[1]);
  assert.equal(ld.mainEntity.length, FAQ.items.length);
});

test('Hebrew numerals', () => {
  assert.equal(gematria(15), 'ט״ו');
  assert.equal(gematria(16), 'ט״ז');
  assert.equal(gematria(25), 'כ״ה');
  assert.equal(gematria(5), 'ה׳');
  assert.equal(gematria(787), 'תשפ״ז');
  assert.equal(gematria(715), 'תשט״ו');
});
