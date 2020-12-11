// ==UserScript==
// @name         Novel Stats Charts
// @namespace    https://github.com/MarvNC
// @version      0.37
// @description  A userscript that generates charts about novel series.
// @author       Marv
// @match        https://bookwalker.jp/series/*
// @match        https://global.bookwalker.jp/series/*
// @downloadURL  https://raw.githubusercontent.com/MarvNC/Book-Stats-Charts/main/release-dates.user.js
// @updateURL    https://raw.githubusercontent.com/MarvNC/Book-Stats-Charts/main/release-dates.user.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.1/moment.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.9.4/Chart.min.js
// @require      https://cdn.jsdelivr.net/npm/chartjs-plugin-trendline
// @require      https://cdn.jsdelivr.net/npm/interactjs/dist/interact.min.js
// @require      https://unpkg.com/tabulator-tables@4.8.4/dist/js/tabulator.min.js
// @resource     tabulatorCSS https://unpkg.com/tabulator-tables@4.8.4/dist/css/tabulator.min.css
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @grant        GM_xmlhttpRequest
// ==/UserScript==

const volRegex = /(\d+\.?\d*)/g;
const dayMs = 86400000;
const monthMs = 2592000000;

(async function () {
  'use strict';

  // chart shit
  var dateChart = document.createElement('CANVAS');
  var delayChart = document.createElement('CANVAS');
  var pageChart = document.createElement('CANVAS');

  var { getInfo, books, insertChart, title } = getPageInfo(document, document.URL);

  let textFeedback = document.createElement('h1');
  textFeedback.style.fontSize = 'large';

  let div = document.createElement('div');
  div.className = 'charts';

  insertChart.append(div);

  resizable(div.className);
  GM_addStyle(`.charts {
  padding: 1em 1em;
  border-width: medium;
  border-style: dashed;
  border-color: #D6D8D9;
  touch-action: none;
  box-sizing: border-box;
  text-align: center;
}`);
  GM_addStyle(GM_getResourceText('tabulatorCSS'));

  div.append(textFeedback);

  let {
    volumes,
    dates,
    pages,
    titles,
    voldate,
    times,
    days,
    tableData,
    avgDays,
    medianDays,
    avgPages,
    medianPages,
  } = await getSeriesInfo(books, getInfo, textFeedback);

  textFeedback.innerHTML = `Drag from the right side to resize.<br>
Press Ctrl + C after clicking the table to copy its contents.<br><br>
<strong>${title}</strong>`;
  textFeedback.style.marginBottom = '1em';

  // table shit
  var table = document.createElement('div');
  table.id = 'table';
  div.append(table);
  var table = new Tabulator('#table', {
    data: tableData,
    layout: 'fitColumns',
    columns: [
      //Define Table Columns
      { title: 'Vol.', field: 'volume', width: 60 },
      { title: 'Title', field: 'title', widthGrow: 3 },
      { title: 'Date', field: 'date', sorter: 'date', sorterParams: { format: 'D MMMM YYYY' } },
      { title: 'Days Waited', field: 'days', width: 120 },
      { title: 'Pages', field: 'pageCount', width: 100 },
    ],
    clipboard: true,
  });

  var dataText = document.createElement('h2');
  dataText.innerHTML = `Average wait: ${avgDays} days, median wait: ${medianDays} days per volume
<br><br>Average page count: ${avgPages} pages, median page count: ${medianPages} pages`;
  dataText.style.margin = '1em';

  div.append(dataText);

  // compare given URL against current series page
  var compare = document.createElement('input');
  var compareBtn = document.createElement('button');
  compare.setAttribute('type', 'text');
  compare.setAttribute('value', 'Enter a Bookwalker URL to compare to.');

  compare.style.width = '100%';
  compareBtn.style.width = '100%';
  compareBtn.innerText = 'Compare with URL';

  compareBtn.onclick = async () => {
    compareBtn.onclick = null;
    let url = compare.value;
    let text = await xmlhttpRequestText(url);
    let doc = document.createElement('html');
    doc.innerHTML = text;
    let { books: booklist, getInfo: getInfo_, title: title_ } = await getPageInfo(doc, url);
    let {
      voldate: voldate_,
      dates: dates_,
      volumes: volumes_,
      avgDays: avgDays_,
      medianDays: medianDays_,
    } = await getSeriesInfo(booklist, getInfo_, compareBtn);

    let catchUpText = document.createElement('h2');
    catchUpText.style.margin = '1em';
    catchUpText.innerHTML = `<strong>${title_}</strong>
<br><br>Average wait: ${avgDays_} days, median wait: ${medianDays_} days per volume`;
    div.insertBefore(catchUpText, compareBtn.nextElementSibling);

    let intersect = projectIntersection(voldate, voldate_);

    if (intersect.y > 0) {
      let catchUpDate = new Date(intersect.x);
      catchUpText.innerHTML += `<br><br>These two datasets are projected to intersect on ${dateString(
        catchUpDate
      )} on volume ${intersect.y.toPrecision(4)}.`;
      dateChartThing.data.datasets.push({
        label: 'Intersection',
        data: [{ t: catchUpDate, y: intersect.y }],
        borderColor: '#5D5EDE',
      });
    } else {
      catchUpText.innerHTML += `<br><br>Looks like these two datasets don't intersect in the future.`;
    }

    dateChartThing.data.datasets.push({
      label: title_,
      data: voldate_,
      fill: false,
      borderColor: '#5DA1DE',
      trendlineLinear: {
        style: 'rgba(255,105,180, .6)',
        lineStyle: 'dotted',
        width: 2,
      },
    });

    dateChartThing.options.scales.xAxes[0].ticks.max =
      Math.max(new Date(), Math.max(...dates, ...dates_, intersect.x)) + monthMs;
    dateChartThing.options.scales.xAxes[0].ticks.min = Math.min(...dates, ...dates_) - monthMs;

    dateChartThing.update();
  };

  div.append(compare);
  div.append(compareBtn);

  div.append(dateChart);
  div.append(delayChart);
  div.append(pageChart);

  var dateOptions = {
    type: 'line',
    data: {
      datasets: [
        {
          label: title,
          data: voldate,
          fill: false,
          borderColor: '#7296F5',
          trendlineLinear: {
            style: 'rgba(255,105,180, .6)',
            lineStyle: 'dotted',
            width: 2,
          },
        },
        {
          label: `Today's date`,
          data: [
            { y: Math.max(...volumes), t: new Date() },
            { y: 0, t: new Date() },
          ],
        },
      ],
    },
    options: {
      title: {
        display: true,
        text: 'Release Dates',
      },
      scales: {
        xAxes: [
          {
            ticks: {
              max: Math.max(new Date(), Math.max(...dates)) + monthMs,
              min: Math.min(...dates) - monthMs,
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
          label: title,
          data: days,
        },
      ],
    },
    options: {
      title: {
        display: true,
        text: 'Days per volume',
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
          label: title,
          data: pages,
        },
      ],
    },
    options: {
      title: {
        display: true,
        text: 'Pages per volume',
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

  var dateChartThing = new Chart(dateChart, dateOptions);
  var delayChartThing = new Chart(delayChart, delayOptions);
  var pageChartThing = new Chart(pageChart, pageOptions);
})();

// given a page get the info necessary for the script to function
// returns a getInfo function for book info, books array of book URLs,
// insertChart element to insert stuff in, and the title of the
// book series that is displayed
function getPageInfo(doc, url) {
  let books = [];
  let bookwalker = url.includes('bookwalker.jp') && url.includes('list'),
    bwGlobal = url.includes('global');
  let getInfo;
  if (bookwalker) {
    getInfo = getBwInfo;

    insertChart = doc.querySelector('div.bookWidget');

    let titleElem = doc.querySelector('.bookWidget h1');
    title = titleElem ? titleElem.innerText : 'Unknown title';
    let match = title.match(/『(.*)』/);
    title = match ? match[1] : title;
    console.log(title);

    let bookslist = doc.querySelector('div.bookWidget > section');
    Array.from(bookslist.children).forEach((book) => {
      let em = book.querySelector('h2 a[href], h3 a[href]');
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

    insertChart = doc.querySelector('.book-list-area');

    title = doc.querySelector('.title-main-inner').textContent.split('\n')[0];
    console.log(title);

    let bookslist = doc.querySelector('.o-tile-list');
    Array.from(bookslist.children).forEach((book) => {
      let em = book.querySelector('.a-tile-thumb-img');
      books.unshift(em.href);
    });
    console.log(books);
  }

  return { getInfo, books, insertChart, title };
}

// given an input array of books and a function for getting info,
// gets the book information and returns arrays and info with stats
// on all of it.
async function getSeriesInfo(books, getInfo, textFeedback = null) {
  let volumes = [],
    dates = [],
    pages = [],
    titles = [],
    voldate = [],
    times = [],
    days = [],
    tableData = [],
    avgDays,
    medianDays,
    avgPages,
    medianPages;
  for (let url of books) {
    let { volume, date, pageCount, title } = await getInfo(url);
    volumes.push(volume);
    dates.push(date);
    pages.push(pageCount);
    titles.push(title);
    tableData.push({
      volume: volume,
      title: title,
      date: dateString(date),
      pageCount: pageCount,
    });
    voldate.push({ y: volume, t: date });
    console.log({ volume, date, pageCount });
    if (textFeedback) {
      textFeedback.innerText = `Retrieved data for volume ${volume} released on ${dateString(
        date
      )} with ${pageCount} pages.`;
    }
  }

  for (let i = 1; i < dates.length; i++) {
    times.push(dates[i] - dates[i - 1]);
  }

  avgDays = (times.reduce((prev, curr) => prev + curr, 0) / times.length / dayMs).toPrecision(4);
  medianDays = (median([...times]) / dayMs).toPrecision(4);
  avgPages = (pages.reduce((prev, curr) => prev + curr, 0) / times.length).toPrecision(4);
  medianPages = median([...pages]);

  days = times.map((time) => Math.round(time / dayMs));
  days.unshift(0);

  for (let i = 1; i < tableData.length; i++) {
    tableData[i].days = days[i];
  }
  tableData[0].days = 0;

  return {
    volumes,
    dates,
    pages,
    titles,
    voldate,
    times,
    days,
    tableData,
    avgDays,
    medianDays,
    avgPages,
    medianPages,
  };
}

// gets information about a given bookwalker.jp url
// returns volume number, date, page count, and title.
async function getBwInfo(url) {
  console.log(url);
  let doc = document.createElement('html');
  doc.innerHTML = await xmlhttpRequestText(url);

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
    title: title,
  };
}

// gets information about a given global.bookwalker.jp url
// returns volume number, date, page count, and title.
async function getBwGlobalInfo(url) {
  console.log(url);
  let doc = document.createElement('html');
  doc.innerHTML = await xmlhttpRequestText(url);

  let titleElem = doc.querySelector('h1');
  let title = titleElem ? titleElem.innerHTML.split('<span')[0] : '';

  let volumeNumber = title.match(volRegex);
  volumeNumber = volumeNumber ? parseFloat(volumeNumber.pop()) : 1;
  // in case it's first volume and the title had a 300 in it or something
  volumeNumber = volumeNumber > 100 ? 1 : volumeNumber;

  let dateString = Array.from(doc.querySelector('.product-detail').firstElementChild.children)
    .find((elem) => elem.firstElementChild.innerText == 'Available since')
    .lastElementChild.innerText.split(' (')[0];
  let date = new Date(dateString);

  let pageCountString = Array.from(
    doc.querySelector('.product-detail').firstElementChild.children
  ).find((elem) => elem.firstElementChild.innerText == 'Page count').lastElementChild.innerText;
  let pageCount = parseInt(/\d+/.exec(pageCountString)[0]);

  doc.remove();

  return {
    volume: volumeNumber,
    date: date,
    pageCount: pageCount,
    title: title,
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

// uses GM xmlhttpRequest because CORS, and returns the response text
function xmlhttpRequestText(url) {
  return new Promise((resolve, reject) => {
    GM_xmlhttpRequest({
      method: 'GET',
      url: url,
      onload: async (response) => {
        resolve(response.responseText);
      },
    });
  });
}

// accepts 2 voldate arrays ({y: volume, t: date})
function projectIntersection(data1, data2) {
  // get max in case most recent value is a special volume
  let max = (data) => data.reduce((prev, datum) => Math.max(datum.y, prev), 0);

  // most recent point
  let point1 = data1.find((point) => point.y == max(data1));
  let point2 = data2.find((point) => point.y == max(data2));

  return intersect(
    data1[0].t.getTime(),
    data1[0].y,
    point1.t.getTime(),
    point1.y,
    data2[0].t.getTime(),
    data2[0].y,
    point2.t.getTime(),
    point2.y
  );
}

// line intercept math by Paul Bourke http://paulbourke.net/geometry/pointlineplane/
// Determine the intersection point of two line segments
// Return FALSE if the lines don't intersect
function intersect(x1, y1, x2, y2, x3, y3, x4, y4) {
  // Check if none of the lines are of length 0
  if ((x1 === x2 && y1 === y2) || (x3 === x4 && y3 === y4)) {
    return false;
  }

  let denominator = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);

  // Lines are parallel
  if (denominator === 0) {
    return false;
  }

  let ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator;
  let ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator;

  // // is the intersection along the segments
  // if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
  //   return false;
  // }

  // Return a object with the x and y coordinates of the intersection
  let x = x1 + ua * (x2 - x1);
  let y = y1 + ua * (y2 - y1);

  return { x, y };
}

function dateString(date) {
  return date.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
