// Chat Area Component
// Main chat interface combining room header, message list, and message input

import * as React from 'react';
import { IconButton } from '../base/Button.js';
import MessageList from './MessageList.js';
import MessageInput from './MessageInput.js';
import { MemberList } from '../members/MemberList.js';
import { roomsStore } from '../../stores/RoomsStore.js';
import { authStore } from '../../stores/AuthStore.js';

/**
 * Room Header Component
 * Displays room information and controls
 */
function RoomHeader({ room, onToggleMemberList, showMemberList }) {
  const [showRoomMenu, setShowRoomMenu] = React.useState(false);

  const getRoomDisplayName = () => {
    if (room.displayName) return room.displayName;
    if (room.name) return room.name;
    if (room.canonicalAlias) return room.canonicalAlias;
    return room.id;
  };

  const getRoomSubtitle = () => {
    if (room.topic) return room.topic;
    if (room.isDirect) return 'Direct message';
    if (room.isSpace) return 'Space';
    return `${room.memberCount || 0} members`;
  };

  const handleRoomMenuAction = (action) => {
    setShowRoomMenu(false);
    switch (action) {
      case 'info':
        console.log('Show room info');
        break;
      case 'settings':
        console.log('Show room settings');
        break;
      case 'invite':
        console.log('Invite users');
        break;
      case 'leave':
        console.log('Leave room');
        break;
      default:
        break;
    }
  };

  return React.createElement('div', {
    className: 'flex items-center justify-between p-4 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]'
  }, [
    // Room info
    React.createElement('div', {
      key: 'room-info',
      className: 'flex items-center space-x-3 flex-1 min-w-0'
    }, [
      // Room avatar
      React.createElement('div', {
        key: 'avatar',
        className: 'w-8 h-8 rounded-full bg-[var(--interactive-primary)] flex items-center justify-center text-[var(--text-inverse)] font-semibold text-sm'
      }, getRoomDisplayName().charAt(0).toUpperCase()),

      // Room details
      React.createElement('div', {
        key: 'details',
        className: 'flex-1 min-w-0'
      }, [
        React.createElement('h1', {
          key: 'name',
          className: 'text-lg font-semibold text-[var(--text-primary)] truncate'
        }, getRoomDisplayName()),

        React.createElement('p', {
          key: 'subtitle',
          className: 'text-sm text-[var(--text-secondary)] truncate'
        }, getRoomSubtitle())
      ])
    ]),

    // Header actions
    React.createElement('div', {
      key: 'actions',
      className: 'flex items-center space-x-2'
    }, [
      // Search button
      React.createElement(IconButton, {
        key: 'search',
        size: 'sm',
        variant: 'ghost',
        title: 'Search in room'
      }, '🔍'),

      // Call button (if supported)
      !room.isDirect && React.createElement(IconButton, {
        key: 'call',
        size: 'sm',
        variant: 'ghost',
        title: 'Start call'
      }, '📞'),

      // Member list toggle
      React.createElement(IconButton, {
        key: 'members',
        size: 'sm',
        variant: 'ghost',
        onClick: onToggleMemberList,
        className: showMemberList ? 'bg-[var(--interactive-secondary)]' : '',
        title: 'Toggle member list'
      }, '👥'),

      // Room menu
      React.createElement('div', {
        key: 'menu-container',
        className: 'relative'
      }, [
        React.createElement(IconButton, {
          key: 'menu-button',
          size: 'sm',
          variant: 'ghost',
          onClick: () => setShowRoomMenu(!showRoomMenu),
          className: showRoomMenu ? 'bg-[var(--interactive-secondary)]' : ''
        }, '⋮'),

        // Dropdown menu
        showRoomMenu && React.createElement('div', {
          key: 'menu',
          className: 'absolute top-full right-0 mt-1 w-48 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-md shadow-lg z-50'
        }, [
          React.createElement('div', {
            key: 'menu-items',
            className: 'py-1'
          }, [
            React.createElement('button', {
              key: 'info',
              className: 'w-full px-4 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--interactive-secondary)] transition-colors',
              onClick: () => handleRoomMenuAction('info')
            }, 'Room Info'),

            React.createElement('button', {
              key: 'invite',
              className: 'w-full px-4 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--interactive-secondary)] transition-colors',
              onClick: () => handleRoomMenuAction('invite')
            }, 'Invite People'),

            React.createElement('button', {
              key: 'settings',
              className: 'w-full px-4 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--interactive-secondary)] transition-colors',
              onClick: () => handleRoomMenuAction('settings')
            }, 'Room Settings'),

            React.createElement('hr', {
              key: 'divider',
              className: 'my-1 border-[var(--border-primary)]'
            }),

            React.createElement('button', {
              key: 'leave',
              className: 'w-full px-4 py-2 text-left text-sm text-[var(--status-error)] hover:bg-[var(--interactive-secondary)] transition-colors',
              onClick: () => handleRoomMenuAction('leave')
            }, 'Leave Room')
          ])
        ])
      ])
    ])
  ]);
}

/**
 * Main Chat Area Component
 */
export function ChatArea({ roomId }) {
  const [room, setRoom] = React.useState(null);
  const [showMemberList, setShowMemberList] = React.useState(false);
  const [authState, setAuthState] = React.useState(authStore.getState());

  // Subscribe to auth store
  React.useEffect(() => {
    const unsubscribe = authStore.subscribe(setAuthState);
    return unsubscribe;
  }, []);

  // Get room data when roomId changes
  React.useEffect(() => {
    if (roomId) {
      const roomData = roomsStore.getRoom(roomId);
      setRoom(roomData);
    } else {
      setRoom(null);
    }
  }, [roomId]);

  // Subscribe to room updates
  React.useEffect(() => {
    if (!roomId) return;

    const handleRoomUpdate = (state) => {
      const updatedRoom = state.rooms.get(roomId);
      if (updatedRoom) {
        setRoom(updatedRoom);
      }
    };

    const unsubscribe = roomsStore.subscribe(handleRoomUpdate);
    return unsubscribe;
  }, [roomId]);

  const toggleMemberList = () => {
    setShowMemberList(!showMemberList);
  };

  const canSendMessages = () => {
    // Check if user has permission to send messages
    // This would typically check the room's power levels
    return authState.isAuthenticated && room && !room.isReadOnly;
  };

  if (!roomId || !room) {
    return React.createElement('div', {
      className: 'flex-1 flex items-center justify-center bg-[var(--bg-primary)]'
    }, [
      React.createElement('div', {
        key: 'no-room',
        className: 'text-center max-w-md mx-auto p-8'
      }, [
        React.createElement('h2', {
          key: 'title',
          className: 'text-xl font-semibold text-[var(--text-secondary)] mb-4'
        }, 'Select a room to start chatting'),

        React.createElement('p', {
          key: 'subtitle',
          className: 'text-[var(--text-tertiary)]'
        }, 'Choose a room from the sidebar to view messages and start conversations')
      ])
    ]);
  }

  return React.createElement('div', {
    className: 'flex-1 flex flex-col bg-[var(--bg-primary)]'
  }, [
    // Room header
    React.createElement(RoomHeader, {
      key: 'header',
      room,
      onToggleMemberList: toggleMemberList,
      showMemberList
    }),

    // Main content area
    React.createElement('div', {
      key: 'content',
      className: 'flex-1 flex min-h-0'
    }, [
      // Messages area
      React.createElement('div', {
        key: 'messages-container',
        className: 'flex-1 flex flex-col min-w-0'
      }, [
        // Message list
        React.createElement(MessageList, {
          key: 'messages',
          roomId
        }),

        // Message input
        React.createElement(MessageInput, {
          key: 'input',
          roomId,
          disabled: !canSendMessages()
        })
      ]),

      // Member list (if shown)
      showMemberList && React.createElement(MemberList, {
        key: 'member-list',
        roomId,
        isVisible: showMemberList,
        onClose: () => setShowMemberList(false)
      })
    ])
  ]);
}

export default ChatArea;