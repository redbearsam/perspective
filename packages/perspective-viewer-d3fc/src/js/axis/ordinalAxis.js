/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import * as d3 from "d3";
import * as fc from "d3fc";
import minBandwidth from "./minBandwidth";
import {flattenArray} from "./flatten";
import {multiAxisBottom, multiAxisLeft} from "../d3fc/axis/multi-axis";

export const scale = () => minBandwidth(d3.scaleBand()).padding(0.5);

export const domain = () => {
    let valueNames = ["crossValue"];
    let orient = "horizontal";

    const _domain = data => {
        const flattenedData = flattenArray(data);
        return transformDomain([...new Set(flattenedData.map(d => d[valueNames[0]]))]);
    };

    const transformDomain = d => (orient == "vertical" ? d.reverse() : d);

    _domain.valueName = (...args) => {
        if (!args.length) {
            return valueNames[0];
        }
        valueNames = [args[0]];
        return _domain;
    };
    _domain.valueNames = (...args) => {
        if (!args.length) {
            return valueNames;
        }
        valueNames = args[0];
        return _domain;
    };

    _domain.orient = (...args) => {
        if (!args.length) {
            return orient;
        }
        orient = args[0];
        return _domain;
    };

    return _domain;
};

export const labelFunction = valueName => d => d[valueName].join("|");

export const component = settings => {
    let orient = "horizontal";
    let settingName = "crossValues";
    let domain = null;

    const getComponent = () => {
        const multiLevel = settings[settingName].length > 1 && settings[settingName].every(v => v.type !== "datetime");

        // Calculate the label groups and corresponding group sizes
        const levelGroups = axisGroups(domain);
        const groupTickLayout = levelGroups.map(getGroupTickLayout);

        const tickSizeInner = multiLevel ? groupTickLayout.map(l => l.size) : groupTickLayout[0].size;
        const tickSizeOuter = groupTickLayout.reduce((s, v) => s + v.size, 0);

        const createAxis = scale => {
            const axis = pickAxis(multiLevel)(scale);

            if (multiLevel) {
                axis.groups(levelGroups)
                    .tickSizeInner(tickSizeInner)
                    .tickSizeOuter(tickSizeOuter);
            }

            return axis;
        };

        const decorate = (s, data, index) => {
            const rotated = groupTickLayout[index].rotate;
            hideOverlappingLabels(s, rotated);
            if (orient === "horizontal") applyLabelRotation(s, rotated);
        };

        return {
            bottom: createAxis,
            left: createAxis,
            size: `${tickSizeOuter + 10}px`,
            decorate
        };
    };

    const pickAxis = multiLevel => {
        if (multiLevel) {
            return orient === "horizontal" ? multiAxisBottom : multiAxisLeft;
        }
        return orient === "horizontal" ? fc.axisOrdinalBottom : fc.axisOrdinalLeft;
    };

    const axisGroups = domain => {
        const groups = [];
        domain.forEach(tick => {
            const split = tick.split ? tick.split("|") : [tick];
            split.forEach((s, i) => {
                while (groups.length <= i) groups.push([]);

                const group = groups[i];
                if (group.length > 0 && group[group.length - 1].text === s) {
                    group[group.length - 1].domain.push(tick);
                } else {
                    group.push({text: s, domain: [tick]});
                }
            });
        });
        return groups.reverse();
    };

    const getGroupTickLayout = group => {
        const width = settings.size.width;
        const maxLength = Math.max(...group.map(g => g.text.length));

        if (orient === "horizontal") {
            // x-axis may rotate labels and expand the available height
            if (group.length * (maxLength * 6 + 10) > width - 100) {
                return {
                    size: maxLength * 3 + 20,
                    rotate: true
                };
            }
            return {
                size: 25,
                rotate: false
            };
        } else {
            // y-axis size always based on label size
            return {
                size: maxLength * 5 + 10,
                rotate: false
            };
        }
    };

    const hideOverlappingLabels = (s, rotated) => {
        const getTransformCoords = transform =>
            transform
                .substring(transform.indexOf("(") + 1, transform.indexOf(")"))
                .split(",")
                .map(c => parseInt(c));

        const rectanglesOverlap = (r1, r2) => r1.x <= r2.x + r2.width && r2.x <= r1.x + r1.width && r1.y <= r2.y + r2.height && r2.y <= r1.y + r1.height;
        const rotatedLabelsOverlap = (r1, r2) => r1.x + 14 > r2.x;

        const previousRectangles = [];
        s.each((d, i, nodes) => {
            const tick = d3.select(nodes[i]);
            const text = tick.select("text");

            const transformCoords = getTransformCoords(tick.attr("transform"));

            let rect = {};
            let overlap = false;
            if (rotated) {
                rect = {x: transformCoords[0], y: transformCoords[1]};
                overlap = previousRectangles.some(r => rotatedLabelsOverlap(r, rect));
            } else {
                const textRect = text.node().getBBox();
                rect = {x: textRect.x + transformCoords[0], y: textRect.y + transformCoords[1], width: textRect.width, height: textRect.height};
                overlap = previousRectangles.some(r => rectanglesOverlap(r, rect));
            }

            text.attr("visibility", overlap ? "hidden" : "");
            if (!overlap) {
                previousRectangles.push(rect);
            }
        });
    };

    const applyLabelRotation = (s, rotate) => {
        s.each((d, i, nodes) => {
            const tick = d3.select(nodes[i]);
            const text = tick.select("text");

            text.attr("transform", rotate ? "rotate(-45 5 5)" : "translate(0, 8)").style("text-anchor", rotate ? "end" : "");
        });
    };

    getComponent.orient = (...args) => {
        if (!args.length) {
            return orient;
        }
        orient = args[0];
        return getComponent;
    };

    getComponent.settingName = (...args) => {
        if (!args.length) {
            return settingName;
        }
        settingName = args[0];
        return getComponent;
    };

    getComponent.domain = (...args) => {
        if (!args.length) {
            return domain;
        }
        domain = args[0];
        return getComponent;
    };

    return getComponent;
};