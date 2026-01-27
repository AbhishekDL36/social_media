import { useState, useEffect } from 'react'
import axios from 'axios'
import './Settings.css'

function Settings({ theme, toggleTheme }) {
  const [user, setUser] = useState(null)
  const [isPrivate, setIsPrivate] = useState(false)
  const [blockedUsers, setBlockedUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState('profile') // 'profile', 'privacy' or 'blocked'
  const [bio, setBio] = useState('')
  const [profilePicture, setProfilePicture] = useState(null)
  const [profilePicturePreview, setProfilePicturePreview] = useState(null)
  const [relationshipStatus, setRelationshipStatus] = useState('')

  useEffect(() => {
    fetchUserData()
    if (activeTab === 'blocked') {
      fetchBlockedUsers()
    }
  }, [activeTab])

  const fetchUserData = async () => {
    try {
      const token = sessionStorage.getItem('token')
      const userId = sessionStorage.getItem('userId')
      const response = await axios.get(`/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUser(response.data)
      setIsPrivate(response.data.isPrivate)
      setBio(response.data.bio || '')
      setRelationshipStatus(response.data.relationshipStatus || 'prefer not to say')
      setProfilePicturePreview(response.data.profilePicture)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching user:', err)
      setLoading(false)
    }
  }

  const fetchBlockedUsers = async () => {
    try {
      const token = sessionStorage.getItem('token')
      const response = await axios.get('/api/users/blocked/list', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setBlockedUsers(response.data)
    } catch (err) {
      console.error('Error fetching blocked users:', err)
    }
  }

  const handleUnblockUser = async (userId) => {
    try {
      const token = sessionStorage.getItem('token')
      await axios.post(`/api/users/${userId}/unblock`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setBlockedUsers(blockedUsers.filter(user => user._id !== userId))
      setMessage('User unblocked')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error unblocking user')
    }
  }

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setProfilePicture(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      setMessage('')
      const token = sessionStorage.getItem('token')
      const formData = new FormData()
      formData.append('bio', bio)
      formData.append('relationshipStatus', relationshipStatus)
      if (profilePicture) {
        formData.append('profilePicture', profilePicture)
      }

      const response = await axios.put('/api/users/me/profile', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      })

      setUser(response.data.user)
      setProfilePicture(null)
      setMessage(response.data.message)
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error updating profile')
    } finally {
      setSaving(false)
    }
  }

  const handleTogglePrivacy = async () => {
    try {
      setSaving(true)
      setMessage('')
      const token = sessionStorage.getItem('token')
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
          <li 
            className={activeTab === 'profile' ? 'active' : ''}
            onClick={() => setActiveTab('profile')}
          >
            <span>👤</span> Edit Profile
          </li>
          <li 
            className={activeTab === 'privacy' ? 'active' : ''}
            onClick={() => setActiveTab('privacy')}
          >
            <span>🔐</span> Account & Privacy
          </li>
          <li 
            className={activeTab === 'blocked' ? 'active' : ''}
            onClick={() => setActiveTab('blocked')}
          >
            <span>🚫</span> Blocked Users
          </li>
          <li 
            className={activeTab === 'appearance' ? 'active' : ''}
            onClick={() => setActiveTab('appearance')}
          >
            <span>🌙</span> Appearance
          </li>
          <li style={{ opacity: 0.5 }}>
            <span>🔔</span> Notifications
          </li>
        </ul>
      </div>

      <div className="settings-content">
        {activeTab === 'profile' && (
        <>
        <h2>Edit Profile</h2>
        {message && (
          <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}
        <form onSubmit={handleUpdateProfile} className="profile-form">
          <div className="form-group">
            <label>Profile Picture</label>
            <div className="profile-picture-section">
              {profilePicturePreview && (
                <img src={profilePicturePreview} alt="Profile Preview" className="profile-preview" />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleProfilePictureChange}
                className="file-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Write something about yourself..."
              maxLength="150"
              className="bio-textarea"
            />
            <p className="char-count">{bio.length}/150</p>
          </div>

          <div className="form-group">
            <label htmlFor="relationshipStatus">Relationship Status</label>
            <select
              id="relationshipStatus"
              value={relationshipStatus}
              onChange={(e) => setRelationshipStatus(e.target.value)}
              className="relationship-select"
            >
              <option value="single">Single</option>
              <option value="married">Married</option>
              <option value="divorced">Divorced</option>
              <option value="prefer not to say">Prefer not to say</option>
            </select>
          </div>

          <button type="submit" disabled={saving} className="save-btn">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
        </>
        )}

        {activeTab === 'privacy' && (
        <>
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
        </>
        )}

        {activeTab === 'appearance' && (
        <>
        <h2>Appearance</h2>
        <div className="settings-section">
          <div className="setting-item">
            <div className="setting-info">
              <h4>Dark Mode</h4>
              <p>
                {theme === 'dark' 
                  ? '🌙 Dark theme is enabled. Easy on the eyes.' 
                  : '☀️ Light theme is enabled. Clear and bright.'}
              </p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={theme === 'dark'}
                onChange={toggleTheme}
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>
        </>
        )}

        {activeTab === 'blocked' && (
        <>
        <h2>Blocked Users</h2>
        {message && (
          <div className={`message ${message.includes('error') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}
        <div className="blocked-users-list">
          {blockedUsers.length === 0 ? (
            <p className="no-blocked">You haven't blocked any users</p>
          ) : (
            blockedUsers.map(user => (
              <div key={user._id} className="blocked-user-item">
                <img src={user.profilePicture || 'https://via.placeholder.com/40'} alt={user.username} />
                <div className="blocked-user-info">
                  <h4>{user.username}</h4>
                  <p>{user.bio || 'No bio'}</p>
                </div>
                <button 
                  onClick={() => handleUnblockUser(user._id)}
                  className="unblock-action-btn"
                >
                  Unblock
                </button>
              </div>
            ))
          )}
        </div>
        </>
        )}
      </div>
    </div>
  )
}

export default Settings
