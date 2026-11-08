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
  assert.equal(v.shema.when, 'tonight');
  assert.equal(iso(v.shema.date), iso(D));
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
  assert.equal(v.shema.when, 'tonight');
  assert.equal(v.shema.isNow, true);
  assert.equal(iso(v.shema.date), iso(D));
});

test('Shema moves to the next night only after halachic midnight', () => {
  // Midnight at 23:45: at 23:40 still tonight, at 23:50 the next night.
  const before = T.liveView(at(D, 23, 40), D, zmanim(23.75));
  assert.equal(before.shema.when, 'tonight');
  assert.equal(iso(before.shema.date), iso(D));
  const after = T.liveView(at(D, 23, 50), D, zmanim(23.75));
  assert.equal(after.shema.when, 'tomorrow-night');
  assert.equal(iso(after.shema.date), iso(D1));
  assert.equal(after.shema.isNow, false);

  // Summer: midnight at 00:50. At 00:30 (civil D+1) it is still last night.
  const late = T.liveView(at(D1, 0, 30), D1, zmanim(24 + 50 / 60)); // 00:50 the next civil day
  assert.equal(late.shema.when, 'tonight');
  assert.equal(iso(late.shema.date), iso(D));
  assert.equal(late.shema.isNow, true);
  assert.equal(late.shacharis.when, 'today');
  assert.equal(iso(late.shacharis.date), iso(D1));
  const later = T.liveView(at(D1, 1, 0), D1, zmanim(24 + 50 / 60));
  assert.equal(iso(later.shema.date), iso(D1));
  assert.equal(later.shema.isNow, false);
});

test('a night after a no-Tachanun day omits only until midnight', () => {
  const chof = plainWeekdayFor('Kislev', 20); // 21 Kislev is a regular day
  const r = T.shemaForNight(chof);
  assert.equal(r.omit, true);
  assert.equal(r.untilMidnight, true);
  const plain = T.shemaForNight(plainWeekdayFor('Kislev', 22));
  assert.equal(plain.omit, false);
});
