// ==UserScript==
// @name         Novel Stats Charts
// @namespace    https://github.com/MarvNC
// @version      1.24.2
// @description  A userscript that generates charts about novel series.
// @author       Marv
// @icon         https://avatars.githubusercontent.com/u/17340496
// @match        https://bookwalker.jp/series/*
// @match        https://global.bookwalker.jp/series/*
// @downloadURL  https://raw.githubusercontent.com/MarvNC/Book-Stats-Charts/main/release-dates.user.js
// @updateURL    https://raw.githubusercontent.com/MarvNC/Book-Stats-Charts/main/release-dates.user.js
// @require      https://cdn.jsdelivr.net/npm/handsontable@12.4.0/dist/handsontable.full.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.1/moment.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.9.4/Chart.min.js
// @require      https://cdn.jsdelivr.net/npm/chartjs-plugin-trendline@2.1.0/dist/chartjs-plugin-trendline.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/chartjs-plugin-annotation/0.5.7/chartjs-plugin-annotation.min.js
// @require      https://cdn.jsdelivr.net/npm/interactjs/dist/interact.min.js
// @resource     hotCSS https://cdn.jsdelivr.net/npm/handsontable@12.4.0/dist/handsontable.full.min.css
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @grant        GM_xmlhttpRequest
// @run-at       document-idle
// ==/UserScript==

const volRegex = /(\d+\.?\d*)/g;
const dayMs = 86400000;
const monthMs = 2592000000;
const weightMultiple = 0.8;
const ignoreThreshold = 10;
const digits = 0;
const momentFormat = 'YYYY/MM/DD';
const maxVol = 250;
const lineColor = '#7296F5';
const otherLineColor = '#f572af';

(async function () {
  let pageType = getPageType(document.URL);
  if (pageType == 'bw' && !document.URL.match(/\d+\/list/)) {
    window.location.replace(
      `https://bookwalker.jp/series/${
        document.URL.match(/\/series\/(\d+)/)[1]
      }/list`
    );
  } else if (pageType == 'bwg') {
    // Add JP bookwalker search link
    let jpTitleElem = document.querySelector('h1 > span > div');
    if (jpTitleElem) {
      let jpTitle = jpTitleElem.innerText.slice(2).split(',')[0];
      jpTitleElem.innerHTML = jpTitleElem.innerHTML.replace(
        jpTitle,
        `<a href="https://bookwalker.jp/search/?qcat=&word=${jpTitle}">${jpTitle}</a>`
      );
    }
  }

  let dateChart = document.createElement('CANVAS');
  let delayChart = document.createElement('CANVAS');
  let pageChart = document.createElement('CANVAS');

  let thisPage = await getPageInfo(document, document.URL);
  console.log(thisPage);

  let textFeedback = document.createElement('h1');
  textFeedback.className = 'titleHeader';

  let div = document.createElement('div');
  div.className = 'charts';
  div.style.width = `95%`;
  resizable(div.className);

  thisPage.insertChart.append(div);
  div.append(textFeedback);

  addCSS();

  let thisSeriesData = await getSeriesInfo(
    thisPage.bookURLs,
    textFeedback,
    div
  );

  textFeedback.innerHTML = `Drag from the right side to resize.<br>`;
  textFeedback.style.marginBottom = '1em';

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
    let otherPage = await getPageInfo(doc, url);
    let otherSeriesData = await getSeriesInfo(otherPage.bookURLs, compareBtn);
    let otherSeries = new Series(
      otherPage.title,
      otherSeriesData,
      dateChartThing
    );
    div.insertBefore(otherSeries.container, dateChart);
    otherSeries.lineColor = otherLineColor;
    otherSeries.updateData();

    let intersectBtn = document.createElement('button');
    let intersectText;
    intersectBtn.innerText =
      'Guess at an intersection date of these two series using current wait values';
    intersectBtn.onclick = async () => {
      if (!intersectText) {
        intersectText = document.createElement('h2');
        intersectText.style.padding = '.5em 0em .5em 0em';
        div.insertBefore(intersectText, dateChart);
      }
      let mainWait = parseInt(thisSeries.predictField.value),
        otherWait = parseInt(otherSeries.predictField.value),
        mainPoint = () =>
          thisSeries.seriesData[thisSeries.seriesData.length - 1],
        otherPoint = () =>
          otherSeries.seriesData[otherSeries.seriesData.length - 1];
      if (
        (mainWait < otherWait && mainPoint().volume < otherPoint().volume) ||
        (mainWait > otherWait && mainPoint().volume > otherPoint().volume)
      ) {
        let older = () => {
          let mainDate = moment(mainPoint().date, momentFormat),
            otherDate = moment(otherPoint().date, momentFormat);
          return mainDate.add(mainWait, 'd').valueOf() >
            otherDate.add(otherWait, 'd').valueOf()
            ? otherSeries
            : thisSeries;
        };
        do {
          older().addRow();
        } while (mainPoint().volume != otherPoint().volume);
        let latest = () => {
          let mainDate = moment(mainPoint().date, momentFormat),
            otherDate = moment(otherPoint().date, momentFormat);
          return mainDate.valueOf() > otherDate.valueOf()
            ? mainDate
            : otherDate;
        };
        intersectText.innerText = `These series are predicted to intersect at volume ${
          mainPoint().volume
        } on ${dateString(latest())}.`;
      } else
        intersectText.innerText = `Looks like these series don't intersect with the given values.`;
    };
    div.insertBefore(intersectBtn, dateChart);
  };

  let dateChartThing = new Chart(dateChart, {
    type: 'line',
    data: {
      datasets: [],
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

  let thisSeries = new Series(
    thisPage.title,
    thisSeriesData,
    dateChartThing,
    delayChartThing,
    pageChartThing
  );

  div.append(compare);
  div.append(compareBtn);
  div.append(thisSeries.container);

  div.append(dateChart);
  div.append(delayChart);
  div.append(pageChart);

  thisSeries.updateData();
})();

/**
 * Represents a series, and returns a div with stuff in it.
 */
class Series {
  constructor(
    title,
    seriesData,
    dateChartThing,
    delayChartThing = null,
    pageChartThing = null
  ) {
    this.title = title;
    this.seriesData = seriesData;
    this.originalData = JSON.parse(JSON.stringify(this.seriesData));
    this.dateChartThing = dateChartThing;
    this.delayChartThing = delayChartThing;
    this.pageChartThing = pageChartThing;
    this.seriesStats = getStats(this.seriesData);
    this.container = document.createElement('div');
    this.lineColor = lineColor;

    this.container.className = 'series';

    let table = document.createElement('div');
    let tableContainer = document.createElement('div');
    tableContainer.className = 'charts tableContainer';
    tableContainer.append(table);
    resizable(tableContainer.className);
    table.className = 'handsontable';
    tableContainer.style.overflowY = 'scroll';
    tableContainer.style.height = 'auto';
    tableContainer.style.width = '100%';

    let daysFormatter = (
      hotInstance,
      td,
      row,
      column,
      prop,
      value,
      cellProperties
    ) => {
      value = parseFloat(value);
      td.innerHTML = value.toFixed(digits);
    };
    let hotSettings = (data) => {
      return {
        data: this.seriesData,
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
        afterChange: (event, data) => {
          this.updateData(event, data);
        },
        afterCreateRow: (row) => {
          this.addRow(row);
        },
        afterRemoveRow: () => {
          this.updateData();
        },
      };
    };
    this.HOT = new Handsontable(table, hotSettings(this.seriesData));

    let btnDiv = document.createElement('div');
    let resetBtn = document.createElement('button');
    resetBtn.innerText = 'Reset data to original values';
    resetBtn.onclick = () => {
      this.seriesData = JSON.parse(JSON.stringify(this.originalData));
      this.HOT.destroy();
      this.HOT = new Handsontable(table, hotSettings(this.seriesData));
      this.updateData();
    };
    btnDiv.append(resetBtn);

    let sequentialBtn = document.createElement('button');
    sequentialBtn.innerText =
      'Use sequential numbering (for series w/o vol. numbers)';
    sequentialBtn.onclick = () => {
      this.seriesData.forEach((datum, index) => {
        datum.volume = index + 1;
      });
      this.updateData();
    };
    btnDiv.append(sequentialBtn);

    btnDiv.append(document.createElement('br'));
    this.predictBtn = document.createElement('button');
    this.predictField = document.createElement('input');
    this.predictBtn.innerText = 'Add prediction using value:';
    this.predictBtn.onclick = () => {
      this.addRow();
    };
    this.predictField.setAttribute('type', 'text');
    this.predictField.setAttribute(
      'value',
      this.seriesStats.weightedWait.toFixed(digits)
    );

    let predictDropdown = document.createElement('select');
    let addDropdown = (input, value, text) => {
      let op = new Option();
      op.value = value;
      op.text = text;
      input.options.add(op);
    };
    addDropdown(
      predictDropdown,
      this.seriesStats.weightedWait.toFixed(digits),
      `Weighted average (weighing recent waits more): ${this.seriesStats.weightedWait.toFixed(
        digits
      )}`
    );
    addDropdown(
      predictDropdown,
      this.seriesStats.medianWait.toFixed(digits),
      `Median time: ${this.seriesStats.medianWait.toFixed(digits)}`
    );
    addDropdown(
      predictDropdown,
      this.seriesStats.avgWait.toFixed(digits),
      `Average time: ${this.seriesStats.avgWait.toFixed(digits)}`
    );
    predictDropdown.onchange = () => {
      this.predictField.value = predictDropdown.value;
      this.updateData();
    };
    btnDiv.append(this.predictBtn);
    btnDiv.append(this.predictField);
    btnDiv.append(predictDropdown);

    this.constantDD = false;
    let constantDDText = document.createElement('p');
    constantDDText.innerText =
      'Try to match release timings (consistent release date of month)';
    let constantDDSwitch = htmlToElement(`<label class="switch">
    <input type="checkbox">
    <span class="slider round"></span>
  </label>`);
    constantDDSwitch.onclick = () => {
      this.constantDD = constantDDSwitch.firstElementChild.checked;
      this.updateData();
    };
    btnDiv.append(constantDDText);
    btnDiv.append(constantDDSwitch);

    let titleElem = document.createElement('h1');
    titleElem.className = 'titleHeader';
    titleElem.innerHTML = `<strong>${this.title}</strong>`;
    this.dataText = document.createElement('h2');

    this.container.append(titleElem);
    this.container.append(this.dataText);
    this.container.append(btnDiv);
    this.container.append(tableContainer);
  }

  addRow(row = null) {
    if (!row) {
      this.HOT.alter('insert_row', this.seriesData.length);
      return;
    }
    let datum = this.seriesData[row];
    datum.volume = datum.volume ?? this.seriesData[row - 1].volume + 1;
    // TODO: add support for different waits
    datum.wait = datum.wait ?? parseFloat(this.predictField.value);
    datum.date =
      datum.date ??
      moment(this.seriesData[row - 1].date, momentFormat)
        .add(datum.wait, 'd')
        .format(momentFormat);
    if (this.constantDD) {
      let datumDate = moment(datum.date, momentFormat);
      let constantDate = Math.round(
        this.seriesData
          .map((datum) => moment(datum.date, momentFormat).date())
          .slice(0, this.seriesData.length - 1)
          .reduce((prev, curr) => prev + curr, 0) /
          (this.seriesData.length - 1)
      );
      if (datumDate.date() != constantDate) {
        let forward = moment(datumDate),
          backward = moment(datumDate);
        while (
          forward.date() != constantDate &&
          backward.date() != constantDate
        ) {
          forward.add(1, 'd');
          backward.subtract(1, 'd');
        }
        datumDate = forward.date() == constantDate ? forward : backward;
        datum.wait = datumDate.diff(
          moment(this.seriesData[row - 1].date, momentFormat),
          'd'
        );
        datum.date = datumDate.format(momentFormat);
      }
    }
    datum.title = datum.title ?? `Predicted Volume ${datum.volume}`;
    this.updateData();
  }

  updateData(event = null, data = null) {
    if (data == 'loadData') return;
    if (data == 'edit' && event && event[0][1].match(/wait|date/)) {
      let index = event[0][0];
      if (event[0][1].match(/wait/)) {
        this.seriesData[index].date = moment(
          this.seriesData[index - 1].date,
          momentFormat
        )
          .add(this.seriesData[index].wait, 'd')
          .format(momentFormat);
      } else {
        this.seriesData[index].wait = moment(
          this.seriesData[index].date,
          momentFormat
        ).diff(moment(this.seriesData[index - 1].date, momentFormat), 'd');
      }
    }
    this.HOT.render();

    this.seriesData[0].wait = 0;
    for (let i = 1; i < this.seriesData.length; i++) {
      let datum = this.seriesData[i];
      datum.wait = moment(datum.date, momentFormat).diff(
        moment(this.seriesData[i - 1].date, momentFormat),
        'd'
      );
    }

    this.seriesStats = getStats(this.seriesData);
    this.dataText.innerHTML = `Average wait: ${this.seriesStats.avgWait.toFixed(
      digits
    )} days, median wait: ${this.seriesStats.medianWait.toFixed(
      digits
    )} days, recency-weighted wait: ${this.seriesStats.weightedWait.toFixed(
      digits
    )} days, standard deviation: ${this.seriesStats.stdDev.toFixed(
      digits
    )} days, days since last volume: ${
      this.seriesStats.daysSince
    } days, z value: ${this.seriesStats.zValue.toFixed(
      4
    )} deviations from mean, probability of new vol. by today:
    ${this.seriesStats.pValue.toFixed(
      4
    )}<br><br>Average page count: ${this.seriesStats.avgPages.toFixed(
      digits
    )} pages, median page count: ${this.seriesStats.medianPages.toFixed(
      digits
    )} pages`;
    this.dataText.style.margin = '1em';

    let dateChartLine = this.dateChartThing.data.datasets.find(
      (data) => data.label == this.title
    );
    if (!dateChartLine) {
      this.dateChartThing.data.datasets.push({
        label: this.title,
        fill: false,
        borderColor: this.lineColor,
        trendlineLinear: {
          style: 'rgba(255,105,180, .6)',
          lineStyle: 'dotted',
          width: 2,
        },
      });
      dateChartLine =
        this.dateChartThing.data.datasets[
          this.dateChartThing.data.datasets.length - 1
        ];
    }
    dateChartLine.data = this.seriesData.map((datum) => {
      return { y: datum.volume, t: moment(datum.date, momentFormat) };
    });
    this.dateChartThing.update();
    if (this.delayChartThing) {
      this.delayChartThing.data.labels = this.seriesData.map(
        (datum) => datum.volume
      );
      this.delayChartThing.data.datasets.find(
        (data) => (data.label = this.title)
      ).data = this.seriesData.map((datum) => datum.wait.toFixed(digits));
      this.delayChartThing.update();
    }
    if (this.pageChartThing) {
      this.pageChartThing.data.labels = this.seriesData.map(
        (datum) => datum.volume
      );
      this.pageChartThing.data.datasets.find(
        (data) => data.label == this.title
      ).data = this.seriesData.map((datum) => datum.pageCount);
      this.pageChartThing.update();
    }
  }
}

/**
 * Gets book URLs, element to insert, and title of a page
 * @param {document} doc page document
 * @param {string} url
 */
async function getPageInfo(doc, url, main = true) {
  let bookURLs = [],
    insertChart,
    title;
  let type = getPageType(url);
  if (type == 'bw') {
    insertChart = doc.querySelector('section.o-contents-section');
    let titleElem = doc.querySelector('h2.o-contents-section__title');
    title = titleElem ? titleElem.innerText : 'Unknown title';
    let match = title.match(/『(.*)』/);
    title = match ? match[1] : title;

    let last = doc.querySelector('div.pager.clearfix > ul .last a[href]');
    if (main && last) {
      for (let i = 1; i <= parseInt(last.href.split('').pop()); i++) {
        let otherUrl = last.href.substr(0, last.href.length - 1) + i;
        console.log(otherUrl);
        let otherDoc = document.createElement('html');
        otherDoc.innerHTML = await xmlhttpRequestText(otherUrl);
        bookURLs.unshift(
          ...(await getPageInfo(otherDoc, otherUrl, false)).bookURLs
        );
        otherDoc.remove();
      }
    } else {
      [
        ...doc.querySelector('.o-contents-section__body .m-tile-list').children,
      ].forEach((book) => {
        let em = book.querySelector('p a[href]');
        if (em) bookURLs.unshift(em.href);
        else {
          em = book.querySelector('div');
          if (em.dataset.url) bookURLs.unshift(em.dataset.url);
        }
      });
    }
  }

  if (type == 'bwg') {
    insertChart = doc.querySelector('.book-list-area');
    title = doc
      .querySelector('.title-main-inner')
      .childNodes[0].textContent.trim();
    console.log(title);

    let bookslist = doc.querySelector('.o-tile-list');
    Array.from(bookslist.children).forEach((book) => {
      let em = book.querySelector('.o-tile-book-info a[title]');
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
      )} with ${pageCount} pages. (${vol}/${bookURLs.length})`;
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
  let volume, date, pageCount, title, dateString;
  let doc = document.createElement('html');
  doc.innerHTML = await xmlhttpRequestText(url);

  let type = getPageType(url);

  if (type == 'bw') {
    let titleElem = doc.querySelector('h1.p-main__title');
    title = titleElem ? titleElem.innerText : 'Unknown title';

    const dataLabels = [...doc.querySelector('.p-information__data').children];
    let originalDateElem = dataLabels.find(
      (elem) => elem.innerText == '底本発行日'
    );
    let releaseDateElem = dataLabels.find(
      (elem) => elem.innerText == '配信開始日'
    );
    let originalDateString = originalDateElem
      ? originalDateElem.nextElementSibling.innerText
      : null;
    let releaseDateString = releaseDateElem
      ? releaseDateElem.nextElementSibling.innerText
      : null;
    // Sometimes the date is deformed
    dateString =
      originalDateString?.length >= 10 ? originalDateString : releaseDateString;

    let pageCountElem = [
      ...doc.querySelector('.p-information__data').children,
    ].find((elem) => elem.innerText == 'ページ概数');
    pageCount = pageCountElem
      ? parseInt(pageCountElem.nextElementSibling.innerText)
      : 0;
  } else if (type == 'bwg') {
    let titleElem = doc.querySelector('h1');
    title = titleElem ? titleElem.innerHTML.split('<span')[0] : '';

    dateString = Array.from(
      doc.querySelector('.product-detail').firstElementChild.children
    )
      .find((elem) => elem.firstElementChild.innerText == 'Available since')
      .lastElementChild.innerText.split(' (')[0];

    let pageCountString = Array.from(
      doc.querySelector('.product-detail').firstElementChild.children
    ).find((elem) => elem.firstElementChild.innerText == 'Page count')
      .lastElementChild.innerText;
    pageCount = parseInt(/\d+/.exec(pageCountString)[0] ?? 1);
  }
  let matches = fullWidthNumConvert(title).match(volRegex);
  matches = matches ? matches.map((elem) => parseFloat(elem)) : [];
  // find last element in matches that's less than max vol
  volume = matches.reverse().find((elem) => elem < maxVol) ?? 1;

  date = dateString ? moment(dateString) : null;

  doc.remove();

  return { volume, date, pageCount, title };
}

/**
 * given series info, return stats for waits and pages
 * @param {Object[]} data
 */
function getStats(data) {
  let waits = data
      .map((datum) => datum.wait)
      .filter((wait) => wait > ignoreThreshold),
    pages = data
      .map((datum) => datum.pageCount)
      .filter((pages) => pages > ignoreThreshold);
  let avgWait = avg(waits),
    medianWait = median(waits),
    avgPages = avg(pages),
    medianPages = median(pages);

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

  let stdDev = getStandardDeviation(waits),
    daysSince = moment().diff(
      moment(data[data.length - 1].date, momentFormat),
      'd'
    ),
    zValue = (daysSince - avgWait) / stdDev,
    probability = getZPercent(zValue);
  weightedWait /= totalWeight;
  return {
    avgWait,
    medianWait,
    avgPages,
    medianPages,
    weightedWait,
    stdDev,
    daysSince,
    zValue,
    pValue: probability,
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
 * Standard deviation (from stackoverflow)
 * @param {number[]} array array to get std dev of
 */
function getStandardDeviation(array) {
  const n = array.length;
  const mean = avg(array);
  return Math.sqrt(avg(array.map((x) => Math.pow(x - mean, 2))));
}

/**
 * Returns the p-value of a given z-score. (from stackoverflow)
 * @param {number} z standard deviations from mean
 */
function getZPercent(z) {
  //z == number of standard deviations from the mean

  //if z is greater than 6.5 standard deviations from the mean
  //the number of significant digits will be outside of a reasonable
  //range
  if (z < -6.5) return 0.0;
  if (z > 6.5) return 1.0;

  let factK = 1,
    sum = 0,
    term = 1,
    k = 0,
    loopStop = Math.exp(-23);
  while (Math.abs(term) > loopStop) {
    term =
      (((0.3989422804 * Math.pow(-1, k) * Math.pow(z, k)) /
        (2 * k + 1) /
        Math.pow(2, k)) *
        Math.pow(z, k + 1)) /
      factK;
    sum += term;
    k++;
    factK *= k;
  }
  sum += 0.5;

  return sum;
}

/**
 * Format date to D MMMM YYYY
 * @param {Date} date
 */
function dateString(date) {
  return date.format('DD MMMM YYYY');
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
 * Promise that gets a URL and resolves with the text (because cors)
 * @param {string} url URL to get
 */
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

/**
 * Makes an html element from a string
 * @param {string} html html to make
 */
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
    width: 100%;
    padding: 1em 1em;
    border-width: medium;
    border-style: dashed;
    border-color: #D6D8D9;
    touch-action: none;
    box-sizing: border-box;
    text-align: center;
    height: auto;
    overflow: auto;
  }
  .series {
    padding: 0em;
    height: auto;
  }
  .titleHeader {
    font-size: large;
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
  GM_addStyle(GM_getResourceText('hotCSS'));
}
