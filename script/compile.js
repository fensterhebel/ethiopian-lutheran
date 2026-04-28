const { readFileSync, writeFileSync } = require('fs')

// for (let year = 2025; year <= 2030; year++) {
//   const data = JSON.parse(readFileSync(`data/builder${year}.json`))
//   for (const item of data) {
//     console.log(item.attributes.name)
//   }
// }

const transl = readFileSync(`Translations.tsv`).toString().trim().split('\r\n').map(line => line.split('\t'))
const verses = readFileSync(`DailyVerses.tsv`).toString().trim().split('\r\n').map(line => line.split('\t'))

const tsv_langs = transl.shift()
function getTrans (id, lang) {
  const col = tsv_langs.indexOf(lang)
  const row = transl.find(row => row[0] === id)
  if (!row) {
    console.error(`dictionary key "${id}" not found!`)
    return ''
  }
  return row[col]
}

const TYPOGRAPHY = ['chapter_verse', 'verse_span', 'verse_list', 'chapter_list', 'chapter_span']
const BOOKS = ['GEN', 'EXO', 'LEV', 'NUM', 'DEU', 'JOS', 'JDG', 'RUT', '1SA', '2SA', '1KI', '2KI', '1CH', '2CH', 'EZR', 'NEH', 'EST', 'JOB', 'PSA', 'PRO', 'ECC', 'SNG', 'ISA', 'JER', 'LAM', 'EZK', 'DAN', 'HOS', 'JOL', 'AMO', 'OBA', 'JON', 'MIC', 'NAM', 'HAB', 'ZEP', 'HAG', 'ZEC', 'MAL', 'MAT', 'MRK', 'LUK', 'JHN', 'ACT', 'ROM', '1CO', '2CO', 'GAL', 'EPH', 'PHP', 'COL', '1TH', '2TH', '1TI', '2TI', 'TIT', 'PHM', 'HEB', 'JAS', '1PE', '2PE', '1JN', '2JN', '3JN', 'JUD', 'REV']
const languages = ['amh', 'eng']
const dictionary = {}
for (const lang of languages) {
  dictionary[lang] = {
    holidays: {},
    themes: {},
    prayers: {},
    readings: ['ot', 'epistle', 'gospel'].map(key => getTrans('reading_' + key, lang)),
    books: Object.fromEntries(BOOKS.map(key => [key, getTrans(key, lang)])),
    books_abbr: Object.fromEntries(BOOKS.map(key => [key, getTrans(key + '_short', lang)])),
    typography: Object.fromEntries(TYPOGRAPHY.map(key => [key, getTrans(key, lang)]))
  }
}

const holidays = {}
for (const row of verses.slice(1)) {
  const id = row.shift()
  const color = row.pop()
  const hasPrayer = !!getTrans(id + '_prayer', 'eng')
  const readings = row.map(series => series.split(' / '))
  for (const lang of languages) {
    dictionary[lang].holidays[id] = getTrans(id, lang)
    dictionary[lang].themes[id] = getTrans(id + '_theme', lang)
    if (!hasPrayer) continue
    dictionary[lang].prayers[id] = getTrans(id + '_prayer', lang)
  }
  holidays[id] = { color, hasPrayer, readings }
}

writeFileSync('../observances.json', JSON.stringify(holidays, null, 2))
for (const lang of languages) {
  writeFileSync(`../i18n_${lang}.json`, JSON.stringify(dictionary[lang], null, 2))
}
