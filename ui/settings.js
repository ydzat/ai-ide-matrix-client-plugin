// Matrix Settings Panel Component
// Configuration interface for Matrix client settings

const MatrixSettingsPanel = {
  name: 'MatrixSettingsPanel',
  version: '0.1.0',
  
  // Component state
  state: {
    settings: {
      homeserver: 'https://matrix.org',
      accessToken: '',
      userId: '',
      deviceId: 'ai-ide-matrix-client',
      autoConnect: false,
      showNotifications: true,
      encryptionEnabled: true,
      syncTimeout: 30000,
      theme: 'dark'
    },
    isLoading: false,
    isSaving: false,
    hasChanges: false,
    connectionStatus: 'disconnected',
    validationErrors: {}
  },
  
  // Render the settings panel
  render: function(props) {
    const { extension } = props;
    const state = this.state;
    
    return `
      <div id="matrix-settings-panel" style="
        height: 100%;
        overflow-y: auto;
        background-color: #1e1e1e;
        color: #cccccc;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      ">
        <!-- Header -->
        <div style="
          padding: 24px;
          border-bottom: 1px solid #3e3e42;
          background-color: #2d2d30;
        ">
          <div style="
            display: flex;
            align-items: center;
            justify-content: space-between;
          ">
            <div>
              <h2 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 600;">
                Matrix Client Settings
              </h2>
              <p style="margin: 0; color: #888; font-size: 14px;">
                Configure your Matrix connection and preferences
              </p>
            </div>
            
            <div style="
              padding: 8px 12px;
              background-color: ${state.connectionStatus === 'connected' ? '#28a745' : '#dc3545'};
              color: white;
              border-radius: 4px;
              font-size: 12px;
              font-weight: 500;
            ">
              ${state.connectionStatus === 'connected' ? '🟢 Connected' : '🔴 Disconnected'}
            </div>
          </div>
        </div>
        
        <!-- Settings Form -->
        <div style="padding: 24px;">
          <form id="matrix-settings-form" onsubmit="MatrixSettingsPanel.handleSubmit(event)">
            
            <!-- Connection Settings -->
            <div style="margin-bottom: 32px;">
              <h3 style="
                margin: 0 0 16px 0;
                font-size: 18px;
                font-weight: 600;
                color: #ffffff;
                border-bottom: 1px solid #3e3e42;
                padding-bottom: 8px;
              ">
                🔗 Connection Settings
              </h3>
              
              <!-- Homeserver -->
              <div style="margin-bottom: 16px;">
                <label style="
                  display: block;
                  margin-bottom: 6px;
                  font-weight: 500;
                  color: #ffffff;
                ">
                  Homeserver URL *
                </label>
                <input 
                  type="url"
                  id="homeserver"
                  value="${state.settings.homeserver}"
                  placeholder="https://matrix.org"
                  style="
                    width: 100%;
                    padding: 12px;
                    background-color: #252526;
                    border: 1px solid ${state.validationErrors.homeserver ? '#dc3545' : '#3e3e42'};
                    border-radius: 6px;
                    color: #cccccc;
                    font-size: 14px;
                    outline: none;
                  "
                  oninput="MatrixSettingsPanel.handleInputChange('homeserver', event)"
                  onfocus="this.style.borderColor='#007acc'"
                  onblur="this.style.borderColor='${state.validationErrors.homeserver ? '#dc3545' : '#3e3e42'}'"
                  required
                />
                ${state.validationErrors.homeserver ? `
                  <div style="color: #dc3545; font-size: 12px; margin-top: 4px;">
                    ${state.validationErrors.homeserver}
                  </div>
                ` : ''}
                <div style="color: #888; font-size: 12px; margin-top: 4px;">
                  The Matrix homeserver to connect to (e.g., https://matrix.org)
                </div>
              </div>
              
              <!-- Access Token -->
              <div style="margin-bottom: 16px;">
                <label style="
                  display: block;
                  margin-bottom: 6px;
                  font-weight: 500;
                  color: #ffffff;
                ">
                  Access Token *
                </label>
                <div style="position: relative;">
                  <input 
                    type="password"
                    id="accessToken"
                    value="${state.settings.accessToken}"
                    placeholder="syt_..."
                    style="
                      width: 100%;
                      padding: 12px 40px 12px 12px;
                      background-color: #252526;
                      border: 1px solid ${state.validationErrors.accessToken ? '#dc3545' : '#3e3e42'};
                      border-radius: 6px;
                      color: #cccccc;
                      font-size: 14px;
                      outline: none;
                    "
                    oninput="MatrixSettingsPanel.handleInputChange('accessToken', event)"
                    onfocus="this.style.borderColor='#007acc'"
                    onblur="this.style.borderColor='${state.validationErrors.accessToken ? '#dc3545' : '#3e3e42'}'"
                    required
                  />
                  <button 
                    type="button"
                    onclick="MatrixSettingsPanel.togglePasswordVisibility('accessToken')"
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
                ${state.validationErrors.accessToken ? `
                  <div style="color: #dc3545; font-size: 12px; margin-top: 4px;">
                    ${state.validationErrors.accessToken}
                  </div>
                ` : ''}
                <div style="color: #888; font-size: 12px; margin-top: 4px;">
                  Your Matrix access token. Get this from Element → Settings → Help & About → Advanced
                </div>
              </div>
              
              <!-- User ID -->
              <div style="margin-bottom: 16px;">
                <label style="
                  display: block;
                  margin-bottom: 6px;
                  font-weight: 500;
                  color: #ffffff;
                ">
                  User ID *
                </label>
                <input 
                  type="text"
                  id="userId"
                  value="${state.settings.userId}"
                  placeholder="@username:matrix.org"
                  style="
                    width: 100%;
                    padding: 12px;
                    background-color: #252526;
                    border: 1px solid ${state.validationErrors.userId ? '#dc3545' : '#3e3e42'};
                    border-radius: 6px;
                    color: #cccccc;
                    font-size: 14px;
                    outline: none;
                  "
                  oninput="MatrixSettingsPanel.handleInputChange('userId', event)"
                  onfocus="this.style.borderColor='#007acc'"
                  onblur="this.style.borderColor='${state.validationErrors.userId ? '#dc3545' : '#3e3e42'}'"
                  required
                />
                ${state.validationErrors.userId ? `
                  <div style="color: #dc3545; font-size: 12px; margin-top: 4px;">
                    ${state.validationErrors.userId}
                  </div>
                ` : ''}
                <div style="color: #888; font-size: 12px; margin-top: 4px;">
                  Your Matrix user ID (e.g., @username:matrix.org)
                </div>
              </div>
              
              <!-- Device ID -->
              <div style="margin-bottom: 16px;">
                <label style="
                  display: block;
                  margin-bottom: 6px;
                  font-weight: 500;
                  color: #ffffff;
                ">
                  Device ID
                </label>
                <input 
                  type="text"
                  id="deviceId"
                  value="${state.settings.deviceId}"
                  placeholder="ai-ide-matrix-client"
                  style="
                    width: 100%;
                    padding: 12px;
                    background-color: #252526;
                    border: 1px solid #3e3e42;
                    border-radius: 6px;
                    color: #cccccc;
                    font-size: 14px;
                    outline: none;
                  "
                  oninput="MatrixSettingsPanel.handleInputChange('deviceId', event)"
                  onfocus="this.style.borderColor='#007acc'"
                  onblur="this.style.borderColor='#3e3e42'"
                />
                <div style="color: #888; font-size: 12px; margin-top: 4px;">
                  Unique identifier for this Matrix client instance
                </div>
              </div>
            </div>
            
            <!-- Behavior Settings -->
            <div style="margin-bottom: 32px;">
              <h3 style="
                margin: 0 0 16px 0;
                font-size: 18px;
                font-weight: 600;
                color: #ffffff;
                border-bottom: 1px solid #3e3e42;
                padding-bottom: 8px;
              ">
                ⚙️ Behavior Settings
              </h3>
              
              ${this.renderCheckboxSetting('autoConnect', 'Auto-connect on startup', 'Automatically connect to Matrix when the plugin loads')}
              ${this.renderCheckboxSetting('showNotifications', 'Show notifications', 'Display desktop notifications for new messages')}
              ${this.renderCheckboxSetting('encryptionEnabled', 'Enable encryption', 'Use end-to-end encryption for secure messaging')}
            </div>
            
            <!-- Advanced Settings -->
            <div style="margin-bottom: 32px;">
              <h3 style="
                margin: 0 0 16px 0;
                font-size: 18px;
                font-weight: 600;
                color: #ffffff;
                border-bottom: 1px solid #3e3e42;
                padding-bottom: 8px;
              ">
                🔧 Advanced Settings
              </h3>
              
              <!-- Sync Timeout -->
              <div style="margin-bottom: 16px;">
                <label style="
                  display: block;
                  margin-bottom: 6px;
                  font-weight: 500;
                  color: #ffffff;
                ">
                  Sync Timeout (ms)
                </label>
                <input 
                  type="number"
                  id="syncTimeout"
                  value="${state.settings.syncTimeout}"
                  min="1000"
                  max="60000"
                  step="1000"
                  style="
                    width: 100%;
                    padding: 12px;
                    background-color: #252526;
                    border: 1px solid #3e3e42;
                    border-radius: 6px;
                    color: #cccccc;
                    font-size: 14px;
                    outline: none;
                  "
                  oninput="MatrixSettingsPanel.handleInputChange('syncTimeout', event)"
                  onfocus="this.style.borderColor='#007acc'"
                  onblur="this.style.borderColor='#3e3e42'"
                />
                <div style="color: #888; font-size: 12px; margin-top: 4px;">
                  How long to wait for sync responses (1000-60000ms)
                </div>
              </div>
            </div>
            
            <!-- Action Buttons -->
            <div style="
              display: flex;
              gap: 12px;
              padding-top: 24px;
              border-top: 1px solid #3e3e42;
            ">
              <button 
                type="submit"
                style="
                  padding: 12px 24px;
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
                ${state.isSaving ? 'disabled' : ''}
              >
                ${state.isSaving ? 'Saving...' : 'Save Settings'}
              </button>
              
              <button 
                type="button"
                onclick="MatrixSettingsPanel.testConnection()"
                style="
                  padding: 12px 24px;
                  background-color: #28a745;
                  color: white;
                  border: none;
                  border-radius: 6px;
                  cursor: pointer;
                  font-size: 14px;
                  font-weight: 500;
                  transition: background-color 0.2s;
                "
                onmouseover="this.style.backgroundColor='#218838'"
                onmouseout="this.style.backgroundColor='#28a745'"
                ${!state.settings.homeserver || !state.settings.accessToken ? 'disabled' : ''}
              >
                Test Connection
              </button>
              
              <button 
                type="button"
                onclick="MatrixSettingsPanel.resetToDefaults()"
                style="
                  padding: 12px 24px;
                  background-color: #6c757d;
                  color: white;
                  border: none;
                  border-radius: 6px;
                  cursor: pointer;
                  font-size: 14px;
                  font-weight: 500;
                  transition: background-color 0.2s;
                "
                onmouseover="this.style.backgroundColor='#5a6268'"
                onmouseout="this.style.backgroundColor='#6c757d'"
              >
                Reset to Defaults
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  },
  
  // Render checkbox setting
  renderCheckboxSetting: function(key, label, description) {
    const checked = this.state.settings[key];
    
    return `
      <div style="margin-bottom: 16px;">
        <label style="
          display: flex;
          align-items: center;
          cursor: pointer;
          user-select: none;
        ">
          <input 
            type="checkbox"
            id="${key}"
            ${checked ? 'checked' : ''}
            style="
              margin-right: 12px;
              width: 16px;
              height: 16px;
              accent-color: #007acc;
            "
            onchange="MatrixSettingsPanel.handleCheckboxChange('${key}', event)"
          />
          <div>
            <div style="
              font-weight: 500;
              color: #ffffff;
              margin-bottom: 4px;
            ">
              ${label}
            </div>
            <div style="
              color: #888;
              font-size: 12px;
            ">
              ${description}
            </div>
          </div>
        </label>
      </div>
    `;
  },

  // Component lifecycle
  onMount: function(element, props) {
    console.log('Matrix Settings Panel mounted', props);
    this.initializeAPI();
    this.loadSettings();
  },

  onUnmount: function(element, props) {
    console.log('Matrix Settings Panel unmounted');
    this.cleanup();
  },

  // Initialize API
  initializeAPI: function() {
    window.MatrixSettingsPanel = {
      handleSubmit: this.handleSubmit.bind(this),
      handleInputChange: this.handleInputChange.bind(this),
      handleCheckboxChange: this.handleCheckboxChange.bind(this),
      togglePasswordVisibility: this.togglePasswordVisibility.bind(this),
      testConnection: this.testConnection.bind(this),
      resetToDefaults: this.resetToDefaults.bind(this)
    };
  },

  // Load settings from backend/storage
  loadSettings: async function() {
    this.updateState({ isLoading: true });

    try {
      // TODO: Load settings from backend or VSCode configuration
      // For now, use default values
      const defaultSettings = {
        homeserver: 'https://matrix.org',
        accessToken: '',
        userId: '',
        deviceId: 'ai-ide-matrix-client',
        autoConnect: false,
        showNotifications: true,
        encryptionEnabled: true,
        syncTimeout: 30000,
        theme: 'dark'
      };

      this.updateState({
        settings: defaultSettings,
        isLoading: false
      });

    } catch (error) {
      console.error('Failed to load settings:', error);
      this.updateState({ isLoading: false });
      this.showNotification('Failed to load settings', 'error');
    }
  },

  // Form handling
  handleSubmit: async function(event) {
    event.preventDefault();

    if (!this.validateSettings()) {
      return;
    }

    this.updateState({ isSaving: true });

    try {
      // TODO: Save settings to backend/VSCode configuration
      await this.saveSettings();

      this.updateState({
        isSaving: false,
        hasChanges: false
      });

      this.showNotification('Settings saved successfully!', 'success');

    } catch (error) {
      console.error('Failed to save settings:', error);
      this.updateState({ isSaving: false });
      this.showNotification('Failed to save settings', 'error');
    }
  },

  handleInputChange: function(key, event) {
    const value = event.target.value;

    this.updateState({
      settings: {
        ...this.state.settings,
        [key]: key === 'syncTimeout' ? parseInt(value) || 30000 : value
      },
      hasChanges: true,
      validationErrors: {
        ...this.state.validationErrors,
        [key]: null // Clear validation error for this field
      }
    });
  },

  handleCheckboxChange: function(key, event) {
    const checked = event.target.checked;

    this.updateState({
      settings: {
        ...this.state.settings,
        [key]: checked
      },
      hasChanges: true
    });
  },

  togglePasswordVisibility: function(fieldId) {
    const field = document.getElementById(fieldId);
    if (field) {
      field.type = field.type === 'password' ? 'text' : 'password';
    }
  },

  // Validation
  validateSettings: function() {
    const errors = {};
    const settings = this.state.settings;

    // Validate homeserver
    if (!settings.homeserver) {
      errors.homeserver = 'Homeserver URL is required';
    } else if (!this.isValidUrl(settings.homeserver)) {
      errors.homeserver = 'Please enter a valid URL';
    }

    // Validate access token
    if (!settings.accessToken) {
      errors.accessToken = 'Access token is required';
    } else if (settings.accessToken.length < 10) {
      errors.accessToken = 'Access token appears to be too short';
    }

    // Validate user ID
    if (!settings.userId) {
      errors.userId = 'User ID is required';
    } else if (!settings.userId.match(/^@[^:]+:[^:]+$/)) {
      errors.userId = 'User ID must be in format @username:domain';
    }

    this.updateState({ validationErrors: errors });

    return Object.keys(errors).length === 0;
  },

  isValidUrl: function(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  },

  // Actions
  testConnection: async function() {
    if (!this.validateSettings()) {
      this.showNotification('Please fix validation errors first', 'error');
      return;
    }

    this.showNotification('Testing connection...', 'info');

    try {
      // TODO: Test connection with current settings
      // For now, simulate a test
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock success/failure
      const success = Math.random() > 0.3; // 70% success rate for demo

      if (success) {
        this.updateState({ connectionStatus: 'connected' });
        this.showNotification('Connection test successful!', 'success');
      } else {
        this.updateState({ connectionStatus: 'disconnected' });
        this.showNotification('Connection test failed. Please check your settings.', 'error');
      }

    } catch (error) {
      console.error('Connection test failed:', error);
      this.updateState({ connectionStatus: 'disconnected' });
      this.showNotification('Connection test failed', 'error');
    }
  },

  resetToDefaults: function() {
    if (confirm('Are you sure you want to reset all settings to defaults? This will lose any unsaved changes.')) {
      const defaultSettings = {
        homeserver: 'https://matrix.org',
        accessToken: '',
        userId: '',
        deviceId: 'ai-ide-matrix-client',
        autoConnect: false,
        showNotifications: true,
        encryptionEnabled: true,
        syncTimeout: 30000,
        theme: 'dark'
      };

      this.updateState({
        settings: defaultSettings,
        hasChanges: true,
        validationErrors: {}
      });

      this.showNotification('Settings reset to defaults', 'info');
    }
  },

  // Save settings
  saveSettings: async function() {
    // TODO: Implement actual saving to backend/VSCode configuration
    // For now, just simulate saving
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Store in localStorage as fallback
    try {
      localStorage.setItem('matrix-client-settings', JSON.stringify(this.state.settings));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
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
    const container = document.getElementById('matrix-settings-panel');
    if (container) {
      container.outerHTML = this.render({ extension: { name: 'Matrix Settings' } });
      this.initializeAPI();
    }
  },

  cleanup: function() {
    if (window.MatrixSettingsPanel) {
      delete window.MatrixSettingsPanel;
    }
  }
};

// Export component
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MatrixSettingsPanel;
} else if (typeof window !== 'undefined') {
  window.MatrixSettingsPanel = MatrixSettingsPanel;
}
