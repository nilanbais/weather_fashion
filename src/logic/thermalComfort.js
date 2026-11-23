/**
 * thermalComfort.js
 * ------------------------------------------------------------------
 * Pure functies (geen React!) die uitrekenen hoe koud of warm het voor
 * JOU aanvoelt. Omdat dit gewone JavaScript is, kun je het los testen
 * (zie thermalComfort.test.js) en makkelijk aanpassen.
 *
 * Het idee:
 *   effectieve temperatuur = gevoelstemperatuur + persoonlijke correctie
 *
 * - De gevoelstemperatuur houdt al rekening met wind (en vocht).
 * - De persoonlijke correctie is een som van kleine "offsets" in °C:
 *     positief  → jij hebt het warmer dan gemiddeld (minder kleding nodig)
 *     negatief  → jij hebt het sneller koud (meer kleding nodig)
 *
 * Alle getallen hieronder zijn vuistregels, geen medische wetenschap.
 * Pas ze gerust aan naar je eigen ervaring.
 */

/** Referentiepersoon waartegen lichaamsbouw wordt vergeleken. */
export const REFERENCE_BODY = { heightCm: 175, weightKg: 70 }

/**
 * Offset per geslacht (°C). Onderzoek laat zien dat vrouwen gemiddeld
 * een iets hogere omgevingstemperatuur prettig vinden (lager
 * metabolisme, andere doorbloeding van handen/voeten).
 */
export const SEX_OPTIONS = [
  { value: 'man', label: 'Man', offset: 0 },
  { value: 'vrouw', label: 'Vrouw', offset: -1.5 },
  { value: 'anders', label: 'Anders / zeg ik liever niet', offset: -0.75 },
]

/**
 * "Snel koud / snel warm"-schaal. Dit is de belangrijkste knop om het
 * advies op jezelf af te stemmen.
 */
export const SENSITIVITY_OPTIONS = [
  { value: 1, label: 'Heel snel koud', offset: -4 },
  { value: 2, label: 'Snel koud', offset: -2 },
  { value: 3, label: 'Gemiddeld', offset: 0 },
  { value: 4, label: 'Snel warm', offset: 2 },
  { value: 5, label: 'Heel snel warm', offset: 4 },
]

/**
 * Activiteit: bewegen produceert warmte. Stilstaan (wachten op de bus)
 * voelt juist kouder aan dan rustig wandelen.
 */
export const ACTIVITY_OPTIONS = [
  { value: 'stil', label: 'Vooral stilstaan / wachten', offset: -2 },
  { value: 'wandelen', label: 'Wandelen / rustig buiten', offset: 0 },
  { value: 'fietsen', label: 'Fietsen', offset: 2 },
  { value: 'sporten', label: 'Hardlopen / intensief sporten', offset: 7 },
]

/** Hulpfunctie: houd een getal binnen [min, max]. */
export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

/** Zoek de optie met een bepaalde `value` in een van de lijsten hierboven. */
export function findOption(options, value) {
  return options.find((option) => option.value === value) ?? options[0]
}

/**
 * Lichaamsoppervlak volgens de formule van Mosteller (m²).
 * @param {number} heightCm
 * @param {number} weightKg
 */
export function bodySurfaceArea(heightCm, weightKg) {
  return Math.sqrt((heightCm * weightKg) / 3600)
}

/**
 * Offset op basis van lichaamsbouw.
 *
 * Warmte verlies je via je huid (oppervlak), warmte maak en bewaar je in
 * je lichaam (massa). Een klein/licht persoon heeft relatief véél huid
 * per kilo en koelt dus sneller af; een groot/zwaar persoon andersom.
 * We vergelijken de verhouding oppervlak/gewicht met de referentiepersoon.
 *
 * Voorbeelden: 160 cm / 50 kg ≈ -1,6 °C, 190 cm / 100 kg ≈ +1,6 °C.
 *
 * @returns {number} offset in °C, begrensd tussen -3 en +3
 */
export function bodyBuildOffset(heightCm, weightKg) {
  if (!(heightCm > 0) || !(weightKg > 0)) return 0

  const ratio = bodySurfaceArea(heightCm, weightKg) / weightKg
  const ref = REFERENCE_BODY
  const refRatio = bodySurfaceArea(ref.heightCm, ref.weightKg) / ref.weightKg

  // Factor 12 bepaalt hoe zwaar lichaamsbouw meetelt. Groter = meer invloed.
  const offset = ((refRatio - ratio) / refRatio) * 12
  return clamp(offset, -3, 3)
}

/**
 * Gevoelstemperatuur door wind (wind chill, formule van het KNMI / JAG-TI).
 * Wordt gebruikt bij handmatige invoer; bij live weerdata levert de
 * weer-API zelf al een gevoelstemperatuur.
 *
 * De formule geldt alleen bij T ≤ 10 °C en wind > 4,8 km/u; daarbuiten
 * geven we gewoon de luchttemperatuur terug.
 *
 * @param {number} tempC   luchttemperatuur in °C
 * @param {number} windKmh windsnelheid in km/u
 */
export function windChill(tempC, windKmh) {
  if (tempC > 10 || windKmh <= 4.8) return tempC
  const v = Math.pow(windKmh, 0.16)
  return 13.12 + 0.6215 * tempC - 11.37 * v + 0.3965 * tempC * v
}

/**
 * Bereken de persoonlijke correctie, inclusief een uitsplitsing zodat de
 * app kan laten zien waar het getal vandaan komt.
 *
 * @param {object} profile  zie DEFAULT_PROFILE in App.jsx
 * @returns {{ total: number, parts: {label: string, value: number}[] }}
 */
export function personalOffset(profile) {
  const parts = [
    {
      label: 'Lichaamsbouw (lengte/gewicht)',
      value: bodyBuildOffset(profile.heightCm, profile.weightKg),
    },
    {
      label: `Geslacht: ${findOption(SEX_OPTIONS, profile.sex).label}`,
      value: findOption(SEX_OPTIONS, profile.sex).offset,
    },
    {
      label: `Gevoeligheid: ${findOption(SENSITIVITY_OPTIONS, profile.sensitivity).label}`,
      value: findOption(SENSITIVITY_OPTIONS, profile.sensitivity).offset,
    },
    {
      label: `Activiteit: ${findOption(ACTIVITY_OPTIONS, profile.activity).label}`,
      value: findOption(ACTIVITY_OPTIONS, profile.activity).offset,
    },
    {
      // Vrije extra correctie die de gebruiker zelf kan instellen.
      label: 'Eigen extra correctie',
      value: Number(profile.extraOffset) || 0,
    },
  ]

  const total = parts.reduce((sum, part) => sum + part.value, 0)
  return { total, parts }
}

/**
 * De temperatuur waarop het kledingadvies wordt gebaseerd.
 *
 * @param {number} feelsLike gevoelstemperatuur in °C
 * @param {object} profile
 */
export function effectiveTemperature(feelsLike, profile) {
  const offset = personalOffset(profile)
  return {
    feelsLike,
    offset,
    value: feelsLike + offset.total,
  }
}
