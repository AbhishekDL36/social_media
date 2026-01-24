# Group Formation Feature Documentation

## Overview
A comprehensive group messaging and management system allowing users to create groups, add members, send group messages, and manage group settings.

## Backend Implementation

### Models

#### 1. Group.js
- **name**: Group name (required, max 100 chars)
- **description**: Group description (optional, max 500 chars)
- **profilePicture**: Group avatar image
- **creator**: User who created the group (admin by default)
- **members**: Array of user IDs in the group
- **admins**: Array of admin user IDs (controls group settings)
- **isPrivate**: Boolean flag for private/public groups
- **createdAt/updatedAt**: Timestamps

**Auto-behaviors:**
- Creator automatically added to members and admins
- Created/updated timestamps auto-managed

#### 2. GroupMessage.js
- **group**: Reference to the group
- **sender**: User who sent the message
- **text**: Message content (required)
- **likes**: Array of user IDs who liked the message
- **createdAt**: Timestamp

### API Routes (`/api/groups`)

#### Group Management

1. **POST /api/groups** - Create group
   - Fields: name*, description, profilePicture, memberIds[]
   - Returns: Created group with populated members/admins
   
2. **GET /api/groups** - Get all groups user is member of
   - Returns: Array of groups sorted by latest activity
   
3. **GET /api/groups/:groupId** - Get single group details
   - Returns: Group with all members/admins populated
   - Access: Members only
   
4. **PUT /api/groups/:groupId** - Update group
   - Fields: name, description, profilePicture, isPrivate
   - Access: Admins only
   
5. **DELETE /api/groups/:groupId** - Delete group
   - Access: Creator only
   - Side effect: Deletes all group messages

#### Member Management

6. **POST /api/groups/:groupId/members** - Add member
   - Fields: userId*
   - Access: Admins only
   - Behavior: 
     - Public: Adds directly
     - Private: Sends invitation notification
   
7. **DELETE /api/groups/:groupId/members/:memberId** - Remove member
   - Access: Admins or self
   - Cannot remove creator
   
8. **PUT /api/groups/:groupId/members/:memberId/admin** - Promote to admin
   - Access: Admins only
   
9. **DELETE /api/groups/:groupId/admins/:adminId** - Demote from admin
   - Access: Admins only
   - Cannot demote creator

#### Messaging

10. **POST /api/groups/:groupId/messages** - Send message
    - Fields: text*
    - Access: Members only
    - Notifies: Other group members
    
11. **GET /api/groups/:groupId/messages** - Get group messages
    - Returns: All messages sorted chronologically
    - Access: Members only
    
12. **PUT /api/groups/:groupId/messages/:messageId/like** - Like message
    - Toggles like on/off
    - Access: Members only

#### Search

13. **GET /api/groups/search** - Search groups
    - Query: ?query=searchTerm
    - Returns: Public groups matching name/description
    - Limit: 20 results

## Frontend Implementation

### Components

#### 1. GroupsList.jsx
Main groups page showing all groups user is member of.

**Features:**
- Displays all user groups in card layout
- Shows member count and privacy status
- Chat button to open group conversation
- Delete button for group creators
- "Create New Group" button
- No groups placeholder message

**State:**
- groups: Array of group objects
- selectedGroup: Currently active group for chat
- showCreateModal: Create group modal visibility
- loading: Data loading state

#### 2. CreateGroupModal.jsx
Modal for creating new groups.

**Features:**
- Name input (required)
- Description textarea
- Profile picture upload
- Privacy toggle (private/public)
- Add members from friends list
- Selected members display with tags
- Form validation
- Error handling

**Workflow:**
1. User enters group name
2. Optionally adds description and image
3. Clicks "Add Members" to select from friends
4. Selected members shown as tags
5. Creates group on submit

#### 3. GroupChatModal.jsx
Real-time chat interface for group conversations.

**Features:**
- Shows group info (name, member count, avatar)
- Messages with sender info and timestamps
- Message liking with count
- Auto-scroll to latest message
- Polls messages every 3 seconds
- Different styling for own vs other messages
- Message input field with send button
- Empty state message

**Message Display:**
- Own messages: Right-aligned, blue background
- Other messages: Left-aligned, white background with sender name
- Timestamps and like counts shown below message

### Component Hierarchy
```
App
├── GroupsList
│   ├── CreateGroupModal
│   └── GroupChatModal (shown when group selected)
```

## Database Relationships

```
User
├── groups (created) → Group.creator
├── group_members → Group.members
└── group_admins → Group.admins

Group
├── creator → User
├── members → [User]
├── admins → [User]
└── messages → GroupMessage[]

GroupMessage
├── group → Group
├── sender → User
└── likes → [User]
```

## Features Summary

### User Capabilities

**Group Owner (Creator):**
- Create groups
- Edit group info (name, description, image)
- Delete group (removes all messages)
- Add/remove members
- Promote/demote admins
- Send/receive messages
- Leave group (via remove self)

**Group Admin:**
- Edit group info
- Add/remove members
- Promote/demote other admins (not themselves)
- Send/receive messages
- Cannot delete group (creator only)

**Group Member:**
- View group info
- Send/receive messages
- Like messages
- Leave group (remove themselves)
- Cannot manage members or edit group

**Guest (Non-Member):**
- View public groups in search
- Receive invitations to private groups
- Cannot see group messages

### Group Types

**Public Groups:**
- Visible in search
- Anyone can be added by admins
- Members added directly without notification

**Private Groups:**
- Not in search results
- Invitations sent to potential members
- Members must accept (admin action)

## Notification Integration

Groups trigger notifications in following scenarios:

1. **group_add**: User added to group by admin
2. **group_invite**: User invited to private group
3. **group_message**: New message in group (to other members)

## File Structure

```
Backend:
- models/Group.js
- models/GroupMessage.js
- routes/groups.js
- server.js (updated)

Frontend:
- components/GroupsList.jsx
- components/GroupsList.css
- components/CreateGroupModal.jsx
- components/CreateGroupModal.css
- components/GroupChatModal.jsx
- components/GroupChatModal.css
```

## Integration Steps

1. **Backend:**
   - Models already created
   - Routes configured in server.js
   - Use existing auth middleware
   - Uses existing multer for image upload

2. **Frontend:**
   - Import GroupsList component in main App
   - Add to navigation/router
   - Uses existing axios setup
   - Uses existing session storage for auth

3. **Add to main App component:**
```jsx
import GroupsList from './components/GroupsList';

// In your App routes:
<Route path="/groups" element={<GroupsList />} />
```

## Usage Examples

### Create Group
```bash
POST /api/groups
{
  "name": "React Developers",
  "description": "Group for react developers",
  "isPrivate": false,
  "memberIds": ["userId1", "userId2"]
}
```

### Send Message
```bash
POST /api/groups/groupId/messages
{
  "text": "Hello group!"
}
```

### Add Member
```bash
POST /api/groups/groupId/members
{
  "userId": "newMemberId"
}
```

## Best Practices

1. **Permissions:**
   - Always check user membership before allowing message access
   - Only admins can modify group settings
   - Creator cannot be removed or demoted

2. **Performance:**
   - Message polling happens every 3 seconds (adjust as needed)
   - Implement WebSocket for real-time in production
   - Paginate messages for large groups

3. **Privacy:**
   - Private groups hidden from search
   - Message access restricted to members
   - No group info visible to non-members

4. **Future Enhancements:**
   - WebSocket for real-time messaging
   - Message search functionality
   - Group announcements
   - Member roles (moderator, etc.)
   - Group activity feed
   - Pin important messages
   - Message reactions (like post feature)

## Error Handling

All endpoints return appropriate HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad request
- 403: Forbidden (permission denied)
- 404: Not found
- 500: Server error

Error responses include message property explaining the issue.
