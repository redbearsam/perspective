/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

export function calculateTickSpacing(parent, groups, axisDimension) {
    let parentViewBoxVals = parent.attributes.viewBox.value.split(" ");
    let viewBoxDimensionMappings = {x: 0, y: 1, width: 2, height: 3};
    let totalSpace = parentViewBoxVals[viewBoxDimensionMappings[axisDimension]];

    let tickSpacing = totalSpace / groups.length;
    return tickSpacing;
}

export function mutateCrossAxisText(axis, tickSpacing, distanceFromAxis, translate) {
    axis.select("text")
        .attr("transform", (_, i) => translate(i * tickSpacing + tickSpacing / 2, distanceFromAxis))
        .text(content => returnOnlyMostSubdividedGroup(content));
}

export function addCrossAxisLabelsForNestedGroupBys(crossAxisMap, groups, horizontal) {
    let groupByLabelsToAppend = crossAxisMap.calculateLabelPositions(groups, horizontal);
    groupByLabelsToAppend.forEach(labelTick => labelTick.tick.appendChild(labelTick.label));
}

function returnOnlyMostSubdividedGroup(content) {
    let contentArray = content.toString().split(",");
    if (contentArray.length <= 1) {
        return content;
    }
    let lastElement = contentArray[contentArray.length - 1];
    return lastElement;
}

export function tickLength(standardTickLength, tickIndex, crossAxisMap) {
    const multiplier = standardTickLength;

    // ticks are shorter in the case where we're not dubdividing by groups.
    if (crossAxisMap.length <= 1) {
        return multiplier / 3;
    }

    let depth = 1;
    crossAxisMap.map.forEach(level => {
        if (level.nodeWithTick(tickIndex).ticks[0] === tickIndex) {
            depth++;
        }
    });

    return depth * multiplier;
}
