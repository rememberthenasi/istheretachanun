/*
 * Copy for the generated SEO pages (scripts/build-pages.js).
 *
 * Only words live here. Every date shown on the generated pages is worked out
 * by lib/tachanun.js, so the pages always agree with the checker on the home
 * page. When a rule changes there, the pages follow on the next build.
 *
 * Each occasion:
 *   slug        URL: /holidays/<slug>/
 *   name        display name (Ashkenazi spelling, as on the site)
 *   aka         other spellings people search for
 *   hebrew      Hebrew name
 *   title       <title> (keep it under ~65 characters)
 *   description meta description (~150 characters)
 *   question    the H1
 *   answer      one-sentence answer shown in the summary box
 *   mincha      what happens at Mincha the day before
 *   body        paragraphs (HTML)
 *   match       (hebrewParts, civilDate) => true on the days of the occasion
 *   limit       how many upcoming occurrences to list
 *   chabad      true for Chabad-specific days
 *   varies      true for the "custom varies" days
 *   related     slugs of related occasion pages
 */

const T = require('../lib/tachanun.js');

const isAdar = (m) => m === 'Adar' || m === 'Adar II';

const OCCASIONS = [
  {
    slug: 'rosh-chodesh',
    name: 'Rosh Chodesh',
    aka: ['Rosh Hodesh', 'New Month'],
    hebrew: 'ראש חודש',
    title: 'Is There Tachanun on Rosh Chodesh? Dates & Erev RC',
    description: 'No Tachanun on Rosh Chodesh, or at Mincha on Erev Rosh Chodesh. See the next Rosh Chodesh dates and when Tachanun is skipped, according to Chabad custom.',
    question: 'Is there Tachanun on Rosh Chodesh?',
    answer: 'No. Tachanun is not said on Rosh Chodesh, at Shacharis or at Mincha, and it is also left out at Mincha on the afternoon before (Erev Rosh Chodesh).',
    mincha: 'Not said at Mincha of Erev Rosh Chodesh.',
    body: [
      'Rosh Chodesh, the start of each Hebrew month, is a minor festival. The Torah lists the new moons alongside the festivals as times of rejoicing (Bamidbar 10:10), with an added Musaf offering, and in davening we add <em>Yaaleh Veyavo</em>, half Hallel and Musaf. Tachanun, a prayer of contrition, is out of place on such a day.',
      'When the previous month has 30 days, Rosh Chodesh is two days long: the 30th of the old month and the 1st of the new one. Tachanun is omitted on both days.',
      'The festive character of the day reaches back into the afternoon before, so Tachanun is also skipped at Mincha of Erev Rosh Chodesh.',
      'Rosh Chodesh Tishrei is Rosh Hashanah, and Rosh Chodesh Nissan and Rosh Chodesh Sivan fall inside longer stretches with no Tachanun at all. See <a href="/holidays/nissan/">Nissan</a> and <a href="/holidays/shavuos/">Sivan &amp; Shavuos</a>.'
    ],
    match: (hd) => (hd.day === 1 || hd.day === 30) && !(hd.month === 'Tishrei' && hd.day === 1),
    limit: 12,
    related: ['shabbos', 'nissan', 'shavuos', 'chanukah']
  },
  {
    slug: 'shabbos',
    name: 'Shabbos',
    aka: ['Shabbat', 'Sabbath', 'Friday Mincha'],
    hebrew: 'שבת',
    title: 'Is There Tachanun on Shabbos or Friday Mincha?',
    description: 'Tachanun is never said on Shabbos, and Chabad custom also omits it at Mincha on Friday afternoon. Here is how Shabbos interacts with the Tachanun calendar.',
    question: 'Is Tachanun said on Shabbos or at Friday Mincha?',
    answer: 'No. Tachanun is never said on Shabbos, and it is also left out at Mincha on Friday afternoon. Friday Shacharis has Tachanun as usual, unless Friday is itself a no-Tachanun day.',
    mincha: 'Not said at Mincha on Friday.',
    body: [
      'Tachanun belongs to the weekday prayers. Shabbos has its own Shemoneh Esrei, and the confession and pleading of Tachanun do not fit a day of rest and delight.',
      'Following Chabad custom, Tachanun is also left out at Mincha on Friday afternoon, as Shabbos approaches.',
      'When a holiday such as Tu B’Av or Yud Tes Kislev falls on Shabbos, the checker on the home page names Shabbos as the reason. Either way there is no Tachanun.'
    ],
    match: (hd, date) => date.getDay() === 6,
    limit: 4,
    related: ['rosh-chodesh', 'tisha-bav']
  },
  {
    slug: 'rosh-hashanah',
    name: 'Rosh Hashanah',
    aka: ['Rosh Hashana', 'Erev Rosh Hashanah', 'Jewish New Year'],
    hebrew: 'ראש השנה',
    title: 'Tachanun on Erev Rosh Hashanah & Rosh Hashanah',
    description: 'Is there Tachanun on Erev Rosh Hashanah? No. Tachanun is not said on 29 Elul or on Rosh Hashanah itself. Dates for the coming years, according to Chabad custom.',
    question: 'Is there Tachanun on Erev Rosh Hashanah?',
    answer: 'No. Tachanun is not said on Erev Rosh Hashanah (29 Elul) or on the two days of Rosh Hashanah. It is said again from the day after Rosh Hashanah (Tzom Gedaliah) until Erev Yom Kippur.',
    mincha: 'Said as usual at Mincha of 28 Elul (unless it is a Friday).',
    body: [
      'Rosh Hashanah is a Yom Tov, and Tachanun is never said on Yom Tov.',
      'On Erev Rosh Hashanah, the 29th of Elul, the custom recorded by the codifiers (Shulchan Aruch, Orach Chaim 581) is to leave out Tachanun at Shacharis even though Selichos are said early that morning. The day is spent preparing for the new year with confidence that our prayers will be accepted.',
      'Tachanun returns after Rosh Hashanah, through the Aseres Yemei Teshuvah, until 9 Tishrei, Erev Yom Kippur. From then on it is not said for the rest of Tishrei; see <a href="/holidays/yom-kippur/">Yom Kippur</a> and <a href="/holidays/sukkos/">Sukkos</a>.'
    ],
    match: (hd) => (hd.month === 'Elul' && hd.day === 29) || (hd.month === 'Tishrei' && hd.day <= 2),
    limit: 3,
    related: ['yom-kippur', 'sukkos', 'chai-elul']
  },
  {
    slug: 'yom-kippur',
    name: 'Yom Kippur',
    aka: ['Erev Yom Kippur', 'Yom Kipur', 'Day of Atonement'],
    hebrew: 'יום כיפור',
    title: 'Tachanun on Erev Yom Kippur & Yom Kippur (Chabad)',
    description: 'No Tachanun from Erev Yom Kippur (9 Tishrei) through Rosh Chodesh Cheshvan in Chabad custom. See the dates for this year and the coming years.',
    question: 'Is there Tachanun on Erev Yom Kippur?',
    answer: 'No. Tachanun is not said from Erev Yom Kippur (9 Tishrei) onward. In Chabad custom it is then left out for the rest of Tishrei and on Rosh Chodesh Cheshvan.',
    mincha: 'Said as usual at Mincha of 8 Tishrei (unless it is a Friday).',
    body: [
      'Erev Yom Kippur is a day of festive eating, a mitzvah in its own right, and Tachanun is not said. On Yom Kippur itself the day is filled with Vidui (confession), but the Tachanun of the weekday prayers is not said.',
      'The days between Yom Kippur and Sukkos recall the inauguration of the first Beis HaMikdash by King Shlomo, which was celebrated at this time of year (Melachim I 8), and they are busy with building the sukkah and getting the arba minim. Sukkos, Shemini Atzeres, Simchas Torah and Isru Chag follow.',
      'Chabad custom is to leave out Tachanun for this entire stretch, from 9 Tishrei through Rosh Chodesh Cheshvan.'
    ],
    match: (hd) => hd.month === 'Tishrei' && (hd.day === 9 || hd.day === 10),
    limit: 3,
    related: ['sukkos', 'rosh-hashanah', 'rosh-chodesh']
  },
  {
    slug: 'sukkos',
    name: 'Sukkos',
    aka: ['Sukkot', 'Succos', 'Shemini Atzeres', 'Simchas Torah', 'Isru Chag'],
    hebrew: 'סוכות',
    title: 'Tachanun on Sukkos, Simchas Torah & Isru Chag',
    description: 'No Tachanun on Sukkos, Shemini Atzeres, Simchas Torah or Isru Chag. In Chabad custom, Tachanun resumes only after Rosh Chodesh Cheshvan. Dates inside.',
    question: 'When does Tachanun start again after Sukkos?',
    answer: 'Tachanun is not said on Sukkos, Shemini Atzeres, Simchas Torah or Isru Chag. In Chabad custom it is left out until after Rosh Chodesh Cheshvan, and starts again on 2 Cheshvan.',
    mincha: 'Not said: the days before Sukkos are already part of the 9 Tishrei – 1 Cheshvan stretch.',
    body: [
      'Sukkos is <em>zman simchaseinu</em>, the season of our rejoicing. Tachanun is not said on Yom Tov or Chol Hamoed, on Shemini Atzeres and Simchas Torah, or on Isru Chag, the day after the festival.',
      'Following Chabad custom, Tachanun is not said at all from Erev Yom Kippur (9 Tishrei) through Rosh Chodesh Cheshvan. The first weekday Tachanun after the holidays is on 2 Cheshvan.',
      'The other two festivals work the same way: there is no Tachanun all of <a href="/holidays/nissan/">Nissan</a> (Pesach) and from Rosh Chodesh Sivan through 12 Sivan (<a href="/holidays/shavuos/">Shavuos</a>).'
    ],
    match: (hd) => hd.month === 'Tishrei' && hd.day >= 15 && hd.day <= 23,
    limit: 3,
    related: ['yom-kippur', 'rosh-chodesh', 'nissan', 'shavuos']
  },
  {
    slug: 'yud-kislev',
    name: 'Yud Kislev',
    aka: ['10 Kislev', 'Chag HaGeulah of the Mitteler Rebbe'],
    hebrew: 'י׳ כסלו',
    title: 'Tachanun on Yud Kislev (10 Kislev) – Chabad',
    description: 'Chabad custom omits Tachanun on Yud Kislev, the liberation day of the Mitteler Rebbe, and at Mincha on 9 Kislev. Upcoming dates for 10 Kislev.',
    question: 'Is there Tachanun on Yud Kislev?',
    answer: 'No, according to Chabad custom. Tachanun is not said on 10 Kislev, or at Mincha on the afternoon before (9 Kislev).',
    mincha: 'Not said at Mincha of 9 Kislev.',
    body: [
      'Yud Kislev is the Chag HaGeulah, the festival of liberation, of the Mitteler Rebbe, Rabbi DovBer of Lubavitch, the second Chabad Rebbe. He was arrested on false charges and freed on 10 Kislev 5587 (1826).',
      'The day before, 9 Kislev, is both his birthday and the day of his passing. Chassidim celebrate Yud Kislev with farbrengens, and Tachanun is left out from Mincha of 9 Kislev.',
      'A week and a half later comes <a href="/holidays/yud-tes-kislev/">Yud Tes Kislev</a>, followed by <a href="/holidays/chanukah/">Chanukah</a>.'
    ],
    match: (hd) => hd.month === 'Kislev' && hd.day === 10,
    limit: 3,
    chabad: true,
    related: ['yud-tes-kislev', 'chanukah', 'yud-beis-tammuz']
  },
  {
    slug: 'yud-tes-kislev',
    name: 'Yud Tes Kislev',
    aka: ['19 Kislev', 'Chof Kislev', '20 Kislev', 'Rosh Hashanah of Chassidus'],
    hebrew: 'י״ט כסלו',
    title: 'Tachanun on Yud Tes Kislev & Chof Kislev – Chabad',
    description: 'No Tachanun on Yud Tes Kislev and Chof Kislev (19–20 Kislev) in Chabad custom, or at Mincha on 18 Kislev. Upcoming dates for the Rosh Hashanah of Chassidus.',
    question: 'Is there Tachanun on Yud Tes Kislev?',
    answer: 'No, according to Chabad custom. Tachanun is not said on 19 Kislev or 20 Kislev (Chof Kislev), or at Mincha on 18 Kislev.',
    mincha: 'Not said at Mincha of 18 Kislev.',
    body: [
      'Yud Tes Kislev, the 19th of Kislev, is the day in 5559 (1798) when the Alter Rebbe, Rabbi Schneur Zalman of Liadi, the founder of Chabad, was freed from imprisonment in Petersburg. It is called the Rosh Hashanah of Chassidus. It is also the day of passing of the Maggid of Mezritch, the Alter Rebbe’s teacher.',
      'The celebration continues on Chof Kislev, the 20th, and Tachanun is left out on both days, as well as at Mincha on the afternoon of 18 Kislev.',
      'Chassidim mark these days with farbrengens and by completing the study of the Talmud, divided among the community, in the <em>Chalukas HaShas</em>.'
    ],
    match: (hd) => hd.month === 'Kislev' && (hd.day === 19 || hd.day === 20),
    limit: 3,
    chabad: true,
    related: ['yud-kislev', 'chanukah', 'yud-beis-tammuz']
  },
  {
    slug: 'chanukah',
    name: 'Chanukah',
    aka: ['Hanukkah', 'Hanukah', 'Chanuka', 'Erev Chanukah'],
    hebrew: 'חנוכה',
    title: 'Is There Tachanun on Chanukah? Dates & Erev Chanukah',
    description: 'No Tachanun during all eight days of Chanukah, and none at Mincha on Erev Chanukah (24 Kislev). Upcoming Chanukah dates, according to Chabad custom.',
    question: 'Is there Tachanun on Chanukah?',
    answer: 'No. Tachanun is not said on any of the eight days of Chanukah, and it is also left out at Mincha on Erev Chanukah (24 Kislev).',
    mincha: 'Not said at Mincha of 24 Kislev (Erev Chanukah).',
    body: [
      'Chanukah celebrates the victory of the Chashmona’im and the miracle of the oil. Its eight days, from 25 Kislev, were set aside “for thanks and praise”: full Hallel is said every day and <em>Al HaNissim</em> is added. Tachanun, a prayer of contrition, is not said.',
      'The joy of the festival begins in the afternoon before, so Tachanun is also left out at Mincha on 24 Kislev.',
      'Rosh Chodesh Teves always falls during Chanukah, so on one or two of these days there is also Rosh Chodesh. When Kislev has 30 days, Chanukah ends on 2 Teves; when it has 29, on 3 Teves.'
    ],
    match: (hd, date) => T.isChanukah(hd, date),
    limit: 3,
    related: ['yud-tes-kislev', 'rosh-chodesh', 'hei-teves', 'purim']
  },
  {
    slug: 'hei-teves',
    name: 'Hei Teves',
    aka: ['5 Teves', 'Didan Notzach'],
    hebrew: 'ה׳ טבת',
    title: 'Tachanun on Hei Teves (Didan Notzach) – Chabad',
    description: 'Is Tachanun said on Hei Teves (5 Teves), Didan Notzach? The public Chabad custom is to say Tachanun. Upcoming dates and the background.',
    question: 'Is there Tachanun on Hei Teves?',
    answer: 'Yes. The public custom is to say Tachanun on 5 Teves, though a person who truly feels exceptional joy may have a personal practice.',
    mincha: 'Said as usual at Mincha of 4 Teves; the checker marks it with an asterisk.',
    body: [
      'Hei Teves (5 Teves) marks the victory known as <em>Didan Notzach</em> (“our side has won”). On this day in 5747 (1987) a US federal court ruled that the library of the previous Rebbe belongs to Agudas Chassidei Chabad, and not to any individual.',
      'It is celebrated as a day of joy in Chabad. Even so, the public custom is to say Tachanun, and the checker marks the day with an asterisk to show that individual practice varies.'
    ],
    match: (hd) => hd.month === 'Tevet' && hd.day === 5,
    limit: 3,
    chabad: true,
    varies: true,
    related: ['chanukah', 'gimmel-tammuz', 'chai-elul']
  },
  {
    slug: 'tu-bishvat',
    name: 'Tu B’Shevat',
    aka: ['Tu BiShvat', 'Tu B’Shvat', '15 Shevat', 'New Year for Trees'],
    hebrew: 'ט״ו בשבט',
    title: 'Is There Tachanun on Tu B’Shevat? Dates & Mincha',
    description: 'No Tachanun on Tu B’Shevat (15 Shevat), the Rosh Hashanah for trees, or at Mincha on 14 Shevat. Upcoming Tu BiShvat dates, according to Chabad custom.',
    question: 'Is there Tachanun on Tu B’Shevat?',
    answer: 'No. Tachanun is not said on Tu B’Shevat (15 Shevat), and it is also left out at Mincha on the afternoon before.',
    mincha: 'Not said at Mincha of 14 Shevat.',
    body: [
      'The Mishnah (Rosh Hashanah 1:1) teaches that the 15th of Shevat is the Rosh Hashanah, the new year, for trees. It is a festive day, customarily marked by eating fruit, especially the fruits for which the Land of Israel is praised.',
      'Tachanun is not said on Tu B’Shevat, and it is also left out at Mincha on 14 Shevat.'
    ],
    match: (hd) => hd.month === 'Shevat' && hd.day === 15,
    limit: 3,
    related: ['tu-bav', 'purim', 'rosh-chodesh']
  },
  {
    slug: 'purim',
    name: 'Purim',
    aka: ['Shushan Purim', 'Purim Katan', 'Erev Purim', 'Taanis Esther'],
    hebrew: 'פורים',
    title: 'Is There Tachanun on Purim, Shushan Purim & Purim Katan?',
    description: 'No Tachanun on Purim and Shushan Purim (14–15 Adar), at Mincha on 13 Adar, or on Purim Katan in a leap year. Upcoming Purim dates, according to Chabad custom.',
    question: 'Is there Tachanun on Purim?',
    answer: 'No. Tachanun is not said on Purim (14 Adar) or Shushan Purim (15 Adar), and it is left out at Mincha on 13 Adar, the Fast of Esther. In a leap year it is also not said on Purim Katan and Shushan Purim Katan (14–15 Adar I).',
    mincha: 'Not said at Mincha of 13 Adar (Taanis Esther).',
    body: [
      'Purim celebrates the salvation of the Jewish people in the days of Mordechai and Esther. The Megillah calls the 14th and 15th of Adar “days of feasting and joy” (Esther 9:22), and Tachanun is not said on either day, wherever one lives.',
      'Tachanun is also left out at Mincha on 13 Adar, the afternoon of Taanis Esther, as Purim approaches.',
      'In a Jewish leap year, Purim is celebrated in Adar II. The 14th and 15th of Adar I are Purim Katan and Shushan Purim Katan; there is no Megillah reading, but Tachanun is not said.'
    ],
    match: (hd) => (isAdar(hd.month) || hd.month === 'Adar I') && (hd.day === 14 || hd.day === 15),
    limit: 4,
    related: ['nissan', 'tu-bishvat', 'chanukah']
  },
  {
    slug: 'nissan',
    name: 'Nissan',
    aka: ['Nisan', 'Pesach', 'Passover', 'Erev Pesach', 'Isru Chag Pesach'],
    hebrew: 'ניסן',
    title: 'Is There Tachanun in Nissan? No Tachanun All Month',
    description: 'Tachanun is not said for the entire month of Nissan, including Pesach and Isru Chag, or at Mincha before Rosh Chodesh Nissan. Dates for the coming years.',
    question: 'Is Tachanun said in the month of Nissan?',
    answer: 'No. Tachanun is not said for the entire month of Nissan, from Rosh Chodesh through the end of the month, including Pesach and Isru Chag. It is also left out at Mincha on the afternoon before Rosh Chodesh Nissan.',
    mincha: 'Not said at Mincha on Erev Rosh Chodesh Nissan.',
    body: [
      'On each of the first twelve days of Nissan, when the Mishkan was dedicated, the Nasi (prince) of one tribe brought his offering, and that day was a festival for his tribe. Then come Erev Pesach, the seven days of Pesach and Isru Chag.',
      'Since most of the month is festive, the whole of Nissan is treated as a time of joy (Shulchan Aruch, Orach Chaim 429:2), and Tachanun is not said all month.',
      'Tachanun is first said again on 2 Iyar, since 1 Iyar is itself Rosh Chodesh. Later in Iyar it is also left out on <a href="/holidays/pesach-sheni/">Pesach Sheni</a> and <a href="/holidays/lag-baomer/">Lag BaOmer</a>.'
    ],
    match: (hd) => hd.month === 'Nisan',
    limit: 3,
    related: ['pesach-sheni', 'lag-baomer', 'purim', 'shavuos']
  },
  {
    slug: 'pesach-sheni',
    name: 'Pesach Sheni',
    aka: ['14 Iyar', 'Second Passover'],
    hebrew: 'פסח שני',
    title: 'Is There Tachanun on Pesach Sheni (14 Iyar)?',
    description: 'No Tachanun on Pesach Sheni, 14 Iyar, according to Chabad custom. Upcoming dates and the meaning of the “second Pesach”.',
    question: 'Is there Tachanun on Pesach Sheni?',
    answer: 'No. Tachanun is not said on Pesach Sheni (14 Iyar). It is said as usual at Mincha the afternoon before.',
    mincha: 'Said as usual at Mincha of 13 Iyar (unless it is a Friday).',
    body: [
      'Pesach Sheni, the “second Pesach”, was the day when anyone who had been unable to bring the Pesach offering in Nissan could bring it a month later (Bamidbar 9:1–14). The Rebbe often drew from it the lesson that “it is never too late”: one can always make up for what was missed.',
      'Tachanun is not said on Pesach Sheni. It is customary to eat matzah on this day.'
    ],
    match: (hd) => hd.month === 'Iyar' && hd.day === 14,
    limit: 3,
    related: ['lag-baomer', 'nissan', 'shavuos']
  },
  {
    slug: 'lag-baomer',
    name: 'Lag BaOmer',
    aka: ['Lag B’Omer', 'Lag Baomer', '18 Iyar'],
    hebrew: 'ל״ג בעומר',
    title: 'Is There Tachanun on Lag BaOmer? Dates & Mincha',
    description: 'No Tachanun on Lag BaOmer (18 Iyar), or at Mincha on 17 Iyar, the afternoon before. Upcoming Lag BaOmer dates, according to Chabad custom.',
    question: 'Is there Tachanun on Lag BaOmer?',
    answer: 'No. Tachanun is not said on Lag BaOmer (18 Iyar), and it is also left out at Mincha on the afternoon before (17 Iyar).',
    mincha: 'Not said at Mincha of 17 Iyar.',
    body: [
      'Lag BaOmer, the 33rd day of the Omer, is the hilula of Rabbi Shimon bar Yochai, author of the Zohar, who asked that the day of his passing be celebrated with joy. It is also the day on which the plague among Rabbi Akiva’s students came to an end.',
      'It is a day of celebration in the middle of the Sefirah period, marked with parades, bonfires and outings. Tachanun is not said, and it is left out at Mincha the afternoon before.'
    ],
    match: (hd) => hd.month === 'Iyar' && hd.day === 18,
    limit: 3,
    related: ['pesach-sheni', 'shavuos', 'nissan']
  },
  {
    slug: 'shavuos',
    name: 'Shavuos',
    aka: ['Shavuot', 'Sivan', 'Rosh Chodesh Sivan', 'Isru Chag Shavuos', '12 Sivan'],
    hebrew: 'שבועות',
    title: 'Tachanun in Sivan: Shavuos Through 12 Sivan (Chabad)',
    description: 'No Tachanun from Rosh Chodesh Sivan through 12 Sivan, including Shavuos and Isru Chag. When Tachanun resumes after Shavuos, and upcoming dates.',
    question: 'When is Tachanun said again after Shavuos?',
    answer: 'Tachanun is not said from Rosh Chodesh Sivan through 12 Sivan, including Shavuos and Isru Chag. It is said again from 13 Sivan. It is also left out at Mincha on Erev Rosh Chodesh Sivan.',
    mincha: 'Not said at Mincha on Erev Rosh Chodesh Sivan (29 Iyar).',
    body: [
      'The days leading up to Shavuos are days of preparation for receiving the Torah: Rosh Chodesh Sivan, 2 Sivan (<em>Yom HaMeyuchas</em>) and the three days of <em>hagbalah</em>, when the people prepared themselves at Mount Sinai. Shavuos falls on 6–7 Sivan (in the Diaspora) and 8 Sivan is Isru Chag.',
      'In the time of the Beis HaMikdash, the festival offerings of Shavuos could be brought during the seven days after it, through 12 Sivan. Following Chabad custom, Tachanun is not said from Rosh Chodesh Sivan through 12 Sivan, and it returns on 13 Sivan.'
    ],
    match: (hd) => hd.month === 'Sivan' && hd.day <= 12,
    limit: 3,
    related: ['lag-baomer', 'nissan', 'sukkos', 'gimmel-tammuz']
  },
  {
    slug: 'gimmel-tammuz',
    name: 'Gimmel Tammuz',
    aka: ['3 Tammuz', 'Gimel Tamuz'],
    hebrew: 'ג׳ תמוז',
    title: 'Is There Tachanun on Gimmel Tammuz (3 Tammuz)?',
    description: 'Is Tachanun said on Gimmel Tammuz? The public custom is to say Tachanun, though some omit it privately. Upcoming dates and background.',
    question: 'Is there Tachanun on Gimmel Tammuz?',
    answer: 'Yes. The public custom is generally to say Tachanun on 3 Tammuz, though some individuals may omit it privately.',
    mincha: 'Said as usual at Mincha of 2 Tammuz; the checker marks it with an asterisk.',
    body: [
      'On 3 Tammuz 5687 (1927), the death sentence against the previous Rebbe, Rabbi Yosef Yitzchak Schneersohn, was commuted to exile, the first step of his liberation, which was completed on <a href="/holidays/yud-beis-tammuz/">Yud Beis–Yud Gimmel Tammuz</a>. Gimmel Tammuz is also the day of the Rebbe’s passing in 5754 (1994).',
      'Tachanun is omitted on days when a special joy is felt. The public custom on 3 Tammuz is generally to say Tachanun, though some individuals may leave it out privately for personal reasons. The checker marks the day with an asterisk for this reason.'
    ],
    match: (hd) => hd.month === 'Tammuz' && hd.day === 3,
    limit: 3,
    chabad: true,
    varies: true,
    related: ['yud-beis-tammuz', 'chai-elul', 'hei-teves']
  },
  {
    slug: 'yud-beis-tammuz',
    name: 'Yud Beis Tammuz',
    aka: ['12 Tammuz', 'Yud Gimmel Tammuz', '13 Tammuz', 'Chag HaGeulah'],
    hebrew: 'י״ב–י״ג תמוז',
    title: 'Tachanun on Yud Beis & Yud Gimmel Tammuz – Chabad',
    description: 'No Tachanun on Yud Beis and Yud Gimmel Tammuz (12–13 Tammuz) in Chabad custom, or at Mincha on 11 Tammuz. Upcoming dates for the Chag HaGeulah.',
    question: 'Is there Tachanun on Yud Beis Tammuz?',
    answer: 'No, according to Chabad custom. Tachanun is not said on 12 or 13 Tammuz, or at Mincha on the afternoon of 11 Tammuz.',
    mincha: 'Not said at Mincha of 11 Tammuz.',
    body: [
      'Yud Beis Tammuz (12 Tammuz) is the birthday of the previous Rebbe, Rabbi Yosef Yitzchak Schneersohn, and the day in 5687 (1927) on which he was told he would be freed from his Soviet exile. The release took effect on Yud Gimmel Tammuz, the 13th.',
      'The Rebbe himself declared the day a Chag HaGeulah, a festival of liberation, not only for him but for everyone who cherishes Torah. Tachanun is not said on either day, or at Mincha the afternoon before.'
    ],
    match: (hd) => hd.month === 'Tammuz' && (hd.day === 12 || hd.day === 13),
    limit: 3,
    chabad: true,
    related: ['gimmel-tammuz', 'yud-tes-kislev', 'yud-kislev']
  },
  {
    slug: 'tisha-bav',
    name: 'Tisha B’Av',
    aka: ['Tisha BeAv', '9 Av', 'Erev Tisha B’Av', 'Tisha B’Av nidche'],
    hebrew: 'תשעה באב',
    title: 'Is There Tachanun on Tisha B’Av? Why Not & Dates',
    description: 'Tachanun is not said on Tisha B’Av or at Mincha on Erev Tisha B’Av, because the day is called a “mo’ed”. Upcoming Tisha B’Av dates, according to Chabad custom.',
    question: 'Is there Tachanun on Tisha B’Av?',
    answer: 'No. Although Tisha B’Av is a day of mourning, Tachanun is not said on it, and it is also left out at Mincha on Erev Tisha B’Av (8 Av).',
    mincha: 'Not said at Mincha of 8 Av.',
    body: [
      'Tisha B’Av, the 9th of Av, mourns the destruction of both Batei HaMikdash. It may seem surprising that Tachanun is not said on the saddest day of the year.',
      'The reason is that Megillas Eichah (1:15) calls this day a <em>mo’ed</em>, a festival. Tisha B’Av is destined to become a day of rejoicing with the coming of Moshiach, and that inner festive quality is already reflected now in leaving out Tachanun.',
      'Tachanun is also left out at Mincha on 8 Av, the afternoon before.',
      'When 9 Av falls on Shabbos, the fast is postponed to Sunday, 10 Av (<em>nidche</em>), and the Tisha B’Av rules move with it: there is no Tachanun on that Sunday. Mincha the afternoon before is on Shabbos, when Tachanun is not said in any case.'
    ],
    match: (hd, date) => T.isTishaBav(hd, date),
    limit: 3,
    related: ['tu-bav', 'yud-beis-tammuz', 'shabbos']
  },
  {
    slug: 'tu-bav',
    name: 'Tu B’Av',
    aka: ['Tu BeAv', '15 Av', '15th of Av'],
    hebrew: 'ט״ו באב',
    title: 'Is There Tachanun on Tu B’Av (15 Av)? Dates',
    description: 'No Tachanun on Tu B’Av (15 Av), or at Mincha on 14 Av. Upcoming Tu B’Av dates, according to Chabad custom.',
    question: 'Is there Tachanun on Tu B’Av?',
    answer: 'No. Tachanun is not said on Tu B’Av (15 Av), and it is also left out at Mincha on the afternoon before (14 Av).',
    mincha: 'Not said at Mincha of 14 Av.',
    body: [
      'The Mishnah teaches that “there were no days as festive for Israel as the 15th of Av and Yom Kippur” (Taanis 4:8). Several joyous events in Jewish history are linked to this day, including the end of the decree that kept the generation of the desert from entering the Land.',
      'Tachanun is not said on Tu B’Av, and it is also left out at Mincha on 14 Av.'
    ],
    match: (hd) => hd.month === 'Av' && hd.day === 15,
    limit: 3,
    related: ['tisha-bav', 'tu-bishvat', 'chai-elul']
  },
  {
    slug: 'chai-elul',
    name: 'Chai Elul',
    aka: ['18 Elul', 'Chai Elul'],
    hebrew: 'ח״י אלול',
    title: 'Is There Tachanun on Chai Elul (18 Elul)?',
    description: 'Is Tachanun said on Chai Elul? Some mention omitting it, but in the Rebbe’s minyan Tachanun was said. Upcoming 18 Elul dates and background.',
    question: 'Is there Tachanun on Chai Elul?',
    answer: 'Yes. Some mention omitting Tachanun on 18 Elul, but in the Rebbe’s minyan it was said as usual.',
    mincha: 'Said as usual at Mincha of 17 Elul; the checker marks it with an asterisk.',
    body: [
      'Chai Elul, the 18th of Elul, is the birthday of the Baal Shem Tov, the founder of Chassidus (5458 / 1698), and of the Alter Rebbe, the founder of Chabad (5505 / 1745). It is often called the day that brings “life” (<em>chai</em>) into the month of Elul.',
      'Some sources mention leaving out Tachanun on this day, but in the Rebbe’s minyan Tachanun was said. The checker marks the day with an asterisk.'
    ],
    match: (hd) => hd.month === 'Elul' && hd.day === 18,
    limit: 3,
    chabad: true,
    varies: true,
    related: ['rosh-hashanah', 'gimmel-tammuz', 'hei-teves']
  }
];

/* -------------------------------------------------------------------------- */

const GUIDE = {
  title: 'What Is Tachanun? When It’s Said and Skipped | תחנון',
  description: 'A guide to Tachanun (תחנון): what it is, where it comes in Shacharis and Mincha, why it is left out on festive days, Mincha the day before, and Chabad custom.',
  sections: [
    {
      id: 'what',
      heading: 'What is Tachanun?',
      html: [
        '<p><strong>Tachanun</strong> (<span lang="he">תחנון</span>, “supplication”) is a prayer of confession and pleading said after the Amidah (Shemoneh Esrei) at Shacharis and Mincha on ordinary weekdays. Its heart is <strong>Nefilas Apayim</strong> (<span lang="he">נפילת אפים</span>), “falling on the face”: sitting and resting one’s head on the arm while saying a psalm of supplication, as Moshe and Aharon fell on their faces in prayer.</p>',
        '<p>In Nusach Chabad (Nusach Ari), Tachanun begins with <em>Vidui</em> (Ashamnu) and the Thirteen Attributes of Mercy, followed by Nefilas Apayim with Psalm 6, and ends with <em>Shomer Yisrael</em>. On Mondays and Thursdays the longer passage <em>Vehu Rachum</em> is added at Shacharis.</p>'
      ]
    },
    {
      id: 'when',
      heading: 'When is Tachanun said?',
      html: [
        '<p>Tachanun is said at <strong>Shacharis</strong> and <strong>Mincha</strong> on weekdays. It is never said at Maariv, and never on Shabbos or Yom Tov.</p>',
        '<p>Because Tachanun is a prayer of contrition, it is left out on days with a festive character. These include Rosh Chodesh, Chanukah, Purim, Tu B’Shevat, the whole month of Nissan, Lag BaOmer, the first days of Sivan, Tisha B’Av, Tu B’Av and most of Tishrei. Chabad custom adds the Chassidic festivals of liberation: Yud Kislev, Yud Tes Kislev and Chof Kislev, and Yud Beis–Yud Gimmel Tammuz.</p>',
        '<p>See every occasion and its next date on the <a href="/holidays/">holidays page</a>, or the full list for a year in the <a href="/tachanun-calendar/">Tachanun calendar</a>.</p>'
      ]
    },
    {
      id: 'mincha',
      heading: 'Mincha the day before',
      html: [
        '<p>For many of these days, the joy reaches back to the afternoon before, so Tachanun is also left out at <strong>Mincha of the previous day</strong>. Examples are Erev Rosh Chodesh, Erev Chanukah (24 Kislev), 13 Adar before Purim, 14 Shevat, 17 Iyar before Lag BaOmer, 8 Av and 14 Av.</p>',
        '<p>In Chabad custom, Tachanun is also left out at <strong>Mincha on Friday</strong> afternoon.</p>'
      ]
    },
    {
      id: 'other',
      heading: 'Other times Tachanun is not said',
      html: [
        '<p>Some reasons to leave out Tachanun depend on who is present, not on the date. For example, it is not said in a house of mourning during shiva, when a chassan during his week of sheva brachos is in the minyan, or when the father, sandek or mohel of a bris that day is present. Ask your Rav about any particular case.</p>',
        '<p>On days without Tachanun, the related passages are usually left out too: <em>Lamnatzeach</em> (Psalm 20) after Ashrei at Shacharis, and on Mondays and Thursdays <em>Kel Erech Apayim</em> before the Torah reading.</p>'
      ]
    },
    {
      id: 'shema',
      heading: 'Krias Shema al HaMitah (the bedtime Shema)',
      html: [
        '<p>The bedtime Shema follows the same calendar. On a night before a day without Tachanun, part of it is skipped, while <em>Ribono Shel Olam</em> and <em>Lamnatzeach Mizmor L’Dovid</em> are still said. On the night after a no-Tachanun day, the omission lasts until halachic midnight (chatzos).</p>',
        '<p>The <a href="/">checker</a> shows tonight’s answer in the Shema box, using the halachic times for your location.</p>'
      ]
    },
    {
      id: 'chabad',
      heading: 'Chabad custom and other communities',
      html: [
        '<p>This site follows Chabad-Lubavitch custom, based on <a href="https://www.chabad.org/library/article_cdo/aid/5776805/jewish/Tachanun.htm" target="_blank" rel="noopener">Chabad.org</a> and <a href="https://shulchanaruchharav.com/halacha/chapter-31-tachanun/" target="_blank" rel="noopener">Shulchan Aruch HaRav</a>. Most of the dates are shared by every community. The main Chabad additions are the Chassidic festivals and the longer stretches in Tishrei (9 Tishrei through Rosh Chodesh Cheshvan) and Sivan (through 12 Sivan).</p>',
        '<p>It follows the Diaspora calendar and does not include Eretz Yisrael-specific days or Yom Ha’atzmaut and Yom Yerushalayim, which some communities observe. It is a tool for checking the schedule, not a replacement for a Luach or a Rav.</p>'
      ]
    }
  ]
};

/* -------------------------------------------------------------------------- */

const FAQ = {
  title: 'Tachanun FAQ: Common Questions Answered | תחנון',
  description: 'Answers to common questions about Tachanun: Maariv, Friday Mincha, a bris, a chassan, a house of mourning, Chabad custom, and how the checker works.',
  items: [
    {
      q: 'Is there Tachanun today?',
      a: '<p>The <a href="/">home page</a> answers this for today’s Shacharis, Mincha and bedtime Shema, using the halachic times for your location. You can also check any other date there.</p>'
    },
    {
      q: 'What is Tachanun?',
      a: '<p>Tachanun (<span lang="he">תחנון</span>) is a prayer of confession and supplication said after the Amidah at Shacharis and Mincha on ordinary weekdays. Its central part is Nefilas Apayim, “falling on the face”. Read more in <a href="/what-is-tachanun/">What is Tachanun?</a></p>'
    },
    {
      q: 'Why is Tachanun not said on certain days?',
      a: '<p>Tachanun is a prayer of contrition, so it is left out on days with a festive character, such as Rosh Chodesh, Chanukah, Purim and the whole month of Nissan. See <a href="/holidays/">all the occasions</a>.</p>'
    },
    {
      q: 'Is Tachanun said at Mincha the day before a holiday?',
      a: '<p>For many occasions, no: Tachanun is left out at Mincha the afternoon before, for example on Erev Rosh Chodesh, Erev Chanukah, and the afternoon before Lag BaOmer. For others, such as Erev Rosh Hashanah and Pesach Sheni, Mincha the day before has Tachanun as usual. Each <a href="/holidays/">holiday page</a> says which.</p>'
    },
    {
      q: 'Is Tachanun said at Maariv?',
      a: '<p>No. Tachanun is said only at Shacharis and Mincha. Part of the bedtime Shema follows the Tachanun calendar, and the checker shows tonight’s answer for it.</p>'
    },
    {
      q: 'Is Tachanun said on Friday?',
      a: '<p>At Shacharis on Friday, yes, unless Friday is itself a no-Tachanun day. At Mincha on Friday afternoon, Chabad custom is not to say Tachanun. It is never said on <a href="/holidays/shabbos/">Shabbos</a>.</p>'
    },
    {
      q: 'Is Tachanun said in a house of mourning?',
      a: '<p>No. Tachanun is not said when davening in a shiva house. Ask your Rav about any particular situation.</p>'
    },
    {
      q: 'Is Tachanun said when a chassan or a bris is in shul?',
      a: '<p>Tachanun is not said when a chassan during his week of sheva brachos is in the minyan, or when the father, sandek or mohel of a bris taking place that day is present. These depend on who is there, so the checker cannot show them.</p>'
    },
    {
      q: 'How is Chabad custom different?',
      a: '<p>Chabad omits Tachanun on the Chassidic festivals (Yud Kislev, Yud Tes and Chof Kislev, Yud Beis and Yud Gimmel Tammuz), from 9 Tishrei through Rosh Chodesh Cheshvan, and from Rosh Chodesh Sivan through 12 Sivan. On Gimmel Tammuz, Chai Elul and Hei Teves the public custom is to say Tachanun, and the checker marks these days with an asterisk.</p>'
    },
    {
      q: 'Does the site include Yom Ha’atzmaut or Eretz Yisrael dates?',
      a: '<p>No. It follows the fixed-date Chabad omissions for the Diaspora, and does not include Yom Ha’atzmaut, Yom Yerushalayim or other Eretz Yisrael-specific days.</p>'
    },
    {
      q: 'When does the answer switch to tomorrow?',
      a: '<p>The Shacharis and Mincha boxes switch to the next day at nightfall (tzeis hakochavim). The Hebrew date turns over at sunset. The Shema box shows the current night from nightfall until dawn. Times follow Chabad.org’s opinions for your location.</p>'
    },
    {
      q: 'Can I see a whole year at once?',
      a: '<p>Yes. The <a href="/tachanun-calendar/">Tachanun calendar</a> lists every day in a year with no Tachanun, with English and Hebrew dates. Developers can use the free <a href="/feed/latest.json">JSON feed</a> (CC BY-NC 4.0).</p>'
    },
    {
      q: 'Can I install it as an app, or show it in shul?',
      a: '<p>Yes. On your phone, use “Add to Home Screen” to install it as an app. For a screen in shul, open <a href="/kiosk">istheretachanun.com/kiosk</a> for a full-screen portrait display; add <code>?city=Crown Heights</code> (or any city) to fix the location.</p>'
    },
    {
      q: 'I found a mistake. How do I report it?',
      a: '<p>Please email <a href="mailto:tachanun@totalis.one">tachanun@totalis.one</a>. This site is a tool to help with the schedule and does not replace a Luach or a Rav.</p>'
    }
  ]
};

module.exports = { OCCASIONS, GUIDE, FAQ };
