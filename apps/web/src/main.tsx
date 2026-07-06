import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'

// basename = the Vite base (`import.meta.env.BASE_URL`). The preview is served under a SUB-PATH
// (/preview/<sessionId>/<projectId>/), so without this the router's "/" route never matches the
// URL and the page renders BLANK. Vite sets BASE_URL from --base; on a root deploy it's "/", so
// this is correct in both places.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
)
