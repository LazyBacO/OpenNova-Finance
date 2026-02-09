import type {
  AlertCreateInput,
  AlertItem,
  AlertUpdateInput,
  NotificationPreferences,
  TaskCreateInput,
  TaskItem,
  TaskUpdateInput,
} from "@/lib/notification-types"

const fetchJson = async <T>(input: RequestInfo, init?: RequestInit): Promise<T> => {
  const response = await fetch(input, init)
  if (!response.ok) {
    let detail = "Erreur réseau"
    try {
      const payload = (await response.json()) as { message?: string; error?: string }
      detail = payload.message || payload.error || detail
    } catch {}
    throw new Error(detail)
  }
  return response.json() as Promise<T>
}

export const getTasks = async (): Promise<TaskItem[]> => {
  return fetchJson<TaskItem[]>("/api/tasks")
}

export const createTask = async (
  task: TaskCreateInput
): Promise<TaskItem> => {
  return fetchJson<TaskItem>("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(task),
  })
}

export const updateTask = async (
  id: string,
  updates: TaskUpdateInput
): Promise<TaskItem> => {
  return fetchJson<TaskItem>("/api/tasks", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, updates }),
  })
}

export const getAlerts = async (): Promise<AlertItem[]> => {
  return fetchJson<AlertItem[]>("/api/alerts")
}

export const createAlert = async (
  alert: AlertCreateInput
): Promise<AlertItem> => {
  return fetchJson<AlertItem>("/api/alerts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(alert),
  })
}

export const updateAlert = async (
  id: string,
  updates: AlertUpdateInput
): Promise<AlertItem> => {
  return fetchJson<AlertItem>("/api/alerts", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, updates }),
  })
}

export const getNotificationPreferences = async (): Promise<NotificationPreferences> => {
  return fetchJson<NotificationPreferences>("/api/notification-preferences")
}

export const saveNotificationPreferences = async (
  preferences: NotificationPreferences
): Promise<NotificationPreferences> => {
  return fetchJson<NotificationPreferences>("/api/notification-preferences", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(preferences),
  })
}
