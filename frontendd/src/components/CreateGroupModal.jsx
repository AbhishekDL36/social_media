import { useState } from "react";
import axios from "../utils/axiosConfig";
import "./CreateGroupModal.css";

function CreateGroupModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isPrivate: false,
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [members, setMembers] = useState([]);
  const [friendsList, setFriendsList] = useState([]);
  const [showFriendsList, setShowFriendsList] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePicture(file);
    }
  };

  const handleAddMember = (friend) => {
    if (!members.find((m) => m._id === friend._id)) {
      setMembers([...members, friend]);
    }
    setShowFriendsList(false);
  };

  const handleRemoveMember = (friendId) => {
    setMembers(members.filter((m) => m._id !== friendId));
  };

  const handleLoadFriends = async () => {
    try {
      const token = sessionStorage.getItem("token");
      const response = await axios.get("/api/users/friends/list", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFriendsList(
        response.data.filter(
          (f) => !members.find((m) => m._id === f._id)
        )
      );
      setShowFriendsList(true);
    } catch (err) {
      console.error("Error loading friends:", err);
      setError("Failed to load friends");
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!formData.name.trim()) {
        setError("Group name is required");
        setLoading(false);
        return;
      }

      const formDataObj = new FormData();
      formDataObj.append("name", formData.name);
      formDataObj.append("description", formData.description);
      formDataObj.append("isPrivate", formData.isPrivate);
      if (profilePicture) {
        formDataObj.append("profilePicture", profilePicture);
      }
      members.forEach((m) => {
        formDataObj.append("memberIds", m._id);
      });

      const token = sessionStorage.getItem("token");
      await axios.post("/api/groups", formDataObj, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="create-group-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Group</h2>
          <button onClick={onClose} className="close-btn">
            ✕
          </button>
        </div>

        <form onSubmit={handleCreateGroup} className="create-group-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label>Group Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter group name"
              maxLength="100"
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter group description"
              maxLength="500"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>Group Picture</label>
            <div className="file-input-wrapper">
              <button
                type="button"
                onClick={() => document.querySelector('input[type="file"]').click()}
                className="choose-file-btn"
              >
                Choose Image
              </button>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
              <span className="file-name">
                {profilePicture ? profilePicture.name : "No image selected"}
              </span>
            </div>
          </div>

          <div className="form-group checkbox">
            <input
              type="checkbox"
              name="isPrivate"
              id="isPrivate"
              checked={formData.isPrivate}
              onChange={handleInputChange}
            />
            <label htmlFor="isPrivate">Private Group</label>
          </div>

          <div className="add-members-section">
            <button
              type="button"
              onClick={handleLoadFriends}
              className="add-members-btn"
            >
              + Add Members
            </button>

            {showFriendsList && (
              <div className="friends-list">
                {friendsList.length === 0 ? (
                  <p style={{ padding: "20px", textAlign: "center", color: "#999" }}>
                    No more friends to add
                  </p>
                ) : (
                  friendsList.map((friend) => (
                    <div key={friend._id} className="friend-item">
                      <img
                        src={
                          friend.profilePicture ||
                          "https://via.placeholder.com/40"
                        }
                        alt={friend.username}
                      />
                      <span>{friend.username}</span>
                      <button
                        type="button"
                        onClick={() => handleAddMember(friend)}
                        className="add-friend-btn"
                      >
                        +
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {members.length > 0 && (
              <div className="selected-members">
                <p>Selected Members ({members.length})</p>
                <div className="members-tags">
                  {members.map((member) => (
                    <div key={member._id} className="member-tag">
                      <span>{member.username}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member._id)}
                        className="remove-member-btn"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="cancel-btn"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateGroupModal;
