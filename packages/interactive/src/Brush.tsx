import * as React from "react";
import {
    ChartContext,
    getStrokeDasharrayCanvas,
    getMouseCanvas,
    GenericChartComponent,
    strokeDashTypes,
} from "@lfurzewaddock/react-financial-charts-core";

export interface BrushSelection {
    readonly item: any;
    readonly xValue: number | Date;
    readonly yValue?: number;
}

export interface BrushProps {
    readonly enabled: boolean;
    readonly onBrush?: ({ start, end }: { start: BrushSelection; end: BrushSelection }, moreProps: any) => void;
    readonly type?: "1D" | "2D";
    readonly strokeStyle?: string;
    readonly fillStyle?: string;
    readonly interactiveState?: object;
    readonly strokeDashArray?: strokeDashTypes;
    readonly zoomToDomain?: boolean;
    readonly minimumSelectionSize?: number;
}

interface BrushState {
    end?: BrushSelection;
    rect: any | null;
    selected?: boolean;
    start?: BrushSelection;
    x1y1?: any;
}

type DragMode = "new" | "resize-start" | "resize-end";

export class Brush extends React.Component<BrushProps, BrushState> {
    public static defaultProps = {
        type: "2D",
        strokeStyle: "#000000",
        fillStyle: "#3h3h3h",
        strokeDashArray: "ShortDash",
        zoomToDomain: false,
        minimumSelectionSize: 2,
    };

    public static contextType = ChartContext;

    declare public context: React.ContextType<typeof ChartContext>;

    private static readonly HANDLE_HIT_AREA = 8;
    private static readonly HANDLE_WIDTH = 4;

    private draftEnd?: BrushSelection;
    private draftStart?: BrushSelection;
    private dragMode?: DragMode;
    private interactionCommittedInDrag = false;
    private outsideClickSide?: "left" | "right";
    private chartBoundingRect?: DOMRect;
    private lastInteractionMoreProps?: any;
    private listeningForWindowMouseUp = false;
    private zoomHappening?: boolean;

    public constructor(props: BrushProps) {
        super(props);

        this.terminate = this.terminate.bind(this);
        this.state = {
            rect: null,
        };
    }

    private readonly normalizeBrush = (start: BrushSelection, end: BrushSelection) => {
        const startX = start.xValue instanceof Date ? start.xValue.valueOf() : start.xValue;
        const endX = end.xValue instanceof Date ? end.xValue.valueOf() : end.xValue;

        if (startX <= endX) return { start, end };

        return {
            start: end,
            end: start,
        };
    };

    public terminate() {
        this.zoomHappening = false;
        this.dragMode = undefined;
        this.interactionCommittedInDrag = false;
        this.outsideClickSide = undefined;
        this.draftStart = undefined;
        this.draftEnd = undefined;
        this.stopWindowMouseUpTracking();
        this.setBrushCursor(null);
        this.setState({
            x1y1: null,
            start: undefined,
            end: undefined,
            rect: null,
        });
    }

    public componentWillUnmount() {
        this.stopWindowMouseUpTracking();
    }

    public render() {
        const { enabled } = this.props;
        if (!enabled) return null;

        return (
            <GenericChartComponent
                disablePan={enabled}
                canvasToDraw={getMouseCanvas}
                canvasDraw={this.drawOnCanvas}
                onMouseDown={this.handleZoomStart}
                onMouseMove={this.handleDrawSquare}
                onClick={this.handleZoomComplete}
                drawOn={["mousemove", "pan", "drag"]}
            />
        );
    }

    private readonly drawOnCanvas = (ctx: CanvasRenderingContext2D, moreProps: any) => {
        const { end, rect: draftRect, start } = this.state;

        const rect =
            draftRect !== null
                ? draftRect
                : start !== undefined && end !== undefined
                  ? this.getRectFromSelection(start, end, moreProps)
                  : null;

        if (rect === null) return;

        const { x, y, height, width } = rect;
        const {
            type = Brush.defaultProps.type,
            strokeStyle = Brush.defaultProps.strokeStyle,
            fillStyle = Brush.defaultProps.fillStyle,
            strokeDashArray,
        } = this.props;

        const dashArray = getStrokeDasharrayCanvas(strokeDashArray);

        ctx.strokeStyle = strokeStyle;
        ctx.fillStyle = fillStyle;
        ctx.setLineDash(dashArray);
        ctx.beginPath();
        ctx.fillRect(x, y, width, height);
        ctx.strokeRect(x, y, width, height);

        if (type === "1D" && width > 0) {
            const handleHalfWidth = Brush.HANDLE_WIDTH / 2;
            ctx.fillStyle = strokeStyle;
            ctx.fillRect(x - handleHalfWidth, y, Brush.HANDLE_WIDTH, height);
            ctx.fillRect(x + width - handleHalfWidth, y, Brush.HANDLE_WIDTH, height);
        }
    };

    private readonly getRectFromSelection = (start: BrushSelection, end: BrushSelection, moreProps: any) => {
        const { type = Brush.defaultProps.type } = this.props;
        const {
            chartConfig: { yScale, height: chartHeight },
            xScale,
        } = moreProps;

        const x1 = xScale(start.xValue);
        const x2 = xScale(end.xValue);

        if (!Number.isFinite(x1) || !Number.isFinite(x2)) return null;

        if (type === "1D")
            return {
                x: Math.min(x1, x2),
                y: 0,
                height: chartHeight,
                width: Math.abs(x2 - x1),
            };

        const y1 = start.yValue === undefined ? 0 : yScale(start.yValue);
        const y2 = end.yValue === undefined ? chartHeight : yScale(end.yValue);

        if (!Number.isFinite(y1) || !Number.isFinite(y2)) return null;

        return {
            x: Math.min(x1, x2),
            y: Math.min(y1, y2),
            height: Math.abs(y2 - y1),
            width: Math.abs(x2 - x1),
        };
    };

    private readonly getHandleHit = (mouseX: number, moreProps: any) => {
        const { type = Brush.defaultProps.type } = this.props;
        const { start, end } = this.state;

        if (type !== "1D" || start === undefined || end === undefined) return null;

        const rect = this.getRectFromSelection(start, end, moreProps);
        if (rect === null) return null;

        const leftX = rect.x;
        const rightX = rect.x + rect.width;
        const hitArea = Brush.HANDLE_HIT_AREA;

        if (Math.abs(mouseX - leftX) <= hitArea) return "start" as const;

        if (Math.abs(mouseX - rightX) <= hitArea) return "end" as const;

        return null;
    };

    private readonly setBrushCursor = (className: string | null) => {
        const { setCursorClass } = this.context;
        if (setCursorClass !== undefined) setCursorClass(className);
    };

    private readonly stopWindowMouseUpTracking = () => {
        if (this.listeningForWindowMouseUp && typeof window !== "undefined")
            window.removeEventListener("mouseup", this.handleWindowMouseUp);

        this.listeningForWindowMouseUp = false;
        this.chartBoundingRect = undefined;
        this.lastInteractionMoreProps = undefined;
    };

    private readonly beginWindowMouseUpTracking = (event: React.MouseEvent, moreProps: any) => {
        this.lastInteractionMoreProps = moreProps;

        const target = event.target as Element | null;
        if (target?.getBoundingClientRect !== undefined) this.chartBoundingRect = target.getBoundingClientRect();

        if (!this.listeningForWindowMouseUp && typeof window !== "undefined") {
            window.addEventListener("mouseup", this.handleWindowMouseUp);
            this.listeningForWindowMouseUp = true;
        }
    };

    private readonly handleWindowMouseUp = (event: MouseEvent) => {
        const moreProps = this.lastInteractionMoreProps;
        if (moreProps === undefined) {
            this.stopWindowMouseUpTracking();
            return;
        }

        if (
            this.state.x1y1 !== null &&
            (this.dragMode === "resize-start" || this.dragMode === "resize-end") &&
            this.draftStart !== undefined &&
            this.draftEnd !== undefined &&
            this.chartBoundingRect !== undefined
        ) {
            const isOutsideLeft = event.clientX < this.chartBoundingRect.left;
            const isOutsideRight = event.clientX > this.chartBoundingRect.right;

            if (isOutsideLeft || isOutsideRight) {
                const edge: "left" | "right" = isOutsideLeft ? "left" : "right";

                if (this.dragMode === "resize-start") {
                    const edgeStart = this.getEdgeSelection(edge, this.draftStart);
                    this.commitSelection(edgeStart, this.draftEnd, moreProps);
                    return;
                }

                const edgeEnd = this.getEdgeSelection(edge, this.draftEnd);
                this.commitSelection(this.draftStart, edgeEnd, moreProps);
                return;
            }
        }

        this.handleZoomComplete({} as React.MouseEvent, moreProps);
    };

    private readonly getEdgeSelection = (edge: "left" | "right", fallbackSelection: BrushSelection) => {
        const { fullData, xAccessor, xScale } = this.context;

        if (fullData.length > 0) {
            const item = edge === "left" ? fullData[0] : fullData[fullData.length - 1];
            return {
                ...fallbackSelection,
                item,
                xValue: xAccessor(item),
            };
        }

        const [rangeStart, rangeEnd] = xScale.range();
        const edgePixel = edge === "left" ? Math.min(rangeStart, rangeEnd) : Math.max(rangeStart, rangeEnd);

        return {
            ...fallbackSelection,
            xValue: xScale.invert(edgePixel),
        };
    };

    private readonly commitSelection = (start: BrushSelection, end: BrushSelection, moreProps: any) => {
        const { onBrush, zoomToDomain } = this.props;
        const normalizedSelection = this.normalizeBrush(start, end);

        if (zoomToDomain) {
            const { xAxisZoom } = this.context;
            if (xAxisZoom !== undefined) xAxisZoom([normalizedSelection.start.xValue, normalizedSelection.end.xValue]);
        }

        if (onBrush !== undefined) onBrush(normalizedSelection, moreProps);

        this.interactionCommittedInDrag = true;
        this.zoomHappening = false;
        this.dragMode = undefined;
        this.outsideClickSide = undefined;
        this.draftStart = undefined;
        this.draftEnd = undefined;
        this.stopWindowMouseUpTracking();
        this.setBrushCursor(null);

        this.setState({
            selected: false,
            x1y1: null,
            start: normalizedSelection.start,
            end: normalizedSelection.end,
            rect: null,
        });
    };

    private readonly handleZoomStart = (event: React.MouseEvent, moreProps: any) => {
        this.zoomHappening = false;
        this.interactionCommittedInDrag = false;
        this.outsideClickSide = undefined;

        const { type = Brush.defaultProps.type } = this.props;
        const {
            mouseXY: [, mouseY],
            currentItem,
            chartConfig: { yScale },
            xAccessor,
            xScale,
        } = moreProps;

        const currentSelection = {
            item: currentItem,
            xValue: xAccessor(currentItem),
            yValue: type === "1D" ? undefined : yScale.invert(mouseY),
        };

        const x1y1 = [xScale(currentSelection.xValue), mouseY];

        const { start, end } = this.state;
        const currentRect =
            start !== undefined && end !== undefined ? this.getRectFromSelection(start, end, moreProps) : null;

        const clickedOutsideCurrentRect =
            currentRect !== null && (x1y1[0] < currentRect.x || x1y1[0] > currentRect.x + currentRect.width);

        const handleHit = this.getHandleHit(x1y1[0], moreProps);

        if (type === "1D" && start !== undefined && end !== undefined) {
            if (handleHit === "start") {
                this.dragMode = "resize-start";
                this.draftStart = currentSelection;
                this.draftEnd = end;
                this.beginWindowMouseUpTracking(event, moreProps);
                this.setBrushCursor("react-financial-charts-ew-resize-cursor");

                this.setState({
                    selected: true,
                    x1y1,
                    rect: null,
                });

                return;
            }

            if (handleHit === "end") {
                this.dragMode = "resize-end";
                this.draftStart = start;
                this.draftEnd = currentSelection;
                this.beginWindowMouseUpTracking(event, moreProps);
                this.setBrushCursor("react-financial-charts-ew-resize-cursor");

                this.setState({
                    selected: true,
                    x1y1,
                    rect: null,
                });

                return;
            }

            this.dragMode = undefined;
            this.draftStart = undefined;
            this.draftEnd = undefined;
            this.setBrushCursor(null);

            if (clickedOutsideCurrentRect && currentRect !== null)
                this.outsideClickSide = x1y1[0] < currentRect.x ? "left" : "right";

            this.setState({
                selected: false,
                x1y1: null,
                rect: null,
            });

            return;
        }

        {
            this.dragMode = "new";
            this.draftStart = currentSelection;
            this.draftEnd = undefined;
            this.beginWindowMouseUpTracking(event, moreProps);
        }

        this.setState({
            selected: true,
            x1y1,
            rect: null,
        });
    };

    private readonly handleDrawSquare = (event: React.MouseEvent, moreProps: any) => {
        const mouseButtons = (event as any)?.buttons as number | undefined;
        if (this.state.x1y1 !== null && mouseButtons === 0) {
            this.zoomHappening = false;
            this.dragMode = undefined;
            this.interactionCommittedInDrag = false;
            this.outsideClickSide = undefined;
            this.draftStart = undefined;
            this.draftEnd = undefined;
            this.stopWindowMouseUpTracking();
            this.setBrushCursor(null);

            this.setState({
                selected: false,
                x1y1: null,
                rect: null,
            });

            return;
        }

        if (this.state.x1y1 == null) {
            const {
                mouseXY: [mouseX],
            } = moreProps;
            const handleHit = this.getHandleHit(mouseX, moreProps);

            this.setBrushCursor(handleHit !== null ? "react-financial-charts-ew-resize-cursor" : null);

            return;
        }

        if (this.dragMode === undefined || this.draftStart === undefined) return;

        this.zoomHappening = true;
        this.outsideClickSide = undefined;
        this.lastInteractionMoreProps = moreProps;
        const { type = Brush.defaultProps.type } = this.props;

        const {
            mouseXY: [, mouseY],
            currentItem,
            chartConfig: { yScale },
            xAccessor,
        } = moreProps;

        const currentSelection = {
            item: currentItem,
            xValue: xAccessor(currentItem),
            yValue: type === "1D" ? undefined : yScale.invert(mouseY),
        };

        let nextStart = this.draftStart;
        let nextEnd = this.draftEnd;

        const mouseX = moreProps.mouseXY[0];
        const [rangeStart, rangeEnd] = moreProps.xScale.range();
        const rangeMin = Math.min(rangeStart, rangeEnd);
        const rangeMax = Math.max(rangeStart, rangeEnd);

        const valueOf = (value: number | Date) => (value instanceof Date ? value.valueOf() : value);
        const leftEdgeSelection =
            this.draftStart !== undefined ? this.getEdgeSelection("left", this.draftStart) : undefined;
        const rightEdgeSelection =
            this.draftEnd !== undefined ? this.getEdgeSelection("right", this.draftEnd) : undefined;

        const leftEdgePixel = leftEdgeSelection !== undefined ? moreProps.xScale(leftEdgeSelection.xValue) : undefined;
        const rightEdgePixel =
            rightEdgeSelection !== undefined ? moreProps.xScale(rightEdgeSelection.xValue) : undefined;

        const currentValue = valueOf(currentSelection.xValue);
        const atLeftDomainEdge =
            this.dragMode === "resize-start" &&
            leftEdgeSelection !== undefined &&
            currentValue === valueOf(leftEdgeSelection.xValue) &&
            leftEdgePixel !== undefined &&
            mouseX <= leftEdgePixel;

        const atRightDomainEdge =
            this.dragMode === "resize-end" &&
            rightEdgeSelection !== undefined &&
            currentValue === valueOf(rightEdgeSelection.xValue) &&
            rightEdgePixel !== undefined &&
            mouseX >= rightEdgePixel;

        const edge =
            atLeftDomainEdge || mouseX <= rangeMin
                ? "left"
                : atRightDomainEdge || mouseX >= rangeMax
                  ? "right"
                  : undefined;

        if (edge !== undefined) {
            if (this.dragMode === "resize-start" && this.draftEnd !== undefined) {
                const edgeStart = this.getEdgeSelection(edge, this.draftStart ?? currentSelection);
                this.draftStart = edgeStart;
                const edgeRect = this.getRectFromSelection(edgeStart, this.draftEnd, moreProps);
                if (edgeRect !== null)
                    this.setState({
                        selected: true,
                        rect: edgeRect,
                    });
                return;
            }

            if (this.dragMode === "resize-end" && this.draftStart !== undefined) {
                const edgeEnd = this.getEdgeSelection(edge, this.draftEnd ?? currentSelection);
                this.draftEnd = edgeEnd;
                const edgeRect = this.getRectFromSelection(this.draftStart, edgeEnd, moreProps);
                if (edgeRect !== null)
                    this.setState({
                        selected: true,
                        rect: edgeRect,
                    });
                return;
            }
        }

        if (this.dragMode === "new") nextEnd = currentSelection;
        else if (this.dragMode === "resize-start") {
            nextStart = currentSelection;
            this.setBrushCursor("react-financial-charts-ew-resize-cursor");
        } else if (this.dragMode === "resize-end") {
            nextEnd = currentSelection;
            this.setBrushCursor("react-financial-charts-ew-resize-cursor");
        }

        if (nextEnd === undefined) return;

        this.draftStart = nextStart;
        this.draftEnd = nextEnd;

        const rect = this.getRectFromSelection(nextStart, nextEnd, moreProps);

        if (rect === null) return;

        this.setState({
            selected: true,
            rect,
        });
    };

    private readonly handleZoomComplete = (_: React.MouseEvent, moreProps: any) => {
        const {
            minimumSelectionSize = Brush.defaultProps.minimumSelectionSize,
            onBrush,
            type = Brush.defaultProps.type,
            zoomToDomain,
        } = this.props;
        const { rect } = this.state;

        let nextStart = this.state.start;
        let nextEnd = this.state.end;

        if (this.interactionCommittedInDrag) {
            this.interactionCommittedInDrag = false;
            this.zoomHappening = false;
            this.dragMode = undefined;
            this.outsideClickSide = undefined;
            this.draftStart = undefined;
            this.draftEnd = undefined;
            this.stopWindowMouseUpTracking();
            this.setBrushCursor(null);
            return;
        }

        const selectionIsValid =
            rect !== null &&
            (type === "1D"
                ? rect.width >= minimumSelectionSize
                : rect.width >= minimumSelectionSize && rect.height >= minimumSelectionSize);

        if (this.zoomHappening && selectionIsValid && this.draftStart !== undefined && this.draftEnd !== undefined) {
            const normalizedSelection = this.normalizeBrush(this.draftStart, this.draftEnd);

            nextStart = normalizedSelection.start;
            nextEnd = normalizedSelection.end;

            if (zoomToDomain) {
                const { xAxisZoom } = this.context;
                if (xAxisZoom !== undefined)
                    xAxisZoom([normalizedSelection.start.xValue, normalizedSelection.end.xValue]);
            }

            if (onBrush !== undefined) onBrush(normalizedSelection, moreProps);
        } else if (
            !this.zoomHappening &&
            type === "1D" &&
            this.outsideClickSide !== undefined &&
            nextStart !== undefined &&
            nextEnd !== undefined
        ) {
            const fullData = moreProps.fullData ?? moreProps.plotData ?? [];
            const [firstItem, lastItem] = [fullData[0], fullData[fullData.length - 1]];
            const [rangeStart, rangeEnd] = moreProps.xScale.range();

            const leftEdgeXValue =
                firstItem !== undefined
                    ? moreProps.xAccessor(firstItem)
                    : moreProps.xScale.invert(Math.min(rangeStart, rangeEnd));
            const rightEdgeXValue =
                lastItem !== undefined
                    ? moreProps.xAccessor(lastItem)
                    : moreProps.xScale.invert(Math.max(rangeStart, rangeEnd));

            const leftSelection = {
                item: firstItem ?? nextStart.item,
                xValue: leftEdgeXValue,
                yValue: nextStart.yValue,
            };

            const rightSelection = {
                item: lastItem ?? nextEnd.item,
                xValue: rightEdgeXValue,
                yValue: nextEnd.yValue,
            };

            const expandedSelection =
                this.outsideClickSide === "left"
                    ? this.normalizeBrush(leftSelection, nextEnd)
                    : this.normalizeBrush(nextStart, rightSelection);

            nextStart = expandedSelection.start;
            nextEnd = expandedSelection.end;

            if (zoomToDomain) {
                const { xAxisZoom } = this.context;
                if (xAxisZoom !== undefined) xAxisZoom([nextStart.xValue, nextEnd.xValue]);
            }

            if (onBrush !== undefined) onBrush({ start: nextStart, end: nextEnd }, moreProps);
        }

        this.zoomHappening = false;
        this.dragMode = undefined;
        this.interactionCommittedInDrag = false;
        this.outsideClickSide = undefined;
        this.draftStart = undefined;
        this.draftEnd = undefined;
        this.stopWindowMouseUpTracking();
        this.setBrushCursor(null);

        this.setState({
            selected: false,
            x1y1: null,
            start: nextStart,
            end: nextEnd,
            rect: null,
        });
    };
}
