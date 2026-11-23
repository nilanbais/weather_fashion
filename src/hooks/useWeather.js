/**
 * useWeather
 * ------------------------------------------------------------------
 * Custom hook die weerdata ophaalt voor een locatie en bijhoudt of het
 * aan het laden is of dat er een fout optrad.
 *
 * Patroon volgens de React-documentatie voor data ophalen in een Effect,
 * inclusief opruimen ("cleanup") zodat een oud antwoord nooit een nieuwer
 * antwoord overschrijft:
 * https://react.dev/reference/react/useEffect#fetching-data-with-effects
 *
 * @param {{latitude: number, longitude: number} | null} location
 * @param {boolean} enabled  false = niet ophalen (bv. bij handmatige invoer)
 * @returns {{ forecast: object|null, loading: boolean, error: string|null, refresh: () => void }}
 */
import { useCallback, useEffect, useState } from 'react'
import { fetchForecast } from '../services/weatherApi.js'

export function useWeather(location, enabled = true) {
  const [forecast, setForecast] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  // Door dit getal op te hogen dwingen we een nieuwe fetch af ("Vernieuwen").
  const [reloadKey, setReloadKey] = useState(0)

  const latitude = location?.latitude
  const longitude = location?.longitude

  useEffect(() => {
    if (!enabled || latitude == null || longitude == null) return

    const controller = new AbortController()
    setLoading(true)
    setError(null)

    fetchForecast({ latitude, longitude }, controller.signal)
      .then((data) => setForecast(data))
      .catch((err) => {
        // Een afgebroken verzoek is geen echte fout.
        if (err.name !== 'AbortError') setError(err.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    // Cleanup: wordt uitgevoerd vóór de volgende fetch of als het
    // component verdwijnt. Breekt het lopende verzoek af.
    return () => controller.abort()
  }, [latitude, longitude, enabled, reloadKey])

  const refresh = useCallback(() => setReloadKey((k) => k + 1), [])

  return { forecast, loading, error, refresh }
}
