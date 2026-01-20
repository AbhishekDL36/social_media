import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import './FollowRequests.css'

function FollowRequests() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const token = sessionStorage.getItem('token')
      const response = await axios.get('/api/follow-requests/pending', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setRequests(response.data)
    } catch (err) {
      console.error('Error fetching requests:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (requestId) => {
    try {
      const token = sessionStorage.getItem('token')
      await axios.put(`/api/follow-requests/approve/${requestId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchRequests()
    } catch (err) {
      console.error('Error approving request:', err)
      alert('Error approving request')
    }
  }

  const handleReject = async (requestId) => {
    try {
      const token = sessionStorage.getItem('token')
      await axios.put(`/api/follow-requests/reject/${requestId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchRequests()
    } catch (err) {
      console.error('Error rejecting request:', err)
      alert('Error rejecting request')
    }
  }

  if (loading) return <div className="follow-requests-container"><p>Loading...</p></div>

  return (
    <div className="follow-requests-container">
      <h2>Follow Requests</h2>

      {requests.length === 0 ? (
        <div className="empty-requests">
          <p>No follow requests</p>
        </div>
      ) : (
        <div className="requests-list">
          {requests.map((request) => (
            <div key={request._id} className="request-item">
              <img src={request.sender.profilePicture || 'https://via.placeholder.com/50'} alt={request.sender.username} />
              <div className="request-info">
                <h3 onClick={() => navigate(`/profile/${request.sender._id}`)} style={{ cursor: 'pointer' }}>
                  {request.sender.username}
                </h3>
                {request.sender.bio && <p className="bio">{request.sender.bio}</p>}
                <p className="followers">{request.sender.followers?.length || 0} followers</p>
              </div>
              <div className="request-actions">
                <button onClick={() => handleApprove(request._id)} className="approve-btn">
                  Approve
                </button>
                <button onClick={() => handleReject(request._id)} className="reject-btn">
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default FollowRequests
