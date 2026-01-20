import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import axios from 'axios'
import './Navbar.css'

function Navbar() {
  const navigate = useNavigate()
  const userId = sessionStorage.getItem('userId')
  const [unreadCount, setUnreadCount] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)

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
          <button onClick={() => navigate(`/profile/${userId}`)} className="nav-link">My Profile</button>
          <button onClick={() => navigate('/settings')} className="nav-link settings-link">⚙️</button>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
