import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from '../utils/axiosConfig'
import ForgotPasswordModal from '../components/ForgotPasswordModal'
import './Auth.css'

function Login({ setUser }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await axios.post('/api/auth/login', { email, password })
      const { token, userId } = response.data
      sessionStorage.setItem('token', token)
      sessionStorage.setItem('userId', userId)
      setUser({ token, userId })
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed')
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>Socialix</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="password-input-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          <button type="submit">Log in</button>
          </form>
          {error && <p className="error">{error}</p>}
          <p>
           <button
             type="button"
             onClick={() => {
               if (!email) {
                 setError('Please enter your email first')
                 return
               }
               setShowForgotPassword(true)
             }}
             className="forgot-password-btn"
           >
             Forgot password?
           </button>
          </p>
          <p>Don't have an account? <Link to="/register">Sign up</Link></p>
          </div>

          <ForgotPasswordModal
          isOpen={showForgotPassword}
          onClose={() => setShowForgotPassword(false)}
          initialEmail={email}
          />
          </div>
          )
          }

          export default Login
