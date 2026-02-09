import { NextResponse } from "next/server"
import { z } from "zod"
import { addTask, readNotificationStore, updateTask } from "@/lib/notification-storage"
import { taskCreateSchema, taskUpdateSchema } from "@/lib/notification-types"

const taskPatchSchema = z.object({
  id: z.string().min(1).max(100),
  updates: taskUpdateSchema,
})

export const GET = async () => {
  const store = await readNotificationStore()
  return NextResponse.json(store.tasks)
}

export const POST = async (request: Request) => {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ message: "Invalid JSON payload" }, { status: 400 })
  }

  const parsed = taskCreateSchema.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Invalid task payload",
        details: parsed.error.issues.slice(0, 3).map((issue) => issue.message),
      },
      { status: 400 }
    )
  }

  const task = await addTask(parsed.data)
  return NextResponse.json(task, { status: 201 })
}

export const PATCH = async (request: Request) => {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ message: "Invalid JSON payload" }, { status: 400 })
  }

  const parsed = taskPatchSchema.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Invalid task update payload",
        details: parsed.error.issues.slice(0, 3).map((issue) => issue.message),
      },
      { status: 400 }
    )
  }

  const task = await updateTask(parsed.data.id, parsed.data.updates)
  if (!task) {
    return NextResponse.json({ message: "Task not found" }, { status: 404 })
  }

  return NextResponse.json(task)
}
