import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Intercept global fetch to automatically append the high security x-access-token header
const originalFetch = window.fetch;
window.fetch = async function (url, options = {}) {
  const token = localStorage.getItem('markflow_access_token');
  if (token) {
    options.headers = {
      ...options.headers,
      'x-access-token': token
    };
  }
  return originalFetch(url, options);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
