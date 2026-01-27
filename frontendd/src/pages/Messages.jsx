import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate, useParams } from 'react-router-dom'
import './Messages.css'
import ChatWindow from '../components/ChatWindow'
import MessageRequests from '../components/MessageRequests'
import Post from '../components/Post'
import GroupChatModal from '../components/GroupChatModal'

// Component to display group chat in Messages
function GroupChat({ group, onBack }) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <GroupChatModal 
        group={group} 
        onClose={onBack}
      />
    </div>
  )
}

function Messages() {
  const [conversations, setConversations] = useState([])
  const [groups, setGroups] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [sharedPosts, setSharedPosts] = useState([])
  const [sharedWithUsers, setSharedWithUsers] = useState([]) // Users I've shared with
  const [view, setView] = useState('chats') // 'chats', 'requests', or 'shared'
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { userId } = useParams()

  useEffect(() => {
    if (userId) {
      // Fetch user data and select them
      fetchAndSelectUser(userId)
    }
    if (view === 'chats' || view === 'requests') {
      fetchConversations()
      fetchGroups()
    } else if (view === 'shared') {
      // Fetch list of users I've shared with
      fetchSharedWithUsers()
      // If a user is selected, fetch their posts too
      if (selectedUser) {
        fetchSharedPosts(selectedUser._id)
      }
    }
  }, [view, userId, selectedUser?._id])

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

  const fetchGroups = async () => {
    try {
      const token = sessionStorage.getItem('token')
      const response = await axios.get('/api/groups', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setGroups(response.data)
    } catch (err) {
      console.error('Error fetching groups:', err)
    }
  }

  const fetchSharedWithUsers = async () => {
    try {
      const token = sessionStorage.getItem('token')
      const response = await axios.get('/api/shares/shared-with/list', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSharedWithUsers(response.data)
    } catch (err) {
      console.error('Error fetching shared-with users:', err)
    }
  }

  const fetchSharedPosts = async (targetUserId) => {
    try {
      setLoading(true)
      const token = sessionStorage.getItem('token')
      const response = await axios.get('/api/shares', {
        params: { userId: targetUserId },
        headers: { Authorization: `Bearer ${token}` }
      })
      setSharedPosts(response.data)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching shared posts:', err)
      setLoading(false)
    }
  }

  const handleDeleteShare = async (shareId) => {
    try {
      const token = sessionStorage.getItem('token')
      await axios.delete(`/api/shares/${shareId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSharedPosts(sharedPosts.filter(share => share._id !== shareId))
    } catch (err) {
      console.error('Error deleting share:', err)
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
          <button
            className={`tab ${view === 'shared' ? 'active' : ''}`}
            onClick={() => setView('shared')}
          >
            📤 Shared ({selectedUser ? sharedPosts.length : 0})
          </button>
       </div>

       <div className="messages-wrapper">
       <div className="messages-content">
        {view === 'shared' ? (
          // Shared view - show users I've shared with
          <>
            {sharedWithUsers.length === 0 ? (
              <p className="empty">You haven't shared any posts yet</p>
            ) : (
              <div className="conversations-list">
                {sharedWithUsers.map((share) => (
                  <div
                    key={share.user._id}
                    className={`conversation-item ${selectedUser?._id === share.user._id ? 'active' : ''}`}
                    onClick={() => setSelectedUser(share.user)}
                  >
                    <img
                      src={share.user.profilePicture || 'https://via.placeholder.com/40'}
                      alt={share.user.username}
                    />
                    <div className="conversation-info">
                      <h4>{share.user.username}</h4>
                      <p>{share.count} post{share.count !== 1 ? 's' : ''} shared</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : view === 'chats' ? (
          <>
            {loading ? (
              <p className="loading">Loading chats...</p>
            ) : conversations.length === 0 && groups.length === 0 ? (
              <p className="empty">No conversations yet</p>
            ) : (
              <div className="conversations-list">
                {/* Groups Section */}
                {groups.length > 0 && (
                  <>
                    <div className="conversations-section-header">👥 Groups</div>
                    {groups.map((group) => (
                      <div
                        key={`group-${group._id}`}
                        className={`conversation-item group-item ${selectedGroup?._id === group._id ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedGroup(group)
                          setSelectedUser(null)
                        }}
                      >
                        <img
                          src={group.profilePicture || 'https://via.placeholder.com/40?text=Group'}
                          alt={group.name}
                          className="group-avatar"
                        />
                        <div className="conversation-info">
                          <h4>{group.name}</h4>
                          <p>{group.members.length} members</p>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {/* Direct Messages Section */}
                {conversations.length > 0 && (
                  <>
                    <div className="conversations-section-header">💬 Direct Messages</div>
                    {conversations.map((conv) => (
                      <div
                        key={`user-${conv.user._id}`}
                        className={`conversation-item ${selectedUser?._id === conv.user._id ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedUser(conv.user)
                          setSelectedGroup(null)
                        }}
                      >
                        <img
                          src={conv.user.profilePicture || 'https://via.placeholder.com/40'}
                          alt={conv.user.username}
                        />
                        <div className="conversation-info">
                          <h4>{conv.user.username}</h4>
                          <p>{conv.lastMessage ? conv.lastMessage.substring(0, 40) + '...' : '🎙️ Voice message'}</p>
                        </div>
                        {conv.unreadCount > 0 && (
                          <span className="unread-badge">{conv.unreadCount}</span>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </>
        ) : view === 'requests' ? (
          <MessageRequests onSelectUser={setSelectedUser} />
        ) : null}
        </div>

        {view === 'shared' && selectedUser && (
        <div className="shared-posts-view">
          <div className="shared-posts-header">
            <h3>Posts shared with {selectedUser.username}</h3>
          </div>
          {loading ? (
            <p className="loading">Loading shared posts...</p>
          ) : sharedPosts.length === 0 ? (
            <p className="empty">No posts shared with {selectedUser.username}</p>
          ) : (
            <div className="shared-posts-list">
              {sharedPosts.map((share) => (
                <div key={share._id} className="shared-post-item">
                  <div className="share-header">
                    <div className="sharer-info">
                      <p className="share-label">Shared {new Date(share.createdAt).toLocaleTimeString()}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteShare(share._id)}
                      className="delete-btn"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                  {share.message && (
                    <p className="share-message">"{share.message}"</p>
                  )}
                  {share.post && (
                    <Post post={share.post} onPostUpdate={() => fetchSharedPosts(selectedUser._id)} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        )}

      {selectedUser && (
        <ChatWindow user={selectedUser} onBack={() => setSelectedUser(null)} />
      )}

      {selectedGroup && (
        <GroupChat group={selectedGroup} onBack={() => setSelectedGroup(null)} />
      )}
       </div>
    </div>
  )
}

export default Messages
