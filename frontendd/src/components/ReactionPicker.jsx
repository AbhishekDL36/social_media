import { useState } from 'react'
import './ReactionPicker.css'

const REACTIONS = [
  { emoji: '❤️', label: 'Love', name: 'love' },
  { emoji: '😂', label: 'Haha', name: 'laugh' },
  { emoji: '🔥', label: 'Fire', name: 'fire' },
  { emoji: '😮', label: 'Wow', name: 'wow' },
  { emoji: '😢', label: 'Sad', name: 'sad' },
  { emoji: '😡', label: 'Angry', name: 'angry' }
]

function ReactionPicker({ onReactionSelect, onClose }) {
  const [hoveredReaction, setHoveredReaction] = useState(null)

  return (
    <div className="reaction-picker-overlay" onClick={onClose}>
      <div className="reaction-picker" onClick={e => e.stopPropagation()}>
        {REACTIONS.map((reaction) => (
          <button
            key={reaction.emoji}
            className="reaction-btn"
            title={reaction.label}
            onMouseEnter={() => setHoveredReaction(reaction.emoji)}
            onMouseLeave={() => setHoveredReaction(null)}
            onClick={() => {
              onReactionSelect(reaction.emoji)
              onClose()
            }}
          >
            <span className={`reaction-emoji ${hoveredReaction === reaction.emoji ? 'active' : ''}`}>
              {reaction.emoji}
            </span>
            {hoveredReaction === reaction.emoji && (
              <span className="reaction-label">{reaction.label}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

export default ReactionPicker
