import { NextResponse } from "next/server"
import { getTradingPolicy, updateTradingPolicy } from "@/lib/trading-storage"
import { paperTradingPolicyUpdateSchema } from "@/lib/trading-types"

export const GET = async () => {
  const policy = await getTradingPolicy()
  return NextResponse.json(policy)
}

export const PUT = async (request: Request) => {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ message: "Invalid JSON payload" }, { status: 400 })
  }

  const parsed = paperTradingPolicyUpdateSchema.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Invalid trading policy payload",
        details: parsed.error.issues.slice(0, 3).map((issue) => issue.message),
      },
      { status: 400 }
    )
  }

  const policy = await updateTradingPolicy(parsed.data)
  return NextResponse.json(policy)
}
