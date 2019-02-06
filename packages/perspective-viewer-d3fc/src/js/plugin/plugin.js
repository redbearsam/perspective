/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import charts from '../charts/charts';
import './template';

export const PRIVATE = Symbol("D3FC chart");

charts.forEach(chart => {
  global.registerPlugin(chart.plugin.type, {
    name: chart.plugin.name,
    create: drawChart(chart),
    resize: resizeChart,
    initial: {
        type: "number",
        count: 1
    },
    selectMode: "select",
    delete: deleteChart,
    max_size: chart.plugin.maxRenderSize
  });

});

function drawChart(chart) {
  return async function(el, view, task) {
    // FIXME: super tight coupling to private viewer methods
    const row_pivots = this._get_view_row_pivots();
    const col_pivots = this._get_view_column_pivots();
    const aggregates = this._get_view_aggregates();
    // const hidden = this._get_view_hidden(aggregates);

    const [tschema, json] = await Promise.all([this._table.schema(), view.to_json()]);
    if (task.cancelled) {
        return;
    }

    let settings = {
      crossValues: row_pivots.map(r => ({ name: r, type: tschema[r] })),
      mainValues: aggregates.map(a => ({ name: a.column, type: tschema[a.column] })),
      splitValues: col_pivots.map(r => ({ name: r, type: tschema[r] })),
      data: json.filter(col => col.__ROW_PATH__ && col.__ROW_PATH__.length > 0)
    };

    createOrUpdateChart.call(this, el, chart, settings);
  }
}

function createOrUpdateChart(div, chart, settings) {
  let perspective_d3fc_element;
  this[PRIVATE] = this[PRIVATE] || {};
  if (!this[PRIVATE].chart) {
      perspective_d3fc_element = this[PRIVATE].chart = document.createElement("perspective-d3fc-chart");
  } else {
      perspective_d3fc_element = this[PRIVATE].chart;
  }

  if (!document.body.contains(perspective_d3fc_element)) {
      div.innerHTML = "";
      div.appendChild(perspective_d3fc_element);
  }

  perspective_d3fc_element.render(chart, settings);
}

function resizeChart() {
  if (this[PRIVATE] && this[PRIVATE].chart) {
    const perspective_d3fc_element = this[PRIVATE].chart;
    perspective_d3fc_element.resize();
  }
}

function deleteChart() {
  if (this[PRIVATE] && this[PRIVATE].chart) {
    const perspective_d3fc_element = this[PRIVATE].chart;
    perspective_d3fc_element.delete();
  }
}