// Authentication Store
// Manages user authentication state and session management

import { eventBus, MATRIX_EVENTS } from '../utils/EventBus.js';
import { apiClient } from '../utils/ApiClient.js';

export class AuthStore {
  constructor() {
    this.state = {
      isAuthenticated: false,
      isLoading: false,
      user: null,
      homeserver: null,
      loginError: null,
      connectionStatus: 'disconnected' // disconnected, connecting, connected, error
    };

    this.listeners = new Set();
    this.setupEventListeners();
  }

  /**
   * Set up event listeners for authentication events
   */
  setupEventListeners() {
    eventBus.on(MATRIX_EVENTS.AUTH_LOGIN_START, () => {
      this.updateState({
        isLoading: true,
        loginError: null,
        connectionStatus: 'connecting'
      });
    });

    eventBus.on(MATRIX_EVENTS.AUTH_LOGIN_SUCCESS, (result) => {
      this.updateState({
        isAuthenticated: true,
        isLoading: false,
        user: result.user_info || null,
        homeserver: result.homeserver || null,
        loginError: null,
        connectionStatus: 'connected'
      });
    });

    eventBus.on(MATRIX_EVENTS.AUTH_LOGIN_ERROR, (error) => {
      this.updateState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        loginError: error.message || 'Login failed',
        connectionStatus: 'error'
      });
    });

    eventBus.on(MATRIX_EVENTS.AUTH_LOGOUT, () => {
      this.updateState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        homeserver: null,
        loginError: null,
        connectionStatus: 'disconnected'
      });
    });

    eventBus.on(MATRIX_EVENTS.AUTH_SESSION_RESTORED, (result) => {
      this.updateState({
        isAuthenticated: true,
        isLoading: false,
        user: result.user_info || null,
        homeserver: result.homeserver || null,
        connectionStatus: 'connected'
      });
    });
  }

  /**
   * Update state and notify listeners
   * @param {object} newState - Partial state to update
   */
  updateState(newState) {
    this.state = { ...this.state, ...newState };
    this.notifyListeners();
  }

  /**
   * Notify all listeners of state changes
   */
  notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.state);
      } catch (error) {
        console.error('Error in auth store listener:', error);
      }
    });
  }

  /**
   * Subscribe to state changes
   * @param {function} listener - Callback function
   * @returns {function} Unsubscribe function
   */
  subscribe(listener) {
    this.listeners.add(listener);

    // Call listener immediately with current state
    listener(this.state);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Get current state
   * @returns {object} Current authentication state
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Login to Matrix server
   * @param {string} homeserver - Homeserver URL
   * @param {string} username - Username
   * @param {string} password - Password
   */
  async login(homeserver, username, password) {
    try {
      await apiClient.login(homeserver, username, password);
    } catch (error) {
      // Error is handled by event listeners
      throw error;
    }
  }

  /**
   * Logout from Matrix server
   */
  async logout() {
    try {
      await apiClient.disconnect();
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout on client side even if server call fails
      eventBus.emit(MATRIX_EVENTS.AUTH_LOGOUT);
    }
  }

  /**
   * Check connection status
   */
  async checkConnection() {
    try {
      this.updateState({ connectionStatus: 'connecting' });
      const result = await apiClient.getStatus();

      if (result.authenticated) {
        this.updateState({
          isAuthenticated: true,
          user: result.user_info || null,
          homeserver: result.homeserver || null,
          connectionStatus: 'connected'
        });
      } else {
        this.updateState({
          isAuthenticated: false,
          user: null,
          connectionStatus: 'disconnected'
        });
      }

      return result;
    } catch (error) {
      this.updateState({
        isAuthenticated: false,
        connectionStatus: 'error'
      });
      throw error;
    }
  }

  /**
   * Initialize authentication store
   * Checks for existing session and restores if available
   */
  async initialize() {
    try {
      await this.checkConnection();
    } catch (error) {
      console.error('Failed to initialize auth store:', error);
      this.updateState({
        isAuthenticated: false,
        connectionStatus: 'disconnected'
      });
    }
  }

  /**
   * Clear authentication state
   */
  clear() {
    this.updateState({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      homeserver: null,
      loginError: null,
      connectionStatus: 'disconnected'
    });
  }
}

// Create and export global instance
export const authStore = new AuthStore();

export default {
  AuthStore,
  authStore
};