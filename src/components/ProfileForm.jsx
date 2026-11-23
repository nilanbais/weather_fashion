/**
 * ProfileForm
 * ------------------------------------------------------------------
 * Formulier voor je lichaamsprofiel. Dit is een "controlled component":
 * de waarden komen via props binnen en elke wijziging wordt via
 * `onChange` teruggegeven aan de ouder (App). Het component heeft zelf
 * dus geen state. https://react.dev/learn/sharing-state-between-components
 *
 * Props:
 *   profile   object met heightCm, weightKg, sex, sensitivity, activity, extraOffset
 *   onChange  functie die het volledige, bijgewerkte profiel ontvangt
 */
import {
  ACTIVITY_OPTIONS,
  SENSITIVITY_OPTIONS,
  SEX_OPTIONS,
  findOption,
} from '../logic/thermalComfort.js'

export default function ProfileForm({ profile, onChange }) {
  /** Werk één veld bij en geef het hele (nieuwe) profiel door. */
  function update(field, value) {
    onChange({ ...profile, [field]: value })
  }

  /** Lees een getal uit een <input type="number">; leeg veld → ''. */
  function numberFrom(event) {
    const n = event.target.valueAsNumber
    return Number.isNaN(n) ? '' : n
  }

  return (
    <section className="card">
      <h2>👤 Jouw profiel</h2>

      <div className="row">
        <label className="field">
          <span>Lengte (cm)</span>
          <input
            type="number"
            min="100"
            max="230"
            value={profile.heightCm}
            onChange={(e) => update('heightCm', numberFrom(e))}
          />
        </label>

        <label className="field">
          <span>Gewicht (kg)</span>
          <input
            type="number"
            min="30"
            max="250"
            value={profile.weightKg}
            onChange={(e) => update('weightKg', numberFrom(e))}
          />
        </label>
      </div>

      <fieldset className="field">
        <legend>Geslacht</legend>
        <div className="segmented">
          {SEX_OPTIONS.map((option) => (
            <label key={option.value} className={profile.sex === option.value ? 'active' : ''}>
              <input
                type="radio"
                name="sex"
                value={option.value}
                checked={profile.sex === option.value}
                onChange={() => update('sex', option.value)}
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="field">
        <span>
          Heb je het snel koud of warm?{' '}
          <strong>{findOption(SENSITIVITY_OPTIONS, profile.sensitivity).label}</strong>
        </span>
        <input
          type="range"
          min="1"
          max="5"
          step="1"
          value={profile.sensitivity}
          onChange={(e) => update('sensitivity', Number(e.target.value))}
        />
        <div className="range-labels">
          <span>🥶 snel koud</span>
          <span>snel warm 🥵</span>
        </div>
      </label>

      <label className="field">
        <span>Wat ga je vooral doen buiten?</span>
        <select value={profile.activity} onChange={(e) => update('activity', e.target.value)}>
          {ACTIVITY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>
          Eigen extra correctie:{' '}
          <strong>
            {profile.extraOffset > 0 ? '+' : ''}
            {profile.extraOffset}°C
          </strong>
        </span>
        <input
          type="range"
          min="-5"
          max="5"
          step="0.5"
          value={profile.extraOffset}
          onChange={(e) => update('extraOffset', Number(e.target.value))}
        />
        <small className="hint">
          Was het advies vorige keer te koud? Schuif naar links. Te warm? Naar rechts.
        </small>
      </label>
    </section>
  )
}
