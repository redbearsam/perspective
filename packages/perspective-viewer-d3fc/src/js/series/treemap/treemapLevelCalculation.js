/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {calcWidth, calcHeight} from "./treemapSeries";
import {hierarchy} from "d3";
import treemapLayout from "./treemapLayout";

const includesAllCrossValues = (d, crossValues) => crossValues.every(val => d.crossValue.split("|").includes(val));

export function calculateSubTreeMap(d, crossValues, nodesMerge, treemapLevel, rootNode) {
    // We can approximate coordinates for most of the tree which will be shunted beyond the viewable area.
    // This approach alone results in excessive margins as one goes deeper into the treemap.
    approximateAttributesForAllNodes(d, crossValues, nodesMerge, treemapLevel, rootNode);
    d.mapLevel[treemapLevel].levelRoot = true;
    // Use the pre-existing d3 mechanism to calculate the subtree for the viewable area.
    recalculateVisibleSubTreeCoordinates(d, rootNode.x1 - rootNode.x0, rootNode.y1 - rootNode.y0, treemapLevel);
}

export function calculateRootLevelMap(nodesMerge, rootNode) {
    nodesMerge.each(d => {
        d.mapLevel = [];
        d.mapLevel[0] = {
            x0: d.x0,
            x1: calcWidth(d) + d.x0,
            y0: d.y0,
            y1: calcHeight(d) + d.y0,
            visible: true,
            opacity: 1
        };
    });
    rootNode.mapLevel[0].levelRoot = true;
}

function approximateAttributesForAllNodes(d, crossValues, nodesMerge, treemapLevel, rootNode) {
    const oldDimensions = {x: d.x0, y: d.y0, width: d.x1 - d.x0, height: d.y1 - d.y0};
    const newDimensions = {width: rootNode.x1 - rootNode.x0, height: rootNode.y1 - rootNode.y0};
    const dimensionMultiplier = {width: newDimensions.width / oldDimensions.width, height: newDimensions.height / oldDimensions.height};

    nodesMerge.each(d => {
        const x0 = (d.x0 - oldDimensions.x) * dimensionMultiplier.width;
        const y0 = (d.y0 - oldDimensions.y) * dimensionMultiplier.height;
        const width = calcWidth(d) * dimensionMultiplier.width;
        const height = calcHeight(d) * dimensionMultiplier.height;
        const visible = includesAllCrossValues(d, crossValues) && d.data.name != crossValues[treemapLevel - 1];
        d.mapLevel[treemapLevel] = {
            x0,
            x1: width + x0,
            y0,
            y1: height + y0,
            visible,
            opacity: visible ? 1 : 0
        };
    });
}

function recalculateVisibleSubTreeCoordinates(subTreeRoot, treeRootWidth, treeRootHeight, treemapLevel) {
    const treemapBlueprinter = treemapLayout(treeRootWidth, treeRootHeight);
    const treemapBlueprint = treemapBlueprinter(hierarchy(subTreeRoot.data).sum(d => d.size));

    const dummiedDescendants = treemapBlueprint.descendants();
    const descendants = subTreeRoot.descendants();

    dummiedDescendants.forEach((_, i) => {
        descendants[i].mapLevel[treemapLevel].x0 = dummiedDescendants[i].x0;
        descendants[i].mapLevel[treemapLevel].x1 = dummiedDescendants[i].x1;
        descendants[i].mapLevel[treemapLevel].y0 = dummiedDescendants[i].y0;
        descendants[i].mapLevel[treemapLevel].y1 = dummiedDescendants[i].y1;
    });
}
