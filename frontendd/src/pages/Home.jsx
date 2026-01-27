import { useState, useEffect } from 'react'
import axios from '../utils/axiosConfig'
import './Home.css'
import Post from '../components/Post'
import Stories from '../components/Stories'
import StoryUploader from '../components/StoryUploader'
import PeopleYouMayKnow from '../components/PeopleYouMayKnow'
import DateTimePicker from '../components/DateTimePicker'

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
  const [schedulePost, setSchedulePost] = useState(false)
  const [scheduledTime, setScheduledTime] = useState('')
  const [showScheduled, setShowScheduled] = useState(false)
  const [scheduledPosts, setScheduledPosts] = useState([])

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

    if (schedulePost) {
      if (!scheduledTime || scheduledTime.trim() === '') {
        setError('Please select a date and time to schedule the post')
        return
      }
      
      const selectedDateTime = new Date(scheduledTime)
      const now = new Date()
      
      if (selectedDateTime <= now) {
        setError('Please select a future date and time')
        return
      }
    }

    setLoading(true)
    setError('')
    try {
      const token = sessionStorage.getItem('token')
      const formData = new FormData()
      formData.append('caption', caption)
      formData.append('media', media)
      if (schedulePost) {
        formData.append('scheduledTime', scheduledTime)
      }

      const response = await axios.post('/api/posts', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      })
      
      if (schedulePost) {
        alert(`Post scheduled for ${new Date(scheduledTime).toLocaleString()}`)
        fetchScheduledPosts()
      } else {
        setPosts([response.data.post || response.data, ...posts])
      }
      
      setCaption('')
      setMedia(null)
      setPreview(null)
      setSchedulePost(false)
      setScheduledTime('')
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating post')
    }
    setLoading(false)
  }

  const fetchScheduledPosts = async () => {
    try {
      const token = sessionStorage.getItem('token')
      const response = await axios.get('/api/posts/scheduled/list', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setScheduledPosts(response.data)
    } catch (err) {
      console.error('Error fetching scheduled posts:', err)
    }
  }

  const handlePublishNow = async (postId) => {
    try {
      const token = sessionStorage.getItem('token')
      await axios.put(`/api/posts/${postId}/publish`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('Post published!')
      fetchScheduledPosts()
      fetchPosts(page)
    } catch (err) {
      alert(err.response?.data?.message || 'Error publishing post')
    }
  }

  const handleCancelSchedule = async (postId) => {
    if (confirm('Delete this scheduled post?')) {
      try {
        const token = sessionStorage.getItem('token')
        await axios.delete(`/api/posts/${postId}/schedule`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        alert('Scheduled post deleted')
        fetchScheduledPosts()
      } catch (err) {
        alert(err.response?.data?.message || 'Error deleting post')
      }
    }
  }

  const handleStoryAdded = () => {
    fetchPosts()
  }

  return (
    <div className="home">
      <Stories />
      <StoryUploader onStoryAdded={handleStoryAdded} />
      
      <div className="create-post">
        <div className="post-header">
          <h2>Create a Post</h2>
          <button 
            type="button"
            className="scheduled-posts-btn"
            onClick={() => {
              setShowScheduled(!showScheduled)
              if (!showScheduled) fetchScheduledPosts()
            }}
          >
            📅 Scheduled ({scheduledPosts.length})
          </button>
        </div>

        {showScheduled && (
          <div className="scheduled-posts-section">
            <h3>Your Scheduled Posts</h3>
            {scheduledPosts.length === 0 ? (
              <p className="empty">No scheduled posts</p>
            ) : (
              <div className="scheduled-list">
                {scheduledPosts.map(post => (
                  <div key={post._id} className="scheduled-item">
                    {post.media && <img src={post.media} alt="Post" className="scheduled-thumbnail" />}
                    <div className="scheduled-info">
                      <p className="scheduled-caption">{post.caption.substring(0, 50)}...</p>
                      <p className="scheduled-time">
                        📅 {new Date(post.scheduledTime).toLocaleString()}
                      </p>
                    </div>
                    <div className="scheduled-actions">
                      <button 
                        onClick={() => handlePublishNow(post._id)}
                        className="publish-btn"
                      >
                        Publish Now
                      </button>
                      <button 
                        onClick={() => handleCancelSchedule(post._id)}
                        className="cancel-btn"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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

          <div className="schedule-options">
            <label className="schedule-checkbox">
              <input
                type="checkbox"
                checked={schedulePost}
                onChange={(e) => {
                  setSchedulePost(e.target.checked)
                  setScheduledTime('')
                }}
              />
              📅 Schedule this post
            </label>
            {schedulePost && (
              <DateTimePicker
                value={scheduledTime}
                onChange={setScheduledTime}
                min={new Date().toISOString().slice(0, 16)}
              />
            )}
          </div>

          {error && <p className="error-message">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? (schedulePost ? 'Scheduling...' : 'Posting...') : (schedulePost ? 'Schedule Post' : 'Post')}
          </button>
        </form>
      </div>

      <PeopleYouMayKnow />

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
