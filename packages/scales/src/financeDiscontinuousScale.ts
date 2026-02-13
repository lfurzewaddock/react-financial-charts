import { ascending } from "d3-array";
import { scaleLinear, InterpolatorFactory, type ScaleLinear } from "d3-scale";
import { levelDefinition } from "./levels";

import type { DiscontinuousIndex } from "./discontinuousTimeScaleProvider";

export interface FinanceDiscontinuousScale extends ScaleLinear<number, number> {
    index(): DiscontinuousIndex[];
    index(x: DiscontinuousIndex[]): FinanceDiscontinuousScale;
    value(x: number): Date | undefined;
}

// Identifies the highest detail level (e.g., years vs minutes) for tick generation
const MAX_LEVEL = levelDefinition.length - 1;

/**
 * Creates a specialized scale for financial charts that skips gaps in time (weekends/holidays).
 * It uses an underlying linear scale to map array indices to pixel coordinates.
 *
 * @param index - The mapping of linear indices to real-world dates and zoom levels.
 * @param backingLinearScale - The core D3 scale used for mathematical projection.
 */
export default function financeDiscontinuousScale(
    index: DiscontinuousIndex[],
    backingLinearScale = scaleLinear(),
): FinanceDiscontinuousScale {
    if (index == null) throw new Error("Use the discontinuousTimeScaleProvider to create financeDiscontinuousScale");

    /**
     * Maps a continuous index value to a pixel coordinate.
     */
    function scale(newScale: number): number {
        return backingLinearScale(newScale);
    }
    /**
     * Reverse mapping: Pixel coordinate -> Index value.
     * Includes slight rounding to fix floating point jitter during interactions.
     */
    scale.invert = (value: number) => {
        const inverted = backingLinearScale.invert(value);
        return Math.round(inverted * 10000) / 10000;
    };
    /**
     * Gets/sets the data domain (the range of indices currently visible).
     */
    scale.domain = ((newDomain?: number[]) => {
        if (newDomain == null) return backingLinearScale.domain();

        backingLinearScale.domain(newDomain);
        return scale as FinanceDiscontinuousScale;
    }) as {
        (): number[];
        (newDomain: number[]): FinanceDiscontinuousScale;
    };
    /**
     * Gets/sets the visual range (the pixel width of the axis).
     */
    scale.range = ((range?: number[]) => {
        if (range == null) return backingLinearScale.range();

        backingLinearScale.range(range);
        return scale as FinanceDiscontinuousScale;
    }) as {
        (): number[];
        (range: number[]): FinanceDiscontinuousScale;
    };
    // Proxies for standard D3 linear scale methods
    scale.rangeRound = (range: number[]) => {
        backingLinearScale.rangeRound(range);
        return scale as FinanceDiscontinuousScale;
    };
    scale.clamp = ((clamp?: boolean) => {
        if (clamp == null) return backingLinearScale.clamp();

        backingLinearScale.clamp(clamp);
        return scale as FinanceDiscontinuousScale;
    }) as {
        (): boolean;
        (clamp: boolean): FinanceDiscontinuousScale;
    };
    scale.interpolate = ((interpolate?: InterpolatorFactory<number, number>) => {
        if (interpolate == null) return backingLinearScale.interpolate();

        backingLinearScale.interpolate(interpolate);
        return scale as FinanceDiscontinuousScale;
    }) as {
        (): InterpolatorFactory<number, number>;
        (interpolate: InterpolatorFactory<number, number>): FinanceDiscontinuousScale;
    };
    /**
     * Unlike a standard scale, this filters ticks based on 'levels' (Year, Month, Day)
     * to ensure that labels don't overlap and remain relevant to the zoom level.
     */
    scale.ticks = (m?: number) => {
        const backingTicks = backingLinearScale.ticks(m);
        const ticksMap = new Map<number, DiscontinuousIndex[]>();

        const [domainStart, domainEnd] = backingLinearScale.domain();

        // Calculate visible bounds based on the provided index array
        const dStart = Math.ceil(domainStart);
        const dHead = index[0]?.index;
        const start = Math.max(dStart, dHead) + Math.abs(dHead);
        const end = Math.min(Math.floor(domainEnd), index[index.length - 1]?.index) + Math.abs(dHead);

        // Determine how many ticks are needed based on the zoom level
        const desiredTickCount = Math.ceil(((end - start) / (domainEnd - domainStart)) * backingTicks.length);

        // Group potential ticks by their level (Year > Month > Day)
        for (let i = MAX_LEVEL; i >= 0; i--) {
            const ticksAtLevel = ticksMap.get(i);
            const temp = ticksAtLevel == null ? [] : ticksAtLevel.slice();

            for (let j = start; j <= end; j++) if (index[j].level === i) temp.push(index[j]);

            ticksMap.set(i, temp);
        }

        // Select ticks from highest level down until we reach the desired count
        let unsortedTicks: number[] = [];
        for (let k = MAX_LEVEL; k >= 0; k--) {
            const selectedTicks = ticksMap.get(k) ?? [];
            if (selectedTicks.length + unsortedTicks.length > desiredTickCount * 1.5) break;
            unsortedTicks = unsortedTicks.concat(selectedTicks.map((d) => d.index));
        }

        const ticks = unsortedTicks.sort(ascending);
        // Conflict resolution: Remove ticks that are visually too close to each other
        if (end - start > ticks.length) {
            const ticksSet = new Set(ticks);

            const d = Math.abs(index[0].index);

            // ignore ticks within this distance
            const distance = Math.ceil(
                (backingTicks.length > 0
                    ? (backingTicks[backingTicks.length - 1] - backingTicks[0]) / backingTicks.length / 4
                    : 1) * 1.5,
            );

            for (let i = 0; i < ticks.length - 1; i++)
                for (let j = i + 1; j < ticks.length; j++)
                    if (ticks[j] - ticks[i] <= distance)
                        ticksSet.delete(index[ticks[i] + d].level >= index[ticks[j] + d].level ? ticks[j] : ticks[i]);

            return Array.from(ticksSet);
        }

        return ticks;
    };
    /**
     * Returns a formatter that converts an index into a human-readable date string
     * based on the format provided in the index (e.g., "Jan 2024" or "10:30").
     */
    scale.tickFormat = () => {
        return function (x: number) {
            const d = Math.abs(index[0].index);
            const { format, date } = index[Math.floor(x + d)];
            return format(date);
        };
    };
    /**
     * Utility to retrieve the actual Date object for a specific index.
     */
    scale.value = (x: number) => {
        const d = Math.abs(index[0].index);
        const row = index[Math.floor(x + d)];
        if (row !== undefined) {
            const { date } = row;
            return date;
        }
    };
    /**
     * Round start and end values of domain to 'nice' values
     */
    scale.nice = (count?: number) => {
        backingLinearScale.nice(count);
        return scale as FinanceDiscontinuousScale;
    };
    /**
     * Gets/sets the index array used for time-to-linear mapping.
     */
    scale.index = ((x?: DiscontinuousIndex[]): DiscontinuousIndex[] | FinanceDiscontinuousScale => {
        if (x == null) return index;

        index = x;
        return scale as FinanceDiscontinuousScale;
    }) as {
        (): DiscontinuousIndex[];
        (x: DiscontinuousIndex[]): FinanceDiscontinuousScale;
    };
    /**
     * Returns a copy of the scale to prevent side-effects when modifying
     * shared instances (standard D3 pattern).
     */
    scale.copy = () => {
        return financeDiscontinuousScale(index, backingLinearScale.copy());
    };
    /**
     * Gets/sets the value returned for invalid inputs (NaN, null, undefined).
     * This is required by the ScaleLinear interface.
     */
    scale.unknown = ((value?: unknown) => {
        if (value === undefined) return backingLinearScale.unknown();

        backingLinearScale.unknown(value);
        return scale as FinanceDiscontinuousScale;
    }) as {
        (): unknown;
        (value: unknown): FinanceDiscontinuousScale;
    };
    return scale as FinanceDiscontinuousScale;
}
