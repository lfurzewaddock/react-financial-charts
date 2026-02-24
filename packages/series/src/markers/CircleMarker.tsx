import { functor } from "@lfurzewaddock/react-financial-charts-core";
import * as React from "react";

export interface CircleMarkerProps {
    readonly className?: string;
    readonly fillStyle?: string | ((datum: any) => string | undefined);
    readonly point: {
        x: number;
        y: number;
        datum: any;
    };
    readonly r: number | ((datum: any) => number);
    readonly strokeStyle?: string;
    readonly strokeWidth?: number;
}

export class CircleMarker extends React.Component<CircleMarkerProps> {
    public static defaultProps = {
        fillStyle: "#4682B4",
        strokeStyle: "#4682B4",
        strokeWidth: 1,
        className: "react-financial-charts-marker-circle",
    };

    public static drawOnCanvas = (
        props: CircleMarkerProps,
        point: { x: number; y: number; datum: unknown },
        ctx: CanvasRenderingContext2D,
    ) => {
        const { strokeStyle, r, strokeWidth } = props;

        if (strokeStyle !== undefined) ctx.strokeStyle = strokeStyle;

        if (strokeWidth !== undefined) ctx.lineWidth = strokeWidth;

        const { datum, x, y } = point;

        const radius = functor(r)(datum);

        ctx.moveTo(x, y);
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
        ctx.fill();
        if (strokeStyle !== undefined) ctx.stroke();
    };

    public render() {
        const { className, strokeStyle, strokeWidth, fillStyle, point, r } = this.props;
        const radius = functor(r)(point.datum);
        const fill = functor(fillStyle)(point.datum) ?? CircleMarker.defaultProps.fillStyle;

        return (
            <circle
                className={className}
                cx={point.x}
                cy={point.y}
                stroke={strokeStyle}
                strokeWidth={strokeWidth}
                fill={fill}
                r={radius}
            />
        );
    }
}
