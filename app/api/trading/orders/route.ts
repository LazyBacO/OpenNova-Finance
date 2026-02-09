import { NextResponse } from "next/server"
import { z } from "zod"
import { listTradingOrders, placeTradingOrder } from "@/lib/trading-storage"
import { paperOrderInputSchema } from "@/lib/trading-types"

const orderPayloadSchema = paperOrderInputSchema.extend({
  symbol: z.string().min(1).max(12),
})

export const GET = async () => {
  const orders = await listTradingOrders()
  return NextResponse.json(orders)
}

export const POST = async (request: Request) => {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ message: "Invalid JSON payload" }, { status: 400 })
  }

  const parsed = orderPayloadSchema.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Invalid order payload",
        details: parsed.error.issues.slice(0, 3).map((issue) => issue.message),
      },
      { status: 400 }
    )
  }

  const order = await placeTradingOrder(parsed.data)

  if (order.status === "rejected") {
    return NextResponse.json(order, { status: 422 })
  }

  return NextResponse.json(order, { status: 201 })
}
