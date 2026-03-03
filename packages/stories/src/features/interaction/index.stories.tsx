import * as React from "react";
import { StoryFn } from "@storybook/react-webpack5";
import {
    ChartCanvas,
    lastVisibleItemBasedZoomAnchor,
    mouseBasedZoomAnchor,
    rightDomainBasedZoomAnchor,
} from "@lfurzewaddock/react-financial-charts-core";
import Interaction from "./Interaction";
import FocusContext, { type FocusCtxProps } from "./FocusContext";

export default {
    component: ChartCanvas,
    title: "Features/Interaction",
    argTypes: {
        ctxBrushStrokeStyle: { control: "color" },
        ctxLineStrokeStyle: { control: "color" },
        ctxBrushFillStyle: { control: "color" },
    },
    args: {
        ctxBrushStrokeStyle: "#2563eb",
        ctxLineStrokeStyle: "#2563eb",
        ctxBrushFillStyle: "rgba(37, 99, 235, 0.18)",
        ctxBrushMinSelectionSize: 5,
        ctxXAxisShowGridLines: true,
    },
};

export const clamp = () => <Interaction clamp />;

export const disable = () => <Interaction disableInteraction />;

export const disablePan = () => <Interaction disablePan />;

export const disableZoom = () => <Interaction disableZoom />;

export const zoomAnchorToMouse = () => <Interaction zoomAnchor={mouseBasedZoomAnchor} />;

export const zoomAnchorToLastVisible = () => <Interaction zoomAnchor={lastVisibleItemBasedZoomAnchor} />;

export const zoomAnchorToBounds = () => <Interaction zoomAnchor={rightDomainBasedZoomAnchor} />;

const FocusCtxTemplate: StoryFn<FocusCtxProps> = (args: FocusCtxProps) => <FocusContext {...args} />;
export const focusContext = FocusCtxTemplate.bind({});
