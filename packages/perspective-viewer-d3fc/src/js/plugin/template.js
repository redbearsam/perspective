/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import * as d3 from "d3";

import style from "../../less/chart.less";
import template from "../../html/d3fc-chart.html";
import {configureHidden} from "../legend/legend";

import {bindTemplate} from "@jpmorganchase/perspective-viewer/src/js/utils";

const styleWithD3FC = `${style}${getD3FCStyles()}`;

@bindTemplate(template, styleWithD3FC) // eslint-disable-next-line no-unused-vars
class D3FCChartElement extends HTMLElement {
    connectedCallback() {
        this._container = this.shadowRoot.querySelector(".chart");
        this._chart = null;
        this._settings = null;
    }

    render(chart, settings) {
        this.remove();

        this._chart = chart;
        this._settings = configureHidden(this._settings, settings);
        this.draw();
    }

    draw() {
        if (this._settings.data) {
            this._chart(d3.select(this._container), this._settings);
        }
    }

    resize() {
        const d3fcGroup = this._container.querySelector("d3fc-group");
        if (d3fcGroup) d3fcGroup.requestRedraw();
    }

    remove() {
        this._container.innerHTML = "";
    }

    delete() {
        this.remove();
    }
}

function getD3FCStyles() {
    const headerStyles = document.querySelector("head").querySelectorAll("style");
    const d3fcStyles = [];
    headerStyles.forEach(s => {
        if (s.innerText.indexOf("d3fc-") !== -1) {
            d3fcStyles.push(s.innerText);
        }
    });
    return d3fcStyles.join("");
}
