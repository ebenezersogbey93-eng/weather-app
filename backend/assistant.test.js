import test from 'node:test'
import assert from 'node:assert/strict'

import { buildWeatherAssistantReply } from './assistant.js'

test('buildWeatherAssistantReply uses forecast context and answers clearly', () => {
  const context = {
    city: 'Accra',
    current: { temp: 30, description: 'Partly cloudy', feels_like: 32 },
    forecast: {
      hourly: {
        time: ['2026-09-30T18:00', '2026-09-30T19:00'],
        precipitation_probability: [25, 10],
        temperature_2m: [30, 29],
      },
      daily: {
        time: ['2026-09-30', '2026-10-01'],
        weather_code: [1, 2],
      },
    },
  }

  const answer = buildWeatherAssistantReply('Should I play football this evening?', context)

  assert.match(answer, /Accra|football|evening|rain|weather/i)
  assert.ok(answer.length > 20)
})
