import * as React from "react";
import { scaleLinear } from "d3-scale";

import { ChartCanvasContextType } from "./ChartCanvas.types";

const noop = () => {};

export const chartCanvasContextDefaultValue: ChartCanvasContextType<number | Date> = {
    amIOnTop: () => false,
    chartConfigs: [],
    chartId: 0,
    ratio: 0,
    displayXAccessor: () => 0,
    fullData: [],
    getMutableState: () => ({
        mouseXY: [0, 0],
        currentItem: null,
        currentCharts: [""],
    }),
    height: 0,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    plotData: [],
    setCursorClass: noop,
    subscribe: noop,
    unsubscribe: noop,
    redraw: noop,
    width: 0,
    xAccessor: () => 0,
    xScale: scaleLinear<number, number>(),
};

export const ChartCanvasContext =
    React.createContext<ChartCanvasContextType<number | Date>>(chartCanvasContextDefaultValue);