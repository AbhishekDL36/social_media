import { useState, useEffect } from 'react'
import axios from '../utils/axiosConfig'
import './NetworkError.css'

function NetworkError() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [showError, setShowError] = useState(!navigator.onLine)

  // Check connectivity by trying to reach a simple endpoint
  const checkConnectivity = async () => {
    try {
      await axios.get('/api/posts', {
        timeout: 5000,
        headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` }
      })
      setIsOnline(true)
      setShowError(false)
    } catch (err) {
      if (!err.response || err.code === 'ECONNABORTED' || err.message === 'Network Error') {
        setIsOnline(false)
        setShowError(true)
      }
    }
  }

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      // Don't hide error immediately, let checkConnectivity verify
      checkConnectivity()
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowError(true)
    }

    const handleNetworkError = () => {
      setIsOnline(false)
      setShowError(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('networkError', handleNetworkError)

    // Also check connectivity periodically
    const interval = setInterval(checkConnectivity, 10000)

    // Check on mount
    checkConnectivity()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('networkError', handleNetworkError)
      clearInterval(interval)
    }
  }, [])

  if (!showError) return null

  return (
    <div className={`network-error ${isOnline ? 'online' : 'offline'}`}>
      <div className="error-content">
        <span className="error-icon">{isOnline ? '📡' : '❌'}</span>
        <span className="error-text">
          {isOnline ? 'Connection restored' : 'No internet connection'}
        </span>
        {isOnline && (
          <button className="close-btn" onClick={() => setShowError(false)}>
            ✕
          </button>
        )}
      </div>
    </div>
  )
}

export default NetworkError
