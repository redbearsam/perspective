/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import * as d3 from "d3";
import {drawLabels, toggleLabels} from "./treemapLabel";
import {getGoToParentControls} from "./treemapControls";
import treemapLayout from "../../layout/treemapLayout";
import {clickHandler} from "./treemapClick";

export const nodeLevel = {leaf: "leafnode", branch: "branchnode", root: "rootnode"};
const isLeafNode = (maxDepth, d) => d.depth === maxDepth;
const nodeLevelHelper = (maxDepth, d) => (d.depth === 0 ? nodeLevel.root : isLeafNode(maxDepth, d) ? nodeLevel.leaf : nodeLevel.branch);
const calcWidth = d => d.x1 - d.x0;
const calcHeight = d => d.y1 - d.y0;

export function treemapSeries() {
    let settings = null;
    let split = null;
    let data = null;
    let color = null;
    let treemapDiv = null;

    const _treemapSeries = treemapSvg => {
        const maxDepth = data.height;
        settings.treemapLevel = 0;
        const treemap = treemapLayout(treemapDiv.node().getBoundingClientRect().width, treemapDiv.node().getBoundingClientRect().height);
        treemap(data);

        // Draw child nodes first
        const nodes = treemapSvg
            .selectAll("g")
            .data(data.descendants())
            .enter()
            .append("g")
            .sort((a, b) => b.depth - a.depth);

        nodes.append("rect");
        nodes.append("text");

        const nodesMerge = nodes.merge(nodes);

        // drawRects(nodes, color, maxDepth);
        const rects = nodesMerge
            .select("rect")
            .attr("class", d => `treerect ${nodeLevelHelper(maxDepth, d)}`)
            .style("x", d => d.x0)
            .style("y", d => d.y0)
            .style("width", d => calcWidth(d))
            .style("height", d => calcHeight(d))
            .style("fill", d => color(d.data.color));

        //drawLabels(nodesMerge);
        const labels = nodesMerge
            .select("text")
            .attr("x", d => d.x0 + calcWidth(d) / 2)
            .attr("y", d => d.y0 + calcHeight(d) / 2)
            .text(d => d.data.name);

        drawLabels(nodesMerge, settings.treemapLevel, []);
        // toggleLabels(nodesMerge, settings.treemapLevel, []);

        nodesMerge.each(d => {
            const x0 = d.x0;
            const y0 = d.y0;
            const width = calcWidth(d);
            const height = calcHeight(d);
            d[settings.treemapLevel] = {
                x0: x0,
                x1: width + x0,
                y0: y0,
                y1: height + y0,
                visible: true
            };
        });

        const root = rects.filter(d => d.crossValue === "").datum();
        rects.filter(d => d.children).on("click", d => zoomIn(d));

        function zoomIn(d) {
            console.log("clicked: " + d.data.name + ", depth: " + d.depth, "d", d);
            settings.treemapLevel = d.depth;

            const parent = d.parent;
            const crossValues = d.crossValue.split("|");

            const oldDimensions = {x: d.x0, y: d.y0, width: d.x1 - d.x0, height: d.y1 - d.y0};
            const newDimensions = {width: root.x1 - root.x0, height: root.y1 - root.y0};
            const dimensionMultiplier = {width: newDimensions.width / oldDimensions.width, height: newDimensions.height / oldDimensions.height};

            console.log("oldDimensions", oldDimensions, "\nnewDimensions", newDimensions, "\ndimensionMultiplier", dimensionMultiplier);

            const t = d3
                .transition()
                .duration(750)
                .ease(d3.easeCubicOut);

            nodesMerge.each(d => {
                const x0 = (d.x0 - oldDimensions.x) * dimensionMultiplier.width;
                const y0 = (d.y0 - oldDimensions.y) * dimensionMultiplier.height;
                const width = calcWidth(d) * dimensionMultiplier.width;
                const height = calcHeight(d) * dimensionMultiplier.height;
                d[settings.treemapLevel] = {
                    x0: x0,
                    x1: width + x0,
                    y0: y0,
                    y1: height + y0,
                    visible: crossValues.every(val => d.crossValue.split("|").includes(val)) && d.data.name != crossValues[settings.treemapLevel - 1]
                };
                d.target = d[settings.treemapLevel];
            });

            rects
                .transition(t)
                .filter(d => d.target.visible)
                .tween("data", d => {
                    const i = d3.interpolate(d.current, d.target);
                    return t => (d.current = i(t));
                })
                .styleTween("x", d => () => `${d.current.x0}px`)
                .styleTween("y", d => () => `${d.current.y0}px`)
                .styleTween("width", d => () => `${d.current.x1 - d.current.x0}px`)
                .styleTween("height", d => () => `${d.current.y1 - d.current.y0}px`);

            labels
                .transition(t)
                .filter(d => d.target.visible)
                .tween("data", d => {
                    const i = d3.interpolate(d.current, d.target);
                    return t => (d.current = i(t));
                })
                .attrTween("x", d => () => d.current.x0 + calcWidth(d.current) / 2)
                .attrTween("y", d => () => d.current.y0 + calcHeight(d.current) / 2)
                .end(function() {
                    console.log("transition complete");
                    // probably actually don't do this at end!
                    return toggleLabels(nodesMerge, settings.treemapLevel, crossValues);
                });

            // hide hidden svgs
            nodesMerge
                .transition(t)
                .filter(d => !d.target.visible)
                .styleTween("opacity", d => () => 0.0)
                .attrTween("pointer-events", () => () => "none");

            toggleLabels(nodesMerge, settings.treemapLevel, crossValues);

            getGoToParentControls(treemapDiv)
                .style("display", parent ? "" : "none")
                .select("#goto-parent")
                .html(d.data.name)
                .on("click", () => {
                    zoomOut(parent);
                });
        }

        function zoomOut(d) {
            console.log("clicked: " + d.data.name + ", depth: " + d.depth, "d", d);
            settings.treemapLevel = d.depth;

            const parent = d.parent;
            const crossValues = d.crossValue.split("|");

            const t = d3
                .transition()
                .duration(1750)
                .ease(d3.easeCubicOut);

            nodesMerge.each(d => {
                d.target = d[settings.treemapLevel];
            });

            rects
                .transition(t)
                .filter(d => d.target.visible)
                .tween("data", d => {
                    const i = d3.interpolate(d.current, d.target);
                    return t => (d.current = i(t));
                })
                .styleTween("x", d => () => `${d.current.x0}px`)
                .styleTween("y", d => () => `${d.current.y0}px`)
                .styleTween("width", d => () => `${d.current.x1 - d.current.x0}px`)
                .styleTween("height", d => () => `${d.current.y1 - d.current.y0}px`);

            labels
                .transition(t)
                .filter(d => d.target.visible)
                .tween("data", d => {
                    const i = d3.interpolate(d.current, d.target);
                    return t => (d.current = i(t));
                })
                .attrTween("x", d => () => d.current.x0 + calcWidth(d.current) / 2)
                .attrTween("y", d => () => d.current.y0 + calcHeight(d.current) / 2)
                .end(function() {
                    console.log("transition complete");
                    // probably actually don't do this at end!
                    return toggleLabels(nodesMerge, settings.treemapLevel, crossValues);
                });

            // hide hidden svgs
            nodesMerge
                .transition(t)
                //.filter(d => !d.target.visible)
                .styleTween("opacity", d => () => {
                    if (d.target.visible) {
                        return 1.0;
                    }
                    return 0.0;
                })
                .attrTween("pointer-events", d => () => {
                    if (d.target.visible) {
                        return "all";
                    }
                    return "none";
                });

            toggleLabels(nodesMerge, settings.treemapLevel, crossValues);

            getGoToParentControls(treemapDiv)
                .style("display", parent ? "" : "none")
                .select("#goto-parent")
                .html(d.data.name)
                .on("click", () => {
                    zoomOut(parent);
                });
        }
    };

    _treemapSeries.settings = (...args) => {
        if (!args.length) {
            return settings;
        }
        settings = args[0];
        return _treemapSeries;
    };

    _treemapSeries.split = (...args) => {
        if (!args.length) {
            return split;
        }
        split = args[0];
        return _treemapSeries;
    };

    _treemapSeries.data = (...args) => {
        if (!args.length) {
            return data;
        }
        data = args[0];
        return _treemapSeries;
    };

    _treemapSeries.color = (...args) => {
        if (!args.length) {
            return color;
        }
        color = args[0];
        return _treemapSeries;
    };

    _treemapSeries.container = (...args) => {
        if (!args.length) {
            return treemapDiv;
        }
        treemapDiv = args[0];
        return _treemapSeries;
    };

    return _treemapSeries;
}
