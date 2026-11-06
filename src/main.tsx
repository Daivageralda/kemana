import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import '@fontsource-variable/urbanist'
import './styles/kemana.css'
import './styles/base.css'
import App from './App.tsx'
import { cadangkanOtomatis } from './data/cadangan'

// HashRouter: aman di WebView Capacitor tanpa konfigurasi server
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)

void cadangkanOtomatis(true)
