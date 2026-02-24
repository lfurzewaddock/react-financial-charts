import React from "react";
import { render } from "@testing-library/react";

import { CircleMarker } from "../../src/markers/CircleMarker";

const fixtureSellTrade = {
    id: "trade-1",
    adviceId: "advice-1",
    action: "sell",
    cost: 0.2900249999999938,
    amount: 1.859494655633135,
    price: 116.01,
    portfolio: {
        asset: 0,
        currency: 127.04538777,
    },
    balance: 215.719975,
    date: 1758189420,
    effectivePrice: 115.719975,
    feePercent: 0.25,
};

describe("CircleMarker.tsx", () => {
    it("should render defaults with required props only", () => {
        const { container } = render(
            <svg>
                <CircleMarker
                    r={4}
                    point={{
                        x: 0,
                        y: 0,
                        datum: {},
                    }}
                />
            </svg>,
        );
        const circle = container.querySelector("circle");
        expect(circle?.getAttribute("class")).toBe("react-financial-charts-marker-circle");
        expect(circle?.getAttribute("cx")).toBe("0");
        expect(circle?.getAttribute("cy")).toBe("0");
        expect(circle?.getAttribute("stroke")).toBe("#4682B4");
        expect(circle?.getAttribute("stroke-width")).toBe("1");
        expect(circle?.getAttribute("fill")).toBe("#4682B4");
        expect(circle?.getAttribute("r")).toBe("4");
    });
    it("should render with all simple props provided", () => {
        const { container } = render(
            <svg>
                <CircleMarker
                    r={4}
                    point={{
                        x: 0,
                        y: 0,
                        datum: {},
                    }}
                    className="test-class-name"
                    strokeWidth={2}
                    strokeStyle="crimson"
                    fillStyle="indigo"
                />
                ,
            </svg>,
        );
        const circle = container.querySelector("circle");
        expect(circle?.getAttribute("class")).toBe("test-class-name");
        expect(circle?.getAttribute("stroke")).toBe("crimson");
        expect(circle?.getAttribute("stroke-width")).toBe("2");
        expect(circle?.getAttribute("fill")).toBe("indigo");
    });
    it("should render with default fill colour when fillStyle fn provided fails to return", () => {
        const { container } = render(
            <svg>
                <CircleMarker
                    r={4}
                    fillStyle={(datum) => {
                        if (datum.action === "sell") return "red";
                        else if (datum.action === "buy") return "green";
                    }}
                    point={{
                        x: 0,
                        y: 0,
                        datum: {
                            ...fixtureSellTrade,
                            action: "unknown",
                        },
                    }}
                />
                ,
            </svg>,
        );

        const circle = container.querySelector("circle");
        expect(circle?.getAttribute("fill")).toBe("#4682B4");
    });
    it("should render with fill colour returned by fillStyle fn provided", () => {
        const { container } = render(
            <svg>
                <CircleMarker
                    r={4}
                    fillStyle={(datum) => {
                        if (datum.action === "sell") return "red";
                        else if (datum.action === "buy") return "green";
                    }}
                    point={{
                        x: 0,
                        y: 0,
                        datum: fixtureSellTrade,
                    }}
                />
                ,
            </svg>,
        );
        const circle = container.querySelector("circle");
        expect(circle?.getAttribute("fill")).toBe("red");
    });
    it("should render with radius returned by r fn provided", () => {
        const { container } = render(
            <svg>
                <CircleMarker
                    r={(datum) => {
                        if (datum.amount < 1) return 3;
                        return 6;
                    }}
                    point={{
                        x: 0,
                        y: 0,
                        datum: fixtureSellTrade,
                    }}
                />
                ,
            </svg>,
        );
        const circle = container.querySelector("circle");
        expect(circle?.getAttribute("r")).toBe("6");
    });
});
