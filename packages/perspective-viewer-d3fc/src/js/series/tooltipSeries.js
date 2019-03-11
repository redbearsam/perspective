/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import * as fc from "d3fc";
import {withoutOpacity, withOpacity} from "./seriesColours.js";
import {remoteTooltip, removeRemoteTooltip} from "../tooltip/tooltip";

let tooltipDiv = null;

export function tooltipPointSeries(settings, colour, size = 200) {
    let series = fc.seriesSvgPoint();

    series = series.decorate((selection, data) => {
        tooltipDiv = data.length > 0 ? remoteTooltip()(selection, data[0], settings) : removeRemoteTooltip(tooltipDiv);

        if (colour) {
            selection.style("stroke", d => withoutOpacity(colour(d.key))).style("fill", d => withOpacity(colour(d.key)));
        }
    });

    return series
        .crossValue(d => d.crossValue)
        .mainValue(d => d.mainValue)
        .size(size);
}
