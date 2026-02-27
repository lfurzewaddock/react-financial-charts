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

    private zoomHappening?: boolean;
    private previousSelection?: { start: BrushSelection; end: BrushSelection };

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
        this.previousSelection = undefined;
        this.setState({
            x1y1: null,
            start: undefined,
            end: undefined,
            rect: null,
        });
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

    private readonly handleZoomStart = (_: React.MouseEvent, moreProps: any) => {
        this.zoomHappening = false;
        const { start, end } = this.state;

        this.previousSelection =
            start !== undefined && end !== undefined
                ? {
                      start,
                      end,
                  }
                : undefined;

        const { type = Brush.defaultProps.type } = this.props;
        const {
            mouseXY: [, mouseY],
            currentItem,
            chartConfig: { yScale },
            xAccessor,
            xScale,
        } = moreProps;

        const x1y1 = [xScale(xAccessor(currentItem)), mouseY];

        this.setState({
            selected: true,
            x1y1,
            start: {
                item: currentItem,
                xValue: xAccessor(currentItem),
                yValue: type === "1D" ? undefined : yScale.invert(mouseY),
            },
            end: undefined,
            rect: null,
        });
    };

    private readonly handleDrawSquare = (_: React.MouseEvent, moreProps: any) => {
        if (this.state.x1y1 == null) return;

        this.zoomHappening = true;
        const { type = Brush.defaultProps.type } = this.props;

        const {
            mouseXY: [, mouseY],
            currentItem,
            chartConfig: { yScale, height: chartHeight },
            xAccessor,
            xScale,
        } = moreProps;

        const [x2, y2] = [xScale(xAccessor(currentItem)), mouseY];

        const {
            x1y1: [x1, y1],
        } = this.state;

        const x = Math.min(x1, x2);
        const y = type === "1D" ? 0 : Math.min(y1, y2);
        const height = type === "1D" ? chartHeight : Math.abs(y2 - y1);
        const width = Math.abs(x2 - x1);

        this.setState({
            selected: true,
            end: {
                item: currentItem,
                xValue: xAccessor(currentItem),
                yValue: type === "1D" ? undefined : yScale.invert(mouseY),
            },
            rect: {
                x,
                y,
                height,
                width,
            },
        });
    };

    private readonly handleZoomComplete = (_: React.MouseEvent, moreProps: any) => {
        const {
            minimumSelectionSize = Brush.defaultProps.minimumSelectionSize,
            onBrush,
            type = Brush.defaultProps.type,
            zoomToDomain,
        } = this.props;
        const { end, rect, start } = this.state;

        const selectionIsValid =
            rect !== null &&
            (type === "1D"
                ? rect.width >= minimumSelectionSize
                : rect.width >= minimumSelectionSize && rect.height >= minimumSelectionSize);

        if (this.zoomHappening && selectionIsValid && start !== undefined && end !== undefined) {
            const normalizedSelection = this.normalizeBrush(start, end);

            if (zoomToDomain) {
                const { xAxisZoom } = this.context;
                if (xAxisZoom !== undefined)
                    xAxisZoom([normalizedSelection.start.xValue, normalizedSelection.end.xValue]);
            }

            if (onBrush !== undefined) onBrush(normalizedSelection, moreProps);

            this.previousSelection = undefined;

            this.setState({
                selected: false,
                x1y1: null,
                start: normalizedSelection.start,
                end: normalizedSelection.end,
                rect: null,
            });

            return;
        }

        this.zoomHappening = false;

        const { previousSelection } = this;

        this.previousSelection = undefined;

        this.setState({
            selected: false,
            x1y1: null,
            start: previousSelection?.start,
            end: previousSelection?.end,
            rect: null,
        });
    };
}
