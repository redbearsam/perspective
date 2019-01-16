/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import * as fc from "d3fc";
import * as d3 from "d3";
import * as d3Legend from "d3-svg-legend";

export default class D3FCChart {
  constructor(mode, config, container) {
    this._mode = mode;
    this._config = config;
    this._container = container;
  }

  render() {
    console.log("config:", this._config);

    if (this._mode === "x_bar") {
      renderBar(this._config, this._container, true);
    } else if (this._mode === "y_bar") {
      renderBar(this._config, this._container, false);
    } else {
      throw "EXCEPTION: chart type not recognised.";
    }
  }

  update() {
    this.render();
  }

}

function renderBar(config, container, horizontal) {
  let orientation = horizontal ? "horizontal" : "vertical";

  let labels = interpretLabels(config);
  let isSplitBy = labels.splitLabel != null;

  let [dataset, stackedBarData, color] = interpretDataset(isSplitBy, config);

  let legend = configureLegend(isSplitBy, color, container);
  let barSeries = configureBarSeries(isSplitBy, orientation, dataset);
  let gridlines = configureGrid(horizontal);
  let [xScale, yScale] = configureScale(isSplitBy, horizontal, dataset, stackedBarData);

  // groups of svgs we need to render
  let multi = configureMultiSvg(isSplitBy, gridlines, barSeries, dataset, color);

  let chart = fc.chartSvgCartesian(xScale, yScale)
    .yOrient('left')
    .plotArea(multi);

  styleDark(chart);

  d3.select(container)
    .datum(dataset)
    .call(chart);

  drawLegend(legend, container);
}

// CONFIGURE CHART ELEMENTS
function configureBarSeries(isSplitBy, orientation, dataset) {
  let barSeries;
  if (isSplitBy) {
    let stackedBarSeries = fc.autoBandwidth(fc.seriesSvgBar())
      .align("left")
      .orient(orientation)
      .crossValue(d => d.data["group"])
      .mainValue(d => d[1])
      .baseValue(d => d[0]);

    barSeries = [...dataset.map(() => stackedBarSeries)];
  } else {
    barSeries = fc.autoBandwidth(fc.seriesSvgBar())
      .align("left")
      .orient(orientation)
      .crossValue(d => d.crossValue)
      .mainValue(d => d.mainValue);
  }

  console.log("barSeries:", barSeries);

  return barSeries;
}

function configureGrid(horizontal) {
  let mainGrid = (x => x
    .style("opacity", "0.3")
    .style("stroke-width", "1.0")
  );

  let crossGrid = (x => x
    .style("display", "none")
  );

  let [xGrid, yGrid] = horizontal ? [mainGrid, crossGrid] : [crossGrid, mainGrid];

  let gridlines = fc.annotationSvgGridline()
    .xDecorate(xGrid)
    .yDecorate(yGrid);

  return gridlines;
}

function configureScale(isSplitBy, horizontal, dataset, stackedBarData) {
  let mainScale;
  let crossScale;
  if (isSplitBy) {
    let mainExtent =
      fc.extentLinear()
        .accessors([a => a.map(d => d[1])])
        .pad([0, 1])
        .padUnit('domain');

    mainScale =
      d3.scaleLinear()
        .domain(mainExtent(dataset));

    crossScale =
      d3.scaleBand()
        .domain(stackedBarData.map((entry) => entry["group"]))
        .padding(0.5);
  } else {
    mainScale =
      d3.scaleLinear()
        .domain([0, Math.max(...dataset.map(x => x.mainValue))])

    crossScale =
      d3.scaleBand()
        .domain(dataset.map(x => x.crossValue))
        .padding(0.5);
  }

  let [xScale, yScale] = horizontal ? [mainScale, crossScale] : [crossScale, mainScale];
  return [xScale, yScale];
}

function configureMultiSvg(isSplitBy, gridlines, barSeries, dataset, color) {
  let multi;
  if (isSplitBy) {
    let multiWithOutGrid = fc.seriesSvgMulti()
      .mapping((data, index, nodes) => data[index])
      .series(barSeries)
      .decorate((selection) => {
        selection
          .each((data, index, nodes) => {
            d3.select(nodes[index])
              .selectAll('g.bar')
              .attr('fill', color(dataset[index].key));
          });
      });

    multi = fc.seriesSvgMulti()
      .series([gridlines, multiWithOutGrid]);
  } else {
    multi = fc.seriesSvgMulti()
      .series([gridlines, barSeries])
      .decorate((selection) => selection
        .filter((_, index) => index !== 0)
        .each((data, index, nodes) => {
          d3.select(nodes[index])
            .selectAll("g.bar")
            .attr("fill", "#1f78b4")
            .attr("opacity", 0.9);
        })
      );
  }

  return multi;
}

function configureLegend(isSplitBy, color, container) {
  if (!isSplitBy) {
    return;
  }

  let legend = d3Legend
    .legendColor()
    .shape('circle')
    .shapeRadius(6)
    .orient('vertical')
    .scale(color)
    .on('cellclick', function (d) {
      toggleBars(d);
      const legendCell = d3.select(this);
      legendCell.classed('hidden', !legendCell.classed('hidden'));
    });

  function toggleBars(colorClass) {
    console.log(colorClass);
    d3.select(container).selectAll(`g.${colorClass}`)
      .classed('hidden', function () {  // toggle "hidden" class
        return !d3.select(this).classed('hidden');
      });
  }

  return legend;
}


// DRAW CHART ELEMENTS
function drawLegend(legend, container) {
  if (legend) {
    d3.select(container)
      .append("svg")
      .attr("class", "legend")
      .style("z-index", "2")
      .call(legend);
  }
}


// PREP DATA
function interpretLabels(config) {
  let labels = {
    mainLabel: null,
    crossLabel: null,
    splitLabel: null
  };

  labels.mainLabel = config.series[0].stack;
  labels.crossLabel = config.row_pivots[0];
  labels.splitLabel = config.col_pivots[0];

  console.log("labels:", labels);

  return labels;
}

function interpretDataset(isSplitBy, config) {
  if (isSplitBy) {
    let [dataset, stackedBarData, color] = interpretStackDataset(config);
    console.log("dataset: ", dataset);
    return [dataset, stackedBarData, color];
  }

  let { series, xAxis } = config;
  let dataset;

  //simple array of data
  dataset = series[0].data.map(
    (mainValue, i) => ({
      mainValue: mainValue,
      crossValue: xAxis.categories.length > 0 ? xAxis.categories[i] : i
    })
  );

  console.log("dataset: ", dataset);
  return [dataset, null, null];
}

function interpretStackDataset(config) {
  //Convert data to Stacked Bar Chart Format
  let keys = config.xAxis.categories.length > 0 ? config.xAxis.categories : [...Array(config.series[0].data.length)].map((_, i) => i)

  let stackedBarData = keys.map((group, i) => {
    let row = { group }
    config.series.forEach(split => {
      row[split.name] = split.data[i] || 0;
    });
    return row;
  });

  let stack = d3.stack().keys(Object.keys(stackedBarData[0]).filter(r => r !== "group"));
  let dataset = stack(stackedBarData);
  let color = d3.scaleOrdinal(d3.schemeCategory10).domain(dataset.map(s => s.key));
  return [dataset, stackedBarData, color];
}


// STYLE CHART
function styleDark(chart) {
  //todo: invert these depending on horizontal variable which should be passed in.

  chart.xDecorate(selection => {
    let groups = selection._groups[0];
    let parent = selection._parents[0];
    let totalWidth = parent.clientWidth;
    let tickSpacing = totalWidth / (groups.length);

    selection.attr("transform", "translate(0, 0)")
    selection.select("text")
      .attr("fill", "white")
      .attr("transform", (x, i) => `translate(${(i * tickSpacing) + (tickSpacing / 2)}, 9)`)
    selection.select("path") //select the tick marks
      .attr("stroke", "white")
      .attr("transform", (x, i) => `translate(${i * tickSpacing}, 0)`)
  });

  chart.yDecorate(selection => {
    selection.select("path") //select the tick marks
      .attr("stroke", "#2f3136")
    selection.select("text") //y axis text
      .attr("fill", "white")
  });

}