import { useState, useEffect } from 'react'
import axios from 'axios'
import './Settings.css'

function Settings() {
  const [user, setUser] = useState(null)
  const [isPrivate, setIsPrivate] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token')
      const userId = localStorage.getItem('userId')
      const response = await axios.get(`/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUser(response.data)
      setIsPrivate(response.data.isPrivate)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching user:', err)
      setLoading(false)
    }
  }

  const handleTogglePrivacy = async () => {
    try {
      setSaving(true)
      setMessage('')
      const token = localStorage.getItem('token')
      const response = await axios.put('/api/users/toggle-privacy', {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setIsPrivate(response.data.isPrivate)
      setMessage(response.data.message)
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error updating privacy settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="settings-container"><p>Loading...</p></div>

  return (
    <div className="settings-container">
      <div className="settings-sidebar">
        <h3>Settings</h3>
        <ul>
          <li className="active">
            <span>🔐</span> Account & Privacy
          </li>
          <li style={{ opacity: 0.5 }}>
            <span>🔔</span> Notifications
          </li>
          <li style={{ opacity: 0.5 }}>
            <span>🌙</span> Appearance
          </li>
        </ul>
      </div>

      <div className="settings-content">
        <h2>Account & Privacy</h2>

        <div className="settings-section">
          <div className="setting-item">
            <div className="setting-info">
              <h4>Account Visibility</h4>
              <p>
                {isPrivate 
                  ? '🔒 Your account is private. Users must send a follow request to see your posts.' 
                  : '🌐 Your account is public. Anyone can follow and see your posts.'}
              </p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={handleTogglePrivacy}
                disabled={saving}
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>

        {message && (
          <div className={`message ${message.includes('error') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        <div className="settings-info">
          <h4>What happens when you make your account private?</h4>
          <ul>
            <li>🔒 People must send a follow request to see your posts</li>
            <li>✅ You can approve or reject each follow request</li>
            <li>👥 Your current followers can still see your posts</li>
            <li>🔄 You can always change this back to public</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Settings
