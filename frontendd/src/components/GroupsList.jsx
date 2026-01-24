import { useState, useEffect } from "react";
import axios from "axios";
import CreateGroupModal from "./CreateGroupModal";
import GroupChatModal from "./GroupChatModal";
import "./GroupsList.css";

function GroupsList() {
  const [groups, setGroups] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const currentUserId = sessionStorage.getItem("userId");

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const token = sessionStorage.getItem("token");
      const response = await axios.get("/api/groups", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGroups(response.data);
    } catch (err) {
      console.error("Error fetching groups:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGroupCreated = () => {
    setShowCreateModal(false);
    fetchGroups();
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm("Are you sure you want to delete this group?")) return;

    try {
      const token = sessionStorage.getItem("token");
      await axios.delete(`/api/groups/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGroups(groups.filter((g) => g._id !== groupId));
    } catch (err) {
      console.error("Error deleting group:", err);
      alert("Failed to delete group");
    }
  };

  if (loading) return <div className="groups-loading">Loading groups...</div>;

  return (
    <div className="groups-container">
      <div className="groups-header">
        <h2>Groups</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="create-group-btn"
        >
          + New Group
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="no-groups">
          <p>You haven't joined any groups yet.</p>
          <p>Create or join a group to get started!</p>
        </div>
      ) : (
        <div className="groups-list">
          {groups.map((group) => (
            <div key={group._id} className="group-card">
              <img
                src={
                  group.profilePicture ||
                  "https://via.placeholder.com/100?text=Group"
                }
                alt={group.name}
                className="group-avatar"
              />
              <div className="group-info">
                <h3>{group.name}</h3>
                <p className="group-description">{group.description}</p>
                <div className="group-meta">
                  <span className="member-count">
                    👥 {group.members.length} members
                  </span>
                  <span className="group-type">
                    {group.isPrivate ? "🔒 Private" : "🌐 Public"}
                  </span>
                </div>
              </div>
              <div className="group-actions">
                <button
                  onClick={() => setSelectedGroup(group)}
                  className="chat-btn"
                >
                  💬 Chat
                </button>
                {String(group.creator._id) === currentUserId && (
                  <button
                    onClick={() => handleDeleteGroup(group._id)}
                    className="delete-btn"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleGroupCreated}
        />
      )}

      {selectedGroup && (
        <GroupChatModal
          group={selectedGroup}
          onClose={() => setSelectedGroup(null)}
        />
      )}
    </div>
  );
}

export default GroupsList;
