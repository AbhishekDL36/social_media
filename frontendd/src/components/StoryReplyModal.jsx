import { useState, useEffect } from 'react'
import axios from '../utils/axiosConfig'
import './StoryReplyModal.css'

function StoryReplyModal({ storyId, storyAuthorName, onClose, onReplySuccess }) {
  const [message, setMessage] = useState('')
  const [replies, setReplies] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchReplies()
  }, [storyId])

  const fetchReplies = async () => {
    try {
      setLoading(true)
      const token = sessionStorage.getItem('token')
      const response = await axios.get(`/api/stories/${storyId}/replies`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      // Map messages to reply format
      const mappedReplies = response.data.map(msg => ({
        ...msg,
        message: msg.text // Map 'text' field to 'message'
      }))
      setReplies(mappedReplies)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching replies:', err)
      setError('Failed to load replies')
      setLoading(false)
    }
  }

  const handleSendReply = async () => {
    try {
      if (!message.trim()) {
        setError('Message cannot be empty')
        return
      }

      setSending(true)
      setError('')
      const token = sessionStorage.getItem('token')
      
      const response = await axios.post(
        `/api/stories/${storyId}/reply`,
        { message },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      // Map reply to expected format
      const mappedReply = {
        ...response.data.reply,
        message: response.data.reply.text
      }
      setReplies([...replies, mappedReply])
      setMessage('')
      onReplySuccess(mappedReply)
    } catch (err) {
      console.error('Reply error:', err)
      setError(err.response?.data?.message || 'Error sending reply')
    } finally {
      setSending(false)
    }
  }

  const formatTime = (date) => {
    const hours = Math.floor((Date.now() - new Date(date).getTime()) / 3600000)
    if (hours < 1) return 'Now'
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <div className="story-reply-modal-overlay" onClick={onClose}>
      <div className="story-reply-modal" onClick={e => e.stopPropagation()}>
        <div className="reply-modal-header">
          <h3>Message {storyAuthorName}</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="replies-container">
          {loading ? (
            <div className="loading">Loading replies...</div>
          ) : replies.length === 0 ? (
            <div className="no-replies">No replies yet. Be the first to reply!</div>
          ) : (
            <div className="replies-list">
              {replies.map(reply => (
                <div key={reply._id} className="reply-item">
                  <img
                    src={reply.sender.profilePicture || 'https://via.placeholder.com/40'}
                    alt={reply.sender.username}
                    className="reply-avatar"
                  />
                  <div className="reply-content">
                    <div className="reply-header">
                      <span className="reply-username">{reply.sender.username}</span>
                      <span className="reply-time">{formatTime(reply.createdAt)}</span>
                    </div>
                    {reply.storyReply && (
                      <div className="story-context">
                        <small>Replying to story</small>
                      </div>
                    )}
                    <p className="reply-message">{reply.message || reply.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="reply-input-section">
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Reply to story..."
            maxLength={500}
            rows={3}
          />
          <div className="reply-footer">
            <small>{message.length}/500</small>
            <button
              onClick={handleSendReply}
              disabled={sending || !message.trim()}
              className="send-reply-btn"
            >
              {sending ? 'Sending...' : 'Reply'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StoryReplyModal
