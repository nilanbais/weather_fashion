/**
 * LocationPicker
 * ------------------------------------------------------------------
 * Kies de locatie waarvoor het weer wordt opgehaald: via de GPS/locatie
 * van je browser, of door een plaatsnaam te zoeken.
 *
 * Dit component heeft wél eigen state (zoekterm, resultaten, status),
 * omdat die alleen hier nodig is. De gekozen locatie zelf gaat via
 * `onChange` naar App. https://react.dev/learn/choosing-the-state-structure
 *
 * Props:
 *   location  { name, latitude, longitude }
 *   onChange  functie die een nieuwe locatie ontvangt
 */
import { useState } from 'react'
import { searchPlaces } from '../services/weatherApi.js'

export default function LocationPicker({ location, onChange }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [status, setStatus] = useState(null) // foutmelding of info-tekst
  const [busy, setBusy] = useState(false)

  /** Zoek plaatsen. Wordt aangeroepen bij het versturen van het formulier. */
  async function handleSearch(event) {
    event.preventDefault() // voorkom dat de pagina herlaadt
    if (!query.trim()) return

    setBusy(true)
    setStatus(null)
    try {
      const places = await searchPlaces(query.trim())
      setResults(places)
      if (places.length === 0) setStatus('Geen plaatsen gevonden.')
    } catch (err) {
      setStatus(err.message)
    } finally {
      setBusy(false)
    }
  }

  /** Kies een plaats uit de zoekresultaten. */
  function choose(place) {
    onChange({
      name: [place.name, place.admin1, place.country].filter(Boolean).join(', '),
      latitude: place.latitude,
      longitude: place.longitude,
    })
    setResults([])
    setQuery('')
  }

  /** Gebruik de locatie van de browser (vraagt om toestemming). */
  function handleMyLocation() {
    if (!navigator.geolocation) {
      setStatus('Je browser ondersteunt geen locatiebepaling.')
      return
    }
    setBusy(true)
    setStatus(null)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onChange({
          name: 'Mijn locatie',
          latitude: Number(position.coords.latitude.toFixed(3)),
          longitude: Number(position.coords.longitude.toFixed(3)),
        })
        setBusy(false)
      },
      () => {
        setStatus('Locatie ophalen niet gelukt (geen toestemming?). Zoek een plaats.')
        setBusy(false)
      },
      { timeout: 10000 },
    )
  }

  return (
    <div className="location">
      <p className="current-location">
        📍 <strong>{location.name}</strong>
      </p>

      <form className="search" onSubmit={handleSearch}>
        <input
          type="search"
          placeholder="Zoek een plaats…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" disabled={busy}>
          Zoek
        </button>
        <button type="button" onClick={handleMyLocation} disabled={busy} title="Gebruik mijn locatie">
          🎯
        </button>
      </form>

      {status && <p className="hint">{status}</p>}

      {results.length > 0 && (
        <ul className="results">
          {results.map((place) => (
            <li key={place.id ?? `${place.latitude},${place.longitude}`}>
              <button type="button" onClick={() => choose(place)}>
                {place.name}
                <small>
                  {' '}
                  {[place.admin1, place.country].filter(Boolean).join(', ')}
                </small>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
