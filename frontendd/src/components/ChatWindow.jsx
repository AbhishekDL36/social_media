import { useState, useEffect, useRef } from 'react'
import axios from '../utils/axiosConfig'
import { io } from 'socket.io-client'
import './ChatWindow.css'

function ChatWindow({ user, onBack }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [isTyping, setIsTyping] = useState(false)
  const [otherUserTyping, setOtherUserTyping] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [isSendingVoice, setIsSendingVoice] = useState(false)
  const [userStatus, setUserStatus] = useState(null)
  const messagesEndRef = useRef(null)
  const messagesListRef = useRef(null)
  const initialLoadRef = useRef(true)
  const currentUserId = sessionStorage.getItem('userId')
  const socketRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const recordingIntervalRef = useRef(null)

  // Initialize Socket.io
  useEffect(() => {
    if (!socketRef.current) {
      const socketURL = import.meta.env.VITE_API_URL || "https://social-media-7b30.onrender.com"
      console.log('Initializing Socket.io with URL:', socketURL)
      socketRef.current = io(socketURL, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5
      })
      
      socketRef.current.on('connect', () => {
        console.log('Connected to socket server')
        socketRef.current.emit('user:join', currentUserId)
      })

      socketRef.current.on('connect_error', (error) => {
        console.error('Socket connection error:', error)
      })

      socketRef.current.on('typing:indicator', (data) => {
        console.log('Typing indicator:', data)
        if (data.isTyping) {
          setOtherUserTyping(true)
        } else {
          setOtherUserTyping(false)
        }
      })

      socketRef.current.on('disconnect', () => {
        console.log('Disconnected from socket server')
      })
    }

    return () => {
      // Don't disconnect on unmount - keep connection alive
    }
  }, [])

  useEffect(() => {
    initialLoadRef.current = true
    fetchMessages()
    markNotificationsAsRead()
    fetchUserStatus()
    // Refresh messages every 2 seconds for real-time feel
    const interval = setInterval(fetchMessages, 2000)
    const statusInterval = setInterval(fetchUserStatus, 30000)
    return () => {
      clearInterval(interval)
      clearInterval(statusInterval)
    }
  }, [user._id])

  // Only scroll on initial load or when user sends a message
  useEffect(() => {
    if (initialLoadRef.current) {
      scrollToBottom()
      initialLoadRef.current = false
    }
  }, [messages.length === 0])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const scrollToBottomSmooth = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
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

  const markNotificationsAsRead = async () => {
    try {
      const token = sessionStorage.getItem('token')
      // Fetch all notifications
      const response = await axios.get('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      })
      // Find and mark message notifications from this user as read
      const messageNotifications = response.data.filter(
        n => n.type === 'message' && n.sender._id === user._id && !n.read
      )
      for (const notification of messageNotifications) {
        await axios.put(`/api/notifications/${notification._id}/read`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        })
      }
    } catch (err) {
      console.error('Error marking notifications as read:', err)
    }
  }

  const fetchUserStatus = async () => {
    try {
      const response = await axios.get(`/api/users/${user._id}/status`)
      setUserStatus(response.data)
    } catch (err) {
      console.error('Error fetching user status:', err)
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
      // Scroll to bottom only when user sends a message
      scrollToBottomSmooth()
    } catch (err) {
      console.error('Error sending message:', err)
      alert('Error sending message')
    }
  }

  const handleInputChange = (e) => {
    const value = e.target.value
    setInput(value)

    // Emit typing event
    if (value && !isTyping) {
      setIsTyping(true)
      console.log('User started typing, emitting typing:start', {
        userId: currentUserId,
        recipientId: user._id
      })
      socketRef.current?.emit('typing:start', {
        userId: currentUserId,
        recipientId: user._id
      })
    }

    // Clear previous timeout and set a new one
    clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      console.log('User stopped typing, emitting typing:stop', {
        userId: currentUserId,
        recipientId: user._id
      })
      socketRef.current?.emit('typing:stop', {
        userId: currentUserId,
        recipientId: user._id
      })
    }, 1000)
  }

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Delete this message?')) return

    try {
      const token = sessionStorage.getItem('token')
      await axios.delete(
        `/api/messages/${messageId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      // Update message in state
      setMessages(messages.map(msg => 
        msg._id === messageId 
          ? { ...msg, deleted: true, text: '' }
          : msg
      ))
    } catch (err) {
      console.error('Error deleting message:', err)
      alert('Could not delete message')
    }
  }

  const handleMessageLike = async (messageId) => {
    try {
      const token = sessionStorage.getItem('token')
      const response = await axios.put(
        `/api/messages/${messageId}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      // Update message in state
      setMessages(messages.map(msg => msg._id === messageId ? response.data : msg))
    } catch (err) {
      console.error('Error liking message:', err)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      let time = 0

      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data)
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      recordingIntervalRef.current = setInterval(() => {
        time += 1
        setRecordingTime(time)
      }, 1000)
    } catch (err) {
      console.error('Error accessing microphone:', err)
      alert('Unable to access microphone')
    }
  }

  const stopRecording = async () => {
    return new Promise((resolve) => {
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        clearInterval(recordingIntervalRef.current)
        setIsRecording(false)
        resolve(audioBlob)
      }
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
    })
  }

  const handleSendVoiceMessage = async () => {
    const audioBlob = await stopRecording()
    
    if (audioBlob.size === 0) {
      alert('Recording is empty')
      return
    }

    setIsSendingVoice(true)

    try {
      const formData = new FormData()
      formData.append('voiceMessage', audioBlob, 'voice-message.webm')
      formData.append('duration', recordingTime)

      const token = sessionStorage.getItem('token')
      const response = await axios.post(
        `/api/messages/send-voice/${user._id}`,
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      )
      setMessages([...messages, response.data])
      scrollToBottomSmooth()
    } catch (err) {
      console.error('Error sending voice message:', err)
      alert('Error sending voice message')
    } finally {
      setIsSendingVoice(false)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Update online status
  useEffect(() => {
    const updateStatus = async () => {
      try {
        const token = sessionStorage.getItem('token')
        await axios.put('/api/users/update-status', {}, {
          headers: { Authorization: `Bearer ${token}` }
        })
      } catch (err) {
        console.error('Error updating status:', err)
      }
    }

    updateStatus()
    const interval = setInterval(updateStatus, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="chat-window">
      <div className="chat-header">
        <button onClick={onBack} className="back-btn">← Back</button>
        <div className="chat-header-info">
          <h3>{user.username}</h3>
          {userStatus && (
            <span className={`chat-status ${userStatus.isOnline ? 'online' : 'offline'}`}>
              {userStatus.isOnline ? '🟢' : '⚫'} {userStatus.status}
            </span>
          )}
        </div>
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
              className={`message ${msg.sender._id === currentUserId ? 'sent' : 'received'} ${msg.deleted ? 'deleted' : ''}`}
            >
              {msg.storyReply && !msg.deleted && (
                <div className="story-reply-context">
                  <img 
                    src={msg.storyReply.storyMedia || 'https://via.placeholder.com/50'} 
                    alt="Story" 
                    className="story-thumbnail"
                  />
                  <div className="story-reply-info">
                    <small className="story-label">📖 Reply to Story</small>
                    {msg.storyReply.storyCaption && (
                      <p className="story-caption">{msg.storyReply.storyCaption}</p>
                    )}
                  </div>
                </div>
              )}
              <div className="message-content">
                {msg.messageType === 'voice' ? (
                  <div className="voice-message">
                    <audio controls className="voice-player">
                      <source src={msg.voiceUrl} type="audio/webm" />
                      Your browser does not support the audio element.
                    </audio>
                    <span className="voice-duration">🎙️ {formatTime(msg.voiceDuration)}</span>
                  </div>
                ) : (
                  <p className={msg.deleted ? 'deleted-text' : ''}>{msg.deleted ? 'This message was deleted' : msg.text}</p>
                )}
                {!msg.deleted && (
                  <button
                    onClick={() => handleMessageLike(msg._id)}
                    className={`message-like-btn ${msg.likes?.some(id => String(id) === String(currentUserId)) ? 'liked' : ''}`}
                  >
                    {msg.likes?.some(id => String(id) === String(currentUserId)) ? '❤️' : '♡'} {msg.likes?.length || 0}
                  </button>
                )}
                {msg.sender._id === currentUserId && !msg.deleted && (
                  <button
                    onClick={() => handleDeleteMessage(msg._id)}
                    className="message-delete-btn"
                    title="Delete message"
                  >
                    ✕
                  </button>
                )}
              </div>
              <span className="timestamp">
                {new Date(msg.createdAt).toLocaleTimeString()}
                {msg.sender._id === currentUserId && (
                  <span className="read-receipt" title={msg.readAt ? `Read at ${new Date(msg.readAt).toLocaleTimeString()}` : 'Not read'}>
                    {msg.read ? '✓✓' : '✓'}
                  </span>
                )}
              </span>
            </div>
          ))
        )}
        {otherUserTyping && (
          <div className="message received typing-indicator">
            <div className="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="message-input-area">
        {isRecording ? (
          <div className="recording-controls">
            <div className="recording-indicator">
              <span className="recording-dot"></span>
              Recording... {formatTime(recordingTime)}
            </div>
            <button
              type="button"
              onClick={handleSendVoiceMessage}
              disabled={isSendingVoice}
              className="send-voice-btn"
            >
              {isSendingVoice ? 'Sending...' : '✓ Send'}
            </button>
            <button
              type="button"
              onClick={() => {
                clearInterval(recordingIntervalRef.current)
                mediaRecorderRef.current?.stop()
                mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop())
                setIsRecording(false)
              }}
              className="cancel-voice-btn"
            >
              Cancel
            </button>
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="message-input">
            <input
              type="text"
              placeholder="Type a message..."
              value={input}
              onChange={handleInputChange}
            />
            <button
              type="button"
              onClick={startRecording}
              className="voice-record-btn"
              title="Record voice message"
            >
              🎙️
            </button>
            <button type="submit">Send</button>
          </form>
        )}
      </div>
    </div>
  )
}

export default ChatWindow
