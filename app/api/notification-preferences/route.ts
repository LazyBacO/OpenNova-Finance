import { NextResponse } from "next/server"
import { updatePreferences, readNotificationStore } from "@/lib/notification-storage"
import { notificationPreferencesSchema } from "@/lib/notification-types"

export const GET = async () => {
  const store = await readNotificationStore()
  return NextResponse.json(store.preferences)
}

export const PUT = async (request: Request) => {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ message: "Invalid JSON payload" }, { status: 400 })
  }

  const parsed = notificationPreferencesSchema.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Invalid preferences payload",
        details: parsed.error.issues.slice(0, 3).map((issue) => issue.message),
      },
      { status: 400 }
    )
  }

  const preferences = await updatePreferences(parsed.data)
  return NextResponse.json(preferences)
}
