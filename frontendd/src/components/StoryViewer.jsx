import { useState, useEffect } from "react";
import axios from "axios";
import ShareStoryModal from "./ShareStoryModal";
import StoryReplyModal from "./StoryReplyModal";
import ReactionPicker from "./ReactionPicker";
import ReactionDisplay from "./ReactionDisplay";
import "./StoryViewer.css";

function StoryViewer({ storyGroup, initialIndex = 0, onClose, onRefresh }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reactions, setReactions] = useState({});
  const [userReaction, setUserReaction] = useState(null);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyCount, setReplyCount] = useState({});
  const currentUserId = sessionStorage.getItem("userId");

  const currentStory = storyGroup.stories[currentIndex];
  const totalStories = storyGroup.stories.length;

  // Initialize reactions and reply counts from stories
  useEffect(() => {
    const reactionsMap = {};
    const replyCounts = {};
    storyGroup.stories.forEach((story) => {
      reactionsMap[story._id] = story.reactions || {};
      replyCounts[story._id] = 0; // Will be updated when reply is sent
    });
    setReactions(reactionsMap);
    setReplyCount(replyCounts);
    updateUserReaction();
  }, [storyGroup, currentUserId]);

  const updateUserReaction = () => {
    if (currentStory?.reactions) {
      let userReact = null;
      Object.entries(currentStory.reactions).forEach(([emoji, users]) => {
        if (users?.some((id) => String(id) === String(currentUserId))) {
          userReact = emoji;
        }
      });
      setUserReaction(userReact);
    }
  };

  // Update user reaction when story changes
  useEffect(() => {
    if (currentStory?.reactions) {
      let userReact = null;
      Object.entries(currentStory.reactions).forEach(([emoji, users]) => {
        if (users?.some((id) => String(id) === String(currentUserId))) {
          userReact = emoji;
        }
      });
      setUserReaction(userReact);
    }
  }, [currentIndex, currentUserId, currentStory]);

  const handleReaction = async (emoji) => {
    try {
      const token = sessionStorage.getItem("token");
      await axios.put(
        `/api/stories/${currentStory._id}/reaction/${encodeURIComponent(emoji)}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setShowReactionPicker(false);
      // Refresh to get updated reactions
      onRefresh();
    } catch (err) {
      console.error("Error reacting to story:", err);
    }
  };

  useEffect(() => {
    if (paused) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Move to next story
          if (currentIndex < totalStories - 1) {
            setCurrentIndex(currentIndex + 1);
            return 0;
          } else {
            // Close viewer if last story
            onClose();
            return 100;
          }
        }
        return prev + 2;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [currentIndex, paused, totalStories, onClose]);

  const handleNext = () => {
    if (currentIndex < totalStories - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
    }
  };

  const formatTime = (date) => {
    const hours = Math.floor((Date.now() - new Date(date).getTime()) / 3600000);
    if (hours < 1) return "Now";
    if (hours < 24) return `${hours}h ago`;
    return "Old";
  };

  return (
    <div
      className="story-viewer"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Progress bars */}
      <div className="story-progress-bars">
        {storyGroup.stories.map((_, index) => (
          <div
            key={index}
            className="progress-bar"
            style={{
              width:
                index < currentIndex
                  ? "100%"
                  : index === currentIndex
                    ? `${progress}%`
                    : "0%",
            }}
          ></div>
        ))}
      </div>

      {/* Header */}
      <div className="story-header">
        <div className="story-user-info">
          <img
            src={
              storyGroup.user.profilePicture || "https://via.placeholder.com/40"
            }
            alt={storyGroup.user.username}
            className="story-user-avatar"
          />
          <div>
            <h4>{storyGroup.user.username}</h4>
            <p>{formatTime(currentStory.createdAt)}</p>
          </div>
        </div>
        <button onClick={onClose} className="story-close-btn">
          ✕
        </button>
      </div>

      {/* Media */}
      <div className="story-media-container">
        {currentStory.mediaType === "image" ? (
          <img src={currentStory.media} alt="Story" className="story-media" />
        ) : (
          <video
            src={currentStory.media}
            className="story-media"
            autoPlay
            muted
            loop
          />
        )}
      </div>

      {/* Caption */}
      {currentStory.caption && (
        <div className="story-caption">
          <p>{currentStory.caption}</p>
        </div>
      )}

      {/* Navigation */}
      <div className="story-nav">
        <button onClick={handlePrev} className="story-nav-btn story-prev">
          ‹
        </button>
        <button onClick={handleNext} className="story-nav-btn story-next">
          ›
        </button>
      </div>

      {/* Reaction Display */}
      {reactions[currentStory._id] && (
        <div className="story-reactions">
          <ReactionDisplay
            reactions={reactions[currentStory._id]}
            userReaction={userReaction}
            onReactionClick={handleReaction}
            onShowReactors={() => {}}
          />
        </div>
      )}

      {/* Reaction Button */}
      <button
        onClick={() => setShowReactionPicker(!showReactionPicker)}
        className={`story-reaction-btn ${userReaction ? "active" : ""}`}
        title="React to Story"
      >
        <span className="reaction-icon">{userReaction || "😊"}</span>
      </button>

      {/* Reaction Picker */}
      {showReactionPicker && (
        <ReactionPicker
          onReactionSelect={handleReaction}
          onClose={() => setShowReactionPicker(false)}
        />
      )}

      {/* Share Button */}
      {currentUserId !== storyGroup.user._id && (
        <button
          onClick={() => setShowShareModal(true)}
          className="story-share-btn"
          title="Share Story"
        >
          <span className="share-icon">📤</span>
        </button>
      )}

      {/* Reply Button */}
      {currentUserId !== storyGroup.user._id && (
        <button
          onClick={() => setShowReplyModal(true)}
          className="story-reply-btn"
          title="Reply to Story"
        >
          <span className="reply-icon">💬</span>
          {replyCount[currentStory._id] > 0 && (
            <span className="reply-badge">{replyCount[currentStory._id]}</span>
          )}
        </button>
      )}

      {/* Story count */}
      <div className="story-counter">
        {currentIndex + 1} / {totalStories}
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <ShareStoryModal
          storyId={currentStory._id}
          onClose={() => setShowShareModal(false)}
          onSuccess={() => {
            alert("Story shared successfully!");
            onRefresh();
          }}
        />
      )}

      {/* Reply Modal */}
      {showReplyModal && (
        <StoryReplyModal
          storyId={currentStory._id}
          storyAuthorName={storyGroup.user.username}
          onClose={() => setShowReplyModal(false)}
          onReplySuccess={(reply) => {
            setReplyCount((prev) => ({
              ...prev,
              [currentStory._id]: (prev[currentStory._id] || 0) + 1,
            }));
          }}
        />
      )}
    </div>
  );
}

export default StoryViewer;
