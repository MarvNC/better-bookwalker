// ==UserScript==
// @name         Novel Stats Charts
// @namespace    https://github.com/MarvNC
// @version      0.48
// @description  A userscript that generates charts about novel series.
// @author       Marv
// @match        https://bookwalker.jp/series/*
// @match        https://global.bookwalker.jp/series/*
// @downloadURL  https://raw.githubusercontent.com/MarvNC/Book-Stats-Charts/main/release-dates.user.js
// @updateURL    https://raw.githubusercontent.com/MarvNC/Book-Stats-Charts/main/release-dates.user.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.1/moment.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.9.4/Chart.min.js
// @require      https://cdn.jsdelivr.net/npm/chartjs-plugin-trendline
// @require      https://cdnjs.cloudflare.com/ajax/libs/chartjs-plugin-annotation/0.5.7/chartjs-plugin-annotation.min.js
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
const sigFigs = 4;
const weightMultiple = 0.8;

(async function () {
  'use strict';

  // chart shit
  let dateChart = document.createElement('CANVAS');
  let delayChart = document.createElement('CANVAS');
  let pageChart = document.createElement('CANVAS');

  let { getInfo, books, insertChart, title } = getPageInfo(document, document.URL);

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
}
.switch {
  position: relative;
  display: inline-block;
  width: 30px;
  height: 17px;
}

.switch input { 
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  -webkit-transition: .4s;
  transition: .4s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 13px;
  width: 13px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  -webkit-transition: .4s;
  transition: .4s;
}

input:checked + .slider {
  background-color: #2196F3;
}

input:focus + .slider {
  box-shadow: 0 0 1px #2196F3;
}

input:checked + .slider:before {
  -webkit-transform: translateX(13px);
  -ms-transform: translateX(13px);
  transform: translateX(13px);
}

/* Rounded sliders */
.slider.round {
  border-radius: 17px;
}

.slider.round:before {
  border-radius: 50%;
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
    consecVols,
    avgDays,
    medianDays,
    weightedWait,
    avgPages,
    medianPages,
  } = await getSeriesInfo(books, getInfo, textFeedback, div);

  textFeedback.innerHTML = `Drag from the right side to resize.<br>
Press Ctrl + C after clicking the table to copy its contents.<br><br>
<strong>${title}</strong>`;
  textFeedback.style.marginBottom = '1em';

  // table shit
  let table = document.createElement('div');
  table.id = 'table';
  div.append(table);
  let infoTable = new Tabulator('#table', {
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

  let predictMethod = document.createElement('select');
  let addDropdown = (input, value, text) => {
    let op = new Option();
    op.value = value;
    op.text = text;
    input.options.add(op);
  };

  let overall =
    (voldate.find((elem) => Math.max(...volumes) == elem.y).t.getTime() - voldate[0].t.getTime()) /
    (Math.max(...volumes) - 1);
  let method, volCounter, timeToAdd, currDate, predictSeries;

  addDropdown(
    predictMethod,
    'weighted avg',
    `Weighted average (weighing recent waits more): ${(weightedWait / dayMs).toPrecision(sigFigs)}`
  );
  addDropdown(
    predictMethod,
    'overall avg',
    `Overall average (based on delta to top volume num.): ${(overall / dayMs).toPrecision(sigFigs)}`
  );
  addDropdown(predictMethod, 'median', `Median time: ${medianDays}`);
  addDropdown(predictMethod, 'average', `Average time: ${avgDays}`);

  let predictBtn = document.createElement('button');
  predictBtn.innerText = 'Add volume prediction using selected prediction method';
  predictBtn.onclick = () => {
    // reset stuff if method was changed (and initialize on first click)
    if (predictMethod.value != method) {
      method = predictMethod.value;
      let newest = voldate[voldate.length - 1].t.getTime();
      switch (method) {
        case 'weighted avg':
          timeToAdd = weightedWait;
          currDate = newest;
          break;
        case 'overall avg':
          timeToAdd = overall;
          currDate = voldate.find((elem) => Math.max(...volumes) == elem.y).t.getTime();
          break;
        case 'median':
          timeToAdd = median([...times]);
          currDate = newest;
          break;
        case 'average':
          timeToAdd = times.reduce((prev, curr) => prev + curr, 0) / times.length;
          currDate = newest;
          break;
      }
      volCounter = Math.max(...volumes);
      infoTable.replaceData(tableData);
      if (!predictSeries) {
        predictSeries = {
          label: 'Prediction',
          data: [],
          borderColor: '#E98CED',
          fill: false,
        };
        dateChartThing.data.datasets.push(predictSeries);
      }
      predictSeries.label = `Prediction (${method})`;
      predictSeries.data = [{ y: volCounter, t: currDate }];
    }
    volCounter++;
    currDate += timeToAdd;
    predictSeries.data.push({ y: volCounter, t: currDate });
    dateChartThing.update();
    infoTable.addData(
      {
        volume: volCounter,
        title: `Prediction for Volume ${volCounter} based on the ${method}`,
        date: dateString(new Date(currDate)),
        days: (timeToAdd / dayMs).toPrecision(sigFigs),
      },
      false
    );
  };

  div.insertBefore(predictMethod, table);
  div.insertBefore(predictBtn, table);

  let dataText = document.createElement('h2');
  dataText.innerHTML = `Average wait: ${avgDays} days, median wait: ${medianDays}, recency-weighted wait: ${(
    weightedWait / dayMs
  ).toPrecision(sigFigs)} days per volume
<br><br>Average page count: ${avgPages} pages, median page count: ${medianPages} pages`;
  dataText.style.margin = '1em';

  div.append(dataText);

  // compare given URL against current series page
  let compare = document.createElement('input');
  let compareBtn = document.createElement('button');
  compare.setAttribute('type', 'text');
  compare.setAttribute('value', 'Enter a Bookwalker URL to compare to.');
  compare.onfocus = () => {
    compare.value = '';
    compare.onfocus = null;
  };

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
      weightedWait: weightedWait_,
    } = await getSeriesInfo(booklist, getInfo_, compareBtn, div);

    let catchUpText = document.createElement('h2');
    catchUpText.style.margin = '1em';
    catchUpText.innerHTML = `<strong>${title_}</strong>
<br><br>Average wait: ${avgDays_} days, median wait: ${medianDays_}, recency-weighted wait: ${(
      weightedWait_ / dayMs
    ).toPrecision(sigFigs)} days per volume`;
    div.insertBefore(catchUpText, compareBtn.nextElementSibling);

    // console.log(Math.max(...volumes), Math.max(...volumes_), volumes_);
    if (Math.max(...volumes) == Math.max(...volumes_) && Math.max(...volumes) != 1) {
      catchUpText.innerHTML += `<br><br>Looks like someone caught up, both datasets have volume ${Math.max(
        ...volumes
      )} as the most recent one.`;
    } else {
      let intersect = projectIntersection(voldate, voldate_);
      if (intersect.y > 0) {
        let catchUpDate = new Date(intersect.x);
        catchUpText.innerHTML += `<br><br>These two datasets are projected to intersect on ${dateString(
          catchUpDate
        )} on volume ${intersect.y.toPrecision(sigFigs)}.`;
        dateChartThing.data.datasets.push({
          label: 'Intersection',
          data: [{ t: catchUpDate, y: intersect.y }],
          borderColor: '#5D5EDE',
          pointBorderWidth: 2,
        });
      } else {
        catchUpText.innerHTML += `<br><br>Looks like these two datasets don't intersect in the future.`;
      }
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

    dateChartThing.update();
  };

  div.append(compare);
  div.append(compareBtn);

  div.append(dateChart);
  div.append(delayChart);
  div.append(pageChart);

  let dateOptions = {
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
            type: 'time',
            time: {
              unit: 'month',
              tooltipFormat: 'D MMMM YYYY',
            },
            afterDataLimits: (axis) => {
              // 1 month padding on both sides
              axis.max = Math.max(axis.max, new Date().getTime()) + monthMs;
              axis.min -= monthMs;
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
            afterDataLimits: (axis) => {
              axis.max += 1;
            },
          },
        ],
      },
      annotation: {
        annotations: [
          {
            type: 'line',
            scaleID: 'x-axis-0',
            value: new Date(),
            borderColor: '#7577D9',
            borderWidth: 1,
          },
        ],
      },
    },
  };
  let delayOptions = {
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
  let pageOptions = {
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

  let dateChartThing = new Chart(dateChart, dateOptions);
  let delayChartThing = new Chart(delayChart, delayOptions);
  let pageChartThing = new Chart(pageChart, pageOptions);

  let consecText = document.createElement('p');
  consecText.innerText = `Toggle consecutive volume numbering (for series that don't have numbers)`;
  consecText.style.marginTop = '1em';
  let consecSwitch = htmlToElement(`<label class="switch">
  <input type="checkbox">
  <span class="slider round"></span>
</label>`);
  consecSwitch.style.margin = '.5em 1em';
  let consecData = consecVols.map((vol, index) => {
    return { y: vol, t: dates[index] };
  });
  consecSwitch.onclick = () => {
    if (consecSwitch.firstElementChild.checked) {
      dateChartThing.data.datasets[0].data = consecData;
    } else {
      dateChartThing.data.datasets[0].data = voldate;
    }
    dateChartThing.update();
  };
  div.insertBefore(consecText, dateChart);
  div.insertBefore(consecSwitch, dateChart);
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
async function getSeriesInfo(books, getInfo, textFeedback = null, div = null) {
  let volumes = [],
    dates = [],
    pages = [],
    titles = [],
    voldate = [],
    times = [],
    days = [],
    tableData = [],
    consecVols = [],
    avgDays,
    medianDays,
    weightedWait,
    avgPages,
    medianPages;
  let vol = 0;
  resizable(div.className, false);
  for (let url of books) {
    vol++;
    consecVols.push(vol);
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

  avgDays = (times.reduce((prev, curr) => prev + curr, 0) / times.length / dayMs).toPrecision(
    sigFigs
  );
  medianDays = (median([...times]) / dayMs).toPrecision(sigFigs);
  avgPages = (pages.reduce((prev, curr) => prev + curr, 0) / times.length).toPrecision(sigFigs);
  medianPages = median([...pages]);

  weightedWait = 0;
  let i = times.length,
    totalWeight = 0,
    currWeight = 1;
  while (i > 0) {
    i--;
    // skip outliers
    if (times[i] < 10 * dayMs) {
      continue;
    }
    weightedWait += times[i] * currWeight;
    totalWeight += currWeight;
    currWeight *= weightMultiple;
  }
  weightedWait /= totalWeight;

  days = times.map((time) => Math.round(time / dayMs));
  days.unshift(0);

  for (let i = 1; i < tableData.length; i++) {
    tableData[i].days = days[i];
  }
  tableData[0].days = 0;

  resizable(div.className, true);

  return {
    volumes,
    dates,
    pages,
    titles,
    voldate,
    times,
    days,
    tableData,
    consecVols,
    avgDays,
    medianDays,
    weightedWait,
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

  let matches = title.match(volRegex);
  matches = matches ? matches.map((elem) => parseFloat(elem)) : [];
  // find last element in matches that's less than 100
  let volumeNumber = matches.reverse().find((elem) => elem < 100) ?? 1;

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

  let matches = title.match(volRegex);
  matches = matches ? matches.map((elem) => parseFloat(elem)) : [];
  // find last element in matches that's less than 100
  let volumeNumber = matches.reverse().find((elem) => elem < 100) ?? 1;

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

  let half = Math.floor(values.length / 2);

  if (values.length % 2) return values[half];

  return (values[half - 1] + values[half]) / 2.0;
}

// use interactjs to make chart resizable
function resizable(className, resize = true) {
  interact(`.${className}`)
    .resizable({
      // resize from all edges and corners
      edges: {
        left: false,
        right: resize,
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

// creates an element from an html string
function htmlToElement(html) {
  let template = document.createElement('template');
  html = html.trim(); // Never return a text node of whitespace as the result
  template.innerHTML = html;
  return template.content.firstChild;
}
