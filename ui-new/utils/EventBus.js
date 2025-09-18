// Event Bus System
// Provides decoupled communication between components

export class EventBus {
  constructor() {
    this.events = new Map();
    this.onceEvents = new Map();
  }

  /**
   * Subscribe to an event
   * @param {string} eventName - Name of the event
   * @param {function} callback - Callback function
   * @returns {function} Unsubscribe function
   */
  on(eventName, callback) {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, new Set());
    }

    this.events.get(eventName).add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.events.get(eventName);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.events.delete(eventName);
        }
      }
    };
  }

  /**
   * Subscribe to an event once
   * @param {string} eventName - Name of the event
   * @param {function} callback - Callback function
   * @returns {function} Unsubscribe function
   */
  once(eventName, callback) {
    if (!this.onceEvents.has(eventName)) {
      this.onceEvents.set(eventName, new Set());
    }

    this.onceEvents.get(eventName).add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.onceEvents.get(eventName);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.onceEvents.delete(eventName);
        }
      }
    };
  }

  /**
   * Unsubscribe from an event
   * @param {string} eventName - Name of the event
   * @param {function} callback - Callback function to remove
   */
  off(eventName, callback) {
    const callbacks = this.events.get(eventName);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.events.delete(eventName);
      }
    }

    const onceCallbacks = this.onceEvents.get(eventName);
    if (onceCallbacks) {
      onceCallbacks.delete(callback);
      if (onceCallbacks.size === 0) {
        this.onceEvents.delete(eventName);
      }
    }
  }

  /**
   * Emit an event
   * @param {string} eventName - Name of the event
   * @param {...any} args - Arguments to pass to callbacks
   */
  emit(eventName, ...args) {
    // Call regular subscribers
    const callbacks = this.events.get(eventName);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in event callback for ${eventName}:`, error);
        }
      });
    }

    // Call once subscribers and remove them
    const onceCallbacks = this.onceEvents.get(eventName);
    if (onceCallbacks) {
      onceCallbacks.forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in once event callback for ${eventName}:`, error);
        }
      });
      this.onceEvents.delete(eventName);
    }
  }

  /**
   * Remove all listeners for an event
   * @param {string} eventName - Name of the event
   */
  removeAllListeners(eventName) {
    if (eventName) {
      this.events.delete(eventName);
      this.onceEvents.delete(eventName);
    } else {
      this.events.clear();
      this.onceEvents.clear();
    }
  }

  /**
   * Get the number of listeners for an event
   * @param {string} eventName - Name of the event
   * @returns {number} Number of listeners
   */
  listenerCount(eventName) {
    const regularCount = this.events.get(eventName)?.size || 0;
    const onceCount = this.onceEvents.get(eventName)?.size || 0;
    return regularCount + onceCount;
  }

  /**
   * Get all event names that have listeners
   * @returns {string[]} Array of event names
   */
  eventNames() {
    const names = new Set([
      ...this.events.keys(),
      ...this.onceEvents.keys()
    ]);
    return Array.from(names);
  }
}

// Global event bus instance
export const eventBus = new EventBus();

// Matrix-specific event constants
export const MATRIX_EVENTS = {
  // Authentication events
  AUTH_LOGIN_START: 'auth:login:start',
  AUTH_LOGIN_SUCCESS: 'auth:login:success',
  AUTH_LOGIN_ERROR: 'auth:login:error',
  AUTH_LOGOUT: 'auth:logout',
  AUTH_SESSION_RESTORED: 'auth:session:restored',

  // Room events
  ROOM_SELECTED: 'room:selected',
  ROOM_LIST_UPDATED: 'room:list:updated',
  ROOM_JOINED: 'room:joined',
  ROOM_LEFT: 'room:left',
  ROOM_MEMBER_UPDATED: 'room:member:updated',

  // Message events
  MESSAGE_RECEIVED: 'message:received',
  MESSAGE_SENT: 'message:sent',
  MESSAGE_UPDATED: 'message:updated',
  MESSAGE_DELETED: 'message:deleted',
  MESSAGE_REACTION_ADDED: 'message:reaction:added',
  MESSAGE_REACTION_REMOVED: 'message:reaction:removed',

  // Sync events
  SYNC_STATE_CHANGED: 'sync:state:changed',
  SYNC_ERROR: 'sync:error',

  // UI events
  UI_THEME_CHANGED: 'ui:theme:changed',
  UI_SIDEBAR_TOGGLED: 'ui:sidebar:toggled',
  UI_MEMBER_LIST_TOGGLED: 'ui:member-list:toggled',
  UI_THREAD_OPENED: 'ui:thread:opened',
  UI_THREAD_CLOSED: 'ui:thread:closed',

  // Notification events
  NOTIFICATION_SHOW: 'notification:show',
  NOTIFICATION_HIDE: 'notification:hide',

  // Error events
  ERROR_NETWORK: 'error:network',
  ERROR_API: 'error:api',
  ERROR_UNKNOWN: 'error:unknown'
};

export default {
  EventBus,
  eventBus,
  MATRIX_EVENTS
};