/**
 * Parse text and identify mentions
 * Returns array of {type: 'text'|'mention', content: string}
 */
export function parseMentions(text) {
  if (!text) return []

  const mentionRegex = /@([a-zA-Z0-9_]+)/g
  const parts = []
  let lastIndex = 0
  let match

  while ((match = mentionRegex.exec(text)) !== null) {
    // Add text before mention
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex, match.index)
      })
    }

    // Add mention
    parts.push({
      type: 'mention',
      content: match[0] // Includes the @
    })

    lastIndex = mentionRegex.lastIndex
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
