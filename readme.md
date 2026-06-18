# Weather App

A weather application with a FastAPI backend and a React frontend. It uses Open-Meteo for geocoding and forecast data and displays the results in a glassmorphism-style UI.

## Structure

```text
weather/
|-- backend/
|   |-- main.py
|   `-- requirements.txt
`-- frontend/
    |-- public/index.html
    |-- src/
    |   |-- App.css
    |   |-- App.js
    |   `-- index.js
    |-- package.json
    `-- package-lock.json
```

## Setup

This project uses Open-Meteo. No API key or `.env` file is required.

### Backend

```bash
cd backend

python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Backend: http://localhost:8000
API docs: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
npm start
```

Frontend: http://localhost:3000

## API Endpoints

| Method | URL | Description |
| --- | --- | --- |
| GET | `/weather/current?city=Moscow` | Current weather |
| GET | `/weather/forecast?city=Moscow` | 5-day forecast |
| GET | `/health` | Health check |

## Features

- Current temperature and feels-like temperature
- Humidity, wind, visibility, and pressure
- 5-day forecast
- Weather-based dynamic background
- Live clock
- City search
