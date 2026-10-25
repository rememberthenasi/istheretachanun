/*
 * Is There Tachanun? — decision logic (Chabad-Lubavitch custom).
 *
 * This file is the single home of the rules. The web page (index.html), the
 * test-suite (tests/) and the feed generator (scripts/build-feed.js) all load
 * it, so a rule change made here reaches all three at once.
 *
 * It is a plain script with no DOM access and no dependencies:
 *   - in a browser it defines `window.Tachanun`;
 *   - in Node it is `require()`-able (module.exports) and also sets
 *     `globalThis.Tachanun`.
 *
 * Hebrew dates come from the host's Intl Hebrew calendar (ICU), mapped by
 * civil day: the Hebrew date returned for a civil date is the one whose
 * daytime falls on that date. Nightfall handling is the caller's business
 * (see decide() and the `after_sunset` entries the feed publishes).
 *
 * Omission data (labels, "varies" notes, Chabad date names) lives in
 * data/omissions.js and is passed in as `data`, defaulting to the global
 * OMISSIONS object that file defines.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module && module.exports) module.exports = api;
  root.Tachanun = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // Bump on ANY change to the rules below (not for refactors that keep every
  // answer identical). Published in every feed file so consumers can tell
  // when their cached copy is behind.
  var LOGIC_VERSION = '2026.10.25';

  // Shape of the JSON feed produced by scripts/build-feed.js. Bump the major
  // only when a consumer written against the old shape would break.
  var SCHEMA_VERSION = 1;

  var EMPTY_DATA = { omissionRules: [], variesNotes: [], variesRules: {}, dateNames: {} };

  // ICU month names → the spellings used throughout this project (and by
  // Chabad.org, which the TT Luach follows).
  var MONTH_NAMES = {
    Tishri: 'Tishrei', Heshvan: 'Cheshvan', Kislev: 'Kislev', Tevet: 'Tevet', Shevat: 'Shevat',
    Adar: 'Adar', 'Adar I': 'Adar I', 'Adar II': 'Adar II', Nisan: 'Nisan', Iyar: 'Iyar',
    Sivan: 'Sivan', Tamuz: 'Tammuz', Av: 'Av', Elul: 'Elul'
  };

  var KRIAS_SHEMA_NOTE = 'Rebono Shel Olam and Lamnatzeach Mizmor L\'Dovid should still be said.';

  function defaultData() {
    var g = (typeof globalThis !== 'undefined') ? globalThis : {};
    return g.OMISSIONS || EMPTY_DATA;
  }

  // --- civil date helpers --------------------------------------------------

  function makeDateAtNoon(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
  }
  function previousDay(date) { var d = new Date(date); d.setDate(d.getDate() - 1); return makeDateAtNoon(d); }
  function nextDay(date) { var d = new Date(date); d.setDate(d.getDate() + 1); return makeDateAtNoon(d); }
  function isoDate(date) {
    var y = date.getFullYear();
    var m = String(date.getMonth() + 1).padStart(2, '0');
    var d = String(date.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }
  /** Parse 'YYYY-MM-DD' as a local date at noon. */
  function fromIso(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso));
    if (!m) throw new Error('Expected YYYY-MM-DD, got ' + iso);
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0, 0);
  }

  // --- Hebrew date ---------------------------------------------------------

  var hebrewFormatter = null;
  function getHebrewParts(date) {
    if (!hebrewFormatter) {
      hebrewFormatter = new Intl.DateTimeFormat('en-u-ca-hebrew', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    var parts = hebrewFormatter.formatToParts(date);
    var find = function (type) { var p = parts.find(function (x) { return x.type === type; }); return p ? p.value : undefined; };
    var rawMonth = find('month');
    return {
      day: Number(find('day')),
      month: MONTH_NAMES[rawMonth] || rawMonth,
      year: Number(find('year'))
    };
  }
  function formatHebrewDateEnglish(h) { return h.day + ' ' + h.month + ' ' + h.year; }
  /** "Cheshvan 14, 5787" — the order Chabad.org (and the TT Luach) print. */
  function formatHebrewDateChabad(h) { return h.month + ' ' + h.day + ', ' + h.year; }
  function keyOf(hd) { return hd.month + '-' + hd.day; }
  function isPurimMonth(month) { return month === 'Adar' || month === 'Adar II'; }
  function isRealYomTovDay(hd) {
    return (hd.month === 'Tishrei' && (hd.day === 1 || hd.day === 2 || hd.day === 15 || hd.day === 21 || hd.day === 22))
      || (hd.month === 'Nisan' && (hd.day === 15 || hd.day === 21 || hd.day === 22))
      || (hd.month === 'Sivan' && (hd.day === 6 || hd.day === 7));
  }

  // --- rules -----------------------------------------------------------------
  // Each rule returns { omit: boolean, label: string, varies?: true, key?: string }.
  // `varies` marks the three days (3 Tammuz, 18 Elul, 5 Teves) whose public
  // custom is to say Tachanun while some omit; `key` is the data key for that
  // day so a consumer with its own policy switch can apply it.

  function variesResult(data, hd) {
    var rules = data.variesRules || {};
    var k = keyOf(hd);
    if (!rules[k]) return null;
    return { omit: false, label: rules[k], varies: true, key: k };
  }

  function matchDayRule(hd, secularDate, data) {
    data = data || defaultData();
    var names = data.dateNames || {};
    var isShabbos = secularDate.getDay() === 6;
    var isRoshChodesh = hd.day === 1 || hd.day === 30;
    var yomTovReason = '';

    if (hd.month === 'Tishrei' && (hd.day === 1 || hd.day === 2)) {
      yomTovReason = 'Rosh Hashanah';
    } else if (hd.month === 'Tishrei' && hd.day >= 15 && hd.day <= 22) {
      yomTovReason = hd.day === 15 || hd.day === 21 || hd.day === 22 ? 'Sukkot (Yom Tov)' : 'Sukkot (Chol Hamoed)';
    } else if (hd.month === 'Nisan' && hd.day >= 15 && hd.day <= 22) {
      yomTovReason = hd.day === 15 || hd.day === 21 || hd.day === 22 ? 'Pesach (Yom Tov)' : 'Pesach (Chol Hamoed)';
    } else if (hd.month === 'Sivan' && (hd.day === 6 || hd.day === 7)) {
      yomTovReason = 'Shavuos';
    }

    if (yomTovReason) {
      return { omit: true, label: isShabbos ? 'Shabbos + ' + yomTovReason : yomTovReason };
    }

    if (isShabbos) {
      return { omit: true, label: 'Shabbos' };
    }

    if (isRoshChodesh) {
      var rcReasons = ['Rosh Chodesh'];
      if ((hd.month === 'Kislev' && hd.day >= 25) || (hd.month === 'Tevet' && hd.day <= 3)) rcReasons.push('Chanukah');
      return { omit: true, label: rcReasons.join(' + ') };
    }

    var reasons = [];
    if ((hd.month === 'Tishrei' && hd.day >= 9) || (hd.month === 'Cheshvan' && hd.day <= 1)) {
      reasons.push('9 Tishrei through 1 Cheshvan');
    }

    if ((hd.month === 'Kislev' && hd.day >= 25) || (hd.month === 'Tevet' && hd.day <= 3)) reasons.push('Chanukah');
    if (hd.month === 'Shevat' && hd.day === 15) reasons.push('Tu B’Shevat');
    if (isPurimMonth(hd.month) && hd.day >= 14 && hd.day <= 15) reasons.push('Purim / Shushan Purim');
    if (hd.month === 'Adar I' && hd.day === 14) reasons.push('Purim Katan');
    if (hd.month === 'Adar I' && hd.day === 15) reasons.push('Shushan Purim Katan');

    if (hd.month === 'Nisan' && hd.day >= 15 && hd.day <= 22) {
      reasons.push(hd.day === 15 || hd.day === 21 || hd.day === 22 ? 'Pesach (Yom Tov)' : 'Pesach (Chol Hamoed)');
    } else if (hd.month === 'Nisan') {
      reasons.push('Nisan');
    }

    if (hd.month === 'Nisan' && hd.day === 23) reasons.push('Issru Chag');
    if (hd.month === 'Iyar' && hd.day === 14) reasons.push('Pesach Sheni');
    if (hd.month === 'Iyar' && hd.day === 18) reasons.push('Lag BaOmer');
    if (hd.month === 'Sivan' && (hd.day === 6 || hd.day === 7)) reasons.push('Shavuos');
    if (hd.month === 'Sivan' && hd.day >= 1 && hd.day <= 12 && reasons.indexOf('Shavuos') === -1) reasons.push('No Tachanun from Rosh Chodesh Sivan - 12th Sivan');
    if (hd.month === 'Av' && hd.day === 9) reasons.push('Tisha B’Av');
    if (hd.month === 'Av' && hd.day === 15) reasons.push('Tu B’Av');
    if (hd.month === 'Elul' && hd.day === 29) reasons.push('Erev Rosh Hashana');
    if (hd.month === 'Kislev' && hd.day === 10) reasons.push(names['Kislev-10'] || '10 Kislev');
    if (hd.month === 'Kislev' && hd.day === 19) reasons.push(names['Kislev-19'] || 'Yud Tes Kislev');
    if (hd.month === 'Kislev' && hd.day === 20) reasons.push(names['Kislev-20'] || 'Chof Kislev');
    if (hd.month === 'Tammuz' && hd.day === 12) reasons.push(names['Tammuz-12'] || 'Yud Beis Tammuz');
    if (hd.month === 'Tammuz' && hd.day === 13) reasons.push(names['Tammuz-13'] || 'Yud Gimmel Tammuz');

    if (reasons.length > 0) return { omit: true, label: reasons.join(' + ') };
    var varies = variesResult(data, hd);
    if (varies) return varies;
    return { omit: false, label: 'No listed omission date matched' };
  }

  function matchMinchaRule(hd, secularDate, data) {
    data = data || defaultData();
    var names = data.dateNames || {};
    if (secularDate.getDay() === 5) return { omit: true, label: 'Friday Mincha' };
    var sameDayRule = matchDayRule(hd, secularDate, data);
    if (sameDayRule.omit) return sameDayRule;
    if (hd.day === 1 || hd.day === 30) return { omit: true, label: 'Rosh Chodesh day' };
    var tomorrowHd = getHebrewParts(nextDay(secularDate));
    if (tomorrowHd.day === 1 || tomorrowHd.day === 30) return { omit: true, label: 'Erev Rosh Chodesh' };
    if (hd.month === 'Kislev' && hd.day === 24) return { omit: true, label: 'Erev Chanukah' };
    if (isPurimMonth(hd.month) && hd.day === 13) return { omit: true, label: 'Erev Purim' };
    if (hd.month === 'Shevat' && hd.day === 14) return { omit: true, label: 'Erev Tu B’Shevat' };
    if (hd.month === 'Iyar' && hd.day === 17) return { omit: true, label: 'Erev Lag BaOmer' };
    if (hd.month === 'Av' && hd.day === 8) return { omit: true, label: 'Erev Tisha B’Av' };
    if (hd.month === 'Av' && hd.day === 14) return { omit: true, label: 'Erev Tu B’Av' };
    if (hd.month === 'Kislev' && hd.day === 9) return { omit: true, label: 'Erev Yud Kislev' };
    if (hd.month === 'Kislev' && hd.day === 18) return { omit: true, label: 'Erev ' + (names['Kislev-19'] || 'Yud Tes Kislev') };
    if (hd.month === 'Kislev' && hd.day === 19) return { omit: true, label: 'Erev ' + (names['Kislev-20'] || 'Chof Kislev') };
    if (hd.month === 'Tammuz' && hd.day === 11) return { omit: true, label: 'Erev ' + (names['Tammuz-12'] || 'Yud Beis Tammuz') };
    var varies = variesResult(data, hd);
    if (varies) return varies;

    // If tomorrow is a 'varies' date (e.g., 3 Tammuz), show Mincha as
    // 'Yes*' so the custom note is visible at Mincha time.
    var tomorrowVaries = variesResult(data, tomorrowHd);
    if (tomorrowVaries) return tomorrowVaries;

    return { omit: false, label: 'No listed omission date matched' };
  }

  /**
   * Krias Shema al Hamita for the night that follows civil date `secularDate`,
   * without reference to the clock. Returns
   *   { omit, label, note, varies?, key?, untilMidnight?, tomorrowLabel }
   * where `untilMidnight` marks the last night of a run of omit days (after
   * halachic midnight the next day's rule takes over). Time-of-day wording is
   * layered on by matchKriasShemaRule().
   */
  function kriasShemaForDate(secularDate, data) {
    data = data || defaultData();
    var day = makeDateAtNoon(secularDate);
    var hd = getHebrewParts(day);
    var tomorrow = nextDay(day);
    var tomorrowHd = getHebrewParts(tomorrow);
    var todayRule = matchDayRule(hd, day, data);
    var tomorrowRule = matchDayRule(tomorrowHd, tomorrow, data);

    // Friday night is Shabbos: always omit.
    if (day.getDay() === 5) {
      return { omit: true, label: 'No tachanun', reason: 'Shabbos', note: '', tomorrowLabel: tomorrowRule.label };
    }
    if (todayRule.omit) {
      if (tomorrowRule.omit) {
        return { omit: true, label: 'No tachanun', reason: tomorrowRule.label, note: KRIAS_SHEMA_NOTE, tomorrowLabel: tomorrowRule.label };
      }
      return { omit: true, label: 'No tachanun until midnight', reason: todayRule.label, note: KRIAS_SHEMA_NOTE, untilMidnight: true, tomorrowLabel: tomorrowRule.label };
    }
    if (todayRule.varies) {
      return { omit: false, label: todayRule.label, reason: todayRule.label, note: KRIAS_SHEMA_NOTE, varies: true, key: todayRule.key, tomorrowLabel: tomorrowRule.label };
    }
    if (tomorrowRule.omit) {
      return { omit: true, label: 'No tachanun tonight for ' + tomorrowRule.label, reason: tomorrowRule.label, note: KRIAS_SHEMA_NOTE, tomorrowLabel: tomorrowRule.label };
    }
    if (tomorrowRule.varies) {
      return { omit: false, label: tomorrowRule.label, reason: tomorrowRule.label, note: KRIAS_SHEMA_NOTE, varies: true, key: tomorrowRule.key, tomorrowLabel: tomorrowRule.label };
    }
    return { omit: false, label: '', reason: '', note: '', tomorrowLabel: tomorrowRule.label };
  }

  /**
   * Krias Shema answer for the page, worded for the moment `referenceDate`.
   * options.midnight: a Date for halachic midnight of that night (defaults to
   * civil 00:00 following the reference date); options.data: omission data.
   */
  function matchKriasShemaRule(referenceDate, options) {
    options = options || {};
    var ref = referenceDate ? new Date(referenceDate) : new Date();
    var base = kriasShemaForDate(ref, options.data);
    if (ref.getDay() === 5) return { omit: true, label: 'No tachanun' };

    var midnight = options.midnight || new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() + 1, 0, 0, 0, 0);
    var isBeforeMidnight = ref < midnight;
    var isEveningOrNight = ref.getHours() >= 18;

    if (base.omit && !base.untilMidnight && base.label === 'No tachanun') {
      // Today and tomorrow both omit: from the evening say "tonight".
      if (isEveningOrNight && isBeforeMidnight) return { omit: true, label: 'No tachanun tonight', note: base.note };
      return { omit: true, label: 'No tachanun', note: base.note };
    }
    if (base.untilMidnight) {
      if (isBeforeMidnight) return { omit: true, label: 'No tachanun until midnight', note: base.note };
      return { omit: true, label: 'No tachanun', note: base.note };
    }
    if (base.varies) return { omit: false, label: base.label, note: base.note, varies: true, key: base.key };
    if (base.omit) return { omit: true, label: base.label, note: base.note };
    return { omit: false, label: '', note: '' };
  }

  // --- feed-shaped decisions -------------------------------------------------

  function toDecision(rule) {
    var out = { recite: !rule.omit, reason: rule.label || '', varies: Boolean(rule.varies) };
    if (rule.key) out.varies_key = rule.key;
    return out;
  }

  /**
   * Everything about one civil date, in the shape the feed publishes:
   *   {
   *     date, weekday (0=Sunday), hebrew: {day, month, year},
   *     hebrew_date: "Cheshvan 14, 5787",
   *     shacharit: {recite, reason, varies, varies_key?},
   *     mincha:    {recite, reason, varies, varies_key?},
   *     krias_shema: {recite, reason, varies, varies_key?, until_midnight, note}
   *   }
   * `shacharit`/`mincha` are for the daytime of `date`; `krias_shema` for the
   * night that follows it.
   */
  function decide(civilDate, data) {
    data = data || defaultData();
    var day = makeDateAtNoon(typeof civilDate === 'string' ? fromIso(civilDate) : civilDate);
    var hd = getHebrewParts(day);
    var ks = kriasShemaForDate(day, data);
    var krias = toDecision({ omit: ks.omit, label: ks.reason, varies: ks.varies, key: ks.key });
    krias.until_midnight = Boolean(ks.untilMidnight);
    krias.note = ks.note || '';
    return {
      date: isoDate(day),
      weekday: day.getDay(),
      hebrew: hd,
      hebrew_date: formatHebrewDateChabad(hd),
      shacharit: toDecision(matchDayRule(hd, day, data)),
      mincha: toDecision(matchMinchaRule(hd, day, data)),
      krias_shema: krias
    };
  }

  return {
    LOGIC_VERSION: LOGIC_VERSION,
    SCHEMA_VERSION: SCHEMA_VERSION,
    MONTH_NAMES: MONTH_NAMES,
    KRIAS_SHEMA_NOTE: KRIAS_SHEMA_NOTE,
    defaultData: defaultData,
    makeDateAtNoon: makeDateAtNoon,
    previousDay: previousDay,
    nextDay: nextDay,
    isoDate: isoDate,
    fromIso: fromIso,
    getHebrewParts: getHebrewParts,
    formatHebrewDateEnglish: formatHebrewDateEnglish,
    formatHebrewDateChabad: formatHebrewDateChabad,
    keyOf: keyOf,
    isPurimMonth: isPurimMonth,
    isRealYomTovDay: isRealYomTovDay,
    matchDayRule: matchDayRule,
    matchMinchaRule: matchMinchaRule,
    kriasShemaForDate: kriasShemaForDate,
    matchKriasShemaRule: matchKriasShemaRule,
    decide: decide
  };
});
