import { useState, useEffect } from 'react'
import axios from '../utils/axiosConfig'
import './NotificationCenter.css'

function NotificationCenter() {
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('all') // all, mention, comment, like

  useEffect(() => {
    fetchUnreadCount()
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (showNotifications) {
      fetchNotifications()
    }
  }, [showNotifications, filter])

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

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const token = sessionStorage.getItem('token')
      let url = '/api/notifications'
      
      if (filter === 'mention') {
        url = '/api/notifications/mentions'
      }

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      })

      // Filter by type if not using mention endpoint
      let filtered = response.data
      if (filter !== 'all' && filter !== 'mention') {
        filtered = response.data.filter(n => n.type === filter)
      }

      setNotifications(filtered)
    } catch (err) {
      console.error('Error fetching notifications:', err)
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId) => {
    try {
      const token = sessionStorage.getItem('token')
      await axios.put(
        `/api/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setNotifications(
        notifications.map(n =>
          n._id === notificationId ? { ...n, read: true } : n
        )
      )

      // Update unread count
      setUnreadCount(Math.max(0, unreadCount - 1))
    } catch (err) {
      console.error('Error marking notification as read:', err)
    }
  }

  const markAllAsRead = async () => {
    try {
      const token = sessionStorage.getItem('token')
      await axios.put(
        '/api/notifications',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setNotifications(
        notifications.map(n => ({ ...n, read: true }))
      )
      setUnreadCount(0)
    } catch (err) {
      console.error('Error marking all notifications as read:', err)
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'mention':
        return '🔔'
      case 'comment':
        return '💬'
      case 'like':
        return '❤️'
      case 'follow':
        return '👤'
      case 'reaction':
        return '😊'
      default:
        return '📬'
    }
  }

  const getNotificationText = (notification) => {
    switch (notification.type) {
      case 'mention':
        return `mentioned you in a ${notification.mentionedIn}`
      case 'comment':
        return `commented on your post`
      case 'like':
        return `liked your comment`
      case 'follow':
        return `started following you`
      case 'reaction':
        return `reacted to your post`
      default:
        return 'sent you a notification'
    }
  }

  return (
    <div className="notification-center">
      {/* Bell Icon */}
      <button
        className="notification-bell"
        onClick={() => setShowNotifications(!showNotifications)}
        title="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {/* Notification Panel */}
      {showNotifications && (
        <div className="notification-panel">
          {/* Header */}
          <div className="notification-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button
                className="mark-all-read-btn"
                onClick={markAllAsRead}
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="notification-filters">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              className={`filter-btn ${filter === 'mention' ? 'active' : ''}`}
              onClick={() => setFilter('mention')}
            >
              Mentions
            </button>
            <button
              className={`filter-btn ${filter === 'comment' ? 'active' : ''}`}
              onClick={() => setFilter('comment')}
            >
              Comments
            </button>
            <button
              className={`filter-btn ${filter === 'like' ? 'active' : ''}`}
              onClick={() => setFilter('like')}
            >
              Likes
            </button>
          </div>

          {/* Notification List */}
          <div className="notification-list">
            {loading ? (
              <p className="notification-empty">Loading...</p>
            ) : notifications.length === 0 ? (
              <p className="notification-empty">No notifications</p>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification._id}
                  className={`notification-item ${!notification.read ? 'unread' : ''}`}
                  onClick={() => {
                    if (!notification.read) {
                      markAsRead(notification._id)
                    }
                  }}
                >
                  {/* Avatar */}
                  <img
                    src={
                      notification.sender?.profilePicture ||
                      'https://via.placeholder.com/40'
                    }
                    alt={notification.sender?.username}
                    className="notification-avatar"
                  />

                  {/* Content */}
                  <div className="notification-content">
                    <p className="notification-text">
                      <strong>{notification.sender?.username}</strong>{' '}
                      {getNotificationText(notification)}
                    </p>
                    {notification.type === 'mention' && (
                      <p className="notification-quote">
                        "{notification.message.substring(0, 50)}
                        {notification.message.length > 50 ? '...' : ''}"
                      </p>
                    )}
                    <p className="notification-time">
                      {new Date(notification.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Status Indicator */}
                  <div className="notification-status">
                    {notification.type === 'mention' && (
                      <span className="mention-badge">@mention</span>
                    )}
                    {!notification.read && (
                      <div className="unread-dot"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationCenter
