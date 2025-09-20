// Room Manager Component - Handles room-related functionality
// This component manages room display, selection, and interactions

// Use IIFE to prevent redeclaration errors
(function() {
  // Prevent redeclaration errors
  if (typeof window !== 'undefined' && window.RoomManager) {
    console.log('RoomManager already loaded, skipping redeclaration');
    return;
  }

  class RoomManager {
  constructor(matrixClient) {
    this.matrixClient = matrixClient;
  }

  // Display rooms organized by space
  displayRoomsInSpace(rooms, currentSpaceId = 'home') {
    console.log('displayRoomsInSpace called with:', { rooms, currentSpaceId });

    const peopleList = this.matrixClient.container.querySelector('#peopleList');
    const roomsList = this.matrixClient.container.querySelector('#roomsList');

    if (!peopleList || !roomsList) {
      console.warn('peopleList or roomsList not found');
      return;
    }

    // Filter rooms based on current space
    let filteredRooms = rooms;
    if (currentSpaceId !== 'home') {
      // Filter rooms that belong to the selected space
      const currentSpace = this.matrixClient.spaces.find(space => space.id === currentSpaceId);
      if (currentSpace && currentSpace.child_rooms) {
        filteredRooms = rooms.filter(room => currentSpace.child_rooms.includes(room.room_id));
      }
    }

    console.log('Filtered rooms:', filteredRooms);

    // Separate direct messages (people) from rooms
    const directMessages = filteredRooms.filter(room => {
      const isDM = this.isDirectMessage(room);
      console.log(`Room ${this.getRoomDisplayName(room)} (${room.room_id}) is DM: ${isDM}`);
      return isDM;
    });
    const groupRooms = filteredRooms.filter(room => {
      const isDM = this.isDirectMessage(room);
      console.log(`Room ${this.getRoomDisplayName(room)} (${room.room_id}) is Group Room: ${!isDM}`);
      return !isDM;
    });

    console.log('Direct messages:', directMessages.length, directMessages.map(r => this.getRoomDisplayName(r)));
    console.log('Group rooms:', groupRooms.length, groupRooms.map(r => this.getRoomDisplayName(r)));

    // Display people (direct messages)
    if (directMessages.length > 0) {
      peopleList.innerHTML = directMessages.map(room => `
        <div class="room-item" data-room-id="${room.room_id}" title="${this.getRoomDisplayName(room)}">
          <div class="room-avatar">
            ${room.avatar_url ?
              `<img src="${this.matrixClient.convertMxcToHttp(room.avatar_url)}" alt="${this.getRoomDisplayName(room)}" class="avatar-image">` :
              `<span class="avatar-text">${this.getRoomInitials(room)}</span>`
            }
          </div>
          <div class="room-info">
            <div class="room-name">${this.getRoomDisplayName(room)}</div>
            <div class="room-preview">${room.last_message || 'No messages'}</div>
          </div>
          <div class="room-meta">
            <div class="room-time">${this.formatTime(room.last_activity)}</div>
            ${room.unread_count ? `<div class="unread-badge">${room.unread_count}</div>` : ''}
          </div>
        </div>
      `).join('');
    } else {
      peopleList.innerHTML = '<div class="empty-state">No direct messages</div>';
    }

    // Display rooms
    if (groupRooms.length > 0) {
      roomsList.innerHTML = groupRooms.map(room => `
        <div class="room-item" data-room-id="${room.room_id}" title="${this.getRoomDisplayName(room)}">
          <div class="room-avatar">
            ${room.avatar_url ?
              `<img src="${this.matrixClient.convertMxcToHttp(room.avatar_url)}" alt="${this.getRoomDisplayName(room)}" class="avatar-image">` :
              `<span class="avatar-text">${this.getRoomInitials(room)}</span>`
            }
          </div>
          <div class="room-info">
            <div class="room-name">${this.getRoomDisplayName(room)}</div>
            <div class="room-preview">${room.last_message || 'No messages'}</div>
          </div>
          <div class="room-meta">
            <div class="room-time">${this.formatTime(room.last_activity)}</div>
            ${room.unread_count ? `<div class="unread-badge">${room.unread_count}</div>` : ''}
            ${room.is_encrypted ? `<div class="encryption-indicator" title="Encrypted room">🔒</div>` : ''}
          </div>
        </div>
      `).join('');
    } else {
      roomsList.innerHTML = '<div class="empty-state">No rooms in this space</div>';
    }

    // Add click listeners to room items
    this.matrixClient.container.querySelectorAll('.room-item').forEach(item => {
      item.addEventListener('click', () => {
        const roomId = item.dataset.roomId;
        this.selectRoom(roomId);
      });
    });
  }

  // Helper methods for room display
  getRoomInitials(room) {
    const name = this.getRoomDisplayName(room);
    return name.substring(0, 2).toUpperCase();
  }

  getRoomDisplayName(room) {
    if (!room) return 'Unknown Room';

    // Priority order for room names:
    // 1. display_name (most reliable)
    // 2. name
    // 3. canonical_alias (formatted)
    // 4. room_id (formatted as fallback)

    if (room.display_name && room.display_name.trim() && !room.display_name.includes('Empty room')) {
      return room.display_name.trim();
    }

    if (room.name && room.name.trim()) {
      return room.name.trim();
    }

    if (room.canonical_alias) {
      // Convert #room:server.com to "Room"
      const aliasName = room.canonical_alias.replace(/^#/, '').split(':')[0];
      return aliasName.charAt(0).toUpperCase() + aliasName.slice(1).replace(/[-_]/g, ' ');
    }

    // For direct messages, try to get the other user's name
    if (this.isDirectMessage(room)) {
      // Try to get from room members if available
      if (room.members && Array.isArray(room.members)) {
        const otherMember = room.members.find(member =>
          member.user_id !== this.matrixClient.currentUser?.user_id && member.membership === 'join'
        );
        if (otherMember) {
          return otherMember.display_name || this.formatUserId(otherMember.user_id);
        }
      }

      // If we have room_id like !abc:server.com, try to make it readable
      if (room.room_id) {
        const roomIdPart = room.room_id.split(':')[0].replace('!', '');
        return 'DM ' + (roomIdPart.length > 8 ? roomIdPart.substring(0, 8) + '...' : roomIdPart);
      }
    }

    // Last resort: format room ID nicely
    if (room.room_id) {
      const roomIdPart = room.room_id.split(':')[0].replace('!', '');
      return 'Room ' + (roomIdPart.length > 10 ? roomIdPart.substring(0, 10) + '...' : roomIdPart);
    }

    return 'Unknown Room';
  }

  // Helper to format user IDs nicely
  formatUserId(userId) {
    if (!userId) return 'Unknown User';
    // Convert @user:server.com to "User"
    const username = userId.replace(/^@/, '').split(':')[0];
    return username.charAt(0).toUpperCase() + username.slice(1).replace(/[-_.]/g, ' ');
  }

  // Check if a room is a direct message
  isDirectMessage(room) {
    console.log('Checking if room is DM:', {
      room_id: room.room_id,
      name: room.name,
      display_name: room.display_name,
      canonical_alias: room.canonical_alias,
      is_direct: room.is_direct,
      type: room.type,
      join_rules: room.join_rules,
      member_count: room.member_count,
      computed_name: this.getRoomDisplayName(room)
    });

    // First check explicit direct message indicators
    if (room.is_direct || room.type === 'dm' || room.type === 'm.room.direct') {
      console.log('Room is DM due to explicit indicators');
      return true;
    }

    // If room has a canonical alias (like #test:server.com), it's not a DM
    if (room.canonical_alias) {
      console.log('Room is not DM due to canonical alias');
      return false;
    }

    // If room has a name like "Test Room", it's definitely not a DM
    const roomName = this.getRoomDisplayName(room);
    if (roomName && (roomName.toLowerCase().includes('room') ||
                     roomName.toLowerCase().includes('chat') ||
                     roomName.toLowerCase().includes('group') ||
                     roomName.toLowerCase().includes('channel'))) {
      console.log('Room is not DM due to name containing room/chat/group/channel');
      return false;
    }

    // Only consider it a DM if it's invite-only AND has exactly 2 members
    const isDM = room.join_rules === 'invite' && room.member_count === 2;
    console.log(`Room DM status: ${isDM} (join_rules: ${room.join_rules}, member_count: ${room.member_count})`);
    return isDM;
  }

  // Format time for display
  formatTime(timestamp) {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    
    return date.toLocaleDateString();
  }

  // Select a room
  selectRoom(roomId) {
    console.log('Selecting room:', roomId);
    
    this.matrixClient.currentRoom = roomId;
    
    // Update room header
    this.updateRoomHeader(roomId);
    
    // Show room header and input
    const roomHeader = this.matrixClient.container.querySelector('#roomHeader');
    const messageInputContainer = this.matrixClient.container.querySelector('#messageInputContainer');
    
    if (roomHeader) roomHeader.style.display = 'flex';
    if (messageInputContainer) messageInputContainer.style.display = 'block';
    
    // Load room messages
    this.loadRoomMessages(roomId);
    
    // Show room members in right panel
    this.showRoomMembers();
  }

  // Update room header with room information
  updateRoomHeader(roomId) {
    const currentRoomData = this.matrixClient.rooms.find(room => room.room_id === roomId);
    if (!currentRoomData) return;

    const roomName = this.getRoomDisplayName(currentRoomData);
    const roomTopic = currentRoomData.topic || 'No topic';

    const currentRoomName = this.matrixClient.container.querySelector('#currentRoomName');
    const currentRoomTopic = this.matrixClient.container.querySelector('#currentRoomTopic');
    const currentRoomAvatar = this.matrixClient.container.querySelector('#currentRoomAvatar');
    const currentRoomInitials = this.matrixClient.container.querySelector('#currentRoomInitials');

    if (currentRoomName) currentRoomName.textContent = roomName;
    if (currentRoomTopic) currentRoomTopic.textContent = roomTopic;

    // Update room avatar
    if (currentRoomAvatar && currentRoomInitials) {
      if (currentRoomData.avatar_url) {
        const httpUrl = this.matrixClient.convertMxcToHttp(currentRoomData.avatar_url);
        currentRoomAvatar.style.backgroundImage = `url(${httpUrl})`;
        currentRoomAvatar.style.backgroundSize = 'cover';
        currentRoomAvatar.style.backgroundPosition = 'center';
        currentRoomInitials.style.display = 'none';
      } else {
        currentRoomInitials.textContent = this.getRoomInitials(currentRoomData);
        currentRoomInitials.style.display = 'block';
        currentRoomAvatar.style.backgroundImage = 'none';
      }
    }
  }

  // Load room messages
  async loadRoomMessages(roomId) {
    try {
      const response = await this.matrixClient.apiClient.getRoomMessages(roomId);
      if (response.success) {
        this.displayMessages(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load room messages:', error);
    }
  }

  // Display messages in chat area
  displayMessages(messages) {
    const messagesContainer = this.matrixClient.container.querySelector('#messagesContainer');
    if (!messagesContainer) return;

    // Ensure messages is an array
    const messagesList = Array.isArray(messages) ? messages : 
                        (messages && messages.chunk) ? messages.chunk :
                        (messages && messages.events) ? messages.events :
                        (messages && typeof messages === 'object') ? Object.values(messages) : [];

    if (messagesList.length === 0) {
      messagesContainer.innerHTML = '<div class="empty-state">No messages in this room</div>';
      return;
    }

    // Process and sort messages
    const processedMessages = messagesList
      .filter(msg => msg && (msg.type === 'm.room.message' || msg.msgtype === 'm.text' || msg.body))
      .sort((a, b) => (a.origin_server_ts || a.timestamp || 0) - (b.origin_server_ts || b.timestamp || 0));

    messagesContainer.innerHTML = processedMessages.map((message, index) => {
      const sender = message.sender || message.user_id || 'Unknown';
      const content = message.content?.body || message.body || 'No content';
      const timestamp = new Date(message.origin_server_ts || message.timestamp || Date.now());

      // Get display name for sender
      const senderDisplayName = this.getSenderDisplayName(sender);
      const senderInitials = this.getSenderInitials(senderDisplayName);

      // Check if this message is from the same sender as the previous one
      const prevMessage = processedMessages[index - 1];
      const isContinuation = prevMessage &&
        (prevMessage.sender || prevMessage.user_id) === sender &&
        (timestamp - new Date(prevMessage.origin_server_ts || prevMessage.timestamp || 0)) < 300000; // 5 minutes

      // Format timestamp
      const timeString = this.formatMessageTime(timestamp);

      return `
        <div class="message-item ${isContinuation ? 'continuation' : 'new-message'}">
          <div class="message-avatar">
            ${!isContinuation ?
              `<div class="avatar-circle">
                <span class="avatar-text">${senderInitials}</span>
              </div>` :
              `<div class="message-timestamp-hover">${timeString}</div>`
            }
          </div>
          <div class="message-content">
            ${!isContinuation ?
              `<div class="message-header">
                <span class="message-sender">${senderDisplayName}</span>
                <span class="message-time">${timeString}</span>
              </div>` : ''
            }
            <div class="message-body">${this.formatMessageContent(content)}</div>
          </div>
        </div>
      `;
    }).join('');

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Show room members
  async showRoomMembers() {
    console.log('Showing room members');

    if (!this.matrixClient.currentRoom) {
      console.warn('No current room selected');
      return;
    }

    const rightPanel = this.matrixClient.container.querySelector('#rightPanel');
    const rightPanelContent = this.matrixClient.container.querySelector('#rightPanelContent');
    
    if (!rightPanel || !rightPanelContent) return;

    // Show right panel
    rightPanel.style.display = 'flex';

    rightPanelContent.innerHTML = `
      <div class="panel-header">
        <h3>Room Members</h3>
        <button class="close-button" id="closeRightPanel">
          <span id="closePanelIcon"></span>
        </button>
      </div>
      <div class="panel-body">
        <div class="loading-state">Loading members...</div>
      </div>
    `;

    // Initialize close icon
    setTimeout(() => {
      const closeIcon = rightPanelContent.querySelector('#closePanelIcon');
      if (closeIcon) {
        if (this.matrixClient.radixIcons) {
          closeIcon.appendChild(this.matrixClient.radixIcons.createIcon('Cross2Icon'));
        } else {
          closeIcon.textContent = '✕';
        }
      }
    }, 0);

    // Add close event listener
    rightPanelContent.querySelector('#closeRightPanel').addEventListener('click', () => {
      rightPanel.style.display = 'none';
    });

    try {
      // Load room members
      console.log('Loading members for room:', this.matrixClient.currentRoom);
      const response = await this.matrixClient.apiClient.getRoomMembers(this.matrixClient.currentRoom);
      console.log('Members API response:', response);

      if (response && response.success) {
        // Handle different response formats
        let membersData = response.data || response.members || response.chunk || [];

        // If response.data is an object with chunk property
        if (response.data && response.data.chunk) {
          membersData = response.data.chunk;
        }

        console.log('Processing members data:', membersData);
        this.displayRoomMembers(membersData);
      } else {
        throw new Error(response?.error || 'Failed to load members');
      }
    } catch (error) {
      console.error('Failed to load room members:', error);
      const panelBody = rightPanelContent.querySelector('.panel-body');
      if (panelBody) {
        panelBody.innerHTML = `
          <div class="error-state">
            <p>Failed to load members</p>
            <p class="error-details">${error.message}</p>
            <button class="action-button secondary" onclick="window.MatrixClientMainInstance.roomManager.showRoomMembers()">Retry</button>
          </div>
        `;
      }
    }
  }

  // Display room members
  displayRoomMembers(members) {
    console.log('displayRoomMembers called with:', members);

    const rightPanelContent = this.matrixClient.container.querySelector('#rightPanelContent');
    if (!rightPanelContent) {
      console.warn('rightPanelContent not found');
      return;
    }

    const panelBody = rightPanelContent.querySelector('.panel-body');
    if (!panelBody) {
      console.warn('panelBody not found');
      return;
    }

    // Ensure members is an array and handle different data formats
    let membersList = [];

    if (Array.isArray(members)) {
      membersList = members;
    } else if (members && members.chunk && Array.isArray(members.chunk)) {
      membersList = members.chunk;
    } else if (members && typeof members === 'object') {
      // Try to extract members from object
      membersList = Object.values(members);
    }

    console.log('Processed membersList:', membersList);

    if (membersList.length === 0) {
      panelBody.innerHTML = `
        <div class="empty-state">
          <h3>No members found</h3>
          <p>Unable to load room members</p>
          <button class="action-button secondary" onclick="window.MatrixClientMainInstance.roomManager.showRoomMembers()">Retry</button>
        </div>
      `;
      return;
    }

    // Group members by power level or status (with fallback for missing power_level)
    const admins = membersList.filter(m => (m.power_level || 0) >= 100);
    const moderators = membersList.filter(m => (m.power_level || 0) >= 50 && (m.power_level || 0) < 100);
    const regularMembers = membersList.filter(m => (m.power_level || 0) < 50);

    console.log('Member groups:', { admins: admins.length, moderators: moderators.length, regular: regularMembers.length });

    let membersHtml = '';

    if (admins.length > 0) {
      membersHtml += `
        <div class="member-section">
          <h4>Admins (${admins.length})</h4>
          <div class="member-list">
            ${admins.map(member => this.renderMemberItem(member)).join('')}
          </div>
        </div>
      `;
    }

    if (moderators.length > 0) {
      membersHtml += `
        <div class="member-section">
          <h4>Moderators (${moderators.length})</h4>
          <div class="member-list">
            ${moderators.map(member => this.renderMemberItem(member)).join('')}
          </div>
        </div>
      `;
    }

    if (regularMembers.length > 0) {
      membersHtml += `
        <div class="member-section">
          <h4>Members (${regularMembers.length})</h4>
          <div class="member-list">
            ${regularMembers.map(member => this.renderMemberItem(member)).join('')}
          </div>
        </div>
      `;
    }

    panelBody.innerHTML = membersHtml;

    // Add click listeners for member items
    panelBody.querySelectorAll('.member-item').forEach(item => {
      item.addEventListener('click', () => {
        const userId = item.dataset.userId;
        this.showUserProfile(userId);
      });
    });
  }

  // Render individual member item
  renderMemberItem(member) {
    const displayName = member.display_name || member.displayname || member.user_id;
    const avatarUrl = member.avatar_url ? this.matrixClient.convertMxcToHttp(member.avatar_url) : '';
    const initials = displayName.substring(0, 2).toUpperCase();

    return `
      <div class="member-item" data-user-id="${member.user_id}">
        <div class="member-avatar">
          ${avatarUrl ? 
            `<img src="${avatarUrl}" alt="${displayName}" class="avatar-image">` :
            `<span class="avatar-text">${initials}</span>`
          }
        </div>
        <div class="member-info">
          <div class="member-name">${displayName}</div>
          <div class="member-id">${member.user_id}</div>
        </div>
        <div class="member-status">
          ${member.presence === 'online' ? '<div class="status-indicator online"></div>' : ''}
        </div>
      </div>
    `;
  }

  // Helper methods for message display
  getSenderDisplayName(userId) {
    if (!userId) return 'Unknown User';

    // Try to find display name from current room members
    const currentRoomData = this.matrixClient.rooms.find(room => room.room_id === this.matrixClient.currentRoom);
    if (currentRoomData && currentRoomData.members) {
      const member = currentRoomData.members.find(m => m.user_id === userId);
      if (member && member.display_name) {
        return member.display_name;
      }
    }

    // Fallback to formatting the user ID
    return this.formatUserId(userId);
  }

  getSenderInitials(displayName) {
    if (!displayName) return '??';
    const words = displayName.split(' ');
    if (words.length >= 2) {
      return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
    }
    return displayName.substring(0, 2).toUpperCase();
  }

  formatMessageTime(timestamp) {
    const now = new Date();
    const messageDate = new Date(timestamp);

    // If today, show time only
    if (messageDate.toDateString() === now.toDateString()) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // If this week, show day and time
    const daysDiff = Math.floor((now - messageDate) / (1000 * 60 * 60 * 24));
    if (daysDiff < 7) {
      return messageDate.toLocaleDateString([], { weekday: 'short' }) + ' ' +
             messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // Otherwise show date and time
    return messageDate.toLocaleDateString() + ' ' +
           messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  formatMessageContent(content) {
    if (!content) return '';

    // Basic HTML escaping
    const escaped = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    // Convert URLs to links
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const withLinks = escaped.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');

    // Convert line breaks
    return withLinks.replace(/\n/g, '<br>');
  }

  // Show user profile (placeholder)
  showUserProfile(userId) {
    console.log('Showing profile for user:', userId);
    // TODO: Implement user profile display
  }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.RoomManager = RoomManager;
}
})(); // End of IIFE
