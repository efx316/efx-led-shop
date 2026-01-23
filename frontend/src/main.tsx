import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary'
import './index.css'

// Add error handler for unhandled errors
window.addEventListener('error', (event) => {
  console.error('Unhandled error:', event.error)
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason)
})

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found!')
}

try {
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  )
  console.log('✅ React app mounted successfully')
} catch (error) {
  console.error('❌ Failed to mount React app:', error)
  rootElement.innerHTML = `
    <div style="padding: 20px; color: white; background: #1a1a1a; min-height: 100vh;">
      <h1>Failed to load application</h1>
      <pre>${error instanceof Error ? error.stack : String(error)}</pre>
    </div>
  `
}



