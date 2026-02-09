import { NextResponse } from "next/server"
import { z } from "zod"
import { addAlert, readNotificationStore, updateAlert } from "@/lib/notification-storage"
import { alertCreateSchema, alertUpdateSchema } from "@/lib/notification-types"

const alertPatchSchema = z.object({
  id: z.string().min(1).max(100),
  updates: alertUpdateSchema,
})

export const GET = async () => {
  const store = await readNotificationStore()
  return NextResponse.json(store.alerts)
}

export const POST = async (request: Request) => {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ message: "Invalid JSON payload" }, { status: 400 })
  }

  const parsed = alertCreateSchema.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Invalid alert payload",
        details: parsed.error.issues.slice(0, 3).map((issue) => issue.message),
      },
      { status: 400 }
    )
  }

  const alert = await addAlert(parsed.data)
  return NextResponse.json(alert, { status: 201 })
}

export const PATCH = async (request: Request) => {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ message: "Invalid JSON payload" }, { status: 400 })
  }

  const parsed = alertPatchSchema.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Invalid alert update payload",
        details: parsed.error.issues.slice(0, 3).map((issue) => issue.message),
      },
      { status: 400 }
    )
  }

  const alert = await updateAlert(parsed.data.id, parsed.data.updates)
  if (!alert) {
    return NextResponse.json({ message: "Alert not found" }, { status: 404 })
  }

  return NextResponse.json(alert)
}
