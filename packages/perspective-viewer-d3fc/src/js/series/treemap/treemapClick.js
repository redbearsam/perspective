/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

//import {interpolate} from "d3";
import * as d3 from "d3";
import {reDrawRect} from "./treemapRect";
import treemapLayout from "../../layout/treemapLayout";
import getGoToParentControls from "./treemapControls";

export const clickHandler = () => (p, skipTransition) => {
    console.log("p", p, "\nskipTransition", skipTransition);
    const focalNodes = p.descendants();
    console.log(focalNodes);
};

function zoom(d) {
    console.log("clicked: " + d.data.name + ", depth: " + d.depth);

    currentDepth = d.depth;
    parent.datum(d.parent || nodes);

    x.domain([d.x0, d.x1]);
    y.domain([d.y0, d.y1]);

    var t = d3
        .transition()
        .duration(800)
        .ease(d3.easeCubicOut);

    cells
        .transition(t)
        .style("left", d => x(d.x0) + "%")
        .style("top", d => y(d.y0) + "%")
        .style("width", d => x(d.x1) - x(d.x0) + "%")
        .style("height", d => y(d.y1) - y(d.y0) + "%");

    cells // hide this depth and above
        .filter(function(d) {
            return d.ancestors();
        })
        .classed("hide", function(d) {
            return d.children ? true : false;
        });

    cells // show this depth + 1 and below
        .filter(function(d) {
            return d.depth > currentDepth;
        })
        .classed("hide", false);
}

export const clickHandler2 = (data, rects, labels, treemapSvg, treemapDiv, split, maxDepth, settings, width, height, x, y) => (p, skipTransition) => {
    console.log("data", data, "\nrects", rects, "\nlabels", labels, "\ntreemapDiv", treemapDiv, "\ntreemapSvg", treemapSvg, "\nsplit", split, "\nmaxDepth", maxDepth, "\nsettings", settings);
    console.log("p", p, "\nskipTransition", skipTransition);
    //reDrawRects(rects, maxDepth);
    console.log(treemapSvg.node().getBoundingClientRect());
    zoom(settings, treemapSvg, p, width, height, x, y);

    // p.target = {
    //     x0: 0,
    //     x1: treemapSvg.node().getBoundingClientRect().width,
    //     y0: 0,
    //     y1: treemapSvg.node().getBoundingClientRect().height
    // };

    // treemapLayout(treemapDiv.node().getBoundingClientRect().width, treemapDiv.node().getBoundingClientRect().height)(data);

    // data.each(
    //     d =>
    //         (d.target = {
    //             x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
    //             x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
    //             y0: Math.max(0, d.y0 - p.depth),
    //             y1: Math.max(0, d.y1 - p.depth)
    //         })
    // );

    // const t = treemapSvg.transition().duration(skipTransition ? 0 : 750);
    // rects
    //     .transition(t)
    //     .tween("data", d => {
    //         const i = interpolate(d.current, d.target);
    //         return t => (d.current = i(t));
    //     })
    //     .filter(function(d) {
    //         console.log("d", d);

    //         return d;
    //     })
    //     .attr("id", "hidden");

    //labels.
};
