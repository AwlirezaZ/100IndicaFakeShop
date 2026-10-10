import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router'
import App from './App'
import './index.css'
import { logo } from './lib/brand'

// Favicon set from code so it's inlined into the single-file build like the rest of the logo uses.
document.head.append(Object.assign(document.createElement('link'), { rel: 'icon', type: 'image/png', href: logo }))

// HashRouter (#/products) so the site works when opened straight from a file, without a server.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
