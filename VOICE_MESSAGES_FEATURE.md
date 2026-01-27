# Voice Messages Feature - Implementation Guide

## Overview
Added voice message capability to the messaging system, allowing users to record and send audio messages alongside text messages.

## Backend Changes

### 1. Message Model (`backend/models/Message.js`)
Added new fields to support voice messages:
```javascript
messageType: {
  type: String,
  enum: ['text', 'voice'],
  default: 'text'
},
voiceUrl: {
  type: String,
  default: null
},
voiceDuration: {
  type: Number,
  default: null
}
```

### 2. Message Routes (`backend/routes/messages.js`)
- Updated existing `/send/:recipientId` route to set `messageType: 'text'`
- Added new `/send-voice/:recipientId` route to handle voice message uploads
  - Uses multer for file upload handling
  - Stores voice file URL and duration in database
  - Creates notification with '🎙️ Voice message' indicator

## Frontend Changes

### 1. ChatWindow Component (`frontendd/src/components/ChatWindow.jsx`)

#### New State Variables:
```javascript
const [isRecording, setIsRecording] = useState(false)
const [recordingTime, setRecordingTime] = useState(0)
const [isSendingVoice, setIsSendingVoice] = useState(false)
```

#### New Ref Variables:
```javascript
const mediaRecorderRef = useRef(null)
const audioChunksRef = useRef([])
const recordingIntervalRef = useRef(null)
```

#### Key Functions:

**startRecording()** - Initiates microphone access and starts recording
- Uses `navigator.mediaDevices.getUserMedia()` for audio stream
- Creates MediaRecorder instance
- Tracks recording time with interval

**stopRecording()** - Stops recording and returns audio blob
- Creates WebM audio blob from recorded chunks
- Stops microphone stream
- Returns Promise resolving to audio blob

**handleSendVoiceMessage()** - Sends recorded voice message
- Calls stopRecording() to finalize audio
- Creates FormData with audio blob and duration
- POSTs to `/api/messages/send-voice/:recipientId`
- Appends new message to messages list

**formatTime(seconds)** - Formats recording time as MM:SS

### 2. Voice Message Display
Voice messages show:
- HTML5 audio player with controls
- Duration display with microphone emoji (🎙️)
- Same styling as text messages (sent/received bubbles)

### 3. Message Input Interface
- Added microphone button (🎙️) next to text input
- When recording active, shows:
  - Recording indicator with pulsing red dot
  - Elapsed time in MM:SS format
  - Send button (✓) to finalize recording
  - Cancel button to discard recording

### 4. CSS Styling (`frontendd/src/components/ChatWindow.css`)

#### New Classes:
- `.voice-message` - Container for voice message display
- `.voice-player` - Audio player styling (240px wide)
- `.voice-duration` - Duration text styling
- `.voice-record-btn` - Microphone button styling
- `.recording-controls` - Recording UI container (yellow background)
- `.recording-indicator` - Text and time display during recording
- `.recording-dot` - Pulsing red dot indicator
- `.send-voice-btn` - Send voice message button
- `.cancel-voice-btn` - Cancel recording button

## How to Use

### For Users:
1. Click the 🎙️ microphone button in the message input area
2. Start speaking - the app records in real-time
3. See elapsed time in MM:SS format
4. Click ✓ Send to send the voice message or Cancel to discard
5. Recipients see voice message with playback controls

### Browser Support:
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Requires iOS 14.5+
- Requires HTTPS in production (microphone access requirement)

## Technical Details

### Audio Format:
- Format: WebM with Opus codec
- MIME type: `audio/webm`
- Browser native support (all modern browsers)

### File Storage:
- Saved to `/uploads/` directory via multer
- File reference stored in message document
- Duration stored as integer (seconds)

### Notifications:
- Voice messages trigger message notifications
- Shows "🎙️ Voice message" in notification text
- Same unread count system as text messages

## Limitations & Future Enhancements

### Current Limitations:
- Maximum recording time: Browser dependent (typically 1-2 hours)
- No voice transcription (future enhancement)
- No message reactions for voice messages (can be added)
- No voice message preview/waveform display

### Possible Future Features:
1. **Waveform Display** - Visual representation of audio
2. **Voice Transcription** - Convert speech to text
3. **Voice Message Reactions** - Emoji reactions to voice messages
4. **Playback Speed Control** - 1.5x, 2x speed options
5. **Voice Message Duration Limits** - E.g., max 120 seconds
6. **Batch Voice Messages** - Send multiple clips

## Testing Checklist

- [ ] Record voice message under 30 seconds
- [ ] Record voice message over 1 minute
- [ ] Cancel recording without sending
- [ ] Send voice message to another user
- [ ] Receive voice message from another user
- [ ] Play voice message in both sent/received modes
- [ ] Test on mobile browser
- [ ] Test microphone permissions (denied state)
- [ ] Verify notification shows voice message indicator
- [ ] Test with audio input muted

## Security Considerations

1. **Microphone Permissions** - Browser handles user consent
2. **File Upload** - Multer validates file type
3. **Storage** - Audio files stored in uploads directory
4. **Access Control** - Messages only visible to sender/recipient
5. **HTTPS Requirement** - Microphone access requires secure context

## Performance Notes

- WebM codec provides good compression
- Typical 30-second message: ~50-80KB
- Streaming playback - no full download required
- Minimal database impact (only URL and duration stored)
