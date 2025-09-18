/**
 * EventBus - Vanilla JavaScript Version
 * Simple event system for decoupled communication between components
 */

(function() {
  'use strict';

  class EventBus {
    constructor() {
      this.events = new Map();
      this.maxListeners = 100; // Prevent memory leaks
    }

    /**
     * Subscribe to an event
     * @param {string} eventName - Name of the event
     * @param {function} callback - Callback function
     * @param {object} options - Options (once: boolean)
     */
    on(eventName, callback, options = {}) {
      if (typeof eventName !== 'string') {
        throw new Error('Event name must be a string');
      }
      
      if (typeof callback !== 'function') {
        throw new Error('Callback must be a function');
      }

      if (!this.events.has(eventName)) {
        this.events.set(eventName, []);
      }

      const listeners = this.events.get(eventName);
      
      // Check max listeners limit
      if (listeners.length >= this.maxListeners) {
        console.warn(`EventBus: Maximum listeners (${this.maxListeners}) exceeded for event "${eventName}"`);
      }

      const listener = {
        callback,
        once: options.once || false,
        id: Math.random().toString(36).substr(2, 9)
      };

      listeners.push(listener);
      
      // Return unsubscribe function
      return () => this.off(eventName, callback);
    }

    /**
     * Subscribe to an event once
     * @param {string} eventName - Name of the event
     * @param {function} callback - Callback function
     */
    once(eventName, callback) {
      return this.on(eventName, callback, { once: true });
    }

    /**
     * Unsubscribe from an event
     * @param {string} eventName - Name of the event
     * @param {function} callback - Callback function to remove
     */
    off(eventName, callback) {
      if (!this.events.has(eventName)) {
        return false;
      }

      const listeners = this.events.get(eventName);
      const index = listeners.findIndex(listener => listener.callback === callback);
      
      if (index !== -1) {
        listeners.splice(index, 1);
        
        // Clean up empty event arrays
        if (listeners.length === 0) {
          this.events.delete(eventName);
        }
        
        return true;
      }
      
      return false;
    }

    /**
     * Remove all listeners for an event
     * @param {string} eventName - Name of the event
     */
    removeAllListeners(eventName) {
      if (eventName) {
        this.events.delete(eventName);
      } else {
        this.events.clear();
      }
    }

    /**
     * Emit an event
     * @param {string} eventName - Name of the event
     * @param {*} data - Data to pass to listeners
     */
    emit(eventName, data) {
      if (!this.events.has(eventName)) {
        return false;
      }

      const listeners = this.events.get(eventName).slice(); // Copy array to avoid issues with modifications during iteration
      let emitted = false;

      for (const listener of listeners) {
        try {
          listener.callback(data);
          emitted = true;

          // Remove one-time listeners
          if (listener.once) {
            this.off(eventName, listener.callback);
          }
        } catch (error) {
          console.error(`EventBus: Error in listener for event "${eventName}":`, error);
        }
      }

      return emitted;
    }

    /**
     * Get the number of listeners for an event
     * @param {string} eventName - Name of the event
     */
    listenerCount(eventName) {
      if (!this.events.has(eventName)) {
        return 0;
      }
      return this.events.get(eventName).length;
    }

    /**
     * Get all event names that have listeners
     */
    eventNames() {
      return Array.from(this.events.keys());
    }

    /**
     * Set maximum number of listeners per event
     * @param {number} max - Maximum number of listeners
     */
    setMaxListeners(max) {
      if (typeof max !== 'number' || max < 0) {
        throw new Error('Max listeners must be a non-negative number');
      }
      this.maxListeners = max;
    }

    /**
     * Get maximum number of listeners per event
     */
    getMaxListeners() {
      return this.maxListeners;
    }

    /**
     * Create a promise that resolves when an event is emitted
     * @param {string} eventName - Name of the event
     * @param {number} timeout - Optional timeout in milliseconds
     */
    waitFor(eventName, timeout) {
      return new Promise((resolve, reject) => {
        let timeoutId;
        
        const cleanup = this.once(eventName, (data) => {
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          resolve(data);
        });

        if (timeout) {
          timeoutId = setTimeout(() => {
            cleanup();
            reject(new Error(`EventBus: Timeout waiting for event "${eventName}"`));
          }, timeout);
        }
      });
    }

    /**
     * Debug method to log all events and listeners
     */
    debug() {
      console.log('EventBus Debug Info:');
      console.log('Events:', this.events);
      console.log('Total events:', this.events.size);
      
      for (const [eventName, listeners] of this.events) {
        console.log(`  ${eventName}: ${listeners.length} listeners`);
      }
    }
  }

  // Matrix-specific event constants
  const MATRIX_EVENTS = {
    // Authentication events
    AUTH_LOGIN_SUCCESS: 'auth:login_success',
    AUTH_LOGIN_FAILED: 'auth:login_failed',
    AUTH_LOGOUT: 'auth:logout',
    AUTH_SESSION_RESTORED: 'auth:session_restored',
    
    // Room events
    ROOM_SELECTED: 'room:selected',
    ROOM_JOINED: 'room:joined',
    ROOM_LEFT: 'room:left',
    ROOM_UPDATED: 'room:updated',
    ROOM_MEMBER_UPDATE: 'room:member_update',
    
    // Message events
    MESSAGE_SENT: 'message:sent',
    MESSAGE_RECEIVED: 'message:received',
    MESSAGE_UPDATED: 'message:updated',
    MESSAGE_DELETED: 'message:deleted',
    
    // Typing events
    TYPING_START: 'typing:start',
    TYPING_STOP: 'typing:stop',
    
    // Sync events
    SYNC_STATE_CHANGED: 'sync:state_changed',
    SYNC_ERROR: 'sync:error',
    
    // UI events
    UI_THEME_CHANGED: 'ui:theme_changed',
    UI_SIDEBAR_TOGGLE: 'ui:sidebar_toggle',
    UI_MEMBER_LIST_TOGGLE: 'ui:member_list_toggle',
    
    // Error events
    ERROR_NETWORK: 'error:network',
    ERROR_API: 'error:api',
    ERROR_UNKNOWN: 'error:unknown'
  };

  // Create global instance
  const eventBus = new EventBus();

  // Export to global scope
  if (typeof window !== 'undefined') {
    window.EventBus = EventBus;
    window.eventBus = eventBus;
    window.MATRIX_EVENTS = MATRIX_EVENTS;
  }

  // Export for CommonJS
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EventBus, eventBus, MATRIX_EVENTS };
  }

})();
