import { useState } from 'react'
import axios from '../utils/axiosConfig'
import './ForgotPasswordModal.css'

function ForgotPasswordModal({ isOpen, onClose, initialEmail = '' }) {
  const [step, setStep] = useState('email') // email, otp, newpassword
  const [email, setEmail] = useState(initialEmail)
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSendOTP = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await axios.post('/api/auth/forgot-password', { email })
      setSuccess('OTP sent to your email')
      setStep('otp')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = (e) => {
    e.preventDefault()
    setError('')

    if (otp.length !== 6) {
      setError('OTP must be 6 digits')
      return
    }

    setStep('newpassword')
    setSuccess('')
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      setLoading(false)
      return
    }

    try {
      await axios.post('/api/auth/reset-password', {
        email,
        otp,
        newPassword
      })
      setSuccess('Password reset successful! Redirecting to login...')
      setTimeout(() => {
        onClose()
        setStep('email')
        setEmail('')
        setOtp('')
        setNewPassword('')
        setConfirmPassword('')
      }, 2000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="forgot-password-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Reset Password</h2>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>

        <form className="modal-form">
          {step === 'email' && (
            <>
              <p className="step-info">Enter your email to receive OTP</p>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button
                type="submit"
                onClick={handleSendOTP}
                disabled={loading || !email}
              >
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </>
          )}

          {step === 'otp' && (
            <>
              <p className="step-info">Enter the OTP sent to {email}</p>
              <input
                type="text"
                placeholder="6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                maxLength="6"
                required
              />
              <button
                type="submit"
                onClick={handleVerifyOTP}
                disabled={otp.length !== 6}
              >
                Verify OTP
              </button>
              <button
                type="button"
                onClick={() => setStep('email')}
                className="back-btn"
              >
                Back
              </button>
            </>
          )}

          {step === 'newpassword' && (
            <>
              <p className="step-info">Set your new password</p>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <small>Password must be 8+ characters with uppercase, lowercase, number, and special character</small>
              <button
                type="submit"
                onClick={handleResetPassword}
                disabled={loading || !newPassword || !confirmPassword}
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
              <button
                type="button"
                onClick={() => setStep('otp')}
                className="back-btn"
              >
                Back
              </button>
            </>
          )}

          {error && <p className="error">{error}</p>}
          {success && <p className="success">{success}</p>}
        </form>
      </div>
    </div>
  )
}

export default ForgotPasswordModal
