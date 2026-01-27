import { useState, useEffect } from 'react'
import axios from '../utils/axiosConfig'
import './Stories.css'
import StoryViewer from './StoryViewer'

function Stories() {
  const [storyGroups, setStoryGroups] = useState([])
  const [selectedStory, setSelectedStory] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStories()
  }, [])

  const fetchStories = async () => {
    try {
      setLoading(true)
      const token = sessionStorage.getItem('token')
      const response = await axios.get('/api/stories/feed', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setStoryGroups(response.data)
    } catch (err) {
      console.error('Error fetching stories:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="stories-container"><p>Loading stories...</p></div>
  }

  return (
    <>
      <div className="stories-container">
        {storyGroups.length === 0 ? (
          <p className="no-stories">No stories yet. Follow users to see their stories!</p>
        ) : (
          <div className="stories-list">
            {storyGroups.map((group) => (
              <div
                key={group.user._id}
                className="story-user-item"
                onClick={() => {
                  console.log('Clicked story:', group)
                  setSelectedStory({ group, index: 0 })
                }}
              >
                <div className="story-overlay"></div>
                <div className="story-avatar-wrapper">
                  <img
                    src={group.user.profilePicture || 'https://via.placeholder.com/60'}
                    alt={group.user.username}
                    className="story-avatar"
                  />
                  <div className="story-ring"></div>
                </div>
                <p className="story-username">{group.user.username}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedStory && (
        <StoryViewer
          storyGroup={selectedStory.group}
          initialIndex={selectedStory.index}
          onClose={() => setSelectedStory(null)}
          onRefresh={fetchStories}
        />
      )}
    </>
  )
}

export default Stories
