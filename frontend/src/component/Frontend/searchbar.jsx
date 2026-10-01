import { useState } from 'react'

function SearchBar({ onSearch, isLoading }) {
  const [city, setCity] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    const trimmedCity = city.trim()

    if (trimmedCity) {
      onSearch(trimmedCity)
    }
  }

  return (
    <form className="search-box" onSubmit={handleSubmit}>
      <div className="search-input-wrap">
        <span className="input-icon">🔎</span>
        <input
          type="text"
          placeholder="Search a city, town or village..."
          aria-label="Search a city, town or village"
          value={city}
          onChange={(event) => setCity(event.target.value)}
        />
      </div>

      <button type="submit" disabled={isLoading}>
        <span className="search-btn-icon">🔎</span>
        {isLoading ? 'Searching...' : 'Search'}
      </button>
    </form>
  )
}

export default SearchBar