import { useState, useEffect } from 'react'
import axios from '../utils/axiosConfig'
import { useNavigate } from 'react-router-dom'
import './Search.css'

function messageUser(userId, navigate) {
  navigate(`/messages?user=${userId}`)
}

function Search() {
  const [searchQuery, setSearchQuery] = useState('')
  const [relationshipFilter, setRelationshipFilter] = useState('all')
  const [searchType, setSearchType] = useState('users') // 'users' or 'hashtags'
  const [users, setUsers] = useState([])
  const [hashtags, setHashtags] = useState([])
  const [trendingHashtags, setTrendingHashtags] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const navigate = useNavigate()

  // Fetch trending hashtags on component mount
  useEffect(() => {
    fetchTrendingHashtags()
  }, [])

  const fetchTrendingHashtags = async () => {
    try {
      const response = await axios.get('/api/hashtags/trending?limit=6')
      setTrendingHashtags(response.data)
    } catch (err) {
      console.error('Error fetching trending hashtags:', err)
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    setError('')
    setHasSearched(true)
    
    if (searchQuery.length < 2) {
      setError('Search query must be at least 2 characters')
      return
    }

    setLoading(true)
    try {
      const token = sessionStorage.getItem('token')
      
      if (searchType === 'hashtags') {
        // Search hashtags - remove # if user typed it
        const query = searchQuery.startsWith('#') ? searchQuery.slice(1) : searchQuery
        const response = await axios.get(`/api/hashtags/search/${query}`)
        setHashtags(response.data)
        setUsers([])
      } else {
        // Search users
        let url = `/api/users/search/${searchQuery}`
        if (relationshipFilter !== 'all') {
          url += `?relationshipStatus=${relationshipFilter}`
        }
        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setUsers(response.data)
        setHashtags([])
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Search failed')
      setUsers([])
      setHashtags([])
    }
    setLoading(false)
  }

  return (
    <div className="search-container">
      <div className="search-box">
         <h2>Search</h2>
         
         {/* Search Type Tabs */}
         <div className="search-type-tabs">
           <button
             className={`tab ${searchType === 'users' ? 'active' : ''}`}
             onClick={() => setSearchType('users')}
           >
             👤 People
           </button>
           <button
             className={`tab ${searchType === 'hashtags' ? 'active' : ''}`}
             onClick={() => setSearchType('hashtags')}
           >
             #️⃣ Hashtags
           </button>
         </div>

         <form onSubmit={handleSearch}>
           <input
             type="text"
             placeholder={searchType === 'hashtags' ? 'Search hashtags (e.g., travel)...' : 'Search by username or email...'}
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
           />
           {searchType === 'users' && (
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
           )}
           <button type="submit" disabled={loading}>{loading ? 'Searching...' : 'Search'}</button>
         </form>
         {error && <p className="error">{error}</p>}
       </div>

      <div className="search-results">
        {!hasSearched && searchQuery.length === 0 ? (
          // Show trending hashtags by default
          <div className="trending-section">
            <h3>Trending Hashtags</h3>
            <div className="trending-grid">
              {trendingHashtags.length > 0 ? (
                trendingHashtags.map((hashtag) => (
                  <div
                    key={hashtag.name}
                    className="trending-card"
                    onClick={() => navigate(`/hashtag/${hashtag.name}`)}
                  >
                    <div className="trending-icon">#</div>
                    <div className="trending-info">
                      <h4>{hashtag.name}</h4>
                      <p>{hashtag.postCount} posts</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-results">No trending hashtags</p>
              )}
            </div>
          </div>
        ) : searchType === 'hashtags' ? (
          // Hashtag Results
          hashtags.length > 0 ? (
            hashtags.map((hashtag) => (
              <div key={hashtag.name} className="hashtag-card">
                <div
                  className="hashtag-card-content"
                  onClick={() => navigate(`/hashtag/${hashtag.name}`)}
                >
                  <div className="hashtag-icon">#</div>
                  <div className="hashtag-info">
                    <h3>{hashtag.name}</h3>
                    <p>{hashtag.postCount} posts</p>
                    <p className="followers">{hashtag.followers?.length || 0} followers</p>
                  </div>
                </div>
                <button
                  className="view-btn-search"
                  onClick={() => navigate(`/hashtag/${hashtag.name}`)}
                >
                  View
                </button>
              </div>
            ))
          ) : searchQuery && !loading ? (
            <p className="no-results">No hashtags found</p>
          ) : (
            <p className="no-results">Start typing to search for hashtags</p>
          )
        ) : (
          // User Results
          users.length > 0 ? (
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
            <p className="no-results">Start typing to search for people</p>
          )
        )}
      </div>
    </div>
  )
}

export default Search
