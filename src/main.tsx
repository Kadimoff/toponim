import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/piazzolla/opsz.css'
import '@fontsource/ibm-plex-sans/400.css'
import '@fontsource/ibm-plex-sans/500.css'
import '@fontsource/ibm-plex-sans/600.css'
import './index.css'
import { I18nProvider } from './i18n'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </StrictMode>,
)
