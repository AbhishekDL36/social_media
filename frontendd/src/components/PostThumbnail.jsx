import { useNavigate } from 'react-router-dom'
import './PostThumbnail.css'

function PostThumbnail({ post }) {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate(`/post/${post._id}`)
  }

  return (
    <div className="post-thumbnail" onClick={handleClick}>
      {post.mediaType === 'video' ? (
        <div className="thumbnail-video">
          <video src={post.media} className="thumbnail-media"></video>
          <div className="video-badge">▶ VIDEO</div>
        </div>
      ) : (
        <img src={post.media} alt="Post" className="thumbnail-media" />
      )}
      
      <div className="thumbnail-overlay">
        <div className="thumbnail-stats">
          <span>❤️ {post.likes?.length || 0}</span>
          <span>💬 {post.comments?.length || 0}</span>
        </div>
      </div>
    </div>
  )
}

export default PostThumbnail
