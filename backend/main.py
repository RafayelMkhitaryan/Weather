from datetime import datetime, timezone

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Weather API - Open-Meteo")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search"
WEATHER_URL = "https://api.open-meteo.com/v1/forecast"

# WMO weather code -> (English description, icon key)
WMO_CODES = {
    0: ("Clear sky", "Clear"),
    1: ("Mainly clear", "Clear"),
    2: ("Partly cloudy", "Clouds"),
    3: ("Overcast", "Clouds"),
    45: ("Fog", "Mist"),
    48: ("Rime fog", "Mist"),
    51: ("Light drizzle", "Drizzle"),
    53: ("Drizzle", "Drizzle"),
    55: ("Heavy drizzle", "Drizzle"),
    61: ("Light rain", "Rain"),
    63: ("Rain", "Rain"),
    65: ("Heavy rain", "Rain"),
    71: ("Light snow", "Snow"),
    73: ("Snow", "Snow"),
    75: ("Heavy snow", "Snow"),
    77: ("Snow grains", "Snow"),
    80: ("Rain showers", "Rain"),
    81: ("Heavy rain showers", "Rain"),
    82: ("Violent rain showers", "Rain"),
    85: ("Snow showers", "Snow"),
    86: ("Heavy snow showers", "Snow"),
    95: ("Thunderstorm", "Thunderstorm"),
    96: ("Thunderstorm with hail", "Thunderstorm"),
    99: ("Severe thunderstorm with hail", "Thunderstorm"),
}

# WMO code -> weather icon key
WMO_ICON = {
    0: "01d",
    1: "01d",
    2: "02d",
    3: "03d",
    45: "50d",
    48: "50d",
    51: "09d",
    53: "09d",
    55: "09d",
    61: "10d",
    63: "10d",
    65: "10d",
    71: "13d",
    73: "13d",
    75: "13d",
    77: "13d",
    80: "09d",
    81: "09d",
    82: "09d",
    85: "13d",
    86: "13d",
    95: "11d",
    96: "11d",
    99: "11d",
}


async def geocode_city(city: str, client: httpx.AsyncClient):
    resp = await client.get(
        GEOCODE_URL,
        params={"name": city, "count": 1, "language": "en"},
    )
    data = resp.json()
    results = data.get("results")
    if not results:
        raise HTTPException(status_code=404, detail="City not found")

    result = results[0]
    return {
        "name": result.get("name", city),
        "country": result.get("country_code", ""),
        "lat": result["latitude"],
        "lon": result["longitude"],
        "timezone": result.get("timezone", "auto"),
    }


@app.get("/weather/current")
async def get_current_weather(city: str):
    async with httpx.AsyncClient(timeout=10) as client:
        geo = await geocode_city(city, client)

        resp = await client.get(
            WEATHER_URL,
            params={
                "latitude": geo["lat"],
                "longitude": geo["lon"],
                "current": [
                    "temperature_2m",
                    "apparent_temperature",
                    "relative_humidity_2m",
                    "wind_speed_10m",
                    "surface_pressure",
                    "visibility",
                    "weather_code",
                ],
                "wind_speed_unit": "ms",
                "timezone": geo["timezone"],
            },
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail="Weather API error")
        data = resp.json()

    current = data["current"]
    wmo = current.get("weather_code", 0)
    description, weather_main = WMO_CODES.get(wmo, ("Unknown", "Clear"))
    icon = WMO_ICON.get(wmo, "01d")

    hour = datetime.now(timezone.utc).hour
    if hour < 6 or hour >= 20:
        icon = icon.replace("d", "n")

    visibility_m = current.get("visibility", 0)
    visibility_km = round(visibility_m / 1000, 1) if visibility_m else 0

    return {
        "city": geo["name"],
        "country": geo["country"],
        "temp": round(current["temperature_2m"]),
        "feels_like": round(current["apparent_temperature"]),
        "humidity": round(current["relative_humidity_2m"]),
        "wind_speed": round(current["wind_speed_10m"]),
        "description": description,
        "icon": icon,
        "weather_main": weather_main,
        "visibility": visibility_km,
        "pressure": round(current["surface_pressure"]),
    }


@app.get("/weather/forecast")
async def get_forecast(city: str):
    async with httpx.AsyncClient(timeout=10) as client:
        geo = await geocode_city(city, client)

        resp = await client.get(
            WEATHER_URL,
            params={
                "latitude": geo["lat"],
                "longitude": geo["lon"],
                "daily": [
                    "temperature_2m_max",
                    "temperature_2m_min",
                    "weather_code",
                ],
                "forecast_days": 5,
                "timezone": geo["timezone"],
            },
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail="Weather API error")
        data = resp.json()

    daily = data["daily"]
    forecast = []
    for index, date in enumerate(daily["time"]):
        wmo = daily["weather_code"][index]
        description, weather_main = WMO_CODES.get(wmo, ("Unknown", "Clear"))
        icon = WMO_ICON.get(wmo, "01d")
        forecast.append(
            {
                "date": date,
                "temp_max": round(daily["temperature_2m_max"][index]),
                "temp_min": round(daily["temperature_2m_min"][index]),
                "description": description,
                "icon": icon,
                "weather_main": weather_main,
            }
        )

    return {"forecast": forecast}


@app.get("/health")
async def health():
    return {"status": "ok"}
