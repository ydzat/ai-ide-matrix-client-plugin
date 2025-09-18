// Rooms Store
// Manages room list, room metadata, and member information

import { eventBus, MATRIX_EVENTS } from '../utils/EventBus.js';
import { apiClient } from '../utils/ApiClient.js';

export class RoomsStore {
  constructor() {
    this.state = {
      rooms: new Map(), // roomId -> room data
      selectedRoomId: null,
      isLoading: false,
      error: null,
      searchQuery: '',
      filteredRooms: []
    };

    this.listeners = new Set();
    this.setupEventListeners();
  }

  /**
   * Set up event listeners for room events
   */
  setupEventListeners() {
    eventBus.on(MATRIX_EVENTS.ROOM_LIST_UPDATED, (result) => {
      if (result.rooms) {
        this.processRoomList(result.rooms);
      }
    });

    eventBus.on(MATRIX_EVENTS.ROOM_SELECTED, (roomId) => {
      this.updateState({ selectedRoomId: roomId });
    });

    eventBus.on(MATRIX_EVENTS.ROOM_JOINED, ({ roomId }) => {
      this.refreshRoomList();
    });

    eventBus.on(MATRIX_EVENTS.ROOM_LEFT, ({ roomId }) => {
      this.removeRoom(roomId);
    });

    eventBus.on(MATRIX_EVENTS.ROOM_MEMBER_UPDATED, ({ roomId, member }) => {
      this.updateRoomMember(roomId, member);
    });

    eventBus.on(MATRIX_EVENTS.AUTH_LOGOUT, () => {
      this.clear();
    });
  }

  /**
   * Process room list from API response
   * @param {array} rooms - Array of room objects
   */
  processRoomList(rooms) {
    const roomsMap = new Map();

    rooms.forEach(room => {
      roomsMap.set(room.room_id, {
        id: room.room_id,
        name: room.name || room.canonical_alias || room.room_id,
        displayName: room.display_name || room.name || room.canonical_alias || 'Unnamed Room',
        topic: room.topic || '',
        avatarUrl: room.avatar_url || null,
        canonicalAlias: room.canonical_alias || null,
        isDirect: room.is_direct || false,
        isEncrypted: room.is_encrypted || false,
        memberCount: room.member_count || 0,
        unreadCount: room.unread_count || 0,
        highlightCount: room.highlight_count || 0,
        lastMessage: room.last_message || null,
        lastActivity: room.last_activity ? new Date(room.last_activity) : null,
        powerLevel: room.power_level || 0,
        joinRule: room.join_rule || 'invite',
        guestAccess: room.guest_access || 'can_join',
        historyVisibility: room.history_visibility || 'shared',
        members: new Map(), // userId -> member data
        isSpace: room.room_type === 'm.space',
        spaceParents: room.space_parents || [],
        spaceChildren: room.space_children || []
      });
    });

    this.updateState({
      rooms: roomsMap,
      isLoading: false,
      error: null
    });

    this.updateFilteredRooms();
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
        console.error('Error in rooms store listener:', error);
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
   * @returns {object} Current rooms state
   */
  getState() {
    return {
      ...this.state,
      rooms: new Map(this.state.rooms), // Create a copy of the Map
      filteredRooms: [...this.state.filteredRooms] // Create a copy of the array
    };
  }

  /**
   * Load rooms from server
   */
  async loadRooms() {
    try {
      this.updateState({ isLoading: true, error: null });
      await apiClient.getRooms();
      // Room list will be updated via event listener
    } catch (error) {
      this.updateState({
        isLoading: false,
        error: error.message || 'Failed to load rooms'
      });
      throw error;
    }
  }

  /**
   * Refresh room list
   */
  async refreshRoomList() {
    await this.loadRooms();
  }

  /**
   * Select a room
   * @param {string} roomId - Room ID to select
   */
  selectRoom(roomId) {
    if (this.state.rooms.has(roomId)) {
      eventBus.emit(MATRIX_EVENTS.ROOM_SELECTED, roomId);
    }
  }

  /**
   * Get room by ID
   * @param {string} roomId - Room ID
   * @returns {object|null} Room data or null if not found
   */
  getRoom(roomId) {
    return this.state.rooms.get(roomId) || null;
  }

  /**
   * Get selected room
   * @returns {object|null} Selected room data or null
   */
  getSelectedRoom() {
    if (this.state.selectedRoomId) {
      return this.getRoom(this.state.selectedRoomId);
    }
    return null;
  }

  /**
   * Remove room from store
   * @param {string} roomId - Room ID to remove
   */
  removeRoom(roomId) {
    const rooms = new Map(this.state.rooms);
    rooms.delete(roomId);

    const selectedRoomId = this.state.selectedRoomId === roomId ? null : this.state.selectedRoomId;

    this.updateState({ rooms, selectedRoomId });
    this.updateFilteredRooms();
  }

  /**
   * Update room member information
   * @param {string} roomId - Room ID
   * @param {object} member - Member data
   */
  updateRoomMember(roomId, member) {
    const room = this.state.rooms.get(roomId);
    if (!room) return;

    const updatedRoom = { ...room };
    updatedRoom.members.set(member.user_id, {
      userId: member.user_id,
      displayName: member.display_name || member.user_id,
      avatarUrl: member.avatar_url || null,
      membership: member.membership || 'join',
      powerLevel: member.power_level || 0,
      lastSeen: member.last_seen ? new Date(member.last_seen) : null,
      presence: member.presence || 'offline'
    });

    const rooms = new Map(this.state.rooms);
    rooms.set(roomId, updatedRoom);

    this.updateState({ rooms });
  }

  /**
   * Load room members
   * @param {string} roomId - Room ID
   */
  async loadRoomMembers(roomId) {
    try {
      const result = await apiClient.getRoomMembers(roomId);
      if (result.members) {
        result.members.forEach(member => {
          this.updateRoomMember(roomId, member);
        });
      }
    } catch (error) {
      console.error(`Failed to load members for room ${roomId}:`, error);
    }
  }

  /**
   * Search rooms
   * @param {string} query - Search query
   */
  searchRooms(query) {
    this.updateState({ searchQuery: query });
    this.updateFilteredRooms();
  }

  /**
   * Update filtered rooms based on search query
   */
  updateFilteredRooms() {
    const { rooms, searchQuery } = this.state;

    if (!searchQuery.trim()) {
      this.updateState({ filteredRooms: Array.from(rooms.values()) });
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = Array.from(rooms.values()).filter(room => {
      return (
        room.displayName.toLowerCase().includes(query) ||
        room.topic.toLowerCase().includes(query) ||
        (room.canonicalAlias && room.canonicalAlias.toLowerCase().includes(query))
      );
    });

    this.updateState({ filteredRooms: filtered });
  }

  /**
   * Get rooms sorted by activity
   * @returns {array} Sorted rooms array
   */
  getRoomsSortedByActivity() {
    return Array.from(this.state.rooms.values()).sort((a, b) => {
      // Sort by last activity, most recent first
      if (a.lastActivity && b.lastActivity) {
        return b.lastActivity.getTime() - a.lastActivity.getTime();
      } else if (a.lastActivity) {
        return -1;
      } else if (b.lastActivity) {
        return 1;
      }
      // If no activity, sort by name
      return a.displayName.localeCompare(b.displayName);
    });
  }

  /**
   * Get direct message rooms
   * @returns {array} Direct message rooms
   */
  getDirectMessageRooms() {
    return Array.from(this.state.rooms.values()).filter(room => room.isDirect);
  }

  /**
   * Get space rooms
   * @returns {array} Space rooms
   */
  getSpaceRooms() {
    return Array.from(this.state.rooms.values()).filter(room => room.isSpace);
  }

  /**
   * Get regular rooms (not DMs or spaces)
   * @returns {array} Regular rooms
   */
  getRegularRooms() {
    return Array.from(this.state.rooms.values()).filter(room => !room.isDirect && !room.isSpace);
  }

  /**
   * Get rooms with unread messages
   * @returns {array} Rooms with unread messages
   */
  getUnreadRooms() {
    return Array.from(this.state.rooms.values()).filter(room => room.unreadCount > 0);
  }

  /**
   * Get total unread count
   * @returns {number} Total unread messages count
   */
  getTotalUnreadCount() {
    return Array.from(this.state.rooms.values()).reduce((total, room) => {
      return total + room.unreadCount;
    }, 0);
  }

  /**
   * Get total highlight count
   * @returns {number} Total highlight count
   */
  getTotalHighlightCount() {
    return Array.from(this.state.rooms.values()).reduce((total, room) => {
      return total + room.highlightCount;
    }, 0);
  }

  /**
   * Clear all room data
   */
  clear() {
    this.updateState({
      rooms: new Map(),
      selectedRoomId: null,
      isLoading: false,
      error: null,
      searchQuery: '',
      filteredRooms: []
    });
  }

  /**
   * Initialize rooms store
   */
  async initialize() {
    try {
      await this.loadRooms();
    } catch (error) {
      console.error('Failed to initialize rooms store:', error);
    }
  }
}

// Create and export global instance
export const roomsStore = new RoomsStore();

export default {
  RoomsStore,
  roomsStore
};