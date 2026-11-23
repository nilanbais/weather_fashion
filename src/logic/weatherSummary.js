/**
 * weatherSummary.js
 * ------------------------------------------------------------------
 * Zet ruwe weerdata (van de API óf van handmatige invoer) om naar één
 * eenvoudig object `conditions` waar de kledingregels mee werken:
 *
 *   {
 *     temperature,      // luchttemperatuur (koudste moment) °C
 *     feelsLike,        // gevoelstemperatuur (koudste moment) °C
 *     feelsLikeMax,     // gevoelstemperatuur (warmste moment) °C
 *     temperatureMax,   // luchttemperatuur (warmste moment) °C
 *     windSpeed,        // km/u (hoogste waarde)
 *     rainChance,       // % (hoogste waarde)
 *     precipitation,    // mm (totaal)
 *     weatherCode,      // WMO-weercode (ernstigste)
 *     sunny, snow,      // booleans
 *     description,      // tekst, bv. "Lichte regen"
 *     label,            // tekst, bv. "Nu" of "08:00 – 18:00"
 *   }
 *
 * Waarom het KOUDSTE moment? Het doel is dat je het niet koud krijgt.
 * Het warmste moment gebruiken we voor de "laagjes"-tip.
 */
import { windChill } from './thermalComfort.js'

/**
 * Nederlandse omschrijving per WMO-weercode.
 * Bron: https://open-meteo.com/en/docs (sectie "WMO Weather interpretation codes")
 */
export const WEATHER_CODES = {
  0: { text: 'Onbewolkt', icon: '☀️' },
  1: { text: 'Overwegend helder', icon: '🌤️' },
  2: { text: 'Half bewolkt', icon: '⛅' },
  3: { text: 'Bewolkt', icon: '☁️' },
  45: { text: 'Mist', icon: '🌫️' },
  48: { text: 'Rijpmist', icon: '🌫️' },
  51: { text: 'Lichte motregen', icon: '🌦️' },
  53: { text: 'Motregen', icon: '🌦️' },
  55: { text: 'Dichte motregen', icon: '🌧️' },
  56: { text: 'Lichte ijzel', icon: '🧊' },
  57: { text: 'IJzel', icon: '🧊' },
  61: { text: 'Lichte regen', icon: '🌦️' },
  63: { text: 'Regen', icon: '🌧️' },
  65: { text: 'Zware regen', icon: '🌧️' },
  66: { text: 'Lichte ijzelregen', icon: '🧊' },
  67: { text: 'IJzelregen', icon: '🧊' },
  71: { text: 'Lichte sneeuw', icon: '🌨️' },
  73: { text: 'Sneeuw', icon: '🌨️' },
  75: { text: 'Zware sneeuw', icon: '❄️' },
  77: { text: 'Korrelsneeuw', icon: '🌨️' },
  80: { text: 'Lichte buien', icon: '🌦️' },
  81: { text: 'Buien', icon: '🌧️' },
  82: { text: 'Zware buien', icon: '⛈️' },
  85: { text: 'Sneeuwbuien', icon: '🌨️' },
  86: { text: 'Zware sneeuwbuien', icon: '❄️' },
  95: { text: 'Onweer', icon: '⛈️' },
  96: { text: 'Onweer met hagel', icon: '⛈️' },
  99: { text: 'Zwaar onweer met hagel', icon: '⛈️' },
}

const SNOW_CODES = new Set([71, 73, 75, 77, 85, 86])

/** Omschrijving + icoon bij een weercode (met fallback). */
export function describeWeatherCode(code) {
  return WEATHER_CODES[code] ?? { text: 'Onbekend', icon: '❔' }
}

/** Uur (0-23) uit een tijdstring zoals "2026-11-23T14:00". */
function hourOf(isoTime) {
  return Number(isoTime.slice(11, 13))
}

const pad = (n) => String(n).padStart(2, '0')

/**
 * Samenvatting van het weer op dit moment.
 * @param {object} forecast  antwoord van fetchForecast()
 */
export function summarizeNow(forecast) {
  const now = forecast.current
  // Neerslagkans zit niet in `current`, dus pakken we die van het huidige uur.
  const hourIndex = forecast.hourly.time.findIndex((t) => hourOf(t) === hourOf(now.time))
  const rainChance = hourIndex >= 0 ? forecast.hourly.precipitation_probability[hourIndex] : 0

  return {
    label: 'Nu',
    temperature: now.temperature_2m,
    temperatureMax: now.temperature_2m,
    feelsLike: now.apparent_temperature,
    feelsLikeMax: now.apparent_temperature,
    windSpeed: now.wind_speed_10m,
    rainChance: rainChance ?? 0,
    precipitation: now.precipitation,
    weatherCode: now.weather_code,
    sunny: now.is_day === 1 && now.weather_code <= 1,
    snow: SNOW_CODES.has(now.weather_code),
    description: describeWeatherCode(now.weather_code).text,
  }
}

/**
 * Samenvatting over een tijdvak van de dag (bv. 8:00 tot 18:00).
 * @param {object} forecast
 * @param {number} fromHour  begin-uur (inclusief)
 * @param {number} toHour    eind-uur (inclusief)
 */
export function summarizeDay(forecast, fromHour, toHour) {
  const h = forecast.hourly
  const [start, end] = fromHour <= toHour ? [fromHour, toHour] : [toHour, fromHour]

  // Indexen van de uren die binnen het gekozen tijdvak vallen.
  const idx = h.time
    .map((t, i) => ({ hour: hourOf(t), i }))
    .filter(({ hour }) => hour >= start && hour <= end)
    .map(({ i }) => i)

  if (idx.length === 0) return summarizeNow(forecast)

  const pick = (key) => idx.map((i) => h[key][i] ?? 0)
  const codes = pick('weather_code')
  const worstCode = Math.max(...codes)
  const sunnyHours = idx.filter((i) => h.is_day[i] === 1 && h.weather_code[i] <= 1).length

  return {
    label: `${pad(start)}:00 – ${pad(end)}:00`,
    temperature: Math.min(...pick('temperature_2m')),
    temperatureMax: Math.max(...pick('temperature_2m')),
    feelsLike: Math.min(...pick('apparent_temperature')),
    feelsLikeMax: Math.max(...pick('apparent_temperature')),
    windSpeed: Math.max(...pick('wind_speed_10m')),
    rainChance: Math.max(...pick('precipitation_probability')),
    precipitation: pick('precipitation').reduce((a, b) => a + b, 0),
    weatherCode: worstCode,
    // "Zonnig" als minstens de helft van de uren helder is.
    sunny: sunnyHours >= idx.length / 2,
    snow: codes.some((code) => SNOW_CODES.has(code)),
    description: describeWeatherCode(worstCode).text,
  }
}

/**
 * Samenvatting op basis van handmatige invoer door de gebruiker.
 * De gevoelstemperatuur berekenen we zelf met de wind-chill-formule.
 * @param {{temperature: number, windSpeed: number, rainChance: number, sunny: boolean}} manual
 */
export function summarizeManual(manual) {
  const temperature = Number(manual.temperature) || 0
  const windSpeed = Number(manual.windSpeed) || 0
  const rainChance = Number(manual.rainChance) || 0
  const feelsLike = windChill(temperature, windSpeed)
  const snow = temperature <= 1 && rainChance >= 50

  let weatherCode = manual.sunny ? 0 : 3
  if (rainChance >= 50) weatherCode = snow ? 73 : 63

  return {
    label: 'Handmatig ingevoerd',
    temperature,
    temperatureMax: temperature,
    feelsLike,
    feelsLikeMax: feelsLike,
    windSpeed,
    rainChance,
    precipitation: 0,
    weatherCode,
    sunny: Boolean(manual.sunny),
    snow,
    description: describeWeatherCode(weatherCode).text,
  }
}

/**
 * Kies de juiste samenvatting op basis van de instellingen van de gebruiker.
 * @param {object|null} forecast  null als er (nog) geen API-data is
 * @param {object} settings       zie DEFAULT_WEATHER_SETTINGS in App.jsx
 * @returns {object|null}
 */
export function summarizeWeather(forecast, settings) {
  if (settings.manual.enabled) return summarizeManual(settings.manual)
  if (!forecast) return null
  if (settings.mode === 'day') return summarizeDay(forecast, settings.fromHour, settings.toHour)
  return summarizeNow(forecast)
}
