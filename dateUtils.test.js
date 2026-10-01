import test from 'node:test'
import assert from 'node:assert/strict'
import { buildForecastData, formatCurrentDateTime, formatDateKey } from './frontend/src/component/Frontend/dateUtils.js'

test('formatCurrentDateTime formats the current local date and time consistently', () => {
  const fixedDate = new Date('2026-09-30T18:35:15Z')

  const formatted = formatCurrentDateTime(fixedDate, 'UTC')

  assert.equal(formatted, 'Wed, Sep 30, 2026, 6:35 PM')
})

test('buildForecastData creates current dates for the next seven days', () => {
  const baseDate = new Date()
  const forecast = buildForecastData(baseDate)

  assert.equal(forecast.daily.time[0], formatDateKey(baseDate))
  assert.equal(forecast.daily.time.length, 7)
  assert.equal(forecast.hourly.time.length, 7)
  assert.ok(forecast.hourly.time[0].startsWith(forecast.daily.time[0]))
})
