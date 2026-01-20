import { useState, useEffect } from 'react'
import axios from 'axios'
import './MessageRequests.css'

function MessageRequests({ onSelectUser }) {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMessageRequests()
  }, [])

  const fetchMessageRequests = async () => {
    try {
      const token = sessionStorage.getItem('token')
      const response = await axios.get('/api/messages/requests/inbox', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setRequests(response.data)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching message requests:', err)
      setLoading(false)
    }
  }

  if (loading) {
    return <p className="loading">Loading requests...</p>
  }

  if (requests.length === 0) {
    return <p className="empty">No message requests</p>
  }

  return (
    <div className="message-requests">
      {requests.map((req) => (
        <div key={req.user._id} className="request-item">
          <img
            src={req.user.profilePicture || 'https://via.placeholder.com/50'}
            alt={req.user.username}
          />
          <div className="request-info">
            <h4>{req.user.username}</h4>
            <p className="bio">{req.user.bio || 'No bio'}</p>
            <p className="message">{req.lastMessage}</p>
          </div>
          <button onClick={() => onSelectUser(req.user)} className="view-btn">
            View
          </button>
        </div>
      ))}
    </div>
  )
}

export default MessageRequests
