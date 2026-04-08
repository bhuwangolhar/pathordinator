import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'

// DEBUG: Verify API configuration is correct
console.log('🔗 ENV API URL:', import.meta.env.VITE_API_URL);
console.log('📦 BUILD MODE:', import.meta.env.MODE);
console.log('🌍 IS PRODUCTION:', import.meta.env.PROD);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
