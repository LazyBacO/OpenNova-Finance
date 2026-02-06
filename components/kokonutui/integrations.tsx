"use client"

import { PieChart, Globe2, BadgeDollarSign, SignalHigh, SignalLow } from "lucide-react"

const sectorData = [
  {
    label: "Technologie",
    status: "Surpondéré",
    values: "32% / 25%",
    tone: "text-emerald-600",
  },
  {
    label: "Santé",
    status: "À renforcer",
    values: "12% / 15%",
    tone: "text-amber-600",
  },
  {
    label: "Industrie",
    status: "À renforcer",
    values: "10% / 12%",
    tone: "text-amber-600",
  },
  {
    label: "Consommation",
    status: "Aligné",
    values: "18% / 18%",
    tone: "text-slate-600",
  },
]

const regionData = [
  {
    label: "Amérique du Nord",
    status: "Surpondéré",
    values: "58% / 50%",
    tone: "text-emerald-600",
  },
  {
    label: "Europe",
    status: "À renforcer",
    values: "22% / 26%",
    tone: "text-amber-600",
  },
  {
    label: "Asie-Pacifique",
    status: "À renforcer",
    values: "14% / 18%",
    tone: "text-amber-600",
  },
  {
    label: "Émergents",
    status: "Aligné",
    values: "6% / 6%",
    tone: "text-slate-600",
  },
]

const currencyData = [
  {
    label: "USD",
    status: "Surpondéré",
    values: "62% / 55%",
    tone: "text-emerald-600",
  },
  {
    label: "EUR",
    status: "À renforcer",
    values: "24% / 28%",
    tone: "text-amber-600",
  },
  {
    label: "GBP",
    status: "Légèrement bas",
    values: "6% / 7%",
    tone: "text-amber-600",
  },
  {
    label: "JPY",
    status: "À renforcer",
    values: "4% / 5%",
    tone: "text-amber-600",
  },
]

const summaries = [
  {
    title: "Secteurs",
    description: "Répartition par secteurs d'activité.",
    icon: PieChart,
    data: sectorData,
  },
  {
    title: "Zones",
    description: "Exposition géographique globale.",
    icon: Globe2,
    data: regionData,
  },
  {
    title: "Devises",
    description: "Répartition des expositions par devise.",
    icon: BadgeDollarSign,
    data: currencyData,
  },
]

export default function Integrations() {
  return (
    <div className="fx-panel">
      <div className="p-4 border-b border-border/60">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Analyse diversification</h3>
            <p className="text-xs text-muted-foreground">
              Vue par secteur, zone et devise à partir des actions entrées dans l'application.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <SignalHigh className="h-3.5 w-3.5 text-emerald-500" />
            <span>Surpondéré</span>
            <SignalLow className="h-3.5 w-3.5 text-amber-500" />
            <span>À renforcer</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-3">
        {summaries.map((summary) => (
          <div
            key={summary.title}
            className="rounded-xl border border-border/60 bg-background/60 p-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-foreground">{summary.title}</p>
                <p className="text-[11px] text-muted-foreground">{summary.description}</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-accent/40 p-2">
                <summary.icon className="h-4 w-4 text-primary" />
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {summary.data.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-foreground">{item.label}</p>
                    <p className={`text-[11px] font-semibold ${item.tone}`}>{item.status}</p>
                  </div>
                  <p className="text-xs font-semibold text-foreground">{item.values}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
