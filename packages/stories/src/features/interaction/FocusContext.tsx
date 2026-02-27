import * as React from "react";
import {
    discontinuousTimeScaleProviderBuilder,
    Brush,
    CandlestickSeries,
    Chart,
    ChartCanvas,
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
        const startValue = start.xValue instanceof Date ? start.xValue.valueOf() : start.xValue;
        const endValue = end.xValue instanceof Date ? end.xValue.valueOf() : end.xValue;

        const nextExtents: [number | Date, number | Date] =
            startValue <= endValue ? [start.xValue, end.xValue] : [end.xValue, start.xValue];

        this.setState({
            focusExtents: nextExtents,
        });
    };

    private readonly focusYExtents = (d: IOHLCData) => {
        return [d.high, d.low];
    };

    private readonly contextYExtents = (d: IOHLCData) => {
        return d.close;
    };
}

export default withOHLCData()(withSize({ style: { minHeight: 600 } })(withDeviceRatio()(FocusContext)));
