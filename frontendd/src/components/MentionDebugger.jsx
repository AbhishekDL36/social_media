/**
 * MentionDebugger Component
 * 
 * Add this to your page to debug mention feature:
 * <MentionDebugger />
 * 
 * Logs:
 * - showMentions state
 * - mentionQuery state
 * - API calls and responses
 * - Event triggers
 */

import { useEffect } from 'react'

function MentionDebugger() {
  useEffect(() => {
    // Override console methods to display in page
    const originalLog = console.log
    const originalError = console.error

    console.log = (...args) => {
      originalLog(...args)
      if (typeof window !== 'undefined') {
        const debugElement = document.getElementById('mention-debug-log')
        if (debugElement) {
          debugElement.innerHTML += `<div style="color: #666; font-size: 11px; word-break: break-all; border-bottom: 1px solid #ddd; padding: 4px 0;">
            ${JSON.stringify(args).slice(0, 200)}
          </div>`
          debugElement.scrollTop = debugElement.scrollHeight
        }
      }
    }

    console.error = (...args) => {
      originalError(...args)
      if (typeof window !== 'undefined') {
        const debugElement = document.getElementById('mention-debug-log')
        if (debugElement) {
          debugElement.innerHTML += `<div style="color: #d9534f; font-size: 11px; word-break: break-all; border-bottom: 1px solid #ddd; padding: 4px 0;">
            ERROR: ${JSON.stringify(args).slice(0, 200)}
          </div>`
          debugElement.scrollTop = debugElement.scrollHeight
        }
      }
    }

    return () => {
      console.log = originalLog
      console.error = originalError
    }
  }, [])

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      right: 0,
      width: '300px',
      height: '200px',
      backgroundColor: '#f9f9f9',
      border: '1px solid #ddd',
      borderRadius: '4px',
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        backgroundColor: '#0095f6',
        color: 'white',
        padding: '8px 12px',
        fontWeight: 'bold',
        fontSize: '12px'
      }}>
        Mention Debug Log
      </div>
      <div
        id="mention-debug-log"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 12px',
          fontSize: '11px',
          fontFamily: 'monospace'
        }}
      />
    </div>
  )
}

export default MentionDebugger
