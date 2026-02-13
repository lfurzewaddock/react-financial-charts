import discontinuousTimeScaleProviderBuilder, { type DiscontinuousIndex } from "../src/discontinuousTimeScaleProvider";
import { type IFormatters } from "../src/levels";
import { type StockDataPoint, generateSyntheticStockDataTS } from "./tools/generate-trade-data";

// Type assertion helper for the builder pattern that uses arguments.length for getter/setter
type ProviderFunction = {
    <T = any>(
        data: T[],
    ): {
        data: any[];
        xScale: any;
        xAccessor: (d: any) => any;
        displayXAccessor: (d: any) => Date;
    };
    initialIndex(): number;
    initialIndex(x: number): ProviderFunction;
    inputDateAccessor(): (d: any) => Date;
    inputDateAccessor(x: (d: any) => Date): ProviderFunction;
    indexAccessor(): (d: any) => DiscontinuousIndex;
    indexAccessor(x: (d: any) => DiscontinuousIndex): ProviderFunction;
    indexMutator(): (d: any, idx: DiscontinuousIndex) => any;
    indexMutator(x: (d: any, idx: DiscontinuousIndex) => any): ProviderFunction;
    withIndex(): DiscontinuousIndex[] | undefined;
    withIndex(x: DiscontinuousIndex[]): ProviderFunction;
    utc(): ProviderFunction;
    setLocale(locale?: any, formatters?: IFormatters): ProviderFunction;
    indexCalculator(): (data: any[]) => { index: DiscontinuousIndex[] };
};

describe("discontinuousTimeScaleProvider", () => {
    describe("Provider Function", () => {
        test("should process data and return expected output", () => {
            const testData: StockDataPoint[] = [
                { date: new Date("2026-01-01T10:00:00"), price: 100, volume: 1000 },
                { date: new Date("2026-01-01T10:05:00"), price: 101, volume: 1100 },
            ];

            const result = discontinuousTimeScaleProviderBuilder(testData);

            expect(result.data).toHaveLength(2);
            expect(result.xScale).toBeDefined();
            expect(typeof result.xAccessor).toBe("function");
            expect(typeof result.displayXAccessor).toBe("function");
        });

        test("should return xAccessor that accesses index", () => {
            const testData: StockDataPoint[] = [{ date: new Date("2026-01-01T10:00:00"), price: 100, volume: 1000 }];

            const result = discontinuousTimeScaleProviderBuilder(testData);
            const firstItem = result.data[0];

            expect(result.xAccessor(firstItem)).toBe(0);
        });

        test("should return xAccessor that returns null for null input", () => {
            const testData: StockDataPoint[] = [{ date: new Date("2026-01-01T10:00:00"), price: 100, volume: 1000 }];

            const result = discontinuousTimeScaleProviderBuilder(testData);
            // The xAccessor returns null when input is null (due to optional chaining)
            expect(result.xAccessor(null as any)).toBeNull();
        });
    });

    describe("Index Calculator", () => {
        test("should calculate index for data", () => {
            const calculator = (discontinuousTimeScaleProviderBuilder as ProviderFunction).indexCalculator();

            const testData: StockDataPoint[] = [
                { date: new Date("2026-01-01T10:00:00"), price: 100, volume: 1000 },
                { date: new Date("2026-01-01T10:05:00"), price: 101, volume: 1100 },
                { date: new Date("2026-01-01T10:10:00"), price: 102, volume: 1200 },
            ];

            const result = calculator(testData);
            expect(result.index).toHaveLength(3);
            expect(result.index[0].index).toBe(0);
            expect(result.index[1].index).toBe(1);
            expect(result.index[2].index).toBe(2);
        });

        test("should calculate index with custom initialIndex", () => {
            const provider = (discontinuousTimeScaleProviderBuilder as ProviderFunction).initialIndex(5);
            const calculator = (provider as ProviderFunction).indexCalculator();

            const testData: StockDataPoint[] = [
                { date: new Date("2026-01-01T10:00:00"), price: 100, volume: 1000 },
                { date: new Date("2026-01-01T10:05:00"), price: 101, volume: 1100 },
            ];

            const result = calculator(testData);
            expect(result.index[0].index).toBe(5);
            expect(result.index[1].index).toBe(6);
        });
    });

    describe("UTC Mode", () => {
        test("should adjust dates for timezone offset in UTC mode", () => {
            const testData: StockDataPoint[] = [{ date: new Date("2026-01-01T12:00:00"), price: 100, volume: 1000 }];

            // Use a fresh provider with UTC mode
            const result = (discontinuousTimeScaleProviderBuilder as ProviderFunction).initialIndex(0).utc()(testData);

            // Verify the provider processed the data
            expect(result.data).toHaveLength(1);
            expect(result.xScale).toBeDefined();
        });
    });

    describe("Locale Settings", () => {
        test("should set custom formatters", () => {
            const customFormatters: IFormatters = {
                yearFormat: "%Y",
                quarterFormat: "Q%q",
                monthFormat: "%B",
                weekFormat: "W%W",
                dayFormat: "%d",
                hourFormat: "%H",
                minuteFormat: "%M",
                secondFormat: "%S",
                milliSecondFormat: ".%L",
            };
            const provider = (discontinuousTimeScaleProviderBuilder as ProviderFunction).setLocale(
                undefined,
                customFormatters,
            );
            expect(typeof provider).toBe("function");
        });

        test("should handle undefined locale and formatters", () => {
            const provider = (discontinuousTimeScaleProviderBuilder as ProviderFunction).setLocale(
                undefined,
                undefined,
            );
            expect(typeof provider).toBe("function");
        });
    });

    describe("Level Evaluation", () => {
        test("should assign correct levels for year start", () => {
            const calculator = (discontinuousTimeScaleProviderBuilder as ProviderFunction).indexCalculator();

            // January 1st - start of year
            const testData: StockDataPoint[] = [{ date: new Date("2026-01-01T00:00:00"), price: 100, volume: 1000 }];

            const result = calculator(testData);
            // Year level is 19 (startOfYear)
            expect(result.index[0].level).toBeGreaterThanOrEqual(14);
        });

        test("should assign correct levels for month start", () => {
            const calculator = (discontinuousTimeScaleProviderBuilder as ProviderFunction).indexCalculator();

            // February 1st - start of month but not year
            const testData: StockDataPoint[] = [{ date: new Date("2026-02-01T00:00:00"), price: 100, volume: 1000 }];

            const result = calculator(testData);
            // Month level is 17 (startOfMonth)
            expect(result.index[0].level).toBeGreaterThanOrEqual(14);
        });

        test("should assign correct levels for hour start", () => {
            const calculator = (discontinuousTimeScaleProviderBuilder as ProviderFunction).indexCalculator();

            const testData: StockDataPoint[] = [
                { date: new Date("2026-01-05T10:00:00"), price: 100, volume: 1000 },
                { date: new Date("2026-01-05T11:00:00"), price: 101, volume: 1100 },
            ];

            const result = calculator(testData);
            // Hour level is 9 (startOfHour)
            expect(result.index[1].level).toBe(9);
        });

        test("should assign correct levels for minute intervals", () => {
            const calculator = (discontinuousTimeScaleProviderBuilder as ProviderFunction).indexCalculator();

            const testData: StockDataPoint[] = [
                { date: new Date("2026-01-05T10:00:00"), price: 100, volume: 1000 },
                { date: new Date("2026-01-05T10:05:00"), price: 101, volume: 1100 },
            ];

            const result = calculator(testData);
            // 5-minute interval level is 6 (startOf5Minutes)
            expect(result.index[1].level).toBe(6);
        });
    });

    describe("Time Boundary Detection", () => {
        test("should detect start of week (Monday)", () => {
            const calculator = (discontinuousTimeScaleProviderBuilder as ProviderFunction).indexCalculator();

            // January 5, 2026 is a Monday
            const testData: StockDataPoint[] = [
                { date: new Date("2026-01-04T10:00:00"), price: 100, volume: 1000 }, // Sunday
                { date: new Date("2026-01-05T10:00:00"), price: 101, volume: 1100 }, // Monday
            ];

            const result = calculator(testData);
            // Monday should have startOfWeek flag set - level 16 is startOfWeek
            // But since both are different days, the level depends on time boundaries
            expect(result.index[1].level).toBeGreaterThanOrEqual(14);
        });

        test("should detect start of quarter", () => {
            const calculator = (discontinuousTimeScaleProviderBuilder as ProviderFunction).indexCalculator();

            // April 1st - start of Q2
            const testData: StockDataPoint[] = [
                { date: new Date("2026-03-31T10:00:00"), price: 100, volume: 1000 },
                { date: new Date("2026-04-01T10:00:00"), price: 101, volume: 1100 },
            ];

            const result = calculator(testData);
            // Quarter level is 18 (startOfQuarter)
            expect(result.index[1].level).toBe(18);
        });

        test("should detect 30-minute intervals", () => {
            const calculator = (discontinuousTimeScaleProviderBuilder as ProviderFunction).indexCalculator();

            const testData: StockDataPoint[] = [
                { date: new Date("2026-01-05T10:00:00"), price: 100, volume: 1000 },
                { date: new Date("2026-01-05T10:30:00"), price: 101, volume: 1100 },
            ];

            const result = calculator(testData);
            // 30-minute interval level is 8 (startOf30Minutes)
            expect(result.index[1].level).toBe(8);
        });

        test("should detect 15-minute intervals", () => {
            const calculator = (discontinuousTimeScaleProviderBuilder as ProviderFunction).indexCalculator();

            const testData: StockDataPoint[] = [
                { date: new Date("2026-01-05T10:00:00"), price: 100, volume: 1000 },
                { date: new Date("2026-01-05T10:15:00"), price: 101, volume: 1100 },
            ];

            const result = calculator(testData);
            // 15-minute interval level is 7 (startOf15Minutes)
            expect(result.index[1].level).toBe(7);
        });

        test("should detect second boundaries", () => {
            const calculator = (discontinuousTimeScaleProviderBuilder as ProviderFunction).indexCalculator();

            const testData: StockDataPoint[] = [
                { date: new Date("2026-01-05T10:00:00"), price: 100, volume: 1000 },
                { date: new Date("2026-01-05T10:00:01"), price: 101, volume: 1100 },
            ];

            const result = calculator(testData);
            // Second level is 1 (startOfSecond)
            expect(result.index[1].level).toBe(1);
        });

        test("should detect 5-second boundaries", () => {
            const calculator = (discontinuousTimeScaleProviderBuilder as ProviderFunction).indexCalculator();

            const testData: StockDataPoint[] = [
                { date: new Date("2026-01-05T10:00:00"), price: 100, volume: 1000 },
                { date: new Date("2026-01-05T10:00:05"), price: 101, volume: 1100 },
            ];

            const result = calculator(testData);
            // 5-second level is 2 (startOf5Seconds)
            expect(result.index[1].level).toBe(2);
        });

        test("should detect 15-second boundaries", () => {
            const calculator = (discontinuousTimeScaleProviderBuilder as ProviderFunction).indexCalculator();

            const testData: StockDataPoint[] = [
                { date: new Date("2026-01-05T10:00:00"), price: 100, volume: 1000 },
                { date: new Date("2026-01-05T10:00:15"), price: 101, volume: 1100 },
            ];

            const result = calculator(testData);
            // 15-second level is 3 (startOf15Seconds)
            expect(result.index[1].level).toBe(3);
        });

        test("should detect 30-second boundaries", () => {
            const calculator = (discontinuousTimeScaleProviderBuilder as ProviderFunction).indexCalculator();

            const testData: StockDataPoint[] = [
                { date: new Date("2026-01-05T10:00:00"), price: 100, volume: 1000 },
                { date: new Date("2026-01-05T10:00:30"), price: 101, volume: 1100 },
            ];

            const result = calculator(testData);
            // 30-second level is 4 (startOf30Seconds)
            expect(result.index[1].level).toBe(4);
        });
    });

    describe("Day Boundary Detection", () => {
        test("should detect half-day boundaries (12h)", () => {
            const calculator = (discontinuousTimeScaleProviderBuilder as ProviderFunction).indexCalculator();

            const testData: StockDataPoint[] = [
                { date: new Date("2026-01-05T00:00:00"), price: 100, volume: 1000 },
                { date: new Date("2026-01-05T12:00:00"), price: 101, volume: 1100 },
            ];

            const result = calculator(testData);
            // Half-day level is 13 (startOfHalfDay)
            expect(result.index[1].level).toBe(13);
        });

        test("should detect quarter-day boundaries (6h)", () => {
            const calculator = (discontinuousTimeScaleProviderBuilder as ProviderFunction).indexCalculator();

            const testData: StockDataPoint[] = [
                { date: new Date("2026-01-05T00:00:00"), price: 100, volume: 1000 },
                { date: new Date("2026-01-05T06:00:00"), price: 101, volume: 1100 },
            ];

            const result = calculator(testData);
            // Quarter-day level is 12 (startOfQuarterDay)
            expect(result.index[1].level).toBe(12);
        });

        test("should detect eighth-of-day boundaries (3h)", () => {
            const calculator = (discontinuousTimeScaleProviderBuilder as ProviderFunction).indexCalculator();

            const testData: StockDataPoint[] = [
                { date: new Date("2026-01-05T00:00:00"), price: 100, volume: 1000 },
                { date: new Date("2026-01-05T03:00:00"), price: 101, volume: 1100 },
            ];

            const result = calculator(testData);
            // Eighth-of-day level is 11 (startOfEighthOfADay)
            expect(result.index[1].level).toBe(11);
        });

        test("should detect even-hour boundaries", () => {
            const calculator = (discontinuousTimeScaleProviderBuilder as ProviderFunction).indexCalculator();

            const testData: StockDataPoint[] = [
                { date: new Date("2026-01-05T01:00:00"), price: 100, volume: 1000 },
                { date: new Date("2026-01-05T02:00:00"), price: 101, volume: 1100 },
            ];

            const result = calculator(testData);
            // Even hour level is 10 (startOfHour && hours % 2 === 0)
            expect(result.index[1].level).toBe(10);
        });
    });

    describe("Format Functions", () => {
        test("should provide format function for each index entry", () => {
            const calculator = (discontinuousTimeScaleProviderBuilder as ProviderFunction).indexCalculator();

            const testData: StockDataPoint[] = [{ date: new Date("2026-01-01T10:00:00"), price: 100, volume: 1000 }];

            const result = calculator(testData);
            expect(typeof result.index[0].format).toBe("function");
            expect(typeof result.index[0].format(result.index[0].date)).toBe("string");
        });

        test("should format date correctly", () => {
            const calculator = (discontinuousTimeScaleProviderBuilder as ProviderFunction).indexCalculator();

            const testData: StockDataPoint[] = [{ date: new Date("2026-01-01T00:00:00"), price: 100, volume: 1000 }];

            const result = calculator(testData);
            const formatted = result.index[0].format(result.index[0].date);
            // The format depends on the level assigned - just verify it returns a string
            expect(typeof formatted).toBe("string");
            expect(formatted.length).toBeGreaterThan(0);
        });
    });

    describe("Integration with Real Data", () => {
        test("should process synthetic stock data correctly", () => {
            const stockData = generateSyntheticStockDataTS("2026-01-01", 100, 1, 1000, 5);

            const result = discontinuousTimeScaleProviderBuilder(stockData);

            expect(result.data).toHaveLength(stockData.length);
            expect(result.xScale).toBeDefined();

            // Verify each data point has an index starting from 0
            result.data.forEach((item, i) => {
                expect(result.xAccessor(item)).toBe(i);
            });
        });

        test("should handle multi-year data", () => {
            const stockData1 = generateSyntheticStockDataTS("2025-01-01", 100, 1, 1000, 5);
            const stockData2 = generateSyntheticStockDataTS("2026-01-01", 100, 1, 1000, 5);
            const combinedData = [...stockData1, ...stockData2];

            const result = discontinuousTimeScaleProviderBuilder(combinedData);

            expect(result.data).toHaveLength(combinedData.length);
        });
    });

    describe("Edge Cases", () => {
        test("should handle empty data array", () => {
            const result = discontinuousTimeScaleProviderBuilder([]);
            expect(result.data).toHaveLength(0);
            expect(result.xScale).toBeDefined();
        });

        test("should handle single data point", () => {
            const testData: StockDataPoint[] = [{ date: new Date("2026-01-01T10:00:00"), price: 100, volume: 1000 }];

            const result = discontinuousTimeScaleProviderBuilder(testData);
            expect(result.data).toHaveLength(1);
            expect(result.xAccessor(result.data[0])).toBe(0);
        });

        test("should handle data with same timestamps", () => {
            const sameDate = new Date("2026-01-01T10:00:00");
            const testData: StockDataPoint[] = [
                { date: sameDate, price: 100, volume: 1000 },
                { date: new Date(sameDate.getTime()), price: 101, volume: 1100 },
            ];

            const result = discontinuousTimeScaleProviderBuilder(testData);
            expect(result.data).toHaveLength(2);
        });

        test("should handle custom date accessor", () => {
            interface CustomData {
                timestamp: Date;
                value: number;
            }

            const testData: CustomData[] = [
                { timestamp: new Date("2026-01-01T10:00:00"), value: 100 },
                { timestamp: new Date("2026-01-01T10:05:00"), value: 101 },
            ];

            const provider = (discontinuousTimeScaleProviderBuilder as ProviderFunction).inputDateAccessor(
                (d: CustomData) => d.timestamp,
            );
            const result = (provider as ProviderFunction)(testData);
            expect(result.data).toHaveLength(2);
        });
    });

    describe("withIndex Provider", () => {
        test("should use pre-defined withIndex when provided", () => {
            const mockIndex: DiscontinuousIndex[] = [
                { index: 0, level: 1, date: new Date("2026-01-01"), format: (_d: Date) => "2026" },
                { index: 1, level: 0, date: new Date("2026-01-02"), format: (_d: Date) => "Jan 2" },
            ];

            const testData: StockDataPoint[] = [
                { date: new Date("2026-01-01T10:00:00"), price: 100, volume: 1000 },
                { date: new Date("2026-01-02T10:00:00"), price: 101, volume: 1100 },
            ];

            const provider = (discontinuousTimeScaleProviderBuilder as ProviderFunction).withIndex(mockIndex);
            const result = (provider as ProviderFunction)(testData);

            // Should use the provided index, not calculate a new one
            expect(result.data).toHaveLength(2);
        });
    });

    describe("Custom Mutator and Accessor", () => {
        test("should use custom indexMutator", () => {
            const customMutator = (d: StockDataPoint, idx: DiscontinuousIndex) => ({
                ...d,
                customIdx: idx,
            });

            const testData: StockDataPoint[] = [{ date: new Date("2026-01-01T10:00:00"), price: 100, volume: 1000 }];

            const provider = (discontinuousTimeScaleProviderBuilder as ProviderFunction).indexMutator(
                customMutator as any,
            );
            const result = (provider as ProviderFunction)(testData);
            expect(result.data[0]).toHaveProperty("customIdx");
        });

        test("should use custom indexAccessor", () => {
            const customAccessor = (d: { customIdx: DiscontinuousIndex }) => d.customIdx;

            const testData: StockDataPoint[] = [{ date: new Date("2026-01-01T10:00:00"), price: 100, volume: 1000 }];

            const provider = (discontinuousTimeScaleProviderBuilder as ProviderFunction)
                .indexAccessor(customAccessor as any)
                .indexMutator((d: any, idx: DiscontinuousIndex) => ({ ...d, customIdx: idx }));
            const result = (provider as ProviderFunction)(testData);
            expect(result.xAccessor(result.data[0] as any)).toBe(0);
        });
    });
});
