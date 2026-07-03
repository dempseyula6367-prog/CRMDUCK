import { describe, expect, it } from "vitest";
import { calculatePipelineSummary } from "@/lib/pipeline";

describe("calculatePipelineSummary", () => {
  it("calculates open value, won value and conversion rate", () => {
    const summary = calculatePipelineSummary([
      { stage: "NEW", value: 100, probability: 20 },
      { stage: "NEGOTIATION", value: 200, probability: 60 },
      { stage: "WON", value: 300, probability: 100 },
      { stage: "LOST", value: 400, probability: 0 }
    ]);

    expect(summary.totalOpenValue).toBe(300);
    expect(summary.totalWonValue).toBe(300);
    expect(summary.conversionRate).toBe(50);
    expect(summary.byStage.find((stage) => stage.stage === "NEGOTIATION")).toMatchObject({
      count: 1,
      totalValue: 200,
      weightedValue: 120
    });
  });

  it("returns zero conversion when there are no closed deals", () => {
    const summary = calculatePipelineSummary([
      { stage: "NEW", value: "1000", probability: 10 }
    ]);

    expect(summary.conversionRate).toBe(0);
    expect(summary.totalOpenValue).toBe(1000);
  });
});
