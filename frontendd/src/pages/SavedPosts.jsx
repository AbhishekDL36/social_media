import { useState, useEffect } from 'react'
import axios from 'axios'
import './SavedPosts.css'
import Post from '../components/Post'

function SavedPosts() {
  const [savedPosts, setSavedPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 6,
    total: 0,
    pages: 0
  })

  useEffect(() => {
    fetchSavedPosts()
  }, [pagination.page])

  const fetchSavedPosts = async () => {
    try {
      setLoading(true)
      setError('')
      const token = sessionStorage.getItem('token')
      const response = await axios.get(
        `/api/posts/saved/list?page=${pagination.page}&limit=${pagination.limit}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setSavedPosts(response.data.posts)
      setPagination(response.data.pagination)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching saved posts:', err)
      setError(err.response?.data?.message || 'Failed to load saved posts')
      setLoading(false)
    }
  }

  const handlePostUpdate = (updatedPost) => {
    setSavedPosts(savedPosts.map(post => 
      post._id === updatedPost._id ? updatedPost : post
    ))
  }

  const handlePostDelete = (postId) => {
    setSavedPosts(savedPosts.filter(post => post._id !== postId))
    setPagination({ ...pagination, total: pagination.total - 1 })
  }

  return (
    <div className="saved-posts-container">
      <div className="saved-posts-header">
        <h1>📌 Saved Posts</h1>
        <p className="saved-count">
          {pagination.total} {pagination.total === 1 ? 'post' : 'posts'} saved
        </p>
      </div>

      {error && (
        <div className="error-message">{error}</div>
      )}

      {loading ? (
        <div className="loading">Loading saved posts...</div>
      ) : savedPosts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔖</div>
          <h2>No saved posts yet</h2>
          <p>Posts you save will appear here. Start saving posts to keep them for later!</p>
        </div>
      ) : (
        <>
          <div className="saved-posts-grid">
            {savedPosts.map((post) => (
              <div key={post._id} className="saved-post-item">
                <Post 
                  post={post} 
                  onPostUpdate={handlePostUpdate}
                  onPostDelete={() => handlePostDelete(post._id)}
                />
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

export default SavedPosts
