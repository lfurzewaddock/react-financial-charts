import React from "react";
import { scaleLinear } from "d3-scale";

import { render } from "@testing-library/react";

import { ChartCanvasContext, ChartContext } from "@lfurzewaddock/react-financial-charts-core";
import { Annotate } from "../src/Annotate";
import { MarkerAnnotation } from "../src/MarkerAnnotation";

const createMockContexts = () => {
    let subscriptionId = 0;
    const xScale = scaleLinear().domain([1, 10]).range([0, 100]);
    const yScale = scaleLinear().domain([1, 10]).range([100, 0]);

    const chartConfig = {
        id: 0,
        origin: [0, 0] as [number, number],
        padding: 0,
        yScale,
        yPan: true,
        yPanEnabled: false,
        width: 100,
        height: 100,
    };

    const chartCanvasCtx = {
        width: 100,
        height: 100,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
        chartId: 0,
        xScale,
        ratio: 1,
        xAccessor: (datum: { x: number }) => datum.x,
        displayXAccessor: (datum: { x: number }) => datum.x,
        plotData: [{ x: 1 }, { x: 5 }, { x: 10 }],
        fullData: [{ x: 1 }, { x: 5 }, { x: 10 }],
        chartConfigs: [chartConfig],
        generateSubscriptionId: () => subscriptionId++,
        getMutableState: () => ({
            mouseXY: [0, 0] as [number, number],
            currentItem: null,
            currentCharts: [],
        }),
        amIOnTop: () => false,
        subscribe: jest.fn(),
        unsubscribe: jest.fn(),
        setCursorClass: jest.fn(),
        redraw: jest.fn(),
    };

    const chartCtx = {
        ...chartCanvasCtx,
        chartConfig,
    };

    return { chartCanvasCtx, chartCtx };
};

describe("Annotate.tsx", () => {
    it("should render defaults with required props only", () => {
        const { chartCanvasCtx, chartCtx } = createMockContexts();
        const { container } = render(
            <ChartCanvasContext.Provider value={chartCanvasCtx}>
                <ChartContext.Provider value={chartCtx}>
                    <svg>
                        <Annotate with={MarkerAnnotation} when={() => true} />
                    </svg>
                </ChartContext.Provider>
            </ChartCanvasContext.Provider>,
        );
        const genericComponent = container.querySelector("g");
        const annotateComponent = genericComponent?.querySelector("g");
        expect(annotateComponent?.getAttribute("class")).toBe(
            "react-financial-charts-enable-interaction react-financial-charts-annotate react-financial-charts-default-cursor",
        );
        const markerAnnotationComponents = annotateComponent?.querySelectorAll("g");
        expect(markerAnnotationComponents).toHaveLength(3);
        const tooltipTitle1 = (markerAnnotationComponents![0] as SVGGElement).querySelector("title");
        expect(tooltipTitle1?.innerHTML).toBe("");
        const circleMarker1 = (markerAnnotationComponents![0] as SVGGElement)?.querySelector("circle");
        expect(circleMarker1?.getAttribute("class")).toBe("react-financial-charts-marker-circle");
        expect(circleMarker1?.getAttribute("fill")).toBe("#4682B4");
        expect(circleMarker1?.getAttribute("stroke")).toBe("#4682B4");
        expect(circleMarker1?.getAttribute("stroke-width")).toBe("1");
        expect(circleMarker1?.getAttribute("cx")).toBe("0");
    });
});
