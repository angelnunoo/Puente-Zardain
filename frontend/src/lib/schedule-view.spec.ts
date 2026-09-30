import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildScheduleWindowPayload,
  formatScheduleDateTime,
  formatScheduleTime,
  readAdminSchedule,
} from './schedule-view.ts'

describe('schedule view helpers', () => {
  it('formats a JSON close time instead of calling Date methods on the string', () => {
    const iso = '2026-09-30T18:30:00.000Z'
    assert.throws(() => (iso as unknown as Date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }))
    const formatted = formatScheduleTime(iso)
    assert.match(formatted, /\d{2}:\d{2}/)
    assert.notEqual(formatted, '')
  })

  it('formats a JSON next opening as a date-time string', () => {
    const formatted = formatScheduleDateTime('2026-10-01T10:00:00.000Z')
    assert.notEqual(formatted, '2026-10-01T10:00:00.000Z')
    assert.match(formatted, /2026/)
  })

  it('reads the admin schedule payload returned by the API', () => {
    const parsed = readAdminSchedule({
      regular: [{ id: 'w1', dayOfWeek: 1, openTime: '12:00', closeTime: '16:00', active: true }],
      special: [{ id: 's1', date: '2026-12-25', isClosed: true }],
      currentStatus: { open: false },
    })
    assert.equal(parsed.windows.length, 1)
    assert.equal(parsed.specials.length, 1)
    assert.equal((parsed.windows[0] as { id: string }).id, 'w1')
  })

  it('keeps a window active when the form omits the flag', () => {
    const payload = buildScheduleWindowPayload({
      dayOfWeek: 1,
      shift: 1,
      openTime: '12:00',
      closeTime: '16:00',
      note: 'Comida',
    })
    assert.equal(payload.active, true)
    assert.equal(payload.dayOfWeek, 1)
  })
})
