import { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import './Search.css'

function messageUser(userId, navigate) {
  navigate(`/messages?user=${userId}`)
}

function Search() {
  const [searchQuery, setSearchQuery] = useState('')
  const [relationshipFilter, setRelationshipFilter] = useState('all')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSearch = async (e) => {
    e.preventDefault()
    setError('')
    
    if (searchQuery.length < 2) {
      setError('Search query must be at least 2 characters')
      return
    }

    setLoading(true)
    try {
      const token = sessionStorage.getItem('token')
      let url = `/api/users/search/${searchQuery}`
      if (relationshipFilter !== 'all') {
        url += `?relationshipStatus=${relationshipFilter}`
      }
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUsers(response.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Search failed')
      setUsers([])
    }
    setLoading(false)
  }

  return (
    <div className="search-container">
      <div className="search-box">
         <h2>Search Friends</h2>
         <form onSubmit={handleSearch}>
           <input
             type="text"
             placeholder="Search by username or email..."
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
           />
           <select
             className="relationship-filter"
             value={relationshipFilter}
             onChange={(e) => setRelationshipFilter(e.target.value)}
           >
             <option value="all">All Status</option>
             <option value="single">Single</option>
             <option value="married">Married</option>
             <option value="divorced">Divorced</option>
             <option value="prefer not to say">Prefer not to say</option>
           </select>
           <button type="submit" disabled={loading}>{loading ? 'Searching...' : 'Search'}</button>
         </form>
         {error && <p className="error">{error}</p>}
       </div>

      <div className="search-results">
        {users.length > 0 ? (
          users.map((user) => (
            <div key={user._id} className="user-card">
              <div
                className="user-card-content"
                onClick={() => navigate(`/profile/${user._id}`)}
              >
                {user.profilePicture && <img src={user.profilePicture} alt={user.username} />}
                <div className="user-info">
                   <h3>{user.username}</h3>
                   <p>{user.email}</p>
                   {user.bio && <p className="bio">{user.bio}</p>}
                   {user.relationshipStatus && user.relationshipStatus !== 'prefer not to say' && (
                     <p className="relationship-status-badge">
                       💑 {user.relationshipStatus.charAt(0).toUpperCase() + user.relationshipStatus.slice(1)}
                     </p>
                   )}
                   <p className="followers">{user.followers?.length || 0} followers</p>
                 </div>
              </div>
              <button
                className="message-btn-search"
                onClick={() => messageUser(user._id, navigate)}
              >
                Message
              </button>
            </div>
          ))
        ) : searchQuery && !loading ? (
          <p className="no-results">No users found</p>
        ) : (
          <p className="no-results">Start typing to search for friends</p>
        )}
      </div>
    </div>
  )
}

export default Search
