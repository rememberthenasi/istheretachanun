// Simple test harness for matchKriasShemaRule logic (stubbed matchDayRule)
function matchKriasShemaRuleStub(todayRule, tomorrowRule, referenceIso) {
  const ref = referenceIso ? new Date(referenceIso) : new Date();
  const midnight = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() + 1, 0, 0, 0, 0);
  const isBeforeMidnight = ref < midnight;
  const isEveningOrNight = ref.getHours() >= 18;
  const note = "Rebono Shel Olam and Lamnatzeach Mizmor L'Dovid should still be said.";

  // Simulate today's omit
  if (todayRule.omit) {
    if (tomorrowRule.omit) {
      if (isEveningOrNight && isBeforeMidnight) {
        return { omit: true, label: 'No tachanun tonight', note };
      }
      return { omit: true, label: 'No tachanun', note };
    }
    if (isBeforeMidnight) {
      return { omit: true, label: 'No tachanun until midnight', note };
    }
    return { omit: true, label: 'No tachanun', note };
  }

  if (tomorrowRule.omit && isEveningOrNight && isBeforeMidnight) {
    return { omit: true, label: `No tachanun tonight for ${tomorrowRule.label}`, note };
  }

  return { omit: false, label: '', note: '' };
}

const tests = [
  {
    name: 'Last omit day before regular day (evening)',
    todayRule: { omit: true, label: 'Shabbos' },
    tomorrowRule: { omit: false },
    ref: '2026-05-16T23:00:00'
  },
  {
    name: 'Consecutive omit days (evening)',
    todayRule: { omit: true, label: 'Chol Hamoed' },
    tomorrowRule: { omit: true, label: 'Chol Hamoed' },
    ref: '2026-05-16T23:00:00'
  },
  {
    name: 'Regular day followed by omit (evening)',
    todayRule: { omit: false },
    tomorrowRule: { omit: true, label: 'Rosh Chodesh' },
    ref: '2026-05-16T23:00:00'
  },
  {
    name: '8 Av night going into Tisha B’Av',
    todayRule: { omit: false },
    tomorrowRule: { omit: true, label: 'Tisha B’Av' },
    ref: '2026-07-22T23:00:00'
  }
];

for (const t of tests) {
  console.log('---');
  console.log(t.name);
  console.log('ref:', t.ref);
  console.log(matchKriasShemaRuleStub(t.todayRule, t.tomorrowRule, t.ref));
}

// Also test daytime behavior for last-omit-day
console.log('---');
console.log('Last omit day before regular day (daytime)');
console.log(matchKriasShemaRuleStub({ omit: true, label: 'Shabbos' }, { omit: false }, '2026-05-16T12:00:00'));

module.exports = { matchKriasShemaRuleStub };
