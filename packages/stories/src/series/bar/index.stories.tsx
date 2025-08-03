import { StoryFn } from "@storybook/react-webpack5";
import * as React from "react";
import { BarSeries, BarSeriesProps } from "../../../../series/src/BarSeries";
import { Daily, Intraday } from "./BasicBarSeries";

export default {
    component: BarSeries,
    title: "Visualization/Series/Bar",
    argTypes: {
        fillStyle: { control: "color" },
    },
};

const Template: StoryFn<BarSeriesProps> = (args) => <Daily {...args} />;

export const daily = Template.bind({});

const IntradayTemplate: StoryFn<BarSeriesProps> = (args) => <Intraday {...args} />;

export const intraday = IntradayTemplate.bind({});
