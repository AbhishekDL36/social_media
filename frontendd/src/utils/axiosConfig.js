import axios from 'axios'

// Create axios instance
const axiosInstance = axios.create({
  timeout: 10000 // 10 second timeout
})

// Add response interceptor for error handling
axiosInstance.interceptors.response.use(
  response => response,
  error => {
    if (!error.response) {
      // Network error or timeout
      if (error.code === 'ECONNABORTED') {
        console.error('Request timeout')
      } else if (error.message === 'Network Error') {
        console.error('Network error - check internet connection')
      }
    }
    return Promise.reject(error)
  }
)

export default axiosInstance
