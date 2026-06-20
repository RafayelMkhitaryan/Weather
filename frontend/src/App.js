import React, { useCallback, useEffect, useState } from "react";
import "./App.css";
import WeatherMap from "./weather_map";

const WEATHER_TINTS = {
  Clear:
    "linear-gradient(140deg, rgba(8, 18, 39, 0.18) 0%, rgba(15, 54, 104, 0.24) 55%, rgba(255, 184, 77, 0.1) 100%)",
  Clouds:
    "linear-gradient(140deg, rgba(9, 15, 28, 0.28) 0%, rgba(22, 38, 67, 0.24) 55%, rgba(80, 118, 170, 0.16) 100%)",
  Rain: "linear-gradient(140deg, rgba(3, 11, 24, 0.42) 0%, rgba(10, 28, 54, 0.34) 55%, rgba(26, 92, 160, 0.18) 100%)",
  Drizzle:
    "linear-gradient(140deg, rgba(3, 11, 24, 0.4) 0%, rgba(10, 28, 54, 0.32) 55%, rgba(26, 92, 160, 0.16) 100%)",
  Thunderstorm:
    "linear-gradient(140deg, rgba(4, 5, 17, 0.52) 0%, rgba(19, 24, 51, 0.38) 55%, rgba(89, 66, 160, 0.18) 100%)",
  Snow: "linear-gradient(140deg, rgba(9, 18, 33, 0.26) 0%, rgba(22, 44, 78, 0.22) 55%, rgba(179, 218, 255, 0.16) 100%)",
  Mist: "linear-gradient(140deg, rgba(9, 15, 28, 0.38) 0%, rgba(22, 38, 67, 0.3) 55%, rgba(110, 127, 161, 0.16) 100%)",
  default:
    "linear-gradient(140deg, rgba(8, 18, 39, 0.24) 0%, rgba(15, 54, 104, 0.26) 55%, rgba(255, 184, 77, 0.1) 100%)",
};

const WEATHER_ICONS = {
  "01d": "\u2600\uFE0F",
  "01n": "\uD83C\uDF19",
  "02d": "\u26C5",
  "02n": "\u2601\uFE0F",
  "03d": "\u2601\uFE0F",
  "03n": "\u2601\uFE0F",
  "04d": "\u2601\uFE0F",
  "04n": "\u2601\uFE0F",
  "09d": "\uD83C\uDF27\uFE0F",
  "09n": "\uD83C\uDF27\uFE0F",
  "10d": "\uD83C\uDF26\uFE0F",
  "10n": "\uD83C\uDF27\uFE0F",
  "11d": "\u26C8\uFE0F",
  "11n": "\u26C8\uFE0F",
  "13d": "\u2744\uFE0F",
  "13n": "\u2744\uFE0F",
  "50d": "\uD83C\uDF2B\uFE0F",
  "50n": "\uD83C\uDF2B\uFE0F",
};

const UI_ICONS = {
  fallbackWeather: "\uD83C\uDF24\uFE0F",
  search: "\uD83D\uDD0D",
  warning: "\u26A0\uFE0F",
  humidity: "\uD83D\uDCA7",
  wind: "\uD83D\uDCA8",
  visibility: "\uD83D\uDC41\uFE0F",
  pressure: "\uD83D\uDCCA",
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
  const emoji = WEATHER_ICONS[day.icon] || UI_ICONS.fallbackWeather;

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
  const [leafletReady, setLeafletReady] = useState(false);

  // Load Leaflet dynamically
  useEffect(() => {
    if (window.L) { setLeafletReady(true); return; }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => setLeafletReady(true);
    document.head.appendChild(script);
  }, []);

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

  const handleMapCityChange = useCallback((newCity) => {
    setCity(newCity);
  }, []);

  const weatherTint = weather
    ? WEATHER_TINTS[weather.weather_main] || WEATHER_TINTS.default
    : WEATHER_TINTS.default;
  const emoji = weather
    ? WEATHER_ICONS[weather.icon] || UI_ICONS.fallbackWeather
    : UI_ICONS.fallbackWeather;

  const padTime = (value) => String(value).padStart(2, "0");
  const timeStr = `${padTime(time.getHours())}:${padTime(time.getMinutes())}:${padTime(time.getSeconds())}`;
  const dateStr = `${DATE_FORMATTER.format(time)} ${time.getFullYear()}`;

  return (
<>

    <div className="app" style={{ "--weather-tint": weatherTint }}>
       <video
              width="200px"
              height="200px"
              loop
              muted
              playsInline
              autoPlay
              id="myVideo"
              poster="https://static-assets.mapbox.com/www/video/custom%20Earth%203.2%20first%20frame_00000.png"
            >
              <source
                src="https://static-assets.mapbox.com/www/video/custom%20Earth%203.2%20converted.mp4"
                type="video/mp4"
              />
              Your browser does not support the video tag.
            </video>
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
          <button className="search-btn" type="submit" aria-label="Search city">
            {UI_ICONS.search}
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
            <span className="error-icon">{UI_ICONS.warning}</span>
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
                  <span className="feels-like">
                    Feels like {weather.feels_like}°
                  </span>
                  <span className="description">{weather.description}</span>
                </div>
              </div>
            </div>

            <div className="stats-grid">
              <StatCard
                icon={UI_ICONS.humidity}
                label="Humidity"
                value={`${weather.humidity}%`}
              />
              <StatCard
                icon={UI_ICONS.wind}
                label="Wind"
                value={`${weather.wind_speed} m/s`}
              />
              <StatCard
                icon={UI_ICONS.visibility}
                label="Visibility"
                value={`${weather.visibility} km`}
              />
              <StatCard
                icon={UI_ICONS.pressure}
                label="Pressure"
                value={`${weather.pressure} hPa`}
              />
            </div>

            {/* Map */}
            {leafletReady && (
              <WeatherMap weather={weather} onCityChange={handleMapCityChange} />
            )}

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
  </>
  );
}