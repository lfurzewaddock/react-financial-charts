import * as React from "react";
import {
    discontinuousTimeScaleProviderBuilder,
    Brush,
    CandlestickSeries,
    Chart,
    ChartCanvas,
    GenericChartComponent,
    LineSeries,
    XAxis,
    YAxis,
    withDeviceRatio,
    withSize,
} from "react-financial-charts";
import { IOHLCData, withOHLCData } from "../../data";

interface ChartProps {
    readonly data: IOHLCData[];
    readonly height: number;
    readonly ratio: number;
    readonly width: number;
}

interface FocusContextState {
    readonly focusExtents?: [number | Date, number | Date];
}

class FocusContext extends React.Component<ChartProps, FocusContextState> {
    private readonly focusMargin = { left: 0, right: 40, top: 0, bottom: 24 };
    private readonly contextMargin = { left: 0, right: 40, top: 0, bottom: 24 };
    private readonly contextCanvasHeight = 140;
    private readonly xScaleProvider = discontinuousTimeScaleProviderBuilder().inputDateAccessor(
        (d: IOHLCData) => d.date,
    );

    public constructor(props: ChartProps) {
        super(props);

        this.state = {
            focusExtents: undefined,
        };
    }

    public render() {
        const { data: initialData, height, ratio, width } = this.props;
        // abort if no height yet
        if (height <= 0) return;

        const { contextCanvasHeight, contextMargin, focusMargin, xScaleProvider } = this;

        const focusCanvasHeight = height - contextCanvasHeight - 12;
        if (focusCanvasHeight <= 0) return;

        const { data, xScale, xAccessor, displayXAccessor } = xScaleProvider(initialData);
        if (data.length === 0) return;

        const contextExtents: [number | Date, number | Date] = [xAccessor(data[0]), xAccessor(data[data.length - 1])];

        const defaultFocusExtents: [number | Date, number | Date] = contextExtents;

        const focusExtents = this.state.focusExtents ?? defaultFocusExtents;

        const brushInteractiveState = {
            start: {
                item: undefined,
                xValue: focusExtents[0],
            },
            end: {
                item: undefined,
                xValue: focusExtents[1],
            },
        };

        return (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <ChartCanvas
                    height={focusCanvasHeight}
                    ratio={ratio}
                    width={width}
                    margin={focusMargin}
                    data={data}
                    displayXAccessor={displayXAccessor}
                    seriesName="FocusData"
                    xScale={xScale}
                    xAccessor={xAccessor}
                    xExtents={focusExtents}
                >
                    <Chart id={1} yExtents={this.focusYExtents}>
                        <XAxis showGridLines showTicks={false} showTickLabel={true} />
                        <YAxis ticks={5} />
                        <CandlestickSeries />
                        <GenericChartComponent
                            drawOn={["pan", "zoom"]}
                            onPan={this.handleFocusChartInteraction}
                            onPanEnd={this.handleFocusChartInteraction}
                            onZoom={this.handleFocusChartInteraction}
                        />
                    </Chart>
                </ChartCanvas>

                <ChartCanvas
                    height={contextCanvasHeight}
                    ratio={ratio}
                    width={width}
                    margin={contextMargin}
                    data={data}
                    displayXAccessor={displayXAccessor}
                    seriesName="ContextData"
                    xScale={xScale}
                    xAccessor={xAccessor}
                    xExtents={contextExtents}
                    disablePan
                    disableZoom
                    useCrossHairStyleCursor={false}
                >
                    <Chart id={2} yExtents={this.contextYExtents}>
                        <XAxis ticks={6} showGridLines />
                        <YAxis ticks={3} showTicks={false} showDomain={false} showTickLabel={false} />
                        <LineSeries yAccessor={this.contextYExtents} strokeStyle="#2563eb" />
                        <Brush
                            enabled
                            type="1D"
                            onBrush={this.handleBrush}
                            onBrushChange={this.handleBrush}
                            interactiveState={brushInteractiveState}
                            minimumSelectionSize={5}
                            strokeStyle="#2563eb"
                            fillStyle="rgba(37, 99, 235, 0.18)"
                        />
                    </Chart>
                </ChartCanvas>
            </div>
        );
    }

    private readonly handleBrush = ({
        start,
        end,
    }: {
        start: { xValue: number | Date };
        end: { xValue: number | Date };
    }) => {
        this.updateFocusExtents(start.xValue, end.xValue);
    };

    private readonly handleFocusChartInteraction = (_: any, moreProps: any) => {
        const [start, end] = moreProps.xScale.domain() as [number | Date, number | Date];

        this.updateFocusExtents(start, end);
    };

    private readonly updateFocusExtents = (left: number | Date, right: number | Date) => {
        const leftValue = this.toComparableValue(left);
        const rightValue = this.toComparableValue(right);

        const nextExtents: [number | Date, number | Date] = leftValue <= rightValue ? [left, right] : [right, left];

        const currentExtents = this.state.focusExtents;
        if (currentExtents !== undefined) {
            const [currentStart, currentEnd] = currentExtents;
            const currentStartValue = this.toComparableValue(currentStart);
            const currentEndValue = this.toComparableValue(currentEnd);
            const nextStartValue = this.toComparableValue(nextExtents[0]);
            const nextEndValue = this.toComparableValue(nextExtents[1]);

            if (currentStartValue === nextStartValue && currentEndValue === nextEndValue) return;
        }

        this.setState({
            focusExtents: nextExtents,
        });
    };

    private readonly toComparableValue = (value: number | Date) => {
        return value instanceof Date ? value.valueOf() : value;
    };

    private readonly focusYExtents = (d: IOHLCData) => {
        return [d.high, d.low];
    };

    private readonly contextYExtents = (d: IOHLCData) => {
        return d.close;
    };
}

export default withOHLCData()(withSize({ style: { minHeight: 600 } })(withDeviceRatio()(FocusContext)));
