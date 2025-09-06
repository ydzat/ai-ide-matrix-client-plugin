// Matrix Chat Panel Component
// Dedicated chat interface for Matrix conversations

const MatrixChatPanel = {
  name: 'MatrixChatPanel',
  version: '0.1.0',
  
  // Component state
  state: {
    currentRoom: null,
    messages: [],
    isLoading: false,
    isTyping: false,
    typingUsers: [],
    messageInput: ''
  },
  
  // Render the chat panel
  render: function(props) {
    const { extension, roomId } = props;
    const state = this.state;
    
    if (!state.currentRoom) {
      return this.renderEmptyState();
    }
    
    return `
      <div id="matrix-chat-panel" style="
        height: 100%;
        display: flex;
        flex-direction: column;
        background-color: #1e1e1e;
        color: #cccccc;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      ">
        <!-- Chat Header -->
        ${this.renderChatHeader()}
        
        <!-- Messages Container -->
        <div style="
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        ">
          <!-- Messages List -->
          <div id="messages-container" style="
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            scroll-behavior: smooth;
          ">
            ${state.isLoading ? this.renderLoadingState() : this.renderMessages()}
          </div>
          
          <!-- Typing Indicator -->
          ${state.typingUsers.length > 0 ? this.renderTypingIndicator() : ''}
          
          <!-- Message Input Area -->
          ${this.renderMessageInput()}
        </div>
      </div>
    `;
  },
  
  // Render empty state when no room is selected
  renderEmptyState: function() {
    return `
      <div style="
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 48px;
        background-color: #1e1e1e;
        color: #888;
      ">
        <div>
          <div style="font-size: 64px; margin-bottom: 24px;">💬</div>
          <h3 style="margin: 0 0 16px 0; font-size: 20px; color: #cccccc;">
            No Room Selected
          </h3>
          <p style="font-size: 14px; max-width: 300px;">
            Select a room from the sidebar to start chatting, or join a new room to begin conversations.
          </p>
        </div>
      </div>
    `;
  },
  
  // Render chat header
  renderChatHeader: function() {
    const room = this.state.currentRoom;
    
    return `
      <div style="
        padding: 16px;
        border-bottom: 1px solid #3e3e42;
        background-color: #2d2d30;
        display: flex;
        align-items: center;
        justify-content: space-between;
      ">
        <div style="flex: 1;">
          <h3 style="
            margin: 0;
            font-size: 18px;
            font-weight: 600;
            color: #ffffff;
            margin-bottom: 4px;
          ">
            ${room.name || room.id}
          </h3>
          <div style="
            font-size: 12px;
            color: #888;
            display: flex;
            align-items: center;
            gap: 16px;
          ">
            <span>👥 ${room.memberCount || 0} members</span>
            ${room.topic ? `<span>📝 ${room.topic}</span>` : ''}
          </div>
        </div>
        
        <div style="display: flex; gap: 8px;">
          <button 
            onclick="MatrixChatPanel.showRoomInfo()"
            style="
              padding: 8px 12px;
              background-color: #007acc;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 12px;
            "
            title="Room Information"
          >
            ℹ️
          </button>
          
          <button 
            onclick="MatrixChatPanel.showRoomSettings()"
            style="
              padding: 8px 12px;
              background-color: #6c757d;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 12px;
            "
            title="Room Settings"
          >
            ⚙️
          </button>
        </div>
      </div>
    `;
  },
  
  // Render loading state
  renderLoadingState: function() {
    return `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 48px;
        color: #888;
      ">
        <div style="text-align: center;">
          <div style="
            width: 32px;
            height: 32px;
            border: 3px solid #3e3e42;
            border-top: 3px solid #007acc;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 16px;
          "></div>
          <div>Loading messages...</div>
        </div>
      </div>
      
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;
  },
  
  // Render messages list
  renderMessages: function() {
    const messages = this.state.messages;
    
    if (messages.length === 0) {
      return `
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px;
          color: #888;
          text-align: center;
        ">
          <div>
            <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
            <div style="font-size: 16px; margin-bottom: 8px;">This is the beginning!</div>
            <div style="font-size: 14px;">Start the conversation by sending a message.</div>
          </div>
        </div>
      `;
    }
    
    return messages.map((message, index) => {
      const prevMessage = index > 0 ? messages[index - 1] : null;
      const isConsecutive = prevMessage && prevMessage.sender === message.sender;
      const messageTime = new Date(message.timestamp);
      
      return `
        <div style="
          margin-bottom: ${isConsecutive ? '4px' : '16px'};
          display: flex;
          align-items: flex-start;
          gap: 12px;
        ">
          <!-- Avatar -->
          <div style="
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: linear-gradient(135deg, #007acc, #005a9e);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: bold;
            color: white;
            flex-shrink: 0;
            ${isConsecutive ? 'visibility: hidden;' : ''}
          ">
            ${this.getAvatarText(message.sender)}
          </div>
          
          <!-- Message Content -->
          <div style="flex: 1; min-width: 0;">
            ${!isConsecutive ? `
              <div style="
                display: flex;
                align-items: baseline;
                gap: 8px;
                margin-bottom: 4px;
              ">
                <span style="
                  font-weight: 600;
                  color: #ffffff;
                  font-size: 14px;
                ">
                  ${this.getDisplayName(message.sender)}
                </span>
                <span style="
                  font-size: 12px;
                  color: #888;
                ">
                  ${messageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ` : ''}
            
            <div style="
              color: #cccccc;
              font-size: 14px;
              line-height: 1.4;
              word-wrap: break-word;
              white-space: pre-wrap;
            ">
              ${this.formatMessageContent(message.content)}
            </div>
            
            ${message.attachments && message.attachments.length > 0 ? `
              <div style="margin-top: 8px;">
                ${this.renderAttachments(message.attachments)}
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  },
  
  // Render typing indicator
  renderTypingIndicator: function() {
    const users = this.state.typingUsers;
    const userText = users.length === 1 
      ? `${users[0]} is typing...`
      : `${users.slice(0, -1).join(', ')} and ${users[users.length - 1]} are typing...`;
    
    return `
      <div style="
        padding: 8px 16px;
        color: #888;
        font-size: 12px;
        font-style: italic;
        border-top: 1px solid #3e3e42;
        background-color: #252526;
      ">
        ${userText}
      </div>
    `;
  },
  
  // Render message input area
  renderMessageInput: function() {
    return `
      <div style="
        padding: 16px;
        border-top: 1px solid #3e3e42;
        background-color: #2d2d30;
      ">
        <div style="
          display: flex;
          gap: 8px;
          align-items: flex-end;
        ">
          <!-- Message Input -->
          <div style="flex: 1;">
            <textarea 
              id="message-input"
              placeholder="Type a message... (Shift+Enter for new line)"
              style="
                width: 100%;
                min-height: 40px;
                max-height: 120px;
                padding: 12px;
                background-color: #1e1e1e;
                border: 1px solid #3e3e42;
                border-radius: 6px;
                color: #cccccc;
                font-size: 14px;
                font-family: inherit;
                resize: none;
                outline: none;
              "
              onkeydown="MatrixChatPanel.handleKeyDown(event)"
              oninput="MatrixChatPanel.handleInput(event)"
              onfocus="this.style.borderColor='#007acc'"
              onblur="this.style.borderColor='#3e3e42'"
            ></textarea>
          </div>
          
          <!-- Action Buttons -->
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <button 
              onclick="MatrixChatPanel.sendMessage()"
              style="
                padding: 10px 16px;
                background-color: #007acc;
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: background-color 0.2s;
              "
              onmouseover="this.style.backgroundColor='#005a9e'"
              onmouseout="this.style.backgroundColor='#007acc'"
              title="Send message (Ctrl+Enter)"
            >
              Send
            </button>
            
            <button 
              onclick="MatrixChatPanel.showAttachmentMenu()"
              style="
                padding: 8px;
                background-color: #6c757d;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
              "
              title="Attach file"
            >
              📎
            </button>
          </div>
        </div>
        
        <!-- Quick Actions -->
        <div style="
          margin-top: 8px;
          display: flex;
          gap: 8px;
          font-size: 12px;
        ">
          <span style="color: #888;">
            Ctrl+Enter to send • Shift+Enter for new line
          </span>
        </div>
      </div>
    `;
  },

  // Utility methods
  getAvatarText: function(userId) {
    // Extract initials from user ID
    const name = userId.replace('@', '').split(':')[0];
    return name.substring(0, 2).toUpperCase();
  },

  getDisplayName: function(userId) {
    // For now, just clean up the user ID
    // In a real implementation, this would fetch display names
    return userId.replace('@', '').split(':')[0];
  },

  formatMessageContent: function(content) {
    // Basic message formatting
    // TODO: Add support for markdown, mentions, etc.
    return content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');
  },

  renderAttachments: function(attachments) {
    return attachments.map(attachment => `
      <div style="
        padding: 8px;
        background-color: #3e3e42;
        border-radius: 4px;
        margin-bottom: 4px;
        font-size: 12px;
      ">
        📎 ${attachment.name || 'Attachment'}
      </div>
    `).join('');
  },

  // Component lifecycle
  onMount: function(element, props) {
    console.log('Matrix Chat Panel mounted', props);
    this.initializeAPI();
    this.loadRoom(props.roomId);
  },

  onUnmount: function(element, props) {
    console.log('Matrix Chat Panel unmounted');
    this.cleanup();
  },

  // Initialize API
  initializeAPI: function() {
    window.MatrixChatPanel = {
      sendMessage: this.sendMessage.bind(this),
      handleKeyDown: this.handleKeyDown.bind(this),
      handleInput: this.handleInput.bind(this),
      showRoomInfo: this.showRoomInfo.bind(this),
      showRoomSettings: this.showRoomSettings.bind(this),
      showAttachmentMenu: this.showAttachmentMenu.bind(this)
    };
  },

  // Load room data
  loadRoom: async function(roomId) {
    if (!roomId) return;

    this.updateState({ isLoading: true });

    try {
      // TODO: Load room info and messages from backend
      // For now, use mock data
      const mockRoom = {
        id: roomId,
        name: 'General Chat',
        topic: 'General discussion room',
        memberCount: 42
      };

      const mockMessages = [
        {
          id: '1',
          sender: '@alice:matrix.org',
          content: 'Hello everyone! 👋',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          attachments: []
        },
        {
          id: '2',
          sender: '@bob:matrix.org',
          content: 'Hi Alice! How\'s your day going?',
          timestamp: new Date(Date.now() - 3000000).toISOString(),
          attachments: []
        },
        {
          id: '3',
          sender: '@alice:matrix.org',
          content: 'Pretty good! Working on some exciting new features.\nHow about you?',
          timestamp: new Date(Date.now() - 2400000).toISOString(),
          attachments: []
        }
      ];

      this.updateState({
        currentRoom: mockRoom,
        messages: mockMessages,
        isLoading: false
      });

      // Scroll to bottom
      setTimeout(() => this.scrollToBottom(), 100);

    } catch (error) {
      console.error('Failed to load room:', error);
      this.updateState({ isLoading: false });
    }
  },

  // Message handling
  sendMessage: async function() {
    const input = document.getElementById('message-input');
    const message = input?.value?.trim();

    if (!message || !this.state.currentRoom) return;

    try {
      // Send message via API
      const response = await fetch('http://localhost:8000/api/message-proxy/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          plugin_id: 'ai-ide-matrix-client-plugin',
          source: 'element',
          target_type: 'room',
          target_id: this.state.currentRoom.id,
          text: message,
          attachments: []
        })
      });

      if (response.ok) {
        // Add message to local state
        const newMessage = {
          id: Date.now().toString(),
          sender: '@me:matrix.org', // TODO: Get actual user ID
          content: message,
          timestamp: new Date().toISOString(),
          attachments: []
        };

        this.updateState({
          messages: [...this.state.messages, newMessage]
        });

        // Clear input and scroll to bottom
        if (input) {
          input.value = '';
          input.style.height = 'auto';
        }
        this.scrollToBottom();

      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      this.showNotification('Failed to send message', 'error');
    }
  },

  handleKeyDown: function(event) {
    if (event.key === 'Enter') {
      if (event.ctrlKey || (!event.shiftKey && !event.altKey)) {
        event.preventDefault();
        this.sendMessage();
      }
    }

    // Auto-resize textarea
    const textarea = event.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  },

  handleInput: function(event) {
    // TODO: Implement typing indicators
    const textarea = event.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  },

  // UI actions
  showRoomInfo: function() {
    const room = this.state.currentRoom;
    if (!room) return;

    alert(`Room Information:\n\nName: ${room.name}\nID: ${room.id}\nMembers: ${room.memberCount}\nTopic: ${room.topic || 'No topic set'}`);
  },

  showRoomSettings: function() {
    this.showNotification('Room settings - Coming soon!', 'info');
  },

  showAttachmentMenu: function() {
    this.showNotification('File attachments - Coming soon!', 'info');
  },

  // Utility methods
  scrollToBottom: function() {
    const container = document.getElementById('messages-container');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  },

  showNotification: function(message, type = 'info') {
    // Simple notification system
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 16px;
      background-color: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007acc'};
      color: white;
      border-radius: 6px;
      z-index: 10000;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  },

  updateState: function(newState) {
    this.state = { ...this.state, ...newState };
    this.rerender();
  },

  rerender: function() {
    const container = document.getElementById('matrix-chat-panel');
    if (container) {
      container.outerHTML = this.render({
        extension: { name: 'Matrix Chat' },
        roomId: this.state.currentRoom?.id
      });
      this.initializeAPI();
    }
  },

  cleanup: function() {
    if (window.MatrixChatPanel) {
      delete window.MatrixChatPanel;
    }
  }
};

// Export component
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MatrixChatPanel;
} else if (typeof window !== 'undefined') {
  window.MatrixChatPanel = MatrixChatPanel;
}
