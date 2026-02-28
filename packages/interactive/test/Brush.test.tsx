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
    const redraw = jest.fn();

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
        redraw,
    };

    const chartCtx = {
        ...chartCanvasCtx,
        chartConfig,
    };

    const renderBrush = (nextProps?: Partial<React.ComponentProps<typeof Brush>>) => (
        <ChartCanvasContext.Provider value={chartCanvasCtx as any}>
            <ChartContext.Provider value={chartCtx as any}>
                <svg>
                    <Brush ref={brushRef} enabled type="1D" minimumSelectionSize={5} onBrush={onBrush} {...nextProps} />
                </svg>
            </ChartContext.Provider>
        </ChartCanvasContext.Provider>
    );

    const rendered = render(renderBrush(props));

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
        updateProps: (nextProps?: Partial<React.ComponentProps<typeof Brush>>) => {
            rendered.rerender(renderBrush(nextProps));
        },
        onBrush,
        redraw,
        setCursorClass,
        xAxisZoom,
        ...rendered,
    };
};

const buildMouseDownEvent = (left = 0, right = 100) =>
    ({
        target: {
            getBoundingClientRect: () => ({ left, right }),
        },
    }) as unknown as React.MouseEvent;

describe("Brush focus-context behaviour", () => {
    it("initializes selection from interactiveState", () => {
        const { brush } = createHarness({
            interactiveState: {
                start: { item: { x: 2 }, xValue: 2 },
                end: { item: { x: 8 }, xValue: 8 },
            },
        });

        expect((brush.state.start as any)?.xValue).toBe(2);
        expect((brush.state.end as any)?.xValue).toBe(8);
    });

    it("syncs selection from interactiveState updates when idle", () => {
        const { brush, updateProps } = createHarness({
            interactiveState: {
                start: { item: { x: 2 }, xValue: 2 },
                end: { item: { x: 8 }, xValue: 8 },
            },
        });

        act(() => {
            updateProps({
                interactiveState: {
                    start: { item: { x: 4 }, xValue: 4 },
                    end: { item: { x: 9 }, xValue: 9 },
                },
            });
        });

        expect((brush.state.start as any)?.xValue).toBe(4);
        expect((brush.state.end as any)?.xValue).toBe(9);
    });

    it("requests chart redraw when syncing interactiveState", () => {
        const { updateProps, redraw } = createHarness({
            interactiveState: {
                start: { item: { x: 2 }, xValue: 2 },
                end: { item: { x: 8 }, xValue: 8 },
            },
        });

        redraw.mockClear();

        act(() => {
            updateProps({
                interactiveState: {
                    start: { item: { x: 3 }, xValue: 3 },
                    end: { item: { x: 9 }, xValue: 9 },
                },
            });
        });

        expect(redraw).toHaveBeenCalledTimes(1);
    });

    it("ignores interactiveState updates while a drag interaction is active", () => {
        const { brush, buildMoreProps, updateProps } = createHarness({
            interactiveState: {
                start: { item: { x: 2 }, xValue: 2 },
                end: { item: { x: 8 }, xValue: 8 },
            },
        });

        act(() => {
            (brush as any).handleZoomStart(buildMouseDownEvent(), buildMoreProps(1));
        });

        expect(brush.state.x1y1).not.toBeNull();

        act(() => {
            updateProps({
                interactiveState: {
                    start: { item: { x: 4 }, xValue: 4 },
                    end: { item: { x: 9 }, xValue: 9 },
                },
            });
        });

        expect((brush.state.start as any)?.xValue).toBe(2);
        expect((brush.state.end as any)?.xValue).toBe(8);
    });

    it("does not mutate selection when interactiveState values are unchanged", () => {
        const { brush, updateProps } = createHarness({
            interactiveState: {
                start: { item: { x: 2 }, xValue: 2 },
                end: { item: { x: 8 }, xValue: 8 },
            },
        });

        const previousStart = brush.state.start;
        const previousEnd = brush.state.end;

        act(() => {
            updateProps({
                interactiveState: {
                    start: { item: { x: 2 }, xValue: 2 },
                    end: { item: { x: 8 }, xValue: 8 },
                },
            });
        });

        expect(brush.state.start).toBe(previousStart);
        expect(brush.state.end).toBe(previousEnd);
    });

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

    it("commits a new selection on window mouseup outside chart before any prior selection", () => {
        const { brush, buildMoreProps, onBrush } = createHarness();

        act(() => {
            (brush as any).handleZoomStart(buildMouseDownEvent(), buildMoreProps(2));
        });

        act(() => {
            (brush as any).handleDrawSquare({} as React.MouseEvent, buildMoreProps(8));
        });

        act(() => {
            (brush as any).handleWindowMouseUp({ clientX: 120 } as MouseEvent);
        });

        expect(onBrush).toHaveBeenCalledTimes(1);
        const [{ start, end }] = onBrush.mock.calls[0];
        expect(start.xValue).toBe(2);
        expect(end.xValue).toBe(8);
        expect((brush.state.start as any)?.xValue).toBe(2);
        expect((brush.state.end as any)?.xValue).toBe(8);
    });

    it("cleans up window mouseup tracking when drag is canceled", () => {
        const { brush, buildMoreProps } = createHarness();

        act(() => {
            (brush as any).handleZoomStart(buildMouseDownEvent(), buildMoreProps(2));
        });

        expect((brush as any).listeningForWindowMouseUp).toBe(true);

        act(() => {
            (brush as any).handleDrawSquare({ buttons: 0 } as React.MouseEvent, buildMoreProps(3));
        });

        expect((brush as any).listeningForWindowMouseUp).toBe(false);
    });

    it("stops window tracking when mouseup occurs without interaction context", () => {
        const { brush } = createHarness();

        (brush as any).listeningForWindowMouseUp = true;
        (brush as any).lastInteractionMoreProps = undefined;

        act(() => {
            (brush as any).handleWindowMouseUp({ clientX: 10 } as MouseEvent);
        });

        expect((brush as any).listeningForWindowMouseUp).toBe(false);
    });

    it("commits resize-start drag to left edge when window mouseup happens outside chart", () => {
        const { brush, buildMoreProps, onBrush } = createHarness();

        act(() => {
            brush.setState({
                start: { item: { x: 2 }, xValue: 2 },
                end: { item: { x: 8 }, xValue: 8 },
            });
        });

        act(() => {
            (brush as any).handleZoomStart(buildMouseDownEvent(), buildMoreProps(2));
        });

        act(() => {
            (brush as any).handleWindowMouseUp({ clientX: -5 } as MouseEvent);
        });

        expect(onBrush).toHaveBeenCalledTimes(1);
        const [{ start, end }] = onBrush.mock.calls[0];
        expect(start.xValue).toBe(1);
        expect(end.xValue).toBe(8);

        act(() => {
            (brush as any).handleZoomComplete({} as React.MouseEvent, buildMoreProps(2));
        });

        expect(onBrush).toHaveBeenCalledTimes(1);
    });

    it("commits resize-end drag to right edge when window mouseup happens outside chart", () => {
        const { brush, buildMoreProps, onBrush } = createHarness();

        act(() => {
            brush.setState({
                start: { item: { x: 2 }, xValue: 2 },
                end: { item: { x: 8 }, xValue: 8 },
            });
        });

        act(() => {
            (brush as any).handleZoomStart(buildMouseDownEvent(), buildMoreProps(8));
        });

        act(() => {
            (brush as any).handleWindowMouseUp({ clientX: 200 } as MouseEvent);
        });

        expect(onBrush).toHaveBeenCalledTimes(1);
        const [{ start, end }] = onBrush.mock.calls[0];
        expect(start.xValue).toBe(2);
        expect(end.xValue).toBe(9);
    });

    it("snaps resize-start draft to left edge when dragged beyond range", () => {
        const { brush, buildMoreProps } = createHarness();

        act(() => {
            brush.setState({
                start: { item: { x: 2 }, xValue: 2 },
                end: { item: { x: 8 }, xValue: 8 },
            });
        });

        act(() => {
            (brush as any).handleZoomStart(buildMouseDownEvent(), buildMoreProps(2));
        });

        act(() => {
            (brush as any).handleDrawSquare({} as React.MouseEvent, buildMoreProps(-1));
        });

        expect((brush as any).draftStart?.xValue).toBe(1);
        expect((brush.state.rect as any)?.x).toBe(10);
    });

    it("snaps resize-end draft to right edge when dragged beyond range", () => {
        const { brush, buildMoreProps } = createHarness();

        act(() => {
            brush.setState({
                start: { item: { x: 2 }, xValue: 2 },
                end: { item: { x: 8 }, xValue: 8 },
            });
        });

        act(() => {
            (brush as any).handleZoomStart(buildMouseDownEvent(), buildMoreProps(8));
        });

        act(() => {
            (brush as any).handleDrawSquare({} as React.MouseEvent, buildMoreProps(11));
        });

        expect((brush as any).draftEnd?.xValue).toBe(9);
        expect((brush.state.rect as any)?.width).toBe(70);
    });

    it("falls back to xScale range edges when fullData is empty", () => {
        const { brush } = createHarness();

        (brush as any).context.fullData = [];

        const fallbackSelection = {
            item: { x: 5 },
            xValue: 5,
        };

        const leftSelection = (brush as any).getEdgeSelection("left", fallbackSelection);
        const rightSelection = (brush as any).getEdgeSelection("right", fallbackSelection);

        expect(leftSelection.xValue).toBe(0);
        expect(rightSelection.xValue).toBe(10);
    });

    it("supports 2D brush selection", () => {
        const { brush, buildMoreProps, onBrush } = createHarness({ type: "2D" });

        act(() => {
            (brush as any).handleZoomStart(buildMouseDownEvent(), buildMoreProps(2, 20));
        });

        act(() => {
            (brush as any).handleDrawSquare({} as React.MouseEvent, buildMoreProps(8, 80));
        });

        act(() => {
            (brush as any).handleZoomComplete({} as React.MouseEvent, buildMoreProps(8, 80));
        });

        expect(onBrush).toHaveBeenCalledTimes(1);
        const [{ start, end }] = onBrush.mock.calls[0];
        expect(start.xValue).toBe(2);
        expect(end.xValue).toBe(8);
        expect(start.yValue).toBe(8);
        expect(end.yValue).toBeCloseTo(2, 12);
    });

    it("applies zoomToDomain for click-outside expansion", () => {
        const { brush, buildMoreProps, xAxisZoom } = createHarness({ zoomToDomain: true });

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

        expect(xAxisZoom).toHaveBeenCalledWith([1, 7]);
    });

    it("terminates and clears interactive state", () => {
        const { brush } = createHarness();

        act(() => {
            brush.setState({
                selected: true,
                start: { item: { x: 2 }, xValue: 2 },
                end: { item: { x: 8 }, xValue: 8 },
                x1y1: [20, 50],
                rect: { x: 20, y: 0, width: 60, height: 100 },
            });
        });

        act(() => {
            brush.terminate();
        });

        expect(brush.state.x1y1).toBeNull();
        expect(brush.state.start).toBeUndefined();
        expect(brush.state.end).toBeUndefined();
        expect(brush.state.rect).toBeNull();
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

    it("shows move cursor when hovering inside an existing selection body", () => {
        const { brush, buildMoreProps, setCursorClass } = createHarness();

        act(() => {
            brush.setState({
                start: { item: { x: 2 }, xValue: 2 },
                end: { item: { x: 8 }, xValue: 8 },
            });
        });

        act(() => {
            (brush as any).handleDrawSquare({} as React.MouseEvent, buildMoreProps(5));
        });

        const cursorCalls = setCursorClass.mock.calls.map(([value]) => value);
        expect(cursorCalls).toContain("react-financial-charts-move-cursor");
    });

    it("retains previous selection when attempted new outside selection is below minimum size", () => {
        const { brush, buildMoreProps, onBrush } = createHarness({ minimumSelectionSize: 20 });

        act(() => {
            brush.setState({
                start: { item: { x: 2 }, xValue: 2 },
                end: { item: { x: 8 }, xValue: 8 },
            });
        });

        act(() => {
            (brush as any).handleZoomStart(buildMouseDownEvent(), buildMoreProps(1));
        });

        act(() => {
            (brush as any).handleDrawSquare({} as React.MouseEvent, buildMoreProps(1.5));
        });

        act(() => {
            (brush as any).handleZoomComplete({} as React.MouseEvent, buildMoreProps(1.5));
        });

        expect(onBrush).not.toHaveBeenCalled();
        expect((brush.state.start as any)?.xValue).toBe(2);
        expect((brush.state.end as any)?.xValue).toBe(8);
    });

    it("moves existing selection when dragging between handles", () => {
        const { brush, buildMoreProps, onBrush } = createHarness();

        act(() => {
            brush.setState({
                start: { item: { x: 2 }, xValue: 2 },
                end: { item: { x: 8 }, xValue: 8 },
            });
        });

        act(() => {
            (brush as any).handleZoomStart(buildMouseDownEvent(), buildMoreProps(5));
        });

        act(() => {
            (brush as any).handleDrawSquare({} as React.MouseEvent, buildMoreProps(6));
        });

        act(() => {
            (brush as any).handleZoomComplete({} as React.MouseEvent, buildMoreProps(6));
        });

        expect(onBrush).toHaveBeenCalledTimes(1);
        const [{ start, end }] = onBrush.mock.calls[0];
        expect(start.xValue).toBeCloseTo(3, 12);
        expect(end.xValue).toBeCloseTo(9, 12);
        expect((brush.state.start as any)?.xValue).toBeCloseTo(3, 12);
        expect((brush.state.end as any)?.xValue).toBeCloseTo(9, 12);
    });

    it("replaces an existing selection when dragging a new selection from outside current bounds", () => {
        const { brush, buildMoreProps, onBrush } = createHarness();

        act(() => {
            brush.setState({
                start: { item: { x: 3 }, xValue: 3 },
                end: { item: { x: 7 }, xValue: 7 },
            });
        });

        act(() => {
            (brush as any).handleZoomStart(buildMouseDownEvent(), buildMoreProps(1));
        });

        act(() => {
            (brush as any).handleDrawSquare({} as React.MouseEvent, buildMoreProps(2));
        });

        act(() => {
            (brush as any).handleZoomComplete({} as React.MouseEvent, buildMoreProps(2));
        });

        expect(onBrush).toHaveBeenCalledTimes(1);
        const [{ start, end }] = onBrush.mock.calls[0];
        expect(start.xValue).toBe(1);
        expect(end.xValue).toBe(2);
        expect((brush.state.start as any)?.xValue).toBe(1);
        expect((brush.state.end as any)?.xValue).toBe(2);
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
});
