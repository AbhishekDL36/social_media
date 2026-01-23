import { useState, useEffect } from 'react'
import axios from 'axios'
import LikersModal from './LikersModal'
import ShareModal from './ShareModal'
import './Post.css'

function Post({ post, onPostUpdate }) {
  const [liked, setLiked] = useState(false)
  const [comment, setComment] = useState('')
  const [showLikersModal, setShowLikersModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const currentUserId = sessionStorage.getItem('userId')

  // Check if current user has liked this post
  useEffect(() => {
    const userHasLiked = post.likes?.some(id => String(id) === String(currentUserId))
    setLiked(userHasLiked || false)
  }, [post._id, currentUserId, post.likes])

  const handleLike = async () => {
    try {
      const token = sessionStorage.getItem('token')
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
      const token = sessionStorage.getItem('token')
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

  const handleCommentLike = async (commentId) => {
    try {
      const token = sessionStorage.getItem('token')
      await axios.put(
        `/api/posts/${post._id}/comment/${commentId}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      onPostUpdate()
    } catch (err) {
      console.error('Error liking comment:', err)
    }
  }

  return (
    <div className="post">
      <div className="post-header">
        <h3>{post.author?.username}</h3>
      </div>
      {post.mediaType === 'video' ? (
        <video src={post.media} controls className="post-media"></video>
      ) : (
        <img src={post.media} alt="Post" className="post-media" />
      )}
      <div className="post-actions">
         <button onClick={handleLike} className={`like-btn ${liked ? 'liked' : ''}`}>
           {liked ? '❤️' : '♡'} Like
         </button>
         {post.likes?.length > 0 && (
           <button onClick={() => setShowLikersModal(true)} className="likers-count">
             {post.likes.length} {post.likes.length === 1 ? 'like' : 'likes'}
           </button>
         )}
         <button onClick={() => setShowShareModal(true)} className="share-btn" title="Share post">
           ↗️ Share
         </button>
       </div>
      <div className="post-caption">
        <strong>{post.author?.username}</strong> {post.caption}
      </div>
      <div className="post-comments">
         {post.comments?.map((com, idx) => (
           <div key={idx} className="comment">
             <div className="comment-text">
               <strong>{com.author?.username}</strong> {com.text}
             </div>
             <button
               onClick={() => handleCommentLike(idx)}
               className={`comment-like-btn ${com.likes?.some(id => String(id) === String(currentUserId)) ? 'liked' : ''}`}
             >
               {com.likes?.some(id => String(id) === String(currentUserId)) ? '❤️' : '♡'} {com.likes?.length || 0}
             </button>
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

      {showLikersModal && (
        <LikersModal postId={post._id} onClose={() => setShowLikersModal(false)} />
      )}

      {showShareModal && (
        <ShareModal postId={post._id} onClose={() => setShowShareModal(false)} />
      )}
      </div>
      )
      }

export default Post
