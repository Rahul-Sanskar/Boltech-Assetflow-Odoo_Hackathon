import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import API from './api/API.js'

// Check backend and database connectivity
API.get('/health')
  .then(() => {
    console.log('Backend is connected with database');
  })
  .catch((err) => {
    console.error('Failed to verify database connectivity:', err);
  });

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
     <AuthProvider>
      <App />
     </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)

