import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Login from './Login.jsx'
import MusteriPanel from './MusteriPanel.jsx'

function Root() {
  const [authHeader, setAuthHeader] = useState(() => sessionStorage.getItem('authHeader'))

  if (window.location.pathname.startsWith('/panel')) {
    return <MusteriPanel />
  }

  if (!authHeader) {
    return <Login onSuccess={setAuthHeader} />
  }

  return <App />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
