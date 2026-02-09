import {
  dispatchAlertNotification,
  dispatchTaskNotification,
  type NotificationDispatchPayload,
} from "@/lib/notification-dispatcher"
import {
  getNextAlertNotificationAt,
  getNextTaskNotificationAt,
} from "@/lib/notification-scheduler"
import {
  readNotificationStore,
  writeNotificationStore,
} from "@/lib/notification-storage"

export type NotificationScanResult = {
  triggered: NotificationDispatchPayload[]
}

export const runNotificationScan = async (): Promise<NotificationScanResult> => {
  const store = await readNotificationStore()
  const now = new Date()
  const nowIso = now.toISOString()
  const triggered: NotificationDispatchPayload[] = []
  let hasStoreUpdates = false

  for (const task of store.tasks) {
    const nextAt = getNextTaskNotificationAt(task, now)
    if (!nextAt) {
      continue
    }
    const lastNotified = task.lastNotifiedAt ? new Date(task.lastNotifiedAt) : null
    if (lastNotified && lastNotified.getTime() >= nextAt.getTime()) {
      continue
    }

    triggered.push(dispatchTaskNotification(task, store.preferences))
    task.lastNotifiedAt = nowIso
    task.updatedAt = nowIso
    hasStoreUpdates = true
  }

  for (const alert of store.alerts) {
    const nextAt = getNextAlertNotificationAt(alert, now)
    if (!nextAt) {
      continue
    }
    const lastNotified = alert.lastNotifiedAt ? new Date(alert.lastNotifiedAt) : null
    if (lastNotified && lastNotified.getTime() >= nextAt.getTime()) {
      continue
    }

    triggered.push(dispatchAlertNotification(alert, store.preferences))
    alert.lastNotifiedAt = nowIso
    alert.updatedAt = nowIso
    hasStoreUpdates = true
  }

  if (hasStoreUpdates) {
    await writeNotificationStore(store)
  }

  return { triggered }
}
