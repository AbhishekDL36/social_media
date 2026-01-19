import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import './Auth.css'

function Register({ setUser }) {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await axios.post('/api/auth/register', { username, email, password })
      const { token, userId } = response.data
      localStorage.setItem('token', token)
      localStorage.setItem('userId', userId)
      setUser({ token, userId })
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>Instagram Clone</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
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
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Sign up</button>
        </form>
        {error && <p className="error">{error}</p>}
        <p>Already have an account? <Link to="/login">Log in</Link></p>
      </div>
    </div>
  )
}

export default Register
