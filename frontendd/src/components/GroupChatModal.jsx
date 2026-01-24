import { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./GroupChatModal.css";

function GroupChatModal({ group, onClose }) {
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const currentUserId = sessionStorage.getItem("userId");

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, [group._id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    try {
      const token = sessionStorage.getItem("token");
      const response = await axios.get(`/api/groups/${group._id}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(response.data);
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    setSending(true);
    try {
      const token = sessionStorage.getItem("token");
      await axios.post(
        `/api/groups/${group._id}/messages`,
        { text: messageText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessageText("");
      await fetchMessages();
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleLikeMessage = async (messageId) => {
    try {
      const token = sessionStorage.getItem("token");
      await axios.put(
        `/api/groups/${group._id}/messages/${messageId}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchMessages();
    } catch (err) {
      console.error("Error liking message:", err);
    }
  };

  const formatTime = (date) => {
    const d = new Date(date);
    return d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading)
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
          <div className="loading">Loading messages...</div>
        </div>
      </div>
    );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="chat-header">
          <div className="chat-info">
            <img
              src={
                group.profilePicture ||
                "https://via.placeholder.com/40?text=Group"
              }
              alt={group.name}
              className="group-avatar"
            />
            <div>
              <h3>{group.name}</h3>
              <p className="member-count">{group.members.length} members</p>
            </div>
          </div>
          <button onClick={onClose} className="close-btn">
            ✕
          </button>
        </div>

        {/* Messages */}
        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="no-messages">No messages yet. Say hello!</div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg._id}
                className={`message ${
                  String(msg.sender._id) === currentUserId
                    ? "own-message"
                    : "other-message"
                }`}
              >
                <img
                  src={
                    msg.sender.profilePicture ||
                    "https://via.placeholder.com/32"
                  }
                  alt={msg.sender.username}
                  className="message-avatar"
                />
                <div className="message-content">
                  <p className="message-sender">{msg.sender.username}</p>
                  <p className="message-text">{msg.text}</p>
                  <div className="message-footer">
                    <span className="message-time">
                      {formatTime(msg.createdAt)}
                    </span>
                    <button
                      onClick={() => handleLikeMessage(msg._id)}
                      className={`like-btn ${
                        msg.likes?.some(
                          (id) => String(id) === currentUserId
                        )
                          ? "liked"
                          : ""
                      }`}
                    >
                      ❤️ {msg.likes?.length || 0}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSendMessage} className="message-form">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type a message..."
            disabled={sending}
          />
          <button
            type="submit"
            className="send-btn"
            disabled={!messageText.trim() || sending}
          >
            {sending ? "..." : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default GroupChatModal;
