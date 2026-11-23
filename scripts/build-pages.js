#!/usr/bin/env node
/*
 * Build the static content pages that help search engines find the site.
 *
 *   node scripts/build-pages.js [--out .] [--now ISO]
 *
 * Writes, under --out (default: the repository root, which is what GitHub
 * Pages publishes):
 *   holidays/index.html                 every occasion with its next date
 *   holidays/<slug>/index.html          one page per occasion
 *   tachanun-calendar/index.html        the years, and what is coming up
 *   tachanun-calendar/<year>/index.html every day in a civil year with no Tachanun
 *   what-is-tachanun/index.html         guide
 *   faq/index.html                      questions and answers
 *   404.html, sitemap.xml, llms.txt
 *
 * Every date comes from lib/tachanun.js (with data/omissions.js), the same
 * code the checker on the home page runs, so the pages cannot disagree with
 * it. The words live in scripts/site-content.js.
 *
 * The output is generated, not committed (see .gitignore). The Pages workflow
 * rebuilds it on every deploy and once a week, so "upcoming" dates stay
 * current.
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

require(path.join(__dirname, '..', 'data', 'omissions.js'));
const T = require(path.join(__dirname, '..', 'lib', 'tachanun.js'));
const { OCCASIONS, GUIDE, FAQ } = require('./site-content.js');

const ORIGIN = 'https://istheretachanun.com';
const SITE_NAME = 'Is There Tachanun?';
const FIRST_YEAR = 2025;
const ROOT = path.join(__dirname, '..');

// --- small helpers -----------------------------------------------------------

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function stripTags(html) {
  return String(html).replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}
function addDays(date, n) { const d = new Date(date); d.setDate(d.getDate() + n); return T.makeDateAtNoon(d); }

const fmtLong = new Intl.DateTimeFormat('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
const fmtShort = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
const fmtShortYear = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
const fmtMonth = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });

const HEBREW_MONTHS = {
  Tishrei: 'תשרי', Cheshvan: 'חשוון', Kislev: 'כסלו', Tevet: 'טבת', Shevat: 'שבט', Adar: 'אדר',
  'Adar I': 'אדר א׳', 'Adar II': 'אדר ב׳', Nisan: 'ניסן', Iyar: 'אייר', Sivan: 'סיון', Tammuz: 'תמוז', Av: 'אב', Elul: 'אלול'
};

/** Hebrew numerals, as the home page prints them (ט״ו / ט״ז for 15 / 16). */
function gematria(value) {
  if (value === 15) return 'ט״ו';
  if (value === 16) return 'ט״ז';
  const numerals = [[400, 'ת'], [300, 'ש'], [200, 'ר'], [100, 'ק'], [90, 'צ'], [80, 'פ'], [70, 'ע'], [60, 'ס'], [50, 'נ'],
    [40, 'מ'], [30, 'ל'], [20, 'כ'], [10, 'י'], [9, 'ט'], [8, 'ח'], [7, 'ז'], [6, 'ו'], [5, 'ה'], [4, 'ד'], [3, 'ג'], [2, 'ב'], [1, 'א']];
  let rest = value; let out = '';
  for (const [n, l] of numerals) while (rest >= n) { out += l; rest -= n; }
  out = out.replace('יה', 'טו').replace('יו', 'טז');
  if (out.length === 1) return out + '׳';
  return out.slice(0, -1) + '״' + out.slice(-1);
}
function hebrewDateHe(hd, withYear = true) {
  const s = `${gematria(hd.day)} ${HEBREW_MONTHS[hd.month] || hd.month}`;
  return withYear ? `${s} ${gematria(hd.year - 5000)}` : s;
}
function hebrewDateEn(hd, withYear = true) {
  return withYear ? `${hd.day} ${hd.month} ${hd.year}` : `${hd.day} ${hd.month}`;
}
function rangeEn(a, b) {
  if (T.isoDate(a) === T.isoDate(b)) return fmtShortYear.format(a);
  if (a.getFullYear() === b.getFullYear()) return `${fmtShort.format(a)} – ${fmtShortYear.format(b)}`;
  return `${fmtShortYear.format(a)} – ${fmtShortYear.format(b)}`;
}
function rangeHebrew(ha, hb, he) {
  const f = he ? hebrewDateHe : hebrewDateEn;
  if (ha.day === hb.day && ha.month === hb.month) return f(ha);
  return ha.year === hb.year ? `${f(ha, false)} – ${f(hb)}` : `${f(ha)} – ${f(hb)}`;
}
function reasonText(decision) {
  return [decision.reason].concat(decision.also || []).filter(Boolean).join(', ');
}
function hashFile(rel) {
  return crypto.createHash('sha1').update(fs.readFileSync(path.join(ROOT, rel))).digest('hex').slice(0, 10);
}

// --- dates -------------------------------------------------------------------

/** Every civil day from `from` for `count` days, with its Hebrew date. */
function scanDays(from, count) {
  const out = [];
  for (let i = 0, d = T.makeDateAtNoon(from); i < count; i++, d = addDays(d, 1)) out.push({ date: d, hd: T.getHebrewParts(d) });
  return out;
}

/** Consecutive runs of days on which `occasion.match` is true. */
function occurrences(occasion, from, count, limit) {
  const runs = [];
  let cur = null;
  for (const day of scanDays(from, count)) {
    if (occasion.match(day.hd, day.date)) {
      if (cur) cur.days.push(day); else cur = { days: [day] };
    } else if (cur) {
      runs.push(cur); cur = null;
      if (limit && runs.length >= limit) break;
    }
  }
  if (cur && (!limit || runs.length < limit)) runs.push(cur);
  return runs.map((r) => {
    const start = r.days[0];
    const end = r.days[r.days.length - 1];
    const eve = addDays(start.date, -1);
    return {
      start: start.date, end: end.date, hdStart: start.hd, hdEnd: end.hd,
      eve, eveMincha: T.decide(eve).mincha,
      days: r.days.map((d) => ({ ...d, decision: T.decide(d.date) }))
    };
  });
}

const WEEKDAY = new Date(2000, 0, 3, 12); // a Monday

/** The rows of a calendar: days with no Tachanun (other than a plain Shabbos), Mincha-only days and the "varies" days. */
function calendarRows(from, to) {
  const rows = [];
  for (let d = T.makeDateAtNoon(from); d <= to; d = addDays(d, 1)) {
    const dec = T.decide(d);
    const sh = dec.shacharit;
    const mi = dec.mincha;
    const hd = T.getHebrewParts(d);
    // On Shabbos the rules name only Shabbos; ask what the same Hebrew date
    // would be on a weekday, so a holiday falling on Shabbos is still listed.
    const asWeekday = sh.reason === 'Shabbos' && !(sh.also && sh.also.length) ? T.matchDayRule(hd, WEEKDAY) : null;
    const plainShabbos = asWeekday && !asWeekday.omit;
    const shacharisRow = !sh.recite && !plainShabbos;
    const minchaRow = sh.recite && !mi.recite && mi.reason !== 'Friday Mincha';
    if (shacharisRow || minchaRow || sh.varies) {
      const kind = shacharisRow ? 'day' : (minchaRow ? 'mincha' : 'varies');
      const label = kind === 'mincha' ? reasonText(mi)
        : asWeekday ? ['Shabbos', asWeekday.label].concat(asWeekday.also || []).join(', ')
          : reasonText(sh);
      rows.push({ date: d, hd, dec, kind, label });
    }
  }
  return rows;
}

const LABEL_TO_SLUG = {
  '9 Tishrei through 1 Cheshvan': 'sukkos',
  'Friday Mincha': 'shabbos',
  Shabbos: 'shabbos'
};
/** The occasion page that best explains a calendar row. */
function slugForRow(row) {
  const candidates = OCCASIONS.filter((o) => o.slug !== 'shabbos');
  const onDay = candidates.find((o) => o.match(row.hd, row.date));
  if (onDay && row.kind !== 'mincha') return onDay.slug;
  const next = addDays(row.date, 1);
  const nextHd = T.getHebrewParts(next);
  const onNext = candidates.find((o) => o.match(nextHd, next));
  if (row.kind === 'mincha' && onNext) return onNext.slug;
  if (onDay) return onDay.slug;
  return LABEL_TO_SLUG[row.dec.shacharit.reason] || null;
}

// --- page shell --------------------------------------------------------------

const NAV = [
  { href: '/', label: 'Today' },
  { href: '/tachanun-calendar/', label: 'Calendar' },
  { href: '/holidays/', label: 'Holidays' },
  { href: '/what-is-tachanun/', label: 'What is Tachanun?' },
  { href: '/faq/', label: 'FAQ' }
];

const ORGANIZATION = { '@type': 'Organization', '@id': `${ORIGIN}/#organization`, name: 'TOTALIS', url: 'https://totalis.one', email: 'tachanun@totalis.one' };
const WEBSITE_REF = { '@id': `${ORIGIN}/#website` };

function breadcrumbLd(crumbs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: ORIGIN + c.path }))
  };
}

function layout(p) {
  const url = ORIGIN + p.path;
  const crumbs = p.breadcrumbs || [];
  const ld = [].concat(crumbs.length ? [breadcrumbLd(crumbs)] : [], p.jsonLd || []);
  const css = `/assets/site.css?v=${p.cssVersion}`;
  const ogImage = `${ORIGIN}/assets/og-image.png`;
  return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(p.title)}</title>
  <meta name="description" content="${esc(p.description)}" />
  ${p.noindex ? '<meta name="robots" content="noindex, follow" />' : '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />\n  <link rel="canonical" href="' + esc(url) + '" />'}
  <meta name="theme-color" content="#171614" />
  <meta property="og:type" content="${p.ogType || 'website'}" />
  <meta property="og:site_name" content="${esc(SITE_NAME)}" />
  <meta property="og:title" content="${esc(p.ogTitle || p.title)}" />
  <meta property="og:description" content="${esc(p.description)}" />
  <meta property="og:url" content="${esc(url)}" />
  <meta property="og:image" content="${ogImage}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="Is there Tachanun today? According to Chabad customs" />
  <meta property="og:locale" content="en_US" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(p.ogTitle || p.title)}" />
  <meta name="twitter:description" content="${esc(p.description)}" />
  <meta name="twitter:image" content="${ogImage}" />
  <link rel="manifest" href="/manifest.webmanifest" />
  <link rel="icon" type="image/png" sizes="192x192" href="/assets/app-icon-192.png" />
  <link rel="icon" type="image/svg+xml" href="/assets/app-icon.svg" />
  <link rel="apple-touch-icon" sizes="180x180" href="/assets/app-icon-180.png" />
  <link rel="preconnect" href="https://api.fontshare.com" />
  <link href="https://api.fontshare.com/v2/css?f[]=switzer@400,500,700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${css}" />
${ld.map((o) => `  <script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`).join('\n')}
</head>
<body>
  <a href="#main" class="skip-link">Skip to content</a>
  <div class="shell">
    <header class="site-nav">
      <a class="brand" href="/"><img src="/assets/app-icon-192.png" alt="" width="32" height="32" />${esc(SITE_NAME)}</a>
      <nav aria-label="Main">
        <ul class="nav-links">
${NAV.map((n) => `          <li><a href="${n.href}"${n.href === p.navCurrent ? ' aria-current="page"' : ''}>${esc(n.label)}</a></li>`).join('\n')}
        </ul>
      </nav>
      <button class="theme-toggle" type="button" data-theme-toggle aria-label="Switch theme"></button>
    </header>
${crumbs.length > 1 ? `    <nav class="breadcrumbs" aria-label="Breadcrumb"><ol>
${crumbs.map((c, i) => i === crumbs.length - 1 ? `      <li aria-current="page">${esc(c.name)}</li>` : `      <li><a href="${c.path}">${esc(c.name)}</a></li>`).join('\n')}
    </ol></nav>` : ''}
    <main id="main">
      <section class="hero">
        ${p.eyebrow ? `<div class="eyebrow">${esc(p.eyebrow)}</div>` : ''}
        <h1>${esc(p.h1)}</h1>
        ${p.hebrewTitle ? `<p class="hebrew-title" lang="he">${esc(p.hebrewTitle)}</p>` : ''}
        ${p.lede ? `<p class="lede">${p.lede}</p>` : ''}
      </section>
      <div class="stack">
${p.body}
      </div>
    </main>
    <footer class="footer-note">
      <p class="meta"><a href="/">Is there Tachanun today?</a> · <a href="/tachanun-calendar/">Tachanun calendar</a> · <a href="/holidays/">Jewish holidays</a> · <a href="/what-is-tachanun/">What is Tachanun?</a> · <a href="/faq/">FAQ</a></p>
      <p><strong><a href="https://totalis.one" target="_blank" rel="noopener noreferrer">Powered by TOTALIS</a></strong><br>Email: <a href="mailto:tachanun@totalis.one">tachanun@totalis.one</a></p>
      <p class="meta">Follows Chabad-Lubavitch custom, Diaspora calendar. Sources: <a href="https://www.chabad.org/library/article_cdo/aid/5776805/jewish/Tachanun.htm" target="_blank" rel="noopener noreferrer">chabad.org</a> &amp; <a href="https://shulchanaruchharav.com/halacha/chapter-31-tachanun/" target="_blank" rel="noopener noreferrer">shulchanaruchharav.com</a>. This is a tool to help with the schedule and does not replace a Luach or a Rav.</p>
    </footer>
  </div>
  <script>
    (function () {
      var root = document.documentElement, toggle = document.querySelector('[data-theme-toggle]'), theme = 'dark';
      var icons = {
        dark: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
        light: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
      };
      function apply(next) {
        theme = next; root.setAttribute('data-theme', theme); toggle.innerHTML = icons[theme];
        toggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
      }
      apply(theme);
      toggle.addEventListener('click', function () { apply(theme === 'dark' ? 'light' : 'dark'); });
      // Dim the rows of dates that have passed (the page is rebuilt weekly).
      var pad = function (n) { return String(n).padStart(2, '0'); };
      var now = new Date(), today = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
      document.querySelectorAll('[data-end]').forEach(function (el) { if (el.getAttribute('data-end') < today) el.classList.add('past'); });
    })();
  </script>
</body>
</html>
`;
}

function checkerCta(text) {
  return `        <section class="panel">
          <h2>${esc(text || 'Is there Tachanun today?')}</h2>
          <p class="muted">The checker on the home page answers for today’s Shacharis, Mincha and bedtime Shema, switching at nightfall for your location.</p>
          <div class="action-row">
            <a class="btn btn-primary" href="/">Check today</a>
            <a class="btn btn-ghost" href="/tachanun-calendar/">See the full calendar</a>
          </div>
        </section>`;
}

function relatedLinks(slugs) {
  const items = slugs.map((s) => OCCASIONS.find((o) => o.slug === s)).filter(Boolean);
  if (!items.length) return '';
  return `        <section class="panel">
          <h2>Related</h2>
          <ul class="card-list">
${items.map((o) => `            <li><a href="/holidays/${o.slug}/"><strong>${esc(o.name)}</strong><span>${esc(o.question)}</span></a></li>`).join('\n')}
            <li><a href="/what-is-tachanun/"><strong>What is Tachanun?</strong><span>When it’s said, and why it’s skipped.</span></a></li>
          </ul>
        </section>`;
}

function decisionCell(d) {
  if (d.varies) return '<td class="yes">Yes*</td>';
  return d.recite ? '<td class="yes">Yes</td>' : '<td class="no">No</td>';
}

// --- pages -------------------------------------------------------------------

function occasionPage(o, ctx) {
  const runs = occurrences(o, ctx.from, 3 * 366, o.limit);
  const next = runs[0];
  const crumbs = [{ name: 'Home', path: '/' }, { name: 'Holidays', path: '/holidays/' }, { name: o.name, path: `/holidays/${o.slug}/` }];
  const nextText = next
    ? `${rangeEn(next.start, next.end)} (${rangeHebrew(next.hdStart, next.hdEnd, false)})`
    : '';
  const minchaQ = `Is Tachanun said at Mincha the day before ${o.name}?`;
  const whenQ = `When is ${o.name}?`;

  const rows = runs.map((r) => {
    const eveNote = r.eveMincha.recite
      ? (r.eveMincha.varies ? 'Yes*' : 'Yes')
      : `No (${esc(reasonText(r.eveMincha))})`;
    return `              <tr data-end="${T.isoDate(r.end)}">
                <td>${esc(rangeEn(r.start, r.end))}</td>
                <td>${esc(rangeHebrew(r.hdStart, r.hdEnd, false))}<br><span class="he" lang="he">${esc(rangeHebrew(r.hdStart, r.hdEnd, true))}</span></td>
                <td>${o.varies ? 'Yes*' : (r.days.every((d) => !d.decision.shacharit.recite) ? 'No' : 'See calendar')}</td>
                <td>${fmtShort.format(r.eve)}: ${eveNote}</td>
              </tr>`;
  }).join('\n');

  const body = `        <section class="panel answer-box">
          <p><strong>${esc(o.answer)}</strong></p>
          <div class="answer-grid">
            <div class="answer-cell"><p class="label">Shacharis &amp; Mincha</p><p class="value ${o.varies ? '' : 'skip'}">${o.varies ? 'Yes*' : 'No Tachanun'}</p><p class="note">${o.varies ? 'Custom varies' : `On ${esc(o.name)}`}</p></div>
            <div class="answer-cell"><p class="label">Mincha the day before</p><p class="value ${/^Not said/.test(o.mincha) ? 'skip' : ''}">${/^Not said/.test(o.mincha) ? 'No Tachanun' : 'Tachanun said'}</p><p class="note">${esc(o.mincha)}</p></div>
            ${next ? `<div class="answer-cell"><p class="label">Next ${esc(o.name)}</p><p class="value">${esc(rangeEn(next.start, next.end))}</p><p class="note">${esc(rangeHebrew(next.hdStart, next.hdEnd, false))} · <span class="he" lang="he">${esc(rangeHebrew(next.hdStart, next.hdEnd, true))}</span></p></div>` : ''}
          </div>
          ${o.chabad ? '<p class="small muted"><span class="tag">Chabad custom</span> This day is observed according to Chabad-Lubavitch custom.</p>' : ''}
          ${o.varies ? '<p class="small muted"><span class="tag varies">Custom varies</span> The asterisk (*) marks days where the public custom is to say Tachanun but individual practice varies.</p>' : ''}
        </section>
        <section class="panel">
          <h2>Why ${o.varies ? 'the custom varies' : `there is no Tachanun on ${esc(o.name)}`}</h2>
${o.body.map((b) => `          <p>${b}</p>`).join('\n')}
          ${o.aka.length ? `<p class="small muted">Also written: ${o.aka.map(esc).join(', ')} · <span lang="he">${esc(o.hebrew)}</span></p>` : ''}
        </section>
${runs.length ? `        <section class="panel">
          <h2>Upcoming ${esc(o.name)} dates</h2>
          <div class="table-wrap">
            <table>
              <thead><tr><th scope="col">Date</th><th scope="col">Hebrew date</th><th scope="col">Tachanun</th><th scope="col">Mincha the day before</th></tr></thead>
              <tbody>
${rows}
              </tbody>
            </table>
          </div>
          <p class="small muted">Dates are for the daytime; the Hebrew date begins the evening before. “Mincha the day before” shows whether Tachanun is said at Mincha on the previous afternoon.</p>
        </section>` : ''}
${checkerCta()}
${relatedLinks(o.related)}`;

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${ORIGIN}/holidays/${o.slug}/#faq`,
    mainEntity: [
      { '@type': 'Question', name: o.question, acceptedAnswer: { '@type': 'Answer', text: o.answer } },
      { '@type': 'Question', name: minchaQ, acceptedAnswer: { '@type': 'Answer', text: o.mincha } }
    ].concat(next ? [{ '@type': 'Question', name: whenQ, acceptedAnswer: { '@type': 'Answer', text: `The next ${o.name} is ${nextText}.` } }] : [])
  };
  const pageLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: o.question,
    description: o.description,
    url: `${ORIGIN}/holidays/${o.slug}/`,
    inLanguage: 'en',
    isPartOf: WEBSITE_REF,
    publisher: { '@id': ORGANIZATION['@id'] },
    dateModified: ctx.generatedAt,
    about: { '@type': 'Thing', name: `${o.name} (${o.hebrew})`, alternateName: o.aka }
  };

  return {
    path: `/holidays/${o.slug}/`,
    priority: 0.8,
    html: layout({
      ...ctx.common,
      path: `/holidays/${o.slug}/`,
      title: `${o.title}`,
      description: o.description,
      eyebrow: o.chabad ? 'Chabad custom' : 'Tachanun & the Jewish calendar',
      h1: o.question,
      hebrewTitle: `תחנון · ${o.hebrew}`,
      lede: 'According to Chabad-Lubavitch custom. Dates are calculated by the same rules as the daily checker.',
      breadcrumbs: crumbs,
      navCurrent: '/holidays/',
      body,
      jsonLd: [pageLd, faqLd]
    })
  };
}

function holidaysHub(ctx) {
  const list = OCCASIONS.map((o) => ({ o, next: occurrences(o, ctx.from, 3 * 366, 1)[0] }))
    .filter((x) => x.next)
    .sort((a, b) => a.next.start - b.next.start);
  const rows = list.filter((x) => x.o.slug !== 'shabbos').map(({ o, next }) => `              <tr data-end="${T.isoDate(next.end)}">
                <td><a href="/holidays/${o.slug}/">${esc(o.name)}</a>${o.chabad ? ' <span class="tag">Chabad</span>' : ''}</td>
                <td>${esc(rangeEn(next.start, next.end))}</td>
                <td>${esc(rangeHebrew(next.hdStart, next.hdEnd, false))}<br><span class="he" lang="he">${esc(rangeHebrew(next.hdStart, next.hdEnd, true))}</span></td>
                <td class="${o.varies ? 'yes' : 'no'}">${o.varies ? 'Yes*' : 'No'}</td>
                <td class="${next.eveMincha.recite ? 'yes' : 'no'}">${next.eveMincha.recite ? (next.eveMincha.varies ? 'Yes*' : 'Yes') : 'No'}</td>
              </tr>`).join('\n');
  const data = T.defaultData();
  const body = `        <section class="panel">
          <h2>Upcoming holidays and special days</h2>
          <p class="muted">The next date of every day on which Tachanun is affected, soonest first. “Mincha before” is Mincha on the afternoon before the first day.</p>
          <div class="table-wrap">
            <table>
              <thead><tr><th scope="col">Occasion</th><th scope="col">Next date</th><th scope="col">Hebrew date</th><th scope="col">Tachanun</th><th scope="col">Mincha before</th></tr></thead>
              <tbody>
${rows}
              </tbody>
            </table>
          </div>
          <p class="small muted">* The public custom is to say Tachanun, though individual practice varies. Plus every <a href="/holidays/shabbos/">Shabbos</a> and Friday Mincha.</p>
        </section>
        <section class="panel">
          <h2>All occasions</h2>
          <ul class="card-list">
${OCCASIONS.map((o) => `            <li><a href="/holidays/${o.slug}/"><strong>${esc(o.name)} <span lang="he">${esc(o.hebrew)}</span></strong><span>${esc(o.question)}</span></a></li>`).join('\n')}
          </ul>
        </section>
        <section class="panel">
          <h2>The days without Tachanun</h2>
          <ul>
${(data.omissionRules || []).map((r) => `            <li>${esc(r.label)}${r.chabadCustom ? ' <span class="tag">Chabad</span>' : ''}</li>`).join('\n')}
          </ul>
          <h3>Days where custom varies</h3>
          <ul>
${(data.variesNotes || []).map((n) => `            ${n}`).join('\n')}
          </ul>
        </section>
${checkerCta()}`;
  return {
    path: '/holidays/',
    priority: 0.9,
    html: layout({
      ...ctx.common,
      path: '/holidays/',
      title: 'Jewish Holidays & Tachanun: Upcoming Dates | תחנון',
      description: 'Upcoming Jewish holidays and special days, and whether Tachanun is said on each: Rosh Chodesh, Chanukah, Purim, Nissan, Lag BaOmer, Shavuos, Tishrei and Chabad Yomim Tovim.',
      eyebrow: 'Jewish holidays',
      h1: 'Jewish holidays and Tachanun',
      hebrewTitle: 'ימים שאין אומרים בהם תחנון',
      lede: 'Every holiday and special day that affects Tachanun, with its next date, according to Chabad-Lubavitch custom.',
      breadcrumbs: [{ name: 'Home', path: '/' }, { name: 'Holidays', path: '/holidays/' }],
      navCurrent: '/holidays/',
      body,
      jsonLd: [{
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Jewish holidays and Tachanun',
        url: `${ORIGIN}/holidays/`,
        inLanguage: 'en',
        isPartOf: WEBSITE_REF,
        dateModified: ctx.generatedAt,
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: OCCASIONS.map((o, i) => ({ '@type': 'ListItem', position: i + 1, url: `${ORIGIN}/holidays/${o.slug}/`, name: o.name }))
        }
      }]
    })
  };
}

function calendarTable(rows, ctx, caption) {
  return `          <div class="table-wrap">
            <table>
              ${caption ? `<caption>${esc(caption)}</caption>` : ''}
              <thead><tr><th scope="col">Date</th><th scope="col">Hebrew date</th><th scope="col">Shacharis</th><th scope="col">Mincha</th><th scope="col">Occasion</th></tr></thead>
              <tbody>
${rows.map((r) => {
    const slug = slugForRow(r);
    const label = r.label;
    return `                <tr data-end="${T.isoDate(r.date)}">
                  <td>${esc(fmtShort.format(r.date))}</td>
                  <td>${esc(hebrewDateEn(r.hd))}<br><span class="he" lang="he">${esc(hebrewDateHe(r.hd))}</span></td>
                  ${decisionCell(r.dec.shacharit)}
                  ${decisionCell(r.dec.mincha)}
                  <td>${slug ? `<a href="/holidays/${slug}/">${esc(label)}</a>` : esc(label)}</td>
                </tr>`;
  }).join('\n')}
              </tbody>
            </table>
          </div>`;
}

function yearPage(year, ctx) {
  const from = new Date(year, 0, 1, 12);
  const to = new Date(year, 11, 31, 12);
  const rows = calendarRows(from, to);
  const hebrewYears = [T.getHebrewParts(from).year, T.getHebrewParts(to).year];
  const fullDays = rows.filter((r) => r.kind === 'day').length;
  const weekdays = rows.filter((r) => r.kind === 'day' && r.date.getDay() !== 6).length;
  const byMonth = new Map();
  for (const r of rows) {
    const k = r.date.getMonth();
    if (!byMonth.has(k)) byMonth.set(k, []);
    byMonth.get(k).push(r);
  }
  const months = [...byMonth.entries()].map(([m, rs]) => `        <section class="panel" id="${fmtMonth.format(new Date(year, m, 1)).split(' ')[0].toLowerCase()}">
          <h2>${esc(fmtMonth.format(new Date(year, m, 1)))}</h2>
${calendarTable(rs, ctx)}
        </section>`).join('\n');
  const yearLinks = ctx.years.map((y) => y === year ? `<li><span aria-current="page">${y}</span></li>` : `<li><a href="/tachanun-calendar/${y}/">${y}</a></li>`).join('');
  const inFeed = ctx.feedYears.includes(year);
  const body = `        <section class="panel">
          <p>In ${year} (Hebrew years ${hebrewYears[0]}–${hebrewYears[1]}) there are <strong>${fullDays} days</strong> without Tachanun at Shacharis besides ordinary Shabbosos, ${weekdays} of them weekdays. The table also lists the afternoons when Tachanun is left out only at Mincha, and the days where custom varies (marked *).</p>
          <ul class="toc">
${[...byMonth.keys()].map((m) => `            <li><a href="#${fmtMonth.format(new Date(year, m, 1)).split(' ')[0].toLowerCase()}">${fmtMonth.format(new Date(year, m, 1)).split(' ')[0]}</a></li>`).join('\n')}
          </ul>
          <p class="small muted">Every Shabbos has no Tachanun, and in Chabad custom neither does Friday Mincha; these are listed only when they coincide with another occasion. Dates are for the daytime; the Hebrew date begins the evening before.</p>
          <ul class="year-links" aria-label="Other years">${yearLinks}</ul>
        </section>
${months}
${inFeed ? `        <section class="panel">
          <h2>Download the data</h2>
          <p class="muted">Every date in ${year}, with Shacharis, Mincha and bedtime Shema decisions, is available as JSON: <a href="/feed/tachanun-${year}.json">tachanun-${year}.json</a>. Free for non-commercial use with attribution (CC BY-NC 4.0).</p>
        </section>` : ''}
${checkerCta()}`;
  const jsonLd = [{
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `Tachanun calendar ${year}`,
    description: `Every day in ${year} with no Tachanun, according to Chabad custom.`,
    url: `${ORIGIN}/tachanun-calendar/${year}/`,
    inLanguage: 'en',
    isPartOf: WEBSITE_REF,
    publisher: { '@id': ORGANIZATION['@id'] },
    dateModified: ctx.generatedAt,
    temporalCoverage: `${year}-01-01/${year}-12-31`
  }];
  if (inFeed) {
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'Dataset',
      name: `Tachanun calendar ${year} (Chabad custom)`,
      description: `For every civil date in ${year}: the Hebrew date and whether Tachanun is said at Shacharis, at Mincha and in the bedtime Shema, with the reason, following Chabad-Lubavitch custom for the Diaspora.`,
      url: `${ORIGIN}/tachanun-calendar/${year}/`,
      keywords: ['Tachanun', 'Jewish calendar', 'Hebrew calendar', 'Chabad', 'Jewish holidays', 'davening'],
      license: 'https://creativecommons.org/licenses/by-nc/4.0/',
      isAccessibleForFree: true,
      creator: { '@id': ORGANIZATION['@id'] },
      temporalCoverage: `${year}-01-01/${year}-12-31`,
      distribution: [{ '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: `${ORIGIN}/feed/tachanun-${year}.json` }]
    });
  }
  return {
    path: `/tachanun-calendar/${year}/`,
    priority: year === ctx.thisYear ? 0.9 : (year > ctx.thisYear ? 0.8 : 0.5),
    html: layout({
      ...ctx.common,
      path: `/tachanun-calendar/${year}/`,
      title: `No Tachanun Days ${year}: Full Tachanun Calendar | תחנון`,
      description: `Every day in ${year} (${hebrewYears[0]}–${hebrewYears[1]}) when Tachanun is not said, at Shacharis or Mincha, with English and Hebrew dates and the reason. Chabad custom.`,
      eyebrow: `Tachanun calendar ${year}`,
      h1: `No Tachanun days in ${year}`,
      hebrewTitle: `לוח תחנון ${year} · ${gematria(hebrewYears[0] - 5000)}–${gematria(hebrewYears[1] - 5000)}`,
      lede: `Every day in ${year} with no Tachanun, according to Chabad-Lubavitch custom, calculated by the same rules as the daily checker.`,
      breadcrumbs: [{ name: 'Home', path: '/' }, { name: 'Tachanun calendar', path: '/tachanun-calendar/' }, { name: String(year), path: `/tachanun-calendar/${year}/` }],
      navCurrent: '/tachanun-calendar/',
      body,
      jsonLd
    })
  };
}

function calendarIndex(ctx) {
  const upcoming = calendarRows(ctx.from, addDays(ctx.from, 120)).slice(0, 15);
  const body = `        <section class="panel">
          <h2>Choose a year</h2>
          <ul class="year-links">${ctx.years.map((y) => `<li><a href="/tachanun-calendar/${y}/">${y}</a></li>`).join('')}</ul>
          <p class="muted">Each year lists every day with no Tachanun at Shacharis or Mincha, with the English and Hebrew dates and the reason.</p>
        </section>
        <section class="panel">
          <h2>Coming up</h2>
${calendarTable(upcoming, ctx)}
          <p class="small muted">* The public custom is to say Tachanun, though individual practice varies.</p>
        </section>
${checkerCta()}`;
  return {
    path: '/tachanun-calendar/',
    priority: 0.9,
    html: layout({
      ...ctx.common,
      path: '/tachanun-calendar/',
      title: `Tachanun Calendar ${ctx.thisYear}–${ctx.thisYear + 1}: No Tachanun Days | תחנון`,
      description: `When is there no Tachanun? A full calendar of the days Tachanun is not said in ${ctx.thisYear} and ${ctx.thisYear + 1}, with Hebrew dates and reasons, according to Chabad custom.`,
      eyebrow: 'Tachanun calendar',
      h1: 'Tachanun calendar',
      hebrewTitle: 'לוח ימים שאין אומרים בהם תחנון',
      lede: 'The days when Tachanun is not said, year by year, according to Chabad-Lubavitch custom.',
      breadcrumbs: [{ name: 'Home', path: '/' }, { name: 'Tachanun calendar', path: '/tachanun-calendar/' }],
      navCurrent: '/tachanun-calendar/',
      body,
      jsonLd: [{
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Tachanun calendar',
        url: `${ORIGIN}/tachanun-calendar/`,
        inLanguage: 'en',
        isPartOf: WEBSITE_REF,
        dateModified: ctx.generatedAt,
        hasPart: ctx.years.map((y) => ({ '@type': 'WebPage', name: `Tachanun calendar ${y}`, url: `${ORIGIN}/tachanun-calendar/${y}/` }))
      }]
    })
  };
}

function guidePage(ctx) {
  const body = `        <section class="panel">
          <ul class="toc">
${GUIDE.sections.map((s) => `            <li><a href="#${s.id}">${esc(s.heading)}</a></li>`).join('\n')}
          </ul>
        </section>
${GUIDE.sections.map((s) => `        <section class="panel" id="${s.id}">
          <h2>${esc(s.heading)}</h2>
${s.html.map((h) => `          ${h}`).join('\n')}
        </section>`).join('\n')}
${checkerCta()}
${relatedLinks(['rosh-chodesh', 'chanukah', 'nissan', 'tisha-bav'])}`;
  return {
    path: '/what-is-tachanun/',
    priority: 0.8,
    html: layout({
      ...ctx.common,
      path: '/what-is-tachanun/',
      ogType: 'article',
      title: GUIDE.title,
      description: GUIDE.description,
      eyebrow: 'Guide',
      h1: 'What is Tachanun?',
      hebrewTitle: 'תחנון · נפילת אפים',
      lede: 'What Tachanun is, where it comes in davening, and why it is left out on some days.',
      breadcrumbs: [{ name: 'Home', path: '/' }, { name: 'What is Tachanun?', path: '/what-is-tachanun/' }],
      navCurrent: '/what-is-tachanun/',
      body,
      jsonLd: [{
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: 'What is Tachanun? When it is said and when it is skipped',
        description: GUIDE.description,
        url: `${ORIGIN}/what-is-tachanun/`,
        mainEntityOfPage: `${ORIGIN}/what-is-tachanun/`,
        inLanguage: 'en',
        image: `${ORIGIN}/assets/og-image.png`,
        author: { '@id': ORGANIZATION['@id'] },
        publisher: { '@id': ORGANIZATION['@id'] },
        isPartOf: WEBSITE_REF,
        dateModified: ctx.generatedAt,
        about: [{ '@type': 'Thing', name: 'Tachanun', alternateName: ['תחנון', 'Tachnun', 'Tahanun', 'Nefilat Apayim', 'נפילת אפים'] },
          { '@type': 'Thing', name: 'Jewish prayer (tefillah)' }]
      }]
    })
  };
}

function faqPage(ctx) {
  const body = `        <section class="panel faq">
${FAQ.items.map((it, i) => `          <details${i < 3 ? ' open' : ''}>
            <summary><h2>${esc(it.q)}</h2></summary>
            <div>${it.a}</div>
          </details>`).join('\n')}
        </section>
${checkerCta()}`;
  return {
    path: '/faq/',
    priority: 0.7,
    html: layout({
      ...ctx.common,
      path: '/faq/',
      title: FAQ.title,
      description: FAQ.description,
      eyebrow: 'FAQ',
      h1: 'Tachanun: frequently asked questions',
      hebrewTitle: 'שאלות נפוצות על תחנון',
      lede: 'Quick answers about Tachanun and how this site works.',
      breadcrumbs: [{ name: 'Home', path: '/' }, { name: 'FAQ', path: '/faq/' }],
      navCurrent: '/faq/',
      body,
      jsonLd: [{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        url: `${ORIGIN}/faq/`,
        inLanguage: 'en',
        isPartOf: WEBSITE_REF,
        mainEntity: FAQ.items.map((it) => ({ '@type': 'Question', name: it.q, acceptedAnswer: { '@type': 'Answer', text: stripTags(it.a) } }))
      }]
    })
  };
}

function notFoundPage(ctx) {
  const body = `        <section class="panel">
          <p>Try one of these instead:</p>
          <ul class="card-list">
            <li><a href="/"><strong>Is there Tachanun today?</strong><span>Today’s answer for your location.</span></a></li>
            <li><a href="/tachanun-calendar/"><strong>Tachanun calendar</strong><span>Every day without Tachanun, by year.</span></a></li>
            <li><a href="/holidays/"><strong>Jewish holidays</strong><span>Upcoming holidays and Tachanun.</span></a></li>
            <li><a href="/faq/"><strong>FAQ</strong><span>Common questions about Tachanun.</span></a></li>
          </ul>
        </section>`;
  return {
    path: '/404.html',
    sitemap: false,
    html: layout({
      ...ctx.common,
      path: '/404.html',
      noindex: true,
      title: `Page not found | ${SITE_NAME}`,
      description: 'This page could not be found.',
      h1: 'Page not found',
      body
    })
  };
}

function sitemap(pages, ctx) {
  const today = ctx.generatedAt.slice(0, 10);
  const urls = [{ path: '/', priority: 1.0, changefreq: 'daily' }]
    .concat(pages.filter((p) => p.sitemap !== false).map((p) => ({ path: p.path, priority: p.priority || 0.5, changefreq: 'weekly' })));
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${ORIGIN}${u.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority.toFixed(1)}</priority>
  </url>`).join('\n')}
</urlset>
`;
}

function llmsTxt(pages, ctx) {
  const line = (p, title, desc) => `- [${title}](${ORIGIN}${p}): ${desc}`;
  return `# Is There Tachanun?

> Is there Tachanun today? istheretachanun.com answers whether Tachanun (תחנון) is said at Shacharis, at Mincha and in the bedtime Shema, for any date, according to Chabad-Lubavitch custom (Diaspora calendar), using halachic times for the visitor's location.

## Main
${line('/', 'Is there Tachanun today?', 'Live answer for today, with any date selectable.')}
${line('/tachanun-calendar/', 'Tachanun calendar', 'Every day with no Tachanun, by year.')}
${line('/holidays/', 'Jewish holidays and Tachanun', 'Upcoming holidays and whether Tachanun is said.')}
${line('/what-is-tachanun/', 'What is Tachanun?', 'Guide to Tachanun and when it is skipped.')}
${line('/faq/', 'FAQ', 'Common questions about Tachanun.')}

## Holidays
${OCCASIONS.map((o) => line(`/holidays/${o.slug}/`, o.name, o.answer)).join('\n')}

## Calendars
${ctx.years.map((y) => line(`/tachanun-calendar/${y}/`, `Tachanun calendar ${y}`, `Every day in ${y} with no Tachanun.`)).join('\n')}

## Data
- [JSON feed](${ORIGIN}/feed/latest.json): every date's Shacharis, Mincha and bedtime Shema decisions. CC BY-NC 4.0.
`;
}

// --- build -------------------------------------------------------------------

function build({ now = new Date(), feedYears } = {}) {
  const from = T.makeDateAtNoon(now);
  const thisYear = from.getFullYear();
  const years = [];
  for (let y = FIRST_YEAR; y <= thisYear + 2; y++) years.push(y);
  const ctx = {
    from,
    thisYear,
    years,
    feedYears: feedYears || [thisYear, thisYear + 1],
    generatedAt: now.toISOString(),
    common: { cssVersion: hashFile('assets/site.css') }
  };
  const pages = [
    holidaysHub(ctx),
    ...OCCASIONS.map((o) => occasionPage(o, ctx)),
    calendarIndex(ctx),
    ...years.map((y) => yearPage(y, ctx)),
    guidePage(ctx),
    faqPage(ctx),
    notFoundPage(ctx)
  ];
  const files = pages.map((p) => ({ path: p.path, file: p.path.endsWith('/') ? p.path + 'index.html' : p.path, html: p.html, page: p }));
  files.push({ path: '/sitemap.xml', file: '/sitemap.xml', html: sitemap(pages, ctx) });
  files.push({ path: '/llms.txt', file: '/llms.txt', html: llmsTxt(pages, ctx) });
  return { files, pages, ctx };
}

function parseArgs(argv) {
  const out = { out: ROOT, now: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out') out.out = path.resolve(argv[++i]);
    else if (a === '--now') out.now = argv[++i];
    else if (a === '--help' || a === '-h') { console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0]); process.exit(0); }
    else throw new Error(`Unknown argument ${a}`);
  }
  return out;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const { files } = build({ now: args.now ? new Date(args.now) : new Date() });
  for (const f of files) {
    const target = path.join(args.out, f.file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, f.html);
  }
  console.log(`Wrote ${files.length} files to ${path.relative(process.cwd(), args.out) || '.'}`);
}

if (require.main === module) main();
module.exports = { build, occurrences, calendarRows, gematria, hebrewDateHe, ORIGIN };
