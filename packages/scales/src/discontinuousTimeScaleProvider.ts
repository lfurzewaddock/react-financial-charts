import { slidingWindow, zipper } from "@lfurzewaddock/react-financial-charts-core";
import { timeFormat, timeFormatDefaultLocale, type TimeLocaleDefinition } from "d3-time-format";
import financeDiscontinuousScale from "./financeDiscontinuousScale";
import { defaultFormatters, levelDefinition, IFormatters } from "./levels";

export interface RowLevel {
    date: number;
    startOfSecond: boolean;
    startOf5Seconds: boolean;
    startOf15Seconds: boolean;
    startOf30Seconds: boolean;
    startOfMinute: boolean;
    startOf5Minutes: boolean;
    startOf15Minutes: boolean;
    startOf30Minutes: boolean;
    startOfHour: boolean;
    startOfEighthOfADay: boolean;
    startOfQuarterDay: boolean;
    startOfHalfDay: boolean;
    startOfDay: boolean;
    startOfWeek: boolean;
    startOfMonth: boolean;
    startOfQuarter: boolean;
    startOfYear: boolean;
}

const evaluateLevel = (row: RowLevel, date: Date, i: number, formatters: IFormatters) => {
    return levelDefinition
        .map((eachLevel, idx) => {
            const key: string | false = eachLevel(row, date, i);
            return {
                level: levelDefinition.length - idx - 1,
                format: key && key in formatters && formatters[key as keyof IFormatters],
            };
        })
        .find((level) => !!level.format);
};

const discontinuousIndexCalculator = slidingWindow()
    .windowSize(2)
    .undefinedValue(
        (d: Date, _idx: number, { initialIndex, formatters }: { initialIndex: number; formatters: IFormatters }) => {
            const i = initialIndex;
            const row: RowLevel = {
                date: d.getTime(),
                startOfSecond: false,
                startOf5Seconds: false,
                startOf15Seconds: false,
                startOf30Seconds: false,
                startOfMinute: false,
                startOf5Minutes: false,
                startOf15Minutes: false,
                startOf30Minutes: false,
                startOfHour: false,
                startOfEighthOfADay: false,
                startOfQuarterDay: false,
                startOfHalfDay: false,
                startOfDay: true,
                startOfWeek: false,
                startOfMonth: false,
                startOfQuarter: false,
                startOfYear: false,
            };

            const level = evaluateLevel(row, d, i, formatters);

            return { ...row, index: i, ...level };
        },
    );

const discontinuousIndexCalculatorLocalTime = discontinuousIndexCalculator.accumulator(
    (
        [prevDate, nowDate]: [Date, Date],
        i: number,
        _idx: number,
        { initialIndex, formatters }: { initialIndex: number; formatters: IFormatters },
    ) => {
        const nowSeconds = nowDate.getSeconds();
        const nowMinutes = nowDate.getMinutes();
        const nowHours = nowDate.getHours();
        const nowDay = nowDate.getDay();
        const nowMonth = nowDate.getMonth();

        const startOfSecond = nowSeconds !== prevDate.getSeconds();
        const startOf5Seconds = startOfSecond && nowSeconds % 5 === 0;
        const startOf15Seconds = startOfSecond && nowSeconds % 15 === 0;
        const startOf30Seconds = startOfSecond && nowSeconds % 30 === 0;

        const startOfMinute = nowMinutes !== prevDate.getMinutes();
        const startOf5Minutes = startOfMinute && nowMinutes % 5 <= prevDate.getMinutes() % 5;
        const startOf15Minutes = startOfMinute && nowMinutes % 15 <= prevDate.getMinutes() % 15;
        const startOf30Minutes = startOfMinute && nowMinutes % 30 <= prevDate.getMinutes() % 30;

        const startOfHour = nowHours !== prevDate.getHours();

        const startOfEighthOfADay = startOfHour && nowHours % 3 === 0;
        const startOfQuarterDay = startOfHour && nowHours % 6 === 0;
        const startOfHalfDay = startOfHour && nowHours % 12 === 0;

        const startOfDay = nowDay !== prevDate.getDay();
        // According to ISO calendar
        // Sunday = 0, Monday = 1, ... Saturday = 6
        // day of week of today < day of week of yesterday then today is start of week
        const startOfWeek = nowDay < prevDate.getDay();
        // month of today != month of yesterday then today is start of month
        const startOfMonth = nowMonth !== prevDate.getMonth();
        // if start of month and month % 3 === 0 then it is start of quarter
        const startOfQuarter = startOfMonth && nowMonth % 3 <= prevDate.getMonth() % 3;
        // year of today != year of yesterday then today is start of year
        const startOfYear = nowDate.getFullYear() !== prevDate.getFullYear();

        const row: RowLevel = {
            date: nowDate.getTime(),
            startOfSecond,
            startOf5Seconds,
            startOf15Seconds,
            startOf30Seconds,
            startOfMinute,
            startOf5Minutes,
            startOf15Minutes,
            startOf30Minutes,
            startOfHour,
            startOfEighthOfADay,
            startOfQuarterDay,
            startOfHalfDay,
            startOfDay,
            startOfWeek,
            startOfMonth,
            startOfQuarter,
            startOfYear,
        };

        const level = evaluateLevel(row, nowDate, i, formatters);

        return { ...row, index: i + initialIndex, ...level };
    },
);

export interface DiscontinuousIndex {
    index: number;
    level: number;
    date: Date;
    format: (date: Date) => string;
}

function createIndex<T = any>(
    realDateAccessor: (dateAccessor: (d: T & { date: Date }) => Date) => (d: T) => Date,
    inputDateAccessor: (d: T & { date: Date }) => Date = (d) => d.date,
    initialIndex: number,
    formatters: IFormatters,
) {
    return function <T = any>(data: T[]) {
        const dateAccessor = realDateAccessor(inputDateAccessor);

        const calculate = discontinuousIndexCalculatorLocalTime.source(dateAccessor).misc({ initialIndex, formatters });

        const index: DiscontinuousIndex[] = calculate(data).map((each) => {
            const { format } = each;
            return {
                index: each.index,
                level: each.level,
                date: new Date(each.date),
                format: timeFormat(format),
            };
        });

        return { index };
    };
}

type DataWithScale<T = any> = T & {
    idx: DiscontinuousIndex;
};

export type DiscontinuousTimeScaleProviderBuilder = ReturnType<typeof discontinuousTimeScaleProviderBuilder>;

export function discontinuousTimeScaleProviderBuilder<T = any>() {
    let initialIndex = 0;
    let realDateAccessor: (dateAccessor: (d: any) => Date) => (d: any) => Date = (d) => d;
    let inputDateAccessor: (d: T & { date: Date }) => Date = (d) => d.date;
    let indexAccessor = (d: DataWithScale<T>) => d.idx;
    let indexMutator = (d: DataWithScale<T>, idx: DiscontinuousIndex) => ({ ...d, idx });
    let withIndex: DiscontinuousIndex[];

    let currentFormatters = defaultFormatters;

    const discontinuousTimeScaleProvider = function <T = any>(data: T[]) {
        let index = withIndex;

        if (index === undefined) {
            const response = createIndex(realDateAccessor, inputDateAccessor, initialIndex, currentFormatters)(data);
            index = response.index;
        }

        const inputIndex = index;

        const xScale = financeDiscontinuousScale(inputIndex);

        const mergedData = zipper().combine(indexMutator);

        const finalData: DataWithScale<T>[] = mergedData(data, inputIndex);

        return {
            data: finalData,
            xScale,
            xAccessor: (d: DataWithScale) => d && indexAccessor(d)?.index,
            displayXAccessor: realDateAccessor(inputDateAccessor),
        };
    };

    discontinuousTimeScaleProvider.initialIndex = function (x: number) {
        if (!arguments.length) return initialIndex;

        initialIndex = x;
        return discontinuousTimeScaleProvider;
    };
    discontinuousTimeScaleProvider.inputDateAccessor = function (x: (d: T) => Date) {
        if (!arguments.length) return inputDateAccessor;
        inputDateAccessor = x;
        return discontinuousTimeScaleProvider;
    };
    discontinuousTimeScaleProvider.indexAccessor = function (x: (d: DataWithScale<T>) => DiscontinuousIndex) {
        if (!arguments.length) return indexAccessor;

        indexAccessor = x;
        return discontinuousTimeScaleProvider;
    };
    discontinuousTimeScaleProvider.indexMutator = function (
        x: (d: DataWithScale<T>, idx: DiscontinuousIndex) => DataWithScale<T>,
    ) {
        if (!arguments.length) return indexMutator;

        indexMutator = x;
        return discontinuousTimeScaleProvider;
    };
    discontinuousTimeScaleProvider.withIndex = function (x: DiscontinuousIndex[]) {
        if (!arguments.length) return withIndex;

        withIndex = x;
        return discontinuousTimeScaleProvider;
    };
    discontinuousTimeScaleProvider.utc = () => {
        realDateAccessor = (dateAccessor: (d: T) => Date) => (d: T) => {
            const date = dateAccessor(d);
            // The getTimezoneOffset() method returns the time-zone offset from UTC, in minutes, for the current locale.
            const offsetInMillis = date.getTimezoneOffset() * 60 * 1000;
            return new Date(date.getTime() + offsetInMillis);
        };

        return discontinuousTimeScaleProvider;
    };
    discontinuousTimeScaleProvider.setLocale = (locale?: TimeLocaleDefinition, formatters?: IFormatters) => {
        if (locale !== undefined) timeFormatDefaultLocale(locale);

        if (formatters !== undefined) currentFormatters = formatters;

        return discontinuousTimeScaleProvider;
    };

    discontinuousTimeScaleProvider.indexCalculator = function () {
        return createIndex(realDateAccessor, inputDateAccessor, initialIndex, currentFormatters);
    };

    return discontinuousTimeScaleProvider;
}

export default discontinuousTimeScaleProviderBuilder();
