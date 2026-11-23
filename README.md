# 🧥 Kledingadvies

Een React-app die op basis van **het weer van vandaag** en **jouw lichaamsprofiel**
adviseert welke kledingstukken je aantrekt om het niet koud te hebben.

## Starten

Vereist: [Node.js](https://nodejs.org) 20 of nieuwer.

```bash
npm install      # eenmalig: installeert React, Vite, ESLint
npm run dev      # start de app op http://localhost:5173 (opent de browser)
```

Overige commando's:

| Commando          | Wat het doet                                              |
| ----------------- | --------------------------------------------------------- |
| `npm test`        | Draait de tests van de rekenlogica (`src/logic/*.test.js`) |
| `npm run lint`    | Controleert de code met ESLint (incl. React Hooks-regels) |
| `npm run build`   | Maakt een productieversie in `dist/`                      |
| `npm run preview` | Bekijk de productieversie lokaal                          |

Het project volgt de opzet van het officiële Vite React-template, de door
[react.dev](https://react.dev/learn/build-a-react-app-from-scratch) aanbevolen manier om
een React-app zonder framework te bouwen.

## Wat kan de gebruiker instellen?

- **Profiel**: lengte, gewicht, geslacht, "snel koud ↔ snel warm" (5 stappen),
  activiteit (stilstaan, wandelen, fietsen, sporten) en een vrije extra correctie in °C.
- **Weer**: locatie (zoeken op plaatsnaam of 🎯 je eigen locatie), "Nu" of een
  tijdvak van vandaag (bv. 8:00–18:00), of het weer **zelf invoeren**.
- Alle instellingen worden bewaard in je browser (localStorage).

## Hoe werkt het?

```
profiel + locatie + instellingen   (state in App.jsx)
            │
            ▼
useWeather()            haalt weer op bij Open-Meteo (gratis, geen API-sleutel)
            ▼
summarizeWeather()      → koudste/warmste gevoelstemperatuur, wind, regenkans
            ▼
effectiveTemperature()  → gevoelstemperatuur + persoonlijke correctie
            ▼
getClothingAdvice()     → per lichaamsdeel het eerste passende kledingstuk + tips
            ▼
<ClothingAdvice />      toont het advies (+ uitleg "Hoe is dit berekend?")
```

**Effectieve temperatuur** = gevoelstemperatuur op het *koudste* moment van het
gekozen tijdvak + persoonlijke correctie. De correctie is een optelsom van:

| Factor          | Effect                                                                   |
| --------------- | ------------------------------------------------------------------------ |
| Lichaamsbouw    | Klein/licht → sneller koud, groot/zwaar → minder snel koud (max ±3 °C)   |
| Geslacht        | Vrouw −1,5 °C, anders −0,75 °C                                           |
| Gevoeligheid    | −4 (heel snel koud) … +4 °C (heel snel warm)                             |
| Activiteit      | Stilstaan −2, wandelen 0, fietsen +2, sporten +7 °C                      |
| Eigen correctie | −5 … +5 °C, zelf in te stellen                                           |

Dit zijn vuistregels, geen wetenschap. Ze zijn bewust makkelijk aan te passen.

## Projectstructuur

```
src/
├── main.jsx                 Startpunt: koppelt <App/> aan index.html
├── App.jsx                  Hoofdcomponent: state + gegevensstroom
├── App.css / index.css      Opmaak (licht en donker thema)
├── components/              Weergave (React-componenten)
│   ├── ProfileForm.jsx        formulier lichaamsprofiel
│   ├── WeatherPanel.jsx       weer, tijdvak, handmatige invoer
│   ├── LocationPicker.jsx     plaats zoeken / eigen locatie
│   └── ClothingAdvice.jsx     het advies + uitleg van de berekening
├── hooks/                   Eigen React-hooks
│   ├── useWeather.js          weer ophalen (met annuleren van oude verzoeken)
│   └── useLocalStorage.js     useState dat bewaard blijft in de browser
├── services/
│   └── weatherApi.js          alle API-aanroepen (Open-Meteo)
└── logic/                   Pure JavaScript, geen React → los te testen
    ├── thermalComfort.js      persoonlijke correctie, wind chill
    ├── weatherSummary.js      API-data → eenvoudig `conditions`-object
    ├── clothingRules.js       ★ de kledingregels en tips
    └── logic.test.js          tests
```

Het principe: **componenten tonen alleen**, **logic rekent**, **services praten met
internet**. Wil je iets aanpassen, dan weet je zo waar je moet zijn.

## Veelvoorkomende aanpassingen

**Een kledingstuk toevoegen of een drempel wijzigen** → `src/logic/clothingRules.js`.
Elk lichaamsdeel heeft een lijst opties van warm naar licht; de eerste optie
waarvan `when` waar is, wordt gekozen:

```js
{
  id: 'handen',
  label: 'Handen',
  icon: '🧤',
  options: [
    { item: 'Wanten', when: (c) => c.temp < -2, reason: 'Vingers koelen snel af' },
    { item: 'Handschoenen', when: (c) => c.temp < 6, reason: 'Koude handen voorkomen' },
  ],
},
```

Een heel nieuw lichaamsdeel? Voeg een nieuw object toe aan `SLOTS`; de interface
toont het automatisch. Een nieuwe tip? Voeg iets toe aan `TIPS`.

**Hoe zwaar een factor meetelt** → de `offset`-waarden in `src/logic/thermalComfort.js`.

**Nieuwe activiteit** → voeg een regel toe aan `ACTIVITY_OPTIONS` in
`thermalComfort.js`; de keuzelijst in het formulier past zich vanzelf aan.

**Standaardprofiel of standaardlocatie** → `DEFAULT_PROFILE` / `DEFAULT_LOCATION` in
`src/App.jsx`. (Let op: een eerder opgeslagen profiel in je browser gaat voor; gebruik
de knop "Alles terugzetten naar standaard" onderaan de pagina.)

**Andere weerdienst** → alleen `src/services/weatherApi.js` en de functies in
`weatherSummary.js` die de API-velden lezen.

## Handige React-documentatie

- [Thinking in React](https://react.dev/learn/thinking-in-react): hoe de app is opgedeeld
- [Sharing state between components](https://react.dev/learn/sharing-state-between-components): waarom de state in `App.jsx` staat
- [You might not need an Effect](https://react.dev/learn/you-might-not-need-an-effect): waarom het advies tijdens het renderen wordt berekend
- [Fetching data with Effects](https://react.dev/reference/react/useEffect#fetching-data-with-effects): de opzet van `useWeather`
- [Reusing logic with custom hooks](https://react.dev/learn/reusing-logic-with-custom-hooks): `useWeather` en `useLocalStorage`
