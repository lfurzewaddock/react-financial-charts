import * as React from "react";
import {
    Annotate,
    ema,
    discontinuousTimeScaleProviderBuilder,
    CandlestickSeries,
    Chart,
    ChartCanvas,
    MarkerAnnotation,
    XAxis,
    YAxis,
    withDeviceRatio,
    withSize,
} from "react-financial-charts";
import { IOHLCData, withOHLCData } from "../../data";
import { type MarkerAnnotationProps } from "../../../../annotations/src/MarkerAnnotation";

export interface ChartProps extends Pick<
    MarkerAnnotationProps,
    "markerShape" | "markerSize" | "fillStyle" | "strokeStyle" | "strokeWidth" | "y"
> {
    readonly data: IOHLCData[];
    readonly height: number;
    readonly ratio: number;
    readonly width: number;
}

class Annotated extends React.Component<ChartProps> {
    private readonly margin = { left: 0, right: 48, top: 0, bottom: 24 };
    private readonly xScaleProvider = discontinuousTimeScaleProviderBuilder().inputDateAccessor(
        (d: IOHLCData) => d.date,
    );

    public render() {
        const {
            data: initialData,
            height,
            ratio,
            width,
            markerShape,
            markerSize,
            fillStyle,
            strokeStyle,
            strokeWidth,
            y,
        } = this.props;
        const markerAnnotation = {
            markerShape,
            markerSize,
            fillStyle,
            strokeStyle,
            strokeWidth,
            y,
            tooltip: "Go short",
        };
        // abort if no height yet
        if (height <= 0) return;

        const ema12 = ema()
            .id(1)
            .options({ windowSize: 12 })
            .merge((d: any, c: any) => {
                d.ema12 = c;
            })
            .accessor((d: any) => d.ema12);

        const calculatedData = ema12(initialData);

        const { data, xScale, xAccessor, displayXAccessor } = this.xScaleProvider(calculatedData);

        const max = xAccessor(data[data.length - 1]);
        const min = xAccessor(data[Math.max(0, data.length - 100)]);
        const xExtents = [min, max];

        return (
            <ChartCanvas
                height={height}
                ratio={ratio}
                width={width}
                margin={this.margin}
                data={data}
                displayXAccessor={displayXAccessor}
                seriesName="Data"
                xScale={xScale}
                xAccessor={xAccessor}
                xExtents={xExtents}
            >
                <Chart id={1} yExtents={this.yExtents}>
                    <XAxis showGridLines />
                    <YAxis showGridLines />
                    <CandlestickSeries />
                    <Annotate with={MarkerAnnotation} usingProps={markerAnnotation} when={this.when} />
                </Chart>
            </ChartCanvas>
        );
    }

    private readonly when = (data: IOHLCData) => {
        return data.date.getDay() === 1;
    };

    private readonly yExtents = (data: IOHLCData) => {
        return [data.high, data.low];
    };
}

export default withOHLCData()(withSize({ style: { minHeight: 600 } })(withDeviceRatio()(Annotated)));
