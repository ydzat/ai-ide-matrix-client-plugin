// Matrix Client Plugin UI Component - Element-style Interface
// This component provides a Matrix/Element-like interface for the AI IDE

// 国际化支持
const i18n = {
  zh: {
    'login.title': '登录到 Matrix',
    'login.homeserver': '主服务器',
    'login.username': '用户名',
    'login.password': '密码',
    'login.signin': '登录',
    'login.signing_in': '登录中...',
    'login.back': '返回',
    'login.forgot_password': '忘记密码？',
    'login.reset_password': '重置密码',
    'login.no_account': '没有账户？',
    'login.create_account': '创建账户',
    'menu.settings': '设置',
    'menu.notifications': '通知',
    'menu.privacy': '隐私安全',
    'menu.all_settings': '所有设置',
    'menu.feedback': '反馈',
    'menu.logout': '注销',
    'menu.link_device': '链接新设备',
    'rooms.text_channels': '文字频道',
    'rooms.voice_channels': '语音频道',
    'rooms.recent': '最近',
    'members.online': '在线',
    'members.offline': '离线',
    'members.no_members': '暂无成员',
    'chat.start_conversation': '开始对话！',
    'chat.no_messages': '暂无消息。开始对话吧！',
    'chat.message_placeholder': '发送消息到',
    'welcome.title': '欢迎使用 Matrix 客户端',
    'welcome.description': '安全、去中心化的通信平台',
    'welcome.start_chat': '开始聊天',
    'welcome.explore_rooms': '探索公共房间',
    'actions.start_chat': '开始聊天',
    'actions.explore_rooms': '探索公共房间',
    'actions.create_room': '创建房间',
    'rooms.no_rooms': '暂无房间'
  },
  en: {
    'login.title': 'Sign in to Matrix',
    'login.homeserver': 'Homeserver',
    'login.username': 'Username',
    'login.password': 'Password',
    'login.signin': 'Sign In',
    'login.signing_in': 'Signing in...',
    'login.back': 'Back',
    'login.forgot_password': 'Forgot password?',
    'login.reset_password': 'Reset it',
    'login.no_account': "Don't have an account?",
    'login.create_account': 'Create one',
    'menu.settings': 'Settings',
    'menu.notifications': 'Notifications',
    'menu.privacy': 'Privacy & Security',
    'menu.all_settings': 'All Settings',
    'menu.feedback': 'Feedback',
    'menu.logout': 'Logout',
    'menu.link_device': 'Link new device',
    'rooms.text_channels': 'TEXT CHANNELS',
    'rooms.voice_channels': 'VOICE CHANNELS',
    'rooms.recent': 'RECENT',
    'members.online': 'ONLINE',
    'members.offline': 'OFFLINE',
    'members.no_members': 'No members',
    'chat.start_conversation': 'Start the conversation!',
    'chat.no_messages': 'No messages yet. Start the conversation!',
    'chat.message_placeholder': 'Message',
    'welcome.title': 'Welcome to Matrix Client',
    'welcome.description': 'Secure, decentralized communication',
    'welcome.start_chat': 'Start a chat',
    'welcome.explore_rooms': 'Explore public rooms',
    'actions.start_chat': 'Start a chat',
    'actions.explore_rooms': 'Explore public rooms',
    'actions.create_room': 'Create a room',
    'rooms.no_rooms': 'No rooms yet'
  }
};

const MatrixClientMain = {
  name: 'MatrixClientMain',
  version: '0.3.0',

  // 当前语言设置
  currentLanguage: 'zh', // 默认中文

  // 国际化辅助函数
  t: function(key, params = {}) {
    const lang = this.currentLanguage;
    const text = i18n[lang] && i18n[lang][key] ? i18n[lang][key] : (i18n.en[key] || key);

    // 简单的参数替换
    return text.replace(/\{\{(\w+)\}\}/g, (match, param) => {
      return params[param] || match;
    });
  },

  // 设置语言
  setLanguage: function(lang) {
    if (i18n[lang]) {
      this.currentLanguage = lang;
      this.render(); // 重新渲染界面
    }
  },
  
  // Component state
  state: {
    // Authentication state
    isLoggedIn: false,
    loginStep: 'server', // 'server', 'credentials', 'loading'
    homeserver: '',
    username: '',
    password: '',
    
    // Connection state
    connected: false,
    connecting: false,
    
    // User state
    user: null,
    avatar: null,
    
    // Space state
    selectedSpace: null,
    spaces: [], // User's joined spaces
    homeserver: null, // User's homeserver domain
    
    // Room state
    rooms: [],
    directMessages: [], // Direct message rooms
    allMembers: [], // 服务器中的所有成员
    
    // UI state
    currentView: 'login', // 'login', 'main'
    selectedSidebar: 'home', // 'home', 'space-{spaceId}'
    selectedTab: 'people', // 'people', 'rooms'
    selectedRoom: null,
    showRoomList: true,
    showMemberList: true,
    showUserMenu: false, // 用户头像菜单显示状态
  },

  // Main render method
  render: function(props) {
    const { extension } = props;
    
    if (this.state.currentView === 'login') {
      return this.renderLoginScreen();
    }
    
    return `
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .message-group:hover .message-actions {
          display: flex !important;
        }
        .message-group:hover .message-timestamp {
          opacity: 1 !important;
        }
        .matrix-ui a {
          color: #4a9eff;
          text-decoration: none;
        }
        .matrix-ui a:hover {
          text-decoration: underline;
        }
        .matrix-ui code {
          background-color: #3c3c3c;
          padding: 2px 4px;
          border-radius: 3px;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 13px;
        }
        .matrix-ui pre {
          background-color: #2a2a2a;
          border: 1px solid #3a3a3a;
          border-radius: 6px;
          padding: 12px;
          overflow-x: auto;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 13px;
          margin: 8px 0;
        }
        .matrix-ui blockquote {
          border-left: 3px solid #4a9eff;
          margin: 8px 0;
          padding-left: 12px;
          color: #ccc;
          font-style: italic;
        }
      </style>
      <div id="matrix-client-container" class="matrix-ui" style="
        display: flex;
        height: 100%;
        background-color: #1e1e1e;
        color: #ffffff;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <!-- Activity Bar (Left Side Icons) -->
        ${this.renderActivityBar()}

        <!-- Middle Panel: Room/Space Navigation -->
        ${this.renderMiddlePanel()}

        <!-- Main Content Area -->
        <div id="matrix-main-content" style="
          flex: 1;
          display: flex;
          flex-direction: column;
          background-color: #1e1e1e;
        ">
          ${this.state.selectedRoom ? this.renderChatArea() : this.renderWelcomeScreen()}
        </div>


      </div>
    `;
  },

  // Render login screen
  renderLoginScreen: function() {
    return `
      <div id="matrix-login-container" style="
        display: flex;
        height: 100%;
        background-color: #1e1e1e;
        color: #ffffff;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <!-- Matrix Activity Bar (left side icons) -->
        <div style="
          width: 60px;
          background-color: #252526;
          border-right: 1px solid #3e3e42;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 16px 0;
        ">
          <div style="
            width: 36px;
            height: 36px;
            background: linear-gradient(135deg, #0dbd8b, #17a2b8);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 18px;
            margin-bottom: 16px;
          ">M</div>
        </div>

        <!-- Login Panel -->
        <div style="
          width: 400px;
          background-color: #252526;
          border-right: 1px solid #3e3e42;
          display: flex;
          flex-direction: column;
          padding: 32px;
        ">
          ${this.renderLoginForm()}
        </div>

        <!-- Welcome Area -->
        <div style="
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background-color: #1e1e1e;
        ">
          <div style="
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #0dbd8b, #17a2b8);
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 36px;
            margin-bottom: 24px;
          ">M</div>
          <h1 style="
            font-size: 32px;
            font-weight: 600;
            margin: 0 0 16px 0;
            color: #ffffff;
          ">${this.t('welcome.title')}</h1>
          <p style="
            font-size: 16px;
            color: #888888;
            text-align: center;
            max-width: 400px;
            line-height: 1.5;
            margin: 0;
          ">${this.t('welcome.description')}</p>
        </div>
      </div>
    `;
  },

  // Render login form
  renderLoginForm: function() {
    const step = this.state.loginStep;
    
    if (step === 'server') {
      return `
        <div>
          <div style="
            width: 48px;
            height: 48px;
            background: linear-gradient(135deg, #0dbd8b, #17a2b8);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 24px;
            margin-bottom: 24px;
          ">M</div>
          
          <h2 style="
            font-size: 24px;
            font-weight: 600;
            margin: 0 0 8px 0;
            color: #ffffff;
          ">${this.t('login.title')}</h2>
          
          <p style="
            font-size: 14px;
            color: #888888;
            margin: 0 0 32px 0;
            line-height: 1.4;
          ">Choose your Matrix homeserver to get started.</p>

          <div style="margin-bottom: 24px;">
            <label style="
              display: block;
              font-size: 14px;
              font-weight: 500;
              margin-bottom: 8px;
              color: #cccccc;
            ">${this.t('login.homeserver')}</label>
            <input 
              type="text" 
              id="homeserver-input"
              value="${this.state.homeserver}"
              placeholder="https://matrix.org"
              style="
                width: 100%;
                padding: 12px;
                background-color: #3c3c3c;
                border: 1px solid #555555;
                border-radius: 6px;
                color: #ffffff;
                font-size: 14px;
                box-sizing: border-box;
              "
            />
          </div>

          <button
            id="continue-btn"
            style="
              width: 100%;
              padding: 12px;
              background-color: #0dbd8b;
              color: white;
              border: none;
              border-radius: 6px;
              font-size: 14px;
              font-weight: 600;
              cursor: pointer;
              margin-bottom: 16px;
            "
          >Continue</button>

          <div style="
            text-align: center;
            font-size: 12px;
            color: #888888;
          ">
            Don't have an account? 
            <a href="#" style="color: #0dbd8b; text-decoration: none;">Create one</a>
          </div>
        </div>
      `;
    }
    
    if (step === 'credentials') {
      return `
        <div>
          <button
            id="back-btn"
            style="
              background: none;
              border: none;
              color: #888888;
              font-size: 14px;
              cursor: pointer;
              margin-bottom: 16px;
              padding: 4px 0;
            "
          >← Back</button>
          
          <div style="
            width: 48px;
            height: 48px;
            background: linear-gradient(135deg, #0dbd8b, #17a2b8);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 24px;
            margin-bottom: 24px;
          ">M</div>
          
          <h2 style="
            font-size: 24px;
            font-weight: 600;
            margin: 0 0 8px 0;
            color: #ffffff;
          ">Sign in</h2>
          
          <p style="
            font-size: 14px;
            color: #888888;
            margin: 0 0 32px 0;
            line-height: 1.4;
          ">Enter your Matrix credentials for ${this.state.homeserver}</p>

          <div style="margin-bottom: 16px;">
            <label style="
              display: block;
              font-size: 14px;
              font-weight: 500;
              margin-bottom: 8px;
              color: #cccccc;
            ">Username</label>
            <input 
              type="text" 
              id="username-input"
              value="${this.state.username}"
              placeholder="@username:matrix.org"
              style="
                width: 100%;
                padding: 12px;
                background-color: #3c3c3c;
                border: 1px solid #555555;
                border-radius: 6px;
                color: #ffffff;
                font-size: 14px;
                box-sizing: border-box;
              "
            />
          </div>

          <div style="margin-bottom: 24px;">
            <label style="
              display: block;
              font-size: 14px;
              font-weight: 500;
              margin-bottom: 8px;
              color: #cccccc;
            ">Password</label>
            <input 
              type="password" 
              id="password-input"
              value="${this.state.password}"
              placeholder="Password"
              style="
                width: 100%;
                padding: 12px;
                background-color: #3c3c3c;
                border: 1px solid #555555;
                border-radius: 6px;
                color: #ffffff;
                font-size: 14px;
                box-sizing: border-box;
              "
            />
          </div>

          <button
            id="login-btn"
            style="
              width: 100%;
              padding: 12px;
              background-color: #0dbd8b;
              color: white;
              border: none;
              border-radius: 6px;
              font-size: 14px;
              font-weight: 600;
              cursor: pointer;
              margin-bottom: 16px;
            "
            ${this.state.connecting ? 'disabled' : ''}
          >${this.state.connecting ? this.t('login.signing_in') : this.t('login.signin')}</button>

          <div style="
            text-align: center;
            font-size: 12px;
            color: #888888;
          ">
            Forgot password? 
            <a href="#" style="color: #0dbd8b; text-decoration: none;">Reset it</a>
          </div>
        </div>
      `;
    }
    
    return '';
  },

  // Render activity bar (left side icons like Element)
  renderActivityBar: function() {
    console.log('Rendering ActivityBar with user:', this.state.user);
    return `
      <div style="
        width: 68px;
        background-color: #181818;
        border-right: 1px solid #3a3a3a;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 12px 0;
        gap: 8px;
      ">
        <!-- User Avatar with Menu -->
        <div style="position: relative;">
          <div id="user-avatar" style="
            width: 48px;
            height: 48px;
            border-radius: 12px;
            ${!this.state.user?.avatar ? 'background: #4a9eff;' : ''}
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.2s;
            overflow: hidden;
            ${this.state.showUserMenu ? 'border-radius: 16px;' : ''}
          " onmouseover="this.style.borderRadius='16px'" onmouseout="this.style.borderRadius='12px'">
            ${this.state.user?.avatar ?
              this.createAuthenticatedImage(
                this.state.user.avatar,
                (this.state.user?.displayName?.[0] || 'U').toUpperCase(),
                '',
                'width: 100%; height: 100%; object-fit: cover; border-radius: 12px;'
              ) :
              (this.state.user?.displayName?.[0] || 'U').toUpperCase()
            }
          </div>

          <!-- User Menu -->
          ${this.state.showUserMenu ? `
            <div id="user-menu" style="
              position: absolute;
              top: 52px;
              left: 0;
              width: 280px;
              background-color: #2d2d30;
              border: 1px solid #3e3e42;
              border-radius: 8px;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
              z-index: 1000;
              padding: 8px 0;
            ">
              <!-- User Info Header -->
              <div style="
                padding: 12px 16px;
                border-bottom: 1px solid #3e3e42;
                margin-bottom: 8px;
              ">
                <div style="
                  font-size: 16px;
                  font-weight: 600;
                  color: #ffffff;
                  margin-bottom: 4px;
                ">${this.state.user?.displayName || 'User'}</div>
                <div style="
                  font-size: 12px;
                  color: #888888;
                ">${this.state.user?.id || ''}</div>
              </div>

              <!-- Menu Items -->
              <div class="menu-item" style="
                padding: 8px 16px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 12px;
                color: #cccccc;
                font-size: 14px;
              " onmouseover="this.style.backgroundColor='rgba(255,255,255,0.05)'"
                 onmouseout="this.style.backgroundColor='transparent'"
                 onclick="MatrixClientMain.showAllSettings()">
                ⚙️ All settings
              </div>

              <div style="
                height: 1px;
                background-color: #3e3e42;
                margin: 8px 0;
              "></div>

              <!-- Logout -->
              <div class="menu-item" style="
                padding: 8px 16px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 12px;
                color: #ff4444;
                font-size: 14px;
              " onmouseover="this.style.backgroundColor='rgba(255,68,68,0.1)'"
                 onmouseout="this.style.backgroundColor='transparent'"
                 onclick="MatrixClientMain.logout()">
                🚪 Sign out
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Home Icon -->
        <div style="
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: #2a2a2a;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
          ${this.state.selectedSidebar === 'home' ? 'border-radius: 16px; background: #4a9eff;' : ''}
        " onclick="MatrixClientMain.selectSidebar('home')"
           onmouseover="this.style.borderRadius='16px'; if('${this.state.selectedSidebar}' !== 'home') this.style.background='#3a3a3a'"
           onmouseout="this.style.borderRadius='12px'; if('${this.state.selectedSidebar}' !== 'home') this.style.background='#2a2a2a'">
          ${this.state.selectedSidebar === 'home' ? `
            <div style="
              position: absolute;
              left: -4px;
              top: 50%;
              transform: translateY(-50%);
              width: 4px;
              height: 20px;
              background: #ffffff;
              border-radius: 0 2px 2px 0;
            "></div>
          ` : ''}
          <div style="
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: ${this.state.selectedSidebar === 'home' ? '#ffffff' : '#2a2a2a'};
            border: 2px solid #4a4a4a;
            display: flex;
            align-items: center;
            justify-content: center;
            color: ${this.state.selectedSidebar === 'home' ? '#4a9eff' : '#ffffff'};
            font-size: 16px;
          ">
            <svg width="16" height="16" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7.07926 0.222253C7.31275 -0.007434 7.6873 -0.007434 7.92079 0.222253L14.6708 6.86227C14.907 7.09465 14.9101 7.47453 14.6778 7.71076C14.4454 7.947 14.0655 7.95012 13.8293 7.71773L13 6.90201V12.5C13 12.7761 12.7762 13 12.5 13H2.50002C2.22388 13 2.00002 12.7761 2.00002 12.5V6.90201L1.17079 7.71773C0.934558 7.95012 0.554672 7.947 0.32229 7.71076C0.0899079 7.47453 0.0930283 7.09465 0.32926 6.86227L7.07926 0.222253ZM7.50002 1.49163L12 5.91831V12H10V8.49999C10 8.22385 9.77617 7.99999 9.50002 7.99999H6.50002C6.22388 7.99999 6.00002 8.22385 6.00002 8.49999V12H3.00002V5.91831L7.50002 1.49163ZM7.00002 12H9.00002V8.99999H7.00002V12Z" fill="currentColor"/>
            </svg>
          </div>
        </div>

        <!-- Spaces -->
        ${this.state.spaces.map((space, index) => `
          <div style="
            width: 48px;
            height: 48px;
            border-radius: 12px;
            background: #2a2a2a;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s;
            position: relative;
            ${this.state.selectedSidebar === 'space-' + space.id ? 'border-radius: 16px; background: #4a9eff;' : ''}
          " onclick="MatrixClientMain.selectSidebar('space-${space.id}')"
             onmouseover="this.style.borderRadius='16px'; if('${this.state.selectedSidebar}' !== 'space-${space.id}') this.style.background='#3a3a3a'"
             onmouseout="this.style.borderRadius='12px'; if('${this.state.selectedSidebar}' !== 'space-${space.id}') this.style.background='#2a2a2a'">
            ${this.state.selectedSidebar === 'space-' + space.id ? `
              <div style="
                position: absolute;
                left: -4px;
                top: 50%;
                transform: translateY(-50%);
                width: 4px;
                height: 20px;
                background: #ffffff;
                border-radius: 0 2px 2px 0;
              "></div>
            ` : ''}
            <div style="
              width: 32px;
              height: 32px;
              border-radius: 50%;
              background: ${space.avatar ? `url(${this.getMediaUrl(space.avatar)})` : '#4a9eff'};
              background-size: cover;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              font-size: 14px;
              color: white;
            ">${space.avatar ? '' : (space.name?.[0] || 'S')}</div>
          </div>
        `).join('')}

      </div>
    `;
  },

  // Render middle panel (rooms/spaces content)
  renderMiddlePanel: function() {
    if (this.state.selectedSidebar === 'home') {
      return this.renderHomePanel();
    } else if (this.state.selectedSidebar.startsWith('space-')) {
      const spaceId = this.state.selectedSidebar.replace('space-', '');
      return this.renderSpacePanel(spaceId);
    }

    return this.renderHomePanel();
  },

  // Render home panel (main homeserver view)
  renderHomePanel: function() {
    return `
      <div style="
        width: 280px;
        background-color: #2a2a2a;
        border-right: 1px solid #3a3a3a;
        display: flex;
        flex-direction: column;
      ">
        <!-- Header -->
        <div style="
          padding: 16px;
          border-bottom: 1px solid #3a3a3a;
          display: flex;
          align-items: center;
          justify-content: space-between;
        ">
          <div style="
            font-weight: 600;
            font-size: 16px;
          ">Home</div>
          <div style="
            display: flex;
            gap: 8px;
          ">

          </div>
        </div>

        <!-- Content -->
        <div style="
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        ">
          <!-- Quick Actions -->
          <div style="
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-bottom: 24px;
          ">
            <button style="
              padding: 12px 16px;
              background: #4a9eff;
              border: none;
              border-radius: 8px;
              color: #ffffff;
              cursor: pointer;
              font-size: 14px;
              font-weight: 500;
              transition: background-color 0.2s;
            " onmouseover="this.style.background='#3a8eef'"
               onmouseout="this.style.background='#4a9eff'"
               onclick="MatrixClientMain.startDirectMessage()">
              <svg width="16" height="16" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right: 8px;">
                <path d="M12.5 3L2.5 3.00002C1.83333 3.00002 1.33333 3.50002 1.33333 4.16669V9.83335C1.33333 10.5 1.83333 11 2.5 11H12.5C13.1667 11 13.6667 10.5 13.6667 9.83335V4.16669C13.6667 3.50002 13.1667 3 12.5 3ZM12.5 4.16669V5.45002L7.5 8.00002L2.5 5.45002V4.16669H12.5ZM2.5 6.55002L7.5 9.10002L12.5 6.55002V9.83335H2.5V6.55002Z" fill="currentColor"/>
              </svg>
              Start a chat
            </button>
            <button style="
              padding: 12px 16px;
              background: #3a3a3a;
              border: none;
              border-radius: 8px;
              color: #ffffff;
              cursor: pointer;
              font-size: 14px;
              font-weight: 500;
              transition: background-color 0.2s;
            " onmouseover="this.style.background='#4a4a4a'"
               onmouseout="this.style.background='#3a3a3a'"
               onclick="MatrixClientMain.exploreRooms()">
              <svg width="16" height="16" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right: 8px;">
                <path d="M7.5 1.04999C4.24321 1.04999 1.60001 3.69318 1.60001 6.95C1.60001 10.2068 4.24321 12.85 7.5 12.85C10.7568 12.85 13.4 10.2068 13.4 6.95C13.4 3.69318 10.7568 1.04999 7.5 1.04999ZM0.849976 6.95C0.849976 3.27879 3.82876 0.299988 7.5 0.299988C11.1712 0.299988 14.15 3.27879 14.15 6.95C14.15 10.6212 11.1712 13.6 7.5 13.6C3.82876 13.6 0.849976 10.6212 0.849976 6.95Z" fill="currentColor"/>
                <path d="M7.5 4.04999C6.81353 4.04999 6.25001 4.61351 6.25001 5.3C6.25001 5.98648 6.81353 6.55 7.5 6.55C8.18648 6.55 8.75001 5.98648 8.75001 5.3C8.75001 4.61351 8.18648 4.04999 7.5 4.04999Z" fill="currentColor"/>
                <path d="M6.05001 8.65C6.05001 8.23579 6.38579 7.9 6.80001 7.9H8.20001C8.61422 7.9 8.95001 8.23579 8.95001 8.65V9.25C8.95001 9.66421 8.61422 10 8.20001 10H6.80001C6.38579 10 6.05001 9.66421 6.05001 9.25V8.65Z" fill="currentColor"/>
              </svg>
              Explore public rooms
            </button>
            <button style="
              padding: 12px 16px;
              background: #3a3a3a;
              border: none;
              border-radius: 8px;
              color: #ffffff;
              cursor: pointer;
              font-size: 14px;
              font-weight: 500;
              transition: background-color 0.2s;
            " onmouseover="this.style.background='#4a4a4a'"
               onmouseout="this.style.background='#3a3a3a'"
               onclick="MatrixClientMain.createRoom()">
              <svg width="16" height="16" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right: 8px;">
                <path d="M8 2.75C8 2.47386 7.77614 2.25 7.5 2.25C7.22386 2.25 7 2.47386 7 2.75V7H2.75C2.47386 7 2.25 7.22386 2.25 7.5C2.25 7.77614 2.47386 8 2.75 8H7V12.25C7 12.5261 7.22386 12.75 7.5 12.75C7.77614 12.75 8 12.5261 8 12.25V8H12.25C12.5261 8 12.75 7.77614 12.75 7.5C12.75 7.22386 12.5261 7 12.25 7H8V2.75Z" fill="currentColor"/>
              </svg>
              Create a room
            </button>
          </div>

          <!-- Tab Navigation -->
          <div style="
            display: flex;
            margin: 16px 0 8px 0;
            border-bottom: 1px solid #3a3a3a;
          ">
            <div style="
              flex: 1;
              padding: 8px 16px;
              font-size: 14px;
              font-weight: 500;
              color: ${this.state.selectedTab === 'people' ? '#ffffff' : '#888'};
              border-bottom: 2px solid ${this.state.selectedTab === 'people' ? '#4a9eff' : 'transparent'};
              cursor: pointer;
              text-align: center;
              transition: all 0.2s;
            " onclick="MatrixClientMain.selectTab('people')"
               onmouseover="if('${this.state.selectedTab}' !== 'people') this.style.color='#cccccc'"
               onmouseout="if('${this.state.selectedTab}' !== 'people') this.style.color='#888'">
              People
            </div>
            <div style="
              flex: 1;
              padding: 8px 16px;
              font-size: 14px;
              font-weight: 500;
              color: ${this.state.selectedTab === 'rooms' ? '#ffffff' : '#888'};
              border-bottom: 2px solid ${this.state.selectedTab === 'rooms' ? '#4a9eff' : 'transparent'};
              cursor: pointer;
              text-align: center;
              transition: all 0.2s;
            " onclick="MatrixClientMain.selectTab('rooms')"
               onmouseover="if('${this.state.selectedTab}' !== 'rooms') this.style.color='#cccccc'"
               onmouseout="if('${this.state.selectedTab}' !== 'rooms') this.style.color='#888'">
              Rooms
            </div>
          </div>

          <!-- Content based on selected tab -->
          ${this.state.selectedTab === 'people' ? this.renderPeopleContent() : this.renderRoomsContent()}
        </div>
      </div>
    `;
  },

  sortMembersByStatus: function(members) {
    const currentUserId = this.state.user?.id;

    // 分类成员
    const onlineAdmins = [];
    const currentUser = [];
    const onlineMembers = [];
    const offlineAdmins = [];
    const offlineMembers = [];

    members.forEach(member => {
      const isOnline = member.presence === 'online';
      const isAdmin = member.powerLevel >= 50; // Matrix中50及以上通常是管理员权限
      const isCurrentUser = member.userId === currentUserId;

      if (isCurrentUser) {
        currentUser.push(member);
      } else if (isOnline && isAdmin) {
        onlineAdmins.push(member);
      } else if (isOnline && !isAdmin) {
        onlineMembers.push(member);
      } else if (!isOnline && isAdmin) {
        offlineAdmins.push(member);
      } else {
        offlineMembers.push(member);
      }
    });

    // 按字母顺序排序每个分组
    const sortByName = (a, b) => (a.displayName || a.userId).localeCompare(b.displayName || b.userId);
    onlineAdmins.sort(sortByName);
    onlineMembers.sort(sortByName);
    offlineAdmins.sort(sortByName);
    offlineMembers.sort(sortByName);

    // 合并所有分组
    return [...onlineAdmins, ...currentUser, ...onlineMembers, ...offlineAdmins, ...offlineMembers];
  },

  renderPeopleContent: function() {
    // People标签显示服务器中的所有成员
    const allMembers = this.state.allMembers || [];

    // 排序逻辑：在线管理员 → 我 → 在线成员 → 离线管理员 → 离线成员
    const sortedMembers = this.sortMembersByStatus(allMembers);

    return `
      <div style="
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin-bottom: 24px;
      ">
        ${sortedMembers.map(member => `
          <div style="
            padding: 8px 12px;
            border-radius: 8px;
            cursor: pointer;
            transition: background-color 0.2s;
            display: flex;
            align-items: center;
            gap: 12px;
          " onclick="MatrixClientMain.showUserProfile('${member.userId}')"
             onmouseover="this.style.background='#3a3a3a'"
             onmouseout="this.style.background='transparent'">
            <div style="
              width: 24px;
              height: 24px;
              border-radius: 50%;
              background: ${member.avatarUrl ? `url(${this.getMediaUrl(member.avatarUrl)})` : '#4a9eff'};
              background-size: cover;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: 500;
              font-size: 12px;
            ">${member.avatarUrl ? '' : (member.displayName || member.userId).charAt(0).toUpperCase()}</div>
            <div style="
              flex: 1;
              min-width: 0;
            ">
              <div style="
                font-size: 14px;
                font-weight: 500;
                color: #ffffff;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                display: flex;
                align-items: center;
                gap: 6px;
              ">
                ${member.displayName || member.userId}
                ${member.powerLevel >= 50 ? '<span style="color: #ffd700; font-size: 12px;">管理员</span>' : ''}
              </div>
              <div style="
                font-size: 12px;
                color: #888;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              ">${member.userId}</div>
            </div>
            <div style="
              width: 8px;
              height: 8px;
              border-radius: 50%;
              background: ${this.getPresenceColor(member.presence || 'offline')};
              margin-left: auto;
            "></div>
          </div>
        `).join('')}
        ${allMembers.length === 0 ? `
          <div style="
            padding: 16px;
            text-align: center;
            color: #888;
            font-size: 14px;
          ">Loading members...</div>
        ` : ''}
      </div>
    `;
  },

  renderRoomsContent: function() {
    // Rooms标签显示所有房间（包括直接消息和群组房间）
    const allRooms = [...(this.state.rooms || []), ...(this.state.directMessages || [])];

    return `
      <div style="
        display: flex;
        flex-direction: column;
        gap: 4px;
      ">
        ${allRooms.map(room => `
          <div style="
            padding: 8px 12px;
            border-radius: 8px;
            cursor: pointer;
            transition: background-color 0.2s;
            display: flex;
            align-items: center;
            gap: 12px;
            ${this.state.selectedRoom?.id === room.id ? 'background: #4a9eff;' : ''}
          " onclick="MatrixClientMain.selectRoom('${room.id}')"
             onmouseover="if('${this.state.selectedRoom?.id}' !== '${room.id}') this.style.background='#3a3a3a'"
             onmouseout="if('${this.state.selectedRoom?.id}' !== '${room.id}') this.style.background='transparent'">
            <div style="
              width: 24px;
              height: 24px;
              border-radius: 50%;
              background: ${room.avatar ? `url(${this.getMediaUrl(room.avatar)})` : '#4a9eff'};
              background-size: cover;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: 500;
              font-size: 12px;
            ">${room.avatar ? '' : (room.isDirect ? room.name.charAt(0).toUpperCase() : '#')}</div>
            <div style="
              flex: 1;
              min-width: 0;
            ">
              <div style="
                font-size: 14px;
                font-weight: 500;
                color: #ffffff;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              ">${room.name}</div>
              ${room.topic || room.lastMessage ? `
                <div style="
                  font-size: 12px;
                  color: #888;
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
                ">${room.topic || room.lastMessage}</div>
              ` : ''}
            </div>
            <div style="
              font-size: 10px;
              color: #666;
              padding: 2px 6px;
              background: #3a3a3a;
              border-radius: 10px;
            ">${room.isDirect ? 'DM' : 'Room'}</div>
          </div>
        `).join('')}
      </div>
    `;
  },



  // Render space panel (when a space is selected)
  renderSpacePanel: function(spaceId) {
    const space = this.state.spaces.find(s => s.id === spaceId);
    if (!space) return this.renderHomePanel();

    console.log('Rendering space panel for:', spaceId, space);

    // Get space members - first try from space.members, then from child rooms
    const spaceMembers = new Map();

    // Add current user as a member if not already present
    if (this.state.user) {
      spaceMembers.set(this.state.user.id, {
        user_id: this.state.user.id,
        display_name: this.state.user.displayName,
        avatar_url: this.state.user.avatar
      });
    }

    // Add members from space.members if available
    if (space.members && space.members.size > 0) {
      space.members.forEach((member, userId) => {
        spaceMembers.set(userId, member);
      });
    }

    // Add members from child rooms
    if (space.childRooms) {
      space.childRooms.forEach(room => {
        if (room.members) {
          room.members.forEach(member => {
            spaceMembers.set(member.user_id, member);
          });
        }
      });
    }

    // Also check allMembers for space members
    if (this.state.allMembers) {
      if (typeof this.state.allMembers.forEach === 'function') {
        // allMembers是Map或有forEach方法的对象
        this.state.allMembers.forEach((member, userId) => {
          // Check if this member is in any of the space's child rooms
          if (space.childRooms && space.childRooms.some(room =>
            room.members && room.members.some(m => m.user_id === userId)
          )) {
            spaceMembers.set(userId, member);
          }
        });
      } else if (Array.isArray(this.state.allMembers)) {
        // allMembers是数组
        this.state.allMembers.forEach(member => {
          const userId = member.userId;
          if (space.childRooms && space.childRooms.some(room =>
            room.members && room.members.some(m => m.user_id === userId)
          )) {
            spaceMembers.set(userId, member);
          }
        });
      }
    }

    const membersArray = Array.from(spaceMembers.values());
    console.log('Space members:', membersArray);
    console.log('Space child rooms:', space.childRooms);

    return `
      <div style="
        width: 280px;
        background-color: #2a2a2a;
        border-right: 1px solid #3a3a3a;
        display: flex;
        flex-direction: column;
      ">
        <!-- Header -->
        <div style="
          padding: 16px;
          border-bottom: 1px solid #3a3a3a;
          display: flex;
          align-items: center;
          justify-content: space-between;
        ">
          <div style="
            font-weight: 600;
            font-size: 16px;
          ">${space.name}</div>
          <div style="
            display: flex;
            gap: 8px;
          ">
            <div style="
              width: 24px;
              height: 24px;
              background: transparent;
              border: none;
              border-radius: 4px;
              color: #888;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: all 0.2s;
            " onmouseover="this.style.background='#3a3a3a'; this.style.color='#ffffff'"
               onmouseout="this.style.background='transparent'; this.style.color='#888'"
               onclick="MatrixClientMain.showSpaceSettings('${spaceId}')">⚙️</div>
          </div>
        </div>

        <!-- Tab Navigation -->
        <div style="
          display: flex;
          border-bottom: 1px solid #3a3a3a;
          background-color: #2a2a2a;
        ">
          <div style="
            flex: 1;
            padding: 12px 16px;
            text-align: center;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            border-bottom: 2px solid ${this.state.activeTab === 'people' || !this.state.activeTab ? '#4a9eff' : 'transparent'};
            color: ${this.state.activeTab === 'people' || !this.state.activeTab ? '#ffffff' : '#888'};
            transition: all 0.2s;
          " onclick="MatrixClientMain.setActiveTab('people')">
            People
          </div>
          <div style="
            flex: 1;
            padding: 12px 16px;
            text-align: center;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            border-bottom: 2px solid ${this.state.activeTab === 'rooms' ? '#4a9eff' : 'transparent'};
            color: ${this.state.activeTab === 'rooms' ? '#ffffff' : '#888'};
            transition: all 0.2s;
          " onclick="MatrixClientMain.setActiveTab('rooms')">
            Rooms
          </div>
        </div>

        <!-- Content -->
        <div style="
          flex: 1;
          overflow-y: auto;
        ">
          <!-- Space Description -->
          ${space.topic ? `
            <div style="
              font-size: 14px;
              color: #888;
              margin: 16px;
              line-height: 1.4;
              padding-bottom: 16px;
              border-bottom: 1px solid #3a3a3a;
            ">${space.topic}</div>
          ` : ''}

          ${this.state.activeTab === 'rooms' ? this.renderSpaceRoomsContent(space) : this.renderSpacePeopleContent(space, membersArray)}
        </div>
      </div>
    `;
  },

  // Render server panel (when a server is selected)
  renderServerPanel: function() {
    const server = this.state.selectedServer;
    if (!server) return '';

    return `
      <div style="
        width: 300px;
        background-color: #252526;
        border-right: 1px solid #3e3e42;
        display: flex;
        flex-direction: column;
      ">
        <!-- Server Header -->
        <div style="
          padding: 16px;
          border-bottom: 1px solid #3e3e42;
          display: flex;
          align-items: center;
          gap: 12px;
        ">
          <div style="
            width: 32px;
            height: 32px;
            background: ${server.avatar ? `url(${this.getMediaUrl(server.avatar)})` : '#0dbd8b'};
            background-size: cover;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 14px;
            color: #ffffff;
          ">${server.avatar ? '' : server.name[0]}</div>
          <div style="flex: 1;">
            <div style="
              font-size: 16px;
              font-weight: 600;
              color: #ffffff;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            ">${server.name}</div>
            <div style="
              font-size: 12px;
              color: #888888;
            ">${server.memberCount || 0} members</div>
          </div>
          <button style="
            background: none;
            border: none;
            color: #888888;
            font-size: 16px;
            cursor: pointer;
          " onclick="MatrixClientMain.showServerMenu()">⋮</button>
        </div>

        <!-- Navigation Tabs -->
        <div style="
          display: flex;
          border-bottom: 1px solid #3e3e42;
        ">
          <button style="
            flex: 1;
            padding: 12px;
            background: ${this.state.leftPanelView === 'rooms' ? '#3e3e42' : 'transparent'};
            border: none;
            color: ${this.state.leftPanelView === 'rooms' ? '#ffffff' : '#888888'};
            font-size: 14px;
            cursor: pointer;
          " onclick="MatrixClientMain.setLeftPanelView('rooms')">Rooms</button>
          <button style="
            flex: 1;
            padding: 12px;
            background: ${this.state.leftPanelView === 'people' ? '#3e3e42' : 'transparent'};
            border: none;
            color: ${this.state.leftPanelView === 'people' ? '#ffffff' : '#888888'};
            font-size: 14px;
            cursor: pointer;
          " onclick="MatrixClientMain.setLeftPanelView('people')">People</button>
        </div>

        <!-- Content based on selected tab -->
        <div style="flex: 1; overflow-y: auto;">
          ${this.state.leftPanelView === 'rooms' ? this.renderRoomsList() : this.renderPeopleList()}
        </div>
      </div>
    `;
  },

  // Render rooms list (Matrix rooms)
  renderRoomsList: function() {
    let rooms = [];

    // Determine which rooms to show based on selected sidebar
    if (this.state.selectedSidebar === 'home') {
      // Show main rooms (not children of any space)
      rooms = this.state.rooms || [];
    } else if (this.state.selectedSidebar.startsWith('space-')) {
      // Show rooms from selected space
      const spaceId = this.state.selectedSidebar.replace('space-', '');
      const selectedSpace = this.state.spaces?.find(space => space.id === spaceId);
      if (selectedSpace && selectedSpace.childRooms) {
        rooms = selectedSpace.childRooms.filter(room => !room.isDirect);
      }
    }

    if (rooms.length === 0) {
      const isSpace = this.state.selectedSidebar.startsWith('space-');
      return `
        <div style="
          padding: 20px;
          text-align: center;
          color: #888888;
          font-style: italic;
        ">
          ${isSpace ? 'No rooms in this space' : this.t('rooms.no_rooms')}
        </div>
      `;
    }

    // Group rooms by homeserver for better organization
    const roomsByServer = {};
    rooms.forEach(room => {
      const server = room.homeserver || 'Unknown';
      if (!roomsByServer[server]) {
        roomsByServer[server] = [];
      }
      roomsByServer[server].push(room);
    });

    return `
      <div style="padding: 8px 0;">
        ${Object.entries(roomsByServer).map(([server, serverRooms]) => `
          <div style="margin-bottom: 16px;">
            <div style="
              padding: 8px 16px;
              font-size: 12px;
              font-weight: 600;
              color: #888888;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              display: flex;
              align-items: center;
              justify-content: space-between;
            ">
              <span>${server} — ${serverRooms.length} ${serverRooms.length === 1 ? 'room' : 'rooms'}</span>
            <button style="
              background: none;
              border: none;
              color: #888888;
              font-size: 16px;
              cursor: pointer;
            " onclick="MatrixClientMain.joinRoom()" title="Join room">+</button>
          </div>

          ${serverRooms.map(room => `
            <div style="
              padding: 8px 16px;
              cursor: pointer;
              display: flex;
              align-items: center;
              gap: 12px;
              background-color: ${this.state.selectedRoom?.id === room.id ? 'rgba(0, 122, 204, 0.2)' : 'transparent'};
              border-left: 3px solid ${this.state.selectedRoom?.id === room.id ? '#0dbd8b' : 'transparent'};
              border-radius: ${this.state.selectedRoom?.id === room.id ? '0 4px 4px 0' : '0'};
            " onclick="MatrixClientMain.selectRoom('${room.id}')"
               onmouseover="this.style.backgroundColor='rgba(255,255,255,0.05)'"
               onmouseout="this.style.backgroundColor='${this.state.selectedRoom?.id === room.id ? 'rgba(0, 122, 204, 0.2)' : 'transparent'}'">

              <!-- Room Avatar -->
              <div style="
                width: 24px;
                height: 24px;
                background: ${room.avatar ? `url(${this.getMediaUrl(room.avatar)})` : 'linear-gradient(135deg, #0dbd8b, #17a2b8)'};
                background-size: cover;
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 12px;
                color: #ffffff;
                flex-shrink: 0;
              ">
                ${room.avatar ? '' : room.name[0]?.toUpperCase() || '#'}
              </div>

              <!-- Room Info -->
              <div style="flex: 1; min-width: 0;">
                <div style="
                  font-size: 14px;
                  font-weight: 500;
                  color: ${this.state.selectedRoom?.id === room.id ? '#ffffff' : '#cccccc'};
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
                ">${room.name}</div>
                ${room.topic ? `
                  <div style="
                    font-size: 12px;
                    color: #888888;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                  ">${room.topic}</div>
                ` : ''}
              </div>

              <!-- Unread Badge -->
              ${room.unreadCount > 0 ? `
                <div style="
                  background-color: #ff4444;
                  color: white;
                  border-radius: 10px;
                  padding: 2px 6px;
                  font-size: 10px;
                  font-weight: bold;
                  min-width: 18px;
                  text-align: center;
                  flex-shrink: 0;
                ">${room.unreadCount}</div>
              ` : ''}
            </div>
          `).join('')}
          </div>
        `).join('')}

      </div>
    `;
  },

  // Render people list
  renderPeopleList: function() {
    let members = [];

    // Determine which members to show based on selected sidebar
    if (this.state.selectedSidebar === 'home') {
      // Show all members from all rooms
      members = Array.from(this.state.allMembers?.values() || []);
    } else if (this.state.selectedSidebar.startsWith('space-')) {
      // Show members from selected space's rooms
      const spaceId = this.state.selectedSidebar.replace('space-', '');
      const selectedSpace = this.state.spaces?.find(space => space.id === spaceId);
      if (selectedSpace && selectedSpace.childRooms) {
        const spaceMembers = new Map();
        selectedSpace.childRooms.forEach(room => {
          if (room.members) {
            room.members.forEach(member => {
              spaceMembers.set(member.userId, member);
            });
          }
        });
        members = Array.from(spaceMembers.values());
      }
    }

    if (this.state.loadingMembers) {
      return `
        <div style="
          padding: 20px;
          text-align: center;
          color: #888888;
        ">
          <div style="margin-bottom: 8px;">加载成员中...</div>
          <div style="
            width: 20px;
            height: 20px;
            border: 2px solid #333;
            border-top: 2px solid #0dbd8b;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto;
          "></div>
        </div>
      `;
    }

    if (members.length === 0) {
      const isSpace = this.state.selectedSidebar.startsWith('space-');
      return `
        <div style="
          padding: 20px;
          text-align: center;
          color: #888888;
          font-style: italic;
        ">
          ${isSpace ? 'No members in this space' : this.t('members.no_members')}
        </div>
      `;
    }

    // 按在线状态分组
    const onlineMembers = members.filter(m => m.presence === 'online');
    const awayMembers = members.filter(m => m.presence === 'away' || m.presence === 'unavailable');
    const offlineMembers = members.filter(m => m.presence === 'offline' || !m.presence || m.presence === 'unknown');

    return `
      <div style="padding: 8px 0;">
        ${onlineMembers.length > 0 ? `
          <div style="padding: 8px 16px;">
            <div style="
              font-size: 12px;
              font-weight: 600;
              color: #888888;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 8px;
            ">${this.t('members.online')} — ${onlineMembers.length}</div>
            ${onlineMembers.map(member => this.renderMemberItem(member, true)).join('')}
          </div>
        ` : ''}

        ${awayMembers.length > 0 ? `
          <div style="padding: 8px 16px;">
            <div style="
              font-size: 12px;
              font-weight: 600;
              color: #888888;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 8px;
            ">离开 — ${awayMembers.length}</div>
            ${awayMembers.map(member => this.renderMemberItem(member, false)).join('')}
          </div>
        ` : ''}

        ${offlineMembers.length > 0 ? `
          <div style="padding: 8px 16px;">
            <div style="
              font-size: 12px;
              font-weight: 600;
              color: #888888;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 8px;
            ">${this.t('members.offline')} — ${offlineMembers.length}</div>
            ${offlineMembers.map(member => this.renderMemberItem(member, false)).join('')}
          </div>
        ` : ''}
      </div>
    `;
  },

  renderMemberItem: function(member, isOnline) {
    const displayName = member.displayName || member.userId;
    const avatarLetter = displayName ? displayName[0].toUpperCase() : member.userId[1].toUpperCase();

    // Convert Matrix avatar URL to proper media URL
    let avatarUrl = null;
    if (member.avatarUrl && member.avatarUrl.startsWith('mxc://')) {
      // Convert mxc:// URL to HTTP URL
      const mxcParts = member.avatarUrl.substring(6).split('/');
      if (mxcParts.length === 2) {
        const homeserver = this.state.homeserver || 'matrix.org';
        avatarUrl = `https://${homeserver}/_matrix/media/r0/thumbnail/${mxcParts[0]}/${mxcParts[1]}?width=32&height=32&method=crop`;
      }
    }

    return `
      <div style="
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 4px 0;
        opacity: ${isOnline ? '1' : '0.6'};
        cursor: pointer;
      " onclick="MatrixClientMain.showMemberProfile('${member.userId}')"
         onmouseover="this.style.backgroundColor='rgba(255,255,255,0.05)'"
         onmouseout="this.style.backgroundColor='transparent'">
        <div style="
          width: 32px;
          height: 32px;
          background: ${avatarUrl ? `url(${avatarUrl})` : 'linear-gradient(135deg, #0dbd8b, #17a2b8)'};
          background-size: cover;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 14px;
          color: #ffffff;
          position: relative;
        ">
          ${avatarUrl ? '' : avatarLetter}
          <div style="
            position: absolute;
            bottom: -2px;
            right: -2px;
            width: 12px;
            height: 12px;
            background-color: ${this.getPresenceColor(member.presence)};
            border: 2px solid #252526;
            border-radius: 50%;
          "></div>
        </div>
        <div style="flex: 1; min-width: 0;">
          <div style="
            font-size: 14px;
            font-weight: 500;
            color: #ffffff;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          ">${displayName}</div>
          ${member.status_msg ? `
            <div style="
              font-size: 12px;
              color: #888888;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            ">${member.status_msg}</div>
          ` : ''}
        </div>
      </div>
    `;
  },

  getPresenceColor: function(presence) {
    switch(presence) {
      case 'online': return '#28a745';
      case 'away':
      case 'unavailable': return '#ffc107';
      case 'busy': return '#dc3545';
      default: return '#6c757d';
    }
  },



  getAllMembers: async function(accessToken, rooms) {
    const allMembers = new Map(); // 使用Map去重，key为user_id

    try {
      // 从房间状态中获取成员信息和权限级别
      rooms.forEach(room => {
        // 获取权限级别事件
        const powerLevelsEvent = room.state.find(event => event.type === 'm.room.power_levels');
        const powerLevels = powerLevelsEvent?.content?.users || {};

        // 获取成员事件
        const memberEvents = room.state.filter(event => event.type === 'm.room.member');
        const joinedMembers = memberEvents.filter(event => event.content?.membership === 'join');

        joinedMembers.forEach(memberEvent => {
          const userId = memberEvent.state_key;
          const powerLevel = powerLevels[userId] || 0;

          if (userId && !allMembers.has(userId)) {
            allMembers.set(userId, {
              userId: userId,
              displayName: memberEvent.content?.displayname || userId.split(':')[0].substring(1),
              avatarUrl: memberEvent.content?.avatar_url,
              powerLevel: powerLevel,
              presence: 'offline' // 默认离线，后续可以获取真实状态
            });
          } else if (userId && allMembers.has(userId)) {
            // 更新权限级别（取最高值）
            const existing = allMembers.get(userId);
            if (powerLevel > existing.powerLevel) {
              existing.powerLevel = powerLevel;
            }
          }
        });
      });

      // 跳过批量获取在线状态，改为按需获取
      // 这样可以避免登录时的大量API调用
      const memberArray = Array.from(allMembers.values());
      console.log('Skipping bulk presence fetch to improve performance');

      console.log(`Found ${allMembers.size} unique members across all rooms`);
      return memberArray;

    } catch (error) {
      console.error('Failed to get all members:', error);
      return [];
    }
  },


  // Render welcome screen (when no room is selected)
  renderWelcomeScreen: function() {
    return `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        background-color: #1e1e1e;
        color: #888888;
        text-align: center;
        padding: 40px;
      ">
        <div style="
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #0dbd8b, #17a2b8);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 36px;
          margin-bottom: 24px;
          color: #ffffff;
        ">
          <span class="icon" data-icon="chat-bubble" style="width: 36px; height: 36px;"></span>
        </div>

        <h2 style="
          font-size: 24px;
          font-weight: 600;
          margin: 0 0 16px 0;
          color: #ffffff;
        ">Welcome to Matrix Client</h2>

        <p style="
          font-size: 16px;
          line-height: 1.5;
          max-width: 400px;
          margin: 0 0 32px 0;
        ">Select a room to start chatting, or create a new one to get the conversation started.</p>

        <div style="display: flex; gap: 16px;">
          <button style="
            padding: 12px 24px;
            background-color: #0dbd8b;
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
          " onclick="MatrixClientMain.createRoom()">Create Room</button>

          <button style="
            padding: 12px 24px;
            background-color: transparent;
            color: #0dbd8b;
            border: 1px solid #0dbd8b;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
          " onclick="MatrixClientMain.exploreRooms()">Explore Rooms</button>
        </div>
      </div>
    `;
  },

  // Render chat area (when a room is selected)
  renderChatArea: function() {
    const room = this.state.selectedRoom;
    if (!room) return '';

    return `
      <div style="
        display: flex;
        flex-direction: column;
        height: 100%;
      ">
        <!-- Chat Header -->
        <div style="
          padding: 16px 24px;
          border-bottom: 1px solid #3e3e42;
          background-color: #2d2d30;
          display: flex;
          align-items: center;
          justify-content: space-between;
        ">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="
              width: 32px;
              height: 32px;
              background: ${room.avatar ? `url(${this.getMediaUrl(room.avatar)})` : '#0dbd8b'};
              background-size: cover;
              border-radius: 6px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              font-size: 14px;
              color: #ffffff;
            ">
              ${room.avatar ? '' : `<span class="icon" data-icon="${room.type === 'text' ? 'hash' : 'speaker-loud'}"></span>`}
            </div>
            <div>
              <h3 style="
                margin: 0;
                font-size: 16px;
                font-weight: 600;
                color: #ffffff;
              ">${room.name}</h3>
              <div style="
                font-size: 12px;
                color: #888888;
                margin-top: 2px;
              ">${room.topic || `${room.memberCount || 0} members`}</div>
            </div>
          </div>

          <div style="display: flex; gap: 8px;">
            <button style="
              background: none;
              border: none;
              color: #888888;
              font-size: 16px;
              cursor: pointer;
              padding: 8px;
            " onclick="MatrixClientMain.toggleRoomInfo()">
              <span class="icon" data-icon="info-circled"></span>
            </button>
            <button style="
              background: none;
              border: none;
              color: #888888;
              font-size: 16px;
              cursor: pointer;
              padding: 8px;
            " onclick="MatrixClientMain.showRoomSettings()">
              <span class="icon" data-icon="gear"></span>
            </button>
          </div>
        </div>

        <!-- Messages Area -->
        <div id="messages-container" style="
          flex: 1;
          overflow-y: auto;
          padding: 16px 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        ">
          ${this.renderMessages()}
        </div>

        <!-- Message Input -->
        <div style="
          padding: 16px 24px;
          border-top: 1px solid #3e3e42;
          background-color: #252526;
        ">
          <div style="
            display: flex;
            align-items: flex-end;
            gap: 12px;
            background-color: #3c3c3c;
            border-radius: 8px;
            padding: 12px;
          ">
            <button style="
              background: none;
              border: none;
              color: #888888;
              font-size: 18px;
              cursor: pointer;
              padding: 4px;
            " onclick="MatrixClientMain.showAttachMenu()">
              <span class="icon" data-icon="paperclip"></span>
            </button>

            <textarea
              id="message-input"
              placeholder="Message ${room.name}"
              style="
                flex: 1;
                background: none;
                border: none;
                color: #ffffff;
                font-size: 14px;
                resize: none;
                min-height: 20px;
                max-height: 120px;
                outline: none;
                font-family: inherit;
              "
            ></textarea>

            <button style="
              background: none;
              border: none;
              color: #888888;
              font-size: 18px;
              cursor: pointer;
              padding: 4px;
            " onclick="MatrixClientMain.showEmojiPicker()">
              <span class="icon" data-icon="face"></span>
            </button>

            <button
              id="send-button"
              style="
                background-color: #0dbd8b;
                border: none;
                color: white;
                border-radius: 4px;
                padding: 8px 12px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 600;
              "
            >Send</button>
          </div>
        </div>
      </div>
    `;
  },

  // Render messages in the chat area
  renderMessages: function() {
    const messages = this.state.selectedRoom?.messages || [];

    if (messages.length === 0) {
      return `
        <div style="
          text-align: center;
          color: #888888;
          font-style: italic;
          margin: 40px 0;
        ">
          No messages yet. Start the conversation!
        </div>
      `;
    }

    return messages.map((message, index) => {
      const prevMessage = messages[index - 1];
      const nextMessage = messages[index + 1];
      const showAvatar = !prevMessage || prevMessage.sender.id !== message.sender.id;
      const showTimestamp = showAvatar || !nextMessage || nextMessage.sender.id !== message.sender.id;
      const isOwnMessage = message.sender.id === this.state.user?.id;
      const isConsecutive = prevMessage && prevMessage.sender.id === message.sender.id;

      // Check if this is a system message (join, leave, etc.)
      // Normal messages have type 'm.room.message', system messages have other types like 'm.room.member'
      const isSystemMessage = message.type &&
        message.type !== 'm.room.message' &&
        message.type !== 'm.text' &&
        !message.msgtype; // Regular messages should have msgtype

      if (isSystemMessage) {
        return this.renderSystemMessage(message);
      }

      return `
        <div class="message-group" style="
          display: flex;
          gap: 12px;
          padding: ${showAvatar ? '8px 16px 2px 16px' : '2px 16px'};
          position: relative;
          transition: background-color 0.1s;
        " onmouseenter="this.style.backgroundColor='#2a2a2a'"
           onmouseleave="this.style.backgroundColor='transparent'">

          <!-- Avatar column -->
          <div style="
            width: 32px;
            height: 32px;
            ${showAvatar ? 'opacity: 1' : 'opacity: 0'};
            cursor: ${showAvatar ? 'pointer' : 'default'};
          " ${showAvatar ? `onclick="MatrixClientMain.showUserProfile('${message.sender.id}')"` : ''}>
            ${showAvatar ? `
              <div style="
                width: 32px;
                height: 32px;
                ${!message.sender.avatar ? `background: ${this.generateUserColor(message.sender.id)};` : ''}
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 14px;
                color: #ffffff;
                transition: transform 0.1s;
                overflow: hidden;
              " onmouseenter="this.style.transform='scale(1.05)'"
                 onmouseleave="this.style.transform='scale(1)'">
                ${message.sender.avatar ?
                  this.createAuthenticatedImage(
                    message.sender.avatar,
                    (message.sender.displayName?.[0] || message.sender.id?.[1] || 'U').toUpperCase(),
                    '',
                    'width: 100%; height: 100%; object-fit: cover; border-radius: 50%;'
                  ) :
                  (message.sender.displayName?.[0] || message.sender.id?.[1] || 'U').toUpperCase()
                }
              </div>
            ` : ''}
          </div>

          <!-- Message content -->
          <div style="flex: 1; min-width: 0;">
            ${showAvatar ? `
              <div style="
                display: flex;
                align-items: baseline;
                gap: 8px;
                margin-bottom: 4px;
              ">
                <span style="
                  font-weight: 600;
                  color: ${this.getUserDisplayColor(message.sender.id, isOwnMessage)};
                  font-size: 14px;
                  cursor: pointer;
                " onclick="MatrixClientMain.showUserProfile('${message.sender.id}')">${message.sender.displayName || message.sender.id}</span>
                <span style="
                  font-size: 12px;
                  color: #888888;
                  opacity: 0.8;
                ">${this.formatTimestamp(message.timestamp)}</span>
              </div>
            ` : ''}

            <!-- Message body -->
            <div style="
              color: #cccccc;
              font-size: 14px;
              line-height: 1.4;
              word-wrap: break-word;
              ${isConsecutive && !showAvatar ? 'margin-left: 0px;' : ''}
            ">
              ${this.renderMessageContent(message)}
            </div>

            <!-- Message reactions (if any) -->
            ${message.reactions && Object.keys(message.reactions).length > 0 ? `
              <div style="
                display: flex;
                flex-wrap: wrap;
                gap: 4px;
                margin-top: 6px;
              ">
                ${Object.entries(message.reactions).map(([emoji, users]) => `
                  <div style="
                    background: #3a3a3a;
                    border: 1px solid #4a4a4a;
                    border-radius: 12px;
                    padding: 2px 6px;
                    font-size: 12px;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    cursor: pointer;
                    transition: all 0.1s;
                  " onmouseenter="this.style.backgroundColor='#4a4a4a'"
                     onmouseleave="this.style.backgroundColor='#3a3a3a'"
                     onclick="MatrixClientMain.toggleReaction('${message.id}', '${emoji}')">
                    <span>${emoji}</span>
                    <span style="color: #888;">${users.length}</span>
                  </div>
                `).join('')}
              </div>
            ` : ''}

            <!-- Timestamp for consecutive messages -->
            ${!showAvatar && showTimestamp ? `
              <div style="
                font-size: 11px;
                color: #666;
                margin-top: 2px;
                opacity: 0;
                transition: opacity 0.1s;
              " class="message-timestamp">${this.formatTimestamp(message.timestamp)}</div>
            ` : ''}
          </div>

          <!-- Message actions (show on hover) -->
          <div style="
            position: absolute;
            right: 16px;
            top: ${showAvatar ? '8px' : '2px'};
            display: none;
            background: #2a2a2a;
            border: 1px solid #3a3a3a;
            border-radius: 6px;
            padding: 4px;
            gap: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          " class="message-actions">
            <button style="
              background: transparent;
              border: none;
              color: #888;
              cursor: pointer;
              padding: 4px;
              border-radius: 4px;
              font-size: 14px;
            " onclick="MatrixClientMain.addReaction('${message.id}', '👍')" title="React">👍</button>
            <button style="
              background: transparent;
              border: none;
              color: #888;
              cursor: pointer;
              padding: 4px;
              border-radius: 4px;
              font-size: 14px;
            " onclick="MatrixClientMain.replyToMessage('${message.id}')" title="Reply">↩️</button>
            ${isOwnMessage ? `
              <button style="
                background: transparent;
                border: none;
                color: #888;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                font-size: 14px;
              " onclick="MatrixClientMain.editMessage('${message.id}')" title="Edit">✏️</button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  },

  // Utility methods
  formatTimestamp: function(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;

    return date.toLocaleDateString();
  },

  // Render message content based on message type
  renderMessageContent: function(message) {
    if (!message.content) return '';

    // Handle different message types
    switch (message.msgtype) {
      case 'm.text':
        return this.formatMessageContent(message.content);
      case 'm.emote':
        return `<em style="color: #888;">* ${message.sender.displayName} ${this.formatMessageContent(message.content)}</em>`;
      case 'm.notice':
        return `<div style="color: #888; font-style: italic;">${this.formatMessageContent(message.content)}</div>`;
      case 'm.image':
        return this.renderImageMessage(message);
      case 'm.file':
        return this.renderFileMessage(message);
      case 'm.video':
        return this.renderVideoMessage(message);
      case 'm.audio':
        return this.renderAudioMessage(message);
      default:
        return this.formatMessageContent(message.content);
    }
  },

  renderSystemMessage: function(message) {
    let content = '';
    const senderName = message.sender.displayName || message.sender.id;

    switch (message.type) {
      case 'm.room.member':
        if (message.content.membership === 'join') {
          content = `${senderName} joined the room`;
        } else if (message.content.membership === 'leave') {
          content = `${senderName} left the room`;
        } else if (message.content.membership === 'invite') {
          content = `${senderName} was invited to the room`;
        }
        break;
      case 'm.room.create':
        content = `${senderName} created the room`;
        break;
      case 'm.room.name':
        content = `${senderName} changed the room name to "${message.content.name}"`;
        break;
      case 'm.room.topic':
        content = `${senderName} changed the room topic to "${message.content.topic}"`;
        break;
      default:
        content = `System message: ${message.type}`;
    }

    return `
      <div style="
        text-align: center;
        margin: 16px 0;
        padding: 8px 16px;
      ">
        <div style="
          display: inline-block;
          background: #2a2a2a;
          color: #888;
          padding: 6px 12px;
          border-radius: 12px;
          font-size: 13px;
          border: 1px solid #3a3a3a;
        ">${content}</div>
      </div>
    `;
  },

  renderImageMessage: function(message) {
    const imageUrl = message.url ? this.getMediaUrl(message.url) : '';
    return `
      <div style="margin: 8px 0;">
        ${imageUrl ? `
          <img src="${imageUrl}" alt="${message.body || 'Image'}" style="
            max-width: 300px;
            max-height: 300px;
            border-radius: 8px;
            cursor: pointer;
          " onclick="MatrixClientMain.openImageModal('${imageUrl}', '${message.body || 'Image'}')">
        ` : `
          <div style="
            background: #3a3a3a;
            padding: 12px;
            border-radius: 8px;
            color: #888;
          ">📷 ${message.body || 'Image'}</div>
        `}
      </div>
    `;
  },

  renderFileMessage: function(message) {
    const fileUrl = message.url ? this.getMediaUrl(message.url) : '';
    const fileSize = message.info?.size ? this.formatFileSize(message.info.size) : '';

    return `
      <div style="
        background: #3a3a3a;
        border: 1px solid #4a4a4a;
        border-radius: 8px;
        padding: 12px;
        margin: 8px 0;
        display: flex;
        align-items: center;
        gap: 12px;
        cursor: ${fileUrl ? 'pointer' : 'default'};
      " ${fileUrl ? `onclick="window.open('${fileUrl}', '_blank')"` : ''}>
        <div style="
          width: 32px;
          height: 32px;
          background: #4a9eff;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
        ">📄</div>
        <div style="flex: 1;">
          <div style="font-weight: 500; color: #fff;">${message.body || 'File'}</div>
          ${fileSize ? `<div style="font-size: 12px; color: #888;">${fileSize}</div>` : ''}
        </div>
        ${fileUrl ? `<div style="color: #4a9eff;">↓</div>` : ''}
      </div>
    `;
  },

  formatMessageContent: function(content) {
    if (!content) return '';

    // Escape HTML first
    let formatted = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Format @mentions (Matrix user IDs)
    formatted = formatted.replace(/@([a-zA-Z0-9._=-]+:[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
      '<span style="background-color: #0dbd8b; color: white; padding: 2px 6px; border-radius: 12px; font-size: 12px; font-weight: 500; cursor: pointer;" onclick="MatrixClientMain.showUserProfile(\'$1\')">@$1</span>');

    // Format room mentions
    formatted = formatted.replace(/#([a-zA-Z0-9._=-]+:[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
      '<span style="background-color: #4a9eff; color: white; padding: 2px 6px; border-radius: 12px; font-size: 12px; font-weight: 500;">#$1</span>');

    // Basic markdown formatting
    formatted = formatted
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/__(.*?)__/g, '<u>$1</u>')
      .replace(/~~(.*?)~~/g, '<del>$1</del>')
      .replace(/`(.*?)`/g, '<code style="background-color: #3c3c3c; padding: 2px 4px; border-radius: 3px; font-family: monospace;">$1</code>');

    // Format code blocks
    formatted = formatted.replace(/```([\s\S]*?)```/g,
      '<pre style="background-color: #2a2a2a; padding: 12px; border-radius: 6px; overflow-x: auto; font-family: monospace; margin: 8px 0; border: 1px solid #3a3a3a;"><code>$1</code></pre>');

    // Format links
    formatted = formatted.replace(/(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank" style="color: #4a9eff; text-decoration: underline;">$1</a>');

    // Format line breaks
    formatted = formatted.replace(/\n/g, '<br>');

    return formatted;
  },

  // Event handlers
  continueToCredentials: function() {
    const homeserver = document.getElementById('homeserver-input')?.value || this.state.homeserver;
    this.updateState({
      homeserver: homeserver,
      loginStep: 'credentials'
    });
    this.rerender();
  },

  backToServer: function() {
    this.updateState({ loginStep: 'server' });
    this.rerender();
  },

  performLogin: async function() {
    const username = document.getElementById('username-input')?.value || this.state.username;
    const password = document.getElementById('password-input')?.value || this.state.password;

    if (!username || !password) {
      this.showNotification('Please enter both username and password', 'error');
      return;
    }

    this.updateState({
      connecting: true,
      username: username,
      password: password
    });
    this.rerender();

    try {
      // Real Matrix login
      const loginResponse = await this.matrixLogin(this.state.homeserver, username, password);

      if (loginResponse.success) {
        // Get user profile, rooms, and direct message data
        const [userProfile, roomsData, directData] = await Promise.all([
          this.getUserProfile(loginResponse.accessToken, loginResponse.userId),
          this.getUserRooms(loginResponse.accessToken),
          this.getDirectMessages(loginResponse.accessToken, loginResponse.userId)
        ]);

        const servers = this.processServersFromRooms(roomsData.rooms);
        const { rooms, directMessages, spaces, allRooms } = this.processRooms(roomsData.rooms, directData, loginResponse.userId);

        // 获取所有成员
        const allMembers = await this.getAllMembers(loginResponse.accessToken, roomsData.rooms);

        console.log('Login successful, processed data:', {
          servers: servers,
          rooms: rooms,
          directMessages: directMessages,
          directData: directData,
          userProfile: userProfile,
          allMembers: allMembers
        });

        console.log('User profile data:', userProfile);
        console.log('Final user object:', {
          id: loginResponse.userId,
          displayName: userProfile.displayName || userProfile.display_name || username,
          avatar: userProfile.avatarUrl || userProfile.avatar_url
        });

        this.updateState({
          currentView: 'main',
          connecting: false,
          connected: true,
          accessToken: loginResponse.accessToken,
          homeserver: this.state.homeserver,
          user: {
            id: loginResponse.userId,
            displayName: userProfile.displayName || userProfile.display_name || username,
            avatar: userProfile.avatarUrl || userProfile.avatar_url
          },
          spaces: spaces || [],
          rooms: rooms,
          directMessages: directMessages,
          allMembers: allMembers,
          allRooms: allRooms,
          selectedSidebar: 'home'
        });

        this.rerender();
        this.showNotification('Successfully logged in!', 'success');
      } else {
        throw new Error(loginResponse.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login failed:', error);
      this.updateState({ connecting: false });
      this.rerender();
      this.showNotification('Login failed: ' + error.message, 'error');
    }
  },

  // Matrix API methods (using plugin API)
  matrixLogin: async function(homeserver, username, password) {
    try {
      // Use plugin API instead of direct backend calls
      if (window.extensionAPI && window.extensionAPI.login) {
        return await window.extensionAPI.login(homeserver, username, password);
      }

      // Fallback to direct API call if plugin API not available
      const response = await fetch(`http://localhost:8000/api/message-proxy/element/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          homeserver: homeserver,
          username: username,
          password: password
        })
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          accessToken: data.access_token,
          userId: data.user_id,
          deviceId: data.device_id
        };
      } else {
        return {
          success: false,
          error: data.error || 'Unknown error'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  getUserProfile: async function(accessToken, userId) {
    try {
      // Use plugin API if available
      if (window.extensionAPI && window.extensionAPI.getUserProfile) {
        return await window.extensionAPI.getUserProfile(accessToken, userId);
      }

      // Fallback to direct API call
      const response = await fetch(`http://localhost:8000/api/message-proxy/element/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          access_token: accessToken,
          user_id: userId
        })
      });

      if (response.ok) {
        const result = await response.json();
        return result.success ? result.data : {};
      } else {
        return {};
      }
    } catch (error) {
      console.error('Failed to get user profile:', error);
      return {};
    }
  },

  getDirectMessages: async function(accessToken, userId) {
    try {
      console.log('Getting direct messages for user:', userId);

      // Get m.direct account data to identify direct message rooms
      const response = await fetch(`http://localhost:8000/api/message-proxy/element/account-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          access_token: accessToken,
          user_id: userId,
          type: 'm.direct'
        })
      });

      console.log('Direct messages response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('Direct messages result:', result);
        return result.success ? result.data : {};
      } else {
        const errorText = await response.text();
        console.error('Failed to get direct messages:', response.status, errorText);
        return {};
      }
    } catch (error) {
      console.error('Failed to get direct messages data:', error);
      return {};
    }
  },

  getUserRooms: async function(accessToken) {
    try {
      // Use plugin API if available
      if (window.extensionAPI && window.extensionAPI.getJoinedRooms) {
        const result = await window.extensionAPI.getJoinedRooms(accessToken);
        return result.success ? result.data : { rooms: [] };
      }

      // Fallback to direct API call
      const response = await fetch(`http://localhost:8000/api/message-proxy/element/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          access_token: accessToken
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (!result.success) {
          return { rooms: [] };
        }

        const data = result.data;

        // Get room details for each room
        const roomDetails = await Promise.all(
          data.joined_rooms.slice(0, 10).map(async (roomId) => { // Limit to first 10 rooms
            try {
              const roomResponse = await fetch(`http://localhost:8000/api/message-proxy/element/room-state`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  access_token: accessToken,
                  room_id: roomId
                })
              });

              if (roomResponse.ok) {
                const roomResult = await roomResponse.json();
                if (roomResult.success) {
                  return {
                    id: roomId,
                    state: roomResult.data
                  };
                }
              }
            } catch (error) {
              console.error(`Failed to get room ${roomId} details:`, error);
            }
            return null;
          })
        );

        return {
          rooms: roomDetails.filter(room => room !== null)
        };
      } else {
        return { rooms: [] };
      }
    } catch (error) {
      console.error('Failed to get user rooms:', error);
      return { rooms: [] };
    }
  },

  getRoomMembers: async function(accessToken, roomId) {
    try {
      // Use plugin API if available
      if (window.extensionAPI && window.extensionAPI.getRoomMembers) {
        return await window.extensionAPI.getRoomMembers(accessToken, roomId);
      }

      // Fallback to direct API call
      const response = await fetch(`http://localhost:8000/api/message-proxy/element/room-members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          access_token: accessToken,
          room_id: roomId
        })
      });

      if (response.ok) {
        const result = await response.json();
        return result.success ? result : { success: false, members: [] };
      } else {
        return { success: false, members: [] };
      }
    } catch (error) {
      console.error('Failed to get room members:', error);
      return { success: false, members: [] };
    }
  },

  getMemberPresence: async function(accessToken, userId) {
    try {
      // Use plugin API if available
      if (window.extensionAPI && window.extensionAPI.getMemberPresence) {
        return await window.extensionAPI.getMemberPresence(accessToken, userId);
      }

      // Fallback to direct API call
      const response = await fetch(`http://localhost:8000/api/message-proxy/element/presence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          access_token: accessToken,
          user_id: userId
        })
      });

      if (response.ok) {
        const result = await response.json();
        return result.success ? result : { success: false, presence: 'offline' };
      } else {
        return { success: false, presence: 'offline' };
      }
    } catch (error) {
      console.error('Failed to get member presence:', error);
      return { success: false, presence: 'offline' };
    }
  },

  createDirectMessage: async function(accessToken, userId) {
    try {
      // Use plugin API if available
      if (window.extensionAPI && window.extensionAPI.createDirectMessage) {
        return await window.extensionAPI.createDirectMessage(accessToken, userId);
      }

      // Fallback to direct API call
      const response = await fetch(`http://localhost:8000/api/message-proxy/element/create-dm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          access_token: accessToken,
          user_id: userId
        })
      });

      if (response.ok) {
        const result = await response.json();
        return result.success ? result : { success: false };
      } else {
        return { success: false };
      }
    } catch (error) {
      console.error('Failed to create direct message:', error);
      return { success: false };
    }
  },

  getUserProfileDetailed: async function(accessToken, userId) {
    try {
      const response = await fetch(`http://localhost:8000/api/message-proxy/element/profile-detailed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          access_token: accessToken,
          user_id: userId
        })
      });

      if (response.ok) {
        const result = await response.json();
        return result.success ? result : { success: false };
      } else {
        return { success: false };
      }
    } catch (error) {
      console.error('Failed to get detailed user profile:', error);
      return { success: false };
    }
  },

  ignoreUser: async function(accessToken, userId, ignore = true) {
    try {
      const response = await fetch(`http://localhost:8000/api/message-proxy/element/ignore-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          access_token: accessToken,
          user_id: userId,
          ignore: ignore
        })
      });

      if (response.ok) {
        const result = await response.json();
        return result.success ? result : { success: false };
      } else {
        return { success: false };
      }
    } catch (error) {
      console.error('Failed to ignore/unignore user:', error);
      return { success: false };
    }
  },

  sendMessageToRoom: async function(accessToken, roomId, message, msgType = 'm.text') {
    try {
      const response = await fetch(`http://localhost:8000/api/message-proxy/element/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          access_token: accessToken,
          room_id: roomId,
          message: message,
          msg_type: msgType
        })
      });

      if (response.ok) {
        const result = await response.json();
        return result.success ? result : { success: false };
      } else {
        return { success: false };
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      return { success: false };
    }
  },

  processServersFromRooms: function(rooms) {
    // Extract unique servers from room IDs
    const serverMap = new Map();

    rooms.forEach(room => {
      const serverId = room.id.split(':')[1]; // Extract server from room ID like !room:server.com
      if (serverId && !serverMap.has(serverId)) {
        // Create a display name from server domain
        const displayName = serverId.split('.')[0] || serverId;

        serverMap.set(serverId, {
          id: serverId,
          name: displayName,
          fullName: serverId,
          avatar: null,
          memberCount: 0,
          members: []
        });
      }
    });

    const servers = Array.from(serverMap.values());
    console.log('Processed servers:', servers); // Debug log
    return servers;
  },

  processRooms: function(rooms, directData = {}, currentUserId = null) {
    console.log('Processing rooms with directData:', { rooms, directData, currentUserId });

    const directRoomIds = new Set();

    // Extract all room IDs that are marked as direct messages
    Object.values(directData).forEach(roomList => {
      if (Array.isArray(roomList)) {
        roomList.forEach(roomId => directRoomIds.add(roomId));
      }
    });

    console.log('Direct room IDs:', Array.from(directRoomIds));

    const processedRooms = [];
    const directMessages = [];
    const spaces = [];
    const spaceChildrenMap = new Map(); // Map space ID to child room IDs

    // First pass: identify spaces and build space-children relationships
    rooms.forEach(room => {
      const createEvent = room.state.find(event => event.type === 'm.room.create');
      const isSpace = createEvent?.content?.type === 'm.space';

      if (isSpace) {
        // Find space children
        const childEvents = room.state.filter(event => event.type === 'm.space.child');
        const childRoomIds = childEvents.map(event => event.state_key);
        spaceChildrenMap.set(room.id, childRoomIds);
        console.log(`Space ${room.id} has children:`, childRoomIds);
      }
    });

    // Second pass: process all rooms
    rooms.forEach(room => {
      // Find room name from state events
      const nameEvent = room.state.find(event => event.type === 'm.room.name');
      const topicEvent = room.state.find(event => event.type === 'm.room.topic');
      const avatarEvent = room.state.find(event => event.type === 'm.room.avatar');
      const createEvent = room.state.find(event => event.type === 'm.room.create');

      const serverId = room.id.split(':')[1];

      const isDirectMessage = directRoomIds.has(room.id);
      const isSpace = createEvent?.content?.type === 'm.space';

      // Check if this room is a child of any space
      let parentSpaceId = null;
      for (const [spaceId, childIds] of spaceChildrenMap.entries()) {
        if (childIds.includes(room.id)) {
          parentSpaceId = spaceId;
          break;
        }
      }

      // Get room display name with proper fallback
      let displayName = nameEvent?.content?.name;
      if (!displayName) {
        if (isDirectMessage) {
          // For direct messages, try to get the other user's display name
          const memberEvents = room.state.filter(event => event.type === 'm.room.member');
          const joinedMembers = memberEvents.filter(event => event.content?.membership === 'join');
          const otherMember = joinedMembers.find(event => event.state_key !== currentUserId);

          if (otherMember) {
            // Use display name if available, otherwise use the user ID without the server part
            displayName = otherMember.content?.displayname ||
                         otherMember.state_key.split(':')[0].substring(1) || // Remove @ prefix
                         'Direct Message';
          } else {
            displayName = 'Direct Message';
          }
        } else {
          // For regular rooms, use a generic name for rooms with random IDs
          const roomLocalPart = room.id.split(':')[0].substring(1); // Remove ! prefix
          if (roomLocalPart.length > 15 && /^[a-zA-Z0-9]+$/.test(roomLocalPart)) {
            displayName = 'Unnamed Room';
          } else {
            displayName = roomLocalPart.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          }
        }
      }

      const processedRoom = {
        id: room.id,
        name: displayName,
        type: isSpace ? 'space' : (isDirectMessage ? 'direct' : 'room'),
        serverId: serverId,
        homeserver: serverId,
        avatar: avatarEvent?.content?.url,
        topic: topicEvent?.content?.topic || '',
        memberCount: 0,
        unreadCount: 0,
        lastMessage: '',
        messages: [],
        members: [],
        isDirect: isDirectMessage,
        isSpace: isSpace,
        parentSpaceId: parentSpaceId,
        childRoomIds: isSpace ? (spaceChildrenMap.get(room.id) || []) : []
      };

      // Store all rooms for mapping, but organize them for display
      const allProcessedRooms = [];

      if (isSpace) {
        spaces.push(processedRoom);
        allProcessedRooms.push(processedRoom);
      } else if (isDirectMessage) {
        directMessages.push(processedRoom);
        allProcessedRooms.push(processedRoom);
      } else {
        // Add all regular rooms to the processed list for mapping
        allProcessedRooms.push(processedRoom);
        // Only add to main rooms list if it's not a child of any space
        if (!parentSpaceId) {
          processedRooms.push(processedRoom);
        }
      }

      // Store in temporary array for later mapping
      if (!window.tempAllRooms) window.tempAllRooms = [];
      window.tempAllRooms.push(processedRoom);
    });

    // Create a map of all rooms for easy lookup (including child rooms)
    const allRoomsMap = new Map();
    if (window.tempAllRooms) {
      window.tempAllRooms.forEach(room => {
        allRoomsMap.set(room.id, room);
      });
      // Clean up temporary storage
      delete window.tempAllRooms;
    }

    // Add child rooms to spaces
    spaces.forEach(space => {
      console.log(`Processing space ${space.name} (${space.id}):`, {
        childRoomIds: space.childRoomIds,
        availableRooms: Array.from(allRoomsMap.keys())
      });

      space.childRooms = space.childRoomIds.map(childId => {
        const childRoom = allRoomsMap.get(childId);
        if (!childRoom) {
          console.warn(`Child room ${childId} not found for space ${space.name}`);
          console.log('Available rooms:', Array.from(allRoomsMap.keys()));
          console.log('Looking for child room in all data...');
          // Try to find the room in the original rooms data
          const foundInRooms = [...processedRooms, ...directMessages, ...spaces].find(r => r.id === childId);
          if (foundInRooms) {
            console.log('Found child room in original data:', foundInRooms);
            return foundInRooms;
          }
        }
        return childRoom;
      }).filter(Boolean);

      console.log(`Space ${space.name} child rooms:`, space.childRooms.map(r => ({ id: r.id, name: r.name })));
    });

    return {
      rooms: processedRooms,
      directMessages: directMessages,
      spaces: spaces,
      allRooms: allRoomsMap
    };
  },

  selectServer: function(serverId) {
    const server = this.state.servers.find(s => s.id === serverId);
    this.updateState({
      selectedServer: server,
      leftPanelView: 'rooms'
    });
    this.rerender();
  },

  selectSidebar: function(sidebar) {
    console.log('Selecting sidebar:', sidebar);

    // Extract space ID if this is a space selection
    let selectedSpace = null;
    if (sidebar.startsWith('space-')) {
      selectedSpace = sidebar.replace('space-', '');
      console.log('Selected space ID:', selectedSpace);
    }

    this.updateState({
      selectedSidebar: sidebar,
      selectedSpace: selectedSpace,
      selectedTab: 'rooms', // Reset to rooms tab when switching spaces
      activeTab: 'people' // Reset to people tab for spaces (to match the default)
    });
    this.rerender();
  },

  selectTab: function(tab) {
    this.updateState({ selectedTab: tab });
    this.rerender();
  },

  showUserDirectory: function() {
    // TODO: Implement user directory functionality
    this.showNotification('User directory feature coming soon!', 'info');
  },

  selectRoom: async function(roomId) {
    console.log('Selecting room:', roomId);

    // Find room in rooms, directMessages, or space child rooms
    let room = this.state.rooms.find(r => r.id === roomId) ||
               this.state.directMessages.find(r => r.id === roomId);

    // If not found in main lists, check space child rooms
    if (!room && this.state.spaces) {
      for (const space of this.state.spaces) {
        if (space.childRooms) {
          const childRoom = space.childRooms.find(r => r.id === roomId);
          if (childRoom) {
            room = childRoom;
            console.log('Found room in space child rooms:', room);
            break;
          }
        }
      }
    }

    if (!room) {
      console.error('Room not found:', roomId);
      this.showNotification('Room not found', 'error');
      return;
    }
    this.updateState({ selectedRoom: room, loadingMembers: true, loadingMessages: true });
    this.rerender();

    // 加载房间成员和消息
    if (room && this.state.accessToken) {
      try {
        // 并行加载成员和消息
        const [membersResult, messagesResult] = await Promise.all([
          this.getRoomMembers(this.state.accessToken, roomId),
          this.getRoomMessages(this.state.accessToken, roomId, 50)
        ]);

        let updatedRoom = { ...room };

        // 处理成员数据
        if (membersResult.success && membersResult.members) {
          const membersWithPresence = membersResult.members.slice(0, 50).map(member => ({
            ...member,
            presence: 'offline', // 默认为离线状态
            status_msg: null
          }));
          updatedRoom.members = membersWithPresence;
        }

        // 处理消息数据
        if (messagesResult.success && messagesResult.data) {
          const messageData = messagesResult.data;
          if (messageData.chunk && Array.isArray(messageData.chunk)) {
            // 处理消息，按时间排序（最新的在下面）
            const processedMessages = messageData.chunk
              .filter(event => event.type === 'm.room.message')
              .reverse() // Matrix返回的是倒序，我们需要正序
              .map(event => {
                // 从allMembers中获取发送者信息
                let senderInfo = null;

                // 安全地访问allMembers
                if (this.state.allMembers) {
                  if (typeof this.state.allMembers.get === 'function') {
                    // allMembers是Map
                    senderInfo = this.state.allMembers.get(event.sender);
                  } else if (Array.isArray(this.state.allMembers)) {
                    // allMembers是数组
                    senderInfo = this.state.allMembers.find(member => member.userId === event.sender);
                  } else if (typeof this.state.allMembers === 'object') {
                    // allMembers是普通对象
                    senderInfo = this.state.allMembers[event.sender];
                  }
                }

                const processedMessage = {
                  id: event.event_id,
                  sender: {
                    id: event.sender,
                    displayName: senderInfo?.displayName || senderInfo?.display_name || event.sender.split(':')[0].substring(1),
                    avatar: senderInfo?.avatarUrl || senderInfo?.avatar_url || null
                  },
                  content: event.content?.body || '',
                  timestamp: event.origin_server_ts,
                  type: event.content?.msgtype || 'm.text'
                };

                // 调试日志：检查头像数据
                if (senderInfo) {
                  console.log(`Message from ${event.sender}:`, {
                    senderInfo: senderInfo,
                    avatar: processedMessage.sender.avatar,
                    displayName: processedMessage.sender.displayName
                  });
                } else {
                  console.log(`No sender info found for ${event.sender}, allMembers type:`, typeof this.state.allMembers);
                }

                return processedMessage;
              });

            updatedRoom.messages = processedMessages;

            // 更新最后一条消息
            if (processedMessages.length > 0) {
              const lastMessage = processedMessages[processedMessages.length - 1];
              updatedRoom.lastMessage = lastMessage.content;
            }
          }
        }

        // 更新状态
        const updatedRooms = this.state.rooms.map(r => r.id === roomId ? updatedRoom : r);
        const updatedDirectMessages = this.state.directMessages.map(r => r.id === roomId ? updatedRoom : r);

        this.updateState({
          selectedRoom: updatedRoom,
          rooms: updatedRooms,
          directMessages: updatedDirectMessages,
          loadingMembers: false,
          loadingMessages: false
        });

      } catch (error) {
        console.error('Failed to load room data:', error);
        this.updateState({
          loadingMembers: false,
          loadingMessages: false
        });
      }
    }

    this.rerender();
  },

  sendMessage: function() {
    const input = document.getElementById('message-input');
    const content = input?.value?.trim();

    if (!content || !this.state.selectedRoom) return;

    const message = {
      id: 'msg_' + Date.now(),
      sender: this.state.user,
      content: content,
      timestamp: Date.now()
    };

    // Add message to current room (could be in rooms or directMessages)
    const updatedRooms = this.state.rooms.map(room => {
      if (room.id === this.state.selectedRoom.id) {
        return {
          ...room,
          messages: [...(room.messages || []), message],
          lastMessage: content
        };
      }
      return room;
    });

    const updatedDirectMessages = this.state.directMessages.map(room => {
      if (room.id === this.state.selectedRoom.id) {
        return {
          ...room,
          messages: [...(room.messages || []), message],
          lastMessage: content
        };
      }
      return room;
    });

    this.updateState({
      rooms: updatedRooms,
      directMessages: updatedDirectMessages,
      selectedRoom: {
        ...this.state.selectedRoom,
        messages: [...(this.state.selectedRoom.messages || []), message],
        lastMessage: content
      }
    });

    input.value = '';
    this.rerender();

    // Scroll to bottom
    setTimeout(() => {
      const container = document.getElementById('messages-container');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 100);
  },

  handleMessageInput: function(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  },

  // User menu methods
  toggleUserMenu: function() {
    this.updateState({ showUserMenu: !this.state.showUserMenu });
    this.rerender();
  },

  logout: function() {
    // Clear all user data
    this.updateState({
      currentView: 'login',
      connected: false,
      accessToken: null,
      user: null,
      spaces: [],
      rooms: [],
      selectedRoom: null,
      selectedSidebar: 'home',
      showUserMenu: false,
      loginStep: 'server'
    });

    // Clear localStorage
    localStorage.removeItem('matrix-client-state');

    this.rerender();
    this.showNotification('Successfully logged out', 'success');
  },

  linkNewDevice: function() {
    this.updateState({ showUserMenu: false });
    this.rerender();
    this.showNotification('Link new device feature coming soon', 'info');
  },

  showMemberProfile: function(userId) {
    // 创建或打开与该用户的私聊
    this.startDirectMessageWith(userId);
  },

  startDirectMessageWith: async function(userId) {
    try {
      // 检查是否已经有与该用户的私聊房间
      const existingRoom = this.state.rooms.find(room =>
        room.type === 'direct' && room.members &&
        room.members.some(member => member.userId === userId)
      );

      if (existingRoom) {
        // 如果已存在，直接选择该房间
        this.selectRoom(existingRoom.id);
        return;
      }

      // 如果不存在，创建新的私聊房间
      if (this.state.accessToken) {
        const result = await this.createDirectMessage(this.state.accessToken, userId);
        if (result.success) {
          // 刷新房间列表和直接消息
          const [roomsData, directData] = await Promise.all([
            this.getUserRooms(this.state.accessToken),
            this.getDirectMessages(this.state.accessToken, this.state.user.id)
          ]);
          const { rooms, directMessages, spaces, allRooms } = this.processRooms(roomsData.rooms, directData);
          this.updateState({
            rooms: rooms,
            directMessages: directMessages,
            spaces: spaces || [],
            allRooms: allRooms
          });

          // 选择新创建的房间
          const allRoomsList = [...rooms, ...directMessages];
          const newRoom = allRoomsList.find(r => r.id === result.room_id);
          if (newRoom) {
            this.selectRoom(newRoom.id);
          }
        } else {
          this.showNotification('Failed to start direct message', 'error');
        }
      }
    } catch (error) {
      console.error('Failed to start direct message:', error);
      this.showNotification('Failed to start direct message', 'error');
    }
  },

  showNotifications: function() {
    this.updateState({ showUserMenu: false });
    this.rerender();
    this.showNotification('Notifications settings coming soon', 'info');
  },

  showPrivacySecurity: function() {
    this.updateState({ showUserMenu: false });
    this.rerender();
    this.showNotification('Privacy & Security settings coming soon', 'info');
  },

  showAllSettings: function() {
    this.updateState({ showUserMenu: false });
    this.rerender();
    this.showNotification('Settings coming soon', 'info');
  },

  showFeedback: function() {
    this.updateState({ showUserMenu: false });
    this.rerender();
    this.showNotification('Feedback feature coming soon', 'info');
  },

  // Placeholder methods for other actions
  addServer: function() { console.log('Add server'); },
  showSearch: function() { console.log('Show search'); },
  startDirectMessage: function() { console.log('Start direct message'); },
  exploreRooms: function() { console.log('Explore rooms'); },
  createRoom: function() { console.log('Create room'); },
  showServerMenu: function() { console.log('Show server menu'); },
  createChannel: function() { console.log('Create channel'); },
  createVoiceChannel: function() { console.log('Create voice channel'); },
  joinVoiceChannel: function(roomId) { console.log('Join voice channel:', roomId); },
  showMemberProfile: function(memberId) { console.log('Show member profile:', memberId); },
  toggleRoomInfo: function() { console.log('Toggle room info'); },
  showRoomSettings: function() { console.log('Show room settings'); },
  showAttachMenu: function() { console.log('Show attach menu'); },
  showEmojiPicker: function() { console.log('Show emoji picker'); },

  // State management
  updateState: function(newState) {
    this.state = { ...this.state, ...newState };
  },

  rerender: function() {
    const container = document.getElementById('matrix-client-container') ||
                    document.getElementById('matrix-login-container');
    if (container && container.parentElement) {
      const props = { extension: this.extension };
      container.parentElement.innerHTML = this.render(props);
      this.setupEventListeners();
    }
  },

  showNotification: function(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);
    // TODO: Implement proper notification system
  },

  // Component lifecycle methods
  onMount: function(element, props) {
    console.log('Matrix Client UI mounted', props);
    this.extension = props.extension;

    // Make this instance globally accessible for onclick handlers
    window.MatrixClientMain = this;

    this.setupEventListeners();
    this.loadInitialData();
  },

  onUnmount: function(element, props) {
    console.log('Matrix Client UI unmounted', props);
    this.cleanup();
  },

  setupEventListeners: function() {
    const self = this;

    // Login form event listeners
    const continueBtn = document.getElementById('continue-btn');
    if (continueBtn) {
      continueBtn.addEventListener('click', function() {
        self.continueToCredentials();
      });
    }

    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', function() {
        self.backToServer();
      });
    }

    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
      loginBtn.addEventListener('click', function() {
        self.performLogin();
      });
    }

    // Auto-resize textarea
    const messageInput = document.getElementById('message-input');
    if (messageInput) {
      messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
      });
    }

    // Send message on Enter key
    if (messageInput) {
      messageInput.addEventListener('keydown', function(event) {
        self.handleMessageInput(event);
      });
    }

    // Send button
    const sendButton = document.getElementById('send-button');
    if (sendButton) {
      sendButton.addEventListener('click', function() {
        self.sendMessage();
      });
    }

    // User avatar click
    const userAvatar = document.getElementById('user-avatar');
    if (userAvatar) {
      userAvatar.addEventListener('click', function(event) {
        event.stopPropagation();
        self.toggleUserMenu();
      });
    }

    // Close user menu when clicking outside
    document.addEventListener('click', function(event) {
      const userMenu = document.getElementById('user-menu');
      const userAvatar = document.getElementById('user-avatar');

      if (userMenu && !userMenu.contains(event.target) && !userAvatar.contains(event.target)) {
        if (self.state.showUserMenu) {
          self.updateState({ showUserMenu: false });
          self.rerender();
        }
      }
    });
  },

  loadInitialData: function() {
    // Check if this is a fresh installation by checking plugin version
    const savedVersion = localStorage.getItem('matrix-client-version');
    const currentVersion = this.version;

    if (savedVersion !== currentVersion) {
      // Plugin was reinstalled or updated, clear all data
      localStorage.removeItem('matrix-client-state');
      localStorage.removeItem('matrix-client-version');
      localStorage.setItem('matrix-client-version', currentVersion);
      console.log('Matrix plugin reinstalled, cleared saved data');
      return;
    }

    // Load saved state from localStorage only if versions match
    const savedState = localStorage.getItem('matrix-client-state');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        // Only restore login state if we have valid credentials
        if (parsed.isLoggedIn && parsed.accessToken && parsed.user) {
          this.updateState(parsed);
          this.rerender();
        }
      } catch (error) {
        console.error('Failed to load saved state:', error);
        localStorage.removeItem('matrix-client-state');
      }
    }
  },

  getRoomMessages: async function(accessToken, roomId, limit = 50, fromToken = null) {
    try {
      const response = await fetch(`http://localhost:8000/api/message-proxy/element/room-messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          access_token: accessToken,
          room_id: roomId,
          limit: limit,
          from_token: fromToken
        })
      });

      if (response.ok) {
        const result = await response.json();
        return result.success ? result : { success: false };
      } else {
        return { success: false };
      }
    } catch (error) {
      console.error('Failed to get room messages:', error);
      return { success: false };
    }
  },

  showUserProfile: async function(userId) {
    try {
      console.log('Showing profile for user:', userId);

      // 获取详细用户信息
      const profileResult = await this.getUserProfileDetailed(this.state.accessToken, userId);
      console.log('Profile result:', profileResult);

      if (!profileResult.success) {
        console.error('Failed to get user profile:', profileResult);
        // 显示错误提示
        alert(`Failed to load profile for ${userId}. This user might not be accessible or the server returned an error.`);
        return;
      }

      const profileData = profileResult.data;

      // 创建Profile弹窗
      this.renderUserProfileModal(profileData);

    } catch (error) {
      console.error('Error showing user profile:', error);
      alert(`Error loading profile: ${error.message}`);
    }
  },

  renderUserProfileModal: function(profileData) {
    const isCurrentUser = profileData.user_id === this.state.user?.id;
    const isOnline = profileData.presence === 'online';
    const isAdmin = profileData.is_admin;

    // 创建模态框HTML
    const modalHtml = `
      <div id="userProfileModal" style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
      " onclick="MatrixClientMain.closeUserProfileModal(event)">
        <div style="
          background: #2a2a2a;
          border-radius: 12px;
          width: 400px;
          max-width: 90vw;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        " onclick="event.stopPropagation()">
          <!-- Header -->
          <div style="
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 20px;
            border-bottom: 1px solid #3a3a3a;
          ">
            <h2 style="
              margin: 0;
              color: #ffffff;
              font-size: 18px;
              font-weight: 600;
            ">Profile</h2>
            <button onclick="MatrixClientMain.closeUserProfileModal()" style="
              background: none;
              border: none;
              color: #888;
              font-size: 16px;
              cursor: pointer;
              padding: 4px;
              border-radius: 4px;
              display: flex;
              align-items: center;
              justify-content: center;
            " onmouseover="this.style.background='#3a3a3a'" onmouseout="this.style.background='none'">
              <svg width="16" height="16" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path>
              </svg>
            </button>
          </div>

          <!-- Profile Content -->
          <div style="padding: 24px 20px;">
            <!-- Avatar and Basic Info -->
            <div style="
              display: flex;
              flex-direction: column;
              align-items: center;
              text-align: center;
              margin-bottom: 24px;
            ">
              <div style="
                width: 80px;
                height: 80px;
                border-radius: 50%;
                background: ${profileData.avatar_url ? `url(${this.getMediaUrl(profileData.avatar_url)})` : 'linear-gradient(135deg, #0dbd8b, #17a2b8)'};
                background-size: cover;
                background-position: center;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 32px;
                margin-bottom: 16px;
              ">
                ${!profileData.avatar_url ? (profileData.display_name || profileData.user_id).charAt(0).toUpperCase() : ''}
              </div>

              <h3 style="
                margin: 0 0 8px 0;
                color: #ffffff;
                font-size: 24px;
                font-weight: 600;
              ">${profileData.display_name || profileData.user_id}</h3>

              <div style="
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 8px;
              ">
                <div style="
                  width: 12px;
                  height: 12px;
                  border-radius: 50%;
                  background: ${this.getPresenceColor(profileData.presence)};
                "></div>
                <span style="
                  color: #888;
                  font-size: 14px;
                ">${this.getPresenceText(profileData.presence)}</span>
                ${isAdmin ? '<span style="color: #ffd700; font-size: 12px; margin-left: 8px;">管理员</span>' : ''}
              </div>

              <div style="
                color: #888;
                font-size: 14px;
                font-family: monospace;
                background: #1a1a1a;
                padding: 4px 8px;
                border-radius: 4px;
                display: inline-flex;
                align-items: center;
                gap: 8px;
              ">
                ${profileData.user_id}
                <button onclick="MatrixClientMain.copyToClipboard('${profileData.user_id}')" style="
                  background: none;
                  border: none;
                  color: #888;
                  cursor: pointer;
                  padding: 2px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                " title="Copy user ID">
                  <svg width="12" height="12" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 9.50006C1 10.3285 1.67157 11.0001 2.5 11.0001H4L4 10.0001H2.5C2.22386 10.0001 2 9.7762 2 9.50006L2 2.50006C2 2.22392 2.22386 2.00006 2.5 2.00006L9.5 2.00006C9.77614 2.00006 10 2.22392 10 2.50006V4.00002L11 4.00002V2.50006C11 1.67163 10.3284 1.00006 9.5 1.00006H2.5C1.67157 1.00006 1 1.67163 1 2.50006V9.50006ZM5 4.00002C4.44772 4.00002 4 4.44774 4 5.00002V12.5C4 13.0523 4.44772 13.5 5 13.5H12.5C13.0523 13.5 13.5 13.0523 13.5 12.5V5.00002C13.5 4.44774 13.0523 4.00002 12.5 4.00002H5ZM5 5.00002H12.5V12.5H5V5.00002Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path>
                  </svg>
                </button>
              </div>
            </div>

            ${profileData.status_msg ? `
              <div style="
                background: #1a1a1a;
                padding: 12px;
                border-radius: 8px;
                margin-bottom: 24px;
                text-align: center;
              ">
                <div style="color: #888; font-size: 12px; margin-bottom: 4px;">Status</div>
                <div style="color: #ffffff; font-size: 14px;">${profileData.status_msg}</div>
              </div>
            ` : ''}

            <!-- Action Buttons -->
            <div style="
              display: flex;
              flex-direction: column;
              gap: 8px;
            ">
              ${!isCurrentUser ? `
                <button onclick="MatrixClientMain.startDirectMessageWithUser('${profileData.user_id}')" style="
                  background: #0dbd8b;
                  border: none;
                  color: white;
                  padding: 12px 16px;
                  border-radius: 8px;
                  cursor: pointer;
                  font-size: 14px;
                  font-weight: 500;
                  display: flex;
                  align-items: center;
                  gap: 8px;
                  justify-content: center;
                " onmouseover="this.style.background='#0aa876'" onmouseout="this.style.background='#0dbd8b'">
                  <svg width="16" height="16" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12.5 3L2.5 3.00002C1.67157 3.00002 1 3.6716 1 4.50002V9.50003C1 10.3285 1.67157 11 2.5 11H7.50003C7.63264 11 7.75982 10.9473 7.85358 10.8536L10.8536 7.85355C10.9473 7.75979 11 7.63261 11 7.5V4.50002C11 3.6716 10.3284 3 9.5 3H12.5ZM2.5 4.00002L9.5 4.00002C9.77614 4.00002 10 4.22388 10 4.50002V7.29291L7.70711 9.58579C7.61336 9.67955 7.48618 9.73223 7.35357 9.73223H2.5C2.22386 9.73223 2 9.50837 2 9.23223V4.50002C2 4.22388 2.22386 4.00002 2.5 4.00002Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path>
                  </svg>
                  Send message
                </button>

                <button onclick="MatrixClientMain.mentionUser('${profileData.user_id}')" style="
                  background: #3a3a3a;
                  border: none;
                  color: white;
                  padding: 12px 16px;
                  border-radius: 8px;
                  cursor: pointer;
                  font-size: 14px;
                  display: flex;
                  align-items: center;
                  gap: 8px;
                  justify-content: center;
                " onmouseover="this.style.background='#4a4a4a'" onmouseout="this.style.background='#3a3a3a'">
                  <svg width="16" height="16" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7.5 0.875C5.49797 0.875 3.875 2.49797 3.875 4.5C3.875 6.50203 5.49797 8.125 7.5 8.125C9.50203 8.125 11.125 6.50203 11.125 4.5C11.125 2.49797 9.50203 0.875 7.5 0.875ZM4.875 4.5C4.875 3.05025 6.05025 1.875 7.5 1.875C8.94975 1.875 10.125 3.05025 10.125 4.5C10.125 5.94975 8.94975 7.125 7.5 7.125C6.05025 7.125 4.875 5.94975 4.875 4.5ZM2.24112 10.9953C2.56271 10.0343 3.77001 9.375 7.5 9.375C11.23 9.375 12.4373 10.0343 12.7589 10.9953C12.8619 11.2704 12.8889 11.5128 12.8889 11.7222C12.8889 12.0243 12.8889 12.2889 12.8889 12.5C12.8889 12.9421 12.5421 13.2889 12.1 13.2889C11.6579 13.2889 11.3111 12.9421 11.3111 12.5C11.3111 12.2889 11.3111 12.0243 11.3111 11.7222C11.3111 11.5128 11.2841 11.2704 11.1811 10.9953C10.8595 10.0343 9.65199 9.375 7.5 9.375C5.34801 9.375 4.14049 10.0343 3.81889 10.9953C3.71591 11.2704 3.68889 11.5128 3.68889 11.7222C3.68889 12.0243 3.68889 12.2889 3.68889 12.5C3.68889 12.9421 3.34211 13.2889 2.9 13.2889C2.45789 13.2889 2.11111 12.9421 2.11111 12.5C2.11111 12.2889 2.11111 12.0243 2.11111 11.7222C2.11111 11.5128 2.13813 11.2704 2.24112 10.9953Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path>
                  </svg>
                  Mention
                </button>

                <button onclick="MatrixClientMain.shareUserProfile('${profileData.user_id}')" style="
                  background: #3a3a3a;
                  border: none;
                  color: white;
                  padding: 12px 16px;
                  border-radius: 8px;
                  cursor: pointer;
                  font-size: 14px;
                  display: flex;
                  align-items: center;
                  gap: 8px;
                  justify-content: center;
                " onmouseover="this.style.background='#4a4a4a'" onmouseout="this.style.background='#3a3a3a'">
                  <svg width="16" height="16" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8.69667 0.0403541C8.90859 0.131038 9.03106 0.354857 8.99316 0.582235L8.0902 6.00001H12.5C12.6893 6.00001 12.8625 6.10701 12.9472 6.27641C13.0319 6.4458 13.0136 6.6485 12.8999 6.80001L6.89997 14.8C6.76167 14.9844 6.51521 15.0503 6.30328 14.9597C6.09135 14.869 5.96888 14.6452 6.00678 14.4178L6.90974 9H2.49999C2.31061 9 2.13748 8.893 2.05278 8.72361C1.96809 8.55422 1.98636 8.35151 2.09999 8.2L8.09997 0.200038C8.23828 0.0156255 8.48474 -0.0503301 8.69667 0.0403541ZM3.49999 8.00001H7.49997C7.64695 8.00001 7.78648 8.06467 7.88148 8.17682C7.97648 8.28896 8.01733 8.43723 7.99317 8.5822L7.33027 12.5596L11.5 7.00001H7.49997C7.353 7.00001 7.21347 6.93534 7.11847 6.8232C7.02347 6.71105 6.98262 6.56279 7.00678 6.41781L7.66968 2.44042L3.49999 8.00001Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path>
                  </svg>
                  Share profile
                </button>

                <button onclick="MatrixClientMain.toggleIgnoreUser('${profileData.user_id}')" style="
                  background: #d32f2f;
                  border: none;
                  color: white;
                  padding: 12px 16px;
                  border-radius: 8px;
                  cursor: pointer;
                  font-size: 14px;
                  display: flex;
                  align-items: center;
                  gap: 8px;
                  justify-content: center;
                " onmouseover="this.style.background='#b71c1c'" onmouseout="this.style.background='#d32f2f'">
                  <svg width="16" height="16" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0.877075 7.49988C0.877075 3.84219 3.84222 0.877045 7.49991 0.877045C11.1576 0.877045 14.1227 3.84219 14.1227 7.49988C14.1227 11.1575 11.1576 14.1227 7.49991 14.1227C3.84222 14.1227 0.877075 11.1575 0.877075 7.49988ZM7.49991 1.82704C4.36689 1.82704 1.82708 4.36686 1.82708 7.49988C1.82708 10.6329 4.36689 13.1727 7.49991 13.1727C10.6329 13.1727 13.1727 10.6329 13.1727 7.49988C13.1727 4.36686 10.6329 1.82704 7.49991 1.82704ZM4.50003 7.49998C4.22389 7.49998 4.00003 7.72384 4.00003 7.99998C4.00003 8.27612 4.22389 8.49998 4.50003 8.49998H10.5C10.7762 8.49998 11 8.27612 11 7.99998C11 7.72384 10.7762 7.49998 10.5 7.49998H4.50003Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path>
                  </svg>
                  Ignore
                </button>
              ` : `
                <div style="
                  text-align: center;
                  color: #888;
                  font-size: 14px;
                  padding: 20px;
                ">
                  This is your profile
                </div>
              `}
            </div>
          </div>
        </div>
      </div>
    `;

    // 添加到页面
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  },

  closeUserProfileModal: function(event) {
    if (event && event.target !== event.currentTarget) {
      return; // 只有点击背景时才关闭
    }

    const modal = document.getElementById('userProfileModal');
    if (modal) {
      modal.remove();
    }
  },

  getPresenceText: function(presence) {
    switch (presence) {
      case 'online': return 'Online';
      case 'offline': return 'Offline';
      case 'unavailable': return 'Away';
      default: return 'Unknown';
    }
  },

  copyToClipboard: function(text) {
    navigator.clipboard.writeText(text).then(() => {
      // 简单的提示
      const button = event.target;
      const originalText = button.textContent;
      button.textContent = '✓';
      setTimeout(() => {
        button.textContent = originalText;
      }, 1000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  },

  startDirectMessageWithUser: async function(userId) {
    try {
      console.log('Starting direct message with:', userId);

      // 关闭Profile弹窗
      this.closeUserProfileModal();

      // 创建或找到直接消息房间
      const result = await this.createDirectMessage(this.state.accessToken, userId);

      if (result.success && result.room_id) {
        // 选择该房间
        this.selectRoom(result.room_id);
        console.log('Direct message room created/selected:', result.room_id);
      } else {
        console.error('Failed to create direct message room:', result);
      }

    } catch (error) {
      console.error('Error starting direct message:', error);
    }
  },

  mentionUser: function(userId) {
    // 在当前聊天输入框中添加@mention
    const chatInput = document.querySelector('.matrix-ui__chat-input input');
    if (chatInput) {
      const currentValue = chatInput.value;
      const mention = `@${userId} `;
      chatInput.value = currentValue + mention;
      chatInput.focus();
    }

    this.closeUserProfileModal();
  },

  shareUserProfile: function(userId) {
    // 复制用户Profile链接到剪贴板
    const profileLink = `https://matrix.to/#/${userId}`;
    this.copyToClipboard(profileLink);

    // 显示提示
    console.log('Profile link copied to clipboard:', profileLink);

    this.closeUserProfileModal();
  },

  // Set active tab for space panel
  setActiveTab: function(tab) {
    this.updateState({ activeTab: tab });
    this.rerender();
  },

  // Render space-specific people content
  renderSpacePeopleContent: function(space, members = []) {
    console.log('Rendering space people content:', space?.name, 'members:', members);

    if (!members || members.length === 0) {
      return `
        <div style="
          padding: 16px;
          text-align: center;
          color: #888;
        ">
          <div style="margin-bottom: 8px;">No members found</div>
          <div style="font-size: 12px;">This space has no members or member data is not available.</div>
        </div>
      `;
    }

    return `
      <div style="padding: 16px;">
        <div style="
          font-size: 12px;
          font-weight: 600;
          color: #888;
          text-transform: uppercase;
          margin-bottom: 12px;
          letter-spacing: 0.5px;
        ">Members (${members.length})</div>

        <div style="
          display: flex;
          flex-direction: column;
          gap: 4px;
        ">
          ${members.map(member => `
            <div style="
              padding: 8px 12px;
              border-radius: 8px;
              cursor: pointer;
              transition: background-color 0.2s;
              display: flex;
              align-items: center;
              gap: 12px;
            " onmouseover="this.style.background='#3a3a3a'"
               onmouseout="this.style.background='transparent'"
               onclick="MatrixClientMain.showUserProfile('${member.user_id}')">
              <div style="
                width: 24px;
                height: 24px;
                border-radius: 50%;
                ${!member.avatar_url ? `background: ${this.generateUserColor(member.user_id)};` : ''}
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 12px;
                color: white;
                flex-shrink: 0;
                overflow: hidden;
              ">
                ${member.avatar_url ?
                  this.createAuthenticatedImage(
                    member.avatar_url,
                    (member.display_name?.[0] || member.user_id?.[1] || 'U').toUpperCase(),
                    '',
                    'width: 100%; height: 100%; object-fit: cover; border-radius: 50%;'
                  ) :
                  (member.display_name?.[0] || member.user_id?.[1] || 'U').toUpperCase()
                }
              </div>
              <div style="
                flex: 1;
                min-width: 0;
              ">
                <div style="
                  font-weight: 500;
                  font-size: 14px;
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
                ">${member.display_name || member.user_id}</div>
                <div style="
                  font-size: 12px;
                  color: #888;
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
                ">${member.user_id}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  // Render space-specific rooms content
  renderSpaceRoomsContent: function(space) {
    if (!space || !space.childRooms || space.childRooms.length === 0) {
      return `
        <div style="
          padding: 16px;
          text-align: center;
          color: #888;
        ">
          <div style="margin-bottom: 8px;">No rooms found</div>
          <div style="font-size: 12px;">This space has no child rooms.</div>
        </div>
      `;
    }

    return `
      <div style="padding: 16px;">
        <div style="
          font-size: 12px;
          font-weight: 600;
          color: #888;
          text-transform: uppercase;
          margin-bottom: 12px;
          letter-spacing: 0.5px;
        ">Rooms (${space.childRooms.length})</div>

        <div style="
          display: flex;
          flex-direction: column;
          gap: 4px;
        ">
          ${space.childRooms.map(room => `
            <div style="
              padding: 8px 12px;
              border-radius: 8px;
              cursor: pointer;
              transition: background-color 0.2s;
              display: flex;
              align-items: center;
              gap: 12px;
              ${this.state.selectedRoom?.id === room.id ? 'background: #4a9eff;' : ''}
            " onclick="MatrixClientMain.selectRoom('${room.id}')"
               onmouseover="if('${this.state.selectedRoom?.id}' !== '${room.id}') this.style.background='#3a3a3a'"
               onmouseout="if('${this.state.selectedRoom?.id}' !== '${room.id}') this.style.background='transparent'">
              <div style="
                width: 24px;
                height: 24px;
                border-radius: 50%;
                ${!room.avatar ? `background: ${this.generateUserColor(room.id)};` : ''}
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 12px;
                color: white;
                flex-shrink: 0;
                overflow: hidden;
              ">
                ${room.avatar ?
                  this.createAuthenticatedImage(
                    room.avatar,
                    (room.name?.[0] || 'R').toUpperCase(),
                    '',
                    'width: 100%; height: 100%; object-fit: cover; border-radius: 50%;'
                  ) :
                  (room.name?.[0] || 'R').toUpperCase()
                }
              </div>
              <div style="
                flex: 1;
                min-width: 0;
              ">
                <div style="
                  font-weight: 500;
                  font-size: 14px;
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
                ">${room.name}</div>
                ${room.topic ? `
                  <div style="
                    font-size: 12px;
                    color: #888;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                  ">${room.topic}</div>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  // Show space settings
  showSpaceSettings: function(spaceId) {
    console.log('Show space settings for:', spaceId);
    // TODO: Implement space settings modal
  },

  // Generate consistent user color based on user ID
  generateUserColor: function(userId) {
    const colors = [
      '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3',
      '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a',
      '#cddc39', '#ffc107', '#ff9800', '#ff5722', '#795548'
    ];

    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  },

  // Get user display color
  getUserDisplayColor: function(userId, isOwnMessage) {
    if (isOwnMessage) {
      return '#0dbd8b';
    }
    return this.generateUserColor(userId);
  },

  // Format file size
  formatFileSize: function(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Message interaction functions
  addReaction: function(messageId, emoji) {
    console.log('Add reaction:', messageId, emoji);
    // TODO: Implement reaction functionality
  },

  toggleReaction: function(messageId, emoji) {
    console.log('Toggle reaction:', messageId, emoji);
    // TODO: Implement reaction toggle
  },

  replyToMessage: function(messageId) {
    console.log('Reply to message:', messageId);
    // TODO: Implement reply functionality
  },

  editMessage: function(messageId) {
    console.log('Edit message:', messageId);
    // TODO: Implement message editing
  },

  openImageModal: function(imageUrl, altText) {
    console.log('Open image modal:', imageUrl, altText);
    // TODO: Implement image modal
  },



  toggleIgnoreUser: async function(userId) {
    try {
      const result = await this.ignoreUser(this.state.accessToken, userId, true);

      if (result.success) {
        console.log('User ignored successfully:', userId);
        // 可以添加UI反馈
      } else {
        console.error('Failed to ignore user:', result);
      }

      this.closeUserProfileModal();

    } catch (error) {
      console.error('Error ignoring user:', error);
    }
  },

  getMediaUrl: function(mxcUrl) {
    if (!mxcUrl || !mxcUrl.startsWith('mxc://')) {
      console.log('Not an mxc URL:', mxcUrl);
      return mxcUrl;
    }

    // Use backend proxy for media requests to handle authentication
    const proxyUrl = `http://localhost:8000/api/message-proxy/element/media-proxy?access_token=${this.state.accessToken}&mxc_url=${encodeURIComponent(mxcUrl)}`;
    console.log('Using backend proxy for media:', mxcUrl, '->', proxyUrl);
    return proxyUrl;
  },

  // Create an authenticated image element that handles Matrix media properly
  createAuthenticatedImage: function(mxcUrl, fallbackContent = '', className = '', style = '') {
    if (!mxcUrl || !mxcUrl.startsWith('mxc://')) {
      return fallbackContent;
    }

    const imageUrl = this.getMediaUrl(mxcUrl);
    const imageId = 'img_' + Math.random().toString(36).substr(2, 9);

    console.log('Creating authenticated image:', mxcUrl, '->', imageUrl);

    // Create image element that will load via backend proxy
    setTimeout(() => {
      const img = document.getElementById(imageId);
      if (img) {
        img.onload = () => {
          console.log('✅ Image loaded successfully via backend proxy:', mxcUrl);
        };
        img.onerror = () => {
          console.error('❌ Image failed to load via backend proxy:', mxcUrl);
          this.fallbackToLetterAvatar(img, fallbackContent);
        };
        // Set the src to trigger the load via backend proxy
        img.src = imageUrl;
      }
    }, 0);

    return `<img id="${imageId}" class="${className}" style="${style}" alt="Avatar" />`;
  },

  // Helper function to show letter avatar when image fails
  fallbackToLetterAvatar: function(img, fallbackContent) {
    if (img && img.parentElement && fallbackContent) {
      img.style.display = 'none';
      img.parentElement.innerHTML = fallbackContent;
      img.parentElement.style.display = 'flex';
      img.parentElement.style.alignItems = 'center';
      img.parentElement.style.justifyContent = 'center';
    }
  },

  getPresenceColor: function(presence) {
    switch (presence) {
      case 'online': return '#4caf50';
      case 'unavailable': return '#ff9800';
      case 'offline':
      default: return '#757575';
    }
  },

  saveState: function() {
    // Save important state to localStorage
    const stateToSave = {
      homeserver: this.state.homeserver,
      isLoggedIn: this.state.isLoggedIn,
      user: this.state.user,
      servers: this.state.servers,
      rooms: this.state.rooms,
      directMessages: this.state.directMessages
    };

    try {
      localStorage.setItem('matrix-client-state', JSON.stringify(stateToSave));
    } catch (error) {
      console.error('Failed to save state:', error);
    }
  },

  cleanup: function() {
    // Save state before cleanup
    this.saveState();

    // Clear any intervals or timeouts
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
  }
};

// Export the component
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MatrixClientMain;
}
