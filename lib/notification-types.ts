import { z } from "zod"

export const reminderOptions = [
  "Aucun",
  "1 heure avant",
  "24 heures avant",
  "1 semaine avant",
] as const

export const cadenceOptions = ["Temps réel", "Quotidien", "Hebdomadaire", "Mensuel"] as const

export type ReminderOption = (typeof reminderOptions)[number]
export type CadenceOption = (typeof cadenceOptions)[number]

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/
const isoDateTimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/

export const notificationPreferencesSchema = z.object({
  email: z.boolean(),
  push: z.boolean(),
})

export const taskSchema = z.object({
  id: z.string().min(1).max(100),
  title: z.string().trim().min(1).max(160),
  dueDate: z.string().regex(isoDateRegex).or(z.literal("")),
  reminder: z.enum(reminderOptions),
  notes: z.string().max(2000),
  channelEmail: z.boolean().optional(),
  channelPush: z.boolean().optional(),
  completed: z.boolean(),
  createdAt: z.string().regex(isoDateTimeRegex),
  updatedAt: z.string().regex(isoDateTimeRegex),
  lastNotifiedAt: z.string().regex(isoDateTimeRegex).nullable().optional(),
})

export const alertSchema = z.object({
  id: z.string().min(1).max(100),
  title: z.string().trim().min(1).max(160),
  metric: z.string().trim().min(1).max(120),
  threshold: z.string().trim().min(1).max(120),
  cadence: z.enum(cadenceOptions),
  channelEmail: z.boolean().optional(),
  channelPush: z.boolean().optional(),
  createdAt: z.string().regex(isoDateTimeRegex),
  updatedAt: z.string().regex(isoDateTimeRegex),
  lastNotifiedAt: z.string().regex(isoDateTimeRegex).nullable().optional(),
})

export const taskCreateSchema = taskSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    channelEmail: z.boolean().optional(),
    channelPush: z.boolean().optional(),
    lastNotifiedAt: z.string().regex(isoDateTimeRegex).nullable().optional(),
  })

export const taskUpdateSchema = taskCreateSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "Task update payload cannot be empty." }
)

export const alertCreateSchema = alertSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    channelEmail: z.boolean().optional(),
    channelPush: z.boolean().optional(),
    lastNotifiedAt: z.string().regex(isoDateTimeRegex).nullable().optional(),
  })

export const alertUpdateSchema = alertCreateSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "Alert update payload cannot be empty." }
)

export const notificationStoreSchema = z.object({
  tasks: z.array(taskSchema),
  alerts: z.array(alertSchema),
  preferences: notificationPreferencesSchema,
})

export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>
export type TaskItem = z.infer<typeof taskSchema>
export type AlertItem = z.infer<typeof alertSchema>
export type NotificationStore = z.infer<typeof notificationStoreSchema>

export type TaskCreateInput = z.infer<typeof taskCreateSchema>
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>
export type AlertCreateInput = z.infer<typeof alertCreateSchema>
export type AlertUpdateInput = z.infer<typeof alertUpdateSchema>

export const defaultNotificationPreferences: NotificationPreferences = {
  email: true,
  push: true,
}
