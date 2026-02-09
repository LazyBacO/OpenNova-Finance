import {
  normalizeAllocation,
  type AllocationVector,
  type RiskProfile,
} from "@/lib/portfolio-growth-tools"

export type GrowthToolkitData = {
  version: 1
  riskProfile: RiskProfile
  horizonYears: number
  emergencyFundMonths: number
  maxDrawdownPct: number
  savingsRatePct: number
  rebalanceThresholdPct: number
  targetAllocation: AllocationVector
  currentAllocation: AllocationVector
  simulation: {
    initialCapital: number
    annualContribution: number
    expectedReturnPct: number
    annualVolatilityPct: number
    inflationPct: number
    targetCapital: number
    simulations: number
  }
}

const STORAGE_KEY = "opennova.growth-toolkit.v1"

export const defaultGrowthToolkitData: GrowthToolkitData = {
  version: 1,
  riskProfile: "balanced",
  horizonYears: 20,
  emergencyFundMonths: 6,
  maxDrawdownPct: 25,
  savingsRatePct: 18,
  rebalanceThresholdPct: 4,
  targetAllocation: {
    equities: 60,
    bonds: 25,
    cash: 10,
    alternatives: 5,
  },
  currentAllocation: {
    equities: 60,
    bonds: 20,
    cash: 15,
    alternatives: 5,
  },
  simulation: {
    initialCapital: 25_000,
    annualContribution: 9_000,
    expectedReturnPct: 7,
    annualVolatilityPct: 14,
    inflationPct: 2,
    targetCapital: 450_000,
    simulations: 1_500,
  },
}

const asNumber = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback

const asRiskProfile = (value: unknown): RiskProfile => {
  if (value === "conservative" || value === "balanced" || value === "growth" || value === "aggressive") {
    return value
  }
  return defaultGrowthToolkitData.riskProfile
}

const normalize = (input: Partial<GrowthToolkitData> | null | undefined): GrowthToolkitData => {
  const raw = input ?? {}
  const simulation = (raw.simulation ?? {}) as Partial<GrowthToolkitData["simulation"]>
  const targetAllocation = normalizeAllocation({
    equities: asNumber(raw.targetAllocation?.equities, defaultGrowthToolkitData.targetAllocation.equities),
    bonds: asNumber(raw.targetAllocation?.bonds, defaultGrowthToolkitData.targetAllocation.bonds),
    cash: asNumber(raw.targetAllocation?.cash, defaultGrowthToolkitData.targetAllocation.cash),
    alternatives: asNumber(raw.targetAllocation?.alternatives, defaultGrowthToolkitData.targetAllocation.alternatives),
  })

  const currentAllocation = normalizeAllocation({
    equities: asNumber(raw.currentAllocation?.equities, defaultGrowthToolkitData.currentAllocation.equities),
    bonds: asNumber(raw.currentAllocation?.bonds, defaultGrowthToolkitData.currentAllocation.bonds),
    cash: asNumber(raw.currentAllocation?.cash, defaultGrowthToolkitData.currentAllocation.cash),
    alternatives: asNumber(raw.currentAllocation?.alternatives, defaultGrowthToolkitData.currentAllocation.alternatives),
  })

  return {
    version: 1,
    riskProfile: asRiskProfile(raw.riskProfile),
    horizonYears: Math.max(3, Math.min(50, Math.round(asNumber(raw.horizonYears, defaultGrowthToolkitData.horizonYears)))),
    emergencyFundMonths: Math.max(0, Math.min(24, Math.round(asNumber(raw.emergencyFundMonths, defaultGrowthToolkitData.emergencyFundMonths)))),
    maxDrawdownPct: Math.max(5, Math.min(70, asNumber(raw.maxDrawdownPct, defaultGrowthToolkitData.maxDrawdownPct))),
    savingsRatePct: Math.max(0, Math.min(80, asNumber(raw.savingsRatePct, defaultGrowthToolkitData.savingsRatePct))),
    rebalanceThresholdPct: Math.max(1, Math.min(20, asNumber(raw.rebalanceThresholdPct, defaultGrowthToolkitData.rebalanceThresholdPct))),
    targetAllocation,
    currentAllocation,
    simulation: {
      initialCapital: Math.max(0, asNumber(simulation.initialCapital, defaultGrowthToolkitData.simulation.initialCapital)),
      annualContribution: Math.max(0, asNumber(simulation.annualContribution, defaultGrowthToolkitData.simulation.annualContribution)),
      expectedReturnPct: Math.max(-20, Math.min(30, asNumber(simulation.expectedReturnPct, defaultGrowthToolkitData.simulation.expectedReturnPct))),
      annualVolatilityPct: Math.max(0, Math.min(60, asNumber(simulation.annualVolatilityPct, defaultGrowthToolkitData.simulation.annualVolatilityPct))),
      inflationPct: Math.max(-5, Math.min(20, asNumber(simulation.inflationPct, defaultGrowthToolkitData.simulation.inflationPct))),
      targetCapital: Math.max(1, asNumber(simulation.targetCapital, defaultGrowthToolkitData.simulation.targetCapital)),
      simulations: Math.max(100, Math.min(10_000, Math.round(asNumber(simulation.simulations, defaultGrowthToolkitData.simulation.simulations)))),
    },
  }
}

export const loadGrowthToolkitSnapshot = (): GrowthToolkitData => {
  if (typeof window === "undefined") {
    return defaultGrowthToolkitData
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return defaultGrowthToolkitData
  }

  try {
    const parsed = JSON.parse(raw) as Partial<GrowthToolkitData>
    return normalize(parsed)
  } catch {
    return defaultGrowthToolkitData
  }
}

export const saveGrowthToolkitSnapshot = (data: GrowthToolkitData) => {
  if (typeof window === "undefined") {
    return
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalize(data)))
}

export const getGrowthToolkitStorageKey = () => STORAGE_KEY
