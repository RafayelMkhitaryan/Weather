import React, { useState, useEffect, useCallback } from "react";
import "./App.css";

const WEATHER_GRADIENTS = {
  Clear: "linear-gradient(135deg, #1a1a4e 0%, #16213e 40%, #0f3460 70%, #533483 100%)",
  Clouds: "linear-gradient(135deg, #1c1c2e 0%, #2d2d44 40%, #3a3a5c 70%, #4a4a6a 100%)",
  Rain: "linear-gradient(135deg, #0d1b2a 0%, #1b2838 40%, #1e3a5f 70%, #243b55 100%)",
  Drizzle: "linear-gradient(135deg, #0d1b2a 0%, #1b2838 40%, #1e3a5f 70%, #243b55 100%)",
  Thunderstorm: "linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 40%, #16213e 70%, #2d1b4e 100%)",
  Snow: "linear-gradient(135deg, #1a2a4a 0%, #1e3a5f 40%, #2d4a6e 70%, #3a5a80 100%)",
  Mist: "linear-gradient(135deg, #1a1a2e 0%, #2a2a42 40%, #333355 70%, #3d3d66 100%)",
  default: "linear-gradient(135deg, #1a1a4e 0%, #16213e 40%, #0f3460 70%, #533483 100%)",
};

const WEATHER_ICONS = {
  "01d": "☀️", "01n": "🌙",
  "02d": "⛅", "02n": "☁️",
  "03d": "☁️", "03n": "☁️",
  "04d": "☁️", "04n": "☁️",
  "09d": "🌧️", "09n": "🌧️",
  "10d": "🌦️", "10n": "🌧️",
  "11d": "⛈️", "11n": "⛈️",
  "13d": "❄️", "13n": "❄️",
  "50d": "🌫️", "50n": "🌫️",
};

const DAYS_RU = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const MONTHS_RU = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return `${DAYS_RU[d.getDay()]}, ${d.getDate()} ${MONTHS_RU[d.getMonth()]}`;
}

function StatCard({ icon, label, value }) {
  return (
    <div className="stat-card">
      <span className="stat-icon">{icon}</span>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  );
}

function ForecastCard({ day }) {
  const emoji = WEATHER_ICONS[day.icon] || "🌤️";
  return (
    <div className="forecast-card">
      <span className="forecast-day">{formatDate(day.date)}</span>
      <span className="forecast-icon">{emoji}</span>
      <span className="forecast-desc">{day.description}</span>
      <div className="forecast-temps">
        <span className="temp-max">{day.temp_max}°</span>
        <span className="temp-min">{day.temp_min}°</span>
      </div>
    </div>
  );
}

export default function App() {
  const [city, setCity] = useState("Москва");
  const [input, setInput] = useState("");
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchWeather = useCallback(async (cityName) => {
    setLoading(true);
    setError("");
    try {
      const [wRes, fRes] = await Promise.all([
        fetch(`/weather/current?city=${encodeURIComponent(cityName)}`),
        fetch(`/weather/forecast?city=${encodeURIComponent(cityName)}`),
      ]);
      if (!wRes.ok) {
        const err = await wRes.json();
        throw new Error(err.detail || "Город не найден");
      }
      const wData = await wRes.json();
      const fData = await fRes.json();
      setWeather(wData);
      setForecast(fData.forecast || []);
    } catch (e) {
      setError(e.message);
      setWeather(null);
      setForecast([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeather(city);
  }, [city, fetchWeather]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (input.trim()) {
      setCity(input.trim());
      setInput("");
    }
  };

  const gradient =
    weather ? (WEATHER_GRADIENTS[weather.weather_main] || WEATHER_GRADIENTS.default)
    : WEATHER_GRADIENTS.default;

  const emoji = weather ? (WEATHER_ICONS[weather.icon] || "🌤️") : "🌤️";

  const padTime = (n) => String(n).padStart(2, "0");
  const timeStr = `${padTime(time.getHours())}:${padTime(time.getMinutes())}:${padTime(time.getSeconds())}`;
  const dateStr = `${DAYS_RU[time.getDay()]}, ${time.getDate()} ${MONTHS_RU[time.getMonth()]} ${time.getFullYear()}`;

  return (
    <div className="app" style={{ background: gradient }}>
      {/* Ambient blobs */}
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />

      <div className="container">
        {/* Search */}
        <form className="search-form" onSubmit={handleSearch}>
          <input
            className="search-input"
            type="text"
            placeholder="Введите город..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button className="search-btn" type="submit">🔍</button>
        </form>

        {/* Clock */}
        <div className="clock-bar">
          <span className="clock-time">{timeStr}</span>
          <span className="clock-date">{dateStr}</span>
        </div>

        {loading && (
          <div className="glass-card center">
            <div className="spinner" />
            <p className="loading-text">Загружаем погоду...</p>
          </div>
        )}

        {error && !loading && (
          <div className="glass-card center error-card">
            <span className="error-icon">⚠️</span>
            <p className="error-text">{error}</p>
          </div>
        )}

        {weather && !loading && (
          <>
            {/* Main weather card */}
            <div className="glass-card main-card">
              <div className="main-top">
                <div className="city-info">
                  <h1 className="city-name">{weather.city}</h1>
                  <span className="country">{weather.country}</span>
                </div>
                <div className="main-emoji">{emoji}</div>
              </div>

              <div className="temp-row">
                <span className="temp-big">{weather.temp}°</span>
                <div className="temp-meta">
                  <span className="feels-like">Ощущается как {weather.feels_like}°</span>
                  <span className="description">{weather.description}</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="stats-grid">
              <StatCard icon="💧" label="Влажность" value={`${weather.humidity}%`} />
              <StatCard icon="💨" label="Ветер" value={`${weather.wind_speed} м/с`} />
              <StatCard icon="👁️" label="Видимость" value={`${weather.visibility} км`} />
              <StatCard icon="📊" label="Давление" value={`${weather.pressure} гПа`} />
            </div>

            {/* Forecast */}
            {forecast.length > 0 && (
              <div className="glass-card forecast-section">
                <h2 className="section-title">Прогноз на 5 дней</h2>
                <div className="forecast-list">
                  {forecast.map((day) => (
                    <ForecastCard key={day.date} day={day} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}