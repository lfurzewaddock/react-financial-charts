import React from "react";
import { render } from "@testing-library/react";

import { Square } from "../../src/markers/SquareMarker";

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

describe("SquareMarker.tsx", () => {
    it("should render defaults with required props only", () => {
        const width = 4;
        const point = {
            x: 0,
            y: 0,
            datum: {},
        };
        const { container } = render(
            <svg>
                <Square width={width} point={point} />
            </svg>,
        );
        const square = container.querySelector("rect");
        expect(square?.getAttribute("class")).toBe("react-financial-charts-marker-rect");
        expect(square?.getAttribute("x")).toBe(`${point.x - width / 2}`);
        expect(square?.getAttribute("y")).toBe(`${point.y - width / 2}`);
        expect(square?.getAttribute("stroke")).toBe("#4682B4");
        expect(square?.getAttribute("stroke-width")).toBe("1");
        expect(square?.getAttribute("fill")).toBe("#4682B4");
        expect(square?.getAttribute("width")).toBe("4");
    });
    it("should render with all simple props provided", () => {
        const width = 4;
        const point = {
            x: 0,
            y: 0,
            datum: {},
        };
        const { container } = render(
            <svg>
                <Square
                    width={width}
                    point={point}
                    className="test-class-name"
                    strokeWidth={2}
                    strokeStyle="crimson"
                    fillStyle="indigo"
                />
            </svg>,
        );
        const square = container.querySelector("rect");
        expect(square?.getAttribute("class")).toBe("test-class-name");
        expect(square?.getAttribute("stroke")).toBe("crimson");
        expect(square?.getAttribute("stroke-width")).toBe("2");
        expect(square?.getAttribute("fill")).toBe("indigo");
    });
    it("should render with default fill colour when fillStyle fn provided fails to return", () => {
        const width = 4;
        const point = {
            x: 0,
            y: 0,
            datum: {
                ...fixtureSellTrade,
                action: "unknown",
            },
        };
        const { container } = render(
            <svg>
                <Square
                    width={width}
                    fillStyle={(datum) => {
                        if (datum.action === "sell") return "red";
                        else if (datum.action === "buy") return "green";
                    }}
                    point={point}
                />
            </svg>,
        );

        const square = container.querySelector("rect");
        expect(square?.getAttribute("fill")).toBe("#4682B4");
    });
    it("should render with fill colour returned by fillStyle fn provided", () => {
        const width = 4;
        const point = {
            x: 0,
            y: 0,
            datum: fixtureSellTrade,
        };

        const { container } = render(
            <svg>
                <Square
                    width={width}
                    fillStyle={(datum) => {
                        if (datum.action === "sell") return "red";
                        else if (datum.action === "buy") return "green";
                    }}
                    point={point}
                />
            </svg>,
        );
        const square = container.querySelector("rect");
        expect(square?.getAttribute("fill")).toBe("red");
    });
    it("should render with radius returned by r fn provided", () => {
        const point = {
            x: 0,
            y: 0,
            datum: fixtureSellTrade,
        };
        const { container } = render(
            <svg>
                <Square
                    width={(datum) => {
                        if (datum.amount < 1) return 3;
                        return 6;
                    }}
                    point={point}
                />
            </svg>,
        );
        const square = container.querySelector("rect");
        expect(square?.getAttribute("width")).toBe("6");
    });
});
