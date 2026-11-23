/**
 * ClothingAdvice
 * ------------------------------------------------------------------
 * Toont het kledingadvies plus een uitleg hoe de "effectieve
 * temperatuur" voor jou is berekend. Puur weergave: alle berekeningen
 * gebeuren in App.jsx en in src/logic/.
 *
 * Props:
 *   advice      { items, tips }       uit getClothingAdvice()
 *   effective   uit effectiveTemperature() (koudste moment)
 *   showAll     boolean: ook lichaamsdelen tonen waarvoor niets nodig is
 *   onToggleShowAll
 */

/** Formatteer een getal als "+1,5" / "-2" (met teken, Nederlandse komma). */
function signed(n) {
  const rounded = Math.round(n * 10) / 10
  const text = rounded.toLocaleString('nl-NL')
  return rounded > 0 ? `+${text}` : text
}

export default function ClothingAdvice({ advice, effective, showAll, onToggleShowAll }) {
  const visibleItems = showAll ? advice.items : advice.items.filter((entry) => entry.item)

  return (
    <section className="card advice">
      <h2>👗 Trek vandaag aan</h2>

      <p className="effective">
        Voor jou voelt het als <strong>{Math.round(effective.value)}°C</strong>
      </p>

      <ul className="items">
        {visibleItems.map(({ slot, item, reason }) => (
          // `key` helpt React om lijst-items te herkennen tussen renders.
          // https://react.dev/learn/rendering-lists#keeping-list-items-in-order-with-key
          <li key={slot.id} className={item ? '' : 'muted'}>
            <span className="slot-icon">{slot.icon}</span>
            <div>
              <div className="slot-label">{slot.label}</div>
              <div className="slot-item">{item ?? 'Niet nodig'}</div>
              {reason && <div className="hint">{reason}</div>}
            </div>
          </li>
        ))}
      </ul>

      <label className="toggle">
        <input type="checkbox" checked={showAll} onChange={(e) => onToggleShowAll(e.target.checked)} />
        Toon ook wat niet nodig is
      </label>

      {advice.tips.length > 0 && (
        <div className="tips">
          <h3>💡 Tips</h3>
          <ul>
            {advice.tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </div>
      )}

      {/* <details> is een native HTML-element dat in-/uitklapt. */}
      <details className="explain">
        <summary>Hoe is dit berekend?</summary>
        <table>
          <tbody>
            <tr>
              <td>Gevoelstemperatuur (koudste moment)</td>
              <td>{signed(effective.feelsLike)}°C</td>
            </tr>
            {effective.offset.parts.map((part) => (
              <tr key={part.label}>
                <td>{part.label}</td>
                <td>{signed(part.value)}°C</td>
              </tr>
            ))}
            <tr className="total">
              <td>Effectieve temperatuur voor jou</td>
              <td>{signed(effective.value)}°C</td>
            </tr>
          </tbody>
        </table>
        <p className="hint">
          De kleding wordt gekozen op basis van de effectieve temperatuur. De drempels staan in{' '}
          <code>src/logic/clothingRules.js</code>, de correcties in{' '}
          <code>src/logic/thermalComfort.js</code>.
        </p>
      </details>
    </section>
  )
}
