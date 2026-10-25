// Run with: node --test tests/
// Exercises the real rules module against known dates. Civil dates for Hebrew
// dates are looked up through the same Intl calendar the module uses, so the
// tests state rules in Hebrew-date terms and stay valid every year.
const test = require('node:test');
const assert = require('node:assert/strict');

require('../data/omissions.js');
const T = require('../lib/tachanun.js');

/** First civil date (local noon) in Hebrew year `year` with the given month/day. */
function civilFor(month, day, year = 5787) {
  const start = new Date(year - 3761, 7, 1, 12); // early enough: Tishrei starts Sep/Oct
  for (let d = new Date(start), i = 0; i < 420; i++, d.setDate(d.getDate() + 1)) {
    const hd = T.getHebrewParts(d);
    if (hd.year === year && hd.month === month && hd.day === day) return T.makeDateAtNoon(d);
  }
  throw new Error(`no civil date for ${day} ${month} ${year}`);
}
/**
 * A civil date for the Hebrew date that does not fall on Friday or Shabbos,
 * so a weekday rule is not masked by the Shabbos / Friday-Mincha rules.
 * Tries 5786..5799 (Adar I exists only in leap years).
 */
function weekdayFor(month, day) {
  for (let y = 5786; y <= 5799; y++) {
    try {
      const d = civilFor(month, day, y);
      if (d.getDay() !== 5 && d.getDay() !== 6) return d;
    } catch (e) { /* month absent in this year (Adar I/II) */ }
  }
  throw new Error(`no weekday civil date for ${day} ${month}`);
}
const dayRule = (month, day) => { const d = weekdayFor(month, day); return T.matchDayRule(T.getHebrewParts(d), d); };
const minchaRule = (month, day) => { const d = weekdayFor(month, day); return T.matchMinchaRule(T.getHebrewParts(d), d); };

test('month names are normalised to project spellings', () => {
  const months = new Set();
  for (let d = new Date(2026, 0, 1, 12); d.getFullYear() < 2028; d.setDate(d.getDate() + 1)) months.add(T.getHebrewParts(d).month);
  for (const m of months) assert.ok(Object.values(T.MONTH_NAMES).includes(m), m);
  assert.ok(months.has('Cheshvan') && months.has('Tammuz') && months.has('Tishrei'));
  assert.ok(months.has('Adar I') && months.has('Adar II'), '5787 is a leap year');
});

test('a plain weekday says Tachanun', () => {
  const d = T.fromIso('2026-10-26'); // Monday, 15 Cheshvan 5787
  assert.equal(T.getHebrewParts(d).month, 'Cheshvan');
  assert.equal(T.matchDayRule(T.getHebrewParts(d), d).omit, false);
  assert.equal(T.matchMinchaRule(T.getHebrewParts(d), d).omit, false);
});

test('Shabbos omits, Friday Mincha omits', () => {
  const sat = T.fromIso('2026-10-31');
  assert.equal(sat.getDay(), 6);
  assert.deepEqual(T.matchDayRule(T.getHebrewParts(sat), sat), { omit: true, label: 'Shabbos' });
  const fri = T.fromIso('2026-10-30');
  assert.equal(T.matchMinchaRule(T.getHebrewParts(fri), fri).label, 'Friday Mincha');
});

test('Rosh Chodesh and Erev Rosh Chodesh', () => {
  assert.equal(dayRule('Kislev', 1).omit, true);
  assert.equal(dayRule('Cheshvan', 30).omit, true);
  assert.equal(minchaRule('Cheshvan', 29).label, 'Erev Rosh Chodesh');
});

test('Tishrei run and Chanukah', () => {
  assert.equal(dayRule('Tishrei', 9).omit, true);
  assert.equal(dayRule('Cheshvan', 1).omit, true);
  assert.equal(dayRule('Cheshvan', 2).omit, false);
  assert.equal(dayRule('Kislev', 25).omit, true);
  assert.equal(dayRule('Tevet', 3).label, 'Chanukah');
  assert.equal(dayRule('Tevet', 4).omit, false);
  assert.equal(minchaRule('Kislev', 24).label, 'Erev Chanukah');
});

test('Chabad days: 10, 19, 20 Kislev and 12, 13 Tammuz', () => {
  assert.equal(dayRule('Kislev', 10).label, '10 Kislev');
  assert.equal(dayRule('Kislev', 19).label, 'Yud Tes Kislev');
  assert.equal(dayRule('Kislev', 20).label, 'Chof Kislev');
  assert.equal(minchaRule('Kislev', 18).label, 'Erev Yud Tes Kislev');
  assert.equal(dayRule('Tammuz', 12).label, 'Yud Beis Tammuz');
  assert.equal(dayRule('Tammuz', 13).label, 'Yud Gimmel Tammuz');
  assert.equal(minchaRule('Tammuz', 11).label, 'Erev Yud Beis Tammuz');
});

test('the three varies days are flagged with their data key', () => {
  for (const [m, d] of [['Tammuz', 3], ['Elul', 18], ['Tevet', 5]]) {
    const r = dayRule(m, d);
    assert.equal(r.omit, false, `${m} ${d}`);
    assert.equal(r.varies, true);
    assert.equal(r.key, `${m}-${d}`);
  }
  assert.equal(minchaRule('Tammuz', 2).varies, true, 'eve of a varies day shows Yes*');
});

test('Purim in a leap year, Purim Katan, Nisan, Sivan, Av', () => {
  assert.equal(dayRule('Adar II', 14).label, 'Purim / Shushan Purim');
  assert.equal(minchaRule('Adar II', 13).label, 'Erev Purim');
  assert.equal(dayRule('Adar I', 14).label, 'Purim Katan');
  assert.equal(dayRule('Adar I', 13).omit, false);
  assert.equal(dayRule('Nisan', 5).label, 'Nisan');
  assert.equal(dayRule('Nisan', 16).label, 'Pesach (Chol Hamoed)');
  assert.equal(dayRule('Sivan', 12).omit, true);
  assert.equal(dayRule('Sivan', 13).omit, false);
  assert.equal(dayRule('Av', 9).label, 'Tisha B’Av');
  assert.equal(minchaRule('Av', 8).label, 'Erev Tisha B’Av');
  assert.equal(minchaRule('Av', 14).label, 'Erev Tu B’Av');
  assert.equal(dayRule('Elul', 29).label, 'Erev Rosh Hashana');
});

test('Krias Shema wording follows the clock', () => {
  // 8 Av 5786 = Wed 2026-07-22; Tisha B'Av the next day.
  const noon = T.matchKriasShemaRule(new Date(2026, 6, 22, 12, 0));
  assert.equal(noon.label, 'No tachanun tonight for Tisha B’Av');
  assert.equal(noon.note, T.KRIAS_SHEMA_NOTE);
  const afterMidnight = T.matchKriasShemaRule(new Date(2026, 6, 22, 0, 1));
  assert.equal(afterMidnight.label, 'No tachanun tonight for Tisha B’Av');
  // Shabbos 2026-10-31 followed by a plain Sunday: last omit night ends at midnight.
  assert.equal(T.matchKriasShemaRule(new Date(2026, 9, 31, 20, 0)).label, 'No tachanun until midnight');
  // Shabbos followed by Rosh Chodesh (30 Cheshvan 5787 = Tue 2026-11-10; use 1 Kislev run instead):
  const rcEve = civilFor('Cheshvan', 29); // Mon 2026-11-09 night -> 30 Cheshvan
  assert.equal(T.matchKriasShemaRule(new Date(rcEve.getFullYear(), rcEve.getMonth(), rcEve.getDate(), 21)).label, 'No tachanun tonight for Rosh Chodesh');
  const bothOmit = civilFor('Cheshvan', 30); // night into 1 Kislev
  const ev = new Date(bothOmit.getFullYear(), bothOmit.getMonth(), bothOmit.getDate(), 21);
  assert.equal(T.matchKriasShemaRule(ev).label, 'No tachanun tonight');
  const morning = new Date(bothOmit.getFullYear(), bothOmit.getMonth(), bothOmit.getDate(), 9);
  assert.equal(T.matchKriasShemaRule(morning).label, 'No tachanun');
  // Fridays always 'No tachanun'.
  assert.deepEqual(T.matchKriasShemaRule(new Date(2026, 9, 30, 15)), { omit: true, label: 'No tachanun' });
  // A halachic midnight passed in overrides civil midnight.
  const late = new Date(2026, 9, 31, 23, 50);
  assert.equal(T.matchKriasShemaRule(late, { midnight: new Date(2026, 9, 31, 23, 40) }).label, 'No tachanun');
});

test('decide() produces the feed shape', () => {
  const d = T.decide('2026-10-25');
  assert.equal(d.date, '2026-10-25');
  assert.equal(d.weekday, 0);
  assert.deepEqual(d.hebrew, { day: 14, month: 'Cheshvan', year: 5787 });
  assert.equal(d.hebrew_date, 'Cheshvan 14, 5787');
  assert.deepEqual(Object.keys(d.shacharit).sort(), ['reason', 'recite', 'varies']);
  assert.equal(d.krias_shema.until_midnight, false);
  const shabbos = T.decide('2026-10-31');
  assert.equal(shabbos.shacharit.recite, false);
  assert.equal(shabbos.krias_shema.recite, false);
  assert.equal(shabbos.krias_shema.until_midnight, true);
  const varies = T.decide(civilFor('Tammuz', 3));
  assert.equal(varies.shacharit.varies, true);
  assert.equal(varies.shacharit.varies_key, 'Tammuz-3');
  assert.equal(varies.shacharit.recite, true);
});
