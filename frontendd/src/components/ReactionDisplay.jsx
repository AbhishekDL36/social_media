import { useState } from 'react'
import './ReactionDisplay.css'

function ReactionDisplay({ reactions, userReaction, onReactionClick, onShowReactors }) {
  const [showTooltip, setShowTooltip] = useState(null)

  if (!reactions || Object.keys(reactions).length === 0) {
    return null
  }

  const reactionEntries = Object.entries(reactions)
    .filter(([_, users]) => users && users.length > 0)
    .sort(([_, aUsers], [__, bUsers]) => bUsers.length - aUsers.length)

  const totalReactions = reactionEntries.reduce((sum, [_, users]) => sum + (users?.length || 0), 0)

  return (
    <div className="reaction-display">
      {reactionEntries.map(([emoji, users]) => (
        <button
          key={emoji}
          className={`reaction-item ${userReaction === emoji ? 'active' : ''}`}
          onClick={() => onReactionClick(emoji)}
          onMouseEnter={() => setShowTooltip(emoji)}
          onMouseLeave={() => setShowTooltip(null)}
          title={`${users?.length || 0} ${emoji}`}
        >
          <span className="reaction-emoji">{emoji}</span>
          <span className="reaction-count">{users?.length || 0}</span>

          {showTooltip === emoji && (
            <div className="reaction-tooltip">
              {users?.slice(0, 3).map((user, idx) => (
                <div key={idx} className="user-name">
                  {typeof user === 'object' ? user.username : 'User'}
                </div>
              ))}
              {users?.length > 3 && (
                <div className="more-users">+{users.length - 3} more</div>
              )}
            </div>
          )}
        </button>
      ))}

      {totalReactions > 0 && (
        <button
          className="total-reactions"
          onClick={onShowReactors}
          title="View all reactions"
        >
          {totalReactions}
        </button>
      )}
    </div>
  )
}

export default ReactionDisplay
