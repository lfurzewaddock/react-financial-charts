import React from "react";
import { render } from "@testing-library/react";

import { Triangle } from "../../src/markers/TriangleMarker";

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

describe("TriangleMarker.tsx", () => {
    it("should render defaults with required props only", () => {
        const width = 4;
        const point = {
            x: 0,
            y: 0,
            datum: {},
        };
        const { container } = render(
            <svg>
                <Triangle width={width} point={point} />
            </svg>,
        );
        const triangle = container.querySelector("polygon");
        expect(triangle?.getAttribute("class")).toBe("react-financial-charts-marker-triangle");
        expect(triangle?.getAttribute("stroke")).toBe("#4682B4");
        expect(triangle?.getAttribute("stroke-width")).toBe("1");
        expect(triangle?.getAttribute("fill")).toBe("#4682B4");
        expect((triangle?.getAttribute("points") ?? "").replace(/\s+/g, " ").trim()).toBe(
            "0 -2.309401076758503, 2 1.154700538379252, -2 1.154700538379252",
        );
        expect(triangle?.getAttribute("transform")).toBeFalsy();
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
                <Triangle
                    direction="bottom"
                    width={width}
                    point={point}
                    className="test-class-name"
                    strokeWidth={2}
                    strokeStyle="crimson"
                    fillStyle="indigo"
                />
            </svg>,
        );
        const triangle = container.querySelector("polygon");
        expect(triangle?.getAttribute("class")).toBe("test-class-name");
        expect(triangle?.getAttribute("stroke")).toBe("crimson");
        expect(triangle?.getAttribute("stroke-width")).toBe("2");
        expect(triangle?.getAttribute("fill")).toBe("indigo");
        expect((triangle?.getAttribute("points") ?? "").replace(/\s+/g, " ").trim()).toBe(
            "0 -2.309401076758503, 2 1.154700538379252, -2 1.154700538379252",
        );
        expect(triangle?.getAttribute("transform")).toBe("rotate(180, 0, 0)");
    });
    it("should render with rotation for direction prop provided", () => {
        const width = 4;
        const point = {
            x: 0,
            y: 0,
            datum: {},
        };
        const { container } = render(
            <svg>
                <Triangle direction="right" width={width} point={point} />
            </svg>,
        );
        const triangle = container.querySelector("polygon");
        expect((triangle?.getAttribute("points") ?? "").replace(/\s+/g, " ").trim()).toBe(
            "0 -2.309401076758503, 2 1.154700538379252, -2 1.154700538379252",
        );
        expect(triangle?.getAttribute("transform")).toBe("rotate(90, 0, 0)");
    });
    it("should render with rotation for direction prop provided", () => {
        const width = 4;
        const point = {
            x: 0,
            y: 0,
            datum: {},
        };
        const { container } = render(
            <svg>
                <Triangle direction="left" width={width} point={point} />
            </svg>,
        );
        const triangle = container.querySelector("polygon");
        expect((triangle?.getAttribute("points") ?? "").replace(/\s+/g, " ").trim()).toBe(
            "0 -2.309401076758503, 2 1.154700538379252, -2 1.154700538379252",
        );
        expect(triangle?.getAttribute("transform")).toBe("rotate(-90, 0, 0)");
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
                <Triangle
                    width={width}
                    fillStyle={(datum) => {
                        if (datum.action === "sell") return "red";
                        else if (datum.action === "buy") return "green";
                    }}
                    point={point}
                />
            </svg>,
        );

        const triangle = container.querySelector("polygon");
        expect(triangle?.getAttribute("fill")).toBe("#4682B4");
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
                <Triangle
                    width={width}
                    fillStyle={(datum) => {
                        if (datum.action === "sell") return "red";
                        else if (datum.action === "buy") return "green";
                    }}
                    point={point}
                />
            </svg>,
        );
        const triangle = container.querySelector("polygon");
        expect(triangle?.getAttribute("fill")).toBe("red");
    });
});
