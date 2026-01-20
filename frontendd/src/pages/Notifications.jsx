import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import './Notifications.css'

function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const token = sessionStorage.getItem('token')
      const response = await axios.get('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setNotifications(response.data)
    } catch (err) {
      console.error('Error fetching notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId) => {
    try {
      const token = sessionStorage.getItem('token')
      await axios.put(`/api/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchNotifications()
    } catch (err) {
      console.error('Error marking notification as read:', err)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const token = sessionStorage.getItem('token')
      await axios.put('/api/notifications', {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchNotifications()
    } catch (err) {
      console.error('Error marking all as read:', err)
    }
  }

  if (loading) return <div className="notifications-container"><p>Loading...</p></div>

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="notifications-container">
      <div className="notifications-header">
        <h2>Notifications</h2>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllAsRead} className="mark-all-btn">
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="empty-notifications">
          <p>No notifications yet</p>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              className={`notification-item ${!notification.read ? 'unread' : ''}`}
              onClick={() => {
                if (!notification.read) {
                  handleMarkAsRead(notification._id)
                }
                if (notification.type === 'follow') {
                  navigate(`/profile/${notification.sender._id}`)
                } else if (notification.type === 'message') {
                  navigate(`/messages/${notification.sender._id}`)
                }
              }}
            >
              <img src={notification.sender.profilePicture || 'https://via.placeholder.com/40'} alt={notification.sender.username} />
              <div className="notification-content">
                <p>
                   <strong>{notification.sender.username}</strong>{' '}
                   {notification.type === 'follow' && 'followed you'}
                   {notification.type === 'like' && (notification.message?.includes('comment') ? 'liked your comment' : 'liked your post')}
                   {notification.type === 'comment' && 'commented on your post'}
                   {notification.type === 'message' && 'sent you a message'}
                </p>
                {notification.type === 'message' && (
                  <p className="notification-message">{notification.message}</p>
                )}
                {notification.type === 'comment' && (
                  <p className="notification-message">{notification.message}</p>
                )}
                <span className="notification-time">
                  {new Date(notification.createdAt).toLocaleDateString()}
                </span>
              </div>
              {!notification.read && <div className="unread-dot"></div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Notifications
