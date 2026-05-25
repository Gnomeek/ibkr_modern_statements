import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { StatementProvider } from './context/StatementContext'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <StatementProvider>
        <App />
      </StatementProvider>
    </HashRouter>
  </StrictMode>
)
