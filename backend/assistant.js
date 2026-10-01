export function buildWeatherAssistantReply(question = '', context = {}) {
  const prompt = String(question || '').trim()
  const city = context.city || context.location || 'your area'
  const current = context.current || {}
  const forecast = context.forecast || {}
  const hourly = forecast.hourly || {}
  const daily = forecast.daily || {}

  const temperature = typeof current.temp === 'number' ? current.temp : null
  const description = current.description || 'pleasant conditions'
  const feelsLike = typeof current.feels_like === 'number' ? current.feels_like : null

  const hourlyTimes = Array.isArray(hourly.time) ? hourly.time : []
  const rainProbabilities = Array.isArray(hourly.precipitation_probability) ? hourly.precipitation_probability : []
  const temperatures = Array.isArray(hourly.temperature_2m) ? hourly.temperature_2m : []
  const nextRain = (() => {
    for (let index = 0; index < rainProbabilities.length; index += 1) {
      const value = Number(rainProbabilities[index])
      if (Number.isFinite(value)) return value
    }
    return null
  })()
  const hasWeatherContext = Boolean(city && (temperature !== null || hourlyTimes.length || daily.time?.length))

  if (!hasWeatherContext && !prompt) {
    return 'I can help with your weather plans. Search for a city or ask about rain, temperature, or outdoor activities.'
  }

  if (!hasWeatherContext) {
    return 'I can help with that. Try searching for a town or city first so I can give weather-specific advice based on the local forecast.'
  }

  const nextRainText = nextRain == null ? 'No rain is expected in the next few hours.' : `Rain chance is about ${nextRain}% in the next few hours.`
  const activityHint = /football|soccer|tennis|basketball|running|hike|walk|cycling|golf|beach|swim|outdoor/.test(prompt.toLowerCase())
    ? 'This looks suitable for outdoor plans.'
    : 'It should be a comfortable day overall.'

  const weatherSummary = `${city} is currently ${temperature != null ? `${Math.round(temperature)}°C` : 'in a steady range'} with ${description}.`
  const feelsLikeText = feelsLike != null ? ` It feels like ${Math.round(feelsLike)}°C.` : ''
  const recommendation = activityHint

  const sportsAdvice = /football|soccer|tennis|basketball|running|hike|walk|cycling|golf|beach|swim|outdoor/.test(prompt.toLowerCase())
    ? ` For outdoor activity, ${nextRain != null && nextRain >= 50 ? 'I would keep a light rain plan or bring a jacket.' : 'it looks good for outdoor activity, especially if you keep hydration in mind.'}`
    : ''

  return `${weatherSummary}${feelsLikeText} ${nextRainText} ${recommendation}${sportsAdvice} If you want, I can help you plan around the next few hours in ${city}.`
}
