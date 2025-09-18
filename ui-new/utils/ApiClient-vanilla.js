/**
 * Matrix API Client - Vanilla JavaScript Version
 * Handles all communication with the Matrix message proxy backend
 */

(function() {
  'use strict';

  class ApiClient {
    constructor() {
      this.baseURL = 'http://localhost:8000/api/message-proxy/element';
      this.isAuthenticated = false;
      this.accessToken = null;
      this.userId = null;
      this.deviceId = null;
      this.homeserver = null;
      this.sessionKey = 'matrix_client_session';
      this.pluginInstallKey = 'matrix_plugin_install_id';

      // Check if this is a fresh plugin installation
      // Use a more reliable method to detect fresh installations
      const sessionExists = localStorage.getItem(this.sessionKey);
      const installIdExists = localStorage.getItem(this.pluginInstallKey);

      if (!sessionExists && !installIdExists) {
        // Truly fresh installation - no session and no install ID
        const currentInstallId = Date.now().toString();
        localStorage.setItem(this.pluginInstallKey, currentInstallId);
        console.log('Fresh plugin installation detected - not restoring session');
      } else if (sessionExists) {
        // Session exists - try to restore it
        console.log('Existing plugin installation detected - attempting session restore');
        this.restoreSession().catch(error => {
          console.warn('Failed to restore session during initialization:', error);
        });
      } else {
        // Install ID exists but no session - previous installation was cleaned up
        console.log('Previous installation detected but no session - not restoring');
      }
    }

    // Session persistence methods
    saveSession() {
      if (this.isAuthenticated && this.accessToken) {
        const sessionData = {
          accessToken: this.accessToken,
          userId: this.userId,
          deviceId: this.deviceId,
          homeserver: this.homeserver,
          timestamp: Date.now()
        };

        try {
          localStorage.setItem(this.sessionKey, JSON.stringify(sessionData));
          console.log('Session saved successfully');
        } catch (error) {
          console.warn('Failed to save session:', error);
        }
      }
    }

    async restoreSession() {
      try {
        const sessionData = localStorage.getItem(this.sessionKey);
        if (sessionData) {
          const parsed = JSON.parse(sessionData);

          // Check if session is not too old (7 days)
          const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
          if (Date.now() - parsed.timestamp < maxAge) {
            this.accessToken = parsed.accessToken;
            this.userId = parsed.userId;
            this.deviceId = parsed.deviceId;
            this.homeserver = parsed.homeserver;
            this.isAuthenticated = true;

            console.log('Session data restored from localStorage for user:', this.userId);

            // Validate the session before emitting the restored event
            const isValid = await this.validateSession();
            if (isValid) {
              console.log('Session validation successful, emitting restored event');
              // Emit session restored event only if validation succeeds
              if (window.eventBus) {
                window.eventBus.emit('auth:session_restored', {
                  userId: this.userId,
                  accessToken: this.accessToken,
                  deviceId: this.deviceId,
                  homeserver: this.homeserver
                });
              }
              return true;
            } else {
              console.log('Session validation failed, not emitting restored event');
              return false;
            }
          } else {
            console.log('Session expired, clearing stored data');
            this.clearSession();
          }
        }
      } catch (error) {
        console.warn('Failed to restore session:', error);
        this.clearSession();
      }

      return false;
    }

    clearSession() {
      try {
        localStorage.removeItem(this.sessionKey);
        localStorage.removeItem(this.pluginInstallKey);
        console.log('Session and plugin install data cleared');
      } catch (error) {
        console.warn('Failed to clear session:', error);
      }

      this.isAuthenticated = false;
      this.accessToken = null;
      this.userId = null;
      this.deviceId = null;
      this.homeserver = null;
    }

    // Check if current session is valid
    async validateSession() {
      if (!this.isAuthenticated || !this.accessToken) {
        return false;
      }

      try {
        // Try to make a simple API call to validate the session
        // Use the status endpoint which should work with any valid session
        const response = await this.get('/status');
        console.log('Session validation response:', response);

        // Check if the session is actually connected
        if (response && response.connected === true) {
          console.log('Session validation successful');
          return true;
        } else {
          console.log('Session is not connected, clearing session');
          this.clearSession();

          // Emit session expired event
          if (window.eventBus) {
            window.eventBus.emit('auth:session_expired');
          }

          return false;
        }
      } catch (error) {
        console.warn('Session validation failed:', error);
        this.clearSession();

        // Emit session expired event
        if (window.eventBus) {
          window.eventBus.emit('auth:session_expired');
        }

        return false;
      }
    }

    // Make HTTP request
    async request(endpoint, options = {}) {
      const url = `${this.baseURL}${endpoint}`;

      // Prepare headers
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers
      };

      // Add authentication header if we have an access token
      if (this.isAuthenticated && this.accessToken) {
        headers['Authorization'] = `Bearer ${this.accessToken}`;
      }

      const config = {
        method: 'GET',
        headers,
        ...options
      };

      if (config.body && typeof config.body === 'object') {
        config.body = JSON.stringify(config.body);
      }

      try {
        console.log(`Making API request: ${config.method} ${url}`);
        const response = await fetch(url, config);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || `HTTP ${response.status}`);
        }

        return data;
      } catch (error) {
        console.error(`API request failed: ${endpoint}`, error);
        throw error;
      }
    }

    // GET request
    async get(endpoint, params = {}) {
      const queryString = new URLSearchParams(params).toString();
      const url = queryString ? `${endpoint}?${queryString}` : endpoint;
      return this.request(url);
    }

    // POST request
    async post(endpoint, data = {}) {
      return this.request(endpoint, {
        method: 'POST',
        body: data
      });
    }

    // PUT request
    async put(endpoint, data = {}) {
      return this.request(endpoint, {
        method: 'PUT',
        body: data
      });
    }

    // DELETE request
    async delete(endpoint) {
      return this.request(endpoint, {
        method: 'DELETE'
      });
    }

    // Get current user profile
    async getCurrentUserProfile() {
      try {
        const response = await this.get('/profile/me');
        console.log('Current user profile:', response);
        return response;
      } catch (error) {
        console.error('Failed to get current user profile:', error);
        throw error;
      }
    }

    // Get spaces
    async getSpaces() {
      try {
        const response = await this.get('/spaces');
        console.log('Spaces:', response);
        return response;
      } catch (error) {
        console.error('Failed to get spaces:', error);
        throw error;
      }
    }

    // Authentication methods
    async login(homeserver, username, password, enableEncryption = true) {
      try {
        const response = await this.post('/login', {
          homeserver,
          username,
          password,
          enable_encryption: enableEncryption
        });

        if (response.success) {
          this.isAuthenticated = true;
          this.accessToken = response.access_token;
          this.userId = response.user_id;
          this.deviceId = response.device_id;
          this.homeserver = homeserver;

          // Save session for persistence
          this.saveSession();

          // Emit login success event
          if (window.eventBus) {
            window.eventBus.emit('auth:login_success', {
              userId: this.userId,
              accessToken: this.accessToken,
              deviceId: this.deviceId,
              homeserver: this.homeserver,
              encryptionEnabled: enableEncryption
            });
          }
        }

        return response;
      } catch (error) {
        console.error('Login failed:', error);
        throw error;
      }
    }

    async logout() {
      try {
        if (this.isAuthenticated) {
          await this.post('/logout');
        }
      } catch (error) {
        console.warn('Logout request failed:', error);
      } finally {
        // Clear session data
        this.clearSession();

        // Emit logout event
        if (window.eventBus) {
          window.eventBus.emit('auth:logout');
        }
      }
    }

    // Room methods
    async getRooms() {
      try {
        return await this.get('/rooms');
      } catch (error) {
        console.error('Failed to get rooms:', error);
        throw error;
      }
    }

    async getRoomMessages(roomId, limit = 50, fromToken = null) {
      try {
        const params = { limit };
        if (fromToken) {
          params.from_token = fromToken;
        }
        return await this.get(`/rooms/${roomId}/messages`, params);
      } catch (error) {
        console.error('Failed to get room messages:', error);
        throw error;
      }
    }

    async sendMessage(roomId, message, msgType = 'm.text') {
      try {
        const response = await this.post(`/rooms/${roomId}/send`, {
          message,
          msg_type: msgType
        });

        // Emit message sent event
        if (window.eventBus) {
          window.eventBus.emit('message:sent', {
            roomId,
            message,
            msgType,
            eventId: response.event_id
          });
        }

        return response;
      } catch (error) {
        console.error('Failed to send message:', error);
        throw error;
      }
    }

    async getRoomMembers(roomId) {
      try {
        return await this.get(`/rooms/${roomId}/members`);
      } catch (error) {
        console.error('Failed to get room members:', error);
        throw error;
      }
    }

    async sendTyping(roomId, typing, timeout = 30000) {
      try {
        return await this.put(`/rooms/${roomId}/typing`, {
          typing,
          timeout: typing ? timeout : 0
        });
      } catch (error) {
        // Typing indicators are not critical
        console.warn('Failed to send typing indicator:', error);
        return { success: false, error: error.message };
      }
    }

    async createRoom(name, topic = null, alias = null, isDirect = false, invite = [], isPublic = false) {
      try {
        return await this.post('/rooms/create', {
          name,
          topic,
          alias,
          is_direct: isDirect,
          invite,
          is_public: isPublic
        });
      } catch (error) {
        console.error('Failed to create room:', error);
        throw error;
      }
    }

    async createDirectMessage(userId) {
      try {
        return await this.post('/create_dm', { user_id: userId });
      } catch (error) {
        console.error('Failed to create direct message:', error);
        throw error;
      }
    }

    async joinRoom(roomId) {
      try {
        const response = await this.post(`/rooms/${roomId}/join`);
        
        // Emit room joined event
        if (window.eventBus) {
          window.eventBus.emit('room:joined', { roomId });
        }
        
        return response;
      } catch (error) {
        console.error('Failed to join room:', error);
        throw error;
      }
    }

    async leaveRoom(roomId) {
      try {
        const response = await this.post(`/rooms/${roomId}/leave`);
        
        // Emit room left event
        if (window.eventBus) {
          window.eventBus.emit('room:left', { roomId });
        }
        
        return response;
      } catch (error) {
        console.error('Failed to leave room:', error);
        throw error;
      }
    }

    // Health check
    async healthCheck() {
      try {
        return await this.get('/health');
      } catch (error) {
        console.error('Health check failed:', error);
        throw error;
      }
    }



    // Utility methods
    isLoggedIn() {
      return this.isAuthenticated && this.accessToken && this.userId;
    }

    getUserId() {
      return this.userId;
    }

    getAccessToken() {
      return this.accessToken;
    }

    getHomeserver() {
      return this.homeserver;
    }

    getDeviceId() {
      return this.deviceId;
    }
  }

  // Export to global scope
  if (typeof window !== 'undefined') {
    window.ApiClient = ApiClient;
  }

  // Export for CommonJS
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApiClient;
  }

})();
