import * as React from "react";
import { atr } from "@lfurzewaddock/react-financial-charts-indicators";
import ATRIndicator from "./AtrIndicator";

export default {
    title: "Visualization/Indicator/ATR",
    component: atr,
    parameters: {
        docs: {
            subtitle: "Average True Range (ATR) is an indicator that measures volatility.",
        },
    },
};

export const basic = () => <ATRIndicator />;
