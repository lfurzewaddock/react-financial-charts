import { Preview } from '@storybook/react-webpack5';

const preview: Preview = {
    parameters: {
        controls: { hideNoControlsWarning: true },
        options: {
            storySort: {
                order: ["Introduction", "Features", "Visualization"],
            },
        },
        docs: {
            codePanel: true,
        },
    },
    tags: ["autodocs"],
};

export default preview;
