// Data file for omission dates and notes
window.OMISSIONS = {
  omissionRules: [
    { label: 'Shabbos, beginning from Friday Mincha.' },
    { label: 'Rosh Chodesh, beginning from Mincha of the day before.' },
    { label: 'Rosh Hashanah.' },
    { label: 'From 9 Tishrei through 2 Cheshvan.' },
    { label: 'Chanukah, beginning from 24 Kislev at Mincha through the end of Chanukah.' },
    { label: '15 Shevat, beginning from the afternoon before.' },
    { label: 'From 13 Adar at Mincha through 15 Adar.' },
    { label: 'Entire month of Nisan.' },
    { label: 'Issru Chag after Pesach, Shavuos, and Sukkot.' },
    { label: '14 Iyar, Pesach Sheni.' },
    { label: '18 Iyar, Lag BaOmer, beginning from the afternoon before.' },
    { label: 'Shavuos (Sivan 6-7).' },
    { label: '9 Av, beginning from the afternoon before.' },
    { label: '15 Av, beginning from the afternoon before.' },
    { label: '29 Elul.' },
    { label: '10 Kislev, beginning from the afternoon before.', chabadCustom: true },
    { label: 'Yud Tes Kislev, beginning from the afternoon before.', chabadCustom: true },
    { label: 'Chof Kislev, beginning from the afternoon before.', chabadCustom: true },
    { label: 'Yud Beis Tammuz, beginning from the afternoon before.', chabadCustom: true }
  ],
  variesNotes: [
    '<li><strong>3 Tammuz:</strong> Public custom is generally to say Tachanun, though some individuals who feel significant joy may omit privately.</li>',
    '<li><strong>18 Elul:</strong> Some mention omitting Tachanun, but in the Rebbe’s minyan Tachanun was said.</li>',
    '<li><strong>5 Teves:</strong> Public custom is generally to say Tachanun, though a person who truly feels exceptional joy may have a personal practice.</li>'
  ],
  variesRules: {
    'Tammuz-3': 'Public custom generally says Tachanun; some individuals who feel exceptional joy may omit privately.',
    'Elul-18': 'Some mention omitting Tachanun, but in the Rebbe’s minyan it was said as usual.',
    'Tevet-5': 'Public custom generally says Tachanun; some individuals may personally omit if they truly feel exceptional joy.'
  },
  dateNames: {
    'Kislev-19': 'Yud Tes Kislev',
    'Kislev-20': 'Chof Kislev',
    'Tammuz-12': 'Yud Beis Tammuz'
  }
};
