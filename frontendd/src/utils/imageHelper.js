// Helper to fix relative media URLs to absolute backend URLs
const BACKEND_URL = 'https://social-media-7b30.onrender.com'

export const fixMediaUrl = (url) => {
  if (!url) return url
  
  // If it's already absolute, return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  
  // If it's relative, make it absolute
  if (url.startsWith('/uploads/')) {
    return BACKEND_URL + url
  }
  
  return url
}

// Fix all media URLs in an object
export const fixMediaUrls = (obj) => {
  if (!obj) return obj
  
  if (typeof obj !== 'object') return obj
  
  if (Array.isArray(obj)) {
    return obj.map(fixMediaUrls)
  }
  
  const fixed = { ...obj }
  
  if (fixed.media) fixed.media = fixMediaUrl(fixed.media)
  if (fixed.voiceUrl) fixed.voiceUrl = fixMediaUrl(fixed.voiceUrl)
  if (fixed.profilePicture) fixed.profilePicture = fixMediaUrl(fixed.profilePicture)
  if (fixed.storyMedia) fixed.storyMedia = fixMediaUrl(fixed.storyMedia)
  
  // Fix nested objects like author
  if (fixed.author && typeof fixed.author === 'object') {
    fixed.author = fixMediaUrls(fixed.author)
  }
  
  // Fix array of comments
  if (fixed.comments && Array.isArray(fixed.comments)) {
    fixed.comments = fixed.comments.map(comment => {
      if (comment.author) {
        return { ...comment, author: fixMediaUrls(comment.author) }
      }
      return comment
    })
  }
  
  return fixed
}
