import { useState } from 'react'

function getForecastIcon(weatherCode) {
  if (weatherCode === 0) return '☀️'
  if (weatherCode <= 3) return '🌤️'
  if (weatherCode <= 48) return '☁️'
  if (weatherCode <= 67 || weatherCode >= 80 && weatherCode <= 82) return '🌧️'
  if (weatherCode <= 77) return '🌨️'
  if (weatherCode <= 99) return '⛈️'
  return '🌤️'
}

function getForecastDescription(weatherCode) {
  if (weatherCode === 0) return 'Clear sky'
  if (weatherCode <= 3) return 'Partly cloudy'
  if (weatherCode <= 48) return 'Cloudy'
  if (weatherCode <= 67) return 'Rain'
  if (weatherCode <= 77) return 'Snow'
  if (weatherCode <= 82) return 'Rain showers'
  return 'Thunderstorm'
}

function formatLocalTime(time, includeMinutes = true) {
  const match = time.match(/T(\d{2}):(\d{2})/)

  if (!match) return time

  return new Date(Date.UTC(2000, 0, 1, Number(match[1]), Number(match[2])))
    .toLocaleTimeString('en-US', {
      hour: 'numeric',
      ...(includeMinutes ? { minute: '2-digit' } : {}),
      timeZone: 'UTC',
    })
}

function formatForecastDay(date) {
  const [year, month, day] = date.split('-').map(Number)

  return new Date(Date.UTC(year, month - 1, day, 12))
    .toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' })
}

function formatHour(time) {
  return formatLocalTime(time, false)
}

function getUpcomingHourIndices(hourly, currentDate, timezone, count) {
  const labels = hourly?.time ?? []
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(currentDate)
  const part = (type) => parts.find((item) => item.type === type)?.value
  const currentHour = `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:00`
  let startIndex = labels.findIndex((time) => time >= currentHour)

  if (startIndex < 0) return []
  if (labels[startIndex] === currentHour && currentDate.getMinutes() > 0) startIndex += 1

  return Array.from({ length: count }, (_, index) => startIndex + index)
    .filter((index) => index < labels.length)
}

function TemperatureChart({ hourly, currentDate, timezone }) {
  const indices = getUpcomingHourIndices(hourly, currentDate, timezone, 8)
  const temperatures = indices.map((index) => hourly.temperature_2m[index])
  const labels = indices.map((index) => hourly.time[index])

  if (!temperatures.length) return null

  const width = 640
  const height = 180
  const padding = 20
  const minimum = Math.floor(Math.min(...temperatures) - 1)
  const maximum = Math.ceil(Math.max(...temperatures) + 1)
  const range = maximum - minimum || 1
  const points = temperatures.map((temperature, index) => {
    const x = padding + (index * (width - padding * 2)) / (temperatures.length - 1)
    const y = height - padding - ((temperature - minimum) / range) * (height - padding * 2)
    return `${x},${y}`
  }).join(' ')

  return (
    <section className="insight-card temperature-chart-card">
      <div className="insight-heading">
        <div>
          <p className="eyebrow">Next 8 hours</p>
          <h3>Temperature trend</h3>
        </div>
        <span className="chart-unit">°C</span>
      </div>
      <svg className="temperature-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Temperature trend for the next eight hours">
        <defs>
          <linearGradient id="temperature-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line className="chart-gridline" x1="20" x2="620" y1="50" y2="50" />
        <line className="chart-gridline" x1="20" x2="620" y1="100" y2="100" />
        <line className="chart-gridline" x1="20" x2="620" y1="150" y2="150" />
        <polygon points={`20,160 ${points} 620,160`} fill="url(#temperature-fill)" />
        <polyline className="temperature-line" points={points} />
        {temperatures.map((temperature, index) => {
          const [x, y] = points.split(' ')[index].split(',')
          return <circle className="temperature-dot" cx={x} cy={y} r="4" key={`${temperature}-${index}`} />
        })}
      </svg>
      <div className="chart-labels">
        {labels.map((label) => <span key={label}>{formatHour(label)}</span>)}
      </div>
    </section>
  )
}

function HourlyForecast({ hourly, currentDate, timezone }) {
  const indices = getUpcomingHourIndices(hourly, currentDate, timezone, 5)

  if (!indices.length) return null

  return (
    <section className="insight-card hourly-forecast-card">
      <div className="insight-heading">
        <div>
          <p className="eyebrow">Hour by hour</p>
          <h3>Hourly forecast</h3>
        </div>
        <span className="chart-unit">°C</span>
      </div>
      <div className="hourly-forecast-list">
        {indices.map((index) => (
          <div className="hourly-forecast-item" key={hourly.time[index]}>
            <span className="hourly-forecast-time">{formatHour(hourly.time[index])}</span>
            <span className="hourly-forecast-icon" aria-label={getForecastDescription(hourly.weather_code?.[index] ?? 3)}>
              {getForecastIcon(hourly.weather_code?.[index] ?? 3)}
            </span>
            <strong>{Math.round(hourly.temperature_2m[index])}°</strong>
          </div>
        ))}
      </div>
    </section>
  )
}

function RainProbability({ hourly, currentDate, timezone }) {
  const [index] = getUpcomingHourIndices(hourly, currentDate, timezone, 1)
  const probability = hourly?.precipitation_probability?.[index]

  if (probability == null) return null

  return (
    <section className="insight-card rain-chart-card">
      <div className="insight-heading">
        <div>
          <p className="eyebrow">{formatHour(hourly.time[index])}</p>
          <h3>Chance of rain</h3>
        </div>
        <span className="chart-unit">Next hour</span>
      </div>
      <div className="rain-probability-row">
        <strong>{probability}%</strong>
        <div
          className="rain-probability-track"
          role="progressbar"
          aria-label="Chance of rain"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow={probability}
        >
          <span style={{ width: `${probability}%` }} />
        </div>
        <span className="rain-probability-icon" aria-hidden="true">🌧️</span>
      </div>
    </section>
  )
}

function AskSkyCast({ forecast, currentDate, timezone, weather }) {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState(null)
  const [assistantError, setAssistantError] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const hasForecast = Boolean(forecast?.hourly?.time?.length && forecast?.daily?.time?.length)
  const exampleQuestions = [
    'Can I play football this evening?',
    'Is tomorrow good for a beach trip?',
  ]

  async function askSkyCast(prompt) {
    if (!prompt) return

    setAnswer(null)
    setAssistantError('')
    setIsThinking(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          context: {
            city: weather?.name,
            current: {
              temp: weather?.main?.temp,
              feels_like: weather?.main?.feels_like,
              description: weather?.weather?.[0]?.description,
            },
            forecast,
            timezone,
          },
        }),
      })
      const responseText = await response.text()
      let result = {}

      if (responseText) {
        try {
          result = JSON.parse(responseText)
        } catch {
          throw new Error('The assistant server returned an unreadable response. Restart the SkyCast server and try again.')
        }
      }

      if (!response.ok) throw new Error(result.error || 'The assistant could not answer right now.')
      if (typeof result.answer !== 'string' || !result.answer.trim()) {
        throw new Error('The assistant server returned an empty answer. Please try again.')
      }

      setAnswer({ question: prompt, text: result.answer })
    } catch (requestError) {
      setAssistantError(requestError.message || 'The assistant could not answer right now.')
    } finally {
      setIsThinking(false)
    }
  }

  function askQuestion(event) {
    event.preventDefault()
    askSkyCast(question.trim())
  }

  function askExample(example) {
    setQuestion(example)
    askSkyCast(example)
  }

  return (
    <section className="insight-card ask-skycast-card" aria-labelledby="ask-skycast-title">
      <div className="insight-heading">
        <div>
          <p className="eyebrow">AI weather assistant</p>
          <h3 id="ask-skycast-title">Ask SkyCast</h3>
        </div>
        <span className="assistant-status">
          {isThinking ? 'Thinking...' : hasForecast ? 'Forecast loaded' : 'General questions ready'}
        </span>
      </div>
      <form className="assistant-form" onSubmit={askQuestion}>
        <label className="visually-hidden" htmlFor="skycast-question">Ask about your plans and the weather</label>
        <input
          id="skycast-question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask anything; search a place for local weather advice..."
          disabled={isThinking}
        />
        <button type="submit" disabled={isThinking || !question.trim()}>
          {isThinking ? 'Thinking...' : 'Ask'}
        </button>
      </form>
      <div className="assistant-prompts" aria-label="Example questions">
        {exampleQuestions.map((example) => (
          <button type="button" key={example} disabled={isThinking} onClick={() => askExample(example)}>
            {example}
          </button>
        ))}
      </div>
      {assistantError && <p className="assistant-error" role="alert">{assistantError}</p>}
      {answer && (
        <div className="assistant-answer" role="status" aria-live="polite">
          <span className="assistant-answer-icon" aria-hidden="true">{answer.question.toLowerCase().includes('football') ? '⚽' : '🌦️'}</span>
          <div>
            <p>{answer.text}</p>
          </div>
        </div>
      )}
      {!hasForecast && <p className="assistant-empty">You can ask general questions now. Search for a town or city to add local forecast details to weather answers.</p>}
    </section>
  )
}

function SolarTimeline({ daily, currentDate, timezone, timezoneOffset = 0 }) {
  const sunrise = daily?.sunrise?.[0]
  const sunset = daily?.sunset?.[0]

  if (!sunrise || !sunset) return null

  const getMinutes = (time) => {
    const match = time.match(/T(\d{2}):(\d{2})/)
    return match ? Number(match[1]) * 60 + Number(match[2]) : null
  }
  const sunriseMinutes = getMinutes(sunrise)
  const sunsetMinutes = getMinutes(sunset)
  if (sunriseMinutes == null || sunsetMinutes == null || sunsetMinutes <= sunriseMinutes) return null

  const localTimeParts = timezone
    ? new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: 'numeric',
      hourCycle: 'h23',
    }).formatToParts(currentDate)
    : null
  const currentMinutes = localTimeParts
    ? Number(localTimeParts.find((part) => part.type === 'hour')?.value) * 60
      + Number(localTimeParts.find((part) => part.type === 'minute')?.value)
    : Math.floor(((currentDate.getTime() / 1000 + timezoneOffset) % 86400) / 60)
  const daylightDuration = sunsetMinutes - sunriseMinutes
  const daylightHours = Math.floor(daylightDuration / 60)
  const daylightRemainder = daylightDuration % 60
  const daylightProgress = Math.min(
    100,
    Math.max(0, ((currentMinutes - sunriseMinutes) / daylightDuration) * 100),
  )
  const isDaylight = currentMinutes >= sunriseMinutes && currentMinutes < sunsetMinutes

  return (
    <section className="insight-card solar-card">
      <div className="insight-heading">
        <div>
          <p className="eyebrow">Today</p>
          <h3>Sunlight</h3>
        </div>
        <span className="chart-unit">
          {daylightHours}h {daylightRemainder}m daylight
        </span>
      </div>
      <div className="solar-track-wrap" aria-label={isDaylight ? 'Daylight in progress' : 'Nighttime'}>
        <div className="solar-track" role="img" aria-label={`${Math.round(daylightProgress)}% of today's daylight elapsed`}>
          <span className="solar-progress" style={{ width: `${daylightProgress}%` }} aria-hidden="true" />
          <span className="solar-marker" style={{ left: `${daylightProgress}%` }} aria-hidden="true" />
        </div>
        <div className="solar-labels">
          <span>🌅 {formatLocalTime(sunrise)}</span>
          <span>🌇 {formatLocalTime(sunset)}</span>
        </div>
      </div>
    </section>
  )
}

function WeatherCard({
  view = 'home',
  currentDate = new Date(),
  locationDate: sharedLocationDate,
  displayTimezone: sharedDisplayTimezone,
  forecast,
  weather = {
    name: 'Accra, Ghana',
    main: {
      temp: 29,
      humidity: 78,
      feels_like: 32,
      pressure: 1012,
    },
    weather: [{ description: 'Partly Cloudy' }],
    wind: { speed: 12 },
    visibility: 10,
    sys: { sunrise: '5:52 AM', sunset: '6:19 PM' },
  },
}) {
  const cityName = weather?.name ?? 'Accra, Ghana'
  const temperature = weather?.main?.temp ?? 29
  const description = weather?.weather?.[0]?.description ?? 'Partly Cloudy'
  const humidity = weather?.main?.humidity ?? 78
  const windSpeed = weather?.wind?.speed != null
    ? weather.wind.speed * 3.6
    : 12
  const feelsLike = weather?.main?.feels_like ?? 32
  const pressure = weather?.main?.pressure ?? 1012
  const visibility = weather?.visibility != null
    ? weather.visibility / 1000
    : 10
  const windDirection = (windSpeed > 20 ? 'Strong wind' : windSpeed > 10 ? 'Moderate' : 'Light breeze')
  const comfortIndex = Math.min(10, Math.max(1, Math.round((temperature + feelsLike + (100 - humidity)) / 20)))
  const sunriseTime = weather?.sys?.sunrise ?? '06:00'
  const sunsetTime = weather?.sys?.sunset ?? '18:00'
  const currentTimestamp = Math.floor(currentDate.getTime() / 1000)
  const timezoneOffset = Number.isFinite(Number(weather?.timezone)) ? Number(weather?.timezone) : 0
  const displayTimezone = sharedDisplayTimezone !== undefined
    ? sharedDisplayTimezone
    : typeof weather?.timezone === 'string' && weather.timezone
      ? weather.timezone
      : typeof forecast?.timezone === 'string' && forecast.timezone
        ? forecast.timezone
        : undefined
  const locationDate = sharedLocationDate ?? new Date(currentDate)
  const currentMoment = new Date(currentDate)
  const liveTimeString = displayTimezone
    ? currentMoment.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: displayTimezone,
    })
    : currentMoment.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  const liveDateString = displayTimezone
    ? currentMoment.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: displayTimezone,
    })
    : currentMoment.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  const localHour = displayTimezone
    ? Number(new Intl.DateTimeFormat('en-US', {
      timeZone: displayTimezone,
      hour: 'numeric',
      hourCycle: 'h23',
    }).format(locationDate))
    : Number(locationDate.toLocaleTimeString('en-US', { hour: 'numeric', hour12: false }))
  const sunriseTimestamp = Number(weather?.sys?.sunrise)
  const sunsetTimestamp = Number(weather?.sys?.sunset)
  const isNight = Number.isFinite(sunriseTimestamp) && Number.isFinite(sunsetTimestamp)
    ? currentTimestamp < sunriseTimestamp || currentTimestamp > sunsetTimestamp
    : localHour < 6 || localHour >= 18
  const timeOfDay = isNight
    ? 'Night'
    : localHour >= 12 && localHour < 17
      ? 'Afternoon'
      : 'Day'

  return (
    <div className={`weather-dashboard${view === 'forecast' ? ' forecast-dashboard' : ''}`}>
      <div className="weather-main-panel">
        <div className="panel-header">
          <div className="location-line">
            <span className="location-pin">📍</span>
            <h2>{cityName}</h2>
          </div>
          <div className="location-time">
            <time className="local-clock" dateTime={currentMoment.toISOString()}>
              {liveTimeString}
            </time>
            <div className="date-label">{liveDateString}</div>
          </div>
          <div className="time-of-day">{timeOfDay}</div>
        </div>

        <div className="weather-summary-row">
          <span className="summary-chip">Comfort {comfortIndex}/10</span>
          <span className="summary-chip">{windDirection}</span>
          <span className="summary-chip">Sunrise {sunriseTime}</span>
        </div>

        <div className="temperature-row">
          <div className="temp-visual">
            <div className="weather-icon">☀️</div>
            <div className="temp-block">
              <div className="temp-value">{temperature}°C</div>
              <div className="weather-status">{description}</div>
              <div className="feels-like">Feels like {feelsLike}°C</div>
            </div>
          </div>
        </div>

        <div className="mini-metrics">
          <div className="mini-metric">
            <span>UV Index</span>
            <strong>{comfortIndex}</strong>
          </div>
          <div className="mini-metric">
            <span>Sunset</span>
            <strong>{sunsetTime}</strong>
          </div>
          <div className="mini-metric">
            <span>Visibility</span>
            <strong>{visibility.toFixed(1)} km</strong>
          </div>
        </div>
      </div>

      <aside className="weather-side-panel">
        <div className="detail-row">
          <span>💧</span>
          <div>
            <p>Humidity</p>
            <strong>{humidity}%</strong>
          </div>
        </div>

        <div className="detail-row">
          <span>💨</span>
          <div>
            <p>Wind Speed</p>
            <strong>{windSpeed.toFixed(1)} km/h</strong>
          </div>
        </div>

        <div className="detail-row">
          <span>◌</span>
          <div>
            <p>Pressure</p>
            <strong>{pressure} hPa</strong>
          </div>
        </div>

        <div className="detail-row">
          <span>◉</span>
          <div>
            <p>Visibility</p>
            <strong>{visibility.toFixed(1)} km</strong>
          </div>
        </div>

      </aside>

      <div className="forecast-bar">
        <div className="forecast-header">
          <div className="forecast-title">📅 7-Day Forecast</div>
          <span>{forecast ? 'Updated for this location' : 'Search for a location'}</span>
        </div>

        <div className="forecast-grid">
          {forecast?.daily?.time?.map((date, index) => (
            <div className={`forecast-item${index === 0 ? ' active' : ''}`} key={date}>
              <span>{index === 0 ? 'Today' : formatForecastDay(date)}</span>
              <div className="forecast-icon">{getForecastIcon(forecast.daily.weather_code[index])}</div>
              <strong>{Math.round(forecast.daily.temperature_2m_max[index])}° / {Math.round(forecast.daily.temperature_2m_min[index])}°</strong>
              <small>{getForecastDescription(forecast.daily.weather_code[index])}</small>
            </div>
          ))}
        </div>
      </div>

      <div className="insights-grid">
        <AskSkyCast
          forecast={forecast}
          currentDate={currentDate}
          timezone={displayTimezone}
          weather={weather}
        />
        <HourlyForecast
          hourly={forecast?.hourly}
          currentDate={currentDate}
          timezone={displayTimezone}
        />
        <TemperatureChart
          hourly={forecast?.hourly}
          currentDate={currentDate}
          timezone={displayTimezone}
        />
        <RainProbability
          hourly={forecast?.hourly}
          currentDate={currentDate}
          timezone={displayTimezone}
        />
        <SolarTimeline
          daily={forecast?.daily}
          currentDate={currentDate}
          timezone={forecast?.timezone}
          timezoneOffset={forecast?.utc_offset_seconds}
        />
      </div>
    </div>
  )
}

export default WeatherCard

