import React, { useCallback, useEffect, useRef } from "react";

const WMO_EMOJI = {
  Clear: "\u2600\uFE0F",
  Clouds: "\u2601\uFE0F",
  Rain: "\uD83C\uDF27\uFE0F",
  Drizzle: "\uD83C\uDF26\uFE0F",
  Thunderstorm: "\u26C8\uFE0F",
  Snow: "\u2744\uFE0F",
  Mist: "\uD83C\uDF2B\uFE0F",
};

function getLeaflet() {
  return window.L;
}

export default function WeatherMap({ weather, onCityChange }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const reverseGeocode = useCallback(async (lat, lon) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=en`
      );
      const data = await response.json();
      const address = data.address || {};

      return (
        address.city ||
        address.town ||
        address.village ||
        address.county ||
        address.state ||
        "Unknown"
      );
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const L = getLeaflet();
    if (mapInstanceRef.current || !L || !mapRef.current) {
      return undefined;
    }

    const map = L.map(mapRef.current, {
      center: [55.75, 37.62],
      zoom: 5,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: "&copy; OpenStreetMap &copy; CARTO",
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(map);

    map.on("click", async (event) => {
      const { lat, lng } = event.latlng;
      const cityName = await reverseGeocode(lat, lng);
      if (cityName) {
        onCityChange(cityName);
      }
    });

    mapInstanceRef.current = map;
    window.setTimeout(() => map.invalidateSize(), 0);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [onCityChange, reverseGeocode]);

  useEffect(() => {
    const L = getLeaflet();
    const map = mapInstanceRef.current;
    if (!map || !weather || !L) {
      return;
    }

    const lat = weather.latitude;
    const lon = weather.longitude;
    if (typeof lat !== "number" || typeof lon !== "number") {
      return;
    }

    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }

    const emoji = WMO_EMOJI[weather.weather_main] || "\uD83C\uDF24\uFE0F";
    const icon = L.divIcon({
      className: "",
      html: `
        <div class="map-marker">
          <div class="map-marker-bubble">
            <span class="map-marker-emoji">${emoji}</span>
            <span class="map-marker-temp">${weather.temp}&deg;</span>
          </div>
          <div class="map-marker-city">${weather.city}</div>
          <div class="map-marker-pin"></div>
        </div>
      `,
      iconAnchor: [50, 80],
      iconSize: [100, 80],
    });

    const marker = L.marker([lat, lon], { icon })
      .addTo(map)
      .bindPopup(
        `<div class="map-popup">
          <div class="popup-header">${emoji} ${weather.city}, ${weather.country}</div>
          <div class="popup-temp">${weather.temp}&deg;C</div>
          <div class="popup-desc">${weather.description}</div>
          <div class="popup-stats">
            <span>\uD83D\uDCA7 ${weather.humidity}%</span>
            <span>\uD83D\uDCA8 ${weather.wind_speed} m/s</span>
            <span>\uD83D\uDCCA ${weather.pressure} hPa</span>
          </div>
        </div>`,
        { className: "custom-popup" }
      )
      .openPopup();

    markerRef.current = marker;
    map.flyTo([lat, lon], 8, { duration: 1.2 });
  }, [weather]);

  return (
    <div className="glass-card map-section">
      <h2 className="section-title">Map</h2>
      <p className="map-hint">Click anywhere on the map to load weather for that place.</p>
      <div ref={mapRef} className="map-container" />
    </div>
  );
}
