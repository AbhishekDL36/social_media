import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from '../utils/axiosConfig'
import './PeopleYouMayKnow.css'

function PeopleYouMayKnow() {
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [followingIds, setFollowingIds] = useState(new Set())
  const navigate = useNavigate()
  const currentUserId = sessionStorage.getItem('userId')

  useEffect(() => {
    fetchSuggestions()
    fetchFollowingList()
  }, [])

  const fetchSuggestions = async () => {
    try {
      const token = sessionStorage.getItem('token')
      const response = await axios.get('/api/users/suggestions/may-know', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSuggestions(response.data)
    } catch (err) {
      console.error('Error fetching suggestions:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchFollowingList = async () => {
    try {
      const token = sessionStorage.getItem('token')
      const response = await axios.get('/api/users/friends/list', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const ids = new Set(response.data.map(user => user._id))
      setFollowingIds(ids)
    } catch (err) {
      console.error('Error fetching following list:', err)
    }
  }

  const handleFollow = async (userId) => {
    try {
      const token = sessionStorage.getItem('token')
      await axios.post(
        `/api/follow-requests/send/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setFollowingIds(new Set([...followingIds, userId]))
      setSuggestions(suggestions.filter(user => user._id !== userId))
    } catch (err) {
      console.error('Error following user:', err)
    }
  }

  const handleViewProfile = (userId) => {
    navigate(`/profile/${userId}`)
  }

  if (loading) {
    return <div className="people-loading">Loading suggestions...</div>
  }

  if (suggestions.length === 0) {
    return <div className="people-empty">No suggestions at this time</div>
  }

  return (
    <div className="people-container">
      <div className="people-header">
        <h2>People You May Know</h2>
      </div>
      <div className="people-grid">
        {suggestions.map((user) => (
          <div key={user._id} className="person-card">
            <img
              src={user.profilePicture || 'https://via.placeholder.com/100'}
              alt={user.username}
              className="person-avatar"
              onClick={() => handleViewProfile(user._id)}
            />
            <div className="person-info">
              <h3 onClick={() => handleViewProfile(user._id)} className="person-username">
                {user.username}
              </h3>
              {user.bio && <p className="person-bio">{user.bio}</p>}
              <p className="mutual-friends">
                {user.mutualFriends} mutual friend{user.mutualFriends !== 1 ? 's' : ''}
              </p>
              {followingIds.has(user._id) ? (
                <button className="following-btn" disabled>
                  ✓ Following
                </button>
              ) : (
                <button
                  onClick={() => handleFollow(user._id)}
                  className="follow-btn"
                >
                  Follow
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PeopleYouMayKnow
