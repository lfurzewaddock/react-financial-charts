import * as React from "react";
import {
    Annotate,
    discontinuousTimeScaleProviderBuilder,
    Brush,
    CandlestickSeries,
    Chart,
    ChartCanvas,
    LineSeries,
    MarkerAnnotation,
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

class FocusContext extends React.Component<ChartProps> {
    private readonly margin = { left: 0, right: 40, top: 0, bottom: 24 };
    private readonly contextChartHeight = 80;
    private readonly xScaleProvider = discontinuousTimeScaleProviderBuilder().inputDateAccessor(
        (d: IOHLCData) => d.date,
    );

    public render() {
        const { data: initialData, height, ratio, width } = this.props;
        // abort if no height yet
        if (height <= 0) return;

        const { margin, xScaleProvider, contextChartHeight } = this;

        const { data, xScale, xAccessor, displayXAccessor } = xScaleProvider(initialData);

        const max = xAccessor(data[data.length - 1]);
        const min = xAccessor(data[Math.max(0, data.length - 100)]);
        const xExtents = [min, max];

        const gridHeight = height - margin.top - margin.bottom;
        const focusChartHeight = gridHeight - contextChartHeight;

        const markerAnnotation = {
            markerShape: "circle",
            markerSize: 4,
            fillStyle: "red",
            strokeStyle: "blue",
            strokeWidth: 1,
            y: ({ yScale, datum }: any) => yScale(datum.high),
            tooltip: "Go short",
        };

        return (
            <ChartCanvas
                height={height}
                ratio={ratio}
                width={width}
                margin={margin}
                data={data}
                displayXAccessor={displayXAccessor}
                seriesName="Data"
                xScale={xScale}
                xAccessor={xAccessor}
                xExtents={xExtents}
            >
                <Chart id={1} height={focusChartHeight} yExtents={this.focusYExtents}>
                    <XAxis showGridLines showTicks={false} showTickLabel={false} />
                    <YAxis ticks={5} />
                    <CandlestickSeries />
                </Chart>
                <Chart
                    id={2}
                    height={contextChartHeight}
                    origin={this.contextChartOrigin}
                    yExtents={this.contextYExtents}
                    padding={{ top: 8, bottom: 8 }}
                >
                    <XAxis ticks={6} showGridLines />
                    <YAxis ticks={3} showTicks={false} showDomain={false} showTickLabel={false} />
                    <LineSeries yAccessor={this.contextYExtents} strokeStyle="#2563eb" />
                    <Annotate with={MarkerAnnotation} usingProps={markerAnnotation} when={this.when} />

                    <Brush
                        enabled
                        type="1D"
                        zoomToDomain
                        minimumSelectionSize={5}
                        strokeStyle="#2563eb"
                        fillStyle="rgba(37, 99, 235, 0.18)"
                    />
                </Chart>
            </ChartCanvas>
        );
    }

    private readonly contextChartOrigin = (_: number, h: number) => {
        return [0, h - this.contextChartHeight];
    };

    private readonly focusYExtents = (d: IOHLCData) => {
        return [d.high, d.low];
    };

    private readonly contextYExtents = (d: IOHLCData) => {
        return d.close;
    };

    private readonly when = (data: IOHLCData) => {
        return data.date.getDay() === 1;
    };
}

export default withOHLCData()(withSize({ style: { minHeight: 600 } })(withDeviceRatio()(FocusContext)));
