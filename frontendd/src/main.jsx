import React from 'react'
import ReactDOM from 'react-dom/client'
import axios from 'axios'
import App from './App.jsx'
import './index.css'
import './theme.css'
import './global-theme-override.css'

// Global axios error interceptor
axios.interceptors.response.use(
  response => response,
  error => {
    // Check if it's a network error
    if (!error.response) {
      // Network error - dispatch event that NetworkError component listens to
      window.dispatchEvent(new Event('networkError'))
    }
    return Promise.reject(error)
  }
)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
