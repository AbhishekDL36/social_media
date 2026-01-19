import { useState } from 'react'
import axios from 'axios'
import './Post.css'

function Post({ post, onPostUpdate }) {
  const [liked, setLiked] = useState(false)
  const [comment, setComment] = useState('')

  const handleLike = async () => {
    try {
      const token = localStorage.getItem('token')
      await axios.put(
        `/api/posts/${post._id}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setLiked(!liked)
      onPostUpdate()
    } catch (err) {
      console.error('Error liking post:', err)
    }
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!comment) return

    try {
      const token = localStorage.getItem('token')
      await axios.post(
        `/api/posts/${post._id}/comment`,
        { text: comment },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setComment('')
      onPostUpdate()
    } catch (err) {
      console.error('Error adding comment:', err)
    }
  }

  return (
    <div className="post">
      <div className="post-header">
        <h3>{post.author?.username}</h3>
      </div>
      <img src={post.image} alt="Post" className="post-image" />
      <div className="post-actions">
        <button onClick={handleLike} className={liked ? 'liked' : ''}>
          ♡ Like ({post.likes?.length || 0})
        </button>
      </div>
      <div className="post-caption">
        <strong>{post.author?.username}</strong> {post.caption}
      </div>
      <div className="post-comments">
        {post.comments?.map((com, idx) => (
          <div key={idx} className="comment">
            <strong>{com.author?.username}</strong> {com.text}
          </div>
        ))}
      </div>
      <form onSubmit={handleComment} className="comment-form">
        <input
          type="text"
          placeholder="Add a comment..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <button type="submit">Post</button>
      </form>
    </div>
  )
}

export default Post
