import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import PostThumbnail from '../components/PostThumbnail'
import './Profile.css'

function Profile() {
  const { id: paramId } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [posts, setPosts] = useState([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [requestSent, setRequestSent] = useState(false)
  const [activeFilter, setActiveFilter] = useState('all') // all, images, reels
  const [userStatus, setUserStatus] = useState(null)
  const currentUserId = sessionStorage.getItem('userId')
  const id = paramId || currentUserId // Use current user's ID if no param provided
  const isOwnProfile = currentUserId === id

  const canViewFollowersFollowing = () => {
    // Own profile: always can view
    if (isOwnProfile) return true
    // Public account: always can view
    if (!user?.isPrivate) return true
    // Private account: only if following
    return isFollowing
  }

  const getFilteredPosts = () => {
    if (activeFilter === 'images') {
      return posts.filter(post => post.mediaType === 'image')
    } else if (activeFilter === 'reels') {
      return posts.filter(post => post.mediaType === 'video')
    }
    return posts
  }

  useEffect(() => {
    fetchUserProfile()
    fetchUserPosts()
    fetchUserStatus()
    // Refresh status every 30 seconds
    const interval = setInterval(fetchUserStatus, 30000)
    return () => clearInterval(interval)
  }, [id])

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get(`/api/users/${id}`)
      setUser(response.data)
      
      // Check if current user is following this user and if blocked
      if (!isOwnProfile && currentUserId) {
        const token = sessionStorage.getItem('token')
        const currentUserRes = await axios.get(`/api/users/${currentUserId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setIsFollowing(currentUserRes.data.following.some(followId => followId._id === id || followId === id))
        
        // Check if blocked
        const blockRes = await axios.get(`/api/users/${id}/is-blocked`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setIsBlocked(blockRes.data.isBlocked)
      }
      
      setLoading(false)
    } catch (err) {
      console.error('Error fetching profile:', err)
      setLoading(false)
    }
  }

  const fetchUserPosts = async () => {
    try {
      const response = await axios.get(`/api/posts/user/${id}`)
      setPosts(response.data)
    } catch (err) {
      console.error('Error fetching posts:', err)
    }
  }

  const fetchUserStatus = async () => {
    try {
      const response = await axios.get(`/api/users/${id}/status`)
      setUserStatus(response.data)
    } catch (err) {
      console.error('Error fetching user status:', err)
    }
  }

  const handleFollow = async () => {
    try {
      console.log('Follow button clicked', { id, isFollowing })
      setError('')
      const token = sessionStorage.getItem('token')
      console.log('Token:', token ? 'exists' : 'missing')
      const response = await axios.put(
        `/api/users/${id}/follow`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      console.log('Follow response:', response.data)
      // Immediately update the UI with the new state
      const newFollowingState = !isFollowing
      setIsFollowing(newFollowingState)
      console.log('Updated isFollowing to:', newFollowingState)
      // Then fetch fresh data from server
      await fetchUserProfile()
    } catch (err) {
      console.error('Follow error:', err.response?.status, err.response?.data)
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
      const token = sessionStorage.getItem('token')
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

  const handleBlock = async () => {
    try {
      setError('')
      const token = sessionStorage.getItem('token')
      await axios.post(
        `/api/users/${id}/block`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setIsBlocked(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Error blocking user')
    }
  }

  const handleUnblock = async () => {
    try {
      setError('')
      const token = sessionStorage.getItem('token')
      await axios.post(
        `/api/users/${id}/unblock`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setIsBlocked(false)
    } catch (err) {
      setError(err.response?.data?.message || 'Error unblocking user')
    }
  }

  if (loading) return <div>Loading...</div>
  if (!user) return <div>User not found</div>

  return (
    <div className="profile">
      <div className="profile-header">
        <div className="profile-info">
          <div className="username-section">
            <div className="username-with-status">
              <h1>{user.username}</h1>
              {userStatus && (
                <span className={`online-status ${userStatus.isOnline ? 'online' : 'offline'}`}>
                  {userStatus.isOnline ? '🟢' : '⚫'} {userStatus.status}
                </span>
              )}
            </div>
            {user.isPrivate && <span className="private-badge">🔒 Private</span>}
          </div>
          <p>{user.bio}</p>
          {user.relationshipStatus && user.relationshipStatus !== 'prefer not to say' && (
            <p className="relationship-status">
              <span className="heart-icon">💑</span> {user.relationshipStatus.charAt(0).toUpperCase() + user.relationshipStatus.slice(1)}
            </p>
          )}
          <div className="stats">
            <div><strong>{posts.length}</strong> Posts</div>
            <div
              onClick={() => canViewFollowersFollowing() && navigate(`/followers/${id}/followers`)}
              className={canViewFollowersFollowing() ? 'stat-clickable' : ''}
            >
              <strong>{user.followers?.length || 0}</strong> Followers
            </div>
            <div
              onClick={() => canViewFollowersFollowing() && navigate(`/followers/${id}/following`)}
              className={canViewFollowersFollowing() ? 'stat-clickable' : ''}
            >
              <strong>{user.following?.length || 0}</strong> Following
            </div>
          </div>
        </div>
        {!isOwnProfile && (
          <div className="profile-actions">
            {isBlocked ? (
              <button onClick={handleUnblock} className="unblock-btn">
                Unblock
              </button>
            ) : (
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
                <button onClick={() => navigate(`/messages?user=${id}`)} className="message-btn">
                  Message
                </button>
                <button onClick={handleBlock} className="block-btn">
                  Block
                </button>
              </>
            )}
          </div>
        )}
      </div>
      {error && <p className="error-message">{error}</p>}

      <div className="profile-posts-section">
        <div className="posts-filter-tabs">
          <button
            className={`filter-tab ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            All
          </button>
          <button
            className={`filter-tab ${activeFilter === 'images' ? 'active' : ''}`}
            onClick={() => setActiveFilter('images')}
          >
            Images
          </button>
          <button
            className={`filter-tab ${activeFilter === 'reels' ? 'active' : ''}`}
            onClick={() => setActiveFilter('reels')}
          >
            Reels
          </button>
        </div>

        {getFilteredPosts().length === 0 ? (
          <p className="no-posts">
            {posts.length === 0 ? 'No posts yet' : `No ${activeFilter}s yet`}
          </p>
        ) : (
          <div className="posts-grid">
            {getFilteredPosts().map((post) => (
              <PostThumbnail key={post._id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Profile
