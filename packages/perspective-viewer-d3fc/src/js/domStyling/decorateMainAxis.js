/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

export function decorateMainAxis(mainDecorate) {
    mainDecorate(axis => {
        hideMainAxisLine(axis);
        hideMainAxisTicks(axis);
    });

    return;
}

function hideMainAxisTicks(axis) {
    axis.select("path") // select the tick marks
        .attr("display", "none");
}

function hideMainAxisLine(axis) {
    let parent = axis._parents[0];
    parent.firstChild.setAttribute("display", "none");
}
