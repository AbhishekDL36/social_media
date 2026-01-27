import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from '../utils/axiosConfig'
import './Hashtag.css'
import Post from '../components/Post'

function Hashtag() {
  const { hashtag } = useParams()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [hashtagData, setHashtagData] = useState(null)
  const [isFollowed, setIsFollowed] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 6,
    total: 0,
    pages: 0
  })

  useEffect(() => {
    fetchHashtagPosts()
  }, [hashtag, pagination.page])

  const fetchHashtagPosts = async () => {
    try {
      setLoading(true)
      const token = sessionStorage.getItem('token')
      const response = await axios.get(
        `/api/hashtags/${hashtag}/posts?page=${pagination.page}&limit=${pagination.limit}`,
        token ? { headers: { Authorization: `Bearer ${token}` } } : {}
      )
      
      setPosts(response.data.posts)
      setHashtagData({
        name: response.data.hashtag,
        total: response.data.total,
        followerCount: response.data.followerCount
      })
      setIsFollowed(response.data.isFollowed)
      setPagination(response.data.pagination)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching hashtag posts:', err)
      setLoading(false)
    }
  }

  const handleFollowHashtag = async () => {
    try {
      const token = sessionStorage.getItem('token')
      if (!token) {
        alert('Please login to follow hashtags')
        return
      }

      if (isFollowed) {
        await axios.delete(`/api/hashtags/${hashtag}/follow`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      } else {
        await axios.post(
          `/api/hashtags/${hashtag}/follow`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        )
      }
      setIsFollowed(!isFollowed)
    } catch (err) {
      console.error('Error toggling hashtag follow:', err)
    }
  }

  if (loading) {
    return <div className="hashtag-container"><p className="loading">Loading...</p></div>
  }

  return (
    <div className="hashtag-container">
      <div className="hashtag-header">
        <h1>#{hashtagData?.name}</h1>
        <div className="hashtag-stats">
          <span className="stat">
            <strong>{hashtagData?.total || 0}</strong> {hashtagData?.total === 1 ? 'post' : 'posts'}
          </span>
          <span className="stat">
            <strong>{hashtagData?.followerCount || 0}</strong> {hashtagData?.followerCount === 1 ? 'follower' : 'followers'}
          </span>
        </div>
        <button
          onClick={handleFollowHashtag}
          className={`follow-hashtag-btn ${isFollowed ? 'following' : ''}`}
        >
          {isFollowed ? '✓ Following' : '+ Follow'}
        </button>
      </div>

      {posts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h2>No posts yet</h2>
          <p>No posts with this hashtag. Be the first to use #{hashtagData?.name}!</p>
        </div>
      ) : (
        <>
          <div className="hashtag-posts-grid">
            {posts.map((post) => (
              <div key={post._id} className="hashtag-post-item">
                <Post post={post} />
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className="pagination-btn"
              >
                ← Previous
              </button>
              <span className="page-info">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page === pagination.pages}
                className="pagination-btn"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Hashtag
