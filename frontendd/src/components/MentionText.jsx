import { useNavigate } from 'react-router-dom'
import { parseMentions } from '../utils/mentionParser'
import './MentionText.css'

function MentionText({ text }) {
  const navigate = useNavigate()
  const parts = parseMentions(text)

  return (
    <span className="mention-text">
      {parts.map((part, idx) => {
        if (part.type === 'mention') {
          return (
            <span key={idx} className="mention-highlight">
              {part.content}
            </span>
          )
        } else if (part.type === 'hashtag') {
          const hashtag = part.content.slice(1) // Remove #
          return (
            <button
              key={idx}
              className="hashtag-link"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                navigate(`/hashtag/${hashtag}`)
              }}
            >
              {part.content}
            </button>
          )
        } else {
          return <span key={idx}>{part.content}</span>
        }
      })}
    </span>
  )
}

export default MentionText
