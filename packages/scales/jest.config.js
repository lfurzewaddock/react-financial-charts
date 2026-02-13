const base = require("../../jest.config.base");

module.exports = {
    ...base,
    moduleNameMapper: {
        // Force Jest to use the minified bundle (already CommonJS-compatible)
        "^d3-(.*)$": "<rootDir>/../../node_modules/d3-$1/dist/d3-$1.min.js",
    },
};
