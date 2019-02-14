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

const TICK_LENGTH = 18;
const LABEL_TICK_PADDING = -2;

export function applyStyleToDOM(chart, crossLabels, data) {
    let groupByLayerTopography = new GroupByLayerTopography(crossLabels, data);

    const [mainDecorate, crossDecorate] = [chart.xDecorate, chart.yDecorate];
    decorateMainAxis(mainDecorate);
    decorateCrossAxis(crossDecorate, groupByLayerTopography, TICK_LENGTH, LABEL_TICK_PADDING);
}

function decorateCrossAxis(crossDecorate, groupByLayerTopography, tickLength, labelTickPadding) {
    function translate(y, x) {
        return `translate(${x}, ${y})`;
    }

    crossDecorate(axis => {
        let groups = axis._groups[0];
        let parent = axis._parents[0];

        axis.attr("transform", "translate(0, 0)"); //correctly align ticks on the crossAxis for subsequent mutations

        const tickSpacing = calculateTickSpacing(parent, groups, "height");
        const textDistanceFromAxis = -tickLength - labelTickPadding;
        mutateCrossAxisText(axis, tickSpacing, textDistanceFromAxis, translate);

        mutateCrossAxisTicks(axis, tickSpacing, translate, tickLength, groupByLayerTopography);

        addCrossAxisLabelsForNestedGroupBys(groupByLayerTopography, groups, true);
    });
}

function mutateCrossAxisTicks(axis, tickSpacing, translate, standardTickLength, groupByLayerTopography) {
    axis.select("path") // select the tick marks
        .attr("stroke", "rgb(187, 187, 187)")
        .attr("d", (d, i) => `M0,0L-${tickLength(standardTickLength, i, groupByLayerTopography)},0`)
        .attr("transform", (x, i) => translate(i * tickSpacing, 0));
}
