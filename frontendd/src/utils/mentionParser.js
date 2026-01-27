/**
 * Parse text and identify mentions and hashtags
 * Returns array of {type: 'text'|'mention'|'hashtag', content: string}
 */
export function parseMentions(text) {
  if (!text) return []

  // Combined regex to match both @mentions and #hashtags
  const tokenRegex = /(@[a-zA-Z0-9_]+|#\w+)/g
  const parts = []
  let lastIndex = 0
  let match

  while ((match = tokenRegex.exec(text)) !== null) {
    // Add text before token
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex, match.index)
      })
    }

    // Determine if it's a mention or hashtag
    const token = match[0]
    if (token.startsWith('@')) {
      parts.push({
        type: 'mention',
        content: token
      })
    } else if (token.startsWith('#')) {
      parts.push({
        type: 'hashtag',
        content: token
      })
    }

    lastIndex = tokenRegex.lastIndex
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.substring(lastIndex)
    })
  }

  return parts.length > 0 ? parts : [{ type: 'text', content: text }]
}
