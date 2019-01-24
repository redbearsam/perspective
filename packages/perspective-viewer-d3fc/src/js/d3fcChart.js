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
import {isNullOrUndefined} from "util";

export default class D3FCChart {
    constructor(mode, config, container) {
        this._mode = mode;
        this._config = config;
        this._container = container;
        this._hiddenElements = [];
        this.update = this.update.bind(this);
    }

    render(config) {
        console.log("config:", this._config);
        if (config) {
            this._config = config;
        }

        if (this._mode === "x_bar") {
            renderBar(this._config, this._container, true, this._hiddenElements, this.update);
        } else if (this._mode === "y_bar") {
            renderBar(this._config, this._container, false, this._hiddenElements, this.update);
        } else {
            throw "EXCEPTION: chart type not recognised.";
        }
    }

    update(config) {
        if (this._hiddenElements.length < 1 && config && !areArraysEqual(this._config.col_pivots, config.col_pivots)) {
            this._hiddenElements = [];
        }
        d3.select(this._container)
            .selectAll("*")
            .remove();
        this.render(config);
    }
}

function areArraysEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) {
        return false;
    }
    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) {
            return false;
        }
    }
    return true;
}

function renderBar(config, container, horizontal, hiddenElements, update) {
    let orientation = horizontal ? "horizontal" : "vertical";

    let labels = interpretLabels(config);
    let isSplitBy = labels.splitLabel != "";

    let groups = interpretGroups(config.xAxis.categories);
    let series = config.series;

    let [dataset, stackedBarData, color] = interpretDataset(isSplitBy, series, groups, hiddenElements);

    let legend = configureLegend(isSplitBy, color, hiddenElements, update);
    let barSeries = configureBarSeries(isSplitBy, orientation, dataset);
    let gridlines = configureGrid(horizontal);
    let [xScale, yScale] = configureScale(isSplitBy, horizontal, dataset, stackedBarData);

    // groups of svgs we need to render
    let multi = configureMultiSvg(isSplitBy, gridlines, barSeries, dataset, color);
    let chart = configureChart(xScale, yScale, multi);

    styleDark(chart, horizontal, labels);

    d3.select(container)
        .datum(dataset)
        .call(chart);

    drawLegend(legend, container, hiddenElements);

    removeCanvasElement(container);
    removeAxisGap(container);
    correctAxisClip(container, horizontal);
}

// CONFIGURE CHART ELEMENTS
function configureBarSeries(isSplitBy, orientation, dataset) {
    let barSeries;
    if (isSplitBy) {
        let stackedBarSeries = fc
            .autoBandwidth(fc.seriesSvgBar())
            .align("left")
            .orient(orientation)
            .crossValue(d => d.data["group"])
            .mainValue(d => d[1])
            .baseValue(d => d[0]);

        barSeries = [...dataset.map(() => stackedBarSeries)];
    } else {
        barSeries = fc
            .autoBandwidth(fc.seriesSvgBar())
            .align("left")
            .orient(orientation)
            .crossValue(d => d.crossValue)
            .mainValue(d => d.mainValue);
    }

    return barSeries;
}

function configureGrid(horizontal) {
    let mainGrid = x => x.style("opacity", "0.3").style("stroke-width", "1.0");

    let crossGrid = x => x.style("display", "none");

    let [xGrid, yGrid] = horizontal ? [mainGrid, crossGrid] : [crossGrid, mainGrid];

    let gridlines = fc
        .annotationSvgGridline()
        .xDecorate(xGrid)
        .yDecorate(yGrid);

    return gridlines;
}

function configureScale(isSplitBy, horizontal, dataset, stackedBarData) {
    let mainScale;
    let crossScale;
    if (isSplitBy) {
        let mainExtent = fc
            .extentLinear()
            .accessors([a => a.map(d => d[1])])
            .pad([0, 1])
            .padUnit("domain");

        mainScale = d3.scaleLinear().domain(mainExtent(dataset));

        crossScale = d3
            .scaleBand()
            .domain(stackedBarData.map(entry => entry["group"]))
            .paddingInner(0.4)
            .paddingOuter(0.2);
    } else {
        mainScale = d3.scaleLinear().domain([0, d3.max(dataset, x => x.mainValue)]);

        crossScale = d3
            .scaleBand()
            .domain(dataset.map(x => x.crossValue))
            .paddingInner(0.4)
            .paddingOuter(0.2);
    }

    let [xScale, yScale] = horizontal ? [mainScale, crossScale] : [crossScale, mainScale];
    return [xScale, yScale];
}

function configureMultiSvg(isSplitBy, gridlines, barSeries, dataset, color) {
    let multi;
    if (isSplitBy) {
        let multiWithOutGrid = fc
            .seriesSvgMulti()
            .mapping((data, index) => data[index])
            .series(barSeries)
            .decorate(selection => {
                selection.each(function(data, index) {
                    d3.select(this)
                        .selectAll("g.bar")
                        .attr("fill", color(dataset[index].key));
                });
            });

        multi = fc.seriesSvgMulti().series([gridlines, multiWithOutGrid]);
    } else {
        multi = fc
            .seriesSvgMulti()
            .series([gridlines, barSeries])
            .decorate(selection =>
                selection
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

function configureLegend(isSplitBy, color, hiddenElements, update) {
    if (!isSplitBy) {
        return;
    }

    let legend = d3Legend
        .legendColor()
        .shape("circle")
        .shapeRadius(6)
        .orient("vertical")
        .scale(color)
        .on("cellclick", function(d) {
            toggleElements(d);
            update();
        });

    function toggleElements(elementKey) {
        const index = hiddenElements.findIndex(e => e === elementKey);
        index >= 0 ? hiddenElements.splice(index, 1) : hiddenElements.push(elementKey);
    }

    return legend;
}

function configureChart(xScale, yScale, multi) {
    let chart = fc
        .chartSvgCartesian(xScale, yScale)
        .yOrient("left")
        .plotArea(multi);

    return chart;
}

// DRAW CHART ELEMENTS
function drawLegend(legend, container, hiddenElements) {
    if (legend) {
        d3.select(container)
            .append("svg")
            .attr("class", "legend")
            .style("z-index", "2")
            .call(legend)
            .select("g.legendCells")
            .attr("transform", "translate(20,20)")
            .selectAll("g.cell")
            .classed("hidden", data => hiddenElements.includes(data));
    }
}

function removeCanvasElement(container) {
    // Remove the canvas element; it's empty but blocks direct element selection on the svg viewbox.
    let canvas = container.getElementsByTagName("d3fc-canvas")[0];
    canvas.remove();
}

function removeAxisGap(container) {
    d3.select(container)
        .select(".bottom-axis")
        .style("margin-top", "-5px");
}

function correctAxisClip(container, horizontal) {
    const selection = d3.select(container);
    const axis = horizontal ? selection.select(".bottom-axis svg") : selection.select(".left-axis svg");
    axis.style("overflow", "overlay");
}

// PREP DATA
function interpretLabels(config) {
    let labels = {
        mainLabel: null,
        crossLabel: null,
        splitLabel: null
    };

    labels.mainLabel = config.series
        .map(s => s.stack)
        .filter((value, index, self) => self.indexOf(value) === index)
        .join(", ");

    labels.crossLabel = config.row_pivots.filter((value, index, self) => self.indexOf(value) === index).join(", ");

    labels.splitLabel = config.col_pivots.filter((value, index, self) => self.indexOf(value) === index).join(", ");

    console.log("labels:", labels);

    return labels;
}

function interpretDataset(isSplitBy, series, groups, hiddenElements) {
    if (isSplitBy) {
        let [dataset, stackedBarData, color] = interpretStackDataset(series, groups, hiddenElements);
        console.log("dataset: ", dataset);
        return [dataset, stackedBarData, color];
    }

    //simple array of data
    let dataset = series[0].data.map((mainValue, i) => ({
        mainValue: mainValue,
        crossValue: interpretCrossValue(i, groups)
    }));

    console.log("dataset: ", dataset);
    return [dataset, null, null];
}

function interpretStackDataset(series, groups, hiddenElements) {
    //Convert data to Stacked Bar Chart Format
    let keys = groups.length > 0 ? groups : [...Array(series[0].data.length)].map((_, i) => i);

    let stackedBarData = keys.map((group, i) => {
        let row = {group};
        series
            .filter(d => !hiddenElements.includes(d.name))
            .forEach(split => {
                row[split.name] = split.data[i] || 0;
            });
        return row;
    });

    let stack = d3.stack().keys(Object.keys(stackedBarData[0]).filter(r => r !== "group"));
    let dataset = stack(stackedBarData);
    let color = d3.scaleOrdinal(d3.schemeCategory10).domain(series.map(s => s.name));
    return [dataset, stackedBarData, color];
}

function interpretCrossValue(i, categories) {
    if (categories.length <= 0) {
        return i;
    }

    return categories[i];
}

function interpretGroups(categories) {
    let flatmap = [];

    if (categories.length === 0) {
        return flatmap;
    }

    flattenAllArrays(flatmap, categories.map(subCat => flattenGroup(subCat, [])));
    return flatmap;
}

function flattenGroup(category, parentCategories) {
    if (isNullOrUndefined(category.name)) {
        // We've reached the end of the nesting!
        return [...parentCategories, category];
    }

    let catName = category.name;
    let flatmap = category.categories.map(subCat => flattenGroup(subCat, [...parentCategories, catName]));
    return flatmap;
}

function flattenAllArrays(completeList, array) {
    if (!Array.isArray(array[0])) {
        completeList.push(array);
        return;
    }

    array.forEach(x => flattenAllArrays(completeList, x));
    return;
}

// STYLE CHART
function styleDark(chart, horizontal, labels) {
    let [crossDecorate, mainDecorate, crossLabel, mainLabel] = horizontal
        ? [chart.yDecorate, chart.xDecorate, chart.yLabel, chart.xLabel]
        : [chart.xDecorate, chart.yDecorate, chart.xLabel, chart.yLabel];

    function translate(perpendicularToAxis, parallelToAxis) {
        return horizontal ? `translate(${parallelToAxis}, ${perpendicularToAxis})` : `translate(${perpendicularToAxis}, ${parallelToAxis})`;
    }

    mainLabel(labels.mainLabel);
    //crossLabel(labels.crossLabel); // not enabled.

    let textDistanceFromXAxis = 9;
    let textDistanceFromYAxis = -18; //TODO: need to make this reactive to text length.
    let distanceFromAxis = horizontal ? textDistanceFromYAxis : textDistanceFromXAxis;

    crossDecorate(selection => {
        let groups = selection._groups[0];
        let parent = selection._parents[0];
        let totalSpace = horizontal ? parent.clientHeight : parent.clientWidth;
        let tickSpacing = totalSpace / groups.length;

        selection.attr("transform", "translate(0, 0)");
        parent.firstChild.setAttribute("stroke", "rgb(187, 187, 187)"); // turn the axis white // TODO: this is too fragile
        selection.select("text").attr("transform", (x, i) => translate(i * tickSpacing + tickSpacing / 2, distanceFromAxis));
        selection
            .select("path") // select the tick marks
            .attr("stroke", "rgb(187, 187, 187)")
            .attr("transform", (x, i) => translate(i * tickSpacing, 0));

        if (labels.crossLabel === "") {
            selection.select("text").attr("display", "none");
        }
    });

    mainDecorate(selection => {
        let parent = selection._parents[0];

        parent.firstChild.setAttribute("display", "none"); // hide the axis // TODO: this is too fragile.
        selection
            .select("path") // select the tick marks
            .attr("display", "none");
        selection.select("text").attr("fill", "white");
    });

    return;
}
