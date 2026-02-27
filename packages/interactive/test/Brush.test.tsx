import * as React from "react";
import { act, render } from "@testing-library/react";
import { scaleLinear } from "d3-scale";

import { ChartCanvasContext, ChartContext } from "@lfurzewaddock/react-financial-charts-core";
import { Brush } from "../src/Brush";

const createHarness = (props?: Partial<React.ComponentProps<typeof Brush>>) => {
    const brushRef = React.createRef<Brush>();
    let subscriptionId = 0;

    const mockCanvasContext = {
        beginPath: jest.fn(),
        clip: jest.fn(),
        rect: jest.fn(),
        restore: jest.fn(),
        save: jest.fn(),
        scale: jest.fn(),
        setLineDash: jest.fn(),
        setTransform: jest.fn(),
        strokeRect: jest.fn(),
        fillRect: jest.fn(),
        translate: jest.fn(),
    } as unknown as CanvasRenderingContext2D;

    const xScale = scaleLinear().domain([0, 10]).range([0, 100]);
    const yScale = scaleLinear().domain([0, 10]).range([100, 0]);

    const chartConfig = {
        id: 1,
        origin: [0, 0] as [number, number],
        padding: 0,
        yScale,
        yPan: true,
        yPanEnabled: false,
        width: 100,
        height: 100,
    };

    const setCursorClass = jest.fn();
    const xAxisZoom = jest.fn();
    const onBrush = jest.fn();

    const chartCanvasCtx = {
        width: 100,
        height: 100,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
        chartId: 1,
        xScale,
        ratio: 1,
        xAccessor: (datum: { x: number }) => datum.x,
        displayXAccessor: (datum: { x: number }) => datum.x,
        xAxisZoom,
        plotData: [{ x: 1 }, { x: 5 }, { x: 9 }],
        fullData: [{ x: 1 }, { x: 5 }, { x: 9 }],
        chartConfigs: [chartConfig],
        getCanvasContexts: () => ({
            axes: mockCanvasContext,
            bg: mockCanvasContext,
            mouseCoord: mockCanvasContext,
        }),
        generateSubscriptionId: () => subscriptionId++,
        getMutableState: () => ({
            mouseXY: [0, 0] as [number, number],
            currentItem: null,
            currentCharts: ["1"],
        }),
        amIOnTop: () => true,
        subscribe: jest.fn(),
        unsubscribe: jest.fn(),
        setCursorClass,
        redraw: jest.fn(),
    };

    const chartCtx = {
        ...chartCanvasCtx,
        chartConfig,
    };

    const rendered = render(
        <ChartCanvasContext.Provider value={chartCanvasCtx as any}>
            <ChartContext.Provider value={chartCtx as any}>
                <svg>
                    <Brush ref={brushRef} enabled type="1D" minimumSelectionSize={5} onBrush={onBrush} {...props} />
                </svg>
            </ChartContext.Provider>
        </ChartCanvasContext.Provider>,
    );

    const xAccessor = (datum: { x: number }) => datum.x;

    const buildMoreProps = (x: number, y = 50) => ({
        mouseXY: [xScale(x), y],
        currentItem: { x },
        chartConfig: {
            yScale,
            height: 100,
        },
        xAccessor,
        xScale,
    });

    return {
        brush: brushRef.current!,
        buildMoreProps,
        onBrush,
        setCursorClass,
        xAxisZoom,
        ...rendered,
    };
};

describe("Brush focus-context behaviour", () => {
    it("commits normalized brush range and persists committed selection", () => {
        const { brush, buildMoreProps, onBrush, xAxisZoom } = createHarness({ zoomToDomain: true });

        act(() => {
            (brush as any).handleZoomStart({} as React.MouseEvent, buildMoreProps(8));
        });

        act(() => {
            (brush as any).handleDrawSquare({} as React.MouseEvent, buildMoreProps(2));
        });

        act(() => {
            (brush as any).handleZoomComplete({} as React.MouseEvent, buildMoreProps(2));
        });

        expect(onBrush).toHaveBeenCalledTimes(1);
        const [{ start, end }] = onBrush.mock.calls[0];
        expect(start.xValue).toBe(2);
        expect(end.xValue).toBe(8);

        expect(xAxisZoom).toHaveBeenCalledWith([2, 8]);

        expect((brush.state.start as any)?.xValue).toBe(2);
        expect((brush.state.end as any)?.xValue).toBe(8);
    });

    it("supports resizing from selection handles and sets ew-resize cursor", () => {
        const { brush, buildMoreProps, onBrush, setCursorClass } = createHarness();

        act(() => {
            brush.setState({
                start: { item: { x: 2 }, xValue: 2 },
                end: { item: { x: 8 }, xValue: 8 },
            });
        });

        act(() => {
            (brush as any).handleDrawSquare({} as React.MouseEvent, {
                ...buildMoreProps(2),
                mouseXY: [20, 50],
            });
        });

        act(() => {
            (brush as any).handleZoomStart({} as React.MouseEvent, buildMoreProps(2));
        });

        act(() => {
            (brush as any).handleDrawSquare({} as React.MouseEvent, buildMoreProps(4));
        });

        act(() => {
            (brush as any).handleZoomComplete({} as React.MouseEvent, buildMoreProps(4));
        });

        const cursorCalls = setCursorClass.mock.calls.map(([value]) => value);
        expect(cursorCalls).toContain("react-financial-charts-ew-resize-cursor");
        expect(cursorCalls[cursorCalls.length - 1]).toBe(null);

        expect(onBrush).toHaveBeenCalledTimes(1);
        const [{ start, end }] = onBrush.mock.calls[0];
        expect(start.xValue).toBe(4);
        expect(end.xValue).toBe(8);
    });

    it("retains previous selection when attempted new selection is below minimum size", () => {
        const { brush, buildMoreProps, onBrush } = createHarness({ minimumSelectionSize: 20 });

        act(() => {
            brush.setState({
                start: { item: { x: 2 }, xValue: 2 },
                end: { item: { x: 8 }, xValue: 8 },
            });
        });

        act(() => {
            (brush as any).handleZoomStart({} as React.MouseEvent, buildMoreProps(5));
        });

        act(() => {
            (brush as any).handleDrawSquare({} as React.MouseEvent, buildMoreProps(5.5));
        });

        act(() => {
            (brush as any).handleZoomComplete({} as React.MouseEvent, buildMoreProps(5.5));
        });

        expect(onBrush).not.toHaveBeenCalled();
        expect((brush.state.start as any)?.xValue).toBe(2);
        expect((brush.state.end as any)?.xValue).toBe(8);
    });

    it("expands selection to the left max range when clicking left outside selection", () => {
        const { brush, buildMoreProps, onBrush } = createHarness();

        act(() => {
            brush.setState({
                start: { item: { x: 3 }, xValue: 3 },
                end: { item: { x: 7 }, xValue: 7 },
            });
        });

        act(() => {
            (brush as any).handleZoomStart({} as React.MouseEvent, buildMoreProps(0));
        });

        act(() => {
            (brush as any).handleZoomComplete({} as React.MouseEvent, {
                ...buildMoreProps(0),
                fullData: [{ x: 1 }, { x: 5 }, { x: 9 }],
            });
        });

        expect(onBrush).toHaveBeenCalledTimes(1);
        const [{ start, end }] = onBrush.mock.calls[0];
        expect(start.xValue).toBe(1);
        expect(end.xValue).toBe(7);
        expect((brush.state.start as any)?.xValue).toBe(1);
        expect((brush.state.end as any)?.xValue).toBe(7);
    });

    it("expands selection to the right max range when clicking right outside selection", () => {
        const { brush, buildMoreProps, onBrush } = createHarness();

        act(() => {
            brush.setState({
                start: { item: { x: 3 }, xValue: 3 },
                end: { item: { x: 7 }, xValue: 7 },
            });
        });

        act(() => {
            (brush as any).handleZoomStart({} as React.MouseEvent, buildMoreProps(10));
        });

        act(() => {
            (brush as any).handleZoomComplete({} as React.MouseEvent, {
                ...buildMoreProps(10),
                fullData: [{ x: 1 }, { x: 5 }, { x: 9 }],
            });
        });

        expect(onBrush).toHaveBeenCalledTimes(1);
        const [{ start, end }] = onBrush.mock.calls[0];
        expect(start.xValue).toBe(3);
        expect(end.xValue).toBe(9);
        expect((brush.state.start as any)?.xValue).toBe(3);
        expect((brush.state.end as any)?.xValue).toBe(9);
    });

    it("commits edge-extended resize drag immediately and ignores trailing click complete", () => {
        const { brush, buildMoreProps, onBrush } = createHarness();

        act(() => {
            brush.setState({
                start: { item: { x: 3 }, xValue: 3 },
                end: { item: { x: 7 }, xValue: 7 },
            });
        });

        act(() => {
            (brush as any).handleZoomStart({} as React.MouseEvent, buildMoreProps(3));
        });

        act(() => {
            (brush as any).handleDrawSquare({ buttons: 1 } as unknown as React.MouseEvent, buildMoreProps(-1));
        });

        expect(onBrush).toHaveBeenCalledTimes(1);
        let [{ start, end }] = onBrush.mock.calls[0];
        expect(start.xValue).toBe(1);
        expect(end.xValue).toBe(7);

        expect((brush.state.start as any)?.xValue).toBe(1);
        expect((brush.state.end as any)?.xValue).toBe(7);

        act(() => {
            (brush as any).handleZoomComplete({} as React.MouseEvent, buildMoreProps(-1));
        });

        expect(onBrush).toHaveBeenCalledTimes(1);
        [{ start, end }] = onBrush.mock.calls[0];
        expect(start.xValue).toBe(1);
        expect(end.xValue).toBe(7);
        expect((brush.state.start as any)?.xValue).toBe(1);
        expect((brush.state.end as any)?.xValue).toBe(7);
    });
});
