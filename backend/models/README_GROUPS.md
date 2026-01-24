# Groups Feature - Backend Documentation

## Models Overview

### Group.js
Represents a group where multiple users can communicate.

**Schema Fields:**
```javascript
{
  name: String,                    // Group name (required)
  description: String,             // Optional group description
  profilePicture: String,          // Group avatar URL
  creator: ObjectId (User),        // Group creator (becomes admin)
  members: [ObjectId (User)],      // All group members
  admins: [ObjectId (User)],       // Group administrators
  isPrivate: Boolean,              // Private/Public flag (default: false)
  createdAt: Date,                 // Creation timestamp
  updatedAt: Date                  // Last update timestamp
}
```

**Pre-save Hooks:**
- Auto-adds creator to members array
- Auto-adds creator to admins array
- Updates `updatedAt` on save

**Key Points:**
- Creator is always member and admin
- Cannot have empty members array
- isPrivate affects member invitation behavior
- Profile picture optional (can be null)

**Example:**
```javascript
const group = new Group({
  name: "React Developers",
  description: "A group for React.js developers",
  creator: userId,
  members: [userId],
  admins: [userId],
  isPrivate: false
});
await group.save();
```

### GroupMessage.js
Represents a message sent in a group.

**Schema Fields:**
```javascript
{
  group: ObjectId (Group),         // Which group (required)
  sender: ObjectId (User),         // Who sent (required)
  text: String,                    // Message content (required)
  likes: [ObjectId (User)],        // Who liked the message
  createdAt: Date                  // When sent
}
```

**Key Points:**
- Text is required and must be non-empty
- Sender must be group member
- Likes tracks users who reacted to message
- Immutable once created (no updates)
- Deleted when group is deleted

**Example:**
```javascript
const message = new GroupMessage({
  group: groupId,
  sender: userId,
  text: "Hello group!"
});
await message.save();
```

## Routes Overview (groups.js)

### Group CRUD

#### Create Group
```
POST /api/groups
Authorization: Bearer {token}
Content-Type: multipart/form-data

{
  name: "Group Name",              // Required
  description: "Optional",         // Optional
  profilePicture: File,            // Optional
  isPrivate: true/false,           // Optional, default: false
  memberIds: ["id1", "id2"]        // Optional
}

Returns: Group object with populated members/admins
```

#### List Groups
```
GET /api/groups
Authorization: Bearer {token}

Returns: Array of groups (user is member of)
Sorted by: Latest activity (updatedAt)
```

#### Get Single Group
```
GET /api/groups/:groupId
Authorization: Bearer {token}

Returns: Single group with full population
Access: Members only (403 if not member)
```

#### Update Group
```
PUT /api/groups/:groupId
Authorization: Bearer {token}
Content-Type: multipart/form-data

{
  name: "New Name",
  description: "New description",
  isPrivate: true/false,
  profilePicture: File
}

Access: Admins only
```

#### Delete Group
```
DELETE /api/groups/:groupId
Authorization: Bearer {token}

Access: Creator only
Side Effect: Deletes all group messages
```

### Member Management

#### Add Member
```
POST /api/groups/:groupId/members
Authorization: Bearer {token}

{
  userId: "memberId"
}

Behavior:
- Public: Adds directly
- Private: Sends invitation notification
Access: Admins only
```

#### Remove Member
```
DELETE /api/groups/:groupId/members/:memberId
Authorization: Bearer {token}

Access: Admins or member removing self
Cannot: Remove creator
```

#### Promote to Admin
```
PUT /api/groups/:groupId/members/:memberId/admin
Authorization: Bearer {token}

Access: Admins only
Check: User must be member first
```

#### Demote Admin
```
DELETE /api/groups/:groupId/admins/:adminId
Authorization: Bearer {token}

Access: Admins only
Cannot: Demote creator
```

### Messaging

#### Send Message
```
POST /api/groups/:groupId/messages
Authorization: Bearer {token}

{
  text: "Message content"
}

Access: Members only
Notify: Other group members
```

#### Get Messages
```
GET /api/groups/:groupId/messages
Authorization: Bearer {token}

Returns: Array of messages (chronological)
Access: Members only
```

#### Like Message
```
PUT /api/groups/:groupId/messages/:messageId/like
Authorization: Bearer {token}

Toggles like on/off for current user
Access: Members only
```

### Search

#### Search Groups
```
GET /api/groups/search?query=searchTerm
Authorization: Bearer {token}

Returns: Public groups matching name/description
Limit: 20 results
Access: All authenticated users
```

## Authentication & Authorization

### Protection Middleware
All routes use `protect` middleware that:
1. Validates JWT token
2. Extracts userId
3. Attaches to req.userId

### Access Control

**Creator:**
- Can delete group
- Is admin by default
- Cannot be removed

**Admin:**
- Can add/remove members
- Can edit group info
- Can promote/demote other admins
- Cannot delete group (creator only)
- Cannot demote themselves (must have another admin)

**Member:**
- Can view group info
- Can send messages
- Can like messages
- Can remove themselves

**Non-Member:**
- Cannot view messages
- Cannot access group info (403)
- Can be invited to private groups

## Error Handling

All endpoints return standard error responses:

```javascript
// 400 Bad Request
{
  message: "Group name is required"
}

// 403 Forbidden
{
  message: "Only admins can add members"
}

// 404 Not Found
{
  message: "Group not found"
}

// 500 Server Error
{
  message: "Error message"
}
```

## Notifications Integration

Triggers notifications in these scenarios:

```javascript
// When added to group
{
  type: 'group_add',
  message: '{username} added you to "{group name}" group'
}

// When invited to private group
{
  type: 'group_invite',
  message: 'You were invited to join "{group name}" group'
}

// When someone sends message
{
  type: 'group_message',
  message: '{username} sent a message in "{group name}"'
}
```

## Database Queries

### Common Queries

```javascript
// Get user's groups
Group.find({ members: userId })

// Get group with all info
Group.findById(id)
  .populate('creator')
  .populate('members')
  .populate('admins')

// Get messages with sender info
GroupMessage.find({ group: groupId })
  .populate('sender')

// Check membership
group.members.includes(userId)

// Check admin status
group.admins.includes(userId)

// Get messages since timestamp
GroupMessage.find({
  group: groupId,
  createdAt: { $gte: sinceDate }
})
```

### Indexing Recommendations

For production, add indexes to improve queries:

```javascript
// In group schema
groupSchema.index({ members: 1 });
groupSchema.index({ creator: 1 });
groupSchema.index({ createdAt: -1 });

// In GroupMessage schema
groupMessageSchema.index({ group: 1, createdAt: 1 });
groupMessageSchema.index({ sender: 1 });
```

## Performance Considerations

1. **Large Groups:**
   - Paginate messages: `GET /messages?page=1&limit=50`
   - Cache member lists
   - Index group queries

2. **Real-time Updates:**
   - Current: 3-second polling
   - Recommended: WebSocket for production
   - Consider Socket.io integration

3. **Message Search:**
   - Index message text for search
   - Implement full-text search
   - Pagination for results

4. **Memory:**
   - Don't populate large arrays in one query
   - Use pagination for members/admins if large
   - Archive old messages

## Testing

### Test Cases

```javascript
// Create group
POST /api/groups
{ name: "Test Group" }

// Verify creator is member
GET /api/groups/:groupId
// Should see creator in members array

// Add member as admin
POST /api/groups/:groupId/members
{ userId: "newUserId" }

// Send message as member
POST /api/groups/:groupId/messages
{ text: "Test message" }

// Like message
PUT /api/groups/:groupId/messages/:msgId/like

// Get messages
GET /api/groups/:groupId/messages
// Should return array with message

// Try delete as non-creator
DELETE /api/groups/:groupId
// Should return 403

// Delete as creator
DELETE /api/groups/:groupId
// Should return 200
// Should delete all messages too
```

## Security Best Practices

1. ✅ Always validate user membership before operations
2. ✅ Verify admin/creator status before modifications
3. ✅ Sanitize text input on messages
4. ✅ Rate limit message sending
5. ✅ Validate file uploads for profile pictures
6. ✅ Never expose sensitive user data
7. ✅ Log admin actions
8. ✅ Implement request limits per user

## Future Enhancements

1. WebSocket for real-time messaging
2. Message persistence with pagination
3. Group announcements/pinned messages
4. Message reactions (emoji)
5. Voice/video call support
6. File sharing in groups
7. Group roles (moderator, etc.)
8. Activity log
9. Member presence indicators
10. Message search functionality
