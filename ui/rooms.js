// Matrix Rooms Panel Component
// Displays and manages Matrix rooms list

const MatrixRoomsPanel = {
  name: 'MatrixRoomsPanel',
  version: '0.1.0',
  
  // Component state
  state: {
    rooms: [],
    selectedRoom: null,
    isLoading: false,
    searchQuery: '',
    filter: 'all', // 'all', 'joined', 'invited', 'public'
    sortBy: 'activity' // 'activity', 'name', 'members'
  },
  
  // Render the rooms panel
  render: function(props) {
    const { extension } = props;
    const state = this.state;
    
    return `
      <div id="matrix-rooms-panel" style="
        height: 100%;
        display: flex;
        flex-direction: column;
        background-color: #252526;
        color: #cccccc;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      ">
        <!-- Header -->
        <div style="
          padding: 16px;
          border-bottom: 1px solid #3e3e42;
          background-color: #2d2d30;
        ">
          <div style="
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;
          ">
            <h3 style="margin: 0; font-size: 16px; font-weight: 600;">
              Rooms
            </h3>
            <button 
              onclick="MatrixRoomsPanel.showJoinRoomDialog()"
              style="
                padding: 6px 12px;
                background-color: #007acc;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
              "
              title="Join Room"
            >
              + Join
            </button>
          </div>
          
          <!-- Search Bar -->
          <div style="position: relative;">
            <input 
              id="room-search"
              type="text"
              placeholder="Search rooms..."
              value="${state.searchQuery}"
              style="
                width: 100%;
                padding: 8px 32px 8px 12px;
                background-color: #1e1e1e;
                border: 1px solid #3e3e42;
                border-radius: 4px;
                color: #cccccc;
                font-size: 14px;
                outline: none;
              "
              oninput="MatrixRoomsPanel.handleSearch(event)"
              onfocus="this.style.borderColor='#007acc'"
              onblur="this.style.borderColor='#3e3e42'"
            />
            <div style="
              position: absolute;
              right: 8px;
              top: 50%;
              transform: translateY(-50%);
              color: #888;
              font-size: 14px;
            ">
              🔍
            </div>
          </div>
          
          <!-- Filter Tabs -->
          <div style="
            display: flex;
            gap: 4px;
            margin-top: 12px;
          ">
            ${this.renderFilterTabs()}
          </div>
        </div>
        
        <!-- Rooms List -->
        <div style="
          flex: 1;
          overflow-y: auto;
          padding: 8px;
        ">
          ${state.isLoading ? this.renderLoadingState() : this.renderRoomsList()}
        </div>
        
        <!-- Footer -->
        <div style="
          padding: 12px 16px;
          border-top: 1px solid #3e3e42;
          background-color: #2d2d30;
          font-size: 12px;
          color: #888;
          text-align: center;
        ">
          ${state.rooms.length} room${state.rooms.length !== 1 ? 's' : ''}
        </div>
      </div>
    `;
  },
  
  // Render filter tabs
  renderFilterTabs: function() {
    const filters = [
      { key: 'all', label: 'All', icon: '📋' },
      { key: 'joined', label: 'Joined', icon: '✅' },
      { key: 'invited', label: 'Invited', icon: '📨' },
      { key: 'public', label: 'Public', icon: '🌐' }
    ];
    
    return filters.map(filter => `
      <button 
        onclick="MatrixRoomsPanel.setFilter('${filter.key}')"
        style="
          padding: 6px 12px;
          background-color: ${this.state.filter === filter.key ? '#007acc' : '#3e3e42'};
          color: ${this.state.filter === filter.key ? 'white' : '#cccccc'};
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 11px;
          transition: background-color 0.2s;
        "
        title="${filter.label} rooms"
      >
        ${filter.icon} ${filter.label}
      </button>
    `).join('');
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
          <div>Loading rooms...</div>
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
  
  // Render rooms list
  renderRoomsList: function() {
    const filteredRooms = this.getFilteredRooms();
    
    if (filteredRooms.length === 0) {
      return this.renderEmptyState();
    }
    
    return filteredRooms.map(room => this.renderRoomItem(room)).join('');
  },
  
  // Render empty state
  renderEmptyState: function() {
    const messages = {
      all: { icon: '📭', text: 'No rooms found', subtext: 'Join a room to get started' },
      joined: { icon: '🏠', text: 'No joined rooms', subtext: 'Join some rooms to see them here' },
      invited: { icon: '📨', text: 'No invitations', subtext: 'You have no pending room invitations' },
      public: { icon: '🌐', text: 'No public rooms', subtext: 'Search for public rooms to join' }
    };
    
    const message = messages[this.state.filter] || messages.all;
    
    return `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 48px 24px;
        text-align: center;
        color: #888;
      ">
        <div>
          <div style="font-size: 48px; margin-bottom: 16px;">${message.icon}</div>
          <div style="font-size: 16px; margin-bottom: 8px;">${message.text}</div>
          <div style="font-size: 14px;">${message.subtext}</div>
          
          ${this.state.filter === 'all' ? `
            <button 
              onclick="MatrixRoomsPanel.showJoinRoomDialog()"
              style="
                margin-top: 16px;
                padding: 8px 16px;
                background-color: #007acc;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
              "
            >
              Join a Room
            </button>
          ` : ''}
        </div>
      </div>
    `;
  },
  
  // Render individual room item
  renderRoomItem: function(room) {
    const isSelected = this.state.selectedRoom?.id === room.id;
    const lastActivity = room.lastActivity ? new Date(room.lastActivity) : null;
    const timeText = lastActivity ? this.formatTime(lastActivity) : '';
    
    return `
      <div 
        onclick="MatrixRoomsPanel.selectRoom('${room.id}')"
        style="
          padding: 12px;
          border-radius: 6px;
          cursor: pointer;
          margin-bottom: 4px;
          background-color: ${isSelected ? '#007acc20' : 'transparent'};
          border-left: 3px solid ${isSelected ? '#007acc' : 'transparent'};
          transition: background-color 0.2s;
          position: relative;
        "
        onmouseover="this.style.backgroundColor='${isSelected ? '#007acc30' : '#ffffff10'}'"
        onmouseout="this.style.backgroundColor='${isSelected ? '#007acc20' : 'transparent'}'"
      >
        <!-- Room Header -->
        <div style="
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
        ">
          <div style="
            display: flex;
            align-items: center;
            gap: 8px;
            flex: 1;
            min-width: 0;
          ">
            <!-- Room Avatar -->
            <div style="
              width: 24px;
              height: 24px;
              border-radius: 4px;
              background: ${this.getRoomColor(room.id)};
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 12px;
              font-weight: bold;
              color: white;
              flex-shrink: 0;
            ">
              ${this.getRoomIcon(room)}
            </div>
            
            <!-- Room Name -->
            <div style="
              font-weight: 500;
              font-size: 14px;
              color: #ffffff;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              flex: 1;
            ">
              ${room.name || room.id}
            </div>
          </div>
          
          <!-- Time and Badges -->
          <div style="
            display: flex;
            align-items: center;
            gap: 6px;
            flex-shrink: 0;
          ">
            ${room.unreadCount > 0 ? `
              <div style="
                background-color: #dc3545;
                color: white;
                border-radius: 10px;
                padding: 2px 6px;
                font-size: 11px;
                font-weight: bold;
                min-width: 18px;
                text-align: center;
              ">
                ${room.unreadCount > 99 ? '99+' : room.unreadCount}
              </div>
            ` : ''}
            
            ${timeText ? `
              <div style="
                font-size: 11px;
                color: #888;
              ">
                ${timeText}
              </div>
            ` : ''}
          </div>
        </div>
        
        <!-- Room Info -->
        <div style="
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 12px;
          color: #888;
        ">
          <div style="
            display: flex;
            align-items: center;
            gap: 12px;
          ">
            <span>👥 ${room.memberCount || 0}</span>
            ${room.isEncrypted ? '<span>🔒 Encrypted</span>' : ''}
            ${room.isPublic ? '<span>🌐 Public</span>' : '<span>🔒 Private</span>'}
          </div>
          
          <!-- Room Status -->
          <div style="
            display: flex;
            align-items: center;
            gap: 4px;
          ">
            ${room.status === 'invited' ? '<span style="color: #ffc107;">📨</span>' : ''}
            ${room.isMuted ? '<span style="color: #6c757d;">🔇</span>' : ''}
            ${room.isPinned ? '<span style="color: #007acc;">📌</span>' : ''}
          </div>
        </div>
        
        <!-- Last Message Preview -->
        ${room.lastMessage ? `
          <div style="
            margin-top: 6px;
            font-size: 12px;
            color: #aaa;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          ">
            <strong>${room.lastMessage.sender}:</strong> ${room.lastMessage.content}
          </div>
        ` : ''}
      </div>
    `;
  },

  // Utility methods
  getFilteredRooms: function() {
    let rooms = this.state.rooms;

    // Apply search filter
    if (this.state.searchQuery) {
      const query = this.state.searchQuery.toLowerCase();
      rooms = rooms.filter(room =>
        (room.name && room.name.toLowerCase().includes(query)) ||
        room.id.toLowerCase().includes(query) ||
        (room.topic && room.topic.toLowerCase().includes(query))
      );
    }

    // Apply category filter
    switch (this.state.filter) {
      case 'joined':
        rooms = rooms.filter(room => room.status === 'joined');
        break;
      case 'invited':
        rooms = rooms.filter(room => room.status === 'invited');
        break;
      case 'public':
        rooms = rooms.filter(room => room.isPublic);
        break;
      // 'all' shows everything
    }

    // Apply sorting
    switch (this.state.sortBy) {
      case 'name':
        rooms.sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id));
        break;
      case 'members':
        rooms.sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0));
        break;
      case 'activity':
      default:
        rooms.sort((a, b) => {
          const aTime = a.lastActivity ? new Date(a.lastActivity).getTime() : 0;
          const bTime = b.lastActivity ? new Date(b.lastActivity).getTime() : 0;
          return bTime - aTime;
        });
        break;
    }

    return rooms;
  },

  getRoomColor: function(roomId) {
    // Generate a consistent color based on room ID
    const colors = [
      'linear-gradient(135deg, #007acc, #005a9e)',
      'linear-gradient(135deg, #28a745, #1e7e34)',
      'linear-gradient(135deg, #dc3545, #c82333)',
      'linear-gradient(135deg, #ffc107, #e0a800)',
      'linear-gradient(135deg, #6f42c1, #5a32a3)',
      'linear-gradient(135deg, #fd7e14, #e55100)',
      'linear-gradient(135deg, #20c997, #17a2b8)'
    ];

    let hash = 0;
    for (let i = 0; i < roomId.length; i++) {
      hash = roomId.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  },

  getRoomIcon: function(room) {
    if (room.isPublic) return '🌐';
    if (room.isEncrypted) return '🔒';
    if (room.isDirect) return '👤';
    return '#';
  },

  formatTime: function(date) {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;

    return date.toLocaleDateString();
  },

  // Component lifecycle
  onMount: function(element, props) {
    console.log('Matrix Rooms Panel mounted', props);
    this.initializeAPI();
    this.loadRooms();
  },

  onUnmount: function(element, props) {
    console.log('Matrix Rooms Panel unmounted');
    this.cleanup();
  },

  // Initialize API
  initializeAPI: function() {
    window.MatrixRoomsPanel = {
      selectRoom: this.selectRoom.bind(this),
      handleSearch: this.handleSearch.bind(this),
      setFilter: this.setFilter.bind(this),
      setSortBy: this.setSortBy.bind(this),
      showJoinRoomDialog: this.showJoinRoomDialog.bind(this),
      refreshRooms: this.refreshRooms.bind(this)
    };
  },

  // Load rooms from backend
  loadRooms: async function() {
    this.updateState({ isLoading: true });

    try {
      // TODO: Load rooms from backend API
      // For now, use mock data
      const mockRooms = [
        {
          id: '!general:matrix.org',
          name: 'General',
          topic: 'General discussion for everyone',
          memberCount: 42,
          isPublic: true,
          isEncrypted: false,
          isDirect: false,
          status: 'joined',
          unreadCount: 3,
          isPinned: true,
          isMuted: false,
          lastActivity: new Date(Date.now() - 300000).toISOString(),
          lastMessage: {
            sender: 'Alice',
            content: 'Hey everyone! How\'s it going?'
          }
        },
        {
          id: '!dev:matrix.org',
          name: 'Development',
          topic: 'Development discussions and updates',
          memberCount: 15,
          isPublic: false,
          isEncrypted: true,
          isDirect: false,
          status: 'joined',
          unreadCount: 0,
          isPinned: false,
          isMuted: false,
          lastActivity: new Date(Date.now() - 1800000).toISOString(),
          lastMessage: {
            sender: 'Bob',
            content: 'The new feature is ready for testing'
          }
        },
        {
          id: '@alice:matrix.org',
          name: 'Alice',
          topic: null,
          memberCount: 2,
          isPublic: false,
          isEncrypted: true,
          isDirect: true,
          status: 'joined',
          unreadCount: 1,
          isPinned: false,
          isMuted: false,
          lastActivity: new Date(Date.now() - 600000).toISOString(),
          lastMessage: {
            sender: 'Alice',
            content: 'Thanks for the help earlier!'
          }
        },
        {
          id: '!random:matrix.org',
          name: 'Random',
          topic: 'Random chatter and off-topic discussions',
          memberCount: 28,
          isPublic: true,
          isEncrypted: false,
          isDirect: false,
          status: 'invited',
          unreadCount: 0,
          isPinned: false,
          isMuted: false,
          lastActivity: new Date(Date.now() - 3600000).toISOString(),
          lastMessage: null
        }
      ];

      this.updateState({
        rooms: mockRooms,
        isLoading: false
      });

    } catch (error) {
      console.error('Failed to load rooms:', error);
      this.updateState({ isLoading: false });
      this.showNotification('Failed to load rooms', 'error');
    }
  },

  // Room actions
  selectRoom: function(roomId) {
    const room = this.state.rooms.find(r => r.id === roomId);
    if (room) {
      this.updateState({ selectedRoom: room });

      // Notify parent component or trigger navigation
      if (window.MatrixClientMain && window.MatrixClientMain.selectRoom) {
        window.MatrixClientMain.selectRoom(roomId);
      }

      // Clear unread count
      if (room.unreadCount > 0) {
        room.unreadCount = 0;
        this.updateState({ rooms: [...this.state.rooms] });
      }
    }
  },

  handleSearch: function(event) {
    const query = event.target.value;
    this.updateState({ searchQuery: query });
  },

  setFilter: function(filter) {
    this.updateState({ filter });
  },

  setSortBy: function(sortBy) {
    this.updateState({ sortBy });
  },

  showJoinRoomDialog: function() {
    const roomId = prompt('Enter room ID or alias to join:\n\nExamples:\n!room:matrix.org\n#room:matrix.org');

    if (roomId && roomId.trim()) {
      this.joinRoom(roomId.trim());
    }
  },

  joinRoom: async function(roomId) {
    try {
      this.showNotification(`Joining room: ${roomId}`, 'info');

      // TODO: Implement room joining via backend API
      // For now, just add to mock data
      const newRoom = {
        id: roomId,
        name: roomId.replace(/[!#@]/, '').split(':')[0],
        topic: 'Newly joined room',
        memberCount: 1,
        isPublic: roomId.startsWith('#'),
        isEncrypted: false,
        isDirect: roomId.startsWith('@'),
        status: 'joined',
        unreadCount: 0,
        isPinned: false,
        isMuted: false,
        lastActivity: new Date().toISOString(),
        lastMessage: null
      };

      this.updateState({
        rooms: [newRoom, ...this.state.rooms]
      });

      this.showNotification(`Successfully joined ${roomId}`, 'success');

    } catch (error) {
      console.error('Failed to join room:', error);
      this.showNotification(`Failed to join room: ${error.message}`, 'error');
    }
  },

  refreshRooms: function() {
    this.loadRooms();
  },

  // Utility methods
  showNotification: function(message, type = 'info') {
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
    const container = document.getElementById('matrix-rooms-panel');
    if (container) {
      container.outerHTML = this.render({ extension: { name: 'Matrix Rooms' } });
      this.initializeAPI();
    }
  },

  cleanup: function() {
    if (window.MatrixRoomsPanel) {
      delete window.MatrixRoomsPanel;
    }
  }
};

// Export component
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MatrixRoomsPanel;
} else if (typeof window !== 'undefined') {
  window.MatrixRoomsPanel = MatrixRoomsPanel;
}
