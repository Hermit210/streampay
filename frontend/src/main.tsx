import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ErrorBoundary } from './components/ui/ErrorBoundary.tsx'
import { StartupError } from './components/ui/StartupError.tsx'
import { MISSING_ENV_VARS } from './services/stellar/config.ts'
import './index.css'
import App from './App.tsx'

const root = createRoot(document.getElementById('root')!)

if (MISSING_ENV_VARS.length > 0) {
  // Render the startup error directly, without mounting the router/App
  // tree at all -- a missing env var means services/stellar/config
  // constants are empty strings, and letting the rest of the app try to
  // use them (e.g. building a contract client with an empty contract ID)
  // would fail in more confusing, harder-to-diagnose ways downstream.
  root.render(
    <StrictMode>
      <StartupError missingVars={MISSING_ENV_VARS} />
    </StrictMode>,
  )
} else {
  root.render(
    <StrictMode>
      <ErrorBoundary>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ErrorBoundary>
    </StrictMode>,
  )
}
