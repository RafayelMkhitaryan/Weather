from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx
from datetime import datetime, timezone

app = FastAPI(title="Weather API — Open-Meteo")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search"
WEATHER_URL = "https://api.open-meteo.com/v1/forecast"

# WMO weather code → (description RU, icon key)
WMO_CODES = {
    0:  ("Ясно", "Clear"),
    1:  ("Преимущественно ясно", "Clear"),
    2:  ("Переменная облачность", "Clouds"),
    3:  ("Пасмурно", "Clouds"),
    45: ("Туман", "Mist"),
    48: ("Изморозь", "Mist"),
    51: ("Лёгкая морось", "Drizzle"),
    53: ("Морось", "Drizzle"),
    55: ("Сильная морось", "Drizzle"),
    61: ("Небольшой дождь", "Rain"),
    63: ("Дождь", "Rain"),
    65: ("Сильный дождь", "Rain"),
    71: ("Небольшой снег", "Snow"),
    73: ("Снег", "Snow"),
    75: ("Сильный снег", "Snow"),
    77: ("Снежные зёрна", "Snow"),
    80: ("Ливень", "Rain"),
    81: ("Сильный ливень", "Rain"),
    82: ("Очень сильный ливень", "Rain"),
    85: ("Снежный ливень", "Snow"),
    86: ("Сильный снежный ливень", "Snow"),
    95: ("Гроза", "Thunderstorm"),
    96: ("Гроза с градом", "Thunderstorm"),
    99: ("Гроза с сильным градом", "Thunderstorm"),
}

# WMO code → emoji icon
WMO_ICON = {
    0: "01d", 1: "01d", 2: "02d", 3: "03d",
    45: "50d", 48: "50d",
    51: "09d", 53: "09d", 55: "09d",
    61: "10d", 63: "10d", 65: "10d",
    71: "13d", 73: "13d", 75: "13d", 77: "13d",
    80: "09d", 81: "09d", 82: "09d",
    85: "13d", 86: "13d",
    95: "11d", 96: "11d", 99: "11d",
}


async def geocode_city(city: str, client: httpx.AsyncClient):
    resp = await client.get(GEOCODE_URL, params={"name": city, "count": 1, "language": "ru"})
    data = resp.json()
    results = data.get("results")
    if not results:
        raise HTTPException(status_code=404, detail="Город не найден")
    r = results[0]
    return {
        "name": r.get("name", city),
        "country": r.get("country_code", ""),
        "lat": r["latitude"],
        "lon": r["longitude"],
        "timezone": r.get("timezone", "auto"),
    }


@app.get("/weather/current")
async def get_current_weather(city: str):
    async with httpx.AsyncClient(timeout=10) as client:
        geo = await geocode_city(city, client)

        resp = await client.get(WEATHER_URL, params={
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
        })
        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail="Ошибка погодного API")
        data = resp.json()

    cur = data["current"]
    wmo = cur.get("weather_code", 0)
    desc, weather_main = WMO_CODES.get(wmo, ("Неизвестно", "Clear"))
    icon = WMO_ICON.get(wmo, "01d")

    # Determine day/night icon suffix
    hour = datetime.now(timezone.utc).hour
    if hour < 6 or hour >= 20:
        icon = icon.replace("d", "n")

    visibility_m = cur.get("visibility", 0)
    visibility_km = round(visibility_m / 1000, 1) if visibility_m else 0

    return {
        "city": geo["name"],
        "country": geo["country"],
        "temp": round(cur["temperature_2m"]),
        "feels_like": round(cur["apparent_temperature"]),
        "humidity": round(cur["relative_humidity_2m"]),
        "wind_speed": round(cur["wind_speed_10m"]),
        "description": desc,
        "icon": icon,
        "weather_main": weather_main,
        "visibility": visibility_km,
        "pressure": round(cur["surface_pressure"]),
    }


@app.get("/weather/forecast")
async def get_forecast(city: str):
    async with httpx.AsyncClient(timeout=10) as client:
        geo = await geocode_city(city, client)

        resp = await client.get(WEATHER_URL, params={
            "latitude": geo["lat"],
            "longitude": geo["lon"],
            "daily": [
                "temperature_2m_max",
                "temperature_2m_min",
                "weather_code",
            ],
            "forecast_days": 5,
            "timezone": geo["timezone"],
        })
        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail="Ошибка погодного API")
        data = resp.json()

    daily = data["daily"]
    forecast = []
    for i, date in enumerate(daily["time"]):
        wmo = daily["weather_code"][i]
        desc, weather_main = WMO_CODES.get(wmo, ("Неизвестно", "Clear"))
        icon = WMO_ICON.get(wmo, "01d")
        forecast.append({
            "date": date,
            "temp_max": round(daily["temperature_2m_max"][i]),
            "temp_min": round(daily["temperature_2m_min"][i]),
            "description": desc,
            "icon": icon,
            "weather_main": weather_main,
        })

    return {"forecast": forecast}


@app.get("/health")
async def health():
    return {"status": "ok"}