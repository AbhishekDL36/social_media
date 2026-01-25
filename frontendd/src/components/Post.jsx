import { useState, useEffect } from 'react'
import axios from 'axios'
import LikersModal from './LikersModal'
import ShareModal from './ShareModal'
import ReactionPicker from './ReactionPicker'
import ReactionDisplay from './ReactionDisplay'
import './Post.css'

function Post({ post, onPostUpdate }) {
  const [reactions, setReactions] = useState({})
  const [userReaction, setUserReaction] = useState(null)
  const [showReactionPicker, setShowReactionPicker] = useState(false)
  const [comment, setComment] = useState('')
  const [showLikersModal, setShowLikersModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [saved, setSaved] = useState(false)
  const currentUserId = sessionStorage.getItem('userId')

  // Check if current user has reacted to this post and if saved
  useEffect(() => {
    if (post.reactions) {
      setReactions(post.reactions)
      // Find user's reaction
      let userReact = null
      Object.entries(post.reactions).forEach(([emoji, users]) => {
        if (users?.some(id => String(id) === String(currentUserId))) {
          userReact = emoji
        }
      })
      setUserReaction(userReact)
    }
    checkIfSaved()
  }, [post._id, currentUserId, post.reactions])

  const checkIfSaved = async () => {
    try {
      const token = sessionStorage.getItem('token')
      const response = await axios.get(
        `/api/posts/${post._id}/is-saved`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setSaved(response.data.saved)
    } catch (err) {
      console.error('Error checking saved status:', err)
    }
  }

  const handleSavePost = async () => {
    try {
      const token = sessionStorage.getItem('token')
      await axios.post(
        `/api/posts/${post._id}/save`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setSaved(!saved)
    } catch (err) {
      console.error('Error saving post:', err)
    }
  }

  const handleReaction = async (emoji) => {
    try {
      const token = sessionStorage.getItem('token')
      await axios.put(
        `/api/posts/${post._id}/reaction/${emoji}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setShowReactionPicker(false)
      onPostUpdate()
    } catch (err) {
      console.error('Error adding reaction:', err)
    }
  }

  const handleLike = async () => {
    // Legacy like button maps to ❤️ reaction
    await handleReaction('❤️')
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
         <div className="reaction-actions">
           <button 
             onClick={() => setShowReactionPicker(!showReactionPicker)} 
             className={`reaction-btn ${userReaction ? 'active' : ''}`}
             title="React to post"
           >
             {userReaction || '😊'} React
           </button>
           {showReactionPicker && (
             <ReactionPicker 
               onReactionSelect={handleReaction}
               onClose={() => setShowReactionPicker(false)}
             />
           )}
         </div>
         <button 
           onClick={handleSavePost} 
           className={`save-btn ${saved ? 'saved' : ''}`}
           title={saved ? 'Unsave post' : 'Save post'}
         >
           {saved ? '📌' : '🔖'} {saved ? 'Saved' : 'Save'}
         </button>
         <button onClick={() => setShowShareModal(true)} className="share-btn" title="Share post">
           ↗️ Share
         </button>
       </div>

       {/* Show reactions */}
       <ReactionDisplay 
         reactions={reactions}
         userReaction={userReaction}
         onReactionClick={handleReaction}
         onShowReactors={() => setShowLikersModal(true)}
       />

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
