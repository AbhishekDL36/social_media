import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import './Profile.css'

function Profile() {
  const { id } = useParams()
  const [user, setUser] = useState(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [requestSent, setRequestSent] = useState(false)
  const currentUserId = localStorage.getItem('userId')
  const isOwnProfile = currentUserId === id

  useEffect(() => {
    fetchUserProfile()
  }, [id])

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get(`/api/users/${id}`)
      setUser(response.data)
      
      // Check if current user is following this user
      if (!isOwnProfile && currentUserId) {
        const token = localStorage.getItem('token')
        const currentUserRes = await axios.get(`/api/users/${currentUserId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setIsFollowing(currentUserRes.data.following.some(followId => followId === id))
      }
      
      setLoading(false)
    } catch (err) {
      console.error('Error fetching profile:', err)
      setLoading(false)
    }
  }

  const handleFollow = async () => {
    try {
      setError('')
      const token = localStorage.getItem('token')
      const response = await axios.put(
        `/api/users/${id}/follow`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setIsFollowing(!isFollowing)
      fetchUserProfile()
    } catch (err) {
      if (err.response?.data?.isPrivate) {
        setError(err.response.data.message)
      } else {
        setError(err.response?.data?.message || 'Error following user')
      }
    }
  }

  const handleSendFollowRequest = async () => {
    try {
      setError('')
      const token = localStorage.getItem('token')
      await axios.post(
        `/api/follow-requests/send/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setRequestSent(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Error sending follow request')
    }
  }

  if (loading) return <div>Loading...</div>
  if (!user) return <div>User not found</div>

  return (
    <div className="profile">
      <div className="profile-header">
        <div className="profile-info">
          <div className="username-section">
            <h1>{user.username}</h1>
            {user.isPrivate && <span className="private-badge">🔒 Private</span>}
          </div>
          <p>{user.bio}</p>
          <div className="stats">
            <div><strong>{user.followers?.length || 0}</strong> Followers</div>
            <div><strong>{user.following?.length || 0}</strong> Following</div>
          </div>
        </div>
        {!isOwnProfile && (
          <>
            {user.isPrivate && !isFollowing && !requestSent ? (
              <button onClick={handleSendFollowRequest} className="request-btn">
                Send Request
              </button>
            ) : user.isPrivate && requestSent ? (
              <div className="request-sent">Request Sent</div>
            ) : (
              <button onClick={handleFollow} className="follow-btn">
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
          </>
        )}
      </div>
      {error && <p className="error-message">{error}</p>}
    </div>
  )
}

export default Profile
