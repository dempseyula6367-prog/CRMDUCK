export type PipelineStage = "NEW" | "NEGOTIATION" | "WON" | "LOST";

export type PipelineDeal = {
  stage: PipelineStage;
  value: number | string | { toNumber: () => number };
  probability: number;
};

export type StageSummary = {
  stage: PipelineStage;
  count: number;
  totalValue: number;
  weightedValue: number;
};

export type PipelineSummary = {
  totalOpenValue: number;
  totalWonValue: number;
  conversionRate: number;
  byStage: StageSummary[];
};

const stages: PipelineStage[] = ["NEW", "NEGOTIATION", "WON", "LOST"];

function toNumber(value: PipelineDeal["value"]) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return value.toNumber();
}

export function calculatePipelineSummary(
  deals: PipelineDeal[]
): PipelineSummary {
  const byStage = stages.map((stage) => {
    const stageDeals = deals.filter((deal) => deal.stage === stage);
    const totalValue = stageDeals.reduce(
      (sum, deal) => sum + toNumber(deal.value),
      0
    );
    const weightedValue = stageDeals.reduce(
      (sum, deal) => sum + (toNumber(deal.value) * deal.probability) / 100,
      0
    );

    return {
      stage,
      count: stageDeals.length,
      totalValue,
      weightedValue
    };
  });

  const totalOpenValue = byStage
    .filter((summary) => summary.stage === "NEW" || summary.stage === "NEGOTIATION")
    .reduce((sum, summary) => sum + summary.totalValue, 0);

  const totalWonValue = byStage
    .filter((summary) => summary.stage === "WON")
    .reduce((sum, summary) => sum + summary.totalValue, 0);

  const closedDeals = deals.filter(
    (deal) => deal.stage === "WON" || deal.stage === "LOST"
  );
  const wonDeals = deals.filter((deal) => deal.stage === "WON");

  return {
    totalOpenValue,
    totalWonValue,
    conversionRate:
      closedDeals.length === 0 ? 0 : (wonDeals.length / closedDeals.length) * 100,
    byStage
  };
}
