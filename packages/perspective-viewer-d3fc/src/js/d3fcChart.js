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
    let dataset = this._config.series[0].data
      .map((mainValue, i) => ({
        mainValue: mainValue,
        crossValue: this._config.xAxis.categories[i],
        i: i
      })
    );

    console.log("dataset:", dataset);

    // let dataset = [
    //   { "organisation": "GOOG", "price": 410 },
    //   { "organisation": "MSFT", "price": 938 },
    //   { "organisation": "TSLA", "price": 512 }
    // ];

    if (this._mode === "x_bar") {
      renderXBar(this._config, this._container, dataset);
    } else if (this._mode === "y_bar") {
      renderYBar(this._config, this._container, dataset);
    } else {
      throw "EXCEPTION: chart type not recognised.";
    }
  }

  update() {
    this.render();
  }
}

function renderXBar(config, container, dataset) {
  let w = 600;
  let h = 700;

  let widthMultFactor = 1;
  function invertHeight(x) { return h - x } //don't require this because an x graph needn't invert.
  function widthMultiplier(x) { return x * widthMultFactor }
  function calculateRowHeight() { return h / dataset.length - padding }

  let padding = 2;

  let crossValueMeasures = "organisation";
  let mainValueMeasures = config.series[0].stack;

  let spaceForText = 40;
  widthMultFactor = (w - spaceForText) / Math.max.apply(null, dataset.map(x => x.mainValue));

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
    .attr("width", (d) => widthMultiplier(d.mainValue))
    .attr("height", h / dataset.length - padding)
    .attr("fill", (d) => `rgb( ${d.mainValue / 10}, ${d.mainValue / 50}, ${d.mainValue / 10})`);

  svg
    .selectAll("text")
    .data(dataset)
    .enter()
    .append("text")
    .text((d) => d.crossValue + " @ " + d.mainValue)
    .attr("text-anchor", "middle")
    .attr("y", (d, i) => (i * (h / dataset.length)) + (calculateRowHeight() / 2))
    .attr("x", (d) => (widthMultiplier(d.mainValue)) + (spaceForText / 2))
    .attr("fill", "white");
}

function renderYBar(config, container, dataset) {
  console.log("starting rendering y bar");

  let chart = fc.chartSvgCartesian(
    d3.scaleBand(), //x axis scales to fit bars equally 
    d3.scaleLinear()) //y axis scales linearly across values
    .xDomain(dataset.map(x => x.crossValue)) //all values from organisations list
    .xPadding(0.2)
    .yDomain([0, Math.max(...dataset.map(x => x.mainValue))]) //from 0 to the maximum value of price
    .yOrient('left') //move the axis to the left;

  let series = fc.autoBandwidth(fc.seriesSvgBar())
    .align("left")
    .crossValue(function (d) { return d.crossValue; })
    .mainValue(function (d) { return d.mainValue; });

  let gridlines = fc.annotationSvgGridline(); //Add gridlines

  let multi = fc.seriesSvgMulti()
    .series([series, gridlines]);

  chart.plotArea(multi);

  d3.select(container)
    .datum(dataset)
    .call(chart);

  console.log("completed rendering y bar");
}