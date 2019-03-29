/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
const AXIS_TYPES = {
    none: "none",
    ordinal: "ordinal",
    time: "time",
    linear: "linear"
};

export const labelFunction = (settings, valueName = "__ROW_PATH__", settingName = "crossValues") => {
    switch (axisType(settings, settingName)) {
        case AXIS_TYPES.none:
            return d => d[valueName][0];
        case AXIS_TYPES.time:
            return d => new Date(d[valueName][0]);
        case AXIS_TYPES.linear:
            return d => d[valueName][0];
        default:
            return d => d[valueName].join("|");
    }
};

export const label = (settings, settingName = "crossValues") => settings[settingName].map(v => v.name).join(", ");

const axisType = (settings, settingName = "crossValues") => {
    if (settings[settingName].length === 0) {
        return AXIS_TYPES.none;
    } else if (settings[settingName].length === 1) {
        if (settings[settingName][0].type === "datetime") {
            return AXIS_TYPES.time;
        }
    }
    return AXIS_TYPES.ordinal;
};
