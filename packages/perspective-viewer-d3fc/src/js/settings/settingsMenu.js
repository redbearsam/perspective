/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import {getOrCreateElement} from "../utils/utils";

export const settingsMenu = () => {
    const menuItems = [];

    const _settings = selection => {
        const settingsSelection = getOrCreateElement(selection, "div.settings-container", () => {
            const newDiv = selection.append("div").attr("class", "settings-container");
            newDiv.append("button").html("&#x2699;");

            return newDiv;
        });

        settingsSelection.select("button").on("click", () => {
            const container = selection
                .append("div")
                .attr("class", "settings-overlay")
                .on("click", () => container.remove());

            const items = container
                .append("ul")
                .selectAll("li")
                .data(menuItems, d => d.label);
            items.exit().remove();
            const allItems = items
                .enter()
                .append("li")
                .html(`<span class="checked"></span><span class="label"></span>`)
                .merge(items);

            allItems.select(".checked").classed("selected", d => d.selected);
            allItems.select(".label").text(d => d.label);

            allItems.on("click", d => {
                container.remove();
                d.onClick();
            });
        });
    };

    _settings.add = menuItem => {
        menuItems.push(menuItem);
        return _settings;
    };

    return _settings;
};
