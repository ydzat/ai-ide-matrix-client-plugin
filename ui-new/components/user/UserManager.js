// User Manager Component - Handles user-related functionality
// This component manages user interactions, menus, and profiles

// Use IIFE to prevent redeclaration errors
(function() {
  // Prevent redeclaration errors
  if (typeof window !== 'undefined' && window.UserManager) {
    console.log('UserManager already loaded, skipping redeclaration');
    return;
  }

  class UserManager {
  constructor(matrixClient) {
    this.matrixClient = matrixClient;
  }

  // Show user menu dropdown
  showUserMenu(avatarElement) {
    // Remove existing menu if any
    const existingMenu = document.querySelector('.user-menu');
    if (existingMenu) {
      existingMenu.remove();
      return;
    }

    // Create user menu
    const userMenu = document.createElement('div');
    userMenu.className = 'user-menu';
    
    const rect = avatarElement.getBoundingClientRect();
    userMenu.style.position = 'fixed';
    userMenu.style.top = `${rect.bottom + 5}px`;
    userMenu.style.left = `${rect.left}px`;
    userMenu.style.zIndex = '10000';
    
    userMenu.innerHTML = `
      <div class="user-menu-content">
        <div class="user-menu-header">
          <div class="user-menu-avatar">
            ${this.matrixClient.currentUser?.avatar_url ? 
              `<img src="${this.matrixClient.convertMxcToHttp(this.matrixClient.currentUser.avatar_url)}" alt="${this.matrixClient.currentUser.display_name || this.matrixClient.currentUser.user_id}" class="avatar-image">` :
              `<span class="avatar-text">${this.matrixClient.getUserInitials()}</span>`
            }
          </div>
          <div class="user-menu-info">
            <div class="user-menu-name">${this.matrixClient.currentUser?.display_name || 'User'}</div>
            <div class="user-menu-id">${this.matrixClient.currentUser?.user_id || ''}</div>
          </div>
        </div>
        <div class="user-menu-divider"></div>
        <div class="user-menu-items">
          <div class="user-menu-item" id="userMenuProfile">
            <span class="menu-icon" id="profileMenuIcon"></span>
            <span>Profile</span>
          </div>
          <div class="user-menu-item" id="userMenuSettings">
            <span class="menu-icon" id="settingsMenuIcon"></span>
            <span>Settings</span>
          </div>
          <div class="user-menu-divider"></div>
          <div class="user-menu-item" id="userMenuLogout">
            <span class="menu-icon" id="logoutMenuIcon"></span>
            <span>Sign out</span>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(userMenu);

    // Initialize icons
    setTimeout(() => {
      const profileIcon = userMenu.querySelector('#profileMenuIcon');
      const settingsIcon = userMenu.querySelector('#settingsMenuIcon');
      const logoutIcon = userMenu.querySelector('#logoutMenuIcon');
      
      if (this.matrixClient.radixIcons) {
        if (profileIcon) {
          profileIcon.appendChild(this.matrixClient.radixIcons.createIcon('PersonIcon'));
        }
        if (settingsIcon) {
          settingsIcon.appendChild(this.matrixClient.radixIcons.createIcon('GearIcon'));
        }
        if (logoutIcon) {
          logoutIcon.appendChild(this.matrixClient.radixIcons.createIcon('ExitIcon'));
        }
      } else {
        // Fallback icons
        if (profileIcon) profileIcon.textContent = '👤';
        if (settingsIcon) settingsIcon.textContent = '⚙️';
        if (logoutIcon) logoutIcon.textContent = '🚪';
      }
    }, 0);

    // Add event listeners
    userMenu.querySelector('#userMenuProfile').addEventListener('click', () => {
      this.showUserProfile(this.matrixClient.currentUser?.user_id);
      userMenu.remove();
    });

    userMenu.querySelector('#userMenuSettings').addEventListener('click', () => {
      this.showQuickSettings();
      userMenu.remove();
    });

    userMenu.querySelector('#userMenuLogout').addEventListener('click', () => {
      this.logout();
      userMenu.remove();
    });

    // Close menu when clicking outside
    const closeMenu = (e) => {
      if (!userMenu.contains(e.target) && !avatarElement.contains(e.target)) {
        userMenu.remove();
        document.removeEventListener('click', closeMenu);
      }
    };
    
    setTimeout(() => {
      document.addEventListener('click', closeMenu);
    }, 0);
  }

  // Show user profile
  showUserProfile(userId) {
    console.log('Showing user profile for:', userId);
    
    const rightPanel = this.matrixClient.container.querySelector('#rightPanel');
    const rightPanelContent = this.matrixClient.container.querySelector('#rightPanelContent');
    
    if (!rightPanel || !rightPanelContent) return;

    // Show right panel
    rightPanel.style.display = 'flex';

    rightPanelContent.innerHTML = `
      <div class="panel-header">
        <h3>User Profile</h3>
        <button class="close-button" id="closeRightPanel">
          <span id="closePanelIcon"></span>
        </button>
      </div>
      <div class="panel-body">
        <div class="loading-state">Loading profile...</div>
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

    // Load user profile data
    this.loadUserProfile(userId);
  }

  // Load user profile data
  async loadUserProfile(userId) {
    try {
      const response = await this.matrixClient.apiClient.getUserProfile(userId);
      if (response && response.success) {
        this.displayUserProfile(response.data || response.profile || response);
      } else {
        throw new Error(response?.error || 'Failed to load profile');
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
      const rightPanelContent = this.matrixClient.container.querySelector('#rightPanelContent');
      const panelBody = rightPanelContent?.querySelector('.panel-body');
      if (panelBody) {
        panelBody.innerHTML = `
          <div class="error-state">
            <p>Failed to load profile</p>
            <p class="error-details">${error.message}</p>
          </div>
        `;
      }
    }
  }

  // Display user profile
  displayUserProfile(profile) {
    const rightPanelContent = this.matrixClient.container.querySelector('#rightPanelContent');
    if (!rightPanelContent) return;

    const panelBody = rightPanelContent.querySelector('.panel-body');
    if (!panelBody) return;

    const displayName = profile.display_name || profile.displayname || profile.user_id || 'Unknown User';
    const avatarUrl = profile.avatar_url ? this.matrixClient.convertMxcToHttp(profile.avatar_url) : '';
    const initials = displayName.substring(0, 2).toUpperCase();

    panelBody.innerHTML = `
      <div class="user-profile">
        <div class="profile-header">
          <div class="profile-avatar">
            ${avatarUrl ? 
              `<img src="${avatarUrl}" alt="${displayName}" class="avatar-image">` :
              `<span class="avatar-text">${initials}</span>`
            }
          </div>
          <div class="profile-info">
            <h3 class="profile-name">${displayName}</h3>
            <p class="profile-id">${profile.user_id}</p>
          </div>
        </div>
        
        <div class="profile-actions">
          <button class="action-button primary" id="startDirectMessage">
            <span class="button-icon" id="dmIcon"></span>
            <span>Send Message</span>
          </button>
          <button class="action-button secondary" id="viewSharedRooms">
            <span class="button-icon" id="sharedRoomsIcon"></span>
            <span>Shared Rooms</span>
          </button>
        </div>

        <div class="profile-details">
          <div class="detail-section">
            <h4>About</h4>
            <p>${profile.bio || profile.about || 'No bio available'}</p>
          </div>
          
          ${profile.presence ? `
            <div class="detail-section">
              <h4>Status</h4>
              <div class="presence-info">
                <div class="status-indicator ${profile.presence}"></div>
                <span>${profile.presence}</span>
                ${profile.status_msg ? `<p class="status-message">${profile.status_msg}</p>` : ''}
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    // Initialize action button icons
    setTimeout(() => {
      const dmIcon = panelBody.querySelector('#dmIcon');
      const sharedRoomsIcon = panelBody.querySelector('#sharedRoomsIcon');
      
      if (this.matrixClient.radixIcons) {
        if (dmIcon) {
          dmIcon.appendChild(this.matrixClient.radixIcons.createIcon('ChatBubbleIcon'));
        }
        if (sharedRoomsIcon) {
          sharedRoomsIcon.appendChild(this.matrixClient.radixIcons.createIcon('HomeIcon'));
        }
      } else {
        if (dmIcon) dmIcon.textContent = '💬';
        if (sharedRoomsIcon) sharedRoomsIcon.textContent = '🏠';
      }
    }, 0);

    // Add event listeners for actions
    const startDmButton = panelBody.querySelector('#startDirectMessage');
    if (startDmButton) {
      startDmButton.addEventListener('click', () => {
        this.startDirectMessage(profile.user_id);
      });
    }

    const viewSharedRoomsButton = panelBody.querySelector('#viewSharedRooms');
    if (viewSharedRoomsButton) {
      viewSharedRoomsButton.addEventListener('click', () => {
        this.viewSharedRooms(profile.user_id);
      });
    }
  }

  // Start direct message with user
  async startDirectMessage(userId) {
    try {
      console.log('Starting direct message with:', userId);
      const response = await this.matrixClient.apiClient.createDirectMessage(userId);
      if (response && response.success) {
        const roomId = response.room_id;
        // Select the new room
        this.matrixClient.roomManager.selectRoom(roomId);
        // Close right panel
        const rightPanel = this.matrixClient.container.querySelector('#rightPanel');
        if (rightPanel) rightPanel.style.display = 'none';
      } else {
        throw new Error(response?.error || 'Failed to create direct message');
      }
    } catch (error) {
      console.error('Failed to start direct message:', error);
      // Show error message
      this.showError('Failed to start direct message: ' + error.message);
    }
  }

  // View shared rooms with user
  async viewSharedRooms(userId) {
    try {
      console.log('Loading shared rooms with:', userId);
      const response = await this.matrixClient.apiClient.getSharedRooms(userId);
      if (response && response.success) {
        this.displaySharedRooms(response.rooms || []);
      } else {
        throw new Error(response?.error || 'Failed to load shared rooms');
      }
    } catch (error) {
      console.error('Failed to load shared rooms:', error);
      this.showError('Failed to load shared rooms: ' + error.message);
    }
  }

  // Display shared rooms
  displaySharedRooms(rooms) {
    const rightPanelContent = this.matrixClient.container.querySelector('#rightPanelContent');
    if (!rightPanelContent) return;

    const panelBody = rightPanelContent.querySelector('.panel-body');
    if (!panelBody) return;

    if (rooms.length === 0) {
      panelBody.innerHTML = '<div class="empty-state">No shared rooms</div>';
      return;
    }

    panelBody.innerHTML = `
      <div class="shared-rooms">
        <h4>Shared Rooms (${rooms.length})</h4>
        <div class="room-list">
          ${rooms.map(room => `
            <div class="room-item" data-room-id="${room.room_id}">
              <div class="room-avatar">
                ${room.avatar_url ?
                  `<img src="${this.matrixClient.convertMxcToHttp(room.avatar_url)}" alt="${room.name}" class="avatar-image">` :
                  `<span class="avatar-text">${room.name.substring(0, 2).toUpperCase()}</span>`
                }
              </div>
              <div class="room-info">
                <div class="room-name">${room.name || room.room_id}</div>
                <div class="room-members">${room.member_count || 0} members</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Add click listeners to room items
    panelBody.querySelectorAll('.room-item').forEach(item => {
      item.addEventListener('click', () => {
        const roomId = item.dataset.roomId;
        this.matrixClient.roomManager.selectRoom(roomId);
        // Close right panel
        const rightPanel = this.matrixClient.container.querySelector('#rightPanel');
        if (rightPanel) rightPanel.style.display = 'none';
      });
    });
  }

  // Show quick settings
  showQuickSettings() {
    console.log('Showing quick settings');

    // Create settings modal
    const settingsModal = document.createElement('div');
    settingsModal.className = 'settings-modal';
    settingsModal.innerHTML = `
      <div class="settings-content">
        <div class="settings-header">
          <h2>Settings</h2>
          <button class="close-button" id="closeSettings">
            <span id="closeSettingsIcon"></span>
          </button>
        </div>
        <div class="settings-body">
          <div class="settings-section">
            <h3>Appearance</h3>
            <div class="setting-item">
              <label>Theme</label>
              <select id="themeSelect">
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="auto">Auto</option>
              </select>
            </div>
          </div>
          
          <div class="settings-section">
            <h3>Notifications</h3>
            <div class="setting-item">
              <label>
                <input type="checkbox" id="enableNotifications" checked>
                Enable notifications
              </label>
            </div>
            <div class="setting-item">
              <label>
                <input type="checkbox" id="enableSounds" checked>
                Enable sounds
              </label>
            </div>
          </div>

          <div class="settings-section">
            <h3>Privacy</h3>
            <div class="setting-item">
              <label>
                <input type="checkbox" id="showReadReceipts" checked>
                Send read receipts
              </label>
            </div>
            <div class="setting-item">
              <label>
                <input type="checkbox" id="showTypingIndicators" checked>
                Send typing indicators
              </label>
            </div>
          </div>
        </div>
        <div class="settings-footer">
          <button class="action-button secondary" id="cancelSettings">Cancel</button>
          <button class="action-button primary" id="saveSettings">Save</button>
        </div>
      </div>
    `;

    document.body.appendChild(settingsModal);

    // Initialize close icon
    setTimeout(() => {
      const closeIcon = settingsModal.querySelector('#closeSettingsIcon');
      if (closeIcon) {
        if (this.matrixClient.radixIcons) {
          closeIcon.appendChild(this.matrixClient.radixIcons.createIcon('Cross2Icon'));
        } else {
          closeIcon.textContent = '✕';
        }
      }
    }, 0);

    // Add event listeners
    const closeSettings = () => {
      settingsModal.remove();
    };

    settingsModal.querySelector('#closeSettings').addEventListener('click', closeSettings);
    settingsModal.querySelector('#cancelSettings').addEventListener('click', closeSettings);
    
    settingsModal.querySelector('#saveSettings').addEventListener('click', () => {
      this.saveSettings(settingsModal);
      closeSettings();
    });

    // Close on backdrop click
    settingsModal.addEventListener('click', (e) => {
      if (e.target === settingsModal) {
        closeSettings();
      }
    });
  }

  // Save settings
  saveSettings(settingsModal) {
    const theme = settingsModal.querySelector('#themeSelect').value;
    const enableNotifications = settingsModal.querySelector('#enableNotifications').checked;
    const enableSounds = settingsModal.querySelector('#enableSounds').checked;
    const showReadReceipts = settingsModal.querySelector('#showReadReceipts').checked;
    const showTypingIndicators = settingsModal.querySelector('#showTypingIndicators').checked;

    const settings = {
      theme,
      enableNotifications,
      enableSounds,
      showReadReceipts,
      showTypingIndicators
    };

    // Save to localStorage
    localStorage.setItem('matrix-client-settings', JSON.stringify(settings));
    
    console.log('Settings saved:', settings);
    
    // Apply theme immediately
    this.applyTheme(theme);
  }

  // Apply theme
  applyTheme(theme) {
    const body = document.body;
    body.classList.remove('theme-dark', 'theme-light');
    
    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      body.classList.add(prefersDark ? 'theme-dark' : 'theme-light');
    } else {
      body.classList.add(`theme-${theme}`);
    }
  }

  // Logout
  async logout() {
    try {
      console.log('Logging out...');
      await this.matrixClient.apiClient.logout();
      
      // Clear local data
      this.matrixClient.currentUser = null;
      this.matrixClient.rooms = [];
      this.matrixClient.spaces = [];
      this.matrixClient.currentRoom = null;
      this.matrixClient.currentSpace = null;
      
      // Switch to login view
      this.matrixClient.currentView = 'login';
      this.matrixClient.updateUI();
      
    } catch (error) {
      console.error('Logout failed:', error);
      // Force logout even if API call fails
      this.matrixClient.currentView = 'login';
      this.matrixClient.updateUI();
    }
  }

  // Show error message
  showError(message) {
    // Create error toast
    const errorToast = document.createElement('div');
    errorToast.className = 'error-toast';
    errorToast.textContent = message;
    
    document.body.appendChild(errorToast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      errorToast.remove();
    }, 5000);
  }
  }

  // Export for use in other modules
  if (typeof window !== 'undefined') {
    window.UserManager = UserManager;
  }
})(); // End of IIFE
