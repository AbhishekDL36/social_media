import { useState, useEffect } from 'react'
import axios from 'axios'
import './Home.css'
import Post from '../components/Post'

function Home() {
  const [posts, setPosts] = useState([])
  const [caption, setCaption] = useState('')
  const [image, setImage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      const response = await axios.get('/api/posts')
      setPosts(response.data)
    } catch (err) {
      console.error('Error fetching posts:', err)
    }
  }

  const handleCreatePost = async (e) => {
    e.preventDefault()
    if (!caption || !image) {
      alert('Please fill in all fields')
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await axios.post(
        '/api/posts',
        { caption, image },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setPosts([response.data, ...posts])
      setCaption('')
      setImage('')
    } catch (err) {
      alert('Error creating post')
    }
    setLoading(false)
  }

  return (
    <div className="home">
      <div className="create-post">
        <h2>Create a Post</h2>
        <form onSubmit={handleCreatePost}>
          <textarea
            placeholder="Write a caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
          <input
            type="text"
            placeholder="Image URL"
            value={image}
            onChange={(e) => setImage(e.target.value)}
          />
          <button type="submit" disabled={loading}>{loading ? 'Posting...' : 'Post'}</button>
        </form>
      </div>

      <div className="posts">
        {posts.map((post) => (
          <Post key={post._id} post={post} onPostUpdate={fetchPosts} />
        ))}
      </div>
    </div>
  )
}

export default Home
