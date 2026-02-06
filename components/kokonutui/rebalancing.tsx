"use client"

import { cn } from "@/lib/utils"
import { usePortfolio } from "@/lib/portfolio-context"

interface RebalancingProps {
  className?: string
}

const statusStyles = {
  overweight: "border-rose-500/30 bg-rose-500/10 text-rose-600",
  underweight: "border-amber-500/30 bg-amber-500/10 text-amber-600",
  balanced: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
}

export default function Rebalancing({ className }: RebalancingProps) {
  const { allocationActual, allocationTargets, diversificationBreakdown } = usePortfolio()
  const targetMap = new Map(allocationTargets.map((item) => [item.id, item.target]))

  return (
    <div className={cn("w-full fx-panel", className)}>
      <div className="p-4 border-b border-border/60">
        <p className="text-xs text-muted-foreground">Rebalancing</p>
        <h3 className="text-base font-semibold text-foreground">
          Allocation cible, actions &amp; diversification
        </h3>
      </div>

      <div className="p-4 border-b border-border/60 space-y-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-foreground">Allocation cible vs actuelle</span>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-foreground/80" />
              Actuelle
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full border border-foreground/60" />
              Cible
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {allocationActual.map((item) => {
            const target = targetMap.get(item.id) ?? 0
            const delta = item.actual - target
            const deltaLabel = delta > 0 ? `+${delta}%` : `${delta}%`
            return (
              <div key={item.id} className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">{item.label}</span>
                  <span className="text-muted-foreground">
                    {item.actual}% / cible {target}% ({deltaLabel})
                  </span>
                </div>
                <div className="relative h-2 w-full rounded-full bg-muted">
                  <div
                    className={cn("h-full rounded-full", item.colorClass)}
                    style={{ width: `${item.actual}%` }}
                  />
                  <div
                    className="absolute top-0 h-full w-0.5 bg-foreground/70"
                    style={{ left: `${target}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-[1.1fr_1.4fr]">
        <div className="rounded-lg border border-border/60 bg-background/60 p-4 space-y-3">
          <div>
            <p className="text-xs font-semibold text-foreground">Suggestions d&apos;actions</p>
            <p className="text-[11px] text-muted-foreground">
              Ajustements proposés pour revenir à la cible.
            </p>
          </div>
          <div className="space-y-3">
            {diversificationBreakdown.actions.map((action) => (
              <div key={action.id} className="rounded-lg border border-border/60 bg-background/80 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-foreground">{action.title}</p>
                    <p className="text-[11px] text-muted-foreground">{action.description}</p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase",
                      statusStyles[action.status]
                    )}
                  >
                    {action.status === "overweight" && "Surpondéré"}
                    {action.status === "underweight" && "Sous-pondéré"}
                    {action.status === "balanced" && "Aligné"}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Impact estimé</span>
                  <span className="font-medium text-foreground">{action.impact}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border/60 bg-background/60 p-4 space-y-4">
          <div>
            <p className="text-xs font-semibold text-foreground">Analyse diversification</p>
            <p className="text-[11px] text-muted-foreground">
              Vue par secteur, zone et devise.
            </p>
          </div>
          <div className="space-y-4">
            {diversificationBreakdown.analysis.map((group) => (
              <div key={group.id} className="rounded-lg border border-border/60 bg-background/80 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-foreground">{group.title}</p>
                    <p className="text-[11px] text-muted-foreground">{group.description}</p>
                  </div>
                </div>
                <div className="mt-3 space-y-3">
                  {group.items.map((item) => (
                    <div key={item.id} className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <span className="font-medium text-foreground">{item.label}</span>
                          {item.note && (
                            <span className="ml-2 text-[11px] text-muted-foreground">
                              {item.note}
                            </span>
                          )}
                        </div>
                        <span className="text-muted-foreground">
                          {item.current}% / {item.target}%
                        </span>
                      </div>
                      <div className="relative h-2 w-full rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary/70"
                          style={{ width: `${item.current}%` }}
                        />
                        <div
                          className="absolute top-0 h-full w-0.5 bg-foreground/70"
                          style={{ left: `${item.target}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
