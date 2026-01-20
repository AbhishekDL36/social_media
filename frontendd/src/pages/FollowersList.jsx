import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import './FollowersList.css'

function FollowersList() {
  const { userId, type } = useParams() // type: 'followers' or 'following'
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const currentUserId = sessionStorage.getItem('userId')

  useEffect(() => {
    fetchUsersList()
  }, [userId, type])

  const fetchUsersList = async () => {
    try {
      setLoading(true)
      const token = sessionStorage.getItem('token')
      const response = await axios.get(`/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      const userList = type === 'followers' ? response.data.followers : response.data.following
      
      // Check if userList contains objects or IDs
      if (userList && userList.length > 0) {
        if (typeof userList[0] === 'object' && userList[0]._id) {
          // Already populated with full user objects
          setUsers(userList)
        } else {
          // Contains only IDs, fetch full user data
          const fullUsers = await Promise.all(
            userList.map(id => axios.get(`/api/users/${id}`))
          )
          setUsers(fullUsers.map(res => res.data))
        }
      } else {
        setUsers([])
      }
      setLoading(false)
    } catch (err) {
      setError(err.response?.data?.message || `Error fetching ${type}`)
      setLoading(false)
    }
  }

  if (loading) return <div className="followers-list-container"><p>Loading...</p></div>

  return (
    <div className="followers-list-container">
      <div className="followers-list-header">
        <button onClick={() => navigate(-1)} className="back-btn">← Back</button>
        <h2>{type === 'followers' ? 'Followers' : 'Following'}</h2>
      </div>

      {error && <p className="error-message">{error}</p>}

      {users.length === 0 ? (
        <p className="empty-message">No {type} yet</p>
      ) : (
        <div className="followers-list">
          {users.map((user) => (
            <div
              key={user._id}
              className="follower-item"
              onClick={() => navigate(`/profile/${user._id}`)}
            >
              <img
                src={user.profilePicture || 'https://via.placeholder.com/50'}
                alt={user.username}
                className="follower-avatar"
              />
              <div className="follower-info">
                <h4>{user.username}</h4>
                {user.bio && <p className="bio">{user.bio}</p>}
              </div>
              {currentUserId !== user._id && (
                <button className="view-btn">View</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default FollowersList
