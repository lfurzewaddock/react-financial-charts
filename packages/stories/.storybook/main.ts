import { dirname, join } from "path";
import { StorybookConfig } from "@storybook/react-webpack5";

const config: StorybookConfig = {
    addons: [
        getAbsolutePath("@storybook/addon-essentials"),
        getAbsolutePath("@chromatic-com/storybook"),
        getAbsolutePath("@storybook/addon-webpack5-compiler-babel"),
    ],

    stories: [{
        directory: "../src/",
        files: "**/*.@(mdx|stories.@(ts|tsx|jsx|js|mjs|mdx))"
    }],

    webpackFinal: async (config, { configType }) => {
        config.module?.rules?.push({
            test: /\.((c|m)?(t)sx?)$/,
            use: "ts-loader",
            exclude: /node_modules(?!\/@amplio)/,
        });

        return config;
    },

    framework: {
        name: getAbsolutePath("@storybook/react-webpack5"),

        options: {
            strictMode: true,
            fastRefresh: true,
        },
    },

    docs: {
        autodocs: true,
    },

    typescript: {
        reactDocgen: "react-docgen-typescript",
    },
};

function getAbsolutePath(value) {
    return dirname(require.resolve(join(value, "package.json")));
}

export default config;
