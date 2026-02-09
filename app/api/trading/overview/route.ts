import { NextResponse } from "next/server"
import { getTradingOverview } from "@/lib/trading-storage"

export const GET = async () => {
  const overview = await getTradingOverview()
  return NextResponse.json(overview)
}
