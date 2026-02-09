import { NextResponse } from "next/server"
import { runNotificationScan } from "@/lib/notification-trigger"

const isCronAuthorized = (request: Request): boolean => {
  const secret = process.env.NOTIFICATION_CRON_SECRET
  if (!secret) {
    return true
  }

  const secretHeader = request.headers.get("x-cron-secret")
  const authHeader = request.headers.get("authorization")
  const bearerToken =
    authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null

  return secretHeader === secret || bearerToken === secret
}

export const GET = async (request: Request) => {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ message: "Unauthorized cron request" }, { status: 401 })
  }

  const result = await runNotificationScan()
  return NextResponse.json(result)
}

export const POST = async (request: Request) => {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ message: "Unauthorized cron request" }, { status: 401 })
  }

  const result = await runNotificationScan()
  return NextResponse.json(result)
}
