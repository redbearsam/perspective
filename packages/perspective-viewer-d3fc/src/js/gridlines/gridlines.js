/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import * as fc from "d3fc";

const mainGridSvg = x => x.style("opacity", "0.3").style("stroke-width", "1.0");
const mainGridCanvas = c => {
    c.globalAlpha = 0.3;
    c.lineWidth = 1.0;
};

const crossGridSvg = x => x.style("display", "none");
const crossGridCanvas = c => {
    c.globalAlpha = 0;
};

export default series => {
    let orient = "both";
    let canvas = false;
    let xScale = null;
    let yScale = null;
    let shiftX = false;
    let shiftY = false;
    let context = null;

    let seriesMulti = fc.seriesSvgMulti();
    let annotationGridline = fc.annotationSvgGridline();
    let mainGrid = mainGridSvg;
    let crossGrid = crossGridSvg;

    const _withGridLines = function(...args) {
        if (canvas) {
            seriesMulti = fc.seriesCanvasMulti().context(context);
            annotationGridline = fc.annotationCanvasGridline();
            mainGrid = mainGridCanvas;
            crossGrid = crossGridCanvas;
        }

        const multi = seriesMulti.xScale(xScale).yScale(yScale);

        const xStyle = orient === "vertical" ? crossGrid : mainGrid;
        const yStyle = orient === "horizontal" ? crossGrid : mainGrid;

        const gridlines = annotationGridline
            .xDecorate(d => {
                xStyle(d);
                if (shiftX) {
                    const lines = d.nodes();
                    const boxSize = Math.abs(lines[lines.length - 1].getBBox().x - lines[0].getBBox().x) / (lines.length - 1);
                    d.attr("transform", `translate(${boxSize / 2})`);
                }
            })
            .yDecorate(d => {
                yStyle(d);
                if (shiftY) {
                    const lines = d.nodes();
                    const boxSize = Math.abs(lines[lines.length - 1].getBBox().y - lines[0].getBBox().y) / (lines.length - 1);
                    d.attr("transform", `translate(0, ${-boxSize / 2})`);
                }
            });

        return multi.series([gridlines, series])(...args);
    };

    _withGridLines.orient = (...args) => {
        if (!args.length) {
            return orient;
        }
        orient = args[0];
        return _withGridLines;
    };

    _withGridLines.canvas = (...args) => {
        if (!args.length) {
            return canvas;
        }
        canvas = args[0];
        return _withGridLines;
    };

    _withGridLines.xScale = (...args) => {
        if (!args.length) {
            return xScale;
        }
        xScale = args[0];
        return _withGridLines;
    };

    _withGridLines.yScale = (...args) => {
        if (!args.length) {
            return yScale;
        }
        yScale = args[0];
        return _withGridLines;
    };

    _withGridLines.shiftX = (...args) => {
        if (!args.length) {
            return shiftX;
        }
        shiftX = args[0];
        return _withGridLines;
    };

    _withGridLines.shiftY = (...args) => {
        if (!args.length) {
            return shiftY;
        }
        shiftY = args[0];
        return _withGridLines;
    };

    _withGridLines.context = (...args) => {
        if (!args.length) {
            return context;
        }
        context = args[0];
        return _withGridLines;
    };

    return _withGridLines;
};
