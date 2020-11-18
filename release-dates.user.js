// ==UserScript==
// @name         Novel Stats Charts
// @namespace    https://github.com/MarvNC
// @version      0.21
// @description  A userscript that generates charts about novel series.
// @author       Marv
// @match        https://bookwalker.jp/series/*
// @match        https://global.bookwalker.jp/series/*
// @downloadURL  https://raw.githubusercontent.com/MarvNC/Book-Stats-Charts/main/release-dates.user.js
// @updateURL    https://raw.githubusercontent.com/MarvNC/Book-Stats-Charts/main/release-dates.user.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.9.4/Chart.bundle.min.js
// @require      https://cdn.jsdelivr.net/npm/interactjs/dist/interact.min.js
// @grant        GM_addStyle
// ==/UserScript==

const volRegex = /([\d\.]+)/g;
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

    insertChart = document.querySelector('div.bookWidget');

    let titleElem = document.querySelector('.bookWidget h1');
    title = titleElem ? titleElem.innerText : 'Unknown title';
    let match = title.match(/『(.*)』/);
    title = match ? match[1] : title;
    console.log(title);

    let bookslist = document.querySelector('div.bookWidget > section');
    Array.from(bookslist.children).forEach((book) => {
      let em = book.querySelector('h2 a[href]');
      if (em) books.unshift(em.href);
      else {
        em = book.querySelector('div');
        if (em.dataset.url) books.unshift(em.dataset.url);
      }
    });
    Array.from(bookslist.children).forEach((book) => {});
    console.log(books);
  }

  if (bwGlobal) {
    getInfo = getBwGlobalInfo;

    insertChart = document.querySelector('.book-list-area');

    title = document.querySelector('.title-main-inner').textContent.split('\n')[0];
    console.log(title);

    let bookslist = document.querySelector('.o-tile-list');
    Array.from(bookslist.children).forEach((book) => {
      let em = book.querySelector('.a-tile-thumb-img');
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

  resizable(div.className);
  GM_addStyle(`.charts {
  padding: 1em 0em;
  border-width: medium;
  border-style: dashed;
  border-color: #D6D8D9;
  touch-action: none;
  box-sizing: border-box;
}`);

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
  textFeedback.innerText = `Drag from the right side to resize.`;

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
              max: Math.max(new Date(), Math.max.apply(dates)),
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
          label: 'Days waited',
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
          label: 'Pages',
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
  let response = await fetch(url);
  let doc = document.createElement('html');
  doc.innerHTML = await response.text();

  let titleElem = doc.querySelector('.main-info h1');
  let title = titleElem ? titleElem.innerText : 'Unknown title';
  title = fullWidthNumConvert(title);

  let volString;
  while ((match = volRegex.exec(title))) {
    volString = match;
  }
  let volumeNumber = volString ? parseFloat(volString[0]) : 1;
  // in case it's first volume and the title had a 300 in it or something
  volumeNumber = volumeNumber > 100 ? 1 : volumeNumber;

  let releaseDateElem = Array.from(doc.querySelectorAll('.work-detail-head')).find(
    (elem) => elem.innerText == '配信開始日'
  );
  let date = releaseDateElem ? new Date(releaseDateElem.nextElementSibling.innerText) : null;

  let pageCountElem = Array.from(doc.querySelectorAll('.work-detail-head')).find(
    (elem) => elem.innerText == 'ページ概数'
  );
  let pageCount = pageCountElem ? parseInt(pageCountElem.nextElementSibling.innerText) : 0;

  doc.remove();

  return {
    volume: volumeNumber,
    date: date,
    pageCount: pageCount,
  };
}

async function getBwGlobalInfo(url) {
  console.log(url);
  let response = await fetch(url);
  let doc = document.createElement('html');
  doc.innerHTML = await response.text();

  let titleElem = doc.querySelector('h1');
  let title = titleElem ? titleElem.innerHTML.split('<span')[0] : '';

  let volumeNumber = title.match(volRegex);
  volumeNumber = volumeNumber ? volumeNumber.pop() : 1;
  // in case it's first volume and the title had a 300 in it or something
  volumeNumber = volumeNumber > 100 ? 1 : volumeNumber;

  let dateString = Array.from(doc.querySelector('.product-detail').firstElementChild.children)
    .find((elem) => elem.firstElementChild.innerText == 'Available since')
    .lastElementChild.innerText.split(' (')[0];
  let date = new Date(dateString);

  let pageCountString = Array.from(
    doc.querySelector('.product-detail').firstElementChild.children
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

// use interactjs to make chart resizable
function resizable(className) {
  interact(`.${className}`)
    .resizable({
      // resize from all edges and corners
      edges: {
        left: false,
        right: true,
        bottom: false,
        top: false,
      },
      modifiers: [
        // keep the edges inside the parent
        interact.modifiers.restrictEdges({
          outer: 'parent',
        }),

        // minimum size
        interact.modifiers.restrictSize({
          min: { width: 600 },
        }),
      ],

      inertia: true,
    })
    .on('resizemove', (event) => {
      let { x, y } = event.target.dataset;

      x = parseFloat(x) || 0;
      y = parseFloat(y) || 0;

      Object.assign(event.target.style, {
        width: `${event.rect.width}px`,
        height: `${event.rect.height}px`,
        transform: `translate(${event.deltaRect.left}px, ${event.deltaRect.top}px)`,
      });

      Object.assign(event.target.dataset, { x, y });
    });
}
