/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import * as fc from "d3fc";

export const chartSvgFactory = (xAxis, yAxis) => chartFactory(xAxis, yAxis, fc.chartSvgCartesian);
export const chartCanvasFactory = (xAxis, yAxis) => chartFactory(xAxis, yAxis, fc.chartCanvasCartesian);

const chartFactory = (xAxis, yAxis, cartesian) => {
    const chart = cartesian({
        xScale: xAxis.scale,
        yScale: yAxis.scale,
        xAxis: xAxis.component,
        yAxis: yAxis.component
    })
        .xDomain(xAxis.domain)
        .xLabel(xAxis.label)
        .xAxisHeight(xAxis.size)
        .xDecorate(xAxis.decorate)
        .yDomain(yAxis.domain)
        .yLabel(yAxis.label)
        .yAxisWidth(yAxis.size)
        .yDecorate(yAxis.decorate)
        .yOrient("left");

    if (chart.yNice) chart.yNice();
    if (chart.xNice) chart.xNice();

    return chart;
};
