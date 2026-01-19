import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import './Profile.css'

function Profile() {
  const { id } = useParams()
  const [user, setUser] = useState(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserProfile()
  }, [id])

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get(`/api/users/${id}`)
      setUser(response.data)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching profile:', err)
      setLoading(false)
    }
  }

  const handleFollow = async () => {
    try {
      const token = localStorage.getItem('token')
      await axios.put(
        `/api/users/${id}/follow`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setIsFollowing(!isFollowing)
      fetchUserProfile()
    } catch (err) {
      console.error('Error following user:', err)
    }
  }

  if (loading) return <div>Loading...</div>
  if (!user) return <div>User not found</div>

  return (
    <div className="profile">
      <div className="profile-header">
        <div className="profile-info">
          <h1>{user.username}</h1>
          <p>{user.bio}</p>
          <div className="stats">
            <div><strong>{user.followers?.length || 0}</strong> Followers</div>
            <div><strong>{user.following?.length || 0}</strong> Following</div>
          </div>
        </div>
        <button onClick={handleFollow}>{isFollowing ? 'Following' : 'Follow'}</button>
      </div>
    </div>
  )
}

export default Profile
