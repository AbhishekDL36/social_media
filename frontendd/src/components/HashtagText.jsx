import { useNavigate } from 'react-router-dom'
import './HashtagText.css'

function HashtagText({ text }) {
  const navigate = useNavigate()

  if (!text) return null

  // Convert text to string if it's a React element
  let textString = typeof text === 'string' ? text : (text.props?.children || '')

  // Split text by hashtags but keep them
  const parts = textString.split(/(\#\w+)/g)

  return (
    <span className="hashtag-text">
      {parts.map((part, index) => {
        if (part && part.startsWith('#')) {
          const hashtag = part.slice(1) // Remove #
          return (
            <button
              key={index}
              className="hashtag-link"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                navigate(`/hashtag/${hashtag}`)
              }}
            >
              {part}
            </button>
          )
        }
        return <span key={index}>{part}</span>
      })}
    </span>
  )
}

export default HashtagText
