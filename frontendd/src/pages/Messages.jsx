import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate, useSearchParams } from 'react-router-dom'
import './Messages.css'
import ChatWindow from '../components/ChatWindow'
import MessageRequests from '../components/MessageRequests'

function Messages() {
  const [conversations, setConversations] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [view, setView] = useState('chats') // 'chats' or 'requests'
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const userId = searchParams.get('user')
    if (userId) {
      // Fetch user data and select them
      fetchAndSelectUser(userId)
    }
    fetchConversations()
  }, [view, searchParams])

  const fetchAndSelectUser = async (userId) => {
    try {
      const token = sessionStorage.getItem('token')
      const response = await axios.get(`/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSelectedUser(response.data)
    } catch (err) {
      console.error('Error fetching user:', err)
    }
  }

  const fetchConversations = async () => {
    try {
      setLoading(true)
      const token = sessionStorage.getItem('token')
      const response = await axios.get('/api/messages', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setConversations(response.data)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching conversations:', err)
      setLoading(false)
    }
  }

  return (
    <div className="messages-container">
      <div className="messages-header">
        <h2>Messages</h2>
      </div>

      <div className="messages-tabs">
        <button
          className={`tab ${view === 'chats' ? 'active' : ''}`}
          onClick={() => setView('chats')}
        >
          Chats
        </button>
        <button
          className={`tab ${view === 'requests' ? 'active' : ''}`}
          onClick={() => setView('requests')}
        >
          Requests
        </button>
      </div>

      <div className="messages-content">
        {view === 'chats' ? (
          <>
            {loading ? (
              <p className="loading">Loading chats...</p>
            ) : conversations.length === 0 ? (
              <p className="empty">No conversations yet</p>
            ) : (
              <div className="conversations-list">
                {conversations.map((conv) => (
                  <div
                    key={conv.user._id}
                    className={`conversation-item ${selectedUser?._id === conv.user._id ? 'active' : ''}`}
                    onClick={() => setSelectedUser(conv.user)}
                  >
                    <img
                      src={conv.user.profilePicture || 'https://via.placeholder.com/40'}
                      alt={conv.user.username}
                    />
                    <div className="conversation-info">
                      <h4>{conv.user.username}</h4>
                      <p>{conv.lastMessage.substring(0, 40)}...</p>
                    </div>
                    {conv.unreadCount > 0 && (
                      <span className="unread-badge">{conv.unreadCount}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <MessageRequests onSelectUser={setSelectedUser} />
        )}
      </div>

      {selectedUser && (
        <ChatWindow user={selectedUser} onBack={() => setSelectedUser(null)} />
      )}
    </div>
  )
}

export default Messages
