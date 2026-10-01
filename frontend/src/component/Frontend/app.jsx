import { useEffect, useState } from 'react'
import './App.css'
import Navbar from './navbar'
import SearchBar from './searchbar'
import WeatherCard from './Weathercard'
import { buildForecastData } from './dateUtils'

const weatherCodeMap = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Freezing drizzle',
  57: 'Heavy freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Rain showers',
  81: 'Heavy rain showers',
  82: 'Violent rain showers',
  85: 'Snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with hail',
  99: 'Heavy thunderstorm with hail',
}

function getWeatherDescription(code, isDay = 1) {
  const description = weatherCodeMap[code] ?? 'Partly cloudy'
  return isDay === 0 ? `${description} tonight` : description
}

function App() {
  const [city, setCity] = useState('Accra')
  const [mapQuery, setMapQuery] = useState('Accra, Ghana')
  const [currentPage, setCurrentPage] = useState('home')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [weather, setWeather] = useState(null)
  const [forecastData, setForecastData] = useState(buildForecastData(new Date()))
  const [isLoading, setIsLoading] = useState(false)
  const [theme, setTheme] = useState('dark')

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentDate(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    void fetchWeatherForCity('Accra')
  }, [])

  async function fetchWeatherForCity(locationName) {
    const cleanedCity = (locationName || '').trim() || 'Accra'
    setIsLoading(true)

    try {
      const geocodeResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cleanedCity)}&count=1&language=en&format=json`,
      )

      if (!geocodeResponse.ok) {
        throw new Error('Could not find that location.')
      }

      const geocodeData = await geocodeResponse.json()
      const location = geocodeData.results?.[0]

      if (!location) {
        throw new Error('No matching city or town was found. Try another location.')
      }

      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&hourly=temperature_2m,precipitation_probability,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto&forecast_days=7`,
      )

      if (!weatherResponse.ok) {
        throw new Error('The weather service is unavailable right now.')
      }

      const weatherData = await weatherResponse.json()
      const currentWeather = weatherData.current

      if (!currentWeather) {
        throw new Error('Weather data is not available for that location yet.')
      }

      const locationLabel = [location.name, location.country].filter(Boolean).join(', ')
      const normalizedWeather = {
        name: locationLabel,
        main: {
          temp: Math.round(currentWeather.temperature_2m),
          humidity: currentWeather.relative_humidity_2m ?? 0,
          feels_like: Math.round(currentWeather.apparent_temperature),
          pressure: 1012,
        },
        weather: [{ description: getWeatherDescription(currentWeather.weather_code, currentWeather.is_day) }],
        wind: { speed: Number(currentWeather.wind_speed_10m ?? 0) },
        visibility: 10000,
        sys: {
          sunrise: weatherData.daily?.sunrise?.[0] ?? '06:00',
          sunset: weatherData.daily?.sunset?.[0] ?? '18:00',
        },
        timezone: weatherData.timezone ?? 'UTC',
      }

      const normalizedForecast = {
        timezone: weatherData.timezone ?? 'UTC',
        daily: {
          time: weatherData.daily?.time ?? [],
          weather_code: weatherData.daily?.weather_code ?? [],
          temperature_2m_max: weatherData.daily?.temperature_2m_max ?? [],
          temperature_2m_min: weatherData.daily?.temperature_2m_min ?? [],
          sunrise: weatherData.daily?.sunrise ?? [],
          sunset: weatherData.daily?.sunset ?? [],
        },
        hourly: {
          time: weatherData.hourly?.time ?? [],
          temperature_2m: weatherData.hourly?.temperature_2m ?? [],
          weather_code: weatherData.hourly?.weather_code ?? [],
          precipitation_probability: weatherData.hourly?.precipitation_probability ?? [],
        },
      }

      setCity(locationLabel)
      setMapQuery(locationLabel)
      setWeather(normalizedWeather)
      setForecastData(normalizedForecast)
    } catch (error) {
      setWeather(null)
      setForecastData(buildForecastData(currentDate))
      setCity(cleanedCity)
      setMapQuery(cleanedCity)
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  function handleSearch(nextCity, preferredPage = 'home') {
    const cleanedCity = (nextCity || '').trim() || 'Accra'
    setCurrentPage((current) => {
      if (preferredPage === 'forecast' || current === 'forecast') {
        return 'forecast'
      }
      return 'home'
    })
    setCity(cleanedCity)
    setMapQuery(cleanedCity)
    void fetchWeatherForCity(cleanedCity)
  }

  const defaultWeather = {
    name: city,
    main: {
      temp: 29,
      humidity: 78,
      feels_like: 32,
      pressure: 1012,
    },
    weather: [{ description: 'Partly Cloudy' }],
    wind: { speed: 12 },
    visibility: 10000,
    sys: { sunrise: '5:52 AM', sunset: '6:19 PM' },
    timezone: 0,
  }

  const activeWeather = weather ?? defaultWeather
  const activeForecast = forecastData

  function renderTodayPage() {
    return (
      <>
        <div className="hero-icon" aria-hidden="true">☀️</div>
        <h1>
          <span>Weather</span> in {city}
        </h1>
        <p className="subtitle">Plan your day with the weather that matters most.</p>

        <SearchBar onSearch={handleSearch} isLoading={isLoading} />

        <WeatherCard
          view="home"
          weather={activeWeather}
          forecast={activeForecast}
          currentDate={currentDate}
        />
      </>
    )
  }

  function renderForecastPage() {
    const [forecastSearch, setForecastSearch] = useState('')

    function handleForecastSubmit(event) {
      event.preventDefault()
      const trimmed = forecastSearch.trim()
      if (trimmed) {
        handleSearch(trimmed, 'forecast')
        setForecastSearch('')
      }
    }

    return (
      <div className="page-panel">
        <h1>Forecast for {city}</h1>
        <p className="subtitle">See the next few days at a glance.</p>

        <form className="forecast-search" onSubmit={handleForecastSubmit}>
          <label className="visually-hidden" htmlFor="forecast-search-input">Search forecast location</label>
          <input
            id="forecast-search-input"
            type="text"
            value={forecastSearch}
            onChange={(event) => setForecastSearch(event.target.value)}
            placeholder="Search a city or town..."
          />
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </form>

        <WeatherCard
          view="forecast"
          weather={activeWeather}
          forecast={activeForecast}
          currentDate={currentDate}
        />
        <div className="forecast-location-label">Showing weather for {city}</div>
      </div>
    )
  }

  function renderMapPage() {
    const encodedQuery = encodeURIComponent((mapQuery || 'Accra, Ghana').trim() || 'Accra, Ghana')
    const mapsUrl = `https://www.google.com/maps?q=${encodedQuery}&z=11&output=embed`

    function handleMapSubmit(event) {
      event.preventDefault()
      setMapQuery((currentValue) => (currentValue || '').trim() || 'Accra, Ghana')
    }

    return (
      <div className="page-panel map-page">
        <h1>Map</h1>
        <p className="subtitle">Regional weather coverage and local conditions.</p>

        <form className="map-search" onSubmit={handleMapSubmit}>
          <label className="visually-hidden" htmlFor="map-search-input">Search map location</label>
          <input
            id="map-search-input"
            type="text"
            value={mapQuery}
            onChange={(event) => setMapQuery(event.target.value)}
            placeholder="Search a city or location..."
          />
          <button type="submit">Search</button>
        </form>

        <div className="map-card">
          <iframe
            title="Google map of selected location"
            src={mapsUrl}
            className="google-map"
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    )
  }

  function renderAboutPage() {
    const features = [
      {
        title: 'Fast local insight',
        text: 'Check current conditions and upcoming weather in seconds with a clear, distraction-free layout.',
        icon: '⚡',
      },
      {
        title: 'Search by city',
        text: 'Look up towns and cities to instantly compare conditions and plan your next outing or commute.',
        icon: '📍',
      },
      {
        title: 'Clean decision making',
        text: 'Use the hourly and daily outlook to understand when rain, sunshine, or comfort conditions are likely.',
        icon: '🌤️',
      },
    ]

    return (
      <div className="page-panel about-page">
        <h1>About</h1>
        <p className="subtitle">SkyCast helps you stay ahead of the weather.</p>

        <div className="about-hero">
          <div className="about-hero-copy">
            <span className="eyebrow">Weather made simple</span>
            <h2>Smart forecasts for real life.</h2>
            <p>
              SkyCast brings together daily forecasts, local conditions, and practical weather guidance so you can plan your day with confidence.
            </p>
          </div>
          <div className="about-hero-badge" aria-label="SkyCast features">
            <span>🌦️</span>
            <strong>Today</strong>
            <small>Forecast ready</small>
          </div>
        </div>

        <div className="about-card">
          <div className="about-grid">
            {features.map((feature) => (
              <article className="feature-panel" key={feature.title}>
                <div className="feature-icon" aria-hidden="true">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const pageContent = {
    home: renderTodayPage(),
    forecast: renderForecastPage(),
    map: renderMapPage(),
    about: renderAboutPage(),
  }

  return (
    <div className={`app-shell ${theme === 'light' ? 'theme-light' : ''}`}>
      <Navbar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        theme={theme}
        onToggleTheme={() => setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'))}
      />
      <main className="app">{pageContent[currentPage]}</main>
    </div>
  )
}

export default App