/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import * as d3 from "d3";
import {isElementOverflowing} from "../../utils/utils";

export function enableDragging(element) {
    const node = element.node();
    node.style.cursor = "move";

    const drag = d3.drag().on("drag", function() {
        const [offsetX, offsetY] = enforceContainerBoundaries(this, d3.event.dx, d3.event.dy);
        const newX = this.offsetLeft + offsetX;
        const newY = this.offsetTop + offsetY;

        this.style.left = `${newX}px`;
        this.style.top = `${newY}px`;
    });

    element.call(drag);
}

function enforceContainerBoundaries(legendNode, offsetX, offsetY) {
    console.log(d3.select(".cartesian-chart"));
    const chartNodeRect = d3
        //.select("#container")
        .select(".cartesian-chart")
        .node()
        .getBoundingClientRect();

    const legendNodeRect = legendNode.getBoundingClientRect();

    const margin = 10;
    const newLegendNodeRect = {
        top: legendNodeRect.top + offsetY + margin,
        right: legendNodeRect.right + offsetX + margin,
        bottom: legendNodeRect.bottom + offsetY + margin,
        left: legendNodeRect.left + offsetX + margin
    };

    let adjustedOffsetX = offsetX;

    if (isElementOverflowing(chartNodeRect, newLegendNodeRect, "left")) {
        const leftAdjust = newLegendNodeRect.left - chartNodeRect.left;
        adjustedOffsetX = offsetX - leftAdjust;
    }

    if (isElementOverflowing(chartNodeRect, newLegendNodeRect, "right")) {
        const rightAdjust = newLegendNodeRect.right - chartNodeRect.right;
        adjustedOffsetX = offsetX - rightAdjust;
    }

    let adjustedOffsetY = offsetY;

    // if (isElementOverflowing(chartNodeRect, newLegendNodeRect, "top")) {
    //     const topAdjust = newLegendNodeRect.top - chartNodeRect.top;
    //     adjustedOffsetY = offsetY - topAdjust;
    // }

    if (isElementOverflowing(chartNodeRect, newLegendNodeRect, "bottom")) {
        console.log("chartNodeRect", chartNodeRect, "newLegendNodeRect", newLegendNodeRect);
        console.log("chartNode.bottom", chartNodeRect.bottom, "newLegendNode.bottom", newLegendNodeRect.bottom);
        const bottomAdjust = newLegendNodeRect.bottom - chartNodeRect.bottom;
        console.log("offsetY", offsetY, "bottomAdjust", bottomAdjust);
        adjustedOffsetY = offsetY - bottomAdjust;
        console.log("adjustedOffset", adjustedOffsetY);
        console.log("\n\n");
    }

    return [adjustedOffsetX, adjustedOffsetY];
}
