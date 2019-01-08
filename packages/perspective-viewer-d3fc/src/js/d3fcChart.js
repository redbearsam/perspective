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

export default class D3FCChart {
  constructor(mode, config, container) {
    this._mode = mode;
    this._config = config;
    this._container = container;
  }

  render() {
    if (this._mode === "x_bar") {
      renderXBar(this._config, this._container);
    } else if (this._mode === "y_bar") {
      renderYBar(this._config, this._container);
    } else {
      throw "EXCEPTION: chart type not recognised.";
    }
  }

  update() {
    this.render();
  }
}

function renderXBar(config, container) {
  let w = 600;
  let h = 700;

  let widthMultFactor = 1;
  function invertHeight(x) { return h - x } //don't require this because an x graph needn't invert.
  function widthMultiplier(x) { return x * widthMultFactor }
  function calculateRowHeight() { return h / dataset.length - padding }

  let padding = 2;

  let yAxisMeasures = "organisation";
  let xAxisMeasures = config.series[0].stack;

  let dataset = config.series[0].data
    .map((xAx, i) => ({
      xAxis: xAx,
      yAxis: config.xAxis.categories[i],
      i: i
    })
    );

  let spaceForText = 40;
  widthMultFactor = (w - spaceForText) / Math.max.apply(null, dataset.map(x => x.xAxis));

  // Actual d3 stuff yo

  let svg = d3.select(container)
    .append("svg")
    .attr("width", w)
    .attr("height", h);

  svg
    .selectAll("rect")
    .data(dataset)
    .enter()
    .append("rect")
    //.attr("x", (d) => (widthMultiplier(d.price))) //don't require this as we're starting fromt he left anyway.
    .attr("y", (d, i) => (i * (h / dataset.length)))
    .attr("width", (d) => widthMultiplier(d.xAxis))
    .attr("height", h / dataset.length - padding)
    .attr("fill", (d) => `rgb( ${d.xAxis / 10}, ${d.xAxis / 50}, ${d.xAxis / 10})`);

  svg
    .selectAll("text")
    .data(dataset)
    .enter()
    .append("text")
    .text((d) => d.yAxis + " @ " + d.xAxis)
    .attr("text-anchor", "middle")
    .attr("y", (d, i) => (i * (h / dataset.length)) + (calculateRowHeight() / 2))
    .attr("x", (d) => (widthMultiplier(d.xAxis)) + (spaceForText / 2))
    .attr("fill", "white");
}

function renderYBar(config, container) {
  console.log("rendering y bar");
  let width = 600;
  let height = 700;

  let dataset = [
    { "organisation": "GOOG", "price": 410 },
    { "organisation": "MSFT", "price": 938 },
    { "organisation": "TSLA", "price": 512 }
  ];

  var chart = fc.chartSvgCartesian(
    d3.scaleBand(),
    d3.scaleLinear())
    .xDomain(dataset.map(x => x.organisation))
    .xPadding(0.2)
    .yDomain([0, Math.max(...dataset.map(x => x.price))]);

  var series = fc.autoBandwidth(fc.seriesSvgBar())
    .align("left")
    .crossValue(function (d) { return d.organisation; })
    .mainValue(function (d) { return d.price; });

  chart.plotArea(series);

  d3.select(container)
    .datum(dataset)
    .call(chart);

  console.log("completed rendering y bar");
}