import { ScaleContinuousNumeric, ScaleTime } from "d3-scale";

import { ChartConfig } from "../utils/ChartDataUtil";
import { ICanvasContexts } from "../CanvasContainer";
import { IZoomAnchorOptions } from "../zoom";
import type { MoreProps } from "../MoreProps";
import evaluator from "../utils/evaluator";

type UtilEvaluator = ReturnType<typeof evaluator>;

export interface ChartCanvasContextType<TXAxis extends number | Date> {
    width: number;
    height: number;
    margin: { top: number; right: number; bottom: number; left: number };
    chartId: number | string;
    getCanvasContexts?: () => ICanvasContexts | undefined;
    xScale: ScaleContinuousNumeric<number, number> | ScaleTime<number, number>;
    ratio: number;
    xAccessor: (data: any) => TXAxis;
    displayXAccessor: (data: any) => TXAxis;
    xAxisZoom?: (newDomain: any) => void;
    yAxisZoom?: (chartId: string, newDomain: any) => void;
    redraw: () => void;
    plotData: any[];
    fullData: any[];
    chartConfigs: ChartConfig[];
    morePropsDecorator?: () => void;
    generateSubscriptionId?: () => number;
    getMutableState: () => MutableState;
    amIOnTop: (id: string | number) => boolean;
    subscribe: (id: string | number, rest: any) => void;
    unsubscribe: (id: string | number) => void;
    setCursorClass: (className: string | null | undefined) => void;
}

export interface ChartCanvasProps<TXAxis extends number | Date> {
    readonly clamp?:
        | boolean
        | ("left" | "right" | "both")
        | ((domain: [number, number], items: [number, number]) => [number, number]);
    readonly className?: string;
    readonly children?: React.ReactNode;
    readonly data: any[];
    readonly defaultFocus?: boolean;
    readonly disableInteraction?: boolean;
    readonly disablePan?: boolean;
    readonly disableZoom?: boolean;
    readonly displayXAccessor?: (data: any) => TXAxis;
    readonly flipXScale?: boolean;
    readonly height: number;
    readonly margin: {
        bottom: number;
        left: number;
        right: number;
        top: number;
    };
    readonly maintainPointsPerPixelOnResize?: boolean;
    readonly minPointsPerPxThreshold?: number;
    readonly mouseMoveEvent?: boolean;
    /**
     * Called when panning left past the first data point.
     */
    readonly onLoadAfter?: (start: TXAxis, end: TXAxis) => void;
    /**
     * Called when panning right past the last data point.
     */
    readonly onLoadBefore?: (start: TXAxis, end: TXAxis) => void;
    /**
     * Click event handler.
     */
    readonly onClick?: React.MouseEventHandler<HTMLDivElement>;
    /**
     * Double click event handler.
     */
    readonly onDoubleClick?: React.MouseEventHandler<HTMLDivElement>;
    readonly padding?:
        | number
        | {
              bottom: number;
              left: number;
              right: number;
              top: number;
          };
    readonly plotFull?: boolean;
    readonly pointsPerPxThreshold?: number;
    readonly postCalculator?: (plotData: any[]) => any[];
    readonly ratio: number;
    readonly seriesName: string;
    readonly useCrossHairStyleCursor?: boolean;
    readonly width: number;
    readonly xAccessor: (data: any) => TXAxis;
    readonly xExtents: ((data: any[]) => [TXAxis, TXAxis]) | (((data: any[]) => TXAxis) | TXAxis)[];
    readonly xScale: ScaleContinuousNumeric<number, number> | ScaleTime<number, number>;
    readonly zIndex?: number;
    readonly zoomAnchor?: (options: IZoomAnchorOptions<any, TXAxis>) => TXAxis;
    readonly zoomMultiplier?: number;
}

export interface ChartCanvasState<TXAxis extends number | Date> {
    lastProps?: ChartCanvasProps<TXAxis>;
    propIteration?: number;
    xAccessor: (data: any) => TXAxis;
    displayXAccessor?: any;
    filterData?: UtilEvaluator["filterData"];
    chartConfigs: ChartConfig[];
    plotData: any[];
    xScale: ScaleContinuousNumeric<number, number> | ScaleTime<number, number>;
    fullData: any[];
}

export interface Subscription {
    id: string;
    getPanConditions: () => {
        draggable: boolean;
        panEnabled: boolean;
    };
    draw: (props: { trigger: string } | { force: boolean }) => void;
    listener: (type: string, newMoreProps: MoreProps | undefined, state: any, e: any) => void;
}

export interface MutableState {
    mouseXY: [number, number];
    currentItem: any;
    currentCharts: string[];
}
