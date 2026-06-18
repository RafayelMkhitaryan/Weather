# 🌤️ Weather App

Красивое приложение погоды — FastAPI бэкенд + React фронтенд с glassmorphism дизайном.

---

## 📁 Структура

```
weather/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── public/index.html
    ├── src/
    │   ├── App.js
    │   ├── App.css
    │   └── index.js
    └── package.json
```

---

## 🚀 Установка и запуск

### 1. Получи API ключ
Зарегистрируйся на [openweathermap.org](https://openweathermap.org/api) и получи бесплатный ключ.

### 2. Бэкенд (FastAPI)

```bash
cd backend

# Создай виртуальное окружение
python -m venv venv
source venv/bin/activate       # Linux/Mac
venv\Scripts\activate          # Windows

# Установи зависимости
pip install -r requirements.txt

# Создай .env файл
cp .env.example .env
# Открой .env и вставь твой ключ:
# OPENWEATHER_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Запусти сервер
uvicorn main:app --reload --port 8000
```

Бэкенд запустится на: http://localhost:8000
Документация API: http://localhost:8000/docs

### 3. Фронтенд (React)

```bash
cd frontend

# Установи зависимости
npm install

# Запусти
npm start
```

Фронтенд откроется на: http://localhost:3000

---

## 🔌 API Endpoints

| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/weather/current?city=Москва` | Текущая погода |
| GET | `/weather/forecast?city=Москва` | Прогноз на 5 дней |
| GET | `/health` | Проверка работы сервера |

---

## ✨ Функции

- 🌡️ Текущая температура и ощущаемая
- 💧 Влажность, ветер, видимость, давление
- 📅 Прогноз на 5 дней
- 🎨 Фон меняется в зависимости от погоды
- 🕐 Часы в реальном времени
- 🔍 Поиск любого города мира