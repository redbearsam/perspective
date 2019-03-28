/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {select} from "d3";
import {treeData} from "../data/treeData";
import {clickHandler} from "../interaction/clickHandler";
import {drawArc, arcVisible} from "../series/arcSeries";
import {labelVisible, labelTransform} from "../axis/sunburstLabel";

function sunburst(container, settings) {
    const {width: containerWidth, height: containerHeight} = container.node().getBoundingClientRect();
    const padding = 30;
    const radius = (Math.min(containerWidth, containerHeight) - padding) / 6;

    const sunburstContainer = container.selectAll("svg").data(treeData(settings));
    sunburstContainer.exit().remove();
    sunburstContainer
        .enter()
        .append("svg")
        .style("width", "100%")
        .style("height", containerHeight - padding / 2)
        .append("g")
        .attr("transform", `translate(${containerWidth / 2}, ${containerHeight / 2})`)
        .each(function({data, color}) {
            const sunburstElement = select(this);
            data.each(d => (d.current = d));

            const path = sunburstElement
                .append("g")
                .selectAll("path")
                .data(data.descendants().slice(1))
                .join("path")
                .attr("fill", d => color(d.data.color))
                .attr("fill-opacity", d => (arcVisible(d.current) ? 0.8 : 0))
                .attr("d", d => drawArc(radius)(d.current));

            const label = sunburstElement
                .append("g")
                .attr("pointer-events", "none")
                .attr("text-anchor", "middle")
                .style("user-select", "none")
                .selectAll("text")
                .data(data.descendants().slice(1))
                .join("text")
                .attr("dy", "0.35em")
                .attr("fill-opacity", d => +labelVisible(d.current))
                .attr("transform", d => labelTransform(d.current, radius))
                .text(d => d.data.name);

            const parentTitle = sunburstElement.append("text").attr("text-anchor", "middle");
            const parent = sunburstElement
                .append("circle")
                .attr("r", radius)
                .attr("fill", "none")
                .attr("pointer-events", "all")
                .datum(data);

            const onClick = clickHandler(data, sunburstElement, parent, parentTitle, path, label, radius);
            parent.on("click", onClick);
            path.filter(d => d.children)
                .style("cursor", "pointer")
                .on("click", onClick);
        });
}
sunburst.plugin = {
    type: "d3_sunburst",
    name: "[D3] Sunburst",
    max_size: 25000,
    initial: {
        type: "number",
        count: 2
    }
};

export default sunburst;
