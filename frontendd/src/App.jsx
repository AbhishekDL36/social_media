import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import Search from './pages/Search'
import Notifications from './pages/Notifications'
import FollowRequests from './pages/FollowRequests'
import Settings from './pages/Settings'
import PostDetail from './pages/PostDetail'
import FollowersList from './pages/FollowersList'
import Messages from './pages/Messages'
import SavedPosts from './pages/SavedPosts'
import Hashtag from './pages/Hashtag'
import GroupsList from './components/GroupsList'
import Navbar from './components/Navbar'
import NetworkError from './components/NetworkError'

function App() {
  const [user, setUser] = useState(null)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light'
  })

  useEffect(() => {
    const token = sessionStorage.getItem('token')
    const userId = sessionStorage.getItem('userId')
    if (token && userId) {
      setUser({ token, userId })
    }
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  const handleLogout = () => {
    setUser(null)
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('userId')
  }

  return (
    <Router>
      <NetworkError />
      {user && <Navbar theme={theme} toggleTheme={toggleTheme} onLogout={handleLogout} />}
      <Routes>
         <Route path="/login" element={<Login setUser={setUser} />} />
         <Route path="/register" element={<Register setUser={setUser} />} />
         <Route path="/" element={user ? <Home /> : <Login setUser={setUser} />} />
         <Route path="/profile" element={user ? <Profile /> : <Login setUser={setUser} />} />
         <Route path="/profile/:id" element={user ? <Profile /> : <Login setUser={setUser} />} />
         <Route path="/search" element={user ? <Search /> : <Login setUser={setUser} />} />
         <Route path="/notifications" element={user ? <Notifications /> : <Login setUser={setUser} />} />
         <Route path="/follow-requests" element={user ? <FollowRequests /> : <Login setUser={setUser} />} />
         <Route path="/settings" element={user ? <Settings theme={theme} toggleTheme={toggleTheme} /> : <Login setUser={setUser} />} />
         <Route path="/post/:postId" element={user ? <PostDetail /> : <Login setUser={setUser} />} />
         <Route path="/followers/:userId/:type" element={user ? <FollowersList /> : <Login setUser={setUser} />} />
         <Route path="/messages" element={user ? <Messages /> : <Login setUser={setUser} />} />
         <Route path="/messages/:userId" element={user ? <Messages /> : <Login setUser={setUser} />} />
         <Route path="/groups" element={user ? <GroupsList /> : <Login setUser={setUser} />} />
         <Route path="/saved" element={user ? <SavedPosts /> : <Login setUser={setUser} />} />
         <Route path="/hashtag/:hashtag" element={user ? <Hashtag /> : <Login setUser={setUser} />} />
         </Routes>
    </Router>
  )
}

export default App
