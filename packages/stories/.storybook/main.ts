// This file has been automatically migrated to valid ESM format by Storybook.
import { createRequire } from "node:module";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { StorybookConfig } from "@storybook/react-webpack5";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
    addons: [
        getAbsolutePath("@storybook/addon-docs"),
        getAbsolutePath("@chromatic-com/storybook"),
        getAbsolutePath("@storybook/addon-webpack5-compiler-babel"),
    ],

    stories: [
        {
            directory: "../src/",
            files: "**/*.@(mdx|stories.@(ts|tsx|jsx|js|mjs|mdx))",
        },
    ],

    webpackFinal: async (config) => {
        config.module?.rules?.push({
            test: /\.((c|m)?(t)sx?)$/,
            use: "ts-loader",
            exclude: /node_modules(?!\/@amplio)/,
        });

        // Add aliases for monorepo packages - point to src directories
        const packagesDir = resolve(__dirname, "../../..");
        config.resolve = config.resolve || {};
        config.resolve.alias = {
            ...config.resolve.alias,
            "@react-financial-charts/annotations$": resolve(packagesDir, "packages/annotations/src/index.ts"),
            "@react-financial-charts/axes$": resolve(packagesDir, "packages/axes/src/index.ts"),
            "@react-financial-charts/coordinates$": resolve(packagesDir, "packages/coordinates/src/index.ts"),
            "@react-financial-charts/core$": resolve(packagesDir, "packages/core/src/index.ts"),
            "@react-financial-charts/indicators$": resolve(packagesDir, "packages/indicators/src/index.ts"),
            "@react-financial-charts/interactive$": resolve(packagesDir, "packages/interactive/src/index.ts"),
            "@react-financial-charts/scales$": resolve(packagesDir, "packages/scales/src/index.ts"),
            "@react-financial-charts/series$": resolve(packagesDir, "packages/series/src/index.ts"),
            "@react-financial-charts/tooltip$": resolve(packagesDir, "packages/tooltip/src/index.ts"),
            "@react-financial-charts/utils$": resolve(packagesDir, "packages/utils/src/index.ts"),
            "react-financial-charts$": resolve(packagesDir, "packages/charts/src/index.ts"),
        };

        return config;
    },

    // https://storybook.js.org/docs/configure/integration/frameworks#configure
    framework: {
        name: getAbsolutePath("@storybook/react-webpack5"),
        options: {
            strictMode: true,
        },
    },

    typescript: {
        reactDocgen: "react-docgen",
    },
};

function getAbsolutePath(value: string) {
    return dirname(require.resolve(join(value, "package.json")));
}

export default config;
