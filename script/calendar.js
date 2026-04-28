/*
This script is very ugly!
It is a funny combination of some legacy code (Chrome v. 30 compatible) and some minimal additions to get useful output.
*/

// hacky implementation of date conversion (Greogorian - Ethiopian)
var dateUtils = (function createDateUtils () {
  function fromWestern (year, month, date) {
    return new Date(Date.UTC(year, month - 1, date, 3));
  }

  function fromEthiopian (year, month, date) {
    date = (month - 1) * 30 + (date - 1);
    return fromWestern(year + 7, 9, (year % 4 > 0 ? 11 : 12) + date);
    // return new Date(Date.UTC(year + 7, 8, (year % 4 > 0 ? 11 : 12) + date, 3));
  }

  function toEthiopian (western) {
    var reference = fromEthiopian(2000, 1, 1);
    var diff = diffDays(reference, western);
    var year = Math.floor(diff / 1461);
    var index = (diff - year * 1461);
    year = 2000 + year * 4;
    for (var i = 0; i < 3 && index >= 365; i++) {
      year++;
      index -= 365;
    }
    var month = Math.floor(1 + index / 30);
    var date = 1 + index % 30;
    return { year: year, month: month, date: date, index: index };
  }

  function diffDays (date1, date2) {
    return (date2.getTime() - date1.getTime()) / 864e5;
  }

  function addDays (date, days) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days, 3));
  }

  return {
    fromWestern: fromWestern,
    fromEthiopian: fromEthiopian,
    toEthiopian: toEthiopian,
    diffDays: diffDays,
    addDays: addDays
  };
})();

// pre-calculated Ethiopian Easter dates for 2012 through 2040 (Julian year)
var EASTER = [19, 32, 24, 16, 35, 20, 12, 32, 16, 8, 28, 13, 32, 24, 9, 29, 20, 5, 25, 17, 36, 21, 13, 33, 24, 9, 29, 21, 5, 25];
function getEaster (year) {
  return dateUtils.fromWestern(year + 8, 4, EASTER[year - 2012]);
}

// computes observances of a given calendar year
// also, pads beginning and end to be full weeks; helpful for (printed) calendar generation
function getYear (year, options) {
  options = Object.assign({
    lastSunday: true,
    thirdBeforeLent: true,
    reformationDay: true,
    correctYear: true
    // reformationSunday: false,  // reformation over Sunday ?
    // newyearSunday: false,      // newyear over Sunday ?
  }, options);
  var newYear = dateUtils.fromEthiopian(year, 1, 1);
  var nextYear = dateUtils.fromEthiopian(year + 1, 1, 1);
  var yearLength = year % 4 == 3 ? 366 : 365;
  var offset = newYear.getUTCDay();
  var days = new Array(7 * Math.ceil((offset + yearLength) / 7)).fill('');
  var christmas = dateUtils.fromWestern(year + 8, 1, 7);
  var advent1 = dateUtils.addDays(christmas, -3 * 7 - (christmas.getUTCDay() || 7))
  function addDay (date, name, noOverwrite) {
    var cycle = 1 + (year - (options.correctYear ? 1 + (date < advent1) : (date < newYear) + (date < nextYear))) % 4;
    var index = offset + dateUtils.diffDays(newYear, date);
    if (index < 0 || index >= days.length) return;
    // if (noOverwrite && days[index]) return;
    if (!days[index]) {
      days[index] = '';
    } else {
      days[index] += '|';
    }
    days[index] += cycle + ':' + name;
    // console.log(date, name);
  }
  var cycle = 1 + (year - 2) % 4;
  var lastEaster = getEaster(year - 1);
  var beforeJudgment = dateUtils.addDays(advent1, -14);
  var lastTrinity = dateUtils.addDays(lastEaster, 70);
  for (var n = 1; n <= 23; n++) {
    var trinity = dateUtils.addDays(lastTrinity, n * 7);
    if (trinity >= beforeJudgment) break;
    addDay(trinity, 'trinity+' + n);
  }
  if (options.lastSunday && offset > 0) {
    addDay(dateUtils.addDays(newYear, -offset), 'last');
  }
  addDay(newYear, 'newyear');
  addDay(dateUtils.fromEthiopian(year, 1, 17), 'mesqel');
  addDay(beforeJudgment, 'judgment-1');
  addDay(dateUtils.addDays(advent1, -7), 'judgment');
  addDay(advent1, 'advent1');
  addDay(dateUtils.addDays(advent1, 7), 'advent2');
  addDay(dateUtils.addDays(advent1, 14), 'advent3');
  addDay(dateUtils.addDays(advent1, 21), 'advent4');
  addDay(christmas, 'christmas');
  addDay(dateUtils.addDays(christmas, 7 - christmas.getUTCDay()), 'christmas+1');
  addDay(dateUtils.addDays(christmas, 14 - christmas.getUTCDay()), 'christmas+2');
  var epiphany = dateUtils.fromEthiopian(year, 5, 11);
  addDay(epiphany, 'epiphany');
  for (var n = 1; n <= 6; n++) {
    addDay(dateUtils.addDays(epiphany, n * 7 - epiphany.getUTCDay()), 'epiphany+' + n);
  }
  var thisEaster = getEaster(year);
  var beforeLent = dateUtils.addDays(thisEaster, -8 * 7);
  if (options.thirdBeforeLent) {
    addDay(dateUtils.addDays(beforeLent, -14), 'lent-3');
  }
  addDay(dateUtils.addDays(beforeLent, -7), 'lent-2');
  addDay(beforeLent, 'lent-1');
  for (var n = 1; n <= 7; n++) {
    addDay(dateUtils.addDays(beforeLent, n * 7), 'lent' + n);
  }
  addDay(dateUtils.addDays(thisEaster, -6), 'holy_mo');
  addDay(dateUtils.addDays(thisEaster, -5), 'holy_tu');
  addDay(dateUtils.addDays(thisEaster, -4), 'holy_we');
  addDay(dateUtils.addDays(thisEaster, -3), 'holy_th');
  addDay(dateUtils.addDays(thisEaster, -2), 'holy_fr');
  addDay(dateUtils.addDays(thisEaster, -1), 'holy_sa');
  addDay(thisEaster, 'easter');
  addDay(dateUtils.addDays(thisEaster, 1), 'easter_mo');
  for (var n = 1; n <= 5; n++) {
    addDay(dateUtils.addDays(thisEaster, n * 7), 'easter+' + n);
  }
  addDay(dateUtils.addDays(thisEaster, 39), 'ascension');
  addDay(dateUtils.addDays(thisEaster, 42), 'ascension+1');
  addDay(dateUtils.addDays(thisEaster, 49), 'pentecost');
  addDay(dateUtils.addDays(thisEaster, 56), 'pentecost+1');
  addDay(dateUtils.addDays(thisEaster, 63), 'pentecost+2');
  var thisTrinity = dateUtils.addDays(thisEaster, 70);
  addDay(thisTrinity, 'trinity');
  for (var n = 1; n <= 23; n++) {
    addDay(dateUtils.addDays(thisTrinity, n * 7), 'trinity+' + n);
  }
  if (options.lastSunday) {
    addDay(dateUtils.addDays(nextYear, -(nextYear.getUTCDay() || 7)), 'last');
  }
  addDay(nextYear, 'newyear');
  if (options.reformationDay) {
    // Supposedly on Tiqimt 21 or the following Sunday (?)
    // Yemisrach Dimts always uses the Western date
    addDay(dateUtils.fromWestern(year + 7, 10, 31), 'reformation');
  }
  if (options.additional) {
    // Annunciation is Megabit 29 or the following Sunday. Ambiguous?
    var megabit29 = dateUtils.fromEthiopian(year, 7, 29);
    addDay(dateUtils.addDays(megabit29, 7 - (megabit29.getUTCDay() || 7)), 'annunciation');
    addDay(dateUtils.fromEthiopian(year, 12, 13), 'tabor');
    // Martyr's Day is supposedly on Tiqimt 22 or the last Sunday of the month. This is very ambiguous.
  }
  return {
    year: year,
    offset: offset,
    length: yearLength,
    options: options,
    days: days
  };
}

// return an array with observances for a single calendar year
function getYearList (year) {
  const data = getYear(year)
  const list = []
  for (let i = 0; i < data.days.length; i++) {
    if (!data.days[i].length) continue
    const alts = data.days[i].split('|')
    const row = data.days[i].split('|')[0].split(':')
    const cycle = +row[0]
    const id = row[1]
    const dateWestern = dateUtils.fromEthiopian(year, 1, 1 + i - data.offset)
    const date = dateUtils.toEthiopian(dateWestern)
    if (date.year != year) continue
    const dateEthiopian = [date.year, date.month, date.date].map(n => n.toString().padStart(2, '0')).join('-')
    list.push({
      id,
      series: cycle,
      dateGregorian: dateWestern.toJSON().slice(0, 10),
      dateEthiopian
    })
  }
  return list
}

const { writeFileSync } = require('fs')

for (let year = 2018; year <= 2030; year++) {
  writeFileSync('../year_' + year + '.json', JSON.stringify(getYearList(year), null, 2))
}
