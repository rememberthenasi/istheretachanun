const test = require('node:test');
const assert = require('node:assert/strict');
const { buildYear, dayEntry } = require('../scripts/build-feed.js');
const T = require('../lib/tachanun.js');

test('a built year covers every civil date and carries its versions', () => {
  const y = buildYear(2027, '2026-10-25T00:00:00.000Z');
  assert.equal(y.schema_version, T.SCHEMA_VERSION);
  assert.equal(y.logic_version, T.LOGIC_VERSION);
  assert.equal(Object.keys(y.days).length, 365);
  assert.ok(y.days['2027-01-01'] && y.days['2027-12-31']);
  assert.equal(y.range.from, '2027-01-01');
});

test('after_sunset of a date equals the next date\'s today', () => {
  const a = dayEntry(T.fromIso('2026-11-09'));
  const b = dayEntry(T.fromIso('2026-11-10'));
  assert.deepEqual(a.after_sunset, b.today);
  assert.equal(a.after_sunset.hebrew.day, 30);
  assert.equal(a.after_sunset.shacharit.recite, false);
});

test('feed entries are plain JSON with the documented keys', () => {
  const e = dayEntry(T.fromIso('2026-10-25'));
  assert.deepEqual(Object.keys(e), ['weekday', 'today', 'after_sunset', 'krias_shema']);
  assert.deepEqual(Object.keys(e.today), ['hebrew_date', 'hebrew', 'shacharit', 'mincha']);
  assert.deepEqual(Object.keys(e.krias_shema), ['recite', 'reason', 'varies', 'until_midnight', 'note']);
  JSON.parse(JSON.stringify(e));
});
