import { useState, useEffect } from 'react'
import axios from '../utils/axiosConfig'
import './ShareStoryModal.css'

function ShareStoryModal({ storyId, onClose, onSuccess }) {
  const [friends, setFriends] = useState([])
  const [selectedFriends, setSelectedFriends] = useState([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sharing, setSharing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchFriends()
  }, [])

  const fetchFriends = async () => {
    try {
      setLoading(true)
      const token = sessionStorage.getItem('token')
      const userId = sessionStorage.getItem('userId')
      
      const response = await axios.get(`/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      // Get details of all following users
      const followingIds = response.data.following || []
      const friendDetails = await Promise.all(
        followingIds.map(id => 
          axios.get(`/api/users/${typeof id === 'string' ? id : id._id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        )
      )
      
      setFriends(friendDetails.map(res => res.data))
      setLoading(false)
    } catch (err) {
      console.error('Error fetching friends:', err)
      setError('Failed to load friends')
      setLoading(false)
    }
  }

  const handleFriendSelect = (friendId) => {
    setSelectedFriends(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    )
  }

  const handleShare = async () => {
    try {
      if (selectedFriends.length === 0) {
        setError('Please select at least one friend')
        return
      }

      setSharing(true)
      setError('')
      const token = sessionStorage.getItem('token')
      
      const response = await axios.post(
        `/api/stories/${storyId}/share`,
        {
          friendIds: selectedFriends,
          message: message || null
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      onSuccess(response.data)
      onClose()
    } catch (err) {
      console.error('Share error:', err)
      setError(err.response?.data?.message || 'Error sharing story')
    } finally {
      setSharing(false)
    }
  }

  return (
    <div className="share-story-modal-overlay" onClick={onClose}>
      <div className="share-story-modal" onClick={e => e.stopPropagation()}>
        <div className="share-story-header">
          <h2>Share Story</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading">Loading friends...</div>
        ) : (
          <>
            <div className="share-story-friends">
              <h3>Select friends to share with:</h3>
              {friends.length === 0 ? (
                <p className="no-friends">You haven't followed anyone yet</p>
              ) : (
                <div className="friends-list">
                  {friends.map(friend => (
                    <label key={friend._id} className="friend-item">
                      <input
                        type="checkbox"
                        checked={selectedFriends.includes(friend._id)}
                        onChange={() => handleFriendSelect(friend._id)}
                      />
                      <img
                        src={friend.profilePicture || 'https://via.placeholder.com/40'}
                        alt={friend.username}
                        className="friend-avatar"
                      />
                      <span className="friend-name">{friend.username}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="share-story-message">
              <textarea
                placeholder="Add a message (optional)"
                value={message}
                onChange={e => setMessage(e.target.value)}
                maxLength={200}
              />
              <small>{message.length}/200</small>
            </div>

            <div className="share-story-actions">
              <button
                className="cancel-btn"
                onClick={onClose}
                disabled={sharing}
              >
                Cancel
              </button>
              <button
                className="share-btn"
                onClick={handleShare}
                disabled={sharing || selectedFriends.length === 0}
              >
                {sharing ? 'Sharing...' : 'Share'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ShareStoryModal
