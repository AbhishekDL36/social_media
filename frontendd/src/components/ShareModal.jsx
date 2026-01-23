import { useState, useEffect } from 'react'
import axios from 'axios'
import './ShareModal.css'

function ShareModal({ postId, onClose }) {
  const [users, setUsers] = useState([])
  const [friends, setFriends] = useState([])
  const [chatContacts, setChatContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [sharing, setSharing] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const token = sessionStorage.getItem('token')
      
      // Get current user's friends
      const currentUserId = sessionStorage.getItem('userId')
      const userResponse = await axios.get(`/api/users/${currentUserId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const currentUser = userResponse.data
      const followingIds = currentUser.following || []
      const followerIds = currentUser.followers || []
      
      // Find mutual friends
      const friendIds = followingIds.filter(id => 
        followerIds.some(follower => String(follower) === String(id))
      )

      const response = await axios.get('/api/shares/suggest/users', {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      // Separate friends and chat contacts
      const friendsArr = response.data.filter(user => 
        friendIds.some(id => String(id) === String(user._id))
      )
      const chatArr = response.data.filter(user => 
        !friendIds.some(id => String(id) === String(user._id))
      )
      
      setFriends(friendsArr)
      setChatContacts(chatArr)
      setUsers(response.data)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching users:', err)
      setLoading(false)
    }
  }

  const handleShare = async () => {
    if (!selectedUser) {
      alert('Please select a user')
      return
    }

    setSharing(true)
    try {
      const token = sessionStorage.getItem('token')
      await axios.post(
        '/api/shares',
        {
          postId,
          userId: selectedUser._id,
          message
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      alert('Post shared successfully!')
      setSelectedUser(null)
      setMessage('')
      onClose()
    } catch (err) {
      console.error('Error sharing post:', err)
      alert(err.response?.data?.message || 'Error sharing post')
    } finally {
      setSharing(false)
    }
  }

  return (
    <div className="share-modal-overlay" onClick={onClose}>
      <div className="share-modal" onClick={(e) => e.stopPropagation()}>
        <div className="share-header">
          <h3>Share Post</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="share-content">
          {loading ? (
            <p className="loading">Loading users...</p>
          ) : users.length === 0 ? (
            <p className="empty">No users to share with</p>
          ) : (
            <>
              <div className="users-list">
                {friends.length > 0 && (
                  <>
                    <label className="section-label">👥 Friends</label>
                    <div className="users-options">
                      {friends.map((user) => (
                        <div
                          key={user._id}
                          className={`user-option ${selectedUser?._id === user._id ? 'selected' : ''}`}
                          onClick={() => setSelectedUser(user)}
                        >
                          <img
                            src={user.profilePicture || 'https://via.placeholder.com/40'}
                            alt={user.username}
                            className="user-avatar"
                          />
                          <span className="user-username">{user.username}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {chatContacts.length > 0 && (
                  <>
                    <label className="section-label">💬 Chat Contacts</label>
                    <div className="users-options">
                      {chatContacts.map((user) => (
                        <div
                          key={user._id}
                          className={`user-option ${selectedUser?._id === user._id ? 'selected' : ''}`}
                          onClick={() => setSelectedUser(user)}
                        >
                          <img
                            src={user.profilePicture || 'https://via.placeholder.com/40'}
                            alt={user.username}
                            className="user-avatar"
                          />
                          <span className="user-username">{user.username}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {selectedUser && (
                <div className="share-message">
                  <textarea
                    placeholder="Add a message (optional)"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={500}
                  />
                  <div className="char-count">{message.length}/500</div>
                </div>
              )}

              <button
                onClick={handleShare}
                disabled={!selectedUser || sharing}
                className="share-btn"
              >
                {sharing ? 'Sharing...' : 'Share'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ShareModal
