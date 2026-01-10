// This file has been automatically migrated to valid ESM format by Storybook.
import { createRequire } from "node:module";
import { dirname, join } from "path";
import { StorybookConfig } from "@storybook/react-webpack5";

const require = createRequire(import.meta.url);

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
        reactDocgen: "react-docgen-typescript",
    },
};

function getAbsolutePath(value: string) {
    return dirname(require.resolve(join(value, "package.json")));
}

export default config;
