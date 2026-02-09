"use client"

import { useEffect, useMemo, useState } from "react"
import { CandlestickChart, ShieldAlert, Wallet2 } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  getTradingOverview,
  getTradingPolicy,
  getTradingQuotes,
  placeTradingOrder,
  updateTradingPolicy,
} from "@/lib/trading-client"
import type { PaperOrderInput, PaperQuote, PaperTradingOverview } from "@/lib/trading-types"

interface AiTradingDeskProps {
  className?: string
}

type Status = {
  tone: "idle" | "success" | "error"
  message: string
}

const defaultOrderForm = {
  symbol: "AAPL",
  side: "buy" as PaperOrderInput["side"],
  quantity: "1",
  type: "market" as PaperOrderInput["type"],
  limitPrice: "",
}

const formatMoney = (valueCents: number) =>
  (valueCents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

export default function AiTradingDesk({ className }: AiTradingDeskProps) {
  const [overview, setOverview] = useState<PaperTradingOverview | null>(null)
  const [orderForm, setOrderForm] = useState(defaultOrderForm)
  const [policyDraft, setPolicyDraft] = useState({
    maxPositionPct: "35",
    maxOrderNotionalUsd: "25000",
    allowShort: false,
    blockedSymbols: "",
  })
  const [quote, setQuote] = useState<PaperQuote | null>(null)
  const [status, setStatus] = useState<Status>({ tone: "idle", message: "" })
  const [loading, setLoading] = useState(true)
  const [submittingOrder, setSubmittingOrder] = useState(false)
  const [savingPolicy, setSavingPolicy] = useState(false)

  const loadDesk = async () => {
    const [nextOverview, nextPolicy] = await Promise.all([getTradingOverview(), getTradingPolicy()])
    setOverview(nextOverview)
    setPolicyDraft({
      maxPositionPct: nextPolicy.maxPositionPct.toString(),
      maxOrderNotionalUsd: (nextPolicy.maxOrderNotionalCents / 100).toString(),
      allowShort: nextPolicy.allowShort,
      blockedSymbols: nextPolicy.blockedSymbols.join(", "),
    })
    return nextPolicy
  }

  useEffect(() => {
    let active = true

    const bootstrap = async () => {
      try {
        await loadDesk()
        if (active) {
          setLoading(false)
        }
      } catch {
        if (active) {
          setStatus({ tone: "error", message: "Impossible de charger le trading desk." })
          setLoading(false)
        }
      }
    }

    void bootstrap()

    const intervalId = window.setInterval(() => {
      void loadDesk().catch(() => {
        // noop
      })
    }, 15_000)

    return () => {
      active = false
      window.clearInterval(intervalId)
    }
  }, [])

  useEffect(() => {
    let active = true

    const fetchQuote = async () => {
      if (!orderForm.symbol.trim()) {
        setQuote(null)
        return
      }

      try {
        const quotes = await getTradingQuotes([orderForm.symbol])
        if (active) {
          setQuote(quotes[0] ?? null)
        }
      } catch {
        if (active) {
          setQuote(null)
        }
      }
    }

    void fetchQuote()
    return () => {
      active = false
    }
  }, [orderForm.symbol])

  const accountMetrics = useMemo(() => {
    if (!overview) {
      return null
    }

    return {
      cash: formatMoney(overview.account.cashCents),
      equity: formatMoney(overview.account.equityCents),
      positionsValue: formatMoney(overview.account.positionsValueCents),
      realized: formatMoney(overview.account.realizedPnlCents),
    }
  }, [overview])

  const submitOrder = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const quantity = Number.parseFloat(orderForm.quantity)
    const limitPrice = Number.parseFloat(orderForm.limitPrice)

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setStatus({ tone: "error", message: "La quantité doit être valide." })
      return
    }

    const payload: PaperOrderInput = {
      symbol: orderForm.symbol,
      side: orderForm.side,
      quantity,
      type: orderForm.type,
      limitPriceCents:
        orderForm.type === "limit" && Number.isFinite(limitPrice) && limitPrice > 0
          ? Math.round(limitPrice * 100)
          : undefined,
    }

    setSubmittingOrder(true)
    try {
      const order = await placeTradingOrder(payload)
      if (order.status === "rejected") {
        setStatus({ tone: "error", message: order.reason || "Ordre rejeté par les garde-fous." })
      } else {
        setStatus({ tone: "success", message: `Ordre ${order.side.toUpperCase()} exécuté sur ${order.symbol}.` })
      }

      await loadDesk()
      setOrderForm((current) => ({
        ...current,
        quantity: "1",
        limitPrice: "",
      }))
    } catch {
      setStatus({ tone: "error", message: "Erreur pendant la création de l&apos;ordre." })
    } finally {
      setSubmittingOrder(false)
    }
  }

  const savePolicy = async () => {
    const maxPositionPct = Number.parseFloat(policyDraft.maxPositionPct)
    const maxOrderNotionalUsd = Number.parseFloat(policyDraft.maxOrderNotionalUsd)

    if (!Number.isFinite(maxPositionPct) || !Number.isFinite(maxOrderNotionalUsd)) {
      setStatus({ tone: "error", message: "Paramètres de risque invalides." })
      return
    }

    setSavingPolicy(true)
    try {
      const blockedSymbols = policyDraft.blockedSymbols
        .split(",")
        .map((symbol) => symbol.trim())
        .filter((symbol) => symbol.length > 0)

      const policy = await updateTradingPolicy({
        maxPositionPct,
        maxOrderNotionalCents: Math.round(maxOrderNotionalUsd * 100),
        allowShort: policyDraft.allowShort,
        blockedSymbols,
      })

      setPolicyDraft({
        maxPositionPct: policy.maxPositionPct.toString(),
        maxOrderNotionalUsd: (policy.maxOrderNotionalCents / 100).toString(),
        allowShort: policy.allowShort,
        blockedSymbols: policy.blockedSymbols.join(", "),
      })
      setStatus({ tone: "success", message: "Politique de risque enregistrée." })
      await loadDesk()
    } catch {
      setStatus({ tone: "error", message: "Impossible de sauvegarder la politique de risque." })
    } finally {
      setSavingPolicy(false)
    }
  }

  if (loading) {
    return <div className={cn("fx-panel p-4 text-sm text-muted-foreground", className)}>Chargement du trading desk...</div>
  }

  return (
    <div className={cn("grid gap-4 xl:grid-cols-[1.05fr_0.95fr]", className)}>
      <div className="fx-panel p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Paper Trading</p>
            <h3 className="text-base font-semibold text-foreground">Desk d&apos;exécution IA (simulé)</h3>
          </div>
          <CandlestickChart className="h-5 w-5 text-primary" />
        </div>

        {accountMetrics && (
          <div className="grid gap-2 md:grid-cols-2 text-xs">
            <div className="rounded-lg border border-border/60 bg-background/60 p-3">
              <p className="text-muted-foreground">Cash</p>
              <p className="font-semibold text-foreground">{accountMetrics.cash}</p>
            </div>
            <div className="rounded-lg border border-border/60 bg-background/60 p-3">
              <p className="text-muted-foreground">Equity</p>
              <p className="font-semibold text-foreground">{accountMetrics.equity}</p>
            </div>
            <div className="rounded-lg border border-border/60 bg-background/60 p-3">
              <p className="text-muted-foreground">Valeur positions</p>
              <p className="font-semibold text-foreground">{accountMetrics.positionsValue}</p>
            </div>
            <div className="rounded-lg border border-border/60 bg-background/60 p-3">
              <p className="text-muted-foreground">P&amp;L réalisé</p>
              <p className="font-semibold text-foreground">{accountMetrics.realized}</p>
            </div>
          </div>
        )}

        <form onSubmit={submitOrder} className="space-y-3 rounded-lg border border-border/60 bg-background/60 p-3">
          <p className="text-xs font-semibold text-foreground">Créer un ordre</p>
          <div className="grid gap-2 md:grid-cols-2">
            <label className="space-y-1 text-xs text-muted-foreground">
              Symbole
              <input
                type="text"
                value={orderForm.symbol}
                onChange={(event) => setOrderForm((current) => ({ ...current, symbol: event.target.value.toUpperCase() }))}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              />
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">
              Quantité
              <input
                type="number"
                min="0"
                step="0.01"
                value={orderForm.quantity}
                onChange={(event) => setOrderForm((current) => ({ ...current, quantity: event.target.value }))}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              />
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">
              Sens
              <select
                value={orderForm.side}
                onChange={(event) =>
                  setOrderForm((current) => ({ ...current, side: event.target.value as PaperOrderInput["side"] }))
                }
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="buy">BUY</option>
                <option value="sell">SELL</option>
              </select>
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">
              Type
              <select
                value={orderForm.type}
                onChange={(event) =>
                  setOrderForm((current) => ({ ...current, type: event.target.value as PaperOrderInput["type"] }))
                }
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="market">Market</option>
                <option value="limit">Limit</option>
              </select>
            </label>
          </div>

          {orderForm.type === "limit" && (
            <label className="space-y-1 text-xs text-muted-foreground">
              Prix limite (USD)
              <input
                type="number"
                min="0"
                step="0.01"
                value={orderForm.limitPrice}
                onChange={(event) => setOrderForm((current) => ({ ...current, limitPrice: event.target.value }))}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              />
            </label>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Cotation</span>
            <span>{quote ? `${quote.symbol} ${formatMoney(quote.priceCents)}` : "—"}</span>
          </div>

          <button
            type="submit"
            disabled={submittingOrder}
            className="w-full rounded-md border border-border/60 bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {submittingOrder ? "Envoi..." : "Exécuter ordre paper"}
          </button>
        </form>

        {status.message && (
          <p className={cn("text-xs", status.tone === "error" ? "text-rose-600" : "text-emerald-600")}>{status.message}</p>
        )}
      </div>

      <div className="space-y-4">
        <div className="fx-panel p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Positions</p>
              <h3 className="text-base font-semibold text-foreground">Exposition courante</h3>
            </div>
            <Wallet2 className="h-5 w-5 text-primary" />
          </div>

          <div className="space-y-2">
            {(overview?.positions ?? []).length === 0 ? (
              <p className="text-xs text-muted-foreground">Aucune position ouverte.</p>
            ) : (
              overview?.positions.map((position) => (
                <div key={position.symbol} className="rounded-lg border border-border/60 bg-background/60 p-2 text-xs">
                  <p className="font-semibold text-foreground">{position.symbol}</p>
                  <p className="text-muted-foreground">
                    {position.quantity} @ {formatMoney(position.avgPriceCents)} | Marché {formatMoney(position.marketPriceCents)}
                  </p>
                  <p className={cn("font-medium", position.unrealizedPnlCents >= 0 ? "text-emerald-600" : "text-rose-600")}>P&amp;L latent {formatMoney(position.unrealizedPnlCents)}</p>
                </div>
              ))
            )}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-foreground">Ordres récents</p>
            {(overview?.recentOrders ?? []).slice(0, 6).map((order) => (
              <div key={order.id} className="rounded-lg border border-border/60 bg-background/60 p-2 text-xs">
                <p className="font-medium text-foreground">
                  {order.side.toUpperCase()} {order.quantity} {order.symbol} ({order.type.toUpperCase()})
                </p>
                <p className="text-muted-foreground">
                  {order.status.toUpperCase()} · {order.fillPriceCents ? formatMoney(order.fillPriceCents) : "—"}
                </p>
                {order.reason && <p className="text-rose-600">{order.reason}</p>}
              </div>
            ))}
          </div>
        </div>

        <div className="fx-panel p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Policy Risk</p>
              <h3 className="text-base font-semibold text-foreground">Garde-fous d&apos;exécution</h3>
            </div>
            <ShieldAlert className="h-5 w-5 text-primary" />
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            <label className="space-y-1 text-xs text-muted-foreground">
              Max position (%)
              <input
                type="number"
                min="1"
                max="100"
                value={policyDraft.maxPositionPct}
                onChange={(event) => setPolicyDraft((current) => ({ ...current, maxPositionPct: event.target.value }))}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              />
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">
              Max ordre (USD)
              <input
                type="number"
                min="1"
                value={policyDraft.maxOrderNotionalUsd}
                onChange={(event) => setPolicyDraft((current) => ({ ...current, maxOrderNotionalUsd: event.target.value }))}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              />
            </label>
          </div>

          <label className="space-y-1 text-xs text-muted-foreground block">
            Symboles bloqués (virgule)
            <input
              type="text"
              value={policyDraft.blockedSymbols}
              onChange={(event) => setPolicyDraft((current) => ({ ...current, blockedSymbols: event.target.value }))}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            />
          </label>

          <label className="flex items-center justify-between rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-xs text-muted-foreground">
            Autoriser le short
            <input
              type="checkbox"
              checked={policyDraft.allowShort}
              onChange={(event) => setPolicyDraft((current) => ({ ...current, allowShort: event.target.checked }))}
              className="h-4 w-4"
            />
          </label>

          <button
            type="button"
            onClick={() => void savePolicy()}
            disabled={savingPolicy}
            className="w-full rounded-md border border-border/60 bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {savingPolicy ? "Sauvegarde..." : "Sauvegarder policy"}
          </button>
        </div>
      </div>
    </div>
  )
}
