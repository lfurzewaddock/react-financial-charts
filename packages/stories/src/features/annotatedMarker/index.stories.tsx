import { StoryFn } from "@storybook/react-webpack5";
import * as React from "react";
import { Annotate } from "@lfurzewaddock/react-financial-charts-annotations";
import { type MarkerAnnotationProps } from "../../../../annotations/src/MarkerAnnotation";
import AnnotatedMarker from "./AnnotatedMarker";

export default {
    component: Annotate,
    title: "Features/Annotate",
    argTypes: {
        markerShape: {
            options: ["circle", "square", "triangle"],
            control: { type: "select" },
        },
        fillStyle: { control: "color" },
        strokeStyle: { control: "color" },
        y: { control: "function" },
    },
    args: {
        markerShape: "circle",
        markerSize: 6,
        fillStyle: "#4682B4",
        strokeStyle: "#4682B4",
        strokeWidth: 1,
        y: ({ yScale, datum }: any): number => yScale(datum.high),
    },
};

const Template: StoryFn<MarkerAnnotationProps> = (args) => <AnnotatedMarker {...args} />;

export const marker = Template.bind({});
