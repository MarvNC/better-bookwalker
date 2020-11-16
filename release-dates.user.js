// ==UserScript==
// @name         Novel Stats Charts
// @namespace    https://github.com/MarvNC
// @version      0.15
// @description  A userscript that generates charts about novel series.
// @author       Marv
// @match        https://bookwalker.jp/series/*
// @match        https://global.bookwalker.jp/series/*
// @downloadURL  https://raw.githubusercontent.com/MarvNC/Book-Stats-Charts/main/release-dates.user.js
// @updateURL    https://raw.githubusercontent.com/MarvNC/Book-Stats-Charts/main/release-dates.user.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.9.4/Chart.bundle.min.js
// @require      http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js
// @grant        none
// ==/UserScript==

const volRegex = /[\d\.]+/g;
// ms in a day
const dayMs = 86400000;

(async function () {
  'use strict';

  var books = [],
    volumes = [],
    dates = [],
    pages = [],
    voldate = [],
    times = [],
    days = [],
    avgDays,
    medianDays,
    title;

  var bookwalker = document.URL.includes('bookwalker.jp') && document.URL.includes('list'),
    bwGlobal = document.URL.includes('global');

  // chart shit
  var dateChart = document.createElement('CANVAS');
  var delayChart = document.createElement('CANVAS');
  var pageChart = document.createElement('CANVAS');

  var insertChart;

  var getInfo;

  if (bookwalker) {
    getInfo = getBwInfo;

    insertChart = document.querySelector('#bside > div.bookWidget');

    title = document.querySelector('#pageWrapInner > ol > li:nth-child(2) > a > span').innerText;
    console.log(title);

    let bookslist = document.querySelector('#bside > div.bookWidget > section');
    Array.from(bookslist.children).forEach((book) => {
      let em = Array.from(book.children).find((elem) =>
        elem.className.includes('hoverWrapperItem bookItemHover')
      );
      books.unshift(em.dataset.url);
    });
    console.log(books);
  }

  if (bwGlobal) {
    getInfo = getBwGlobalInfo;

    insertChart = document.querySelector(
      'body > div.all-wrap > div.wrap.clearfix > div.main-area > div > div.book-list-area.book-result-area.book-result-area-1'
    );

    title = document.querySelector(
      'body > div.all-wrap > div.bread-crumb-area > ul > li:nth-child(3) > a > span'
    ).innerText;
    console.log(title);

    let bookslist = document.querySelector(
      'body > div.all-wrap > div.wrap.clearfix > div.main-area > div > div.book-list-area.book-result-area.book-result-area-1 > ul'
    );
    Array.from(bookslist.children).forEach((book) => {
      let em = Array.from(book.firstElementChild.firstElementChild.children).find((elem) =>
        elem.className.includes('a-tile-thumb-img')
      );
      books.unshift(em.href);
    });
    console.log(books);
  }

  var textFeedback = document.createElement('h1');
  textFeedback.style.textAlign = 'center';
  textFeedback.style.fontSize = 'large';

  var div = document.createElement('div');
  div.className = 'charts';

  insertChart.append(div);

  div.append(textFeedback);

  for (let url of books) {
    let { volume, date, pageCount } = await getInfo(url);
    volumes.push(volume);
    dates.push(date);
    pages.push(pageCount);
    voldate.push({ y: volume, t: date });
    console.log({ volume, date, pageCount });
    textFeedback.innerText = `Retrieved data for volume ${volume} released on ${date.toLocaleDateString()} with ${pageCount} pages.`;
  }
  console.table(voldate);
  textFeedback.remove();

  for (let i = 1; i < dates.length; i++) {
    times.push(dates[i] - dates[i - 1]);
  }

  avgDays = (times.reduce((prev, curr) => prev + curr, 0) / times.length / dayMs).toPrecision(4);
  medianDays = (median([...times]) / dayMs).toPrecision(4);

  days = times.map((time) => Math.round(time / dayMs));
  console.log(days);
  days.unshift(0);

  div.append(dateChart);
  div.append(delayChart);
  div.append(pageChart);

  var lineOptions = {
    type: 'line',
    data: {
      datasets: [
        {
          label: 'Volume',
          data: voldate,
        },
      ],
    },
    options: {
      title: {
        display: true,
        text: `${title} Release Dates`,
      },
      scales: {
        xAxes: [
          {
            ticks: {
              max: Math.max(new Date(), dates),
            },
            type: 'time',
            time: {
              unit: 'month',
            },
          },
        ],
        yAxes: [
          {
            scaleLabel: {
              display: true,
              labelString: 'Volume Number',
            },
            ticks: {
              beginAtZero: true,
              stepSize: 1,
            },
          },
        ],
      },
    },
  };
  var delayOptions = {
    type: 'bar',
    data: {
      labels: volumes,
      datasets: [
        {
          label: 'Volume',
          data: days,
        },
      ],
    },
    options: {
      title: {
        display: true,
        text: `${title} Days per volume (Avg ${avgDays}, median ${medianDays} days per volume)`,
      },
      scales: {
        yAxes: [
          {
            scaleLabel: {
              display: true,
              labelString: 'Days Waited',
            },
            ticks: {
              beginAtZero: true,
            },
          },
        ],
      },
    },
  };
  var pageOptions = {
    type: 'bar',
    data: {
      labels: volumes,
      datasets: [
        {
          label: 'Volume',
          data: pages,
        },
      ],
    },
    options: {
      title: {
        display: true,
        text: `${title} Pages per volume`,
      },
      scales: {
        yAxes: [
          {
            scaleLabel: {
              display: true,
              labelString: 'Pages',
            },
            ticks: {
              beginAtZero: true,
              stepSize: 25,
            },
          },
        ],
      },
    },
  };

  var dateChartThing = new Chart(dateChart, lineOptions);
  var delayChartThing = new Chart(delayChart, delayOptions);
  var pageChartThing = new Chart(pageChart, pageOptions);
})();

async function getBwInfo(url) {
  console.log(url);
  let response = await $.get(url);
  let doc = document.createElement('html');
  doc.innerHTML = response;

  let title = doc.querySelector(
    '#newuser > div.bw_frame-container > div.bw_frame-content.frame-content-1.frame-content-fixed > div > div.detail-header > div > div > div.main-info > h1'
  ).innerText;
  title = fullWidthNumConvert(title);

  let volString;
  while ((match = volRegex.exec(title))) {
    volString = match;
  }
  let volumeNumber = volString ? parseFloat(volString[0]) : 1;
  // in case it's first volume and the title had a 300 in it or something
  volumeNumber = volumeNumber > 100 ? 1 : volumeNumber;

  let datething = Array.from(
    doc.querySelector('#detail-productInfo > div > div > div.work > div > dl:nth-child(2)').children
  ).find((elem) => elem.innerText == '配信開始日').nextElementSibling;
  let date = new Date(datething.innerText);

  let pagecountthing = Array.from(
    doc.querySelector('#detail-productInfo > div > div > div.work > div > dl:nth-child(2)').children
  ).find((elem) => elem.innerText == 'ページ概数');
  pagecountthing = pagecountthing ? pagecountthing.nextElementSibling : 0;
  let pageCount = parseInt(pagecountthing.innerText);

  doc.remove();

  return {
    volume: volumeNumber,
    date: date,
    pageCount: pageCount,
  };
}

async function getBwGlobalInfo(url) {
  console.log(url);
  let response = await $.get(url);
  let doc = document.createElement('html');
  doc.innerHTML = response;

  let title = doc
    .querySelector('body > div.all-wrap > div.wrap.clearfix > div.detail-book-title-box > div > h1')
    .innerHTML.split('<span')[0];

  let volString;
  while ((match = volRegex.exec(title))) {
    volString = match;
  }
  let volumeNumber = volString ? parseFloat(volString[0]) : 1;
  // in case it's first volume and the title had a 300 in it or something
  volumeNumber = volumeNumber > 100 ? 1 : volumeNumber;

  let dateString = Array.from(
    doc.querySelector('#product-details > div > table').firstElementChild.children
  )
    .find((elem) => elem.firstElementChild.innerText == 'Available since')
    .lastElementChild.innerText.split(' (')[0];
  let date = new Date(dateString);

  let pageCountString = Array.from(
    doc.querySelector('#product-details > div > table').firstElementChild.children
  ).find((elem) => elem.firstElementChild.innerText == 'Page count').lastElementChild.innerText;
  let pageCount = /\d+/.exec(pageCountString)[0];

  doc.remove();

  return {
    volume: volumeNumber,
    date: date,
    pageCount: pageCount,
  };
}

// converts full length numbers and decimal dots to the regular type for parsing
function fullWidthNumConvert(fullWidthNum) {
  return fullWidthNum.replace(/[\uFF10-\uFF19\uFF0e]/g, function (m) {
    return String.fromCharCode(m.charCodeAt(0) - 0xfee0);
  });
}

// gets median of array
function median(values) {
  if (values.length === 0) return 0;

  values.sort(function (a, b) {
    return a - b;
  });

  var half = Math.floor(values.length / 2);

  if (values.length % 2) return values[half];

  return (values[half - 1] + values[half]) / 2.0;
}
