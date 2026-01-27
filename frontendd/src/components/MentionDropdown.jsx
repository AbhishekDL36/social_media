import { useState, useEffect, useRef } from 'react'
import axios from '../utils/axiosConfig'
import './MentionDropdown.css'

function MentionDropdown({ query, onMentionSelect, position }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [hoveredIndex, setHoveredIndex] = useState(-1)
  const debounceTimer = useRef(null)

  useEffect(() => {
    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    if (!query) {
      setUsers([])
      setError(null)
      return
    }

    // Debounce the search by 300ms
    debounceTimer.current = setTimeout(() => {
      const searchMentions = async () => {
        setLoading(true)
        setError(null)
        try {
          const token = sessionStorage.getItem('token')
          if (!token) {
            setError('Not authenticated')
            return
          }

          const response = await axios.get(`/api/users/mentions/${query}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          setUsers(response.data || [])
        } catch (err) {
          console.error('Error fetching mentions:', err)
          setUsers([])
          // Only show error for actual API failures, not "no results"
          if (err.response?.status !== 400) {
            setError('Failed to load suggestions')
          }
        } finally {
          setLoading(false)
        }
      }

      searchMentions()
    }, 300)

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [query])

  // Show dropdown if query is not empty OR if loading
  if (!query && users.length === 0 && !loading) return null

  return (
    <div className="mention-dropdown" style={{ position: 'absolute', ...position }}>
      {loading ? (
        <p className="mention-loading">Loading...</p>
      ) : error ? (
        <p className="mention-loading mention-error">{error}</p>
      ) : users.length > 0 ? (
        users.map((user, index) => (
          <div
            key={user._id}
            className={`mention-item ${hoveredIndex === index ? 'hovered' : ''}`}
            onClick={() => onMentionSelect(user)}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(-1)}
            role="button"
            tabIndex="0"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onMentionSelect(user)
              }
            }}
          >
            <img
              src={user.profilePicture || 'https://via.placeholder.com/32'}
              alt={user.username}
              className="mention-avatar"
            />
            <div className="mention-info">
              <span className="mention-username">@{user.username}</span>
              {user.fullName && <span className="mention-fullname">{user.fullName}</span>}
            </div>
          </div>
        ))
      ) : (
        <p className="mention-loading">No users found</p>
      )}
    </div>
  )
}

export default MentionDropdown
