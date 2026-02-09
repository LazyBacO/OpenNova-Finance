import { describe, expect, it } from "vitest"
import {
  buildGuardrailSignals,
  computeRebalanceActions,
  deterministicProjection,
  monteCarloProjection,
  normalizeAllocation,
} from "@/lib/portfolio-growth-tools"

describe("portfolio growth tools", () => {
  it("normalizes allocation to 100%", () => {
    const normalized = normalizeAllocation({
      equities: 40,
      bonds: 20,
      cash: 10,
      alternatives: 10,
    })

    const total = normalized.equities + normalized.bonds + normalized.cash + normalized.alternatives
    expect(total).toBeCloseTo(100, 6)
  })

  it("builds deterministic projection path", () => {
    const path = deterministicProjection(10_000, 2_000, 6, 5)
    expect(path.length).toBe(5)
    expect(path[4]).toBeGreaterThan(path[0])
  })

  it("runs monte carlo with stable percentiles", () => {
    const result = monteCarloProjection({
      initialCapital: 20_000,
      annualContribution: 5_000,
      expectedReturn: 7,
      annualVolatility: 12,
      years: 20,
      inflationRate: 2,
      targetCapital: 250_000,
      simulations: 1000,
      seed: 123,
    })

    expect(result.nominalP90).toBeGreaterThanOrEqual(result.nominalP50)
    expect(result.nominalP50).toBeGreaterThanOrEqual(result.nominalP10)
    expect(result.probabilityToReachTarget).toBeGreaterThanOrEqual(0)
    expect(result.probabilityToReachTarget).toBeLessThanOrEqual(1)
    expect(result.medianPath.length).toBe(20)
  })

  it("returns rebalance actions with buy and sell signals", () => {
    const actions = computeRebalanceActions(
      {
        equities: 75,
        bonds: 10,
        cash: 10,
        alternatives: 5,
      },
      {
        equities: 60,
        bonds: 25,
        cash: 10,
        alternatives: 5,
      },
      4
    )

    const equities = actions.find((item) => item.asset === "equities")
    const bonds = actions.find((item) => item.asset === "bonds")

    expect(equities?.action).toBe("sell")
    expect(bonds?.action).toBe("buy")
  })

  it("emits critical guardrails when risk is too high", () => {
    const signals = buildGuardrailSignals({
      riskProfile: "balanced",
      emergencyFundMonths: 1,
      debtRatio: 0.5,
      savingsRate: 0.08,
      allocation: {
        equities: 85,
        bonds: 5,
        cash: 5,
        alternatives: 5,
      },
      annualVolatility: 26,
    })

    const hasCritical = signals.some((signal) => signal.level === "critical")
    expect(hasCritical).toBe(true)
  })
})
