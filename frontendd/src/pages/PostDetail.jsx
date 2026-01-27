import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from '../utils/axiosConfig'
import Post from '../components/Post'
import './PostDetail.css'

function PostDetail() {
  const { postId } = useParams()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchPost()
  }, [postId])

  const fetchPost = async () => {
    try {
      setLoading(true)
      const token = sessionStorage.getItem('token')
      const response = await axios.get(`/api/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setPost(response.data)
    } catch (err) {
      console.error('Error fetching post:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="post-detail-container"><p>Loading...</p></div>
  if (!post) return <div className="post-detail-container"><p>Post not found</p></div>

  return (
    <div className="post-detail-container">
      <button onClick={() => navigate(-1)} className="back-btn">← Back</button>
      <div className="post-detail-content">
        <Post post={post} onPostUpdate={fetchPost} />
      </div>
    </div>
  )
}

export default PostDetail
