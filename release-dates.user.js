// ==UserScript==
// @name         Novel Stats Charts
// @namespace    https://github.com/MarvNC
// @version      1.03
// @description  A userscript that generates charts about novel series.
// @author       Marv
// @match        https://bookwalker.jp/series/*
// @match        https://global.bookwalker.jp/series/*
// @downloadURL  https://raw.githubusercontent.com/MarvNC/Book-Stats-Charts/main/release-dates.user.js
// @updateURL    https://raw.githubusercontent.com/MarvNC/Book-Stats-Charts/main/release-dates.user.js
// @require      https://cdn.jsdelivr.net/npm/handsontable@latest/dist/handsontable.full.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.1/moment.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.9.4/Chart.min.js
// @require      https://cdn.jsdelivr.net/npm/chartjs-plugin-trendline
// @require      https://cdnjs.cloudflare.com/ajax/libs/chartjs-plugin-annotation/0.5.7/chartjs-plugin-annotation.min.js
// @require      https://cdn.jsdelivr.net/npm/interactjs/dist/interact.min.js
// @resource     hotCSS https://cdn.jsdelivr.net/npm/handsontable@latest/dist/handsontable.full.min.css
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @grant        GM_xmlhttpRequest
// ==/UserScript==

const volRegex = /(\d+\.?\d*)/g;
const dayMs = 86400000;
const monthMs = 2592000000;
const weightMultiple = 0.8;
const ignoreThreshold = 10;
const digits = 0;
const momentFormat = 'DD/MM/YYYY';

(async function () {
  let dateChart = document.createElement('CANVAS');
  let delayChart = document.createElement('CANVAS');
  let pageChart = document.createElement('CANVAS');

  let thisPage = getPageInfo(document, document.URL);

  let textFeedback = document.createElement('h1');
  textFeedback.style.fontSize = 'large';

  let div = document.createElement('div');
  div.className = 'charts';

  thisPage.insertChart.append(div);
  div.append(textFeedback);

  addCSS();

  let thisSeriesData = await getSeriesInfo(thisPage.bookURLs, textFeedback, div);
  let originalData = JSON.parse(JSON.stringify(thisSeriesData));
  let thisSeriesStats = getStats(thisSeriesData);

  textFeedback.innerHTML = `Drag from the right side to resize.<br>
Press Ctrl + C after clicking the table to copy its contents.<br><br>
<strong>${title}</strong>`;
  textFeedback.style.marginBottom = '1em';

  let table = document.createElement('div');
  let tableContainer = document.createElement('div');
  tableContainer.className = 'charts tableContainer';
  tableContainer.append(table);
  div.append(tableContainer);
  resizable(tableContainer.className);
  table.className = 'handsontable';
  tableContainer.style.overflow = 'scroll';
  tableContainer.style.height = '400px';
  tableContainer.style.width = '100%';

  let daysFormatter = (hotInstance, td, row, column, prop, value, cellProperties) => {
    value = parseFloat(value);
    td.innerHTML = value.toFixed(digits);
  };
  let hotSettings = (data) => {
    return {
      data: thisSeriesData,
      rowHeaders: true,
      colHeaders: ['Volume', 'Title', 'Date', 'Days Waited', 'Pages'],
      columns: [
        { data: 'volume', type: 'numeric' },
        // {data: 'consec'},
        { data: 'title' },
        {
          data: 'date',
          dateFormat: momentFormat,
          type: 'date',
          correctFormat: true,
        },
        { data: 'wait', renderer: daysFormatter, type: 'numeric' },
        { data: 'pageCount', type: 'numeric' },
      ],
      columnSorting: true,
      filters: true,
      dropdownMenu: true,
      licenseKey: 'non-commercial-and-evaluation',
      contextMenu: true,
      manualRowResize: true,
      manualColumnResize: true,
      manualRowMove: true,
      manualColumnMove: true,
      dropdownMenu: true,
      afterChange: updateData,
      afterCreateRow: addRow,
      afterRemoveRow: updateData,
    };
  };
  var HOT = new Handsontable(table, hotSettings(thisSeriesData));

  let btnDiv = document.createElement('div');
  let resetBtn = document.createElement('button');
  resetBtn.innerText = 'Reset data to original values';
  resetBtn.onclick = () => {
    thisSeriesData = JSON.parse(JSON.stringify(originalData));
    HOT.destroy();
    HOT = new Handsontable(table, hotSettings(thisSeriesData));
    updateData();
  };
  btnDiv.append(resetBtn);

  let sequentialBtn = document.createElement('button');
  sequentialBtn.innerText = 'Use sequential numbering (for series w/o vol. numbers)';
  sequentialBtn.onclick = () => {
    thisSeriesData.forEach((datum, index) => {
      datum.volume = index + 1;
    });
    updateData();
  };
  btnDiv.append(sequentialBtn);

  btnDiv.append(document.createElement('br'));
  let predictBtn = document.createElement('button');
  let predictField = document.createElement('input');
  predictBtn.innerText = 'Add prediction using value:';
  predictBtn.onclick = () => {
    HOT.alter('insert_row', thisSeriesData.length);
  };
  predictField.setAttribute('type', 'text');
  predictField.setAttribute('value', thisSeriesStats.weightedWait.toFixed(digits));

  let predictDropdown = document.createElement('select');
  let addDropdown = (input, value, text) => {
    let op = new Option();
    op.value = value;
    op.text = text;
    input.options.add(op);
  };
  addDropdown(
    predictDropdown,
    thisSeriesStats.weightedWait.toFixed(digits),
    `Weighted average (weighing recent waits more): ${thisSeriesStats.weightedWait.toFixed(digits)}`
  );
  addDropdown(
    predictDropdown,
    thisSeriesStats.medianWait.toFixed(digits),
    `Median time: ${thisSeriesStats.medianWait.toFixed(digits)}`
  );
  addDropdown(
    predictDropdown,
    thisSeriesStats.avgWait.toFixed(digits),
    `Average time: ${thisSeriesStats.avgWait.toFixed(digits)}`
  );
  predictDropdown.onchange = () => {
    resetBtn.onclick();
    predictField.value = predictDropdown.value;
    updateData();
  };
  btnDiv.append(predictBtn);
  btnDiv.append(predictField);
  btnDiv.append(predictDropdown);
  div.append(btnDiv);

  let constantDD = false;
  let constantDDText = document.createElement('p');
  constantDDText.innerText = 'Try to match release timings (consistent release date of month)';
  let constantDDSwitch = htmlToElement(`<label class="switch">
  <input type="checkbox">
  <span class="slider round"></span>
</label>`);
  constantDDSwitch.onclick = () => {
    constantDD = constantDDSwitch.firstElementChild.checked;
    updateData();
  };
  btnDiv.append(constantDDText);
  btnDiv.append(constantDDSwitch);

  let dataText = document.createElement('h2');

  div.append(dataText);

  function addRow(row) {
    let datum = thisSeriesData[row];
    datum.volume = datum.volume ?? thisSeriesData[row - 1].volume + 1;
    // TODO: add support for different waits
    datum.wait = datum.wait ?? parseFloat(predictField.value);
    datum.date =
      datum.date ??
      moment(thisSeriesData[row - 1].date, momentFormat)
        .add(datum.wait, 'd')
        .format(momentFormat);
    if (constantDD) {
      let datumDate = moment(datum.date, momentFormat);
      let constantDate = Math.round(
        thisSeriesData
          .map((datum) => moment(datum.date, momentFormat).date())
          .slice(0, thisSeriesData.length - 1)
          .reduce((prev, curr) => prev + curr, 0) /
          (thisSeriesData.length - 1)
      );
      if (datumDate.date() != constantDate) {
        let forward = moment(datumDate),
          backward = moment(datumDate);
        while (forward.date() != constantDate && backward.date() != constantDate) {
          forward.add(1, 'd');
          backward.subtract(1, 'd');
        }
        datumDate = forward.date() == constantDate ? forward : backward;
        datum.wait = datumDate.diff(moment(thisSeriesData[row - 1].date, momentFormat), 'd');
        datum.date = datumDate.format(momentFormat);
      }
    }
    datum.title = datum.title ?? `Predicted Volume ${datum.volume}`;
    updateData();
  }

  function updateData(event = null, data = null) {
    if (data == 'loadData') return;
    if (data == 'edit' && event && event[0][1].match(/wait|date/)) {
      let index = event[0][0];
      if (event[0][1].match(/wait/)) {
        thisSeriesData[index].date = moment(thisSeriesData[index - 1].date, momentFormat)
          .add(thisSeriesData[index].wait, 'd')
          .format(momentFormat);
      } else {
        thisSeriesData[index].wait = moment(thisSeriesData[index].date, momentFormat).diff(
          moment(thisSeriesData[index - 1].date, momentFormat),
          'd'
        );
      }
    }
    HOT.render();

    for (let i = 1; i < thisSeriesData.length; i++) {
      let datum = thisSeriesData[i];
      datum.wait = moment(datum.date, momentFormat).diff(
        moment(thisSeriesData[i - 1].date, momentFormat),
        'd'
      );
    }

    thisSeriesStats = getStats(thisSeriesData);
    dataText.innerHTML = `Average wait: ${thisSeriesStats.avgWait.toFixed(
      digits
    )} days, median wait: ${thisSeriesStats.medianWait.toFixed(
      digits
    )}, recency-weighted wait: ${thisSeriesStats.weightedWait.toFixed(
      digits
    )} days per volume<br><br>Average page count: ${thisSeriesStats.avgPages.toFixed(
      digits
    )} pages, median page count: ${thisSeriesStats.medianPages.toFixed(digits)} pages`;
    dataText.style.margin = '1em';

    let dateChartLine = dateChartThing.data.datasets.find((data) => data.label == thisPage.title);
    dateChartLine.data = thisSeriesData.map((datum) => {
      return { y: datum.volume, t: moment(datum.date, momentFormat) };
    });
    delayChartThing.data.labels = thisSeriesData.map((datum) => datum.volume);
    delayChartThing.data.datasets.find(
      (data) => data.label == thisPage.title
    ).data = thisSeriesData.map((datum) => datum.wait.toFixed(digits));
    pageChartThing.data.labels = thisSeriesData.map((datum) => datum.volume);
    pageChartThing.data.datasets.find(
      (data) => data.label == thisPage.title
    ).data = thisSeriesData.map((datum) => datum.pageCount);
    dateChartThing.update();
    delayChartThing.update();
    pageChartThing.update();
  }

  div.append(dateChart);
  div.append(delayChart);
  div.append(pageChart);

  let dateChartThing = new Chart(dateChart, {
    type: 'line',
    data: {
      datasets: [
        {
          label: title,
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
              axis.max = Math.max(axis.max, moment().valueOf()) + monthMs;
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
            value: moment(),
            borderColor: '#7577D9',
            borderWidth: 1,
          },
        ],
      },
    },
  });
  let delayChartThing = new Chart(delayChart, {
    type: 'bar',
    data: {
      datasets: [
        {
          label: thisPage.title,
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
  });
  let pageChartThing = new Chart(pageChart, {
    type: 'bar',
    data: {
      datasets: [
        {
          label: thisPage.title,
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
  });

  updateData();
})();

/**
 * Gets book URLs, element to insert, and title of a page
 * @param {document} doc page document
 * @param {string} url
 */
function getPageInfo(doc, url) {
  let bookURLs = [];
  let type = getPageType(url);
  if (type == 'bw') {
    insertChart = doc.querySelector('div.bookWidget');

    let titleElem = doc.querySelector('.bookWidget h1');
    title = titleElem ? titleElem.innerText : 'Unknown title';
    let match = title.match(/『(.*)』/);
    title = match ? match[1] : title;
    console.log(title);

    let bookslist = doc.querySelector('div.bookWidget > section');
    Array.from(bookslist.children).forEach((book) => {
      let em = book.querySelector('h2 a[href], h3 a[href]');
      if (em) bookURLs.unshift(em.href);
      else {
        em = book.querySelector('div');
        if (em.dataset.url) bookURLs.unshift(em.dataset.url);
      }
    });
    Array.from(bookslist.children).forEach((book) => {});
    console.log(bookURLs);
  }

  if (type == 'bwg') {
    insertChart = doc.querySelector('.book-list-area');

    title = doc.querySelector('.title-main-inner').textContent.split('\n')[0];
    console.log(title);

    let bookslist = doc.querySelector('.o-tile-list');
    Array.from(bookslist.children).forEach((book) => {
      let em = book.querySelector('.a-tile-thumb-img');
      bookURLs.unshift(em.href);
    });
    console.log(bookURLs);
  }

  return { bookURLs, insertChart, title };
}

/**
 * Fetches info about a series given a list of book URLs
 * @param {string[]} bookURLs list of URLs to fetch
 * @param {Element} textFeedback document element to update with feedback
 * @param {*} div thing to make resizable or not while getting books
 */
async function getSeriesInfo(bookURLs, textFeedback = null, div = null) {
  let seriesData = [];
  let vol = 1,
    lastDate;
  if (div) resizable(div.className, false);
  for (let url of bookURLs) {
    let { volume, date, pageCount, title } = await getInfo(url);
    if (!lastDate) lastDate = date;
    seriesData.push({
      volume: volume,
      title: title,
      date: date.format(momentFormat),
      wait: (date.valueOf() - lastDate.valueOf()) / dayMs,
      pageCount: pageCount,
      consec: vol,
    });
    lastDate = date;
    vol++;
    console.log({ volume, date, pageCount });
    if (textFeedback) {
      textFeedback.innerText = `Retrieved data for volume ${volume} released on ${dateString(
        date
      )} with ${pageCount} pages.`;
    }
  }

  if (div) resizable(div.className, true);
  return seriesData;
}

/**
 * Gets information about a given URL.
 * @param {string} url URL of page to fetch info of
 */
async function getInfo(url) {
  let volume, date, pageCount, title;
  let dateString;
  let doc = document.createElement('html');
  doc.innerHTML = await xmlhttpRequestText(url);

  let type = getPageType(url);

  if (type == 'bw') {
    let titleElem = doc.querySelector('.main-info h1');
    title = titleElem ? titleElem.innerText : 'Unknown title';

    let releaseDateElem = Array.from(doc.querySelectorAll('.work-detail-head')).find(
      (elem) => elem.innerText == '配信開始日'
    );
    dateString = releaseDateElem ? releaseDateElem.nextElementSibling.innerText : null;

    let pageCountElem = Array.from(doc.querySelectorAll('.work-detail-head')).find(
      (elem) => elem.innerText == 'ページ概数'
    );
    pageCount = pageCountElem ? parseInt(pageCountElem.nextElementSibling.innerText) : 0;
  } else if (type == 'bwg') {
    let titleElem = doc.querySelector('h1');
    title = titleElem ? titleElem.innerHTML.split('<span')[0] : '';

    dateString = Array.from(doc.querySelector('.product-detail').firstElementChild.children)
      .find((elem) => elem.firstElementChild.innerText == 'Available since')
      .lastElementChild.innerText.split(' (')[0];

    let pageCountString = Array.from(
      doc.querySelector('.product-detail').firstElementChild.children
    ).find((elem) => elem.firstElementChild.innerText == 'Page count').lastElementChild.innerText;
    pageCount = parseInt(/\d+/.exec(pageCountString)[0] ?? 1);
  }
  let matches = fullWidthNumConvert(title).match(volRegex);
  matches = matches ? matches.map((elem) => parseFloat(elem)) : [];
  // find last element in matches that's less than 100
  volume = matches.reverse().find((elem) => elem < 100) ?? 1;

  date = dateString ? moment(dateString) : null;

  doc.remove();

  return { volume, date, pageCount, title };
}

/**
 * given series info, return stats for waits and pages
 * @param {Object} data
 */
function getStats(data) {
  let waits = data.map((datum) => datum.wait).filter((wait) => wait > ignoreThreshold),
    pages = data.map((datum) => datum.pageCount).filter((pages) => pages > ignoreThreshold);

  let weightedWait = 0,
    i = waits.length,
    totalWeight = 0,
    currWeight = 1;
  while (i > 0) {
    i--;
    weightedWait += waits[i] * currWeight;
    totalWeight += currWeight;
    currWeight *= weightMultiple;
  }
  weightedWait /= totalWeight;
  return {
    avgWait: avg(waits),
    medianWait: median(waits),
    avgPages: avg(pages),
    medianPages: median(pages),
    weightedWait,
  };
}

/**
 * Returns the type of page of the url ('bw' or 'bwg') for bookwalker
 * and bookwalker global.
 * @param {string} url
 */
function getPageType(url) {
  let type = '';
  if (url.includes('bookwalker.jp') && !url.includes('global')) {
    type = 'bw';
  } else if (url.includes('global')) {
    type = 'bwg';
  }
  return type;
}

/**
 * converts full width characters in a string to being normal width
 * @param {string} fullWidthNum string to convert
 */
function fullWidthNumConvert(fullWidthNum) {
  return fullWidthNum.replace(/[\uFF10-\uFF19\uFF0e]/g, function (m) {
    return String.fromCharCode(m.charCodeAt(0) - 0xfee0);
  });
}

/**
 * Average of array.
 * @param {number[]} arr input array to average
 */
function avg(arr) {
  return arr.reduce((prev, curr) => prev + curr, 0) / arr.length;
}

/**
 * Median of array.
 * @param {number[]} values input array to find median of
 */
function median(values) {
  let values_ = [...values];
  if (values_.length === 0) return 0;

  values_.sort(function (a, b) {
    return a - b;
  });

  let half = Math.floor(values_.length / 2);

  if (values_.length % 2) return values_[half];

  return (values_[half - 1] + values_[half]) / 2.0;
}

/**
 * Format date to D MMMM YYYY
 * @param {Date} date
 */
function dateString(date) {
  return date.format('DD MMMM YYYY');
  // return date.toLocaleDateString('en-GB', {
  //   year: 'numeric',
  //   month: 'long',
  //   day: 'numeric',
  // });
}

/**
 * Sets resizing on an element.
 * @param {string} className the name of the class to resize
 * @param {*} resize whether to resize right and bottom
 */
function resizable(className, resize = true) {
  interact(`.${className}`)
    .resizable({
      // resize from all edges and corners
      edges: {
        left: false,
        right: resize,
        bottom: resize,
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

/**
 * Promise that gets a URL and resolves with the text
 * @param {string} url URL to get
 */
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
    data1[0].t.valueOf(),
    data1[0].y,
    point1.t.valueOf(),
    point1.y,
    data2[0].t.valueOf(),
    data2[0].y,
    point2.t.valueOf(),
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

// creates an element from an html string
function htmlToElement(html) {
  let template = document.createElement('template');
  html = html.trim(); // Never return a text node of whitespace as the result
  template.innerHTML = html;
  return template.content.firstChild;
}

/**
 * Adds needed CSS to the page.
 */
function addCSS() {
  GM_addStyle(`.charts {
    width: 95%;
    padding: 1em 1em;
    border-width: medium;
    border-style: dashed;
    border-color: #D6D8D9;
    touch-action: none;
    box-sizing: border-box;
    text-align: center;
    overflow: auto;
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
  GM_addStyle(GM_getResourceText('pikadayCSS'));
  GM_addStyle(GM_getResourceText('hotCSS'));
}
