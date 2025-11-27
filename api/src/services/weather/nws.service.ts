Here is a simplified example of how you might implement this in TypeScript. This example uses the `pg-promise` library for PostgreSQL, `axios` for HTTP requests, `node-cache` for caching, and `dotenv` for environment variables.

```typescript
import axios from 'axios';
import * as pgPromise from 'pg-promise';
import NodeCache from 'node-cache';
import * as dotenv from 'dotenv';

dotenv.config();

const pgp = pgPromise();
const db = pgp(process.env.DATABASE_URL);
const myCache = new NodeCache({ stdTTL: 300, checkperiod: 120 });

interface WeatherResponse {
  lat: number;
  lng: number;
  conditions: string;
  forecast: string[];
  alerts: string[];
}

const rateLimit = async () => {
  return new Promise(resolve => setTimeout(resolve, 1000));
}

const getWeather = async (lat: number, lng: number): Promise<WeatherResponse> => {
  try {
    const cacheKey = `weather_${lat}_${lng}`;
    const cachedResponse = myCache.get<WeatherResponse>(cacheKey);

    if (cachedResponse) {
      return cachedResponse;
    }

    await rateLimit();

    const response = await axios.get(`https://api.weather.gov/points/${lat},${lng}`);
    const conditions = response.data.properties.forecast;
    const forecast = response.data.properties.forecastHourly;
    const alerts = response.data.properties.forecastGridData;

    const weatherResponse: WeatherResponse = {
      lat,
      lng,
      conditions,
      forecast,
      alerts,
    };

    myCache.set(cacheKey, weatherResponse);

    return weatherResponse;
  } catch (error) {
    console.error(error);
    throw new Error('Failed to fetch weather');
  }
};

const saveWeatherToDb = async (weather: WeatherResponse) => {
  try {
    await db.none('INSERT INTO weather(lat, lng, conditions, forecast, alerts) VALUES($1, $2, $3, $4, $5)', [weather.lat, weather.lng, weather.conditions, weather.forecast, weather.alerts]);
  } catch (error) {
    console.error(error);
    throw new Error('Failed to save weather to database');
  }
};

const fetchAndSaveWeather = async (lat: number, lng: number) => {
  try {
    const weather = await getWeather(lat, lng);
    await saveWeatherToDb(weather);
  } catch (error) {
    console.error(error);
    throw new Error('Failed to fetch and save weather');
  }
};

fetchAndSaveWeather(28.5383, -81.3792);
```

This is a simplified example and doesn't include all the error handling and retry logic you might want in a production application. You would also want to add more specific types for the weather data and possibly split this into multiple functions or classes for better organization and testability.