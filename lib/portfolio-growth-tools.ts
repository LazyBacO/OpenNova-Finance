export type RiskProfile = "conservative" | "balanced" | "growth" | "aggressive"

export type AllocationVector = {
  equities: number
  bonds: number
  cash: number
  alternatives: number
}

export type GrowthSimulationInput = {
  initialCapital: number
  annualContribution: number
  expectedReturn: number
  annualVolatility: number
  years: number
  inflationRate: number
  targetCapital: number
  simulations: number
  seed?: number
}

export type GrowthSimulationResult = {
  nominalP10: number
  nominalP50: number
  nominalP90: number
  realP50: number
  probabilityToReachTarget: number
  medianPath: number[]
}

export type RebalanceAction = {
  asset: keyof AllocationVector
  current: number
  target: number
  drift: number
  action: "buy" | "sell" | "hold"
  priority: "low" | "medium" | "high"
}

export type GuardrailSignal = {
  level: "info" | "warning" | "critical"
  title: string
  description: string
}

type GuardrailInput = {
  riskProfile: RiskProfile
  emergencyFundMonths: number
  debtRatio: number
  savingsRate: number
  allocation: AllocationVector
  annualVolatility: number
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const percentile = (sorted: number[], p: number): number => {
  if (sorted.length === 0) return 0
  if (sorted.length === 1) return sorted[0]

  const idx = clamp((sorted.length - 1) * p, 0, sorted.length - 1)
  const low = Math.floor(idx)
  const high = Math.ceil(idx)
  if (low === high) {
    return sorted[low]
  }
  const weight = idx - low
  return sorted[low] * (1 - weight) + sorted[high] * weight
}

const createSeededRng = (seed: number) => {
  let value = Math.floor(seed) % 2_147_483_647
  if (value <= 0) {
    value += 2_147_483_646
  }

  return () => {
    value = (value * 16_807) % 2_147_483_647
    return (value - 1) / 2_147_483_646
  }
}

const gaussian = (rng: () => number) => {
  const u1 = Math.max(rng(), 1e-12)
  const u2 = Math.max(rng(), 1e-12)
  const radius = Math.sqrt(-2 * Math.log(u1))
  const theta = 2 * Math.PI * u2
  return radius * Math.cos(theta)
}

const sortAsc = (values: number[]) => [...values].sort((a, b) => a - b)

export const normalizeAllocation = (allocation: AllocationVector): AllocationVector => {
  const total = allocation.equities + allocation.bonds + allocation.cash + allocation.alternatives
  if (total <= 0) {
    return {
      equities: 60,
      bonds: 25,
      cash: 10,
      alternatives: 5,
    }
  }

  return {
    equities: (allocation.equities / total) * 100,
    bonds: (allocation.bonds / total) * 100,
    cash: (allocation.cash / total) * 100,
    alternatives: (allocation.alternatives / total) * 100,
  }
}

export const deterministicProjection = (
  initialCapital: number,
  annualContribution: number,
  expectedReturn: number,
  years: number
): number[] => {
  const safeYears = Math.max(1, Math.floor(years))
  const projected: number[] = []
  let balance = Math.max(0, initialCapital)
  const returnRate = expectedReturn / 100

  for (let year = 0; year < safeYears; year += 1) {
    balance = balance * (1 + returnRate) + annualContribution
    projected.push(balance)
  }

  return projected
}

export const monteCarloProjection = (input: GrowthSimulationInput): GrowthSimulationResult => {
  const {
    initialCapital,
    annualContribution,
    expectedReturn,
    annualVolatility,
    years,
    inflationRate,
    targetCapital,
    simulations,
    seed = 42,
  } = input

  const safeYears = clamp(Math.floor(years), 1, 80)
  const safeSimulations = clamp(Math.floor(simulations), 50, 10_000)
  const mean = expectedReturn / 100
  const sigma = Math.max(0, annualVolatility / 100)
  const inflation = inflationRate / 100
  const rng = createSeededRng(seed)

  const finalBalances: number[] = []
  const paths: number[][] = []
  let successes = 0

  for (let sim = 0; sim < safeSimulations; sim += 1) {
    let balance = Math.max(0, initialCapital)
    const path: number[] = []

    for (let year = 0; year < safeYears; year += 1) {
      const yearlyShock = gaussian(rng)
      const yearlyReturn = mean + sigma * yearlyShock
      balance = balance * (1 + yearlyReturn) + annualContribution
      path.push(balance)
    }

    finalBalances.push(balance)
    if (balance >= targetCapital) {
      successes += 1
    }
    paths.push(path)
  }

  const sortedFinals = sortAsc(finalBalances)
  const nominalP10 = percentile(sortedFinals, 0.1)
  const nominalP50 = percentile(sortedFinals, 0.5)
  const nominalP90 = percentile(sortedFinals, 0.9)
  const realP50 = nominalP50 / Math.pow(1 + inflation, safeYears)

  const medianPath = Array.from({ length: safeYears }, (_, year) => {
    const yearValues = sortAsc(paths.map((path) => path[year]))
    return percentile(yearValues, 0.5)
  })

  return {
    nominalP10,
    nominalP50,
    nominalP90,
    realP50,
    probabilityToReachTarget: successes / safeSimulations,
    medianPath,
  }
}

export const computeRebalanceActions = (
  currentAllocation: AllocationVector,
  targetAllocation: AllocationVector,
  threshold = 4
): RebalanceAction[] => {
  const keys: (keyof AllocationVector)[] = ["equities", "bonds", "cash", "alternatives"]
  return keys
    .map((asset) => {
      const current = currentAllocation[asset]
      const target = targetAllocation[asset]
      const drift = current - target
      const driftAbs = Math.abs(drift)

      const action: RebalanceAction["action"] =
        driftAbs < threshold ? "hold" : drift > 0 ? "sell" : "buy"

      const priority: RebalanceAction["priority"] =
        driftAbs >= 10 ? "high" : driftAbs >= 6 ? "medium" : "low"

      return {
        asset,
        current,
        target,
        drift,
        action,
        priority,
      }
    })
    .sort((a, b) => Math.abs(b.drift) - Math.abs(a.drift))
}

export const buildGuardrailSignals = (input: GuardrailInput): GuardrailSignal[] => {
  const signals: GuardrailSignal[] = []

  if (input.emergencyFundMonths < 3) {
    signals.push({
      level: "critical",
      title: "Fonds d'urgence insuffisant",
      description: "Visez au moins 3 mois de dépenses liquides avant d'augmenter le risque.",
    })
  } else if (input.emergencyFundMonths < 6) {
    signals.push({
      level: "warning",
      title: "Fonds d'urgence à renforcer",
      description: "Un coussin de 6 mois améliore la robustesse du plan long terme.",
    })
  }

  if (input.debtRatio > 0.45) {
    signals.push({
      level: "critical",
      title: "Dette trop élevée",
      description: "Réduire la dette devrait être prioritaire avant d'augmenter l'exposition actions.",
    })
  } else if (input.debtRatio > 0.3) {
    signals.push({
      level: "warning",
      title: "Dette à surveiller",
      description: "Maintenir la dette sous 30% des actifs améliore le profil de croissance.",
    })
  }

  if (input.savingsRate < 0.15) {
    signals.push({
      level: "warning",
      title: "Taux d'épargne faible",
      description: "Un taux d'épargne > 15% aide à sécuriser la croissance sur 10+ ans.",
    })
  }

  const equitiesCapByProfile: Record<RiskProfile, number> = {
    conservative: 45,
    balanced: 65,
    growth: 80,
    aggressive: 95,
  }

  if (input.allocation.equities > equitiesCapByProfile[input.riskProfile]) {
    signals.push({
      level: "warning",
      title: "Allocation actions potentiellement excessive",
      description: `Pour le profil ${input.riskProfile}, limitez les actions à ${equitiesCapByProfile[input.riskProfile]}% environ.`,
    })
  }

  if (input.annualVolatility > 22) {
    signals.push({
      level: "critical",
      title: "Volatilité attendue élevée",
      description: "Le plan vise une volatilité élevée; vérifiez la tolérance au risque et le horizon réel.",
    })
  } else if (input.annualVolatility > 15) {
    signals.push({
      level: "warning",
      title: "Volatilité à surveiller",
      description: "Ajoutez des actifs défensifs pour réduire les drawdowns potentiels.",
    })
  }

  if (signals.length === 0) {
    signals.push({
      level: "info",
      title: "Plan cohérent",
      description: "Les garde-fous principaux sont respectés sur la configuration actuelle.",
    })
  }

  return signals
}
