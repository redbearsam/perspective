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

function returnOnlyMostSubdividedGroup(content) {
    if (!Array.isArray(content)) {
        return content;
    }
    let lastElement = content[content.length - 1];
    return lastElement;
}
