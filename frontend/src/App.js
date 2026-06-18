import React, { useCallback, useEffect, useState } from "react";
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
  "01d": "☀️",
  "01n": "🌙",
  "02d": "⛅",
  "02n": "☁️",
  "03d": "☁️",
  "03n": "☁️",
  "04d": "☁️",
  "04n": "☁️",
  "09d": "🌧️",
  "09n": "🌧️",
  "10d": "🌦️",
  "10n": "🌧️",
  "11d": "⛈️",
  "11n": "⛈️",
  "13d": "❄️",
  "13n": "❄️",
  "50d": "🌫️",
  "50n": "🌫️",
};

const DATE_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

function parseForecastDate(dateStr) {
  return new Date(`${dateStr}T12:00:00`);
}

function formatDate(dateStr) {
  return DATE_FORMATTER.format(parseForecastDate(dateStr));
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
  const [city, setCity] = useState("Moscow");
  const [input, setInput] = useState("");
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchWeather = useCallback(async (cityName) => {
    setLoading(true);
    setError("");

    try {
      const [weatherResponse, forecastResponse] = await Promise.all([
        fetch(`/weather/current?city=${encodeURIComponent(cityName)}`),
        fetch(`/weather/forecast?city=${encodeURIComponent(cityName)}`),
      ]);

      if (!weatherResponse.ok) {
        const err = await weatherResponse.json();
        throw new Error(err.detail || "City not found");
      }

      if (!forecastResponse.ok) {
        const err = await forecastResponse.json();
        throw new Error(err.detail || "Forecast unavailable");
      }

      const weatherData = await weatherResponse.json();
      const forecastData = await forecastResponse.json();

      setWeather(weatherData);
      setForecast(forecastData.forecast || []);
    } catch (err) {
      setError(err.message);
      setWeather(null);
      setForecast([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeather(city);
  }, [city, fetchWeather]);

  const handleSearch = (event) => {
    event.preventDefault();
    if (input.trim()) {
      setCity(input.trim());
      setInput("");
    }
  };

  const gradient = weather
    ? WEATHER_GRADIENTS[weather.weather_main] || WEATHER_GRADIENTS.default
    : WEATHER_GRADIENTS.default;
  const emoji = weather ? WEATHER_ICONS[weather.icon] || "🌤️" : "🌤️";

  const padTime = (value) => String(value).padStart(2, "0");
  const timeStr = `${padTime(time.getHours())}:${padTime(time.getMinutes())}:${padTime(time.getSeconds())}`;
  const dateStr = `${DATE_FORMATTER.format(time)} ${time.getFullYear()}`;

  return (
    <div className="app" style={{ background: gradient }}>
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />

      <div className="container">
        <form className="search-form" onSubmit={handleSearch}>
          <input
            className="search-input"
            type="text"
            placeholder="Enter a city..."
            value={input}
            onChange={(event) => setInput(event.target.value)}
          />
          <button className="search-btn" type="submit">
            🔍
          </button>
        </form>

        <div className="clock-bar">
          <span className="clock-time">{timeStr}</span>
          <span className="clock-date">{dateStr}</span>
        </div>

        {loading && (
          <div className="glass-card center">
            <div className="spinner" />
            <p className="loading-text">Loading weather...</p>
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
                  <span className="feels-like">Feels like {weather.feels_like}°</span>
                  <span className="description">{weather.description}</span>
                </div>
              </div>
            </div>

            <div className="stats-grid">
              <StatCard icon="💧" label="Humidity" value={`${weather.humidity}%`} />
              <StatCard icon="💨" label="Wind" value={`${weather.wind_speed} m/s`} />
              <StatCard icon="👁️" label="Visibility" value={`${weather.visibility} km`} />
              <StatCard icon="📊" label="Pressure" value={`${weather.pressure} hPa`} />
            </div>

            {forecast.length > 0 && (
              <div className="glass-card forecast-section">
                <h2 className="section-title">5-Day Forecast</h2>
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
