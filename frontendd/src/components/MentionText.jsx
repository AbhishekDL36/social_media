import { parseMentions } from '../utils/mentionParser'
import './MentionText.css'

function MentionText({ text }) {
  const parts = parseMentions(text)

  return (
    <span className="mention-text">
      {parts.map((part, idx) => (
        part.type === 'mention' ? (
          <span key={idx} className="mention-highlight">
            {part.content}
          </span>
        ) : (
          <span key={idx}>{part.content}</span>
        )
      ))}
    </span>
  )
}

export default MentionText
