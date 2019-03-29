/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

export const AXIS_TYPES = {
    none: "none",
    ordinal: "ordinal",
    time: "time",
    linear: "linear"
};

export const axisType = settings => {
    let settingName = "crossValues";
    let settingValue = null;

    const getType = () => {
        const checkTypes = types => {
            const list = settingValue ? settings[settingName].filter(s => settingValue == s.name) : settings[settingName];

            if (settingName == "crossValues" && list.length > 1) {
                // can't do multiple values on non-ordinal cross-axis
                return false;
            }

            return list.some(s => types.includes(s.type));
        };

        if (settings[settingName].length === 0) {
            return AXIS_TYPES.none;
        } else if (checkTypes(["datetime"])) {
            return AXIS_TYPES.time;
        } else if (checkTypes(["integer", "float"])) {
            return AXIS_TYPES.linear;
        }
        return AXIS_TYPES.ordinal;
    };

    getType.settingName = (...args) => {
        if (!args.length) {
            return settingName;
        }
        settingName = args[0];
        return getType;
    };

    getType.settingValue = (...args) => {
        if (!args.length) {
            return settingValue;
        }
        settingValue = args[0];
        return getType;
    };

    return getType;
};
