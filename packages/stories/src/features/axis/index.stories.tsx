import { StoryFn } from "@storybook/react-webpack5";
import * as React from "react";
import { YAxis, YAxisProps } from "../../../../axes/src/YAxis";
import AxisExample from "./Axis";

export default {
    component: YAxis,
    title: "Features/Axis",
    argTypes: {
        axisAt: {
            options: ["left", "right", "middle"],
            control: { type: "select" },
        },
        gridLinesStrokeStyle: { control: "color" },
        strokeStyle: { control: "color" },
        tickLabelFill: { control: "color" },
        tickStrokeStyle: { control: "color" },
    },
};

const Template: StoryFn<YAxisProps> = (args) => <AxisExample {...args} />;

export const yAxis = Template.bind({});
