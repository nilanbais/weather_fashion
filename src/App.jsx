/**
 * App.jsx — het "hoofdcomponent"
 * ------------------------------------------------------------------
 * Hier komt alles samen. De gegevensstroom is in één richting
 * (https://react.dev/learn/thinking-in-react):
 *
 *   state (profiel, locatie, weerinstellingen)
 *        │
 *        ▼
 *   useWeather() ──► forecast (ruwe API-data)
 *        │
 *        ▼
 *   summarizeWeather()      → conditions   (src/logic/weatherSummary.js)
 *   effectiveTemperature()  → effective    (src/logic/thermalComfort.js)
 *   getClothingAdvice()     → advice       (src/logic/clothingRules.js)
 *        │
 *        ▼
 *   <ProfileForm/>  <WeatherPanel/>  <ClothingAdvice/>
 *
 * Belangrijk: conditions/effective/advice zijn GEEN state. Ze worden
 * bij elke render opnieuw berekend uit de state. Dat houdt alles
 * automatisch in sync. https://react.dev/learn/you-might-not-need-an-effect
 */
import { useState } from 'react'
import ProfileForm from './components/ProfileForm.jsx'
import WeatherPanel from './components/WeatherPanel.jsx'
import ClothingAdvice from './components/ClothingAdvice.jsx'
import { useLocalStorage } from './hooks/useLocalStorage.js'
import { useWeather } from './hooks/useWeather.js'
import { summarizeWeather } from './logic/weatherSummary.js'
import { effectiveTemperature } from './logic/thermalComfort.js'
import { buildContext, getClothingAdvice } from './logic/clothingRules.js'
import './App.css'

/** Standaardprofiel voor nieuwe gebruikers. */
const DEFAULT_PROFILE = {
  heightCm: 175,
  weightKg: 70,
  sex: 'man', // 'man' | 'vrouw' | 'anders'
  sensitivity: 3, // 1 = heel snel koud … 5 = heel snel warm
  activity: 'wandelen', // zie ACTIVITY_OPTIONS
  extraOffset: 0, // vrije correctie in °C
}

/** Standaardlocatie (De Bilt, thuis van het KNMI). */
const DEFAULT_LOCATION = { name: 'De Bilt, Utrecht, Nederland', latitude: 52.11, longitude: 5.18 }

/** Standaard weerinstellingen. */
const DEFAULT_WEATHER_SETTINGS = {
  mode: 'day', // 'now' | 'day'
  fromHour: 8,
  toHour: 18,
  manual: { enabled: false, temperature: 10, windSpeed: 15, rainChance: 20, sunny: false },
}

export default function App() {
  // ---- State (wordt bewaard in localStorage) ----
  const [profile, setProfile] = useLocalStorage('kledingadvies.profile', DEFAULT_PROFILE)
  const [location, setLocation] = useLocalStorage('kledingadvies.location', DEFAULT_LOCATION)
  const [settings, setSettings] = useLocalStorage('kledingadvies.weather', DEFAULT_WEATHER_SETTINGS)
  // ---- Gewone state (hoeft niet bewaard te worden) ----
  const [showAll, setShowAll] = useState(false)

  // ---- Data ophalen ----
  const { forecast, loading, error, refresh } = useWeather(location, !settings.manual.enabled)

  // ---- Afgeleide waarden (berekend tijdens het renderen) ----
  const conditions = summarizeWeather(forecast, settings)

  let effective = null
  let advice = null
  if (conditions) {
    effective = effectiveTemperature(conditions.feelsLike, profile)
    const effectiveWarmest = effectiveTemperature(conditions.feelsLikeMax, profile).value
    const context = buildContext({ effective: effective.value, effectiveWarmest, conditions, profile })
    advice = getClothingAdvice(context)
  }

  function resetAll() {
    setProfile(DEFAULT_PROFILE)
    setLocation(DEFAULT_LOCATION)
    setSettings(DEFAULT_WEATHER_SETTINGS)
  }

  return (
    <div className="app">
      <header>
        <h1>🧥 Wat trek ik vandaag aan?</h1>
        <p className="hint">
          Kledingadvies op basis van het weer van vandaag en hoe jouw lichaam op kou reageert.
        </p>
      </header>

      <main className="layout">
        <div className="column">
          <ProfileForm profile={profile} onChange={setProfile} />
          <WeatherPanel
            location={location}
            onLocationChange={setLocation}
            settings={settings}
            onSettingsChange={setSettings}
            conditions={conditions}
            loading={loading}
            error={error}
            onRefresh={refresh}
          />
        </div>

        <div className="column">
          {advice ? (
            <ClothingAdvice
              advice={advice}
              effective={effective}
              showAll={showAll}
              onToggleShowAll={setShowAll}
            />
          ) : (
            <section className="card">
              <h2>👗 Trek vandaag aan</h2>
              <p className="hint">
                {error ? 'Geen weerdata beschikbaar. Voer het weer zelf in.' : 'Weer ophalen…'}
              </p>
            </section>
          )}
        </div>
      </main>

      <footer>
        <button className="link" onClick={resetAll}>
          Alles terugzetten naar standaard
        </button>
        <span className="hint">
          Weerdata: <a href="https://open-meteo.com" target="_blank" rel="noreferrer">Open-Meteo</a>
        </span>
      </footer>
    </div>
  )
}
