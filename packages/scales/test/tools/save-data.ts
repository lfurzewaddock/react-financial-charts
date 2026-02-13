import * as fs from "node:fs";
import * as path from "node:path";
import { parseArgs } from "node:util";

import { generateSyntheticStockDataTS, type StockDataPoint } from "./generate-trade-data";

// 1. Define CLI options
// Defaulting days to 1 for this second-by-second example, otherwise the output file is huge.
const options = {
    startPrice: { type: "string", short: "p", default: "150.0" },
    volatility: { type: "string", short: "v", default: "25.0" },
    volume: { type: "string", short: "o", default: "50000" },
    days: { type: "string", short: "d", default: "1" }, // Default to 1 day for second intervals
    startDate: { type: "string", short: "s", default: "2026-01-01" },
} as const;

// 2. Parse arguments from process.argv
const { values } = parseArgs({ options, strict: true });

/**
 * Saves an array of StockDataPoint objects to a local JSON file.

 * @param data The data array to save.
 * @param filename The name of the output file (e.g., 'stock_data.json').
 */
function saveDataToJsonFile(data: StockDataPoint[], filename: string): void {
    // JSON.stringify will convert Date objects to ISO 8601 string format automatically.
    const jsonContent = JSON.stringify(data, null, 4); // Use 4 spaces for readable formatting
    /** Use import.meta.dirname to ensure the path is relative to THIS script file
     * rather than where you run the command from (process.cwd()).
     * */
    const outputDirectory = import.meta.dirname;
    const filePath = path.join(outputDirectory, filename);

    try {
        fs.writeFileSync(filePath, jsonContent, "utf8");
        console.log(`\nSuccessfully saved data to ${filePath}`);
    } catch (error) {
        console.error(`\nError writing file ${filePath}:`, error);
    }
}
// 3. Execute with parsed CLI values
const generatedData = generateSyntheticStockDataTS(
    values.startDate!,
    parseFloat(values.startPrice!),
    parseFloat(values.volatility!),
    parseInt(values.volume!),
    parseInt(values.days!),
);

console.log(`Total data points generated: ${generatedData.length}`);

// Call the function to save the result
saveDataToJsonFile(generatedData, "synthetic_stock_data.json");
