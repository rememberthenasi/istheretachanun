// Run with: node --test tests/
// Checks lib/zmanim.js against published sunrise/sunset times (to the
// minute) and the ordering of the day's zmanim.
const test = require('node:test');
const assert = require('node:assert/strict');
const Z = require('../lib/zmanim.js');

const hm = (date, timeZone) => date.toLocaleTimeString('en-GB', { timeZone, hour: '2-digit', minute: '2-digit', hour12: false });
const near = (date, timeZone, expected, slackMin = 1) => {
  const [h, m] = hm(date, timeZone).split(':').map(Number);
  const [eh, em] = expected.split(':').map(Number);
  const diff = Math.abs((h * 60 + m) - (eh * 60 + em));
  assert.ok(diff <= slackMin, `${hm(date, timeZone)} vs ${expected}`);
};

test('sunrise and sunset match published times', () => {
  const nyWinter = Z.forDay(2026, 11, 8, 40.7128, -74.006);
  near(nyWinter.sunrise, 'America/New_York', '06:34');
  near(nyWinter.sunset, 'America/New_York', '16:44');
  const nySummer = Z.forDay(2026, 6, 21, 40.7128, -74.006);
  near(nySummer.sunrise, 'America/New_York', '05:25');
  near(nySummer.sunset, 'America/New_York', '20:31');
  const jlm = Z.forDay(2026, 6, 21, 31.7683, 35.2137);
  near(jlm.sunset, 'Asia/Jerusalem', '19:47');
  const london = Z.forDay(2026, 6, 21, 51.5074, -0.1278);
  near(london.sunrise, 'Europe/London', '04:43');
  near(london.sunset, 'Europe/London', '21:21');
  const melb = Z.forDay(2026, 12, 21, -37.8136, 144.9631);
  near(melb.sunset, 'Australia/Melbourne', '20:42');
});

test('matches Chabad.org zmanim to the minute', () => {
  // Published by Chabad.org for these coordinates and dates.
  const ch = Z.forDay(2026, 11, 8, 40.6694, -73.9422); // Crown Heights
  const ny = 'America/New_York';
  near(ch.alos, ny, '05:06'); near(ch.sunrise, ny, '06:34'); near(ch.chatzos, ny, '11:39');
  near(ch.sunset, ny, '16:44'); near(ch.chatzosLaila, ny, '23:39');
  assert.equal(hm(ch.tzeis, ny), '17:14');
  const jlm = Z.forDay(2026, 6, 21, 31.7683, 35.2137);
  assert.equal(hm(jlm.tzeis, 'Asia/Jerusalem'), '20:16');
  near(jlm.alos, 'Asia/Jerusalem', '04:01');
  near(jlm.chatzosLaila, 'Asia/Jerusalem', '00:41');
  const lon = Z.forDay(2026, 6, 21, 51.5074, -0.1278);
  assert.equal(hm(lon.tzeis, 'Europe/London'), '22:10');
  near(lon.alos, 'Europe/London', '01:02'); // no 16.9° dawn: previous midnight
});

test('zmanim are in order and midnight is 12 hours after midday', () => {
  for (const [lat, lng] of [[40.67, -73.94], [31.78, 35.23], [-33.87, 151.21], [21.31, -157.86], [51.5, -0.13]]) {
    for (const [y, m, d] of [[2026, 1, 15], [2026, 6, 21], [2026, 9, 22], [2026, 12, 21]]) {
      const z = Z.forDay(y, m, d, lat, lng);
      const order = [z.alos, z.sunrise, z.chatzos, z.sunset, z.tzeis, z.chatzosLaila].map((x) => x.getTime());
      for (let i = 1; i < order.length; i++) assert.ok(order[i] > order[i - 1], `order ${lat},${lng} ${y}-${m}-${d} @${i}`);
      assert.equal(z.chatzosLaila - z.chatzos, 12 * 3600 * 1000);
      // Baal HaTanya tzeis (6°) is roughly 20-50 minutes after sunset here.
      const gap = (z.tzeis - z.sunset) / 60000;
      assert.ok(gap > 18 && gap < 60, `tzeis gap ${gap}`);
      assert.equal(z.approximate, false);
    }
  }
});

test('polar days still return ordered, flagged times', () => {
  for (const [m, d] of [[6, 21], [12, 21]]) {
    const z = Z.forDay(2026, m, d, 69.65, 18.96);
    assert.equal(z.approximate, true);
    const order = [z.alos, z.sunrise, z.chatzos, z.sunset, z.tzeis, z.chatzosLaila].map((x) => x.getTime());
    for (let i = 1; i < order.length; i++) assert.ok(order[i] > order[i - 1]);
  }
});
