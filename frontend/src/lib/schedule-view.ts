export type ScheduleInstant = string | Date | null | undefined

export function toScheduleDate(value: ScheduleInstant): Date | null {
  if (value == null || value === '') return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatScheduleDateTime(value: ScheduleInstant): string {
  const date = toScheduleDate(value)
  if (!date) return ''
  return date.toLocaleString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatScheduleTime(value: ScheduleInstant): string {
  const date = toScheduleDate(value)
  if (!date) return ''
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function readAdminSchedule(payload: unknown): { windows: unknown[]; specials: unknown[] } {
  if (!payload || typeof payload !== 'object') {
    return { windows: [], specials: [] }
  }

  const data = payload as {
    regular?: unknown
    windows?: unknown
    special?: unknown
    specials?: unknown
  }

  return {
    windows: Array.isArray(data.regular) ? data.regular : Array.isArray(data.windows) ? data.windows : [],
    specials: Array.isArray(data.special) ? data.special : Array.isArray(data.specials) ? data.specials : [],
  }
}

export function buildScheduleWindowPayload(input: {
  dayOfWeek: number
  shift: number
  openTime: string
  closeTime: string
  note?: string
  active?: boolean
}) {
  return {
    dayOfWeek: input.dayOfWeek,
    shift: input.shift,
    openTime: input.openTime,
    closeTime: input.closeTime,
    note: input.note ?? '',
    active: input.active ?? true,
  }
}
