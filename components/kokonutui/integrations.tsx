"use client"

import { Cloud, Database, ShieldCheck, Plug } from "lucide-react"

const integrations = [
  {
    name: "Plaid",
    category: "Banques & comptes",
    description: "Connexion sécurisée aux banques pour synchroniser les soldes.",
    status: "Disponible",
    accent: "text-emerald-500",
  },
  {
    name: "Stripe",
    category: "Paiements",
    description: "Importer les flux de paiements et revenus récurrents.",
    status: "Disponible",
    accent: "text-sky-500",
  },
  {
    name: "Bourse Direct",
    category: "Courtage",
    description: "Suivre les portefeuilles titres et mouvements d'actions.",
    status: "Disponible",
    accent: "text-violet-500",
  },
]

const futureServices = [
  {
    title: "Service API de synchronisation",
    description:
      "Un service centralisé pour orchestrer la sync des données multi-comptes et consolider les flux.",
  },
  {
    title: "Coffre-fort de tokens",
    description:
      "Gestion sécurisée des accès OAuth pour les intégrations futures et historiques.",
  },
]

export default function Integrations() {
  return (
    <div className="fx-panel">
      <div className="p-4 border-b border-border/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl border border-border/60 bg-primary/10">
            <Plug className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Intégrations connectées</h3>
            <p className="text-xs text-muted-foreground">
              Centralisez les comptes financiers et activez la sync automatisée.
            </p>
          </div>
        </div>
        <span className="text-[11px] font-medium text-muted-foreground">Mock v0</span>
      </div>

      <div className="p-4 space-y-3">
        {integrations.map((integration) => (
          <div
            key={integration.name}
            className="flex flex-col gap-3 rounded-xl border border-border/60 bg-background/60 p-4 lg:flex-row lg:items-center lg:justify-between"
          >
            <div className="flex items-start gap-3">
              <div className="rounded-lg border border-border/60 bg-accent/40 p-2">
                <Cloud className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">{integration.name}</p>
                <p className="text-[11px] text-muted-foreground">{integration.category}</p>
                <p className="text-xs text-foreground/80">{integration.description}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-border/60 bg-accent/40 px-2.5 py-1 text-[11px] text-muted-foreground">
                <span className={`h-2 w-2 rounded-full ${integration.accent}`} />
                {integration.status}
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Connecter
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-border/60 bg-accent/20 p-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <Database className="h-4 w-4 text-primary" />
          Roadmap sync & API
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {futureServices.map((service) => (
            <div
              key={service.title}
              className="rounded-xl border border-dashed border-border/70 bg-background/40 p-3"
            >
              <p className="text-xs font-semibold text-foreground">{service.title}</p>
              <p className="text-[11px] text-muted-foreground">{service.description}</p>
              <p className="mt-2 text-[11px] font-medium text-primary">Prochainement</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
