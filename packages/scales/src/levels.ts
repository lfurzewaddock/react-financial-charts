import type { RowLevel } from "./discontinuousTimeScaleProvider";

export interface IFormatters {
    readonly yearFormat: string;
    readonly quarterFormat: string;
    readonly monthFormat: string;
    readonly weekFormat: string;
    readonly dayFormat: string;
    readonly hourFormat: string;
    readonly minuteFormat: string;
    readonly secondFormat: string;
    readonly milliSecondFormat: string;
}

export const defaultFormatters: IFormatters = {
    yearFormat: "%Y",
    quarterFormat: "%b",
    monthFormat: "%b",
    weekFormat: "%e",
    dayFormat: "%e",
    hourFormat: "%H:%M",
    minuteFormat: "%H:%M",
    secondFormat: "%H:%M:%S",
    milliSecondFormat: ".%L",
};

export const levelDefinition = [
    /* 22 */ (d: RowLevel, date: Date, _i: number) => d.startOfYear && date.getFullYear() % 12 === 0 && "yearFormat",
    /* 21 */ (d: RowLevel, date: Date, _i: number) => d.startOfYear && date.getFullYear() % 4 === 0 && "yearFormat",
    /* 20 */ (d: RowLevel, date: Date, _i: number) => d.startOfYear && date.getFullYear() % 2 === 0 && "yearFormat",
    /* 19 */ (d: RowLevel, _date: Date, _i: number) => d.startOfYear && "yearFormat",
    /* 18 */ (d: RowLevel, _date: Date, _i: number) => d.startOfQuarter && "quarterFormat",
    /* 17 */ (d: RowLevel, _date: Date, _i: number) => d.startOfMonth && "monthFormat",
    /* 16 */ (d: RowLevel, _date: Date, _i: number) => d.startOfWeek && "weekFormat",
    /* 15 */ (d: RowLevel, _date: Date, i: number) => d.startOfDay && i % 2 === 0 && "dayFormat",
    /* 14 */ (d: RowLevel, _date: Date, _i: number) => d.startOfDay && "dayFormat",
    /* 13 */ (d: RowLevel, _date: Date, _i: number) => d.startOfHalfDay && "hourFormat", // 12h
    /* 12 */ (d: RowLevel, _date: Date, _i: number) => d.startOfQuarterDay && "hourFormat", // 6h
    /* 11 */ (d: RowLevel, _date: Date, _i: number) => d.startOfEighthOfADay && "hourFormat", // 3h
    /* 10 */ (d: RowLevel, date: Date, _i: number) => d.startOfHour && date.getHours() % 2 === 0 && "hourFormat", // 2h -- REMOVE THIS
    /* 9  */ (d: RowLevel, _date: Date, _i: number) => d.startOfHour && "hourFormat", // 1h
    /* 8  */ (d: RowLevel, _date: Date, _i: number) => d.startOf30Minutes && "minuteFormat",
    /* 7  */ (d: RowLevel, _date: Date, _i: number) => d.startOf15Minutes && "minuteFormat",
    /* 6  */ (d: RowLevel, _date: Date, _i: number) => d.startOf5Minutes && "minuteFormat",
    /* 5  */ (d: RowLevel, _date: Date, _i: number) => d.startOfMinute && "minuteFormat",
    /* 4  */ (d: RowLevel, _date: Date, _i: number) => d.startOf30Seconds && "secondFormat",
    /* 3  */ (d: RowLevel, _date: Date, _i: number) => d.startOf15Seconds && "secondFormat",
    /* 2  */ (d: RowLevel, _date: Date, _i: number) => d.startOf5Seconds && "secondFormat",
    /* 1  */ (d: RowLevel, _date: Date, _i: number) => d.startOfSecond && "secondFormat",
    /* 0  */ (_d: RowLevel, _date: Date, _i: number) => "milliSecondFormat",
];
