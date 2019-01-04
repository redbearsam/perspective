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

import style from "../less/d3fc.less";
import template from "../html/d3fc.html";

import { make_tree_data, make_y_data, make_xy_data, make_xyz_data, make_xy_column_data } from "./series.js";
import { set_boost, set_category_axis, set_both_axis, default_config, set_tick_size } from "./config.js";
import { bindTemplate } from "@jpmorganchase/perspective-viewer/src/js/utils";
import { detectIE } from "@jpmorganchase/perspective/src/js/utils";

export const PRIVATE = Symbol("D3FC private");

//temporary method to log a label alongside a value for easier troubleshooting.
function logWithLabel(label, toLog) {
  console.log(label + ":");
  console.log(toLog);
}

//temporary method to log some useful data for testing.
function logSomeStuff(mode, perspecViewerEl, view, cols) {
  console.log(`mode is ${mode}`);
  logWithLabel("perspectiveViewerElement", perspecViewerEl);
  logWithLabel("view", view);  //show the data structure as it is ingested?
  logWithLabel("cols", cols); //cols is the default column values
  logWithLabel("aggregates", view._config.aggregate);
  logWithLabel("row_pivot", view._config.row_pivot);
}

function get_or_create_element(div) {
  let perspective_d3fc_element;
  this[PRIVATE] = this[PRIVATE] || {};
  if (!this[PRIVATE].chart) {
    perspective_d3fc_element = this[PRIVATE].chart = document.createElement("perspective-d3fc");
  } else {
    perspective_d3fc_element = this[PRIVATE].chart;
  }

  if (!document.body.contains(perspective_d3fc_element)) {
    div.innerHTML = "";
    div.appendChild(perspective_d3fc_element);
  }
  return perspective_d3fc_element;
}

async function drawStaticBar(perspecViewerEl, view, configs, mode, row_pivots, col_pivots, aggregates, hidden) {
  //NB: this is a placeholder. It just draws a constant thing atm.
  const cols = await view.to_columns();
  logSomeStuff(mode, perspecViewerEl, view, cols);

  const config = (configs[0] = default_config.call(perspecViewerEl, aggregates, mode));
  return config;
}

async function drawXBar(perspecViewerEl, view, configs, mode, row_pivots, col_pivots, aggregates, hidden, typesAndNames) {
  const cols = await view.to_columns();
  logSomeStuff(mode, perspecViewerEl, view, cols);

  const config = (configs[0] = default_config.call(perspecViewerEl, aggregates, mode));

  let [series, top] = make_y_data(cols, row_pivots, hidden);
  config.series = series;
  //config.colors = series.length <= 10 ? COLORS_10 : COLORS_20; //todo: ignore for now.
  config.legend.enabled = col_pivots.length > 0 || series.length > 1; //todo: ignore for now.
  config.legend.floating = series.length <= 20; //todo: ignore for now.
  config.plotOptions.series.dataLabels = { //todo: ignore for now.
    allowOverlap: false,
    padding: 10
  };
  set_category_axis(config, "xAxis", typesAndNames.xtree_type, top);
  Object.assign(config, {
    yAxis: {
      startOnTick: false,
      endOnTick: false,
      title: {
        text: aggregates.map(x => x.column).join(",  "),
        style: { color: "#666666", fontSize: "14px" }
      },
      labels: { overflow: "justify" }
    }
  });

  logWithLabel("config", config);
  return config;
}

async function drawYBar(perspecViewerEl, view, configs, mode, row_pivots, col_pivots, aggregates, hidden, typesAndNames) {
  const cols = await view.to_columns();
  logSomeStuff(mode, perspecViewerEl, view, cols);

  const config = (configs[0] = default_config.call(perspecViewerEl, aggregates, mode));

  let [series, top] = make_y_data(cols, row_pivots, hidden);
  config.series = series;
  //config.colors = series.length <= 10 ? COLORS_10 : COLORS_20; //todo: ignore for now.
  config.legend.enabled = col_pivots.length > 0 || series.length > 1; //todo: ignore for now.
  config.legend.floating = series.length <= 20; //todo: ignore for now.
  config.plotOptions.series.dataLabels = { //todo: ignore for now.
    allowOverlap: false,
    padding: 10
  };
  set_category_axis(config, "xAxis", typesAndNames.xtree_type, top);
  Object.assign(config, {
    yAxis: {
      startOnTick: false,
      endOnTick: false,
      title: {
        text: aggregates.map(x => x.column).join(",  "),
        style: { color: "#666666", fontSize: "14px" }
      },
      labels: { overflow: "justify" }
    }
  });

  logWithLabel("config", config);
  return config;
}

export const draw = mode =>
  async function (el, view, task) {
    // FIXME: super tight coupling to private viewer methods
    const row_pivots = this._get_view_row_pivots();
    const col_pivots = this._get_view_column_pivots();
    const aggregates = this._get_view_aggregates();
    const hidden = this._get_view_hidden(aggregates);

    logWithLabel("row_pivots", row_pivots);
    logWithLabel("col_pivots", col_pivots);
    logWithLabel("aggregates", aggregates);
    logWithLabel("hidden", hidden);

    const [schema, tschema] = await Promise.all([view.schema(), this._table.schema()]);
    let js, element;

    if (task.cancelled) {
      return;
    }

    let configs = [];

    let typesAndNames = {
      xaxis_name: aggregates.length > 0 ? aggregates[0].column : undefined,
      yaxis_name: aggregates.length > 1 ? aggregates[1].column : undefined,
      xtree_name: row_pivots.length > 0 ? row_pivots[row_pivots.length - 1] : undefined,
      ytree_name: col_pivots.length > 0 ? col_pivots[col_pivots.length - 1] : undefined,
      num_aggregates: aggregates.length - hidden.length
    }

    typesAndNames.xaxis_type = schema[typesAndNames.xaxis_name];
    typesAndNames.yaxis_type = schema[typesAndNames.yaxis_name];
    typesAndNames.xtree_type = schema[typesAndNames.xtree_name];
    typesAndNames.ytree_type = schema[typesAndNames.ytree_name];

    try {
      //todo: extract out each different mode to a different .js file.
      if (mode === "x_bar") {
        await drawXBar(this, view, configs, mode, row_pivots, col_pivots, aggregates, hidden, typesAndNames);
      } else if (mode === "y_bar") {
        await drawYBar(this, view, configs, mode, row_pivots, col_pivots, aggregates, hidden, typesAndNames);
      } else if (mode === "static_bar") {
        await drawStaticBar(this, view, configs, mode, row_pivots, col_pivots, aggregates, hidden);
      } else {
        throw "EXCEPTION: chart type not recognised.";
      }
    } finally {
      element = get_or_create_element.call(this, el);
      if (this.hasAttribute("updating")) {
        element.delete();
      }
    }

    element.render(mode, configs, this);
  };

@bindTemplate(template, style) // eslint-disable-next-line no-unused-vars
class D3FCElement extends HTMLElement {
  constructor() {
    super();
    this._charts = [];
  }

  connectedCallback() {
    this._container = this.shadowRoot.querySelector("#container");
  }

  render(mode, configs, callee) {

    console.log("rendering chart.");
    logWithLabel("mode", mode);
    logWithLabel("configs", configs);
    logWithLabel("callee", callee);

    this.delete();

    if (mode === "x_bar") {
      this.renderXBar(mode, configs, callee);
    } else if (mode === "y_bar") {
      this.renderYBar(mode, configs, callee);
    } else if (mode === "static_bar") {
      this.renderStaticBar(mode, configs, callee);
    } else {
      throw "EXCEPTION: chart type not recognised.";
    }

    console.log("chart rendered.");
  }

  resize() {
    if (this._charts && this._charts.length > 0) {
      this._charts.map(x => x.reflow());
    }
  }

  remove() {
    console.log("removing preexisting chart.");
    this._charts = [];
    for (let e of Array.prototype.slice.call(this._container.children)) {
      if (e.tagName === "svg") {
        this._container.removeChild(e);
      }
    }
  }

  delete() {
    //doesn't appear to require that anything be destroyed to prevent memory leaks. Pending further investigation.
    for (let chart of this._charts) {
      console.log("deleting preexisting chart.");
    }
    this.remove();
  }

  renderStaticBar(mode, configs, callee) {
    var w = 600;
    var h = 700;

    var heightMultFactor = 1;
    function invertHeight(x) { return h - x }
    function heightMultiplier(x) { return x * heightMultFactor }
    function calculateColWidth() { return w / dataset.length - padding }

    var padding = 2;
    var dataset = [
      { "organisation": "goog", "price": 410 },
      { "organisation": "msft", "price": 738 },
      { "organisation": "tsla", "price": 512 }
    ]
    heightMultFactor = (h - 20) / Math.max.apply(null, dataset.map(x => x.price));

    // Actual d3 stuff yo

    //var svg = d3.select(this._container)
    this._charts[0] = d3.select(this._container)
      .append("svg")
      .attr("width", w)
      .attr("height", h);

    //svg
    this._charts[0]
      .selectAll("rect")
      .data(dataset)
      .enter()
      .append("rect")
      .attr("x", (d, i) => (i * (w / dataset.length)))
      .attr("y", (d) => (invertHeight(heightMultiplier(d.price))))
      .attr("width", w / dataset.length - padding)
      .attr("height", (d) => heightMultiplier(d.price))
      .attr("fill", (d) => `rgb( ${d.price / 10}, ${d.price / 50}, ${d.price / 10})`);

    //svg
    this._charts[0]
      .selectAll("text")
      .data(dataset)
      .enter()
      .append("text")
      .text((d) => d.organisation + " @ " + d.price)
      .attr("text-anchor", "middle")
      .attr("x", (d, i) => (i * (w / dataset.length)) + (calculateColWidth() / 2))
      .attr("y", (d) => (invertHeight(heightMultiplier(d.price))))
      .attr("fill", "white");

    logWithLabel("d3", d3);
    logWithLabel("charts", this._charts);
  }

  renderXBar(mode, configs, callee) {
    var w = 600;
    var h = 700;

    var widthMultFactor = 1;
    function invertHeight(x) { return h - x } //don't require this because an x graph needn't invert.
    function widthMultiplier(x) { return x * widthMultFactor }
    function calculateRowHeight() { return h / dataset.length - padding }

    var padding = 2;

    let yAxisMeasures = "organisation";
    let xAxisMeasures = configs[0].series[0].stack;

    let dataset = configs[0].series[0].data
      .map((yAx, i) => ({
        price: yAx,
        organisation: configs[0].xAxis.categories[i],
        i: i
      })
      );

    let spaceForText = 40;
    widthMultFactor = (w - spaceForText) / Math.max.apply(null, dataset.map(x => x.price));

    // Actual d3 stuff yo

    //var svg = d3.select(this._container)
    this._charts[0] = d3.select(this._container)
      .append("svg")
      .attr("width", w)
      .attr("height", h);

    //svg
    this._charts[0]
      .selectAll("rect")
      .data(dataset)
      .enter()
      .append("rect")
      //.attr("x", (d) => (widthMultiplier(d.price))) //don't require this as we're starting fromt he left anyway.
      .attr("y", (d, i) => (i * (h / dataset.length)))
      .attr("width", (d) => widthMultiplier(d.price))
      .attr("height", h / dataset.length - padding)
      .attr("fill", (d) => `rgb( ${d.price / 10}, ${d.price / 50}, ${d.price / 10})`);

    //svg
    this._charts[0]
      .selectAll("text")
      .data(dataset)
      .enter()
      .append("text")
      .text( (d) => d.organisation)
      .attr("text-anchor", "middle")
      .attr("y", (d, i) => (i * (h / dataset.length)) + (calculateRowHeight()/2) )
      .attr("x", (d) => (widthMultiplier(d.price)) + (spaceForText/2) )
      .attr("fill", "white");

    logWithLabel("d3", d3);
    logWithLabel("charts", this._charts);
  }

  renderYBar(mode, configs, callee) {
    let w = 600;
    let h = 700;

    let heightMultFactor = 1;
    function invertHeight(x) { return h - x }
    function heightMultiplier(x) { return x * heightMultFactor }
    function calculateColWidth() { return w / dataset.length - padding }

    let padding = 2;

    let yAxisMeasures = configs[0].series[0].stack;
    let xAxisMeasures = "organisation";

    let dataset = configs[0].series[0].data
      .map((yAx, i) => ({
        yAxis: yAx,
        xAxis: configs[0].xAxis.categories[i],
        i: i
      })
      );

    logWithLabel("dataset", dataset);

    let spaceForText = 20;
    heightMultFactor = (h - spaceForText) / Math.max.apply(null, dataset.map(x => x.yAxis));

    // Actual d3 stuff yo

    this._charts[0] = d3.select(this._container)
      .append("svg")
      .attr("width", w)
      .attr("height", h);

    this._charts[0]
      .selectAll("rect")
      .data(dataset)
      .enter()
      .append("rect")
      .attr("x", (d, i) => (i * (w / dataset.length)))
      .attr("y", (d) => (invertHeight(heightMultiplier(d.yAxis))))
      .attr("width", w / dataset.length - padding)
      .attr("height", (d) => heightMultiplier(d.yAxis))
      .attr("fill", (d) => `rgb( ${d.yAxis / 10}, ${d.yAxis / 50}, ${d.yAxis / 10})`);

    this._charts[0]
      .selectAll("text")
      .data(dataset)
      .enter()
      .append("text")
      .text((d) => d.xAxis + " @ " + d.yAxis)
      .attr("text-anchor", "middle")
      .attr("x", (d, i) => (i * (w / dataset.length)) + (calculateColWidth() / 2))
      .attr("y", (d) => (invertHeight(heightMultiplier(d.yAxis))))
      .attr("fill", "white");

    logWithLabel("d3", d3);
    logWithLabel("charts", this._charts);
  }
}
