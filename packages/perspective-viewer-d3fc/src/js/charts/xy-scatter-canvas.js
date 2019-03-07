/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import * as fc from "d3fc";
import * as mainAxis from "../axis/mainAxis";
import {symbolTypeFromGroups} from "../series/pointSeries";
import {pointSeriesCanvas} from "../series/pointSeriesCanvas";
import {pointData} from "../data/pointData";
import {seriesColoursFromGroups} from "../series/seriesColours";
import {seriesLinearRange, seriesColourRange} from "../series/seriesRange";
import {symbolLegend} from "../legend/legend";
import {colourRangeLegend} from "../legend/colourRangeLegend";
import {filterDataByGroup} from "../legend/filter";
import {hardLimitZeroPadding} from "../d3fc/padding/hardLimitZero";
import zoomableChart from "../zoom/zoomableChart";

function xyScatterCanvas(container, settings) {
    const data = pointData(settings, filterDataByGroup(settings));
    const symbols = symbolTypeFromGroups(settings);
    const useGroupColours = settings.mainValues.length <= 2;
    let colour = null;
    let legend = null;

    if (useGroupColours) {
        colour = seriesColoursFromGroups(settings);

        legend = symbolLegend()
            .settings(settings)
            .scale(symbols)
            .colour(useGroupColours ? colour : null);
    } else {
        colour = seriesColourRange(settings, data, "colorValue");
        legend = colourRangeLegend().scale(colour);
    }

    const size = settings.mainValues.length > 3 ? seriesLinearRange(settings, data, "size").range([10, 10000]) : null;

    const series = fc
        .seriesCanvasMulti()
        .mapping((data, index) => data[index])
        .series(data.map(series => pointSeriesCanvas(settings, series.key, size, colour, symbols)));

    const domainDefault = () => mainAxis.domain(settings).paddingStrategy(hardLimitZeroPadding().pad([0.1, 0.1]));

    const xScale = mainAxis.scale(settings);
    const yScale = mainAxis.scale(settings);

    const chart = fc
        .chartCanvasCartesian(xScale, yScale)
        .xDomain(domainDefault().valueName("x")(data))
        .xLabel(settings.mainValues[0].name)
        .yDomain(domainDefault().valueName("y")(data))
        .yLabel(settings.mainValues[1].name)
        .yOrient("left")
        .yNice()
        .xNice()
        .plotArea(series);

    const zoomChart = zoomableChart()
        .chart(chart)
        .settings(settings)
        .xScale(xScale)
        .yScale(yScale)
        .canvas(true);

    // render
    container.datum(data).call(zoomChart);
    if (legend) container.call(legend);
}
xyScatterCanvas.plugin = {
    type: "d3_xy_scatter_canvas",
    name: "[d3fc] X/Y Scatter Canvas",
    max_size: 25000,
    initial: {
        type: "number",
        count: 2
    }
};

export default xyScatterCanvas;