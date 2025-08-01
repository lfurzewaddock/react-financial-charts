import { Preview } from '@storybook/react';

const preview: Preview = {
    parameters: {
        controls: { hideNoControlsWarning: true },
        options: {
            storySort: {
                order: ["Introduction", "Features", "Visualization"],
            },
        },
    },
    tags: ["autodocs"],
};

export default preview;
