import { useEffect, useState } from 'react'
import { formatCurrentDateTime } from './dateUtils'

function Navbar({ currentPage, onNavigate, theme, onToggleTheme }) {
  const navItems = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'forecast', label: 'Forecast', icon: '⛅' },
    { id: 'map', label: 'Maps', icon: '✚' },
    { id: 'about', label: 'About', icon: 'ⓘ' },
  ]
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <nav className="topbar" aria-label="Main navigation">
      <div className="brand-wrap">
        <span className="brand-icon" aria-hidden="true">☼</span>
        <span className="brand-name">SkyCast</span>
      </div>

      <div className="nav-menu">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={currentPage === item.id ? 'active' : ''}
            onClick={() => onNavigate(item.id)}
            aria-current={currentPage === item.id ? 'page' : undefined}
          >
            <span className="nav-icon" aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      <div className="topbar-meta">
        <button
          type="button"
          className="theme-icon"
          aria-label="Toggle theme"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <span className="time">{formatCurrentDateTime(now)}</span>
      </div>
    </nav>
  )
}

export default Navbar