import { useState, useEffect } from 'react'
import axios from 'axios'
import './Home.css'
import Post from '../components/Post'
import Stories from '../components/Stories'
import StoryUploader from '../components/StoryUploader'

function Home() {
  const [posts, setPosts] = useState([])
  const [caption, setCaption] = useState('')
  const [media, setMedia] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [feedLoading, setFeedLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [networkError, setNetworkError] = useState(false)

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async (pageNum = 1) => {
    try {
      setFeedLoading(true)
      setNetworkError(false)
      const token = sessionStorage.getItem('token')
      const response = await axios.get('/api/posts', {
        params: { page: pageNum, limit: 10 },
        headers: { Authorization: `Bearer ${token}` }
      })
      setPosts(response.data.posts)
      setTotalPages(response.data.pagination.pages)
      setPage(pageNum)
    } catch (err) {
      console.error('Error fetching posts:', err)
      if (!err.response) {
        setNetworkError(true)
      }
    } finally {
      setFeedLoading(false)
    }
  }

  const handleMediaChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setError('')
      setMedia(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCreatePost = async (e) => {
    e.preventDefault()
    if (!caption || !media) {
      setError('Please add a caption and select an image or video')
      return
    }

    setLoading(true)
    setError('')
    try {
      const token = sessionStorage.getItem('token')
      const formData = new FormData()
      formData.append('caption', caption)
      formData.append('media', media)

      const response = await axios.post('/api/posts', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      })
      setPosts([response.data, ...posts])
      setCaption('')
      setMedia(null)
      setPreview(null)
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating post')
    }
    setLoading(false)
  }

  const handleStoryAdded = () => {
    fetchPosts()
  }

  return (
    <div className="home">
      <Stories />
      <StoryUploader onStoryAdded={handleStoryAdded} />
      
      <div className="create-post">
        <h2>Create a Post</h2>
        <form onSubmit={handleCreatePost}>
          <textarea
            placeholder="Write a caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
          
          <div className="media-input-section">
            <label htmlFor="media-input" className="media-label">
              📷 Choose Image or Video
            </label>
            <input
              id="media-input"
              type="file"
              accept="image/*,video/*"
              onChange={handleMediaChange}
              className="media-input"
            />
          </div>

          {preview && (
            <div className="preview-section">
              {media?.type.startsWith('image/') ? (
                <img src={preview} alt="Preview" className="preview-image" />
              ) : (
                <video src={preview} className="preview-video" controls></video>
              )}
              <button
                type="button"
                onClick={() => {
                  setMedia(null)
                  setPreview(null)
                }}
                className="remove-media-btn"
              >
                Remove
              </button>
            </div>
          )}

          {error && <p className="error-message">{error}</p>}
          <button type="submit" disabled={loading}>{loading ? 'Posting...' : 'Post'}</button>
        </form>
      </div>

      <div className="feed-section">
         <h2>Feed</h2>
         {networkError && (
           <div className="error-box">
             <p>⚠️ Unable to load feed. Please check your internet connection and try again.</p>
             <button onClick={() => fetchPosts(page)}>Retry</button>
           </div>
         )}
         {feedLoading ? (
           <p className="loading">Loading feed...</p>
         ) : posts.length === 0 ? (
           <p className="empty-feed">No posts yet. Follow users to see their posts!</p>
         ) : (
           <>
             <div className="posts">
               {posts.map((post) => (
                 <Post key={post._id} post={post} onPostUpdate={() => fetchPosts(page)} />
               ))}
             </div>
             {totalPages > 1 && (
               <div className="pagination">
                 <button 
                   onClick={() => fetchPosts(page - 1)} 
                   disabled={page === 1}
                 >
                   Previous
                 </button>
                 <span className="page-info">Page {page} of {totalPages}</span>
                 <button 
                   onClick={() => fetchPosts(page + 1)} 
                   disabled={page === totalPages}
                 >
                   Next
                 </button>
               </div>
             )}
           </>
         )}
       </div>
    </div>
  )
}

export default Home
