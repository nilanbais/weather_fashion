/**
 * weatherApi.js
 * ------------------------------------------------------------------
 * Alle communicatie met de buitenwereld staat in dit bestand.
 *
 * We gebruiken Open-Meteo (https://open-meteo.com): gratis, geen account
 * of API-sleutel nodig. Wil je een andere weerdienst gebruiken? Dan hoef
 * je alleen dit bestand aan te passen, zolang fetchForecast() hetzelfde
 * soort object teruggeeft.
 */

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'
const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search'

/**
 * Haal het actuele weer + de uurverwachting voor vandaag op.
 *
 * @param {{latitude: number, longitude: number}} location
 * @param {AbortSignal} [signal]  om het verzoek af te breken (zie useWeather)
 * @returns {Promise<object>} JSON met de velden `current` en `hourly`
 */
export async function fetchForecast({ latitude, longitude }, signal) {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: [
      'temperature_2m',
      'apparent_temperature', // gevoelstemperatuur
      'precipitation',
      'weather_code',
      'wind_speed_10m',
      'is_day',
    ].join(','),
    hourly: [
      'temperature_2m',
      'apparent_temperature',
      'precipitation_probability',
      'precipitation',
      'weather_code',
      'wind_speed_10m',
      'is_day',
    ].join(','),
    wind_speed_unit: 'kmh',
    timezone: 'auto', // tijden in de lokale tijdzone van de locatie
    forecast_days: '1', // alleen vandaag
  })

  const response = await fetch(`${FORECAST_URL}?${params}`, { signal })
  if (!response.ok) {
    throw new Error(`Weerdata ophalen mislukt (HTTP ${response.status})`)
  }
  return response.json()
}

/**
 * Zoek plaatsen op naam (bv. "Utrecht").
 *
 * @param {string} query
 * @returns {Promise<{name: string, latitude: number, longitude: number, country: string, admin1?: string}[]>}
 */
export async function searchPlaces(query) {
  const params = new URLSearchParams({
    name: query,
    count: '5',
    language: 'nl',
    format: 'json',
  })

  const response = await fetch(`${GEOCODING_URL}?${params}`)
  if (!response.ok) {
    throw new Error(`Plaats zoeken mislukt (HTTP ${response.status})`)
  }
  const data = await response.json()
  return data.results ?? []
}
