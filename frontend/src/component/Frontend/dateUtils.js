const pad = (value) => String(value).padStart(2, '0')

export function formatCurrentDateTime(date = new Date(), timeZone) {
  const targetTimeZone = timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC'
  const dateParts = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: targetTimeZone,
  }).formatToParts(date)

  const weekday = dateParts.find((part) => part.type === 'weekday')?.value ?? 'Mon'
  const month = dateParts.find((part) => part.type === 'month')?.value ?? 'Jan'
  const day = dateParts.find((part) => part.type === 'day')?.value ?? '1'
  const year = dateParts.find((part) => part.type === 'year')?.value ?? '2026'

  const timeParts = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: targetTimeZone,
  }).formatToParts(date)

  const hour = timeParts.find((part) => part.type === 'hour')?.value ?? '12'
  const minute = timeParts.find((part) => part.type === 'minute')?.value ?? '00'
  const dayPeriod = timeParts.find((part) => part.type === 'dayPeriod')?.value ?? 'AM'

  return `${weekday}, ${month} ${day}, ${year}, ${hour}:${minute} ${dayPeriod}`
}

export function formatDateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function formatHourKey(date) {
  return `${formatDateKey(date)}T${pad(date.getHours())}:00`
}

export function buildForecastData(baseDate = new Date(), timeZone) {
  const targetTimeZone = timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC'
  const startDate = new Date(baseDate)
  startDate.setMinutes(0, 0, 0)

  const daily = {
    time: [],
    weather_code: [],
    temperature_2m_max: [],
    temperature_2m_min: [],
  }

  const hourly = {
    time: [],
    temperature_2m: [],
    weather_code: [],
    precipitation_probability: [],
  }

  for (let index = 0; index < 7; index += 1) {
    const day = new Date(startDate)
    day.setDate(startDate.getDate() + index)

    daily.time.push(formatDateKey(day))
    daily.weather_code.push(index % 5)
    daily.temperature_2m_max.push(26 + ((index * 2) % 6))
    daily.temperature_2m_min.push(18 + ((index + 1) % 5))
  }

  for (let index = 0; index < 7; index += 1) {
    const hour = new Date(startDate)
    hour.setHours(startDate.getHours() + index * 3)

    hourly.time.push(formatHourKey(hour))
    hourly.temperature_2m.push(21 + ((index * 4) % 9))
    hourly.weather_code.push(index % 4)
    hourly.precipitation_probability.push(10 + (index * 7))
  }

  return {
    timezone: targetTimeZone,
    daily,
    hourly,
  }
}
