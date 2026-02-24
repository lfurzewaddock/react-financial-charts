import { functor } from "@lfurzewaddock/react-financial-charts-core";
import { type ScaleContinuousNumeric } from "d3-scale";
import * as React from "react";
import { CircleMarker, Square, Triangle } from "@lfurzewaddock/react-financial-charts-series";

export interface MarkerAnnotationProps {
    readonly className?: string;
    readonly markerShape?: "circle" | "square" | "triangle";
    readonly markerSize: number;
    readonly datum?: any;
    readonly fillStyle?: string | ((datum: any) => string | undefined);
    readonly strokeStyle?: string;
    readonly strokeWidth?: number;
    readonly plotData: any[];
    readonly tooltip?: string | ((datum: any) => string);
    readonly xAccessor: (datum: any) => any;
    readonly xScale: ScaleContinuousNumeric<number, number>;
    readonly x?:
        | number
        | (({
              xScale,
              xAccessor,
              datum,
              plotData,
          }: {
              xScale: ScaleContinuousNumeric<number, number>;
              xAccessor: (datum: any) => any;
              datum: any;
              plotData: any[];
          }) => number);
    readonly yScale: ScaleContinuousNumeric<number, number>;
    readonly y:
        | number
        | (({
              yScale,
              datum,
              plotData,
          }: {
              yScale: ScaleContinuousNumeric<number, number>;
              datum: any;
              plotData: any[];
          }) => number);
}

export class MarkerAnnotation extends React.Component<MarkerAnnotationProps> {
    public static defaultProps = {
        className: "react-financial-charts-marker-annotation",
        x: ({
            xScale,
            xAccessor,
            datum,
        }: {
            xScale: ScaleContinuousNumeric<number, number>;
            xAccessor: any;
            datum: any;
        }) => xScale(xAccessor(datum)),
    };

    public render() {
        const { className, fillStyle, strokeStyle, strokeWidth, markerShape, markerSize, datum } = this.props;

        const { xPos, yPos, tooltip } = this.helper();

        const fillColor =
            fillStyle !== undefined ? (typeof fillStyle === "function" ? fillStyle(datum) : fillStyle) : undefined;

        const markerComponent = (markerShape: MarkerAnnotationProps["markerShape"] = "circle") => {
            const defaultComponent = (
                <CircleMarker
                    r={markerSize}
                    point={{ x: xPos, y: yPos, datum }}
                    fillStyle={fillColor}
                    strokeStyle={strokeStyle}
                    strokeWidth={strokeWidth}
                />
            );
            if (markerShape === "square")
                return (
                    <Square
                        width={markerSize}
                        point={{ x: xPos, y: yPos, datum }}
                        fillStyle={fillColor}
                        strokeStyle={strokeStyle}
                        strokeWidth={strokeWidth}
                    />
                );
            if (markerShape === "circle") return defaultComponent;
            if (markerShape === "triangle")
                return (
                    <Triangle
                        width={markerSize}
                        point={{ x: xPos, y: yPos, datum }}
                        fillStyle={fillColor}
                        strokeStyle={strokeStyle}
                        strokeWidth={strokeWidth}
                    />
                );
            return defaultComponent;
        };

        return (
            <g className={className}>
                <title>{tooltip}</title>
                {markerComponent(markerShape)}
            </g>
        );
    }

    private readonly helper = () => {
        const { x, y, datum, tooltip, xAccessor, xScale, yScale, plotData } = this.props;

        const xFunc = functor(x);
        const yFunc = functor(y);

        const [xPos, yPos]: [number, number] = [
            xFunc({ xScale, xAccessor, datum, plotData }),
            yFunc({ yScale, datum, plotData }),
        ];

        return {
            xPos,
            yPos,
            tooltip: functor(tooltip)(datum),
        };
    };
}
