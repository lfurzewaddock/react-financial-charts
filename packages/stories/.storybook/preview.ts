import { Preview } from '@storybook/react-webpack5';

const preview: Preview = {
    // https://storybook.js.org/docs/writing-stories/parameters#global-parameters
    parameters: {
        controls: { hideNoControlsWarning: true },
        options: {
            storySort: {
                order: ["Introduction", "Features", "Visualization"],
            },
        },
        docs: {
            codePanel: true,
            toc: true,
        },
    },
    tags: ["autodocs"],
};

export default preview;
