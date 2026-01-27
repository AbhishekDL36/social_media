const Post = require('../models/Post');
const Hashtag = require('../models/Hashtag');

// Check and publish scheduled posts every minute
async function publishScheduledPosts() {
  try {
    const now = new Date();
    
    // Find all scheduled posts that should be published
    const postsToPublish = await Post.find({
      isScheduled: true,
      scheduledTime: { $lte: now }
    });

    for (const post of postsToPublish) {
      try {
        // Update hashtags
        for (const tag of post.hashtags) {
          await Hashtag.findOneAndUpdate(
            { name: tag },
            {
              $addToSet: { posts: post._id },
              $inc: { postCount: 1 }
            },
            { upsert: true, new: true }
          );
        }

        // Mark as published
        post.isScheduled = false;
        post.isPublished = true;
        post.createdAt = new Date();
        await post.save();

        console.log(`[Scheduler] Published scheduled post: ${post._id}`);
      } catch (err) {
        console.error(`[Scheduler] Error publishing post ${post._id}:`, err);
      }
    }

    if (postsToPublish.length > 0) {
      console.log(`[Scheduler] Published ${postsToPublish.length} scheduled posts`);
    }
  } catch (err) {
    console.error('[Scheduler] Error in publishScheduledPosts:', err);
  }
}

// Start the scheduler
function startScheduler() {
  // Run immediately on startup
  publishScheduledPosts();
  
  // Then run every minute
  setInterval(publishScheduledPosts, 60000);
  
  console.log('[Scheduler] Post scheduler started (checks every 60 seconds)');
}

module.exports = { startScheduler, publishScheduledPosts };
