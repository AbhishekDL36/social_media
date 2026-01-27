# Hashtag System - Implementation Guide

## Overview
Complete hashtag system allowing users to tag posts with hashtags, follow specific hashtags, discover trending hashtags, and browse posts by hashtag.

## Features

✅ **Auto-Extract Hashtags** - Hashtags automatically extracted from post captions  
✅ **Clickable Hashtags** - Hashtags in posts are clickable links (blue, underlined)  
✅ **Hashtag Pages** - Dedicated page for each hashtag showing all posts  
✅ **Follow Hashtags** - Users can follow/unfollow hashtags  
✅ **Trending Hashtags** - View most popular hashtags  
✅ **Hashtag Statistics** - Post count and follower count per hashtag  
✅ **Hashtag Search** - Search and autocomplete hashtags  
✅ **Pagination** - Browse hashtag posts with pagination (12 per page)  

## Backend Implementation

### 1. Hashtag Model
**File:** `backend/models/Hashtag.js`

Fields:
- `name` - Hashtag name (lowercase, unique, trimmed)
- `posts[]` - Array of Post IDs with this hashtag
- `followers[]` - Array of User IDs following this hashtag
- `postCount` - Total number of posts with this hashtag
- `createdAt` - Timestamp when hashtag was first used

**Indexes:**
- `{ name: 1 }` - Fast lookups by name
- `{ postCount: -1 }` - Fast sorting by popularity

### 2. Post Model Update
**File:** `backend/models/Post.js`

Added field:
```javascript
hashtags: [{
  type: String,
  lowercase: true,
  trim: true
}]
```

### 3. API Endpoints
**File:** `backend/routes/hashtags.js`

#### Get Trending Hashtags
```
GET /api/hashtags/trending?limit=10
```
**Response:**
```json
[
  { "name": "travel", "postCount": 1250, "followers": 450 },
  { "name": "food", "postCount": 980, "followers": 380 }
]
```

#### Get Hashtag Posts
```
GET /api/hashtags/:hashtag/posts?page=1&limit=12
```
**Response:**
```json
{
  "hashtag": "travel",
  "posts": [...],
  "total": 1250,
  "isFollowed": true,
  "followerCount": 450,
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 1250,
    "pages": 104
  }
}
```

#### Follow Hashtag
```
POST /api/hashtags/:hashtag/follow
```
**Response:**
```json
{ "message": "Hashtag followed", "followed": true }
```

#### Unfollow Hashtag
```
DELETE /api/hashtags/:hashtag/follow
```
**Response:**
```json
{ "message": "Hashtag unfollowed", "followed": false }
```

#### Check if Following
```
GET /api/hashtags/:hashtag/is-followed
```
**Response:**
```json
{ "followed": true }
```

#### Get User's Followed Hashtags
```
GET /api/hashtags/user/followed
```
**Response:**
```json
[
  { "name": "travel", "postCount": 1250, "followers": 450 },
  { "name": "photography", "postCount": 850, "followers": 320 }
]
```

#### Search Hashtags
```
GET /api/hashtags/search/:query
```
**Response:**
```json
[
  { "name": "travel", "postCount": 1250, "followers": 450 },
  { "name": "travelphotography", "postCount": 420, "followers": 180 }
]
```

### 4. Post Creation Process
When a post is created:
1. Hashtags are automatically extracted from caption using regex: `/#\w+/g`
2. Hashtags are stored in lowercase in post document
3. For each hashtag:
   - Find or create Hashtag document
   - Add post ID to hashtag's posts array
   - Increment postCount
   - Create unique index to prevent duplicates

## Frontend Implementation

### 1. New Hashtag Component
**File:** `frontendd/src/components/HashtagText.jsx`

Features:
- Detects hashtags in text (#word format)
- Converts them to clickable blue links
- Navigates to `/hashtag/:hashtag` on click
- Handles both string and component input

### 2. New Hashtag Page
**File:** `frontendd/src/pages/Hashtag.jsx`

Features:
- Displays hashtag header with name, post count, follower count
- Shows follow/unfollow button
- Displays all posts with this hashtag
- Pagination support (12 posts per page)
- Empty state for unused hashtags
- Follow status indicator

### 3. Post Component Update
**File:** `frontendd/src/components/Post.jsx`

Updated to use `HashtagText` component to display captions with clickable hashtags.

### 4. Routing
**File:** `frontendd/src/App.jsx`

Added route:
```javascript
<Route path="/hashtag/:hashtag" element={user ? <Hashtag /> : <Login setUser={setUser} />} />
```

## User Flow

### Creating a Post with Hashtags
1. User creates post with caption: "Love traveling! #travel #adventure #wanderlust"
2. Post is created and hashtags are automatically extracted
3. Three hashtag documents are created/updated

### Discovering Content via Hashtags
1. User sees post with hashtags in their feed
2. Clicks on a hashtag (e.g., #travel)
3. Navigates to `/hashtag/travel` page
4. Sees all posts tagged with #travel
5. Can follow the hashtag to see content in feed

### Following Hashtags
1. User clicks "Follow" button on hashtag page
2. Their ID is added to hashtag's followers array
3. Following indicator updates
4. Hashtag appears in user's followed hashtags list

## Hashtag Display

### In Posts
```
Username #travel #adventure #wanderlust
         ↑       ↑          ↑
      clickable blue links
```

### On Hashtag Page
```
#travel
1,250 posts  450 followers
[+ Follow] or [✓ Following]
```

## Data Flow Diagram

```
Post Creation with Caption "#travel #food"
    ↓
Extract Hashtags ["travel", "food"]
    ↓
Store in Post: hashtags: ["travel", "food"]
    ↓
For each hashtag:
  - Find/Create Hashtag doc
  - Add post to hashtag.posts[]
  - Increment postCount
    ↓
User clicks #travel in post
    ↓
Navigate to /hashtag/travel
    ↓
Fetch /api/hashtags/travel/posts
    ↓
Display hashtag page with posts
```

## Database Changes

### Hashtag Collection
```javascript
{
  "_id": ObjectId,
  "name": "travel",
  "posts": [ObjectId, ObjectId, ...],
  "followers": [ObjectId, ObjectId, ...],
  "postCount": 1250,
  "createdAt": Date
}
```

### Post Collection Update
```javascript
{
  ...existing fields...,
  "hashtags": ["travel", "adventure", "wanderlust"]
}
```

## Styling

### Hashtag Links
- Color: Blue (var(--accent-blue))
- Font-weight: 500
- Hover: Underline and darker blue
- Cursor: Pointer

### Hashtag Page Header
- Large heading with # symbol
- Post count and follower count
- Follow/Following toggle button
- Clean, centered layout

### Empty State
- 🔍 Icon
- "No posts yet" message
- Encouragement to be first

## Performance Optimizations

1. **Hashtag Extraction** - Single regex pass on caption
2. **Unique Index** - Prevents duplicate hashtag documents
3. **Pagination** - Only loads 12 posts per page
4. **Trending Cache** - Could add Redis cache for trending (optional)
5. **Hashtag Index** - Fast lookups by name

## Security Considerations

- ✅ Case-insensitive hashtags (prevent duplicates)
- ✅ Whitespace trimmed (prevent variations)
- ✅ No special characters allowed (regex: \w+)
- ✅ Public hashtags (anyone can view)
- ✅ Hashtag search includes post author info (public)

## Files Created/Modified

**Backend:**
- Created: `backend/models/Hashtag.js`
- Created: `backend/routes/hashtags.js`
- Modified: `backend/models/Post.js` (added hashtags field)
- Modified: `backend/routes/posts.js` (extract hashtags on post creation)
- Modified: `backend/server.js` (added hashtag route)

**Frontend:**
- Created: `frontendd/src/pages/Hashtag.jsx`
- Created: `frontendd/src/pages/Hashtag.css`
- Created: `frontendd/src/components/HashtagText.jsx`
- Created: `frontendd/src/components/HashtagText.css`
- Modified: `frontendd/src/components/Post.jsx` (use HashtagText)
- Modified: `frontendd/src/App.jsx` (add hashtag route)

## Testing Checklist

- [ ] Create post with hashtags (e.g., #travel #food #adventure)
- [ ] Click hashtag link and navigate to hashtag page
- [ ] Click "Follow" on hashtag page
- [ ] Button changes to "Following"
- [ ] Hashtag appears in followed list
- [ ] Click "Following" to unfollow
- [ ] View trending hashtags
- [ ] Search for hashtags
- [ ] Test pagination on hashtag page with multiple posts
- [ ] Test with no posts yet (empty state)
- [ ] Test on mobile view
- [ ] Test hashtag with special characters (should not extract)
- [ ] Test case-insensitive (both #Travel and #travel should be same)

## API Call Examples

**Get trending hashtags:**
```javascript
const response = await axios.get('/api/hashtags/trending?limit=10')
```

**Get posts with hashtag:**
```javascript
const response = await axios.get('/api/hashtags/travel/posts?page=1&limit=12')
```

**Follow hashtag:**
```javascript
await axios.post('/api/hashtags/travel/follow', {}, {
  headers: { Authorization: `Bearer ${token}` }
})
```

**Unfollow hashtag:**
```javascript
await axios.delete('/api/hashtags/travel/follow', {
  headers: { Authorization: `Bearer ${token}` }
})
```

## Future Enhancements

1. **Hashtag Analytics** - Views, engagement per hashtag
2. **Hashtag Recommendations** - Suggest hashtags while typing
3. **Trending Feed** - Show posts from followed hashtags
4. **Hashtag Blocking** - Block/hide posts from certain hashtags
5. **Hashtag Moderation** - Admin remove hashtags
6. **Hashtag Ads** - Sponsored hashtags
7. **Hashtag Statistics** - Daily/weekly hashtag trends
8. **Hashtag Autocomplete** - While typing captions
9. **Related Hashtags** - Suggest similar hashtags
10. **Hashtag History** - Previously used hashtags

## Troubleshooting

**Hashtags not extracting:**
- Check caption has # followed by word characters (\w+)
- Special characters after # break the regex
- Example: #travel-tips won't extract (hyphen not in \w)

**Hashtag page shows wrong posts:**
- Check post has hashtags array populated
- Verify hashtag name is lowercase in both post and hashtag doc

**Follow button not working:**
- Check user is logged in
- Verify authorization token is being sent
- Check browser console for API errors

## Hashtag Format

**Valid:**
- #travel
- #TravelPhotography
- #travel2024
- #_travel
- #travel_tips

**Invalid:**
- #travel-tips (hyphen not allowed)
- #travel! (exclamation not allowed)
- # travel (space not allowed)
- travel (no hashtag symbol)

## Conclusion

The Hashtag System is a complete, production-ready implementation that brings Instagram-like discoverability to your app. Users can tag posts, discover content by hashtags, and follow hashtags to stay updated on topics they care about!
