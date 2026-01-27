import { useState, useRef } from 'react'
import axios from '../utils/axiosConfig'
import './StoryUploader.css'

function StoryUploader({ onStoryAdded, onClose, isOpen: externalIsOpen, setIsOpen: externalSetIsOpen }) {
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const [media, setMedia] = useState(null)
  const [caption, setCaption] = useState('')
  const [preview, setPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  // Use external state if provided, otherwise use internal state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen
  const setIsOpen = externalSetIsOpen !== undefined ? externalSetIsOpen : setInternalIsOpen

  console.log('StoryUploader render:', { isOpen, hasExternalState: externalIsOpen !== undefined })

  const handleMediaSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      setMedia(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!media) return

    try {
      setUploading(true)
      const token = sessionStorage.getItem('token')
      const formData = new FormData()
      formData.append('media', media)
      if (caption) formData.append('caption', caption)

      const response = await axios.post('/api/stories', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      })

      onStoryAdded(response.data)
      setIsOpen(false)
      setMedia(null)
      setCaption('')
      setPreview(null)
      if (onClose) onClose()
    } catch (err) {
      console.error('Error uploading story:', err)
      alert('Error uploading story')
    } finally {
      setUploading(false)
    }
  }

  // Floating button for standalone mode (when no external state)
  if (externalIsOpen === undefined && !isOpen) {
    return (
      <button
        onClick={() => {
          console.log('Opening story uploader')
          setIsOpen(true)
        }}
        className="story-upload-trigger"
        title="Add Story"
      >
        ➕
      </button>
    )
  }

  // Don't render if not open
  if (!isOpen) {
    return null
  }

  return (
    <div className="story-uploader-modal">
      <div className="story-uploader">
        <button
          onClick={() => {
            setIsOpen(false)
            if (onClose) onClose()
          }}
          className="uploader-close"
        >
          ✕
        </button>

        <h3>Create a Story</h3>

        {!preview ? (
          <div className="upload-area">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="upload-btn"
            >
              📸 Choose Photo or Video
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleMediaSelect}
              style={{ display: 'none' }}
            />
          </div>
        ) : (
          <form onSubmit={handleUpload} className="story-form">
            <div className="preview">
              {media?.type.startsWith('image/') ? (
                <img src={preview} alt="Preview" />
              ) : (
                <video src={preview} controls />
              )}
            </div>

            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a caption (optional)..."
              maxLength="150"
              className="caption-input"
            />

            <div className="form-actions">
              <button
                type="button"
                onClick={() => {
                  setMedia(null)
                  setPreview(null)
                  setCaption('')
                }}
                className="btn-cancel"
              >
                Choose Another
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="btn-upload"
              >
                {uploading ? 'Uploading...' : 'Share Story'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default StoryUploader
