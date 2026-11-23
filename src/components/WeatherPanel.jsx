/**
 * WeatherPanel
 * ------------------------------------------------------------------
 * Toont het weer en laat de gebruiker kiezen:
 *   - locatie (via LocationPicker)
 *   - "Nu" of een tijdvak van vandaag (bv. 8:00 – 18:00)
 *   - handmatig weer invoeren i.p.v. live data (handig om te testen of
 *     als je voor een ander moment wilt plannen)
 *
 * Props:
 *   location, onLocationChange   zie LocationPicker
 *   settings, onSettingsChange   zie DEFAULT_WEATHER_SETTINGS in App.jsx
 *   conditions                   samenvatting uit summarizeWeather() (of null)
 *   loading, error, onRefresh    status van useWeather()
 */
import LocationPicker from './LocationPicker.jsx'
import { describeWeatherCode } from '../logic/weatherSummary.js'

const HOURS = Array.from({ length: 24 }, (_, h) => h)
const round = (n) => Math.round(n)

export default function WeatherPanel({
  location,
  onLocationChange,
  settings,
  onSettingsChange,
  conditions,
  loading,
  error,
  onRefresh,
}) {
  /** Werk één instelling bij. */
  function update(field, value) {
    onSettingsChange({ ...settings, [field]: value })
  }

  /** Werk één veld van de handmatige invoer bij. */
  function updateManual(field, value) {
    onSettingsChange({ ...settings, manual: { ...settings.manual, [field]: value } })
  }

  const manual = settings.manual

  return (
    <section className="card">
      <h2>🌦️ Het weer</h2>

      {!manual.enabled && <LocationPicker location={location} onChange={onLocationChange} />}

      {/* Keuze: nu of een tijdvak van de dag */}
      {!manual.enabled && (
        <fieldset className="field">
          <legend>Voor welk moment?</legend>
          <div className="segmented">
            <label className={settings.mode === 'now' ? 'active' : ''}>
              <input
                type="radio"
                name="mode"
                checked={settings.mode === 'now'}
                onChange={() => update('mode', 'now')}
              />
              Nu
            </label>
            <label className={settings.mode === 'day' ? 'active' : ''}>
              <input
                type="radio"
                name="mode"
                checked={settings.mode === 'day'}
                onChange={() => update('mode', 'day')}
              />
              Vandaag (tijdvak)
            </label>
          </div>

          {settings.mode === 'day' && (
            <div className="row">
              <label className="field">
                <span>Van</span>
                <select
                  value={settings.fromHour}
                  onChange={(e) => update('fromHour', Number(e.target.value))}
                >
                  {HOURS.map((h) => (
                    <option key={h} value={h}>{`${h}:00`}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Tot</span>
                <select
                  value={settings.toHour}
                  onChange={(e) => update('toHour', Number(e.target.value))}
                >
                  {HOURS.map((h) => (
                    <option key={h} value={h}>{`${h}:00`}</option>
                  ))}
                </select>
              </label>
            </div>
          )}
        </fieldset>
      )}

      {/* Handmatige invoer */}
      <label className="toggle">
        <input
          type="checkbox"
          checked={manual.enabled}
          onChange={(e) => updateManual('enabled', e.target.checked)}
        />
        Weer zelf invoeren
      </label>

      {manual.enabled && (
        <div className="manual">
          <div className="row">
            <label className="field">
              <span>Temperatuur (°C)</span>
              <input
                type="number"
                step="0.5"
                value={manual.temperature}
                onChange={(e) => updateManual('temperature', e.target.value)}
              />
            </label>
            <label className="field">
              <span>Wind (km/u)</span>
              <input
                type="number"
                min="0"
                value={manual.windSpeed}
                onChange={(e) => updateManual('windSpeed', e.target.value)}
              />
            </label>
          </div>
          <label className="field">
            <span>
              Kans op neerslag: <strong>{manual.rainChance}%</strong>
            </span>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={manual.rainChance}
              onChange={(e) => updateManual('rainChance', Number(e.target.value))}
            />
          </label>
          <label className="toggle">
            <input
              type="checkbox"
              checked={manual.sunny}
              onChange={(e) => updateManual('sunny', e.target.checked)}
            />
            Zonnig
          </label>
        </div>
      )}

      {/* Status en samenvatting */}
      {loading && !manual.enabled && <p className="hint">Weer ophalen…</p>}
      {error && !manual.enabled && (
        <p className="error">
          {error} <button onClick={onRefresh}>Opnieuw</button>
        </p>
      )}

      {conditions && (
        <div className="weather-summary">
          <div className="big">
            <span className="icon">{describeWeatherCode(conditions.weatherCode).icon}</span>
            <div>
              <div className="temp">
                {round(conditions.temperature)}°C
                {conditions.temperatureMax !== conditions.temperature &&
                  ` – ${round(conditions.temperatureMax)}°C`}
              </div>
              <div className="hint">
                {conditions.description} · {conditions.label}
              </div>
            </div>
          </div>
          <dl className="stats">
            <div>
              <dt>Gevoelstemperatuur</dt>
              <dd>
                {round(conditions.feelsLike)}°C
                {conditions.feelsLikeMax !== conditions.feelsLike &&
                  ` – ${round(conditions.feelsLikeMax)}°C`}
              </dd>
            </div>
            <div>
              <dt>Wind</dt>
              <dd>{round(conditions.windSpeed)} km/u</dd>
            </div>
            <div>
              <dt>Neerslagkans</dt>
              <dd>{round(conditions.rainChance)}%</dd>
            </div>
          </dl>
          {!manual.enabled && (
            <button className="link" onClick={onRefresh} disabled={loading}>
              ↻ Vernieuwen
            </button>
          )}
        </div>
      )}
    </section>
  )
}
