import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import axios from 'axios'
import './Navbar.css'
import StoryUploader from './StoryUploader'

function Navbar({ toggleTheme, theme }) {
  const navigate = useNavigate()
  const userId = sessionStorage.getItem('userId')
  const [unreadCount, setUnreadCount] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [showStoryUploader, setShowStoryUploader] = useState(false)

  useEffect(() => {
    fetchUnreadCount()
    fetchUnreadMessages()
    // Refresh unread count every 5 seconds
    const interval = setInterval(() => {
      fetchUnreadCount()
      fetchUnreadMessages()
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchUnreadCount = async () => {
    try {
      const token = sessionStorage.getItem('token')
      const response = await axios.get('/api/notifications/unread/count', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUnreadCount(response.data.unreadCount)
    } catch (err) {
      console.error('Error fetching unread count:', err)
    }
  }

  const fetchUnreadMessages = async () => {
    try {
      const token = sessionStorage.getItem('token')
      // Get unread messages
      const msgResponse = await axios.get('/api/messages/unread/count', {
        headers: { Authorization: `Bearer ${token}` }
      })
      // Get unread message notifications
      const notifResponse = await axios.get('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const unreadMessageNotifs = notifResponse.data.filter(n => n.type === 'message' && !n.read).length
      setUnreadMessages(msgResponse.data.unreadCount + unreadMessageNotifs)
    } catch (err) {
      console.error('Error fetching unread messages:', err)
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('userId')
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <h1 onClick={() => navigate('/')} className="logo">Instagram Clone</h1>
        <div className="nav-links">
          <button onClick={() => navigate('/')} className="nav-link">Feed</button>
          <button onClick={() => navigate('/search')} className="nav-link">Search</button>
          <button onClick={() => navigate('/follow-requests')} className="nav-link">Requests</button>
          <button onClick={() => navigate('/messages')} className="nav-link messages-link">
            Messages
            {unreadMessages > 0 && <span className="badge">{unreadMessages}</span>}
          </button>
          <button onClick={() => {
            navigate('/notifications')
            setUnreadCount(0)
          }} className="nav-link notifications-link">
            Notifications
            {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
          </button>
          <button onClick={() => navigate('/groups')} className="nav-link">👥 Groups</button>
          <button onClick={() => navigate(`/profile/${userId}`)} className="nav-link">My Profile</button>
          <button 
            onClick={() => {
              console.log('Story button clicked')
              setShowStoryUploader(true)
            }} 
            className="nav-link story-btn" 
            title="Add Story"
          >
            📖
          </button>
          <button onClick={toggleTheme} className="nav-link theme-toggle-btn" title="Toggle Dark Mode">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button onClick={() => navigate('/settings')} className="nav-link settings-link">⚙️</button>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </div>

      {showStoryUploader && (
        <StoryUploader 
          isOpen={showStoryUploader}
          setIsOpen={setShowStoryUploader}
          onStoryAdded={() => {
            setShowStoryUploader(false)
          }}
          onClose={() => setShowStoryUploader(false)}
        />
      )}
    </nav>
  )
}

export default Navbar
