import { useState, useEffect, Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Navbar from './components/Navbar'
import NetworkError from './components/NetworkError'

// Lazy load pages for better performance
const Profile = lazy(() => import('./pages/Profile'))
const Search = lazy(() => import('./pages/Search'))
const Notifications = lazy(() => import('./pages/Notifications'))
const FollowRequests = lazy(() => import('./pages/FollowRequests'))
const Settings = lazy(() => import('./pages/Settings'))
const PostDetail = lazy(() => import('./pages/PostDetail'))
const FollowersList = lazy(() => import('./pages/FollowersList'))
const Messages = lazy(() => import('./pages/Messages'))
const SavedPosts = lazy(() => import('./pages/SavedPosts'))
const Hashtag = lazy(() => import('./pages/Hashtag'))
const GroupsList = lazy(() => import('./components/GroupsList'))

// Loading component
const PageLoader = () => <div style={{padding: '40px', textAlign: 'center'}}>Loading...</div>

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
         <Route path="/profile" element={user ? <Suspense fallback={<PageLoader />}><Profile /></Suspense> : <Login setUser={setUser} />} />
         <Route path="/profile/:id" element={user ? <Suspense fallback={<PageLoader />}><Profile /></Suspense> : <Login setUser={setUser} />} />
         <Route path="/search" element={user ? <Suspense fallback={<PageLoader />}><Search /></Suspense> : <Login setUser={setUser} />} />
         <Route path="/notifications" element={user ? <Suspense fallback={<PageLoader />}><Notifications /></Suspense> : <Login setUser={setUser} />} />
         <Route path="/follow-requests" element={user ? <Suspense fallback={<PageLoader />}><FollowRequests /></Suspense> : <Login setUser={setUser} />} />
         <Route path="/settings" element={user ? <Suspense fallback={<PageLoader />}><Settings theme={theme} toggleTheme={toggleTheme} /></Suspense> : <Login setUser={setUser} />} />
         <Route path="/post/:postId" element={user ? <Suspense fallback={<PageLoader />}><PostDetail /></Suspense> : <Login setUser={setUser} />} />
         <Route path="/followers/:userId/:type" element={user ? <Suspense fallback={<PageLoader />}><FollowersList /></Suspense> : <Login setUser={setUser} />} />
         <Route path="/messages" element={user ? <Suspense fallback={<PageLoader />}><Messages /></Suspense> : <Login setUser={setUser} />} />
         <Route path="/messages/:userId" element={user ? <Suspense fallback={<PageLoader />}><Messages /></Suspense> : <Login setUser={setUser} />} />
         <Route path="/groups" element={user ? <Suspense fallback={<PageLoader />}><GroupsList /></Suspense> : <Login setUser={setUser} />} />
         <Route path="/saved" element={user ? <Suspense fallback={<PageLoader />}><SavedPosts /></Suspense> : <Login setUser={setUser} />} />
         <Route path="/hashtag/:hashtag" element={user ? <Suspense fallback={<PageLoader />}><Hashtag /></Suspense> : <Login setUser={setUser} />} />
         </Routes>
    </Router>
  )
}

export default App
