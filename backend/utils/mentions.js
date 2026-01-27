const User = require('../models/User');

/**
 * Extract mentions from text
 * Returns array of mentioned usernames: ['john', 'jane']
 */
function extractMentions(text) {
  if (!text) return [];
  
  // Regex to match @username pattern
  const mentionRegex = /@([a-zA-Z0-9_]+)/g;
  const mentions = [];
  let match;
  
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1]); // username without @
  }
  
  // Remove duplicates
  return [...new Set(mentions)];
}

/**
 * Find user IDs for mentioned usernames
 * Returns array of user objects: [{_id, username}, ...]
 */
async function findMentionedUsers(mentions) {
  if (!mentions || mentions.length === 0) return [];
  
  try {
    const users = await User.find({
      username: { $in: mentions }
    }).select('_id username');
    
    return users;
  } catch (err) {
    console.error('Error finding mentioned users:', err);
    return [];
  }
}

/**
 * Create mention notifications
 * Notifies all mentioned users about the mention
 */
async function createMentionNotifications(
  mentionedUsers,
  senderId,
  postId,
  commentId,
  mentionText,
  mentionedIn = 'comment'
) {
  if (!mentionedUsers || mentionedUsers.length === 0) return [];
  
  const Notification = require('../models/Notification');
  const notifications = [];
  
  try {
    for (const user of mentionedUsers) {
      // Don't notify user about their own mention
      if (user._id.toString() === senderId) continue;
      
      const notification = new Notification({
        recipient: user._id,
        sender: senderId,
        type: 'mention',
        post: postId,
        comment: commentId,
        message: mentionText,
        mentionedIn
      });
      
      await notification.save();
      notifications.push(notification);
    }
    
    return notifications;
  } catch (err) {
    console.error('Error creating mention notifications:', err);
    return [];
  }
}

/**
 * Helper function to process mentions in comment
 * Combines extraction, finding users, and creating notifications
 */
async function processMentionsInComment(
  text,
  senderId,
  postId,
  commentId = null,
  mentionedIn = 'comment'
) {
  try {
    // Extract mentioned usernames
    const mentions = extractMentions(text);
    
    if (mentions.length === 0) return [];
    
    // Find user IDs for mentioned usernames
    const mentionedUsers = await findMentionedUsers(mentions);
    
    // Create notifications
    const notifications = await createMentionNotifications(
      mentionedUsers,
      senderId,
      postId,
      commentId,
      text,
      mentionedIn
    );
    
    return notifications;
  } catch (err) {
    console.error('Error processing mentions:', err);
    return [];
  }
}

module.exports = {
  extractMentions,
  findMentionedUsers,
  createMentionNotifications,
  processMentionsInComment
};
