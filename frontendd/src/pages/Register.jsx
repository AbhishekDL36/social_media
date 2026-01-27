import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from '../utils/axiosConfig'
import './Auth.css'

function Register({ setUser }) {
  const [step, setStep] = useState('credentials') // credentials, otp, success
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSendOTP = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    // Validate username
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
    if (!usernameRegex.test(username)) {
      setError('Username must be 3-20 characters, alphanumeric and underscores only')
      setLoading(false)
      return
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Invalid email format')
      setLoading(false)
      return
    }

    // Validate password
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    if (!passwordRegex.test(password)) {
      setError('Password must be 8+ chars with uppercase, lowercase, number, and special char (@$!%*?&)')
      setLoading(false)
      return
    }

    try {
      await axios.post('/api/auth/send-otp', { email })
      setSuccess('OTP sent to your email')
      setStep('otp')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP')
    }
    setLoading(false)
  }

  const handleVerifyAndRegister = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await axios.post('/api/auth/register', { 
        username, 
        email, 
        password, 
        otp 
      })
      const { token, userId } = response.data
      sessionStorage.setItem('token', token)
      sessionStorage.setItem('userId', userId)
      setUser({ token, userId })
      setStep('success')
      setTimeout(() => navigate('/'), 2000)
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
    }
    setLoading(false)
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>Socialix</h1>

        {step === 'credentials' && (
          <form onSubmit={handleSendOTP}>
            <input
              type="text"
              placeholder="Username (3-20 chars, alphanumeric)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
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
                placeholder="Password (8+ chars, uppercase, lowercase, number, special)"
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
            <small style={{ color: '#666', marginTop: '5px', display: 'block' }}>
              Password: Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special (@$!%*?&)
            </small>
            <button type="submit" disabled={loading}>{loading ? 'Sending OTP...' : 'Send OTP'}</button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyAndRegister}>
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.slice(0, 6))}
              maxLength="6"
              required
            />
            <button type="submit" disabled={loading}>{loading ? 'Verifying...' : 'Verify & Sign up'}</button>
            <button 
              type="button" 
              onClick={() => setStep('credentials')}
              style={{ marginTop: '10px', background: '#666' }}
            >
              Back
            </button>
          </form>
        )}

        {step === 'success' && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p style={{ color: '#0095f6', fontSize: '18px', marginBottom: '10px' }}>Registration Successful!</p>
            <p>Redirecting to home...</p>
          </div>
        )}

        {error && <p className="error">{error}</p>}
        {success && <p style={{ color: '#0095f6', marginTop: '10px' }}>{success}</p>}
        
        {step === 'credentials' && (
          <p>Already have an account? <Link to="/login">Log in</Link></p>
        )}
      </div>
    </div>
  )
}

export default Register
