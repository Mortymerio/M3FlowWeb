import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './services/db'
import './safelist'
import App, { AppErrorBoundary } from './App.tsx'

// One-time migration: clear stale theme from previous Electron sessions
if (!localStorage.getItem('_web_migrated_v1')) {
  localStorage.removeItem('theme');
  localStorage.setItem('_web_migrated_v1', '1');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
)
