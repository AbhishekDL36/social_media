import { useState, useEffect } from 'react'
import axios from '../utils/axiosConfig'
import { useNavigate } from 'react-router-dom'
import Post from '../components/Post'
import './SharedPosts.css'

function SharedPosts() {
  const [shares, setShares] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    fetchSharedPosts()
  }, [])

  const fetchSharedPosts = async () => {
    try {
      setLoading(true)
      const token = sessionStorage.getItem('token')
      const response = await axios.get('/api/shares', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setShares(response.data)
      setError('')
    } catch (err) {
      console.error('Error fetching shared posts:', err)
      setError('Failed to load shared posts')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (shareId) => {
    try {
      const token = sessionStorage.getItem('token')
      await axios.delete(`/api/shares/${shareId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setShares(shares.filter(share => share._id !== shareId))
    } catch (err) {
      console.error('Error deleting share:', err)
    }
  }

  return (
    <div className="shared-posts-container">
      <div className="shared-header">
        <h1>📨 Posts Shared with Me</h1>
        <p className="subtitle">Posts shared by your friends and contacts</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <p className="loading">Loading shared posts...</p>
      ) : shares.length === 0 ? (
        <div className="empty-state">
          <p className="empty-icon">📭</p>
          <p className="empty-text">No posts shared with you yet</p>
          <p className="empty-subtext">When someone shares a post with you, it will appear here</p>
        </div>
      ) : (
        <div className="shares-list">
          {shares.map((share) => (
            <div key={share._id} className="share-card">
              <div className="share-header">
                <div className="sharer-info">
                  <img
                    src={share.sharedBy?.profilePicture || 'https://via.placeholder.com/40'}
                    alt={share.sharedBy?.username}
                    className="sharer-avatar"
                  />
                  <div className="sharer-details">
                    <p className="sharer-name">{share.sharedBy?.username}</p>
                    <p className="share-date">
                      {new Date(share.createdAt).toLocaleDateString()} at {new Date(share.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(share._id)}
                  className="delete-share-btn"
                  title="Remove"
                >
                  ✕
                </button>
              </div>

              {share.message && (
                <div className="share-message">
                  <p>"{share.message}"</p>
                </div>
              )}

              <div className="shared-post">
                {share.post && (
                  <Post post={share.post} onPostUpdate={fetchSharedPosts} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SharedPosts
