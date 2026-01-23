import { useState, useEffect } from 'react'
import axios from 'axios'
import ShareStoryModal from './ShareStoryModal'
import StoryReplyModal from './StoryReplyModal'
import './StoryViewer.css'

function StoryViewer({ storyGroup, initialIndex = 0, onClose, onRefresh }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [progress, setProgress] = useState(0)
  const [paused, setPaused] = useState(false)
  const [likes, setLikes] = useState({})
  const [likedStories, setLikedStories] = useState({})
  const [showShareModal, setShowShareModal] = useState(false)
  const [showReplyModal, setShowReplyModal] = useState(false)
  const [replyCount, setReplyCount] = useState({})
  const currentUserId = sessionStorage.getItem('userId')

  const currentStory = storyGroup.stories[currentIndex]
  const totalStories = storyGroup.stories.length

  // Initialize likes and reply counts from stories
  useEffect(() => {
    const likesMap = {}
    const likedMap = {}
    const replyCounts = {}
    storyGroup.stories.forEach(story => {
      likesMap[story._id] = story.likes?.length || 0
      likedMap[story._id] = story.likes?.some(like => 
        like._id === currentUserId || like === currentUserId
      ) || false
      replyCounts[story._id] = 0 // Will be updated when reply is sent
    })
    setLikes(likesMap)
    setLikedStories(likedMap)
    setReplyCount(replyCounts)
  }, [storyGroup, currentUserId])

  const handleLikeStory = async () => {
    try {
      const token = sessionStorage.getItem('token')
      const response = await axios.put(
        `/api/stories/${currentStory._id}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      setLikes(prev => ({
        ...prev,
        [currentStory._id]: response.data.likeCount
      }))
      setLikedStories(prev => ({
        ...prev,
        [currentStory._id]: response.data.isLiked
      }))
    } catch (err) {
      console.error('Error liking story:', err)
    }
  }

  useEffect(() => {
    if (paused) return

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Move to next story
          if (currentIndex < totalStories - 1) {
            setCurrentIndex(currentIndex + 1)
            return 0
          } else {
            // Close viewer if last story
            onClose()
            return 100
          }
        }
        return prev + 2
      })
    }, 50)

    return () => clearInterval(interval)
  }, [currentIndex, paused, totalStories, onClose])

  const handleNext = () => {
    if (currentIndex < totalStories - 1) {
      setCurrentIndex(currentIndex + 1)
      setProgress(0)
    } else {
      onClose()
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setProgress(0)
    }
  }

  const formatTime = (date) => {
    const hours = Math.floor((Date.now() - new Date(date).getTime()) / 3600000)
    if (hours < 1) return 'Now'
    if (hours < 24) return `${hours}h ago`
    return 'Old'
  }

  return (
    <div
      className="story-viewer"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Progress bars */}
      <div className="story-progress-bars">
        {storyGroup.stories.map((_, index) => (
          <div
            key={index}
            className="progress-bar"
            style={{
              width: index < currentIndex ? '100%' : index === currentIndex ? `${progress}%` : '0%'
            }}
          ></div>
        ))}
      </div>

      {/* Header */}
      <div className="story-header">
        <div className="story-user-info">
          <img
            src={storyGroup.user.profilePicture || 'https://via.placeholder.com/40'}
            alt={storyGroup.user.username}
            className="story-user-avatar"
          />
          <div>
            <h4>{storyGroup.user.username}</h4>
            <p>{formatTime(currentStory.createdAt)}</p>
          </div>
        </div>
        <button onClick={onClose} className="story-close-btn">✕</button>
      </div>

      {/* Media */}
      <div className="story-media-container">
        {currentStory.mediaType === 'image' ? (
          <img src={currentStory.media} alt="Story" className="story-media" />
        ) : (
          <video src={currentStory.media} className="story-media" autoPlay muted loop />
        )}
      </div>

      {/* Caption */}
      {currentStory.caption && (
        <div className="story-caption">
          <p>{currentStory.caption}</p>
        </div>
      )}

      {/* Navigation */}
      <div className="story-nav">
        <button onClick={handlePrev} className="story-nav-btn story-prev">
          ‹
        </button>
        <button onClick={handleNext} className="story-nav-btn story-next">
          ›
        </button>
      </div>

      {/* Like Button */}
      <button 
        onClick={handleLikeStory}
        className={`story-like-btn ${likedStories[currentStory._id] ? 'liked' : ''}`}
        title="Like Story"
      >
        <span className="like-icon">
          {likedStories[currentStory._id] ? '❤️' : '🤍'}
        </span>
        <span className="like-count">{likes[currentStory._id] || 0}</span>
      </button>

      {/* Share Button */}
      {currentUserId !== storyGroup.user._id && (
        <button 
          onClick={() => setShowShareModal(true)}
          className="story-share-btn"
          title="Share Story"
        >
          <span className="share-icon">📤</span>
        </button>
      )}

      {/* Reply Button */}
      {currentUserId !== storyGroup.user._id && (
        <button 
          onClick={() => setShowReplyModal(true)}
          className="story-reply-btn"
          title="Reply to Story"
        >
          <span className="reply-icon">💬</span>
          {replyCount[currentStory._id] > 0 && (
            <span className="reply-badge">{replyCount[currentStory._id]}</span>
          )}
        </button>
      )}

      {/* Story count */}
      <div className="story-counter">
        {currentIndex + 1} / {totalStories}
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <ShareStoryModal 
          storyId={currentStory._id}
          onClose={() => setShowShareModal(false)}
          onSuccess={() => {
            alert('Story shared successfully!')
            onRefresh()
          }}
        />
      )}

      {/* Reply Modal */}
      {showReplyModal && (
        <StoryReplyModal 
          storyId={currentStory._id}
          storyAuthorName={storyGroup.user.username}
          onClose={() => setShowReplyModal(false)}
          onReplySuccess={(reply) => {
            setReplyCount(prev => ({
              ...prev,
              [currentStory._id]: (prev[currentStory._id] || 0) + 1
            }))
          }}
        />
      )}
    </div>
  )
}

export default StoryViewer
