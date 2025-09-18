// Enhanced API Client for Matrix backend communication via message proxy
// Communicates with matrix-nio backend through the message proxy system
// All API calls go through /api/message-proxy/element endpoints

import { eventBus, MATRIX_EVENTS } from './EventBus.js';

export class ApiClient {
  constructor(options = {}) {
    // Base URL matches the message proxy router prefix
    this.baseUrl = options.baseUrl || '/api/message-proxy/element';
    this.timeout = options.timeout || 30000;
    this.retryAttempts = options.retryAttempts || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.interceptors = {
      request: [],
      response: []
    };

    // Request/response tracking
    this.pendingRequests = new Map();
    this.requestId = 0;
  }

  /**
   * Add request interceptor
   * @param {function} interceptor - Function to modify request config
   */
  addRequestInterceptor(interceptor) {
    this.interceptors.request.push(interceptor);
  }

  /**
   * Add response interceptor
   * @param {function} interceptor - Function to modify response
   */
  addResponseInterceptor(interceptor) {
    this.interceptors.response.push(interceptor);
  }

  /**
   * Apply request interceptors
   * @param {object} config - Request configuration
   * @returns {object} Modified configuration
   */
  async applyRequestInterceptors(config) {
    let modifiedConfig = { ...config };

    for (const interceptor of this.interceptors.request) {
      try {
        modifiedConfig = await interceptor(modifiedConfig);
      } catch (error) {
        console.error('Request interceptor error:', error);
      }
    }

    return modifiedConfig;
  }

  /**
   * Apply response interceptors
   * @param {any} response - Response data
   * @returns {any} Modified response
   */
  async applyResponseInterceptors(response) {
    let modifiedResponse = response;

    for (const interceptor of this.interceptors.response) {
      try {
        modifiedResponse = await interceptor(modifiedResponse);
      } catch (error) {
        console.error('Response interceptor error:', error);
      }
    }

    return modifiedResponse;
  }

  /**
   * Sleep utility for retry delays
   * @param {number} ms - Milliseconds to sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Make HTTP request with retry logic and error handling
   * @param {string} method - HTTP method
   * @param {string} endpoint - API endpoint
   * @param {any} data - Request data
   * @param {object} options - Request options
   * @returns {Promise<any>} Response data
   */
  async request(method, endpoint, data = null, options = {}) {
    const requestId = ++this.requestId;
    const url = `${this.baseUrl}${endpoint}`;

    let config = {
      method: method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    if (data && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
      config.body = JSON.stringify(data);
    }

    // Apply request interceptors
    config = await this.applyRequestInterceptors(config);

    let lastError;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        config.signal = controller.signal;

        // Track pending request
        this.pendingRequests.set(requestId, controller);

        const response = await fetch(url, config);
        clearTimeout(timeoutId);

        // Remove from pending requests
        this.pendingRequests.delete(requestId);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
        }

        const contentType = response.headers.get('content-type');
        let responseData;

        if (contentType && contentType.includes('application/json')) {
          responseData = await response.json();
        } else {
          responseData = await response.text();
        }

        // Apply response interceptors
        responseData = await this.applyResponseInterceptors(responseData);

        return responseData;

      } catch (error) {
        lastError = error;

        // Remove from pending requests
        this.pendingRequests.delete(requestId);

        // Don't retry on certain errors
        if (error.name === 'AbortError') {
          throw new Error('Request timeout');
        }

        if (error.message.includes('HTTP 4')) {
          // Client errors - don't retry
          throw error;
        }

        // Retry on network errors and server errors
        if (attempt < this.retryAttempts) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
          await this.sleep(delay);
          continue;
        }

        throw error;
      }
    }

    throw lastError;
  }

  /**
   * Cancel all pending requests
   */
  cancelAllRequests() {
    for (const [, controller] of this.pendingRequests) {
      controller.abort();
    }
    this.pendingRequests.clear();
  }

  /**
   * GET request
   */
  async get(endpoint, options = {}) {
    return this.request('GET', endpoint, null, options);
  }

  /**
   * POST request
   */
  async post(endpoint, data, options = {}) {
    return this.request('POST', endpoint, data, options);
  }

  /**
   * PUT request
   */
  async put(endpoint, data, options = {}) {
    return this.request('PUT', endpoint, data, options);
  }

  /**
   * DELETE request
   */
  async delete(endpoint, options = {}) {
    return this.request('DELETE', endpoint, null, options);
  }

  // === Authentication APIs ===

  async login(homeserver, username, password) {
    try {
      eventBus.emit(MATRIX_EVENTS.AUTH_LOGIN_START);
      const result = await this.post('/login', {
        homeserver,
        username,
        password
      });
      eventBus.emit(MATRIX_EVENTS.AUTH_LOGIN_SUCCESS, result);
      return result;
    } catch (error) {
      eventBus.emit(MATRIX_EVENTS.AUTH_LOGIN_ERROR, error);
      throw error;
    }
  }

  async disconnect() {
    try {
      const result = await this.post('/disconnect');
      eventBus.emit(MATRIX_EVENTS.AUTH_LOGOUT);
      return result;
    } catch (error) {
      throw error;
    }
  }

  async getStatus() {
    return await this.get('/status');
  }

  async healthCheck() {
    return await this.get('/health');
  }

  // === Room Management APIs ===

  async getRooms() {
    try {
      const result = await this.get('/rooms');
      eventBus.emit(MATRIX_EVENTS.ROOM_LIST_UPDATED, result);
      return result;
    } catch (error) {
      throw error;
    }
  }

  async getRoomMembers(roomId) {
    return await this.get(`/rooms/${roomId}/members`);
  }

  async getRoomInfo(roomId) {
    return await this.get(`/rooms/${roomId}/info`);
  }

  async getRoomMessages(roomId, limit = 50, fromToken = null) {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (fromToken) {
      params.append('from_token', fromToken);
    }
    return await this.get(`/rooms/${roomId}/messages?${params}`);
  }

  async sendMessage(roomId, message, msgType = 'm.text') {
    try {
      const result = await this.post(`/rooms/${roomId}/send`, {
        message,
        msg_type: msgType
      });
      eventBus.emit(MATRIX_EVENTS.MESSAGE_SENT, { roomId, message, result });
      return result;
    } catch (error) {
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
      // Typing indicators are not critical, so we can ignore errors
      console.warn('Failed to send typing indicator:', error);
      return { success: false, error: error.message };
    }
  }

  async getRoomMembers(roomId) {
    try {
      return await this.get(`/rooms/${roomId}/members`);
    } catch (error) {
      throw error;
    }
  }

  async createRoom(name, topic = null, alias = null, isDirect = false, invite = [], isPublic = false, enableEncryption = true) {
    return await this.post('/rooms/create', {
      name,
      topic,
      alias,
      is_direct: isDirect,
      invite,
      is_public: isPublic,
      enable_encryption: enableEncryption
    });
  }

  async createDirectMessage(userId) {
    return await this.post('/create_dm', { user_id: userId });
  }

  async joinRoom(roomId) {
    try {
      const result = await this.post(`/rooms/${roomId}/join`);
      eventBus.emit(MATRIX_EVENTS.ROOM_JOINED, { roomId, result });
      return result;
    } catch (error) {
      throw error;
    }
  }

  async leaveRoom(roomId, reason = null) {
    try {
      const result = await this.post(`/rooms/${roomId}/leave`, { reason });
      eventBus.emit(MATRIX_EVENTS.ROOM_LEFT, { roomId, result });
      return result;
    } catch (error) {
      throw error;
    }
  }

  async inviteToRoom(roomId, userId) {
    return await this.post(`/rooms/${roomId}/invite`, { user_id: userId });
  }

  async kickFromRoom(roomId, userId, reason = null) {
    return await this.post(`/rooms/${roomId}/kick`, { user_id: userId, reason });
  }

  async banFromRoom(roomId, userId, reason = null) {
    return await this.post(`/rooms/${roomId}/ban`, { user_id: userId, reason });
  }

  async unbanFromRoom(roomId, userId) {
    return await this.post(`/rooms/${roomId}/unban`, { user_id: userId });
  }

  // === Thread APIs ===

  async getThreadMessages(roomId, threadRootId, limit = 50) {
    return await this.post('/thread-messages', {
      room_id: roomId,
      thread_root_id: threadRootId,
      limit
    });
  }

  // === User Management APIs ===

  async getUserProfile(userId) {
    return await this.get(`/users/${encodeURIComponent(userId)}/profile`);
  }

  async setDisplayName(displayName) {
    return await this.put('/profile/displayname', { display_name: displayName });
  }

  async setAvatar(avatarUrl) {
    return await this.put('/profile/avatar', { avatar_url: avatarUrl });
  }

  async getUserPresence(userId) {
    return await this.get(`/users/${encodeURIComponent(userId)}/presence`);
  }

  async setPresence(presence, statusMsg = null) {
    return await this.put('/presence', { presence, status_msg: statusMsg });
  }

  // === Device Management APIs ===

  async getDevices() {
    return await this.get('/devices');
  }

  async updateDevice(deviceId, displayName) {
    return await this.put(`/devices/${deviceId}`, { display_name: displayName });
  }

  async deleteDevices(deviceIds, authDict = null) {
    return await this.delete('/devices', { device_ids: deviceIds, auth_dict: authDict });
  }

  // === File Management APIs ===

  async uploadFile(filePath, filename = null) {
    return await this.post('/upload', { file_path: filePath, filename });
  }

  async downloadFile(mxcUrl, filePath) {
    return await this.get('/download', { mxc_url: mxcUrl, file_path: filePath });
  }

  async sendFileMessage(roomId, filePath, filename = null, message = null) {
    return await this.post(`/rooms/${roomId}/send_file`, {
      file_path: filePath,
      filename,
      message
    });
  }

  // === Room State Management APIs ===

  async getRoomState(roomId) {
    return await this.get(`/rooms/${roomId}/state`);
  }

  async setRoomName(roomId, name) {
    return await this.put(`/rooms/${roomId}/name`, { name });
  }

  async setRoomTopic(roomId, topic) {
    return await this.put(`/rooms/${roomId}/topic`, { topic });
  }

  async setRoomAvatar(roomId, avatarUrl) {
    return await this.put(`/rooms/${roomId}/avatar`, { avatar_url: avatarUrl });
  }

  async setPowerLevels(roomId, powerLevels) {
    return await this.put(`/rooms/${roomId}/power_levels`, { power_levels: powerLevels });
  }

  // === Message Advanced Features APIs ===

  async sendReaction(roomId, eventId, reaction) {
    try {
      const result = await this.post(`/rooms/${roomId}/reaction`, {
        event_id: eventId,
        reaction
      });
      eventBus.emit(MATRIX_EVENTS.MESSAGE_REACTION_ADDED, { roomId, eventId, reaction, result });
      return result;
    } catch (error) {
      throw error;
    }
  }

  async redactMessage(roomId, eventId, reason = null) {
    return await this.post(`/rooms/${roomId}/redact/${eventId}`, { reason });
  }

  async sendTypingNotification(roomId, typing = true, timeout = 30000) {
    return await this.post(`/rooms/${roomId}/typing`, { typing, timeout });
  }

  async markAsRead(roomId, eventId) {
    return await this.post(`/rooms/${roomId}/read_markers`, { event_id: eventId });
  }

  // === Space Management APIs ===

  async createSpace(name, topic = null, alias = null, isPublic = false) {
    return await this.post('/spaces/create', {
      name,
      topic,
      alias,
      is_public: isPublic
    });
  }

  async addRoomToSpace(spaceId, roomId, suggested = true) {
    return await this.post(`/spaces/${spaceId}/add_room`, {
      room_id: roomId,
      suggested
    });
  }

  async getSpaceHierarchy(spaceId, maxDepth = 3) {
    return await this.get(`/spaces/${spaceId}/hierarchy?max_depth=${maxDepth}`);
  }

  // === Media Proxy APIs ===

  async downloadMedia(serverName, mediaId) {
    return await this.get(`/media/download/${serverName}/${mediaId}`);
  }

  // === Search and Discovery APIs ===

  async searchPublicRooms(searchTerm = null, limit = 20, server = null) {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (searchTerm) params.append('search_term', searchTerm);
    if (server) params.append('server', server);
    return await this.get(`/rooms/public?${params}`);
  }

  async resolveRoomAlias(roomAlias) {
    return await this.get(`/rooms/resolve_alias?room_alias=${encodeURIComponent(roomAlias)}`);
  }

  // === Encryption and Device Verification APIs ===

  async getDeviceKeys(userIds) {
    return await this.post('/keys/query', { user_ids: userIds });
  }

  async verifyDevice(userId, deviceId) {
    return await this.post(`/devices/${encodeURIComponent(userId)}/${deviceId}/verify`);
  }

  async startEmojiVerification(userId, deviceId) {
    return await this.post(`/devices/${encodeURIComponent(userId)}/${deviceId}/start-emoji-verification`);
  }

  async getVerificationEmojis(transactionId) {
    return await this.get(`/verification/${transactionId}/emojis`);
  }

  async confirmEmojiVerification(transactionId, match) {
    return await this.post(`/verification/${transactionId}/confirm`, { match });
  }

  async getVerificationStatus(transactionId) {
    return await this.get(`/verification/${transactionId}/status`);
  }

  async listVerificationRequests() {
    return await this.get('/verification/requests');
  }

  async getPendingVerificationRequests() {
    return await this.get('/verification/pending');
  }

  async acceptVerificationRequest(transactionId) {
    return await this.post(`/verification/${transactionId}/accept`);
  }

  async rejectVerificationRequest(transactionId) {
    return await this.post(`/verification/${transactionId}/reject`);
  }

  async blacklistDevice(userId, deviceId) {
    return await this.post(`/devices/${encodeURIComponent(userId)}/${deviceId}/blacklist`);
  }

  async ignoreDevice(userId, deviceId) {
    return await this.post(`/devices/${encodeURIComponent(userId)}/${deviceId}/ignore`);
  }

  // === Statistics and Monitoring APIs ===

  async getSyncStatus() {
    return await this.get('/sync/status');
  }

  async getRoomContext(roomId, eventId, limit = 10) {
    return await this.get(`/rooms/${roomId}/context/${eventId}?limit=${limit}`);
  }

  // === Error Handling Utilities ===

  handleApiError(error, context = '') {
    console.error(`API Error${context ? ` (${context})` : ''}:`, error);

    if (error.message.includes('timeout')) {
      return { success: false, error: 'Request timeout. Please try again.' };
    } else if (error.message.includes('HTTP 401')) {
      return { success: false, error: 'Authentication failed. Please log in again.' };
    } else if (error.message.includes('HTTP 403')) {
      return { success: false, error: 'Access denied. You may not have permission for this action.' };
    } else if (error.message.includes('HTTP 404')) {
      return { success: false, error: 'Resource not found.' };
    } else if (error.message.includes('HTTP 429')) {
      return { success: false, error: 'Rate limited. Please wait before trying again.' };
    } else if (error.message.includes('HTTP 5')) {
      return { success: false, error: 'Server error. Please try again later.' };
    } else {
      return { success: false, error: error.message || 'An unknown error occurred.' };
    }
  }
}

// Create and export global instance
export const apiClient = new ApiClient();

export default {
  ApiClient,
  apiClient
};