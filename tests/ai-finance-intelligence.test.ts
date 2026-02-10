import { describe, expect, it } from "vitest"
import { buildAiFinanceIntelligenceContext } from "@/lib/ai-finance-intelligence"
import type { StockIntelligenceContext } from "@/lib/stock-analysis-client"

describe("ai finance intelligence", () => {
  it("builds critical priorities when liquidity and debt are unbalanced", () => {
    const nowIso = new Date().toISOString()

    const context = buildAiFinanceIntelligenceContext({
      accounts: [
        { id: "acc-1", title: "Checking", balanceCents: 120_000, type: "checking" },
        { id: "acc-2", title: "Savings", balanceCents: 80_000, type: "savings" },
        { id: "acc-3", title: "Debt", balanceCents: 400_000, type: "debt" },
      ],
      transactions: [
        {
          id: "tx-1",
          title: "Salary",
          amountCents: 300_000,
          type: "incoming",
          category: "income",
          timestampIso: nowIso,
          status: "completed",
        },
        {
          id: "tx-2",
          title: "Rent + bills",
          amountCents: 360_000,
          type: "outgoing",
          category: "housing",
          timestampIso: nowIso,
          status: "completed",
        },
      ],
      goals: [
        {
          id: "goal-1",
          title: "Emergency fund",
          subtitle: "3 months",
          iconStyle: "savings",
          targetDateIso: "2027-01-01T00:00:00.000Z",
          status: "in-progress",
          progress: 35,
        },
      ],
      stockActions: [
        {
          id: "st-1",
          symbol: "AAPL",
          action: "buy",
          shares: 5,
          priceCents: 18_000,
          tradeDateIso: "2026-02-01T00:00:00.000Z",
          status: "executed",
        },
      ],
    })

    expect(context.metrics.debtToCashRatio).toBeGreaterThan(1)
    expect(context.metrics.emergencyFundMonths).toBeLessThan(3)
    expect(context.priorities.some((item) => item.id === "emergency-fund-gap")).toBe(true)
    expect(context.priorities.some((item) => item.id === "debt-pressure")).toBe(true)
    expect(context.scores.financialHealth).toBeGreaterThanOrEqual(0)
    expect(context.scores.financialHealth).toBeLessThanOrEqual(100)
  })

  it("uses registry positions to compute concentration when available", () => {
    const stockIntelligence: StockIntelligenceContext = {
      summary: "snapshot",
      registry: {
        stats: {
          totalInvested: 0,
          totalRealizedGainLoss: 0,
          totalRealizedReturnPct: 0,
          avgReturnClosed: 0,
          activePositions: 2,
          closedPositions: 0,
          totalTrades: 2,
          winRate: 50,
          bestTrade: null,
          worstTrade: null,
        },
        activePositions: [
          {
            id: "pos-1",
            symbol: "AAPL",
            side: "buy",
            shares: 9,
            entryPrice: 100,
            signal: "buy",
            confidence: 70,
            riskScore: 40,
            targetPrice: 112,
            stopLoss: 94,
            potentialReturn: 12,
          },
          {
            id: "pos-2",
            symbol: "MSFT",
            side: "buy",
            shares: 1,
            entryPrice: 100,
            signal: "hold",
            confidence: 60,
            riskScore: 45,
            targetPrice: 105,
            stopLoss: null,
            potentialReturn: 5,
          },
        ],
        recentAnalyses: [],
      },
      alerts: {
        activeCount: 0,
        criticalCount: 0,
        warningCount: 0,
        active: [],
        recentTriggered: [],
      },
    }

    const context = buildAiFinanceIntelligenceContext({
      accounts: [{ id: "acc-1", title: "Cash", balanceCents: 500_000, type: "checking" }],
      transactions: [],
      goals: [],
      stockActions: [],
      stockIntelligence,
    })

    expect(context.metrics.portfolioConcentrationPct).toBeGreaterThan(80)
  })
})
