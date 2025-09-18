// Room List Component
// Displays the list of joined rooms with search and filtering capabilities

import * as React from 'react';
import { Input } from '../base/Input.js';
import { Button, IconButton } from '../base/Button.js';
import { roomsStore } from '../../stores/RoomsStore.js';

/**
 * Room Item Component
 * Displays individual room information
 */
function RoomItem({ room, isSelected, onClick }) {
  const getAvatarText = (room) => {
    if (room.displayName) {
      return room.displayName.charAt(0).toUpperCase();
    }
    return room.id.charAt(1).toUpperCase();
  };

  const formatLastActivity = (lastActivity) => {
    if (!lastActivity) return '';

    const now = new Date();
    const diff = now - lastActivity;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return lastActivity.toLocaleDateString();
  };

  const baseClasses = [
    'flex',
    'items-center',
    'space-x-3',
    'p-3',
    'rounded-md',
    'cursor-pointer',
    'transition-colors',
    'group'
  ];

  const stateClasses = isSelected ? [
    'bg-[var(--interactive-primary)]',
    'text-[var(--text-inverse)]'
  ] : [
    'hover:bg-[var(--interactive-secondary)]',
    'text-[var(--text-primary)]'
  ];

  const classes = [...baseClasses, ...stateClasses].join(' ');

  return React.createElement('div', {
    className: classes,
    onClick: () => onClick(room.id)
  }, [
    // Room avatar
    React.createElement('div', {
      key: 'avatar',
      className: `w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
        isSelected
          ? 'bg-[var(--text-inverse)] text-[var(--interactive-primary)]'
          : 'bg-[var(--interactive-primary)] text-[var(--text-inverse)]'
      }`
    }, getAvatarText(room)),

    // Room info
    React.createElement('div', {
      key: 'info',
      className: 'flex-1 min-w-0'
    }, [
      React.createElement('div', {
        key: 'header',
        className: 'flex items-center justify-between'
      }, [
        React.createElement('p', {
          key: 'name',
          className: 'text-sm font-medium truncate'
        }, room.displayName),

        room.lastActivity && React.createElement('span', {
          key: 'time',
          className: `text-xs ${isSelected ? 'text-[var(--text-inverse)]' : 'text-[var(--text-tertiary)]'}`
        }, formatLastActivity(room.lastActivity))
      ]),

      React.createElement('div', {
        key: 'details',
        className: 'flex items-center justify-between mt-1'
      }, [
        room.topic && React.createElement('p', {
          key: 'topic',
          className: `text-xs truncate ${isSelected ? 'text-[var(--text-inverse)]' : 'text-[var(--text-secondary)]'}`
        }, room.topic),

        (room.unreadCount > 0 || room.highlightCount > 0) && React.createElement('div', {
          key: 'badges',
          className: 'flex items-center space-x-1'
        }, [
          room.highlightCount > 0 && React.createElement('span', {
            key: 'highlight',
            className: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[var(--status-error)] text-[var(--text-inverse)]'
          }, room.highlightCount),

          room.unreadCount > 0 && !room.highlightCount && React.createElement('span', {
            key: 'unread',
            className: `inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              isSelected
                ? 'bg-[var(--text-inverse)] text-[var(--interactive-primary)]'
                : 'bg-[var(--interactive-primary)] text-[var(--text-inverse)]'
            }`
          }, room.unreadCount)
        ])
      ])
    ])
  ]);
}

/**
 * Room Category Component
 * Groups rooms by category (DMs, Rooms, Spaces)
 */
function RoomCategory({ title, rooms, selectedRoomId, onRoomSelect, isCollapsed, onToggle }) {
  if (rooms.length === 0) return null;

  return React.createElement('div', {
    className: 'mb-4'
  }, [
    React.createElement('div', {
      key: 'header',
      className: 'flex items-center justify-between px-2 py-1 mb-2'
    }, [
      React.createElement('button', {
        key: 'toggle',
        className: 'flex items-center space-x-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors',
        onClick: onToggle
      }, [
        React.createElement('span', {
          key: 'icon',
          className: `transform transition-transform ${isCollapsed ? 'rotate-0' : 'rotate-90'}`
        }, '▶'),
        React.createElement('span', {
          key: 'title'
        }, title),
        React.createElement('span', {
          key: 'count',
          className: 'text-xs text-[var(--text-tertiary)]'
        }, `(${rooms.length})`)
      ])
    ]),

    !isCollapsed && React.createElement('div', {
      key: 'rooms',
      className: 'space-y-1'
    }, rooms.map(room =>
      React.createElement(RoomItem, {
        key: room.id,
        room,
        isSelected: selectedRoomId === room.id,
        onClick: onRoomSelect
      })
    ))
  ]);
}

/**
 * Main Room List Component
 */
export function RoomList() {
  const [roomsState, setRoomsState] = React.useState(roomsStore.getState());
  const [searchQuery, setSearchQuery] = React.useState('');
  const [collapsedCategories, setCollapsedCategories] = React.useState({
    spaces: false,
    rooms: false,
    dms: false
  });

  // Subscribe to rooms store
  React.useEffect(() => {
    const unsubscribe = roomsStore.subscribe(setRoomsState);
    return unsubscribe;
  }, []);

  // Handle search
  const handleSearchChange = (event) => {
    const query = event.target.value;
    setSearchQuery(query);
    roomsStore.searchRooms(query);
  };

  // Handle room selection
  const handleRoomSelect = (roomId) => {
    roomsStore.selectRoom(roomId);
  };

  // Toggle category collapse
  const toggleCategory = (category) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Get filtered rooms
  const filteredRooms = searchQuery ? roomsState.filteredRooms : Array.from(roomsState.rooms.values());

  // Categorize rooms
  const directMessages = filteredRooms.filter(room => room.isDirect);
  const spaces = filteredRooms.filter(room => room.isSpace);
  const regularRooms = filteredRooms.filter(room => !room.isDirect && !room.isSpace);

  return React.createElement('div', {
    className: 'flex flex-col h-full'
  }, [
    // Search bar
    React.createElement('div', {
      key: 'search',
      className: 'p-3 border-b border-[var(--border-primary)]'
    }, [
      React.createElement(Input, {
        key: 'search-input',
        placeholder: 'Search rooms...',
        value: searchQuery,
        onChange: handleSearchChange,
        className: 'w-full'
      })
    ]),

    // Room categories
    React.createElement('div', {
      key: 'categories',
      className: 'flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin'
    }, [
      React.createElement(RoomCategory, {
        key: 'spaces',
        title: 'Spaces',
        rooms: spaces,
        selectedRoomId: roomsState.selectedRoomId,
        onRoomSelect: handleRoomSelect,
        isCollapsed: collapsedCategories.spaces,
        onToggle: () => toggleCategory('spaces')
      }),

      React.createElement(RoomCategory, {
        key: 'rooms',
        title: 'Rooms',
        rooms: regularRooms,
        selectedRoomId: roomsState.selectedRoomId,
        onRoomSelect: handleRoomSelect,
        isCollapsed: collapsedCategories.rooms,
        onToggle: () => toggleCategory('rooms')
      }),

      React.createElement(RoomCategory, {
        key: 'dms',
        title: 'Direct Messages',
        rooms: directMessages,
        selectedRoomId: roomsState.selectedRoomId,
        onRoomSelect: handleRoomSelect,
        isCollapsed: collapsedCategories.dms,
        onToggle: () => toggleCategory('dms')
      })
    ]),

    // Loading state
    roomsState.isLoading && React.createElement('div', {
      key: 'loading',
      className: 'p-4 text-center text-[var(--text-secondary)]'
    }, 'Loading rooms...'),

    // Error state
    roomsState.error && React.createElement('div', {
      key: 'error',
      className: 'p-4 text-center text-[var(--status-error)]'
    }, roomsState.error),

    // Empty state
    !roomsState.isLoading && !roomsState.error && filteredRooms.length === 0 && React.createElement('div', {
      key: 'empty',
      className: 'p-4 text-center text-[var(--text-secondary)]'
    }, searchQuery ? 'No rooms found' : 'No rooms joined')
  ]);
}

export default RoomList;