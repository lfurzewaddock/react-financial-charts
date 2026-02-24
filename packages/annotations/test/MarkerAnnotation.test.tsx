import React from "react";
import { scaleLinear } from "d3-scale";

import { render } from "@testing-library/react";

import { MarkerAnnotation } from "../src/MarkerAnnotation";

describe("MarkerAnnotation.tsx", () => {
    it("should render defaults with required props only", () => {
        const yScale = scaleLinear().domain([1, 10]).range([0, 10]);
        const xScale = scaleLinear().domain([1, 10]).range([0, 10]);
        const xAccessor = (datum: { x: number }) => datum.x;
        const { container } = render(
            <svg>
                <MarkerAnnotation
                    markerSize={4}
                    plotData={[]}
                    yScale={yScale}
                    y={() => 5}
                    xScale={xScale}
                    xAccessor={xAccessor}
                    datum={{ x: 5 }}
                />
            </svg>,
        );
        const markerAnnotation = container.querySelector("g");
        expect(markerAnnotation?.getAttribute("class")).toBe("react-financial-charts-marker-annotation");
        const tooltipTitle = markerAnnotation?.querySelector("title");
        expect(tooltipTitle?.innerHTML).toBe("");
        const circleMarker = markerAnnotation?.querySelector("circle");
        expect(circleMarker?.getAttribute("class")).toBe("react-financial-charts-marker-circle");
        expect(circleMarker?.getAttribute("fill")).toBe("#4682B4");
        expect(circleMarker?.getAttribute("stroke")).toBe("#4682B4");
        expect(circleMarker?.getAttribute("stroke-width")).toBe("1");
        expect(circleMarker?.getAttribute("r")).toBe("4");
        expect(circleMarker?.getAttribute("cx")).toBe("4.444444444444445");
        expect(circleMarker?.getAttribute("cy")).toBe("5");
    });
    it("should render with all simple props provided (circle shape)", () => {
        const yScale = scaleLinear().domain([1, 10]).range([0, 10]);
        const xScale = scaleLinear().domain([1, 10]).range([0, 10]);
        const xAccessor = (datum: { x: number; label: string }) => datum.x;
        const tooltip = (datum: { x: number; label: string }) => datum.label;
        const { container } = render(
            <svg>
                <MarkerAnnotation
                    markerShape="circle"
                    markerSize={4}
                    plotData={[]}
                    yScale={yScale}
                    y={() => 5}
                    xScale={xScale}
                    xAccessor={xAccessor}
                    tooltip={tooltip}
                    datum={{ x: 5, label: "I'm a label" }}
                    className="test-class-name"
                    strokeWidth={2}
                    strokeStyle="crimson"
                    fillStyle="indigo"
                />
            </svg>,
        );
        const markerAnnotation = container.querySelector("g");
        expect(markerAnnotation?.getAttribute("class")).toBe("test-class-name");
        const tooltipTitle = markerAnnotation?.querySelector("title");
        expect(tooltipTitle?.innerHTML).toBe("I'm a label");
        const circleMarker = markerAnnotation?.querySelector("circle");
        expect(circleMarker?.getAttribute("fill")).toBe("indigo");
        expect(circleMarker?.getAttribute("stroke")).toBe("crimson");
        expect(circleMarker?.getAttribute("stroke-width")).toBe("2");
    });
    it("should render with all simple props provided (square shape)", () => {
        const yScale = scaleLinear().domain([1, 10]).range([0, 10]);
        const xScale = scaleLinear().domain([1, 10]).range([0, 10]);
        const xAccessor = (datum: { x: number; label: string }) => datum.x;
        const tooltip = (datum: { x: number; label: string }) => datum.label;
        const { container } = render(
            <svg>
                <MarkerAnnotation
                    markerShape="square"
                    markerSize={4}
                    plotData={[]}
                    yScale={yScale}
                    y={() => 5}
                    xScale={xScale}
                    xAccessor={xAccessor}
                    tooltip={tooltip}
                    datum={{ x: 5, label: "I'm a label" }}
                    className="test-class-name"
                    strokeWidth={2}
                    strokeStyle="crimson"
                    fillStyle="indigo"
                />
            </svg>,
        );
        const markerAnnotation = container.querySelector("g");
        expect(markerAnnotation?.getAttribute("class")).toBe("test-class-name");
        const tooltipTitle = markerAnnotation?.querySelector("title");
        expect(tooltipTitle?.innerHTML).toBe("I'm a label");
        const squareMarker = markerAnnotation?.querySelector("rect");
        expect(squareMarker?.getAttribute("fill")).toBe("indigo");
        expect(squareMarker?.getAttribute("stroke")).toBe("crimson");
        expect(squareMarker?.getAttribute("stroke-width")).toBe("2");
    });
    it("should render with all simple props provided (triangle shape)", () => {
        const yScale = scaleLinear().domain([1, 10]).range([0, 10]);
        const xScale = scaleLinear().domain([1, 10]).range([0, 10]);
        const xAccessor = (datum: { x: number; label: string }) => datum.x;
        const tooltip = (datum: { x: number; label: string }) => datum.label;
        const { container } = render(
            <svg>
                <MarkerAnnotation
                    markerShape="triangle"
                    markerSize={4}
                    plotData={[]}
                    yScale={yScale}
                    y={() => 5}
                    xScale={xScale}
                    xAccessor={xAccessor}
                    tooltip={tooltip}
                    datum={{ x: 5, label: "I'm a label" }}
                    className="test-class-name"
                    strokeWidth={2}
                    strokeStyle="crimson"
                    fillStyle="indigo"
                />
            </svg>,
        );
        const markerAnnotation = container.querySelector("g");
        expect(markerAnnotation?.getAttribute("class")).toBe("test-class-name");
        const tooltipTitle = markerAnnotation?.querySelector("title");
        expect(tooltipTitle?.innerHTML).toBe("I'm a label");
        const triangleMarker = markerAnnotation?.querySelector("polygon");
        expect(triangleMarker?.getAttribute("fill")).toBe("indigo");
        expect(triangleMarker?.getAttribute("stroke")).toBe("crimson");
        expect(triangleMarker?.getAttribute("stroke-width")).toBe("2");
        expect((triangleMarker?.getAttribute("points") ?? "").replace(/\s+/g, " ").trim()).toBe(
            "4.444444444444445 2.690598923241497, 6.444444444444445 6.154700538379252, 2.4444444444444446 6.154700538379252",
        );
    });
});
