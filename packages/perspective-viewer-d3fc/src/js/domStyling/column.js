/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {decorateMainAxis} from "./decorateMainAxis";
import {calculateTickSpacing, mutateCrossAxisText, addCrossAxisLabelsForNestedGroupBys, tickLength} from "./decorateCrossAxis";
import {GroupByLayerTopography} from "./groupByLayerTopography";

const TICK_LENGTH = 9;
const LABEL_TICK_PADDING = 2;

export function applyStyleToDOM(chart, crossLabels, data) {
    let groupByLayerTopography = new GroupByLayerTopography(crossLabels, data);

    const [mainDecorate, crossDecorate] = [chart.yDecorate, chart.xDecorate];
    decorateMainAxis(mainDecorate);
    decorateCrossAxis(crossDecorate, groupByLayerTopography, TICK_LENGTH, LABEL_TICK_PADDING);
}

function decorateCrossAxis(crossDecorate, groupByLayerTopography, tickLength, labelTickPadding) {
    function translate(x, y) {
        return `translate(${x}, ${y})`;
    }

    crossDecorate(axis => {
        let groups = axis._groups[0];
        let parent = axis._parents[0];

        axis.attr("transform", "translate(0, 0)"); //correctly align ticks on the crossAxis for subsequent mutations

        const tickSpacing = calculateTickSpacing(parent, groups, "width");
        const textDistanceFromAxis = tickLength + labelTickPadding;
        mutateCrossAxisText(axis, tickSpacing, textDistanceFromAxis, translate);

        mutateCrossAxisTicks(axis, tickSpacing, translate, tickLength, groupByLayerTopography);

        addCrossAxisLabelsForNestedGroupBys(groupByLayerTopography, groups, false);
    });
}

function mutateCrossAxisTicks(axis, tickSpacing, translate, standardTickLength, groupByLayerTopography) {
    axis.select("path") // select the tick marks
        .attr("stroke", "rgb(187, 187, 187)")
        .attr("d", (x, i) => `M0,0L0,${tickLength(standardTickLength, i, groupByLayerTopography)}`)
        .attr("transform", (x, i) => translate(i * tickSpacing, 0));
}
