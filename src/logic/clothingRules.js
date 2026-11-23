/**
 * clothingRules.js
 * ------------------------------------------------------------------
 * HIER PAS JE HET KLEDINGADVIES AAN.
 *
 * Het advies is volledig "data-gedreven": in plaats van een lange
 * if/else-keten staat er een lijst met lichaamsdelen (SLOTS). Elk slot
 * heeft een lijst `options`, van warm-/zwaarste kleding naar lichtste.
 * Voor elk slot wordt de EERSTE optie gekozen waarvan `when(c)` true is.
 * Matcht geen enkele optie, dan is voor dat lichaamsdeel niets nodig.
 *
 * `c` (de context) ziet er zo uit — zie buildContext() onderaan:
 *   c.temp        effectieve temperatuur voor jou (°C), dé hoofdwaarde
 *   c.wind        (maximale) windsnelheid in km/u
 *   c.rainChance  (maximale) neerslagkans in %
 *   c.rainMm      verwachte neerslag in mm
 *   c.sunny       true als het (overwegend) zonnig is
 *   c.snow        true als er sneeuw verwacht wordt
 *   c.tempRange   verschil tussen koudste en warmste moment (°C)
 *   c.warmest     effectieve temperatuur op het warmste moment (°C)
 *
 * Een optie toevoegen? Voeg een object toe op de juiste plek in de lijst:
 *   { item: 'Oorwarmers', when: (c) => c.temp < 0, reason: 'Koude oren' }
 */

/** Hoe waarschijnlijk regen moet zijn voordat we er rekening mee houden (%). */
export const RAIN_LIKELY = 55
export const RAIN_POSSIBLE = 30
/** Vanaf deze windsnelheid (km/u) noemen we het "veel wind". */
export const WINDY = 30

export const SLOTS = [
  {
    id: 'hoofd',
    label: 'Hoofd',
    icon: '🧢',
    options: [
      { item: 'Warme muts die je oren bedekt', when: (c) => c.temp < -2, reason: 'Via je hoofd verlies je veel warmte' },
      { item: 'Muts', when: (c) => c.temp < 4, reason: 'Het is koud genoeg voor een muts' },
      { item: 'Pet of zonnehoed', when: (c) => c.sunny && c.temp >= 22, reason: 'Zon en warmte' },
    ],
  },
  {
    id: 'nek',
    label: 'Nek',
    icon: '🧣',
    options: [
      { item: 'Warme sjaal', when: (c) => c.temp < 2, reason: 'Houdt de koude lucht bij je hals weg' },
      { item: 'Dunne sjaal of col', when: (c) => c.temp < 9 && c.wind >= WINDY * 0.8, reason: 'Fris en winderig' },
    ],
  },
  {
    id: 'basislaag',
    label: 'Basislaag (op de huid)',
    icon: '👕',
    options: [
      { item: 'Thermisch ondershirt + shirt met lange mouwen', when: (c) => c.temp < -3, reason: 'Extra isolatie nodig' },
      { item: 'Shirt met lange mouwen', when: (c) => c.temp < 12, reason: 'Armen warm houden' },
      { item: 'T-shirt', when: (c) => c.temp < 24, reason: 'Basis voor gematigd weer' },
      { item: 'Luchtig T-shirt of topje', when: () => true, reason: 'Het is warm' },
    ],
  },
  {
    id: 'tussenlaag',
    label: 'Tussenlaag',
    icon: '🧶',
    options: [
      { item: 'Dikke (wollen) trui of fleece', when: (c) => c.temp < 2, reason: 'Isolerende laag onder je jas' },
      { item: 'Trui of vest', when: (c) => c.temp < 10, reason: 'Extra laag voor fris weer' },
      { item: 'Dun vest of sweater (kan uit als het warmer wordt)', when: (c) => c.temp < 16, reason: 'Licht fris' },
    ],
  },
  {
    id: 'jas',
    label: 'Jas',
    icon: '🧥',
    options: [
      { item: 'Winterjas (gevoerd / dons)', when: (c) => c.temp < 5, reason: 'Koud weer' },
      { item: 'Tussenjas (gevoerd of softshell)', when: (c) => c.temp < 12, reason: 'Fris weer' },
      { item: 'Lichte jas of windjack', when: (c) => c.temp < 17, reason: 'Koel weer' },
      { item: 'Windjack', when: (c) => c.temp < 22 && c.wind >= WINDY, reason: 'Veel wind' },
    ],
  },
  {
    id: 'regen',
    label: 'Regenbescherming',
    icon: '☔',
    options: [
      {
        item: 'Waterdichte jas of regenpak (en/of paraplu)',
        when: (c) => c.rainChance >= RAIN_LIKELY || c.rainMm >= 1,
        reason: 'Regen is waarschijnlijk',
      },
      {
        item: 'Paraplu of opvouwbaar regenjack meenemen',
        when: (c) => c.rainChance >= RAIN_POSSIBLE,
        reason: 'Kans op een bui',
      },
    ],
  },
  {
    id: 'benen',
    label: 'Benen',
    icon: '👖',
    options: [
      { item: 'Lange broek + thermolegging eronder', when: (c) => c.temp < -4, reason: 'Strenge kou' },
      { item: 'Lange (stevige) broek', when: (c) => c.temp < 15, reason: 'Benen warm houden' },
      { item: 'Lange luchtige broek, chino of rok met panty', when: (c) => c.temp < 21, reason: 'Gematigd' },
      { item: 'Korte broek, rok of jurk', when: () => true, reason: 'Het is warm' },
    ],
  },
  {
    id: 'voeten',
    label: 'Voeten',
    icon: '🥾',
    options: [
      { item: 'Gevoerde, waterdichte laarzen + warme sokken', when: (c) => c.snow || c.temp < -3, reason: 'Sneeuw of strenge kou' },
      { item: 'Dichte schoenen + warme (wollen) sokken', when: (c) => c.temp < 3, reason: 'Koude voeten voorkomen' },
      { item: 'Waterdichte schoenen', when: (c) => c.rainChance >= RAIN_LIKELY, reason: 'Natte voeten voorkomen' },
      { item: 'Dichte schoenen / sneakers', when: (c) => c.temp < 20, reason: 'Normaal weer' },
      { item: 'Sneakers of sandalen', when: () => true, reason: 'Het is warm' },
    ],
  },
  {
    id: 'handen',
    label: 'Handen',
    icon: '🧤',
    options: [
      { item: 'Wanten of dikke handschoenen', when: (c) => c.temp < -2, reason: 'Vingers koelen snel af' },
      { item: 'Handschoenen', when: (c) => c.temp < 6, reason: 'Koude handen voorkomen' },
    ],
  },
  {
    id: 'extra',
    label: 'Extra',
    icon: '🕶️',
    options: [
      { item: 'Zonnebril en zonnebrand', when: (c) => c.sunny && c.warmest >= 18, reason: 'Zonnig' },
    ],
  },
]

/**
 * Algemene tips. Anders dan bij SLOTS worden hier ALLE tips getoond
 * waarvan `when(c)` true is.
 */
export const TIPS = [
  {
    when: (c) => c.tempRange >= 6,
    text: (c) =>
      `Het verschil tussen het koudste en warmste moment is ${Math.round(c.tempRange)}°C. ` +
      'Kleed je in laagjes zodat je iets uit kunt doen als het warmer wordt.',
  },
  {
    when: (c) => c.wind >= WINDY,
    text: (c) => `Veel wind (tot ${Math.round(c.wind)} km/u): kies een jas die winddicht is.`,
  },
  {
    when: (c) => c.snow,
    text: () => 'Er kan sneeuw vallen: let op gladheid en kies schoenen met grip.',
  },
  {
    when: (c) => c.activity === 'sporten',
    text: () => 'Bij sporten warm je snel op: liever iets te koud bij de start dan te warm onderweg.',
  },
  {
    when: (c) => c.activity === 'fietsen' && c.temp < 8,
    text: () => 'Op de fiets krijg je extra wind op handen en gezicht: handschoenen zijn geen overbodige luxe.',
  },
]

/**
 * Bouw de context `c` waarmee de regels hierboven worden geëvalueerd.
 *
 * @param {object} params
 * @param {number} params.effective         effectieve temperatuur (koudste moment)
 * @param {number} params.effectiveWarmest  effectieve temperatuur (warmste moment)
 * @param {object} params.conditions        uitkomst van summarizeWeather()
 * @param {object} params.profile
 */
export function buildContext({ effective, effectiveWarmest, conditions, profile }) {
  return {
    temp: effective,
    warmest: effectiveWarmest,
    tempRange: effectiveWarmest - effective,
    wind: conditions.windSpeed,
    rainChance: conditions.rainChance,
    rainMm: conditions.precipitation,
    sunny: conditions.sunny,
    snow: conditions.snow,
    activity: profile.activity,
  }
}

/**
 * Pas alle regels toe en geef het volledige advies terug.
 *
 * @param {object} context  uitkomst van buildContext()
 * @returns {{ items: {slot: object, item: string|null, reason: string|null}[], tips: string[] }}
 */
export function getClothingAdvice(context) {
  const items = SLOTS.map((slot) => {
    const match = slot.options.find((option) => option.when(context))
    return {
      slot,
      item: match ? match.item : null,
      reason: match ? match.reason : null,
    }
  })

  const tips = TIPS.filter((tip) => tip.when(context)).map((tip) => tip.text(context))

  return { items, tips }
}
