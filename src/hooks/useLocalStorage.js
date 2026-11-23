/**
 * useLocalStorage
 * ------------------------------------------------------------------
 * Een eigen ("custom") hook die werkt als useState, maar de waarde ook
 * bewaart in de browser (localStorage). Zo blijven je profiel en
 * instellingen bewaard als je de pagina herlaadt.
 *
 * Over custom hooks: https://react.dev/learn/reusing-logic-with-custom-hooks
 *
 * Gebruik:
 *   const [profile, setProfile] = useLocalStorage('profile', DEFAULT_PROFILE)
 */
import { useEffect, useState } from 'react'

export function useLocalStorage(key, defaultValue) {
  // "Lazy initial state": de functie wordt alleen bij de eerste render
  // uitgevoerd. https://react.dev/reference/react/useState#avoiding-recreating-the-initial-state
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key)
      if (stored === null) return defaultValue
      // Samenvoegen met de standaardwaarde, zodat nieuwe velden die je later
      // toevoegt ook een waarde hebben bij een oud opgeslagen profiel.
      const parsed = JSON.parse(stored)
      return typeof defaultValue === 'object' && defaultValue !== null && !Array.isArray(defaultValue)
        ? { ...defaultValue, ...parsed }
        : parsed
    } catch {
      return defaultValue
    }
  })

  // Synchroniseer met localStorage telkens als de waarde verandert.
  // Dit is een geldig gebruik van een Effect: synchroniseren met een
  // extern systeem. https://react.dev/learn/synchronizing-with-effects
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Opslag niet beschikbaar (bv. privévenster): de app werkt gewoon door.
    }
  }, [key, value])

  return [value, setValue]
}
