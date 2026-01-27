import { useState, useEffect } from 'react'
import axios from '../utils/axiosConfig'
import { Link } from 'react-router-dom'
import './StoryReplies.css'

function StoryReplies() {
  const [replies, setReplies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchStoryReplies()
  }, [])

  const fetchStoryReplies = async () => {
    try {
      setLoading(true)
      const token = sessionStorage.getItem('token')
      const response = await axios.get('/api/stories/replies/received/all', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setReplies(response.data)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching story replies:', err)
      setError('Failed to load story replies')
      setLoading(false)
    }
  }

  const formatTime = (date) => {
    const now = new Date()
    const replyDate = new Date(date)
    const diffMs = now - replyDate
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return replyDate.toLocaleDateString()
  }

  if (loading) {
    return <div className="story-replies-page"><p>Loading story replies...</p></div>
  }

  return (
    <div className="story-replies-page">
      <div className="story-replies-container">
        <h1>Story Replies</h1>

        {error && <div className="error-message">{error}</div>}

        {replies.length === 0 ? (
          <div className="no-replies-message">
            <p>No one has replied to your stories yet.</p>
            <p>Share a story to get replies from your followers!</p>
          </div>
        ) : (
          <div className="replies-groups">
            {replies.map(reply => (
              <div key={reply._id} className="reply-group">
                <div className="story-thumbnail-section">
                  <img
                    src={reply.story.media || 'https://via.placeholder.com/100'}
                    alt="Story"
                    className="story-thumbnail"
                  />
                  <div className="story-info">
                    <small className="story-type">
                      {reply.story.mediaType === 'image' ? '📷 Image' : '🎥 Video'}
                    </small>
                    {reply.story.caption && (
                      <p className="story-caption">{reply.story.caption}</p>
                    )}
                  </div>
                </div>

                <div className="reply-message-section">
                  <Link to={`/profile/${reply.sender._id}`} className="sender-info">
                    <img
                      src={reply.sender.profilePicture || 'https://via.placeholder.com/40'}
                      alt={reply.sender.username}
                      className="sender-avatar"
                    />
                    <div>
                      <h4>{reply.sender.username}</h4>
                      <small>{formatTime(reply.createdAt)}</small>
                    </div>
                  </Link>
                  <p className="reply-text">{reply.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default StoryReplies
