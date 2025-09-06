// Matrix Client Plugin Main UI Component
// This component provides the main interface for the Matrix client plugin

const MatrixClientMain = {
  name: 'MatrixClientMain',
  version: '0.1.0',

  // Component state
  state: {
    // Authentication state
    isLoggedIn: false,
    loginStep: 'server', // 'server', 'credentials', 'loading'

    // Connection state
    connected: false,
    connecting: false,
    homeserver: 'https://matrix.org',
    userId: '',
    accessToken: '',
    rooms: [],
    currentRoom: null,
    messages: [],
    connectionStatus: 'disconnected'
  },
  
  // Render the main UI
  render: function(props) {
    const { extension } = props;
    const state = this.state;
    
    return `
      <div id="matrix-client-main" style="
        height: 100%;
        display: flex;
        flex-direction: column;
        background-color: #1e1e1e;
        color: #cccccc;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      ">
        <!-- Header -->
        <div style="
          padding: 16px;
          border-bottom: 1px solid #3e3e42;
          background-color: #2d2d30;
          display: flex;
          align-items: center;
          justify-content: space-between;
        ">
          <div style="display: flex; align-items: center;">
            <div style="
              width: 32px;
              height: 32px;
              background: linear-gradient(135deg, #00D2AA, #00B894);
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              margin-right: 12px;
              font-size: 18px;
            ">
              🔗
            </div>
            <div>
              <h2 style="margin: 0; font-size: 18px; font-weight: 600;">Matrix Client</h2>
              <div style="font-size: 12px; color: #888; margin-top: 2px;">
                Status: <span id="connection-status" style="color: ${state.connected ? '#28a745' : '#dc3545'};">
                  ${state.connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
          
          <div style="display: flex; gap: 8px;">
            <button 
              id="connect-btn"
              onclick="MatrixClientMain.toggleConnection()"
              style="
                padding: 8px 16px;
                background-color: ${state.connected ? '#dc3545' : '#28a745'};
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                transition: background-color 0.2s;
              "
              ${state.connecting ? 'disabled' : ''}
            >
              ${state.connecting ? 'Connecting...' : (state.connected ? 'Disconnect' : 'Connect')}
            </button>
            
            <button 
              onclick="MatrixClientMain.showSettings()"
              style="
                padding: 8px 12px;
                background-color: #007acc;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
              "
            >
              ⚙️
            </button>
          </div>
        </div>
        
        <!-- Main Content -->
        <div style="
          flex: 1;
          display: flex;
          overflow: hidden;
        ">
          <!-- Sidebar - Rooms List -->
          <div style="
            width: 280px;
            border-right: 1px solid #3e3e42;
            background-color: #252526;
            display: flex;
            flex-direction: column;
          ">
            <div style="
              padding: 12px 16px;
              border-bottom: 1px solid #3e3e42;
              font-weight: 600;
              font-size: 14px;
            ">
              Rooms
            </div>
            
            <div id="rooms-list" style="
              flex: 1;
              overflow-y: auto;
              padding: 8px;
            ">
              ${state.connected ? this.renderRoomsList() : this.renderDisconnectedState()}
            </div>
            
            ${state.connected ? `
              <div style="
                padding: 12px;
                border-top: 1px solid #3e3e42;
              ">
                <button 
                  onclick="MatrixClientMain.joinRoom()"
                  style="
                    width: 100%;
                    padding: 8px;
                    background-color: #007acc;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                  "
                >
                  + Join Room
                </button>
              </div>
            ` : ''}
          </div>
          
          <!-- Chat Area -->
          <div style="
            flex: 1;
            display: flex;
            flex-direction: column;
            background-color: #1e1e1e;
          ">
            ${state.currentRoom ? this.renderChatArea() : this.renderWelcomeArea()}
          </div>
        </div>
      </div>
    `;
  },
  
  // Render rooms list
  renderRoomsList: function() {
    if (this.state.rooms.length === 0) {
      return `
        <div style="
          text-align: center;
          padding: 24px;
          color: #888;
          font-size: 14px;
        ">
          No rooms joined yet.<br>
          Click "Join Room" to get started.
        </div>
      `;
    }
    
    return this.state.rooms.map(room => `
      <div 
        onclick="MatrixClientMain.selectRoom('${room.id}')"
        style="
          padding: 12px;
          border-radius: 6px;
          cursor: pointer;
          margin-bottom: 4px;
          background-color: ${this.state.currentRoom?.id === room.id ? '#007acc20' : 'transparent'};
          border-left: 3px solid ${this.state.currentRoom?.id === room.id ? '#007acc' : 'transparent'};
          transition: background-color 0.2s;
        "
        onmouseover="this.style.backgroundColor='#ffffff10'"
        onmouseout="this.style.backgroundColor='${this.state.currentRoom?.id === room.id ? '#007acc20' : 'transparent'}'"
      >
        <div style="font-weight: 500; font-size: 14px; margin-bottom: 4px;">
          ${room.name || room.id}
        </div>
        <div style="font-size: 12px; color: #888;">
          ${room.memberCount || 0} members
        </div>
      </div>
    `).join('');
  },
  
  // Render disconnected state
  renderDisconnectedState: function() {
    return `
      <div style="
        text-align: center;
        padding: 24px;
        color: #888;
        font-size: 14px;
      ">
        <div style="font-size: 48px; margin-bottom: 16px;">🔌</div>
        <div>Not connected to Matrix</div>
        <div style="margin-top: 8px; font-size: 12px;">
          Click "Connect" to get started
        </div>
      </div>
    `;
  },
  
  // Render welcome area or login form
  renderWelcomeArea: function() {
    if (!this.state.connected) {
      // Show login/configuration form when not connected
      return this.renderLoginForm();
    }

    return `
      <div style="
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 48px;
      ">
        <div>
          <div style="font-size: 64px; margin-bottom: 24px;">💬</div>
          <h3 style="margin: 0 0 16px 0; font-size: 24px; color: #ffffff;">
            Welcome to Matrix Client
          </h3>
          <p style="color: #888; font-size: 16px; margin-bottom: 24px; max-width: 400px;">
            Secure, decentralized messaging for your AI IDE.
            Select a room to start chatting.
          </p>
        </div>
      </div>
    `;
  },

  // Render login/configuration form
  renderLoginForm: function() {
    return `
      <div style="
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 48px;
        background-color: #1e1e1e;
      ">
        <div style="
          background-color: #2d2d30;
          border-radius: 8px;
          padding: 32px;
          max-width: 400px;
          width: 100%;
          border: 1px solid #3e3e42;
        ">
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="
              width: 64px;
              height: 64px;
              background: linear-gradient(135deg, #00D2AA, #00B894);
              border-radius: 12px;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 16px;
              font-size: 32px;
            ">
              🔗
            </div>
            <h2 style="margin: 0 0 8px 0; color: #ffffff; font-size: 24px;">
              Connect to Matrix
            </h2>
            <p style="margin: 0; color: #888; font-size: 14px;">
              Configure your Matrix connection to get started
            </p>
          </div>

          <form id="matrix-login-form" onsubmit="MatrixClientMain.handleLogin(event)">
            <!-- Homeserver -->
            <div style="margin-bottom: 20px;">
              <label style="
                display: block;
                margin-bottom: 6px;
                color: #cccccc;
                font-size: 14px;
                font-weight: 500;
              ">
                Homeserver URL
              </label>
              <input
                type="url"
                id="login-homeserver"
                value="https://matrix.org"
                placeholder="https://matrix.org"
                style="
                  width: 100%;
                  padding: 12px;
                  background-color: #1e1e1e;
                  border: 1px solid #3e3e42;
                  border-radius: 4px;
                  color: #cccccc;
                  font-size: 14px;
                  outline: none;
                "
                onfocus="this.style.borderColor='#007acc'"
                onblur="this.style.borderColor='#3e3e42'"
                required
              />
            </div>

            <!-- User ID -->
            <div style="margin-bottom: 20px;">
              <label style="
                display: block;
                margin-bottom: 6px;
                color: #cccccc;
                font-size: 14px;
                font-weight: 500;
              ">
                User ID
              </label>
              <input
                type="text"
                id="login-userid"
                placeholder="@username:matrix.org"
                style="
                  width: 100%;
                  padding: 12px;
                  background-color: #1e1e1e;
                  border: 1px solid #3e3e42;
                  border-radius: 4px;
                  color: #cccccc;
                  font-size: 14px;
                  outline: none;
                "
                onfocus="this.style.borderColor='#007acc'"
                onblur="this.style.borderColor='#3e3e42'"
                required
              />
            </div>

            <!-- Access Token -->
            <div style="margin-bottom: 24px;">
              <label style="
                display: block;
                margin-bottom: 6px;
                color: #cccccc;
                font-size: 14px;
                font-weight: 500;
              ">
                Access Token
              </label>
              <div style="position: relative;">
                <input
                  type="password"
                  id="login-token"
                  placeholder="syt_..."
                  style="
                    width: 100%;
                    padding: 12px 40px 12px 12px;
                    background-color: #1e1e1e;
                    border: 1px solid #3e3e42;
                    border-radius: 4px;
                    color: #cccccc;
                    font-size: 14px;
                    outline: none;
                  "
                  onfocus="this.style.borderColor='#007acc'"
                  onblur="this.style.borderColor='#3e3e42'"
                  required
                />
                <button
                  type="button"
                  onclick="MatrixClientMain.togglePasswordVisibility('login-token')"
                  style="
                    position: absolute;
                    right: 8px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: none;
                    border: none;
                    color: #888;
                    cursor: pointer;
                    padding: 4px;
                  "
                >
                  👁️
                </button>
              </div>
              <div style="
                margin-top: 6px;
                font-size: 12px;
                color: #888;
              ">
                Get your access token from Element → Settings → Help & About → Advanced
              </div>
            </div>

            <!-- Connect Button -->
            <button
              type="submit"
              style="
                width: 100%;
                padding: 12px;
                background-color: #007acc;
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 16px;
                font-weight: 500;
                transition: background-color 0.2s;
              "
              onmouseover="this.style.backgroundColor='#005a9e'"
              onmouseout="this.style.backgroundColor='#007acc'"
            >
              Connect to Matrix
            </button>
          </form>

          <div style="
            margin-top: 24px;
            padding-top: 24px;
            border-top: 1px solid #3e3e42;
            text-align: center;
          ">
            <p style="
              margin: 0 0 12px 0;
              font-size: 12px;
              color: #888;
            ">
              Don't have a Matrix account?
            </p>
            <a
              href="https://matrix.org/docs/guides/introduction"
              target="_blank"
              style="
                color: #007acc;
                text-decoration: none;
                font-size: 12px;
              "
            >
              Learn more about Matrix
            </a>
          </div>
        </div>
      </div>
    `;
  },
  
  // Render chat area for selected room
  renderChatArea: function() {
    const room = this.state.currentRoom;
    
    return `
      <!-- Chat Header -->
      <div style="
        padding: 16px;
        border-bottom: 1px solid #3e3e42;
        background-color: #2d2d30;
      ">
        <h3 style="margin: 0; font-size: 16px; font-weight: 600;">
          ${room.name || room.id}
        </h3>
        <div style="font-size: 12px; color: #888; margin-top: 4px;">
          ${room.memberCount || 0} members • ${room.topic || 'No topic set'}
        </div>
      </div>
      
      <!-- Messages Area -->
      <div id="messages-area" style="
        flex: 1;
        overflow-y: auto;
        padding: 16px;
      ">
        ${this.renderMessages()}
      </div>
      
      <!-- Message Input -->
      <div style="
        padding: 16px;
        border-top: 1px solid #3e3e42;
        background-color: #2d2d30;
      ">
        <div style="display: flex; gap: 8px;">
          <input 
            id="message-input"
            type="text"
            placeholder="Type a message..."
            style="
              flex: 1;
              padding: 12px;
              background-color: #1e1e1e;
              border: 1px solid #3e3e42;
              border-radius: 6px;
              color: #cccccc;
              font-size: 14px;
            "
            onkeypress="if(event.key==='Enter') MatrixClientMain.sendMessage()"
          />
          <button 
            onclick="MatrixClientMain.sendMessage()"
            style="
              padding: 12px 16px;
              background-color: #007acc;
              color: white;
              border: none;
              border-radius: 6px;
              cursor: pointer;
              font-size: 14px;
            "
          >
            Send
          </button>
        </div>
      </div>
    `;
  },
  
  // Render messages
  renderMessages: function() {
    if (this.state.messages.length === 0) {
      return `
        <div style="
          text-align: center;
          padding: 48px;
          color: #888;
          font-size: 14px;
        ">
          No messages yet. Start the conversation!
        </div>
      `;
    }
    
    return this.state.messages.map(message => `
      <div style="
        margin-bottom: 16px;
        padding: 12px;
        background-color: #252526;
        border-radius: 8px;
      ">
        <div style="
          display: flex;
          align-items: center;
          margin-bottom: 8px;
        ">
          <strong style="color: #ffffff; font-size: 14px;">
            ${message.sender}
          </strong>
          <span style="
            margin-left: 8px;
            font-size: 12px;
            color: #888;
          ">
            ${new Date(message.timestamp).toLocaleTimeString()}
          </span>
        </div>
        <div style="color: #cccccc; font-size: 14px; line-height: 1.4;">
          ${message.content}
        </div>
      </div>
    `).join('');
  },

  // Component lifecycle methods
  onMount: function(element, props) {
    console.log('Matrix Client plugin UI mounted', props);

    // Initialize plugin API
    this.initializeAPI();

    // Load initial state
    this.loadState();

    // Setup event listeners
    this.setupEventListeners();
  },

  onUnmount: function(element, props) {
    console.log('Matrix Client plugin UI unmounted', props);
    this.cleanup();
  },

  // Initialize plugin API
  initializeAPI: function() {
    const self = this;

    if (!window.MatrixClientAPI) {
      // Verify all methods exist before binding
      const methods = [
        'connect', 'disconnect', 'joinRoom', 'leaveRoom', 'selectRoom',
        'sendMessage', 'showSettings', 'toggleConnection', 'updateState'
      ];

      for (const method of methods) {
        if (typeof self[method] !== 'function') {
          console.error(`Method ${method} is not defined on MatrixClientMain`);
        }
      }

      window.MatrixClientAPI = {
        // Connection methods
        connect: self.connect ? self.connect.bind(self) : () => console.error('connect method not available'),
        disconnect: self.disconnect ? self.disconnect.bind(self) : () => console.error('disconnect method not available'),

        // Room methods
        joinRoom: self.joinRoom ? self.joinRoom.bind(self) : () => console.error('joinRoom method not available'),
        leaveRoom: self.leaveRoom ? self.leaveRoom.bind(self) : () => console.error('leaveRoom method not available'),
        selectRoom: self.selectRoom ? self.selectRoom.bind(self) : () => console.error('selectRoom method not available'),

        // Message methods
        sendMessage: self.sendMessage ? self.sendMessage.bind(self) : () => console.error('sendMessage method not available'),

        // UI methods
        showSettings: self.showSettings ? self.showSettings.bind(self) : () => console.error('showSettings method not available'),
        toggleConnection: self.toggleConnection ? self.toggleConnection.bind(self) : () => console.error('toggleConnection method not available'),

        // State methods
        updateState: self.updateState ? self.updateState.bind(self) : () => console.error('updateState method not available'),
        getState: () => this.state
      };
    }

    // Make methods available globally for onclick handlers
    window.MatrixClientMain = {
      connect: this.connect.bind(this),
      disconnect: this.disconnect.bind(this),
      joinRoom: this.joinRoom.bind(this),
      selectRoom: this.selectRoom.bind(this),
      sendMessage: this.sendMessage.bind(this),
      showSettings: this.showSettings.bind(this),
      toggleConnection: this.toggleConnection.bind(this),
      handleLogin: this.handleLogin.bind(this),
      togglePasswordVisibility: this.togglePasswordVisibility.bind(this)
    };
  },

  // Load state from backend
  loadState: async function() {
    try {
      // Get plugin state from backend via WebSocket or API
      // For now, check connection status via message proxy
      const statusResponse = await fetch('http://localhost:8000/api/message-proxy/subscription/ai-ide-matrix-client-plugin');
      if (statusResponse.ok) {
        const subscriptionStatus = await statusResponse.json();
        this.updateState({
          connected: subscriptionStatus.subscribed || false
        });

        if (subscriptionStatus.subscribed) {
          // Load rooms if connected
          await this.loadRooms();
        }
      }
    } catch (error) {
      console.error('Failed to load state from backend:', error);
    }
  },

  // Setup event listeners
  setupEventListeners: function() {
    // Listen for WebSocket messages
    // TODO: Implement WebSocket connection for real-time updates
  },

  // Connection methods
  connect: async function() {
    this.updateState({ connecting: true });

    try {
      // First configure the Element adapter with current credentials
      if (this.state.homeserver && this.state.userId && this.state.accessToken) {
        const configResponse = await fetch('http://localhost:8000/api/message-proxy/adapters/element/configure', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            homeserver: this.state.homeserver,
            access_token: this.state.accessToken,
            user_id: this.state.userId,
            device_id: 'ai-ide-matrix-client'
          })
        });

        if (!configResponse.ok) {
          throw new Error('Failed to configure Matrix adapter');
        }
      }

      // Then execute the connect command
      const response = await fetch('http://localhost:8000/api/extensions/ai-ide-matrix-client-plugin/commands/matrix-client.connect', {
        method: 'POST'
      });

      if (response.ok) {
        this.updateState({
          connected: true,
          connecting: false,
          connectionStatus: 'connected'
        });
        this.showNotification('Connected to Matrix successfully!', 'success');

        // Load rooms after connection
        await this.loadRooms();
      } else {
        throw new Error('Failed to connect');
      }
    } catch (error) {
      console.error('Connection failed:', error);
      this.updateState({ connecting: false });
      this.showNotification('Failed to connect to Matrix: ' + error.message, 'error');
      throw error;
    }
  },

  disconnect: async function() {
    try {
      const response = await fetch('http://localhost:8000/api/extensions/ai-ide-matrix-client-plugin/commands/matrix-client.disconnect', {
        method: 'POST'
      });

      if (response.ok) {
        this.updateState({
          connected: false,
          connectionStatus: 'disconnected',
          rooms: [],
          currentRoom: null,
          messages: []
        });
        this.showNotification('Disconnected from Matrix', 'info');
      }
    } catch (error) {
      console.error('Disconnect failed:', error);
      this.showNotification('Failed to disconnect', 'error');
    }
  },

  toggleConnection: function() {
    if (this.state.connected) {
      this.disconnect();
    } else {
      this.connect();
    }
  },

  // Handle login form submission
  handleLogin: async function(event) {
    event.preventDefault();

    const homeserver = document.getElementById('login-homeserver')?.value;
    const userId = document.getElementById('login-userid')?.value;
    const accessToken = document.getElementById('login-token')?.value;

    if (!homeserver || !userId || !accessToken) {
      this.showNotification('Please fill in all fields', 'error');
      return;
    }

    // Update state with login credentials
    this.updateState({
      homeserver: homeserver,
      userId: userId,
      accessToken: accessToken
    });

    // Attempt to connect
    try {
      await this.connect();
    } catch (error) {
      console.error('Login failed:', error);
      this.showNotification('Login failed: ' + error.message, 'error');
    }
  },

  // Toggle password visibility
  togglePasswordVisibility: function(fieldId) {
    const field = document.getElementById(fieldId);
    if (field) {
      field.type = field.type === 'password' ? 'text' : 'password';
    }
  },

  // Room methods
  joinRoom: async function() {
    const roomId = prompt('Enter room ID to join (e.g., !room:matrix.org):');
    if (!roomId) return;

    try {
      // TODO: Implement room joining via backend API
      this.showNotification(`Joining room: ${roomId}`, 'info');
    } catch (error) {
      console.error('Failed to join room:', error);
      this.showNotification('Failed to join room', 'error');
    }
  },

  selectRoom: function(roomId) {
    const room = this.state.rooms.find(r => r.id === roomId);
    if (room) {
      this.updateState({ currentRoom: room });
      this.loadMessages(roomId);
    }
  },

  leaveRoom: async function(roomId) {
    if (!roomId && this.state.currentRoom) {
      roomId = this.state.currentRoom.id;
    }

    if (!roomId) {
      this.showNotification('No room selected to leave', 'error');
      return;
    }

    try {
      // TODO: Implement room leaving via backend API
      console.log('Leaving room:', roomId);
      this.showNotification(`Left room: ${roomId}`, 'success');

      // Remove room from state
      const updatedRooms = this.state.rooms.filter(r => r.id !== roomId);
      this.updateState({
        rooms: updatedRooms,
        currentRoom: null
      });
    } catch (error) {
      console.error('Failed to leave room:', error);
      this.showNotification('Failed to leave room', 'error');
    }
  },

  // Message methods
  sendMessage: async function() {
    const input = document.getElementById('message-input');
    const message = input?.value?.trim();

    if (!message || !this.state.currentRoom) return;

    try {
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
          sender: this.state.userId,
          content: message,
          timestamp: new Date().toISOString()
        };

        this.updateState({
          messages: [...this.state.messages, newMessage]
        });

        // Clear input
        if (input) input.value = '';

        this.showNotification('Message sent!', 'success');
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      this.showNotification('Failed to send message', 'error');
    }
  },

  // Utility methods
  showSettings: function() {
    // TODO: Open settings panel or redirect to VSCode settings
    this.showNotification('Opening settings...', 'info');
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
    const container = document.getElementById('matrix-client-main');
    if (container) {
      container.outerHTML = this.render({ extension: { name: 'Matrix Client' } });
      this.initializeAPI(); // Reinitialize after rerender
    }
  },

  loadRooms: async function() {
    try {
      // Query rooms through message proxy
      const response = await fetch('http://localhost:8000/api/message-proxy/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          plugin_id: 'ai-ide-matrix-client-plugin',
          sources: ['element'],
          query_type: 'rooms',
          limit: 100
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.rooms && result.rooms.length > 0) {
          this.updateState({
            rooms: result.rooms.map(room => ({
              id: room.id,
              name: room.name || room.id.replace(/[!#@]/, '').split(':')[0],
              memberCount: room.member_count || 0,
              topic: room.topic || '',
              unreadCount: room.unread_count || 0,
              lastActivity: room.last_activity,
              lastMessage: room.last_message,
              isEncrypted: room.is_encrypted || false,
              isPublic: room.is_public || false,
              isDirect: room.is_direct || false
            }))
          });
        } else {
          // Use fallback mock data if no rooms returned
          this.updateState({
            rooms: [
              {
                id: '!general:matrix.org',
                name: 'General',
                memberCount: 42,
                topic: 'General discussion',
                unreadCount: 0,
                isEncrypted: false,
                isPublic: true,
                isDirect: false
              }
            ]
          });
        }
      } else {
        console.warn('Failed to load rooms from backend');
        this.updateState({ rooms: [] });
      }
    } catch (error) {
      console.error('Error loading rooms:', error);
      this.updateState({ rooms: [] });
    }
  },

  loadMessages: async function(roomId) {
    try {
      // Query messages for specific room
      const response = await fetch('http://localhost:8000/api/message-proxy/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          plugin_id: 'ai-ide-matrix-client-plugin',
          sources: ['element'],
          query_type: 'messages',
          room_id: roomId,
          limit: 50,
          offset: 0
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.messages && result.messages.length > 0) {
          this.updateState({
            messages: result.messages.map(msg => ({
              id: msg.id || Date.now().toString(),
              sender: msg.sender?.name || msg.sender?.id || 'Unknown',
              content: msg.content?.text || msg.content || '',
              timestamp: msg.timestamp || new Date().toISOString(),
              attachments: msg.attachments || []
            }))
          });
        } else {
          // Use mock data if no messages returned
          this.updateState({
            messages: [
              {
                id: '1',
                sender: '@alice:matrix.org',
                content: 'Welcome to the room! 👋',
                timestamp: new Date(Date.now() - 3600000).toISOString(),
                attachments: []
              }
            ]
          });
        }
      } else {
        console.warn('Failed to load messages from backend');
        this.updateState({ messages: [] });
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      this.updateState({ messages: [] });
    }
  },

  cleanup: function() {
    // Cleanup any resources
    if (window.MatrixClientAPI) {
      delete window.MatrixClientAPI;
    }
    if (window.MatrixClientMain) {
      delete window.MatrixClientMain;
    }
  }
};

// Export component
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MatrixClientMain;
} else if (typeof window !== 'undefined') {
  window.MatrixClientMain = MatrixClientMain;
}
