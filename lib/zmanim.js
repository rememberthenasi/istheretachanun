/*
 * Is There Tachanun? — zmanim (halachic times) for a location.
 *
 * A small, dependency-free implementation of the NOAA solar calculator, so the
 * page works offline and needs no third-party script. Times are returned as
 * absolute Date instants; format them in the location's time zone.
 *
 * Opinions used (Shulchan Aruch HaRav / Baal HaTanya, as in Chabad calendars):
 *   alos (dawn)       sun 16.9° below the horizon
 *   sunrise / sunset  sea-level, standard refraction (zenith 90.833°)
 *   chatzos (midday)  solar transit
 *   tzeis (nightfall) sun 6° below the horizon
 *   chatzos halayla   solar transit + 12 hours
 *
 * These match the times Chabad.org publishes (checked against its zmanim feed
 * for Crown Heights, Jerusalem and London to the minute). Nightfall is rounded
 * up to the minute, as Chabad.org prints it.
 *
 * Where the sun never reaches a depression (far north in summer) the value is
 * estimated from sunset/sunrise and the result is flagged `approximate`.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module && module.exports) module.exports = api;
  root.Zmanim = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var ZENITH = {
    sunriseSunset: 90.833,
    tzeis: 96,      // 6°
    alos: 106.9     // 16.9°
  };
  var MINUTE = 60 * 1000;
  var rad = function (d) { return d * Math.PI / 180; };
  var deg = function (r) { return r * 180 / Math.PI; };

  function julianDay(utcMs) { return utcMs / 86400000 + 2440587.5; }

  function solar(jd) {
    var jc = (jd - 2451545) / 36525;
    var L0 = (280.46646 + jc * (36000.76983 + jc * 0.0003032)) % 360;
    var M = 357.52911 + jc * (35999.05029 - 0.0001537 * jc);
    var e = 0.016708634 - jc * (0.000042037 + 0.0000001267 * jc);
    var C = Math.sin(rad(M)) * (1.914602 - jc * (0.004817 + 0.000014 * jc))
      + Math.sin(rad(2 * M)) * (0.019993 - 0.000101 * jc)
      + Math.sin(rad(3 * M)) * 0.000289;
    var omega = 125.04 - 1934.136 * jc;
    var lambda = L0 + C - 0.00569 - 0.00478 * Math.sin(rad(omega));
    var eps0 = 23 + (26 + (21.448 - jc * (46.815 + jc * (0.00059 - jc * 0.001813))) / 60) / 60;
    var eps = eps0 + 0.00256 * Math.cos(rad(omega));
    var decl = deg(Math.asin(Math.sin(rad(eps)) * Math.sin(rad(lambda))));
    var y = Math.pow(Math.tan(rad(eps / 2)), 2);
    var eqTime = 4 * deg(
      y * Math.sin(2 * rad(L0))
      - 2 * e * Math.sin(rad(M))
      + 4 * e * y * Math.sin(rad(M)) * Math.cos(2 * rad(L0))
      - 0.5 * y * y * Math.sin(4 * rad(L0))
      - 1.25 * e * e * Math.sin(2 * rad(M))
    );
    return { decl: decl, eqTime: eqTime };
  }

  /** Minutes after 00:00 UTC of `utcMidnight` for solar transit at `lng`. */
  function transitMinutes(utcMidnight, lng) {
    var t = 720 - 4 * lng;
    for (var i = 0; i < 3; i++) {
      var s = solar(julianDay(utcMidnight + t * MINUTE));
      t = 720 - 4 * lng - s.eqTime;
    }
    return t;
  }

  /**
   * Minutes after 00:00 UTC for the sun crossing `zenith` (morning or evening),
   * or null when it does not happen that day.
   */
  function eventMinutes(utcMidnight, lat, lng, zenith, rising) {
    var t = transitMinutes(utcMidnight, lng) + (rising ? -360 : 360);
    for (var i = 0; i < 4; i++) {
      var s = solar(julianDay(utcMidnight + t * MINUTE));
      var cosH = Math.cos(rad(zenith)) / (Math.cos(rad(lat)) * Math.cos(rad(s.decl)))
        - Math.tan(rad(lat)) * Math.tan(rad(s.decl));
      if (cosH > 1 || cosH < -1) return null;
      var H = deg(Math.acos(cosH));
      t = 720 - 4 * (lng + (rising ? H : -H)) - s.eqTime;
    }
    return t;
  }

  /**
   * Zmanim for the civil day year/month(1-12)/day at lat/lng (degrees, east
   * positive). The civil day is the location's own calendar day.
   */
  function forDay(year, month, day, lat, lng) {
    var utcMidnight = Date.UTC(year, month - 1, day);
    var at = function (min) { return min === null ? null : new Date(utcMidnight + Math.round(min * 60) * 1000); };
    var transit = transitMinutes(utcMidnight, lng);
    var approximate = false;

    var sunrise = at(eventMinutes(utcMidnight, lat, lng, ZENITH.sunriseSunset, true));
    var sunset = at(eventMinutes(utcMidnight, lat, lng, ZENITH.sunriseSunset, false));
    var tzeis = at(eventMinutes(utcMidnight, lat, lng, ZENITH.tzeis, false));
    var alos = at(eventMinutes(utcMidnight, lat, lng, ZENITH.alos, true));
    var chatzos = at(transit);
    var chatzosLaila = at(transit + 720);

    // Polar fallbacks: keep every value defined so the page can still order
    // the day, and say that the times are estimates.
    // Dawn is only used to decide when Shacharis becomes "now", so a missing
    // dawn does not make the day's times approximate.
    if (!sunrise || !sunset) {
      // Midnight sun or polar night: no real sunrise/sunset at all.
      approximate = true;
      sunrise = at(transit - 360);
      sunset = at(transit + 360);
      tzeis = at(transit + 400);
      alos = at(transit - 432);
    }
    if (!tzeis) {
      approximate = true;
      tzeis = new Date(Math.min(sunset.getTime() + 40 * MINUTE, chatzosLaila.getTime()));
    }
    if (!alos) {
      // As Chabad.org does: when the sun never reaches 16.9°, dawn is the
      // preceding halachic midnight.
      alos = at(transit - 720);
    }
    // Nightfall is rounded up to the whole minute, as Chabad.org prints it,
    // so the page switches days at the same minute it shows.
    tzeis = new Date(Math.ceil(tzeis.getTime() / MINUTE) * MINUTE);

    return {
      alos: alos,
      sunrise: sunrise,
      chatzos: chatzos,
      sunset: sunset,
      tzeis: tzeis,
      chatzosLaila: chatzosLaila,
      approximate: approximate
    };
  }

  /** Same as forDay, for a Date whose local y/m/d is the civil day wanted. */
  function forDate(date, lat, lng) {
    return forDay(date.getFullYear(), date.getMonth() + 1, date.getDate(), lat, lng);
  }

  return { ZENITH: ZENITH, forDay: forDay, forDate: forDate };
});
