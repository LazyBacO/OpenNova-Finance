"use client"

import { useEffect, useMemo, useState } from "react"
import { Copy, ShieldCheck, Sparkles, TrendingUp } from "lucide-react"
import { usePortfolio } from "@/lib/portfolio-context"
import {
  buildGuardrailSignals,
  computeRebalanceActions,
  deterministicProjection,
  monteCarloProjection,
  normalizeAllocation,
  type AllocationVector,
  type RiskProfile,
} from "@/lib/portfolio-growth-tools"
import {
  defaultGrowthToolkitData,
  loadGrowthToolkitSnapshot,
  saveGrowthToolkitSnapshot,
  type GrowthToolkitData,
} from "@/lib/portfolio-growth-store"
import { formatCurrencyFromCents } from "@/lib/portfolio-data"
import { cn } from "@/lib/utils"

interface PortfolioGrowthStudioProps {
  className?: string
}

const allocationKeys: (keyof AllocationVector)[] = ["equities", "bonds", "cash", "alternatives"]

const allocationLabel: Record<keyof AllocationVector, string> = {
  equities: "Actions",
  bonds: "Obligations",
  cash: "Liquidités",
  alternatives: "Alternatifs",
}

const formatMoney = (value: number) =>
  value.toLocaleString("fr-FR", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  })

const signalClass: Record<"info" | "warning" | "critical", string> = {
  info: "border-blue-500/30 bg-blue-500/10",
  warning: "border-amber-500/30 bg-amber-500/10",
  critical: "border-rose-500/30 bg-rose-500/10",
}

export default function PortfolioGrowthStudio({ className }: PortfolioGrowthStudioProps) {
  const { accounts } = usePortfolio()
  const [data, setData] = useState<GrowthToolkitData>(defaultGrowthToolkitData)
  const [copyStatus, setCopyStatus] = useState("")

  useEffect(() => {
    setData(loadGrowthToolkitSnapshot())
  }, [])

  useEffect(() => {
    saveGrowthToolkitSnapshot(data)
  }, [data])

  const netAssetsCents = useMemo(() => {
    const assets = accounts
      .filter((account) => account.type !== "debt")
      .reduce((sum, account) => sum + account.balanceCents, 0)
    const debt = accounts
      .filter((account) => account.type === "debt")
      .reduce((sum, account) => sum + account.balanceCents, 0)

    return {
      assets,
      debt,
      debtRatio: assets > 0 ? debt / assets : 0,
    }
  }, [accounts])

  const deterministicPath = useMemo(
    () =>
      deterministicProjection(
        data.simulation.initialCapital,
        data.simulation.annualContribution,
        data.simulation.expectedReturnPct,
        data.horizonYears
      ),
    [data]
  )

  const monteCarlo = useMemo(
    () =>
      monteCarloProjection({
        initialCapital: data.simulation.initialCapital,
        annualContribution: data.simulation.annualContribution,
        expectedReturn: data.simulation.expectedReturnPct,
        annualVolatility: data.simulation.annualVolatilityPct,
        years: data.horizonYears,
        inflationRate: data.simulation.inflationPct,
        targetCapital: data.simulation.targetCapital,
        simulations: data.simulation.simulations,
      }),
    [data]
  )

  const rebalanceActions = useMemo(
    () =>
      computeRebalanceActions(
        normalizeAllocation(data.currentAllocation),
        normalizeAllocation(data.targetAllocation),
        data.rebalanceThresholdPct
      ),
    [data]
  )

  const guardrails = useMemo(
    () =>
      buildGuardrailSignals({
        riskProfile: data.riskProfile,
        emergencyFundMonths: data.emergencyFundMonths,
        debtRatio: netAssetsCents.debtRatio,
        savingsRate: data.savingsRatePct / 100,
        allocation: normalizeAllocation(data.targetAllocation),
        annualVolatility: data.simulation.annualVolatilityPct,
      }),
    [data, netAssetsCents.debtRatio]
  )

  const updateNumber = <K extends keyof GrowthToolkitData>(
    key: K,
    nextValue: number
  ) => {
    setData((current) => ({
      ...current,
      [key]: nextValue,
    }))
  }

  const updateSimulation = (key: keyof GrowthToolkitData["simulation"], nextValue: number) => {
    setData((current) => ({
      ...current,
      simulation: {
        ...current.simulation,
        [key]: nextValue,
      },
    }))
  }

  const updateAllocation = (
    block: "targetAllocation" | "currentAllocation",
    key: keyof AllocationVector,
    nextValue: number
  ) => {
    setData((current) => ({
      ...current,
      [block]: {
        ...current[block],
        [key]: nextValue,
      },
    }))
  }

  const applySuggestedCurrentAllocation = () => {
    const assets = accounts.filter((account) => account.type !== "debt")
    const total = assets.reduce((sum, account) => sum + account.balanceCents, 0)
    if (total <= 0) {
      return
    }

    const equities =
      (assets
        .filter((account) => account.type === "investment")
        .reduce((sum, account) => sum + account.balanceCents, 0) /
        total) *
      100

    const cash =
      (assets
        .filter((account) => account.type === "savings" || account.type === "checking")
        .reduce((sum, account) => sum + account.balanceCents, 0) /
        total) *
      100

    setData((current) => ({
      ...current,
      currentAllocation: normalizeAllocation({
        equities,
        bonds: Math.max(0, 100 - equities - cash),
        cash,
        alternatives: 0,
      }),
    }))
  }

  const aiPlaybook = useMemo(() => {
    const allocation = normalizeAllocation(data.targetAllocation)
    const topActions = rebalanceActions
      .filter((action) => action.action !== "hold")
      .slice(0, 3)
      .map(
        (action) =>
          `- ${action.action === "buy" ? "Renforcer" : "Réduire"} ${allocationLabel[action.asset]} (${Math.abs(
            action.drift
          ).toFixed(1)}% d'écart)`
      )

    return [
      `Profil risque: ${data.riskProfile}`,
      `Horizon: ${data.horizonYears} ans`,
      `Allocation cible: Actions ${allocation.equities.toFixed(1)}%, Obligations ${allocation.bonds.toFixed(
        1
      )}%, Cash ${allocation.cash.toFixed(1)}%, Alternatifs ${allocation.alternatives.toFixed(1)}%`,
      `Probabilité d'atteindre l'objectif: ${(monteCarlo.probabilityToReachTarget * 100).toFixed(1)}%`,
      `Capital median projeté (nominal): ${formatMoney(monteCarlo.nominalP50)}`,
      `Capital median réel (inflation): ${formatMoney(monteCarlo.realP50)}`,
      "Actions de rebalancing prioritaires:",
      ...(topActions.length > 0 ? topActions : ["- Aucune action urgente"]),
      "Garde-fous actifs:",
      ...guardrails.map((signal) => `- [${signal.level.toUpperCase()}] ${signal.title}: ${signal.description}`),
    ].join("\n")
  }, [data, guardrails, monteCarlo, rebalanceActions])

  const copyAiPlaybook = async () => {
    try {
      await navigator.clipboard.writeText(aiPlaybook)
      setCopyStatus("Playbook copié pour l'agent IA")
      window.setTimeout(() => setCopyStatus(""), 2000)
    } catch {
      setCopyStatus("Impossible de copier automatiquement")
      window.setTimeout(() => setCopyStatus(""), 2500)
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="fx-panel space-y-4 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Gouvernance long terme</p>
              <h3 className="text-base font-semibold text-foreground">Plan d&apos;investissement piloté</h3>
            </div>
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-xs text-muted-foreground">
              Profil risque
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={data.riskProfile}
                onChange={(event) =>
                  setData((current) => ({ ...current, riskProfile: event.target.value as RiskProfile }))
                }
              >
                <option value="conservative">Conservateur</option>
                <option value="balanced">Équilibré</option>
                <option value="growth">Croissance</option>
                <option value="aggressive">Agressif</option>
              </select>
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">
              Horizon (années)
              <input
                type="number"
                min="3"
                max="50"
                value={data.horizonYears}
                onChange={(event) => updateNumber("horizonYears", Number.parseInt(event.target.value, 10) || 3)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              />
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">
              Fonds d&apos;urgence (mois)
              <input
                type="number"
                min="0"
                max="24"
                value={data.emergencyFundMonths}
                onChange={(event) =>
                  updateNumber("emergencyFundMonths", Number.parseInt(event.target.value, 10) || 0)
                }
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              />
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">
              Taux d&apos;épargne (%)
              <input
                type="number"
                min="0"
                max="80"
                value={data.savingsRatePct}
                onChange={(event) => updateNumber("savingsRatePct", Number.parseFloat(event.target.value) || 0)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              />
            </label>
          </div>

          <div className="rounded-lg border border-border/60 bg-background/60 p-3 text-xs text-muted-foreground">
            <p>
              Actifs: <span className="font-semibold text-foreground">{formatCurrencyFromCents(netAssetsCents.assets)}</span>
            </p>
            <p>
              Dette: <span className="font-semibold text-foreground">{formatCurrencyFromCents(netAssetsCents.debt)}</span>
            </p>
            <p>
              Ratio dette/actifs: <span className="font-semibold text-foreground">{(netAssetsCents.debtRatio * 100).toFixed(1)}%</span>
            </p>
          </div>
        </div>

        <div className="fx-panel space-y-4 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Projection croissance</p>
              <h3 className="text-base font-semibold text-foreground">Monte Carlo multi-années</h3>
            </div>
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-xs text-muted-foreground">
              Capital initial
              <input
                type="number"
                min="0"
                value={data.simulation.initialCapital}
                onChange={(event) => updateSimulation("initialCapital", Number.parseFloat(event.target.value) || 0)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              />
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">
              Apport annuel
              <input
                type="number"
                min="0"
                value={data.simulation.annualContribution}
                onChange={(event) => updateSimulation("annualContribution", Number.parseFloat(event.target.value) || 0)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              />
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">
              Rendement attendu (%)
              <input
                type="number"
                value={data.simulation.expectedReturnPct}
                onChange={(event) => updateSimulation("expectedReturnPct", Number.parseFloat(event.target.value) || 0)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              />
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">
              Volatilité (%)
              <input
                type="number"
                min="0"
                value={data.simulation.annualVolatilityPct}
                onChange={(event) => updateSimulation("annualVolatilityPct", Number.parseFloat(event.target.value) || 0)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              />
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">
              Inflation (%)
              <input
                type="number"
                value={data.simulation.inflationPct}
                onChange={(event) => updateSimulation("inflationPct", Number.parseFloat(event.target.value) || 0)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              />
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">
              Objectif capital
              <input
                type="number"
                min="1"
                value={data.simulation.targetCapital}
                onChange={(event) => updateSimulation("targetCapital", Number.parseFloat(event.target.value) || 1)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              />
            </label>
          </div>

          <div className="rounded-lg border border-border/60 bg-background/60 p-3 text-xs text-muted-foreground space-y-1">
            <p>
              P10: <span className="font-semibold text-foreground">{formatMoney(monteCarlo.nominalP10)}</span>
            </p>
            <p>
              P50: <span className="font-semibold text-foreground">{formatMoney(monteCarlo.nominalP50)}</span>
            </p>
            <p>
              P90: <span className="font-semibold text-foreground">{formatMoney(monteCarlo.nominalP90)}</span>
            </p>
            <p>
              Probabilité d&apos;atteindre l&apos;objectif: <span className="font-semibold text-foreground">{(monteCarlo.probabilityToReachTarget * 100).toFixed(1)}%</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <div className="fx-panel space-y-4 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Allocation stratégique</p>
              <h3 className="text-base font-semibold text-foreground">Cible vs actuelle</h3>
            </div>
            <button
              type="button"
              onClick={applySuggestedCurrentAllocation}
              className="rounded-md border border-border/60 bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent/60"
            >
              Auto depuis comptes
            </button>
          </div>

          <div className="space-y-3">
            {allocationKeys.map((asset) => (
              <div key={asset} className="rounded-lg border border-border/60 bg-background/60 p-3">
                <p className="text-xs font-semibold text-foreground mb-2">{allocationLabel[asset]}</p>
                <div className="grid gap-2 md:grid-cols-2">
                  <label className="space-y-1 text-xs text-muted-foreground">
                    Cible (%)
                    <input
                      type="number"
                      value={data.targetAllocation[asset]}
                      onChange={(event) =>
                        updateAllocation("targetAllocation", asset, Number.parseFloat(event.target.value) || 0)
                      }
                      className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    />
                  </label>
                  <label className="space-y-1 text-xs text-muted-foreground">
                    Actuelle (%)
                    <input
                      type="number"
                      value={data.currentAllocation[asset]}
                      onChange={(event) =>
                        updateAllocation("currentAllocation", asset, Number.parseFloat(event.target.value) || 0)
                      }
                      className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>

          <label className="space-y-1 text-xs text-muted-foreground">
            Seuil de rebalancing (%)
            <input
              type="number"
              min="1"
              max="20"
              value={data.rebalanceThresholdPct}
              onChange={(event) => updateNumber("rebalanceThresholdPct", Number.parseFloat(event.target.value) || 1)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            />
          </label>

          <div className="space-y-2">
            {rebalanceActions.map((action) => (
              <div key={action.asset} className="rounded-lg border border-border/60 bg-background/50 p-2 text-xs">
                <span className="font-semibold text-foreground">{allocationLabel[action.asset]}</span>
                <span className="text-muted-foreground"> · {action.current.toFixed(1)}% vers {action.target.toFixed(1)}%</span>
                <span className="ml-2 text-primary">{action.action.toUpperCase()}</span>
                <span className="ml-2 text-muted-foreground">priorité {action.priority}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="fx-panel space-y-3 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Garde-fous</p>
                <h3 className="text-base font-semibold text-foreground">Contrôles de robustesse</h3>
              </div>
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            {guardrails.map((signal) => (
              <div key={`${signal.level}-${signal.title}`} className={cn("rounded-lg border p-3", signalClass[signal.level])}>
                <p className="text-sm font-semibold text-foreground">{signal.title}</p>
                <p className="text-xs text-muted-foreground">{signal.description}</p>
              </div>
            ))}
          </div>

          <div className="fx-panel space-y-3 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Playbook IA</p>
                <h3 className="text-base font-semibold text-foreground">Synthèse prête à l&apos;emploi</h3>
              </div>
              <button
                type="button"
                onClick={() => void copyAiPlaybook()}
                className="inline-flex items-center gap-2 rounded-md border border-border/60 bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Copy className="h-3.5 w-3.5" />
                Copier
              </button>
            </div>
            <pre className="max-h-56 overflow-auto rounded-lg border border-border/60 bg-background/60 p-3 text-[11px] leading-relaxed text-foreground whitespace-pre-wrap">
              {aiPlaybook}
            </pre>
            {copyStatus && <p className="text-xs text-emerald-600">{copyStatus}</p>}
            <p className="text-[11px] text-muted-foreground">
              Trajectoire médiane déterministe à {data.horizonYears} ans: {formatMoney(deterministicPath.at(-1) ?? 0)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
