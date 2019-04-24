/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import * as fc from "d3fc";
import {axisFactory} from "../axis/axisFactory";
import {chartCanvasFactory} from "../axis/chartFactory";
import {ohlcData} from "../data/ohlcData";
import {filterDataByGroup} from "../legend/filter";
import withGridLines from "../gridlines/gridlines";
import {seriesCanvasOhlc, seriesCanvasCandlestick} from "d3fc";

import {hardLimitZeroPadding} from "../d3fc/padding/hardLimitZero";
import zoomableChart from "../zoom/zoomableChart";
import nearbyTip from "../tooltip/nearbyTip";
import {ohlcCandleSeries} from "../series/ohlcCandleSeries";
import {colorScale, setOpacity} from "../series/seriesColors";
import {colorLegend} from "../legend/legend";

import {settingsMenu} from "../settings/settingsMenu";
import {getChartElement} from "../plugin/root";

function ohlcChart(container, settings) {
    const asCandlestick = settings.ohlc && settings.ohlc.candlestick;
    const seriesCanvas = asCandlestick ? seriesCanvasCandlestick : seriesCanvasOhlc;
    const srcData = ohlcData(settings, filterDataByGroup(settings));

    const bollinger = fc.indicatorBollingerBands().value(d => d.openValue);
    const data = srcData.map(seriesData => {
        const bollingerData = bollinger(seriesData);
        return seriesData.map((d, i) => Object.assign({bollinger: bollingerData[i]}, d));
    });

    const keys = srcData
        .map(k => k.key)
        .concat(settings.hideKeys ? settings.hideKeys : [])
        .sort();

    const upColor = colorScale()
        .domain(keys)
        .settings(settings)
        .mapFunction(setOpacity(1))();

    const legend = colorLegend()
        .settings(settings)
        .scale(keys.length > 1 ? upColor : null);

    const series = ohlcCandleSeries(settings, seriesCanvas, upColor);

    const multi = fc
        .seriesCanvasMulti()
        .mapping((data, index) => data[index])
        .series(data.map(() => series));

    const paddingStrategy = hardLimitZeroPadding()
        .pad([0.1, 0.1])
        .padUnit("percent");

    const xAxis = axisFactory(settings)
        .settingName("crossValues")
        .valueName("crossValue")(data);
    const yAxis = axisFactory(settings)
        .settingName("mainValues")
        .valueNames(["lowValue", "highValue"])
        .orient("vertical")
        .paddingStrategy(paddingStrategy)(data);

    const chart = chartCanvasFactory(xAxis, yAxis).plotArea(
        withGridLines(multi)
            .orient("vertical")
            .canvas(true)
    );

    chart.yNice && chart.yNice();

    const zoomChart = zoomableChart()
        .chart(chart)
        .settings(settings)
        .xScale(xAxis.scale)
        .onChange(zoom => {
            const zoomedData = data.map(series => series.filter(d => d.crossValue >= zoom.xDomain[0] && d.crossValue <= zoom.xDomain[1]));
            chart.yDomain(yAxis.domainFunction(zoomedData));
        })
        .canvas(true);

    const toolTip = nearbyTip()
        .settings(settings)
        .xScale(xAxis.scale)
        .yScale(yAxis.scale)
        .yValueName("closeValue")
        .color(upColor)
        .data(data)
        .canvas(true);

    const ohlcSettings = settingsMenu().add({
        label: "Candlestick",
        selected: asCandlestick,
        onClick: () => {
            settings.ohlc = {candlestick: !asCandlestick};
            getChartElement(container.node()).draw();
        }
    });

    // render
    container.datum(data).call(zoomChart);
    container.call(toolTip);
    container.call(legend);
    container.call(ohlcSettings);
}

ohlcChart.plugin = {
    type: "d3_ohlc",
    name: "[d3fc] OHLC Chart",
    max_size: 25000,
    initial: {
        type: "number",
        count: 4,
        names: ["Open", "Close", "High", "Low"]
    }
};

export default ohlcChart;
