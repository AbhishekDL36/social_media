import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import Navbar from './components/Navbar'

function App() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userId = localStorage.getItem('userId')
    if (token && userId) {
      setUser({ token, userId })
    }
  }, [])

  return (
    <Router>
      {user && <Navbar />}
      <Routes>
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/register" element={<Register setUser={setUser} />} />
        <Route path="/" element={user ? <Home /> : <Login setUser={setUser} />} />
        <Route path="/profile/:id" element={user ? <Profile /> : <Login setUser={setUser} />} />
      </Routes>
    </Router>
  )
}

export default App
