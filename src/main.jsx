/**
 * main.jsx — startpunt van de app
 * ------------------------------------------------------------------
 * Koppelt React aan het <div id="root"> uit index.html.
 * https://react.dev/reference/react-dom/client/createRoot
 *
 * <StrictMode> voert in ontwikkelmodus extra controles uit (o.a. Effects
 * twee keer draaien) om bugs vroeg te vinden. In productie doet het niets.
 * https://react.dev/reference/react/StrictMode
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
