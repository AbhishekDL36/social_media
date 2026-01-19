import { useNavigate } from 'react-router-dom'
import './Navbar.css'

function Navbar() {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <h1 onClick={() => navigate('/')} className="logo">Instagram Clone</h1>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>
    </nav>
  )
}

export default Navbar
