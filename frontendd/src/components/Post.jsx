import { useState, useEffect, useRef } from 'react'
import axios from '../utils/axiosConfig'
import LikersModal from './LikersModal'
import ShareModal from './ShareModal'
import ReactionPicker from './ReactionPicker'
import ReactionDisplay from './ReactionDisplay'
import MentionDropdown from './MentionDropdown'
import MentionText from './MentionText'
import './Post.css'

function Post({ post, onPostUpdate }) {
  const [reactions, setReactions] = useState({})
  const [userReaction, setUserReaction] = useState(null)
  const [showReactionPicker, setShowReactionPicker] = useState(false)
  const [comment, setComment] = useState('')
  const [showLikersModal, setShowLikersModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [saved, setSaved] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editCaption, setEditCaption] = useState(post.caption || '')
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyTexts, setReplyTexts] = useState({})
  const [expandedComments, setExpandedComments] = useState({})
  const [showMentions, setShowMentions] = useState(null)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionInputRef, setMentionInputRef] = useState(null)
  const currentUserId = sessionStorage.getItem('userId')
  const isPostAuthor = String(post.author?._id) === String(currentUserId)

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

  const handleEditPost = async () => {
    try {
      const token = sessionStorage.getItem('token')
      await axios.put(
        `/api/posts/${post._id}`,
        { caption: editCaption },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setIsEditing(false)
      onPostUpdate()
    } catch (err) {
      console.error('Error editing post:', err)
    }
  }

  const handleDeletePost = async () => {
    if (!window.confirm('Delete this post?')) return
    try {
      const token = sessionStorage.getItem('token')
      await axios.delete(
        `/api/posts/${post._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      onPostUpdate()
    } catch (err) {
      console.error('Error deleting post:', err)
    }
  }

  const handleAddReply = async (commentIdx) => {
    const replyText = replyTexts[commentIdx]
    if (!replyText?.trim()) return
    try {
      const token = sessionStorage.getItem('token')
      const comment = post.comments[commentIdx]
      const commentId = comment._id || commentIdx
      
      await axios.post(
        `/api/posts/${post._id}/comment/${commentId}/reply`,
        { text: replyText },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setReplyingTo(null)
      setReplyTexts({ ...replyTexts, [commentIdx]: '' })
      onPostUpdate()
    } catch (err) {
      console.error('Error adding reply:', err)
      alert('Failed to add reply: ' + (err.response?.data?.message || err.message))
    }
  }

  const handleDeleteReply = async (commentId, replyId) => {
    if (!window.confirm('Delete this reply?')) return
    try {
      const token = sessionStorage.getItem('token')
      await axios.delete(
        `/api/posts/${post._id}/comment/${commentId}/reply/${replyId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      onPostUpdate()
    } catch (err) {
      console.error('Error deleting reply:', err)
    }
  }

  const handleLikeReply = async (commentId, replyId) => {
    try {
      const token = sessionStorage.getItem('token')
      await axios.put(
        `/api/posts/${post._id}/comment/${commentId}/reply/${replyId}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      onPostUpdate()
    } catch (err) {
      console.error('Error liking reply:', err)
    }
  }

  const handleCommentChange = (e, commentIdx, isReply = false) => {
    const value = e.target.value
    
    if (isReply) {
      setReplyTexts({ ...replyTexts, [commentIdx]: value })
    } else {
      setComment(value)
    }

    // Check for mentions
    const lastAtSymbol = value.lastIndexOf('@')
    if (lastAtSymbol !== -1) {
      const textAfterAt = value.substring(lastAtSymbol + 1)
      // Allow @ followed by alphanumeric or empty (just typed @)
      if (!textAfterAt.includes(' ') && textAfterAt.match(/^[a-zA-Z0-9_]*$/)) {
        setShowMentions(isReply ? commentIdx : 'comment')
        setMentionQuery(textAfterAt)
      } else {
        setShowMentions(null)
        setMentionQuery('')
      }
    } else {
      setShowMentions(null)
      setMentionQuery('')
    }
  }

  const handleMentionSelect = (user, commentIdx, isReply = false) => {
    try {
      const currentText = isReply ? (replyTexts[commentIdx] || '') : comment
      const lastAtSymbol = currentText.lastIndexOf('@')
      
      if (lastAtSymbol === -1) {
        console.error('@ symbol not found in text')
        return
      }
      
      const textBeforeAt = currentText.substring(0, lastAtSymbol)
      const newText = `${textBeforeAt}@${user.username} `
      
      if (isReply) {
        setReplyTexts({ ...replyTexts, [commentIdx]: newText })
      } else {
        setComment(newText)
      }
      
      setShowMentions(null)
      setMentionQuery('')
    } catch (err) {
      console.error('Error selecting mention:', err)
    }
  }

  return (
    <div className="post">
      <div className="post-header">
        <h3>{post.author?.username}</h3>
        {isPostAuthor && (
          <div className="post-actions-header">
            <button onClick={() => setIsEditing(true)} className="edit-btn" title="Edit post">
              ✏️
            </button>
            <button onClick={handleDeletePost} className="delete-btn" title="Delete post">
              🗑️
            </button>
          </div>
        )}
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
        {isEditing ? (
          <div className="edit-caption-form">
            <textarea
              value={editCaption}
              onChange={(e) => setEditCaption(e.target.value)}
              className="edit-caption-input"
            />
            <div className="edit-buttons">
              <button onClick={handleEditPost} className="save-btn">Save</button>
              <button onClick={() => setIsEditing(false)} className="cancel-btn">Cancel</button>
            </div>
          </div>
        ) : (
          <>
            <strong>{post.author?.username}</strong> <MentionText text={post.caption} />
          </>
        )}
      </div>
      <div className="post-comments">
         {post.comments?.map((com, idx) => (
           <div key={idx} className="comment-thread">
             <div className="comment">
               <div className="comment-text">
                 <strong>{com.author?.username}</strong> <MentionText text={com.text} />
               </div>
               <div className="comment-actions">
                 <button
                   onClick={() => handleCommentLike(idx)}
                   className={`comment-like-btn ${com.likes?.some(id => String(id) === String(currentUserId)) ? 'liked' : ''}`}
                 >
                   {com.likes?.some(id => String(id) === String(currentUserId)) ? '❤️' : '♡'} {com.likes?.length || 0}
                 </button>
                 <button
                   onClick={() => setReplyingTo(replyingTo === idx ? null : idx)}
                   className="reply-btn"
                 >
                   Reply
                 </button>
               </div>
             </div>

             {/* Show/Hide Replies Button */}
             {com.replies && com.replies.length > 0 && (
               <button
                 onClick={() => setExpandedComments({ ...expandedComments, [idx]: !expandedComments[idx] })}
                 className="show-replies-btn"
               >
                 {expandedComments[idx] ? '▼ Hide' : '▶ View'} {com.replies.length} {com.replies.length === 1 ? 'reply' : 'replies'}
               </button>
             )}

             {/* Replies */}
             {expandedComments[idx] && com.replies && com.replies.map((reply) => (
               <div key={reply._id} className="reply">
                 <div className="reply-text">
                   <strong>{reply.author?.username}</strong> <MentionText text={reply.text} />
                 </div>
                 <div className="reply-actions">
                   <button
                     onClick={() => handleLikeReply(idx, reply._id)}
                     className={`reply-like-btn ${reply.likes?.some(id => String(id) === String(currentUserId)) ? 'liked' : ''}`}
                   >
                     {reply.likes?.some(id => String(id) === String(currentUserId)) ? '❤️' : '♡'} {reply.likes?.length || 0}
                   </button>
                   {String(reply.author?._id) === currentUserId && (
                     <button
                       onClick={() => handleDeleteReply(idx, reply._id)}
                       className="delete-reply-btn"
                     >
                       Delete
                     </button>
                   )}
                 </div>
               </div>
             ))}

             {/* Reply Input */}
             {replyingTo === idx && (
               <div className="reply-input-form">
                 <div style={{ position: 'relative', flex: 1 }}>
                   <input
                     type="text"
                     placeholder="Write a reply... (use @ to mention)"
                     value={replyTexts[idx] || ''}
                     onChange={(e) => handleCommentChange(e, idx, true)}
                     className="reply-input"
                     onKeyPress={(e) => {
                       if (e.key === 'Enter' && replyTexts[idx]?.trim()) {
                         handleAddReply(idx)
                       }
                     }}
                   />
                   {showMentions === idx && mentionQuery.length >= 0 && (
                     <MentionDropdown
                       query={mentionQuery}
                       onMentionSelect={(user) => handleMentionSelect(user, idx, true)}
                       position={{ top: '100%', left: '0', marginTop: '4px' }}
                     />
                   )}
                 </div>
                 <button
                   onClick={() => handleAddReply(idx)}
                   disabled={!replyTexts[idx]?.trim()}
                   className="reply-submit-btn"
                 >
                   Reply
                 </button>
                 <button
                   type="button"
                   onClick={() => setReplyingTo(null)}
                   className="reply-cancel-btn"
                 >
                   Cancel
                 </button>
               </div>
             )}
           </div>
         ))}
       </div>
      <form onSubmit={handleComment} className="comment-form">
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            ref={input => setMentionInputRef(input)}
            type="text"
            placeholder="Add a comment... (use @ to mention)"
            value={comment}
            onChange={(e) => handleCommentChange(e, null, false)}
          />
          {showMentions === 'comment' && mentionQuery.length >= 0 && (
            <MentionDropdown
              query={mentionQuery}
              onMentionSelect={(user) => handleMentionSelect(user, null, false)}
              position={{ top: '100%', left: '0', marginTop: '4px' }}
            />
          )}
        </div>
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
