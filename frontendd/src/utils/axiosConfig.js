import axios from 'axios'

// Create axios instance
const axiosInstance = axios.create({
  baseURL: 'https://social-media-7b30.onrender.com', // Hardcoded backend URL
  timeout: 10000, // 10 second timeout
  withCredentials: true // Send credentials with requests
})

// Add request interceptor to log requests
axiosInstance.interceptors.request.use(
  config => {
    const token = sessionStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    console.log(`📤 Requesting: ${config.method.toUpperCase()} ${config.baseURL}${config.url}`)
    return config
  },
  error => Promise.reject(error)
)

// Add response interceptor for error handling
axiosInstance.interceptors.response.use(
  response => {
    console.log(`📥 Response: ${response.status} ${response.config.url}`)
    return response
  },
  error => {
    console.error(`❌ Error: ${error.response?.status || 'Network'} ${error.config?.url}`, error.message)
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
