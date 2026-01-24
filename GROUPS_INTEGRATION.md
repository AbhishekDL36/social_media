# Group Feature Integration Guide

## Quick Start

### Backend Setup (Already Done)

✅ Models created:
- `/backend/models/Group.js`
- `/backend/models/GroupMessage.js`

✅ Routes created:
- `/backend/routes/groups.js`

✅ Server updated:
- Added route in `server.js`: `app.use('/api/groups', require('./routes/groups'));`

### Frontend Setup

#### Step 1: Add components to your project
All components are already created:
- `GroupsList.jsx` - Main groups page
- `GroupsList.css` - Styling
- `CreateGroupModal.jsx` - Create group modal
- `CreateGroupModal.css` - Styling
- `GroupChatModal.jsx` - Chat interface
- `GroupChatModal.css` - Styling

#### Step 2: Add route to main App component

Update your main `App.jsx` or router:

```jsx
import GroupsList from './components/GroupsList';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ... other routes ... */}
        <Route path="/groups" element={<GroupsList />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

#### Step 3: Add navigation link

Add a link to groups in your navigation/sidebar:

```jsx
<nav>
  {/* ... other nav links ... */}
  <Link to="/groups">👥 Groups</Link>
</nav>
```

#### Step 4: Update `users` endpoint (if needed)

The `CreateGroupModal` needs a `/api/users/friends` endpoint to load friends list.

If this endpoint doesn't exist, create it in `backend/routes/users.js`:

```js
// Get user's following list (friends)
router.get('/friends', protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate('following', 'username profilePicture email');
    
    res.json(user.following || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
```

## Feature Usage

### Create a Group

1. Click "New Group" button
2. Enter group name (required)
3. Add optional description
4. Upload optional group picture
5. Toggle private/public
6. Click "Add Members" to select from friends
7. Click "Create Group"

### Join a Group (Existing Members Only)

1. Groups you're member of show on Groups page
2. Click "Chat" to open group chat

### Group Chat

1. View all previous messages
2. Type message in input field
3. Click Send or press Enter
4. React to messages with like button
5. See member count and group info

### Admin Actions (Group Owners/Admins Only)

From API calls (frontend can be extended):

```bash
# Add member
POST /api/groups/:groupId/members
{ "userId": "userId" }

# Remove member
DELETE /api/groups/:groupId/members/:memberId

# Promote to admin
PUT /api/groups/:groupId/members/:memberId/admin

# Demote admin
DELETE /api/groups/:groupId/admins/:adminId

# Update group
PUT /api/groups/:groupId
{ "name": "New Name", "description": "New desc" }

# Delete group (creator only)
DELETE /api/groups/:groupId
```

## Testing

### Test Create Group Flow

1. Navigate to `/groups`
2. Click "New Group"
3. Fill in form with:
   - Name: "Test Group"
   - Description: "A test group"
4. Click Submit
5. Should appear in groups list

### Test Group Chat

1. From groups list, click "Chat" on any group
2. Type a message
3. Click Send
4. Message should appear immediately
5. Try liking the message with heart button

### Test with Multiple Users

1. Create group with User A
2. Add User B as member
3. Have User B send message
4. Have User A see message in real-time (refreshes every 3s)

## API Endpoints Quick Reference

```
Groups:
POST   /api/groups              - Create
GET    /api/groups              - List my groups
GET    /api/groups/:groupId     - Get details
PUT    /api/groups/:groupId     - Update
DELETE /api/groups/:groupId     - Delete
GET    /api/groups/search       - Search public groups

Members:
POST   /api/groups/:groupId/members              - Add
DELETE /api/groups/:groupId/members/:memberId    - Remove
PUT    /api/groups/:groupId/members/:memberId/admin - Promote
DELETE /api/groups/:groupId/admins/:adminId      - Demote

Messages:
POST   /api/groups/:groupId/messages             - Send
GET    /api/groups/:groupId/messages             - Get all
PUT    /api/groups/:groupId/messages/:msgId/like - Like
```

## Common Issues & Solutions

### Issue: Friend list not loading
**Solution:** Make sure `/api/users/friends` endpoint exists

### Issue: Messages not updating
**Solution:** Chat modal polls every 3 seconds. Check browser console for errors.

### Issue: Can't upload group picture
**Solution:** Ensure multer is configured in backend and `/uploads` directory exists

### Issue: Permission denied on group operations
**Solution:** Check if user is group member or admin. Creator must perform delete.

## Future Enhancement Ideas

1. **Real-time Messaging** - Replace polling with WebSocket
2. **Message Pagination** - Load older messages on scroll
3. **Group Admin Panel** - Frontend for managing members/settings
4. **Message Reactions** - Like system from posts
5. **Group Announcements** - Pinned messages from admins
6. **Group Activity Feed** - See when members join/leave
7. **Search Groups** - Public group discovery
8. **Leave Group** - Allow members to leave without being removed
9. **Mute Notifications** - Don't notify for specific groups
10. **Group Rules** - Describe expected behavior

## Performance Notes

- Message polling every 3 seconds (tune based on needs)
- Groups list loads on component mount
- Messages loaded per group on chat open
- Should scale well for typical social media usage
- For production: Consider WebSocket, message pagination, caching

## Security Notes

✅ Protected routes - Auth required for all endpoints
✅ Member verification - Can't access groups you're not in
✅ Admin checks - Only admins can modify group settings
✅ Creator protection - Only creator can delete group
✅ Notification system - Respects privacy settings

## Support & Debugging

Check browser console for:
- API errors: Look for failed network requests
- State issues: Check React DevTools
- Auth issues: Verify token in sessionStorage

Check backend logs for:
- Database connection errors
- Permission denied messages
- Validation errors
