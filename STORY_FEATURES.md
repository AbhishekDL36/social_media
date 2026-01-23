# Story Features Implementation

## 1. Auto-Delete Stories After 24 Hours

The Story model already has TTL (Time-To-Live) configured to automatically delete stories after 24 hours.

**File:** `backend/models/Story.js`
```javascript
createdAt: {
  type: Date,
  default: Date.now,
  expires: 86400  // 24 hours in seconds
}
```

MongoDB automatically removes documents when the TTL time expires.

---

## 2. Story Sharing Feature

### Backend Components

#### New Model: StoryShare
**File:** `backend/models/StoryShare.js`
- Tracks story shares between users
- Stores: story ID, sharer ID, recipient ID, optional message, timestamp

#### New API Endpoints

1. **POST /api/stories/:storyId/share**
   - Share a story with one or more friends
   - **Requirements:**
     - User must be following the story author OR be the story author
     - For private accounts: recipient must be a mutual follower
     - For public accounts: any follower can share
   - **Body:**
     ```json
     {
       "friendIds": ["userId1", "userId2"],
       "message": "Optional message" (optional)
     }
     ```
   - Creates notifications for recipients

2. **GET /api/stories/received/shares**
   - Retrieve all stories shared with the current user
   - Returns: list of shared stories with sharer info

### Frontend Components

#### New Component: ShareStoryModal
**Files:**
- `frontendd/src/components/ShareStoryModal.jsx`
- `frontendd/src/components/ShareStoryModal.css`

**Features:**
- Modal dialog for selecting friends to share with
- Shows list of all followed users with checkboxes
- Optional message input (max 200 chars)
- Real-time character count
- Responsive design with scrollable friend list

#### Updated Component: StoryViewer
**File:** `frontendd/src/components/StoryViewer.jsx`

**Changes:**
- Added Share button (📤) visible to non-story-authors
- Share button opens ShareStoryModal
- Button positioned next to Like button

**Styling:** `frontendd/src/components/StoryViewer.css`
- Share button styled to match Like button
- Hover effects and animations included

---

## 3. Notifications for Story Shares

When a story is shared, a notification is automatically created:
- Type: `story_share`
- Message format: `"[Username] shared a story with you"` or with custom message
- Recipient: User receiving the share
- Reference: Story ID for easy linking

---

## 4. Access Control Rules

### Sharing Eligibility
- ✅ Can share stories from users you follow
- ✅ Can share your own stories
- ❌ Cannot share stories from users you don't follow

### Recipient Eligibility

**For Public Accounts:**
- Story can be shared with any of your followers

**For Private Accounts:**
- Story can only be shared with mutual followers (they must follow the story author AND you must follow them)

---

## Usage Flow

1. User views a story in StoryViewer
2. Clicks the Share (📤) button
3. ShareStoryModal opens showing all followed users
4. User selects friends and optionally adds a message
5. Clicks "Share" button
6. Backend validates permissions and creates shares
7. Notifications sent to recipients
8. Success message displayed to user

---

## Database Queries

### Find all stories shared with a user
```javascript
StoryShare.find({ sharedWith: userId })
  .populate('story')
  .populate('sharedBy', 'username profilePicture')
```

### Find all stories a user has shared
```javascript
StoryShare.find({ sharedBy: userId })
  .populate('story')
  .populate('sharedWith', 'username profilePicture')
```

---

## Future Enhancements

1. Add story reaction types (like, heart, laugh, etc.)
2. Implement story reply/DM from viewers
3. Story analytics (views over time, top viewers)
4. Story drafts/schedule posting
5. Story hashtag/mention support
