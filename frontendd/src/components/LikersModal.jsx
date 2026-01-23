import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import './LikersModal.css'

function LikersModal({ postId, onClose }) {
  const [likers, setLikers] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchLikers()
  }, [postId])

  const fetchLikers = async () => {
    try {
      const token = sessionStorage.getItem('token')
      const response = await axios.get(`/api/posts/${postId}/likes`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setLikers(response.data)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching likers:', err)
      setLoading(false)
    }
  }

  return (
    <div className="likers-modal-overlay" onClick={onClose}>
      <div className="likers-modal" onClick={(e) => e.stopPropagation()}>
        <div className="likers-header">
          <h3>Liked by</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="likers-list">
          {loading ? (
            <p className="loading">Loading...</p>
          ) : likers.length === 0 ? (
            <p className="empty">No likes yet</p>
          ) : (
            likers.map((user) => (
              <div
                key={user._id}
                className="liker-item"
                onClick={() => {
                  navigate(`/profile/${user._id}`)
                  onClose()
                }}
              >
                <img
                  src={user.profilePicture || 'https://via.placeholder.com/40'}
                  alt={user.username}
                  className="liker-avatar"
                />
                <span className="liker-username">{user.username}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default LikersModal
