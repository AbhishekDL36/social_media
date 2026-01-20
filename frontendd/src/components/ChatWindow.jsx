import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import './ChatWindow.css'

function ChatWindow({ user, onBack }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    fetchMessages()
    // Refresh messages every 2 seconds for real-time feel
    const interval = setInterval(fetchMessages, 2000)
    return () => clearInterval(interval)
  }, [user._id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchMessages = async () => {
    try {
      const token = sessionStorage.getItem('token')
      const response = await axios.get(`/api/messages/conversation/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setMessages(response.data)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching messages:', err)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!input.trim()) return

    try {
      const token = sessionStorage.getItem('token')
      const response = await axios.post(
        `/api/messages/send/${user._id}`,
        { text: input },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setMessages([...messages, response.data])
      setInput('')
    } catch (err) {
      console.error('Error sending message:', err)
      alert('Error sending message')
    }
  }

  const currentUserId = sessionStorage.getItem('userId')

  return (
    <div className="chat-window">
      <div className="chat-header">
        <button onClick={onBack} className="back-btn">← Back</button>
        <h3>{user.username}</h3>
      </div>

      <div className="messages-list">
        {loading ? (
          <p className="loading">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="empty">No messages yet. Say hi!</p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg._id}
              className={`message ${msg.sender._id === currentUserId ? 'sent' : 'received'}`}
            >
              <p>{msg.text}</p>
              <span className="timestamp">
                {new Date(msg.createdAt).toLocaleTimeString()}
              </span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="message-input">
        <input
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  )
}

export default ChatWindow
