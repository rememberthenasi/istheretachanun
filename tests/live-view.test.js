// Run with: node --test tests/
// Which day each box answers for, and which box is "now", through a day.
const test = require('node:test');
const assert = require('node:assert/strict');

require('../data/omissions.js');
const T = require('../lib/tachanun.js');

/** A weekday civil date for the Hebrew date such that it and the next day are not Fri/Shabbos. */
function plainWeekdayFor(month, day) {
  for (let y = 5786; y <= 5799; y++) {
    const start = new Date(y - 3761, 7, 1, 12);
    for (let d = new Date(start), i = 0; i < 420; i++, d.setDate(d.getDate() + 1)) {
      const hd = T.getHebrewParts(d);
      if (hd.year === y && hd.month === month && hd.day === day) {
        if (d.getDay() >= 0 && d.getDay() <= 3) return T.makeDateAtNoon(d);
        break;
      }
    }
  }
  throw new Error(`no plain weekday for ${day} ${month}`);
}

const at = (date, h, m = 0, dayOffset = 0) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + dayOffset, h, m);
/** Fixed zmanim for every civil day; midnight given as hours after 00:00 of that day. */
const zmanim = (midnightHour = 23.75) => (date) => ({
  alos: at(date, 5), chatzos: at(date, 12), sunset: at(date, 17), tzeis: at(date, 17, 30),
  chatzosLaila: new Date(at(date, 0).getTime() + midnightHour * 3600 * 1000)
});
const iso = T.isoDate;

// 18 Kislev: a regular day whose next day (Yud Tes Kislev) has no Tachanun.
const D = plainWeekdayFor('Kislev', 18);
const D1 = T.nextDay(D);

test('morning: Shacharis is now, everything is for today', () => {
  const v = T.liveView(at(D, 8), D, zmanim());
  assert.equal(v.shacharis.when, 'today');
  assert.equal(iso(v.shacharis.date), iso(D));
  assert.equal(v.shacharis.isNow, true);
  assert.equal(v.shacharis.rule.omit, false);
  assert.equal(v.mincha.isNow, false);
  assert.equal(iso(v.shema.date), iso(D)); // the coming night
  assert.equal(v.shema.isNow, false);
  assert.equal(v.shema.rule.omit, true); // night before Yud Tes Kislev
  assert.equal(iso(v.hebrewDate), iso(D));
});

test('afternoon: Mincha is now (Erev Yud Tes Kislev)', () => {
  const v = T.liveView(at(D, 14), D, zmanim());
  assert.equal(v.shacharis.isNow, false);
  assert.equal(v.mincha.isNow, true);
  assert.equal(v.mincha.rule.omit, true);
});

test('between sunset and tzeis: Hebrew date has turned, Mincha still today', () => {
  const v = T.liveView(at(D, 17, 15), D, zmanim());
  assert.equal(iso(v.hebrewDate), iso(D1));
  assert.equal(v.mincha.when, 'today');
  assert.equal(v.mincha.isNow, true);
  assert.equal(v.shema.isNow, false);
});

test('after tzeis: Shacharis and Mincha move to tomorrow, Shema is now', () => {
  const v = T.liveView(at(D, 19), D, zmanim());
  assert.equal(v.shacharis.when, 'tomorrow');
  assert.equal(iso(v.shacharis.date), iso(D1));
  assert.equal(v.shacharis.rule.omit, true);
  assert.equal(v.shacharis.isNow, false);
  assert.equal(v.mincha.when, 'tomorrow');
  assert.equal(v.mincha.isNow, false);
  assert.equal(v.shema.isNow, true);
  assert.equal(iso(v.shema.date), iso(D));
  assert.equal(v.shema.afterMidnight, false);
});

test('the night before a no-Tachanun day omits all night, until dawn', () => {
  // Midnight at 23:45: still the same night afterwards, still omitted.
  const late = T.liveView(at(D, 23, 50), D, zmanim(23.75));
  assert.equal(iso(late.shema.date), iso(D));
  assert.equal(late.shema.isNow, true);
  assert.equal(late.shema.afterMidnight, true);
  assert.equal(late.shema.rule.omit, true);
  assert.equal(late.shema.rule.untilMidnight, false);
  // 4 AM (dawn is 5:00): still the night of D; Shacharis already for D+1.
  const small = T.liveView(at(D1, 4), D1, zmanim(23.75));
  assert.equal(iso(small.shema.date), iso(D));
  assert.equal(small.shema.isNow, true);
  assert.equal(small.shacharis.when, 'today');
  assert.equal(iso(small.shacharis.date), iso(D1));
  assert.equal(small.shacharis.isNow, false);
  // After dawn the box shows the coming night and Shacharis is now.
  const dawn = T.liveView(at(D1, 5, 30), D1, zmanim(23.75));
  assert.equal(iso(dawn.shema.date), iso(D1));
  assert.equal(dawn.shema.isNow, false);
  assert.equal(dawn.shacharis.isNow, true);
});

test('the night after a no-Tachanun day omits only until halachic midnight', () => {
  const chof = plainWeekdayFor('Kislev', 20); // Chof Kislev; 21 Kislev is regular
  const before = T.liveView(at(chof, 23, 0), chof, zmanim(23.75));
  assert.equal(before.shema.rule.omit, true);
  assert.equal(before.shema.rule.untilMidnight, true);
  assert.equal(before.shema.afterMidnight, false);
  const after = T.liveView(at(chof, 23, 50), chof, zmanim(23.75));
  assert.equal(iso(after.shema.date), iso(chof)); // same night
  assert.equal(after.shema.afterMidnight, true);
  assert.equal(after.shema.dayAfterRule.omit, false); // Tachanun resumes
  assert.equal(after.shema.isNow, true);

  // Summer: midnight at 00:50 the next civil day.
  const next = T.nextDay(chof);
  const early = T.liveView(at(next, 0, 30), next, zmanim(24 + 50 / 60));
  assert.equal(iso(early.shema.date), iso(chof));
  assert.equal(early.shema.afterMidnight, false);
  const past = T.liveView(at(next, 1, 0), next, zmanim(24 + 50 / 60));
  assert.equal(iso(past.shema.date), iso(chof));
  assert.equal(past.shema.afterMidnight, true);
});

test('a night after a no-Tachanun day omits only until midnight', () => {
  const chof = plainWeekdayFor('Kislev', 20);
  const r = T.shemaForNight(chof);
  assert.equal(r.omit, true);
  assert.equal(r.untilMidnight, true);
  const plain = T.shemaForNight(plainWeekdayFor('Kislev', 22));
  assert.equal(plain.omit, false);
});
