// Matrix Client Main Component - Vanilla JavaScript Implementation
// This is the main entry point for the Matrix client plugin

const MatrixClientMain = {
  name: 'MatrixClientMain',
  version: '3.0.0',

  // DOM container reference
  container: null,
  props: {},

  // Component state
  currentView: 'login', // 'login', 'main'
  currentRoom: null,
  currentSpace: null,
  isInitialized: false,
  isAuthenticated: false,

  // Data stores
  currentUser: null,
  rooms: [],
  spaces: [],

  // Store references
  authStore: null,
  roomsStore: null,
  apiClient: null,
  eventBus: null,
  radixIcons: null,

  // Initialization state
  isInitialized: false,
  isDestroyed: false,

  // Initialize the new Matrix client
  async init(container, props = {}) {
    console.log('MatrixClientMain.init called with:', { container, props });

    // Prevent multiple initializations
    if (this.isInitialized && !this.isDestroyed) {
      console.warn('MatrixClientMain already initialized, skipping');
      return;
    }

    // Ensure we have a valid container
    if (!container) {
      throw new Error('Container is required for initialization');
    }

    // Reset destroyed state
    this.isDestroyed = false;

    // Global instance management
    window.MatrixClientMainInstance = this;

    this.container = container;
    this.props = props;

    console.log('Initializing Matrix Client with vanilla JavaScript...');

    try {
      // Load CSS styles first
      await this.loadStyles();

      // Load utilities (vanilla JavaScript versions)
      await this.loadModules();

      // Initialize stores and utilities
      this.initializeStores();

      // Set up event listeners
      this.setupEventListeners();

      // Check for existing session and validate it
      if (this.apiClient && this.apiClient.isAuthenticated) {
        console.log('Existing session found, validating...');
        this.validateAndRestoreSession();
      } else {
        // No existing session, show login
        this.currentView = 'login';
        this.currentRoom = null;
      }

      // Mark as initialized
      this.isInitialized = true;

      console.log('Matrix Client initialized successfully with vanilla JavaScript');
    } catch (error) {
      console.error('Failed to initialize Matrix Client:', error);
      this.showError('Failed to initialize Matrix Client: ' + error.message);
      throw error;
    }
  },

  // Load required modules
  async loadModules() {
    const basePath = 'http://localhost:8000/extensions/ai-ide.matrix-client-plugin/ui-new/';
    
    try {
      // Load utilities (vanilla JavaScript versions)
      await this.loadScript(basePath + 'utils/EventBus-vanilla.js');
      await this.loadScript(basePath + 'utils/ApiClient-vanilla.js');
      
      // Load RadixIcons from correct path
      const radixIconsPath = 'http://localhost:8000/extensions/ai-ide.matrix-client-plugin/ui-new/utils/RadixIcons.js';
      console.log('Loading RadixIcons from:', radixIconsPath);
      
      try {
        await this.loadScript(radixIconsPath);
        console.log('RadixIcons loaded successfully');
      } catch (iconError) {
        console.warn('Failed to load RadixIcons, will use fallback icons:', iconError);
        // Continue without RadixIcons - fallback will be used
      }

      console.log('All modules loaded successfully');
    } catch (error) {
      console.error('Failed to load critical modules:', error);
      throw error;
    }
  },

  // Load script helper
  async loadScript(url) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Failed to load ${url}: 404`));
      document.head.appendChild(script);
    });
  },

  // Initialize stores and utilities
  initializeStores() {
    // Initialize API Client
    if (window.ApiClient) {
      this.apiClient = new window.ApiClient();
    }

    // Initialize EventBus
    if (window.EventBus) {
      this.eventBus = new window.EventBus();
    }

    // Initialize RadixIcons
    if (window.RadixIcons) {
      this.radixIcons = window.RadixIcons;
      console.log('RadixIcons initialized successfully');
    } else {
      console.warn('RadixIcons not loaded - window.RadixIcons is undefined');
      console.log('Available window properties:', Object.keys(window).filter(k => k.includes('Radix')));
    }

    // Set up event listeners
    this.setupEventListeners();

    // Check for existing session and validate it
    if (this.apiClient && this.apiClient.isAuthenticated) {
      console.log('Existing session found, validating...');
      this.validateAndRestoreSession();
    } else {
      // No existing session, show login
      this.currentView = 'login';
      this.currentRoom = null;
    }
  },

  // Validate and restore existing session
  async validateAndRestoreSession() {
    try {
      const isValid = await this.apiClient.validateSession();
      if (isValid) {
        console.log('Session is valid, restoring main view');
        this.currentView = 'main';
        this.currentRoom = null;
        this.loadRoomsAfterLogin();
      } else {
        console.log('Session is invalid, showing login');
        this.currentView = 'login';
        this.currentRoom = null;
      }
      this.updateUI();
    } catch (error) {
      console.error('Session validation failed:', error);
      this.currentView = 'login';
      this.currentRoom = null;
      this.updateUI();
    }
  },

  // Load rooms and user data after successful login
  async loadRoomsAfterLogin() {
    try {
      console.log('Loading user data and rooms after login...');

      // Load current user profile
      await this.loadCurrentUserProfile();

      // Load spaces
      await this.loadSpaces();

      // Load rooms
      if (this.apiClient) {
        const roomsData = await this.apiClient.getRooms();
        if (roomsData) {
          this.rooms = roomsData.joined_rooms || [];
          console.log(`Loaded ${this.rooms.length} rooms`);

          // Update UI with real data
          this.updateUserAvatar();
          this.updateSpacesList();
          if (this.roomManager) {
            this.roomManager.displayRoomsInSpace(this.rooms, 'home');
          }

          // Emit event to update room list
          if (this.eventBus) {
            this.eventBus.emit('rooms:loaded', { rooms: this.rooms });
          }
        }
      } else {
        console.warn('Cannot load rooms: apiClient not initialized');
      }
    } catch (error) {
      console.warn('Failed to load rooms:', error.message);
    }
  },

  // Load current user profile
  async loadCurrentUserProfile() {
    if (!this.apiClient) {
      console.warn('Cannot load user profile: apiClient not initialized');
      return;
    }

    try {
      const response = await this.apiClient.getCurrentUserProfile();
      if (response && response.success) {
        // Handle different response formats
        this.currentUser = response.data || response.profile || response;
        console.log('Current user profile loaded successfully');

        // Update avatar after loading profile
        this.updateUserAvatar();
      } else {
        console.warn('User profile request failed:', response?.error || 'Unknown error');
      }
    } catch (error) {
      console.warn('Failed to load current user profile:', error.message);
    }
  },

  // Load spaces
  async loadSpaces() {
    if (!this.apiClient) {
      console.warn('Cannot load spaces: apiClient not initialized');
      return;
    }

    try {
      const spacesData = await this.apiClient.getSpaces();
      if (spacesData && spacesData.success) {
        // Handle different response formats
        this.spaces = spacesData.spaces || spacesData.data || [];
        console.log(`Loaded ${this.spaces.length} spaces successfully`);
      } else {
        console.info('No spaces found or spaces request failed');
        this.spaces = [];
      }
    } catch (error) {
      console.warn('Failed to load spaces:', error.message);
      this.spaces = [];
    }
  },

  // Convert MXC URL to HTTP URL
  convertMxcToHttp(mxcUrl) {
    if (!mxcUrl || !mxcUrl.startsWith('mxc://')) {
      return ''; // Return empty string for invalid URLs
    }

    // Extract server and media ID from mxc://server/mediaId
    const mxcMatch = mxcUrl.match(/^mxc:\/\/([^\/]+)\/(.+)$/);
    if (!mxcMatch) {
      return ''; // Return empty string for invalid format
    }

    const [, server, mediaId] = mxcMatch;

    // Use the proxy endpoint for media downloads to avoid CORS issues
    return `http://localhost:8000/api/message-proxy/element/media/download/${server}/${mediaId}`;
  },

  // Update user avatar with real data
  updateUserAvatar() {
    if (!this.container || this.isDestroyed) {
      console.warn('Cannot update user avatar: container is null or component destroyed');
      return;
    }

    const userAvatar = this.container.querySelector('#userAvatar');
    const userInitials = this.container.querySelector('#userInitials');

    if (userAvatar && this.currentUser) {
      if (this.currentUser.avatar_url) {
        // Show actual avatar image with converted URL
        const httpUrl = this.convertMxcToHttp(this.currentUser.avatar_url);
        userAvatar.style.backgroundImage = `url(${httpUrl})`;
        userAvatar.style.backgroundSize = 'cover';
        userAvatar.style.backgroundPosition = 'center';
        if (userInitials) {
          userInitials.style.display = 'none';
        }
      } else {
        // Show initials
        if (userInitials) {
          userInitials.textContent = this.getUserInitials();
          userInitials.style.display = 'block';
        }
      }

      // Add tooltip with user info
      const displayName = this.currentUser.displayname || this.currentUser.user_id || 'Unknown User';
      userAvatar.title = displayName;
    }
  },

  // Update spaces list with real data
  updateSpacesList() {
    if (!this.container || this.isDestroyed) {
      console.warn('Cannot update spaces list: container is null or component destroyed');
      return;
    }

    const spacesSection = this.container.querySelector('#spacesSection');
    if (!spacesSection) return;

    // Clear existing spaces (except Home and Create)
    const existingSpaces = spacesSection.querySelectorAll('.space-item:not([data-space="home"]):not([data-space="create"])');
    existingSpaces.forEach(space => space.remove());

    // Add real spaces
    this.spaces.forEach(space => {
      const spaceElement = document.createElement('div');
      spaceElement.className = 'space-item';
      spaceElement.dataset.space = space.room_id || space.id || 'unknown';
      spaceElement.title = space.display_name || space.name || space.room_id || space.id || 'Unknown Space';

      const spaceAvatar = document.createElement('div');
      spaceAvatar.className = 'space-avatar';

      if (space.avatar_url) {
        const httpUrl = this.convertMxcToHttp(space.avatar_url);
        spaceAvatar.style.backgroundImage = `url(${httpUrl})`;
        spaceAvatar.style.backgroundSize = 'cover';
        spaceAvatar.style.backgroundPosition = 'center';
      } else {
        // Use first letter of space name
        const spaceName = space.display_name || space.name || space.room_id || space.id || 'Space';
        spaceAvatar.textContent = spaceName.charAt(0).toUpperCase();
      }

      spaceElement.appendChild(spaceAvatar);

      // Insert before the "Create" button
      const createButton = spacesSection.querySelector('[data-space="create"]');
      spacesSection.insertBefore(spaceElement, createButton);
    });
  },

  // Set up event listeners
  setupEventListeners() {
    const eventBus = window.eventBus;
    if (!eventBus) return;

    // Clear any existing listeners first to prevent duplicates
    eventBus.removeAllListeners('auth:login_success');
    eventBus.removeAllListeners('auth:session_restored');
    eventBus.removeAllListeners('auth:session_expired');
    eventBus.removeAllListeners('auth:logout');

    // Listen for authentication state changes
    eventBus.on('auth:login_success', () => {
      this.currentView = 'main';
      this.loadRoomsAfterLogin();
      this.updateUI();
    });

    eventBus.on('auth:session_restored', () => {
      console.log('Session restored event received');
      this.currentView = 'main';
      this.loadRoomsAfterLogin();
      this.updateUI();
    });

    eventBus.on('auth:session_expired', () => {
      console.log('Session expired event received');
      this.currentView = 'login';
      this.currentRoom = null;
      this.updateUI();
    });

    eventBus.on('auth:logout', () => {
      this.currentView = 'login';
      this.currentRoom = null;
      this.updateUI();
    });

    // Listen for room selection
    eventBus.on('room:selected', (data) => {
      this.currentRoom = data.roomId;
      this.updateUI();
    });
  },

  // Load CSS styles
  async loadStyles() {
    try {
      // Correct path for CSS loading
      const basePath = 'http://localhost:8000/extensions/ai-ide.matrix-client-plugin/ui-new/styles/';

      console.log('Loading CSS from:', basePath + 'globals.css');

      // Load global styles
      const response = await fetch(basePath + 'globals.css');
      if (!response.ok) {
        throw new Error(`Failed to load CSS: ${response.status} ${response.statusText}`);
      }

      const globalStyles = await response.text();
      console.log('CSS loaded successfully, length:', globalStyles.length);

      // Create style element
      const styleElement = document.createElement('style');
      styleElement.textContent = globalStyles;
      document.head.appendChild(styleElement);

      console.log('CSS styles applied successfully');
    } catch (error) {
      console.error('Failed to load styles:', error);

      // Fallback: Add basic inline styles
      this.addFallbackStyles();
    }
  },

  // Fallback styles if CSS loading fails
  addFallbackStyles() {
    const fallbackStyles = `
      .matrix-client-container {
        width: 100%;
        height: 100vh;
        background: #1e1e1e;
        color: #ffffff;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        display: flex;
        flex-direction: column;
      }
      .login-container {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100vh;
        background: #1e1e1e;
      }
      .login-form {
        background: #2d2d2d;
        padding: 2rem;
        border-radius: 8px;
        width: 100%;
        max-width: 400px;
      }
    `;

    const styleElement = document.createElement('style');
    styleElement.textContent = fallbackStyles;
    document.head.appendChild(styleElement);
  },

  // Show error message
  showError(message) {
    if (this.container) {
      this.container.innerHTML = `
        <div class="error-container">
          <div class="error-message">
            <h2>Error</h2>
            <p>${message}</p>
            <button onclick="location.reload()">Reload</button>
          </div>
        </div>
      `;
    }
  },

  // Update UI based on current state
  updateUI() {
    if (!this.container || this.isDestroyed) {
      console.warn('Cannot update UI: container is null or component destroyed');
      return;
    }

    console.log('MatrixClientMain.updateUI called, container:', this.container);

    if (this.currentView === 'login') {
      this.renderLoginView();
    } else if (this.currentView === 'main') {
      this.renderMainView();
    }

    // Initialize icons after UI is rendered
    setTimeout(() => {
      this.initializeIcons();
      this.setupMainViewEventListeners();
    }, 100);
  },

  // Render login view
  renderLoginView() {
    this.container.innerHTML = `
      <div class="login-container">
        <div class="login-form">
          <div class="login-header">
            <h1>Matrix Client</h1>
            <p>Sign in to your Matrix account</p>
          </div>
          <form id="loginForm">
            <div class="form-group">
              <label for="homeserver">Homeserver</label>
              <input type="text" id="homeserver" name="homeserver"
                     value="https://matrix.os.rwth-aachen.de"
                     placeholder="https://matrix.example.com" required>
            </div>
            <div class="form-group">
              <label for="username">Username</label>
              <input type="text" id="username" name="username"
                     placeholder="@username:matrix.example.com" required>
            </div>
            <div class="form-group">
              <label for="password">Password</label>
              <input type="password" id="password" name="password" required>
            </div>
            <button type="submit" class="login-button">Sign In</button>
          </form>
          <div id="loginError" class="error-message" style="display: none;"></div>
        </div>
      </div>
    `;

    // Set up login form handler
    setTimeout(() => {
      const loginForm = this.container.querySelector('#loginForm');
      if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
          e.preventDefault();
          this.handleLogin();
        });
      }
    }, 0);
  },

  // Handle login form submission
  async handleLogin() {
    const homeserver = this.container.querySelector('#homeserver').value;
    const username = this.container.querySelector('#username').value;
    const password = this.container.querySelector('#password').value;
    const errorDiv = this.container.querySelector('#loginError');

    try {
      errorDiv.style.display = 'none';

      const result = await this.apiClient.login(homeserver, username, password);

      if (result.success) {
        this.currentView = 'main';
        this.loadRoomsAfterLogin();
        this.updateUI();
      } else {
        throw new Error(result.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      errorDiv.textContent = error.message;
      errorDiv.style.display = 'block';
    }
  },

  // Render main application view
  renderMainView() {
    this.container.innerHTML = `
      <div class="matrix-main-layout">
        <!-- Activity Bar (Left sidebar with spaces) -->
        <div class="activity-bar">
          <div class="user-section">
            <div class="user-avatar" id="userAvatar" title="Click for user menu">
              <span id="userInitials" class="user-initials">${this.getUserInitials()}</span>
            </div>

            <div class="spaces-section" id="spacesSection">
              <div class="space-item active" data-space="home" title="Home">
                <div class="space-avatar" id="homeSpaceIcon"></div>
              </div>
              <div class="space-item" data-space="create" title="Create a space">
                <div class="space-avatar" id="createSpaceIcon"></div>
              </div>
            </div>

            <div class="activity-section">
              <div class="activity-item" id="threadsActivity" title="Threads activity">
                <div class="activity-icon" id="threadsIcon"></div>
              </div>
              <div class="activity-item" id="quickSettings" title="Quick settings">
                <div class="activity-icon" id="settingsIcon"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Left Panel (Room list for selected space) -->
        <div class="left-panel">
          <div class="panel-header">
            <h2 id="currentSpaceName">Home</h2>
            <div class="panel-actions">
              <button class="panel-action" id="exploreRooms" title="Explore rooms">
                <span id="exploreIcon"></span>
              </button>
              <button class="panel-action" id="addRoom" title="Add room">
                <span id="addRoomIcon"></span>
              </button>
            </div>
          </div>

          <div class="search-section">
            <div class="search-input-container">
              <span id="searchIcon" class="search-icon"></span>
              <input type="text" id="roomSearch" placeholder="Search for people, rooms, messages" class="search-input">
            </div>
          </div>

          <div class="rooms-section">
            <div class="section-header">
              <h3>PEOPLE</h3>
              <button class="section-action" id="startChat" title="Start a chat">
                <span id="startChatIcon"></span>
              </button>
            </div>
            <div class="room-list" id="peopleList">
              <div class="empty-state">No direct messages</div>
            </div>

            <div class="section-header">
              <h3>ROOMS</h3>
              <button class="section-action" id="addRoomToSpace" title="Add room to space">
                <span id="addRoomToSpaceIcon"></span>
              </button>
            </div>
            <div class="room-list" id="roomsList">
              <div class="empty-state">No rooms in this space</div>
            </div>
          </div>
        </div>

        <!-- Main Content Area -->
        <div class="main-content">
          <div class="room-header" id="roomHeader" style="display: none;">
            <div class="room-info">
              <div class="room-avatar" id="currentRoomAvatar">
                <span id="currentRoomInitials"></span>
              </div>
              <div class="room-details">
                <h3 id="currentRoomName">Select a room</h3>
                <p id="currentRoomTopic">Room topic</p>
              </div>
            </div>
            <div class="room-actions">
              <button class="room-action" id="videoCall" title="Video call">
                <svg width="16" height="16" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 4.5C1 3.11929 2.11929 2 3.5 2H8.5C9.88071 2 11 3.11929 11 4.5V10.5C11 11.8807 9.88071 13 8.5 13H3.5C2.11929 13 1 11.8807 1 10.5V4.5ZM3.5 3C2.67157 3 2 3.67157 2 4.5V10.5C2 11.3284 2.67157 12 3.5 12H8.5C9.32843 12 10 11.3284 10 10.5V4.5C10 3.67157 9.32843 3 8.5 3H3.5ZM11.7071 4.79289C11.8946 4.98043 12 5.23478 12 5.5V9.5C12 9.76522 11.8946 10.0196 11.7071 10.2071L10.5 11.4142C10.1095 11.8047 9.47631 11.8047 9.08579 11.4142C8.69526 11.0237 8.69526 10.3905 9.08579 10L10 9.08579V5.91421L9.08579 5C8.69526 4.60948 8.69526 3.97631 9.08579 3.58579C9.47631 3.19526 10.1095 3.19526 10.5 3.58579L11.7071 4.79289Z" fill="currentColor"/>
                </svg>
              </button>
              <button class="room-action" id="voiceCall" title="Voice call">
                <svg width="16" height="16" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7.5 1C7.77614 1 8 1.22386 8 1.5V7.5C8 7.77614 7.77614 8 7.5 8C7.22386 8 7 7.77614 7 7.5V1.5C7 1.22386 7.22386 1 7.5 1ZM4.5 4C4.77614 4 5 4.22386 5 4.5V7.5C5 7.77614 4.77614 8 4.5 8C4.22386 8 4.2 7.77614 4.2 7.5V4.5C4.2 4.22386 4.22386 4 4.5 4ZM11 4.5C11 4.22386 10.7761 4 10.5 4C10.2239 4 10 4.22386 10 4.5V7.5C10 7.77614 10.2239 8 10.5 8C10.7761 8 11 7.77614 11 7.5V4.5ZM7.5 9C9.433 9 11 7.433 11 5.5V4.5C11 2.567 9.433 1 7.5 1C5.567 1 4 2.567 4 4.5V5.5C4 7.433 5.567 9 7.5 9ZM7.5 10C4.46243 10 2 7.53757 2 4.5V4C2 3.72386 2.22386 3.5 2.5 3.5C2.77614 3.5 3 3.72386 3 4V4.5C3 6.98528 5.01472 9 7.5 9C9.98528 9 12 6.98528 12 4.5V4C12 3.72386 12.2239 3.5 12.5 3.5C12.7761 3.5 13 3.72386 13 4V4.5C13 7.53757 10.5376 10 7.5 10ZM6 12.5C6 12.2239 6.22386 12 6.5 12H8.5C8.77614 12 9 12.2239 9 12.5C9 12.7761 8.77614 13 8.5 13H6.5C6.22386 13 6 12.7761 6 12.5Z" fill="currentColor"/>
                </svg>
              </button>
              <button class="room-action" id="threadsButton" title="Threads">
                <svg width="16" height="16" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8.69667 0.0403541C8.90859 0.131038 9.03106 0.354857 8.99316 0.582235L8.0902 6.00001H12.5C12.6893 6.00001 12.8625 6.10701 12.9472 6.27641C13.0319 6.4458 13.0136 6.6485 12.8999 6.80001L6.89997 14.8C6.76167 14.9844 6.51521 15.0503 6.30328 14.9597C6.09135 14.869 5.96888 14.6452 6.00678 14.4178L6.90974 9H2.49999C2.31061 9 2.13748 8.893 2.05278 8.72361C1.96809 8.55422 1.98636 8.35151 2.09999 8.2L8.09997 0.200038C8.23828 0.0156255 8.48474 -0.0503301 8.69667 0.0403541ZM3.49999 8.00001H7.49997C7.64695 8.00001 7.78648 8.06467 7.88148 8.17682C7.97648 8.28896 8.01733 8.43723 7.99317 8.5822L7.33027 12.5596L11.5 7.00001H7.49997C7.353 7.00001 7.21347 6.93534 7.11847 6.8232C7.02347 6.71105 6.98262 6.56279 7.00678 6.41781L7.66968 2.44042L3.49999 8.00001Z" fill="currentColor"/>
                </svg>
              </button>
              <button class="room-action" id="roomInfo" title="Room info">
                <svg width="16" height="16" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7.49991 0.877045C3.84222 0.877045 0.877075 3.84219 0.877075 7.49988C0.877075 11.1576 3.84222 14.1227 7.49991 14.1227C11.1576 14.1227 14.1227 11.1576 14.1227 7.49988C14.1227 3.84219 11.1576 0.877045 7.49991 0.877045ZM1.82708 7.49988C1.82708 4.36686 4.36689 1.82704 7.49991 1.82704C10.6329 1.82704 13.1727 4.36686 13.1727 7.49988C13.1727 10.6329 10.6329 13.1727 7.49991 13.1727C4.36689 13.1727 1.82708 10.6329 1.82708 7.49988ZM8.24992 4.49999C8.24992 4.9142 7.91413 5.24999 7.49992 5.24999C7.08571 5.24999 6.74992 4.9142 6.74992 4.49999C6.74992 4.08577 7.08571 3.74999 7.49992 3.74999C7.91413 3.74999 8.24992 4.08577 8.24992 4.49999ZM6.00003 5.99999H6.50003H7.50003C7.77617 5.99999 8.00003 6.22385 8.00003 6.49999V9.99999H8.50003H9.00003V11H8.50003H7.50003H6.50003H6.00003V9.99999H6.50003H7.00003V6.99999H6.50003H6.00003V5.99999Z" fill="currentColor"/>
                </svg>
              </button>
              <button class="room-action" id="peopleButton" title="People">
                <svg width="16" height="16" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7.5 0.875C5.49797 0.875 3.875 2.49797 3.875 4.5C3.875 6.50203 5.49797 8.125 7.5 8.125C9.50203 8.125 11.125 6.50203 11.125 4.5C11.125 2.49797 9.50203 0.875 7.5 0.875ZM4.825 4.5C4.825 3.02264 6.02264 1.825 7.5 1.825C8.97736 1.825 10.175 3.02264 10.175 4.5C10.175 5.97736 8.97736 7.175 7.5 7.175C6.02264 7.175 4.825 5.97736 4.825 4.5ZM2.5 14.125C2.5 11.9289 4.30393 10.125 6.5 10.125H8.5C10.6961 10.125 12.5 11.9289 12.5 14.125V14.875H11.5V14.125C11.5 12.4812 10.1438 11.125 8.5 11.125H6.5C4.85618 11.125 3.5 12.4812 3.5 14.125V14.875H2.5V14.125Z" fill="currentColor"/>
                </svg>
              </button>
            </div>
          </div>

          <div class="messages-container" id="messagesContainer">
            <div class="welcome-message">
              <div class="welcome-content">
                <h2>Welcome to Matrix</h2>
                <p>Select a room from the sidebar to start chatting</p>
              </div>
            </div>
          </div>

          <div class="message-input-container" id="messageInputContainer" style="display: none;">
            <div class="message-input">
              <input type="text" id="messageInput" placeholder="Type a message..." />
              <button id="sendButton" class="send-button">
                <span id="sendButtonIcon"></span>
              </button>
            </div>
          </div>
        </div>

        <!-- Right Panel (Members, Room info, etc.) -->
        <div class="right-panel" id="rightPanel" style="display: none;">
          <div id="rightPanelContent">
            <!-- Dynamic content will be loaded here -->
          </div>
        </div>
      </div>
    `;
  },

  // Get user initials for avatar
  getUserInitials() {
    if (this.currentUser) {
      const displayName = this.currentUser.displayname || this.currentUser.display_name;
      if (displayName) {
        const names = displayName.split(' ');
        if (names.length >= 2) {
          return (names[0].charAt(0) + names[1].charAt(0)).toUpperCase();
        } else {
          return displayName.substring(0, 2).toUpperCase();
        }
      } else {
        const username = this.currentUser.user_id;
        if (username && username.includes('@')) {
          return username.substring(1, 3).toUpperCase();
        } else {
          return username.substring(0, 2).toUpperCase();
        }
      }
    }
    return 'U';
  },

  // Setup event listeners for main view
  setupMainViewEventListeners() {
    // User avatar click menu
    const userAvatar = this.container.querySelector('#userAvatar');
    if (userAvatar) {
      userAvatar.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showUserMenu(e.currentTarget);
      });
    }

    // Space switching
    const spaceItems = this.container.querySelectorAll('.space-item');
    spaceItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const spaceId = e.currentTarget.dataset.space;
        this.switchSpace(spaceId);
      });
    });

    // Activity items
    const threadsActivity = this.container.querySelector('#threadsActivity');
    if (threadsActivity) {
      threadsActivity.addEventListener('click', () => {
        this.showThreadsActivity();
      });
    }

    const quickSettings = this.container.querySelector('#quickSettings');
    if (quickSettings) {
      quickSettings.addEventListener('click', () => {
        this.showQuickSettings();
      });
    }

    // Panel actions
    const exploreRooms = this.container.querySelector('#exploreRooms');
    if (exploreRooms) {
      exploreRooms.addEventListener('click', () => {
        this.exploreRooms();
      });
    }

    const addRoom = this.container.querySelector('#addRoom');
    if (addRoom) {
      addRoom.addEventListener('click', () => {
        this.showAddRoomMenu();
      });
    }

    const startChat = this.container.querySelector('#startChat');
    if (startChat) {
      startChat.addEventListener('click', () => {
        this.startNewChat();
      });
    }

    const addRoomToSpace = this.container.querySelector('#addRoomToSpace');
    if (addRoomToSpace) {
      addRoomToSpace.addEventListener('click', () => {
        this.showAddRoomToSpaceMenu();
      });
    }

    // Room actions
    const roomActions = ['videoCall', 'voiceCall', 'threadsButton', 'roomInfo', 'peopleButton'];
    roomActions.forEach(actionId => {
      const button = this.container.querySelector(`#${actionId}`);
      if (button) {
        button.addEventListener('click', () => {
          this.handleRoomAction(actionId);
        });
      }
    });

    // Message input
    const messageInput = this.container.querySelector('#messageInput');
    const sendButton = this.container.querySelector('#sendButton');

    if (messageInput) {
      messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });
    }

    if (sendButton) {
      sendButton.addEventListener('click', () => {
        this.sendMessage();
      });
    }
  },

  // Initialize Radix UI icons
  initializeIcons() {
    if (this.isDestroyed) {
      console.log('Component destroyed, skipping icon initialization');
      return;
    }

    if (!this.radixIcons) {
      console.warn('RadixIcons not available, using fallback icons');
      this.initializeFallbackIcons();
      return;
    }

    // Clear existing icons first to prevent duplication
    this.clearExistingIcons();

    // Activity Bar icons
    this.setIcon('#homeSpaceIcon', 'HomeIcon');
    this.setIcon('#createSpaceIcon', 'PlusIcon');
    this.setIcon('#threadsIcon', 'ChatBubbleIcon');
    this.setIcon('#settingsIcon', 'GearIcon');

    // Left Panel icons
    this.setIcon('#exploreIcon', 'MagnifyingGlassIcon');
    this.setIcon('#addRoomIcon', 'PlusIcon');
    this.setIcon('#searchIcon', 'MagnifyingGlassIcon');
    this.setIcon('#startChatIcon', 'PlusIcon');
    this.setIcon('#addRoomToSpaceIcon', 'PlusIcon');

    // Main Content icons
    this.setIcon('#sendButtonIcon', 'PaperPlaneIcon');
  },

  // Helper method to set icon safely
  setIcon(selector, iconName) {
    const element = this.container.querySelector(selector);
    if (element && this.radixIcons) {
      // Clear existing content
      element.innerHTML = '';
      // Add new icon
      const icon = this.radixIcons.createIcon(iconName);
      if (icon) {
        element.appendChild(icon);
      }
    }
  },

  // Clear existing icons to prevent duplication
  clearExistingIcons() {
    const iconSelectors = [
      '#homeSpaceIcon', '#createSpaceIcon', '#threadsIcon', '#settingsIcon',
      '#exploreIcon', '#addRoomIcon', '#searchIcon', '#startChatIcon',
      '#addRoomToSpaceIcon', '#sendButtonIcon'
    ];

    iconSelectors.forEach(selector => {
      const element = this.container.querySelector(selector);
      if (element) {
        element.innerHTML = '';
      }
    });
  },

  // Initialize fallback icons when RadixIcons is not available
  initializeFallbackIcons() {
    console.log('Initializing fallback icons');

    // Create a simple fallback icon system
    const createFallbackIcon = (iconType) => {
      const span = document.createElement('span');
      span.style.fontSize = '14px';
      span.style.display = 'inline-block';

      switch(iconType) {
        case 'home': span.textContent = '🏠'; break;
        case 'plus': span.textContent = '+'; break;
        case 'gear': span.textContent = '⚙️'; break;
        case 'search': span.textContent = '🔍'; break;
        case 'video': span.textContent = '📹'; break;
        case 'info': span.textContent = 'ℹ️'; break;
        case 'people': span.textContent = '👥'; break;
        case 'send': span.textContent = '➤'; break;
        case 'close': span.textContent = '✕'; break;
        default: span.textContent = '•'; break;
      }
      return span;
    };

    // Apply fallback icons
    const iconMappings = [
      { selector: '#homeSpaceIcon', type: 'home' },
      { selector: '#createSpaceIcon', type: 'plus' },
      { selector: '#settingsIcon', type: 'gear' },
      { selector: '#exploreIcon', type: 'search' },
      { selector: '#addRoomIcon', type: 'plus' },
      { selector: '#searchIcon', type: 'search' },
      { selector: '#startChatIcon', type: 'plus' },
      { selector: '#sendButtonIcon', type: 'send' }
    ];

    iconMappings.forEach(({ selector, type }) => {
      const element = this.container.querySelector(selector);
      if (element && !element.hasChildNodes()) {
        // Only add icon if element is empty to prevent duplicates
        element.appendChild(createFallbackIcon(type));
      }
    });
  },

  // Load component managers
  async loadComponentManagers() {
    if (this.isDestroyed) {
      console.log('Component destroyed, skipping manager loading');
      return;
    }

    const basePath = 'http://localhost:8000/extensions/ai-ide.matrix-client-plugin/ui-new/';

    try {
      // Load RoomManager
      await this.loadScript(basePath + 'components/rooms/RoomManager.js');

      // Load UserManager
      await this.loadScript(basePath + 'components/user/UserManager.js');

      // Initialize managers only if not destroyed
      if (!this.isDestroyed) {
        if (window.RoomManager) {
          this.roomManager = new window.RoomManager(this);
          console.log('RoomManager initialized successfully');
        } else {
          console.warn('RoomManager class not found after loading script');
        }

        if (window.UserManager) {
          this.userManager = new window.UserManager(this);
          console.log('UserManager initialized successfully');
        } else {
          console.warn('UserManager class not found after loading script');
        }

        console.log('Component managers loaded successfully');
      }
    } catch (error) {
      console.error('Failed to load component managers:', error);
      // Continue without managers - basic functionality will still work
    }
  },

  // Switch space
  switchSpace(spaceId) {
    console.log('Switching to space:', spaceId);

    this.currentSpace = spaceId;

    // Update active space indicator
    this.container.querySelectorAll('.space-item').forEach(item => {
      item.classList.remove('active');
    });

    const activeSpace = this.container.querySelector(`[data-space="${spaceId}"]`);
    if (activeSpace) {
      activeSpace.classList.add('active');
    }

    // Update space name in left panel
    const currentSpaceName = this.container.querySelector('#currentSpaceName');
    if (currentSpaceName) {
      if (spaceId === 'home') {
        currentSpaceName.textContent = 'Home';
      } else {
        const space = this.spaces.find(s => s.id === spaceId || s.room_id === spaceId);
        currentSpaceName.textContent = space ? (space.display_name || space.name || 'Space') : 'Space';
      }
    }

    // Filter and display rooms for this space
    if (this.roomManager) {
      this.roomManager.displayRoomsInSpace(this.rooms, spaceId);
    }
  },

  // Handle room actions
  handleRoomAction(actionId) {
    console.log('Room action:', actionId);

    switch (actionId) {
      case 'videoCall':
        this.startVideoCall();
        break;
      case 'voiceCall':
        this.startVoiceCall();
        break;
      case 'threadsButton':
        this.showThreads();
        break;
      case 'roomInfo':
        this.showRoomInfo();
        break;
      case 'peopleButton':
        if (this.roomManager) {
          this.roomManager.showRoomMembers();
        }
        break;
    }
  },

  // Show room info
  showRoomInfo() {
    console.log('Showing room info');

    if (!this.currentRoom) {
      console.warn('No current room selected');
      return;
    }

    const rightPanel = this.container.querySelector('#rightPanel');
    const rightPanelContent = this.container.querySelector('#rightPanelContent');

    if (!rightPanel || !rightPanelContent) return;

    // Show right panel
    rightPanel.style.display = 'flex';

    const currentRoomData = this.rooms.find(room => room.room_id === this.currentRoom);
    const roomName = currentRoomData ? (currentRoomData.display_name || currentRoomData.name || this.currentRoom) : this.currentRoom;
    const roomTopic = currentRoomData?.topic || 'No topic';
    const memberCount = currentRoomData?.member_count || 'Unknown';
    const roomType = currentRoomData ? (this.roomManager?.isDirectMessage(currentRoomData) ? 'Direct Message' : 'Room') : 'Unknown';

    rightPanelContent.innerHTML = `
      <div class="panel-header">
        <h3>Room Information</h3>
        <button class="close-button" id="closeRightPanel">
          <span id="closePanelIcon"></span>
        </button>
      </div>
      <div class="panel-body">
        <div class="room-info-panel">
          <div class="room-info-header">
            <div class="room-info-avatar">
              ${currentRoomData?.avatar_url ?
                `<img src="${this.convertMxcToHttp(currentRoomData.avatar_url)}" alt="${roomName}" class="avatar-image">` :
                `<span class="avatar-text">${roomName.substring(0, 2).toUpperCase()}</span>`
              }
            </div>
            <div class="room-info-details">
              <h3>${roomName}</h3>
              <p class="room-id">${this.currentRoom}</p>
            </div>
          </div>

          <div class="room-info-sections">
            <div class="info-section">
              <h4>About</h4>
              <div class="info-item">
                <span class="info-label">Topic:</span>
                <span class="info-value">${roomTopic}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Type:</span>
                <span class="info-value">${roomType}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Members:</span>
                <span class="info-value">${memberCount}</span>
              </div>
            </div>

            <div class="info-section">
              <h4>Room Settings</h4>
              <div class="info-item">
                <span class="info-label">Encryption:</span>
                <span class="info-value">${currentRoomData?.is_encrypted ? 'Enabled' : 'Disabled'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Join Rule:</span>
                <span class="info-value">${currentRoomData?.join_rules || 'Unknown'}</span>
              </div>
            </div>

            <div class="info-section">
              <h4>Actions</h4>
              <div class="room-actions-list">
                <button class="action-button secondary" id="inviteToRoom">
                  <span class="button-icon" id="inviteIcon"></span>
                  <span>Invite People</span>
                </button>
                <button class="action-button secondary" id="roomSettings">
                  <span class="button-icon" id="roomSettingsIcon"></span>
                  <span>Room Settings</span>
                </button>
                <button class="action-button danger" id="leaveRoom">
                  <span class="button-icon" id="leaveIcon"></span>
                  <span>Leave Room</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Initialize close icon
    setTimeout(() => {
      const closeIcon = rightPanelContent.querySelector('#closePanelIcon');
      const inviteIcon = rightPanelContent.querySelector('#inviteIcon');
      const roomSettingsIcon = rightPanelContent.querySelector('#roomSettingsIcon');
      const leaveIcon = rightPanelContent.querySelector('#leaveIcon');

      if (this.radixIcons) {
        if (closeIcon) closeIcon.appendChild(this.radixIcons.createIcon('Cross2Icon'));
        if (inviteIcon) inviteIcon.appendChild(this.radixIcons.createIcon('PersonIcon'));
        if (roomSettingsIcon) roomSettingsIcon.appendChild(this.radixIcons.createIcon('GearIcon'));
        if (leaveIcon) leaveIcon.appendChild(this.radixIcons.createIcon('ExitIcon'));
      } else {
        if (closeIcon) closeIcon.textContent = '✕';
        if (inviteIcon) inviteIcon.textContent = '👤';
        if (roomSettingsIcon) roomSettingsIcon.textContent = '⚙️';
        if (leaveIcon) leaveIcon.textContent = '🚪';
      }
    }, 0);

    // Add event listeners
    rightPanelContent.querySelector('#closeRightPanel').addEventListener('click', () => {
      rightPanel.style.display = 'none';
    });

    rightPanelContent.querySelector('#inviteToRoom').addEventListener('click', () => {
      this.showInviteDialog();
    });

    rightPanelContent.querySelector('#roomSettings').addEventListener('click', () => {
      this.showRoomSettings();
    });

    rightPanelContent.querySelector('#leaveRoom').addEventListener('click', () => {
      this.confirmLeaveRoom();
    });
  },

  // Send message
  async sendMessage() {
    const messageInput = this.container.querySelector('#messageInput');
    if (!messageInput || !this.currentRoom) return;

    const message = messageInput.value.trim();
    if (!message) return;

    try {
      const response = await this.apiClient.sendMessage(this.currentRoom, message);
      if (response.success) {
        messageInput.value = '';
        // Reload messages to show the new message
        if (this.roomManager) {
          this.roomManager.loadRoomMessages(this.currentRoom);
        }
      } else {
        throw new Error(response.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      if (this.userManager) {
        this.userManager.showError('Failed to send message: ' + error.message);
      }
    }
  },

  // Start video call
  startVideoCall() {
    console.log('Starting video call');
    if (this.userManager) {
      this.userManager.showError('Video calls are not yet implemented');
    }
  },

  // Start voice call
  startVoiceCall() {
    console.log('Starting voice call');
    if (this.userManager) {
      this.userManager.showError('Voice calls are not yet implemented');
    }
  },

  // Show threads
  showThreads() {
    console.log('Showing threads');
    if (this.userManager) {
      this.userManager.showError('Threads are not yet implemented');
    }
  },

  // Show threads activity
  showThreadsActivity() {
    console.log('Showing threads activity');
    if (this.userManager) {
      this.userManager.showError('Threads activity is not yet implemented');
    }
  },

  // Show quick settings
  showQuickSettings() {
    if (this.userManager) {
      this.userManager.showQuickSettings();
    }
  },

  // Explore rooms
  exploreRooms() {
    console.log('Exploring rooms');
    if (this.userManager) {
      this.userManager.showError('Room exploration is not yet implemented');
    }
  },

  // Show add room menu
  showAddRoomMenu() {
    console.log('Showing add room menu');
    if (this.userManager) {
      this.userManager.showError('Add room menu is not yet implemented');
    }
  },

  // Start new chat
  startNewChat() {
    console.log('Starting new chat');
    if (this.userManager) {
      this.userManager.showError('Start new chat is not yet implemented');
    }
  },

  // Show add room to space menu
  showAddRoomToSpaceMenu() {
    console.log('Showing add room to space menu');
    if (this.userManager) {
      this.userManager.showError('Add room to space is not yet implemented');
    }
  },

  // Show invite dialog
  showInviteDialog() {
    console.log('Showing invite dialog');
    if (this.userManager) {
      this.userManager.showError('Invite dialog is not yet implemented');
    }
  },

  // Show room settings
  showRoomSettings() {
    console.log('Showing room settings');
    if (this.userManager) {
      this.userManager.showError('Room settings are not yet implemented');
    }
  },

  // Confirm leave room
  confirmLeaveRoom() {
    console.log('Confirming leave room');
    if (this.userManager) {
      this.userManager.showError('Leave room is not yet implemented');
    }
  },

  // Show user menu
  showUserMenu(avatarElement) {
    if (this.userManager) {
      this.userManager.showUserMenu(avatarElement);
    }
  },

  // Cleanup and destroy
  async destroy() {
    console.log('MatrixClientMain.destroy called');

    // Prevent multiple destroy calls
    if (this.isDestroyed) {
      console.log('MatrixClientMain already destroyed, skipping');
      return;
    }

    // Mark as destroyed immediately to prevent further operations
    this.isDestroyed = true;
    this.isInitialized = false;

    try {
      // Clear global reference
      if (window.MatrixClientMainInstance === this) {
        window.MatrixClientMainInstance = null;
      }

      // Logout from API if authenticated
      if (this.apiClient && this.apiClient.isAuthenticated) {
        try {
          await this.apiClient.logout();
        } catch (error) {
          console.warn('Logout failed during destroy:', error);
        }
      }

      // Clear event listeners
      if (this.eventBus) {
        this.eventBus.removeAllListeners();
      }

      // Clear DOM
      if (this.container) {
        this.container.innerHTML = '';
      }

      // Clear references
      this.container = null;
      this.apiClient = null;
      this.eventBus = null;
      this.radixIcons = null;
      this.roomManager = null;
      this.userManager = null;
      this.currentUser = null;
      this.rooms = [];
      this.spaces = [];
      this.currentRoom = null;
      this.currentSpace = null;

      console.log('MatrixClientMain destroyed successfully');
    } catch (error) {
      console.error('Error during MatrixClientMain destroy:', error);
    }
  },

  // Render method required by plugin system
  render(props = {}) {
    console.log('MatrixClientMain.render called with props:', props);

    // Return initial loading HTML - the actual UI will be rendered in onMount
    return `
      <div id="matrix-client-loading" style="
        width: 100%;
        height: 100vh;
        background: #1e1e1e;
        color: #ffffff;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
      ">
        <div style="
          text-align: center;
          max-width: 400px;
        ">
          <div style="
            width: 48px;
            height: 48px;
            border: 3px solid #404040;
            border-top: 3px solid #007acc;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 24px;
          "></div>
          <h2 style="margin-bottom: 16px; color: #ffffff;">Loading Matrix Client</h2>
          <p style="color: #cccccc; margin-bottom: 8px;">Initializing secure messaging...</p>
          <p style="color: #888888; font-size: 14px;">Please wait while we set up your Matrix client</p>
        </div>

        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </div>
    `;
  },

  // Plugin lifecycle methods
  onMount(container, props = {}) {
    console.log('MatrixClientMain.onMount called');

    // Ensure we have a valid container
    if (!container) {
      console.error('onMount called with null container');
      return Promise.reject(new Error('Container is required'));
    }

    // Prevent multiple mounts on the same instance
    if (this.isInitialized && this.container === container) {
      console.log('Component already mounted on this container, skipping');
      return Promise.resolve();
    }

    return this.init(container, props).then(() => {
      // Load component managers after basic initialization
      return this.loadComponentManagers();
    }).then(() => {
      // Update UI after everything is loaded
      if (!this.isDestroyed) {
        this.updateUI();
      }
    }).catch(error => {
      console.error('Failed to mount MatrixClientMain:', error);
      if (!this.isDestroyed) {
        this.showError('Failed to initialize Matrix Client: ' + error.message);
      }
    });
  },

  onUnmount(container, props = {}) {
    console.log('MatrixClientMain.onUnmount called - starting cleanup');

    // Call destroy synchronously to ensure proper cleanup
    return this.destroy().catch(error => {
      console.error('Error during unmount cleanup:', error);
    });
  }
};

// Global instance management to prevent multiple instances
if (typeof window !== 'undefined') {
  // Clean up existing instance if it exists and is different
  if (window.MatrixClientMainInstance &&
      window.MatrixClientMainInstance !== MatrixClientMain &&
      typeof window.MatrixClientMainInstance.destroy === 'function') {
    console.log('Destroying existing MatrixClientMain instance');
    try {
      // Call destroy but don't await it in global scope
      window.MatrixClientMainInstance.destroy().catch(error => {
        console.error('Error destroying existing instance:', error);
      });
    } catch (error) {
      console.error('Error destroying existing instance:', error);
    }
  }

  // Export for use in other modules
  window.MatrixClientMain = MatrixClientMain;
  window.MatrixClientMainInstance = MatrixClientMain;
}
