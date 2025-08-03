import type { Meta, StoryObj } from "@storybook/react-webpack5";

import StockChart from "./StockChart";

const meta: Meta<typeof StockChart> = {
    component: StockChart,
    title: "Introduction",
    tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof StockChart>;

export const Daily: Story = {
    args: {},
};
