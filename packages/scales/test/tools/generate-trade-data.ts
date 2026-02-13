export interface StockDataPoint {
    date: Date;
    price: number;
    volume: number;
}

interface MarketOptions {
    openHour: number; // e.g., 9 for 9:00 AM
    closeHour: number; // e.g., 16 for 4:00 PM
}

/**
 * Generates synthetic stock price data skipping weekends and non-market hours.
 */
export function generateSyntheticStockDataTS(
    startDateString: string,
    startPrice: number,
    volatilityPercent: number,
    initialVolume: number,
    days: number,
    marketOptions: MarketOptions = { openHour: 9, closeHour: 16 },
): StockDataPoint[] {
    const dataPoints: StockDataPoint[] = [];
    const startDate = new Date(startDateString);
    const volatility = volatilityPercent / 100.0;

    // Trading hours calculation
    const tradingHoursPerDay = marketOptions.closeHour - marketOptions.openHour;
    const intervalsPerDay = tradingHoursPerDay * 12; // Twelve 30-min intervals per hour

    // Time step relative to a full trading year (approx 252 trading days)
    const dt = 1 / (252 * intervalsPerDay);

    let currentPrice = startPrice;
    let daysProcessed = 0;
    let currentDayOffset = 0;

    while (daysProcessed < days) {
        const currentDate = new Date(startDate.getTime());
        currentDate.setDate(startDate.getDate() + currentDayOffset);

        const dayOfWeek = currentDate.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        if (!isWeekend) {
            // Generate daily volume base for this specific trading day
            const baseVolume = initialVolume * (1 + (daysProcessed / days) * (Math.random() * 0.2 - 0.1));
            const dayVolume = Math.max(100, baseVolume + (Math.random() * 0.2 - 0.1) * baseVolume);

            for (let i = 0; i < intervalsPerDay; i++) {
                // Set time to market open + interval offset
                const intervalDate = new Date(currentDate.getTime());
                intervalDate.setHours(marketOptions.openHour, i * 5, 0, 0);

                // Price Generation (Geometric Brownian Motion)
                const standardNormalVariate =
                    Math.sqrt(-2 * Math.log(Math.random())) * Math.cos(2 * Math.PI * Math.random());
                const priceChange = volatility * Math.sqrt(dt) * standardNormalVariate;

                currentPrice *= 1 + priceChange;
                currentPrice = Math.max(0.01, currentPrice);

                // Volume Generation for the interval
                const intervalBase = dayVolume / intervalsPerDay;
                const volume = Math.max(10, intervalBase + (Math.random() * 0.5 - 0.25) * intervalBase);

                dataPoints.push({
                    date: intervalDate,
                    price: parseFloat(currentPrice.toFixed(2)),
                    volume: Math.floor(volume),
                });
            }
            daysProcessed++;
        }
        currentDayOffset++;
    }

    return dataPoints;
}
