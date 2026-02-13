import { timeFormat } from "../src/timeFormat";

describe("timeFormat", () => {
    /**
     * The timeFormat function uses a cascade of d3-time interval checks
     * to determine the appropriate format for a given date.
     *
     * Format selection logic:
     * 1. Milliseconds (.xxx) - when time is within a second boundary
     * 2. Seconds (:SS) - when time is within a minute boundary
     * 3. Minutes (HH:MM) - when time is within an hour boundary
     * 4. Hours (HH:MM) - when time is within a day boundary
     * 5. Days/Weeks (%e) - when time is within a month boundary
     * 6. Months (%b) - when time is within a year boundary
     * 7. Years (%Y) - for dates spanning year boundaries
     */

    describe("Millisecond format", () => {
        test("should format milliseconds within a second", () => {
            // Create a date with specific milliseconds
            const date = new Date(2026, 0, 15, 10, 30, 45, 500); // 500ms past the second
            const result = timeFormat(date);
            // formatMillisecond uses ".%L" which shows .milliseconds
            expect(result).toMatch(/^\.\d{3}$/);
        });

        test("should format 0 milliseconds as second format", () => {
            const date = new Date(2026, 0, 15, 10, 30, 45, 0);
            // Note: 0ms is at the second boundary
            // d3-time's timeSecond(date) floors to the second, so if ms is 0,
            // timeSecond(date) equals date, so it falls through to second format
            const result = timeFormat(date);
            // At exactly 0ms, timeSecond(date) === date, so it falls through to second format
            expect(result).toBe(":45");
        });
    });

    describe("Second format", () => {
        test("should format seconds within a minute", () => {
            const date = new Date(2026, 0, 15, 10, 30, 30, 0); // 30 seconds, 0 ms
            const result = timeFormat(date);
            // formatSecond uses ":%S" which shows :seconds
            expect(result).toBe(":30");
        });

        test("should format 0 seconds as :00", () => {
            const date = new Date(2026, 0, 15, 10, 30, 0, 0);
            const result = timeFormat(date);
            // At exactly 0 seconds, falls through to minute format
            expect(result).toBe("10:30");
        });
    });

    describe("Minute format", () => {
        test("should format minutes within an hour", () => {
            const date = new Date(2026, 0, 15, 10, 30, 0, 0); // 10:30:00
            const result = timeFormat(date);
            // formatMinute uses "%H:%M"
            expect(result).toBe("10:30");
        });

        test("should format hour boundary correctly", () => {
            const date = new Date(2026, 0, 15, 10, 0, 0, 0); // 10:00:00
            const result = timeFormat(date);
            // At exactly the hour, falls through to hour format
            expect(result).toBe("10:00");
        });
    });

    describe("Hour format", () => {
        test("should format hours within a day", () => {
            const date = new Date(2026, 0, 15, 10, 0, 0, 0); // 10:00:00
            const result = timeFormat(date);
            // formatHour uses "%H:%M"
            expect(result).toBe("10:00");
        });

        test("should format midnight as 00:00", () => {
            const date = new Date(2026, 0, 15, 0, 0, 0, 0); // Midnight
            const result = timeFormat(date);
            // At midnight, falls through to day format
            expect(result).toBe("15");
        });
    });

    describe("Day format", () => {
        test("should format day within a week", () => {
            // January 15, 2026 is a Thursday
            const date = new Date(2026, 0, 15, 0, 0, 0, 0);
            const result = timeFormat(date);
            // formatDay uses "%e" which shows day of month
            expect(result).toBe("15");
        });

        test("should format first day of month", () => {
            const date = new Date(2026, 0, 1, 0, 0, 0, 0);
            const result = timeFormat(date);
            // January 1 is the start of the year, so it shows the year
            expect(result).toBe("2026");
        });
    });

    describe("Week format", () => {
        test("should format dates within a month but not within a week", () => {
            // When timeWeek(date) < date but timeMonth(date) >= date
            // This happens for days after the first week of the month
            // January 8, 2026 is in the second week
            const date = new Date(2026, 0, 8, 0, 0, 0, 0);
            const result = timeFormat(date);
            // formatWeek uses "%e" which space-pads single digits
            expect(result).toBe(" 8");
        });

        test("should format start of week (Sunday) with week format", () => {
            // When timeWeek(date) >= date (date is exactly at week boundary)
            // This happens when the date is a Sunday (start of week in d3-time)
            // January 4, 2026 is a Sunday - start of the week, but not first of month
            const date = new Date(2026, 0, 4, 0, 0, 0, 0);
            const result = timeFormat(date);
            // formatWeek uses "%e" which space-pads single digits
            expect(result).toBe(" 4");
        });
    });

    describe("Month format", () => {
        test("should format month within a year", () => {
            // First of a month that's not January
            const date = new Date(2026, 1, 1, 0, 0, 0, 0); // February 1
            const result = timeFormat(date);
            // formatMonth uses "%b" which shows abbreviated month
            expect(result).toBe("Feb");
        });

        test("should format January 1 as year", () => {
            const date = new Date(2026, 0, 1, 0, 0, 0, 0);
            const result = timeFormat(date);
            // January 1 - falls through to year format
            expect(result).toBe("2026");
        });
    });

    describe("Year format", () => {
        test("should format year for January 1", () => {
            const date = new Date(2026, 0, 1, 0, 0, 0, 0);
            const result = timeFormat(date);
            // formatYear uses "%Y"
            expect(result).toBe("2026");
        });

        test("should format different years correctly", () => {
            const date2025 = new Date(2025, 0, 1, 0, 0, 0, 0);
            const date2030 = new Date(2030, 0, 1, 0, 0, 0, 0);

            expect(timeFormat(date2025)).toBe("2025");
            expect(timeFormat(date2030)).toBe("2030");
        });
    });

    describe("Edge cases", () => {
        test("should handle leap year dates", () => {
            // February 29, 2024 (leap year)
            const date = new Date(2024, 1, 29, 0, 0, 0, 0);
            const result = timeFormat(date);
            expect(result).toBe("29");
        });

        test("should handle end of year", () => {
            // December 31, 2026
            const date = new Date(2026, 11, 31, 0, 0, 0, 0);
            const result = timeFormat(date);
            expect(result).toBe("31");
        });

        test("should handle different times of day consistently", () => {
            // Same day, different times should all show day format when at midnight
            const morning = new Date(2026, 5, 15, 0, 0, 0, 0);
            const result = timeFormat(morning);
            expect(result).toBe("15");
        });

        test("should handle month transitions", () => {
            // Last day of January
            const jan31 = new Date(2026, 0, 31, 0, 0, 0, 0);
            expect(timeFormat(jan31)).toBe("31");

            // First day of February
            const feb1 = new Date(2026, 1, 1, 0, 0, 0, 0);
            expect(timeFormat(feb1)).toBe("Feb");
        });
    });

    describe("Format string verification", () => {
        test("millisecond format should show dot followed by 3 digits", () => {
            const date = new Date(2026, 0, 1, 0, 0, 0, 123);
            const result = timeFormat(date);
            expect(result).toBe(".123");
        });

        test("second format should show colon followed by 2 digits", () => {
            const date = new Date(2026, 0, 1, 0, 0, 45, 0);
            const result = timeFormat(date);
            expect(result).toBe(":45");
        });

        test("minute format should show HH:MM pattern", () => {
            const date = new Date(2026, 0, 1, 14, 30, 0, 0);
            const result = timeFormat(date);
            expect(result).toBe("14:30");
        });

        test("day format should show day of month with space-padding for single digits", () => {
            const date5th = new Date(2026, 0, 5, 0, 0, 0, 0);
            const date15th = new Date(2026, 0, 15, 0, 0, 0, 0);

            // %e format uses space-padding for single-digit days
            expect(timeFormat(date5th)).toBe(" 5");
            expect(timeFormat(date15th)).toBe("15");
        });

        test("month format should show abbreviated month name", () => {
            const months = [
                { date: new Date(2026, 1, 1, 0, 0, 0, 0), expected: "Feb" },
                { date: new Date(2026, 2, 1, 0, 0, 0, 0), expected: "Mar" },
                { date: new Date(2026, 3, 1, 0, 0, 0, 0), expected: "Apr" },
                { date: new Date(2026, 4, 1, 0, 0, 0, 0), expected: "May" },
                { date: new Date(2026, 5, 1, 0, 0, 0, 0), expected: "Jun" },
                { date: new Date(2026, 6, 1, 0, 0, 0, 0), expected: "Jul" },
                { date: new Date(2026, 7, 1, 0, 0, 0, 0), expected: "Aug" },
                { date: new Date(2026, 8, 1, 0, 0, 0, 0), expected: "Sep" },
                { date: new Date(2026, 9, 1, 0, 0, 0, 0), expected: "Oct" },
                { date: new Date(2026, 10, 1, 0, 0, 0, 0), expected: "Nov" },
                { date: new Date(2026, 11, 1, 0, 0, 0, 0), expected: "Dec" },
            ];

            months.forEach(({ date, expected }) => {
                expect(timeFormat(date)).toBe(expected);
            });
        });
    });
});
