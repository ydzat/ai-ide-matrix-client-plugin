// Sidebar Component
// Left sidebar containing user info, room list, and navigation

import * as React from 'react';
import { Button, IconButton } from '../base/Button.js';
import RoomList from '../rooms/RoomList.js';
import { authStore } from '../../stores/AuthStore.js';
import { roomsStore } from '../../stores/RoomsStore.js';
import { themeManager } from '../../styles/themes.js';

/**
 * User Header Component
 * Displays current user information and controls
 */
function UserHeader({ user, onSettingsClick, onLogoutClick }) {
  const [showMenu, setShowMenu] = React.useState(false);

  const getUserDisplayName = () => {
    if (user?.display_name) return user.display_name;
    if (user?.user_id) return user.user_id;
    return 'Unknown User';
  };

  const getUserAvatar = () => {
    const displayName = getUserDisplayName();
    return displayName.charAt(0).toUpperCase();
  };

  const toggleMenu = () => {
    setShowMenu(!showMenu);
  };

  const handleMenuAction = (action) => {
    setShowMenu(false);
    action();
  };

  return React.createElement('div', {
    className: 'relative p-4 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]'
  }, [
    React.createElement('div', {
      key: 'header',
      className: 'flex items-center justify-between'
    }, [
      React.createElement('div', {
        key: 'user-info',
        className: 'flex items-center space-x-3 flex-1 min-w-0'
      }, [
        React.createElement('div', {
          key: 'avatar',
          className: 'w-8 h-8 rounded-full bg-[var(--interactive-primary)] flex items-center justify-center text-[var(--text-inverse)] font-semibold text-sm'
        }, getUserAvatar()),

        React.createElement('div', {
          key: 'info',
          className: 'flex-1 min-w-0'
        }, [
          React.createElement('p', {
            key: 'name',
            className: 'text-sm font-medium text-[var(--text-primary)] truncate'
          }, getUserDisplayName()),

          React.createElement('p', {
            key: 'status',
            className: 'text-xs text-[var(--text-secondary)] truncate'
          }, 'Online')
        ])
      ]),

      React.createElement(IconButton, {
        key: 'menu-button',
        size: 'sm',
        variant: 'ghost',
        onClick: toggleMenu,
        className: 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
      }, '⋮')
    ]),

    // Dropdown menu
    showMenu && React.createElement('div', {
      key: 'menu',
      className: 'absolute top-full right-4 mt-1 w-48 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-md shadow-lg z-50'
    }, [
      React.createElement('div', {
        key: 'menu-items',
        className: 'py-1'
      }, [
        React.createElement('button', {
          key: 'settings',
          className: 'w-full px-4 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--interactive-secondary)] transition-colors',
          onClick: () => handleMenuAction(onSettingsClick)
        }, 'Settings'),

        React.createElement('button', {
          key: 'theme',
          className: 'w-full px-4 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--interactive-secondary)] transition-colors',
          onClick: () => handleMenuAction(() => themeManager.toggleTheme())
        }, 'Toggle Theme'),

        React.createElement('hr', {
          key: 'divider',
          className: 'my-1 border-[var(--border-primary)]'
        }),

        React.createElement('button', {
          key: 'logout',
          className: 'w-full px-4 py-2 text-left text-sm text-[var(--status-error)] hover:bg-[var(--interactive-secondary)] transition-colors',
          onClick: () => handleMenuAction(onLogoutClick)
        }, 'Sign Out')
      ])
    ])
  ]);
}

/**
 * Sidebar Actions Component
 * Quick action buttons for common tasks
 */
function SidebarActions() {
  const handleCreateRoom = () => {
    // TODO: Implement room creation
    console.log('Create room clicked');
  };

  const handleJoinRoom = () => {
    // TODO: Implement room joining
    console.log('Join room clicked');
  };

  const handleStartDM = () => {
    // TODO: Implement DM creation
    console.log('Start DM clicked');
  };

  return React.createElement('div', {
    className: 'p-3 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]'
  }, [
    React.createElement('div', {
      key: 'actions',
      className: 'flex space-x-2'
    }, [
      React.createElement(Button, {
        key: 'create-room',
        size: 'sm',
        variant: 'ghost',
        onClick: handleCreateRoom,
        className: 'flex-1 text-xs'
      }, '+ Room'),

      React.createElement(Button, {
        key: 'join-room',
        size: 'sm',
        variant: 'ghost',
        onClick: handleJoinRoom,
        className: 'flex-1 text-xs'
      }, 'Join'),

      React.createElement(Button, {
        key: 'start-dm',
        size: 'sm',
        variant: 'ghost',
        onClick: handleStartDM,
        className: 'flex-1 text-xs'
      }, 'DM')
    ])
  ]);
}

/**
 * Main Sidebar Component
 */
export function Sidebar() {
  const [authState, setAuthState] = React.useState(authStore.getState());
  const [roomsState, setRoomsState] = React.useState(roomsStore.getState());

  // Subscribe to store changes
  React.useEffect(() => {
    const unsubscribeAuth = authStore.subscribe(setAuthState);
    const unsubscribeRooms = roomsStore.subscribe(setRoomsState);

    return () => {
      unsubscribeAuth();
      unsubscribeRooms();
    };
  }, []);

  const handleSettingsClick = () => {
    // TODO: Implement settings dialog
    console.log('Settings clicked');
  };

  const handleLogoutClick = async () => {
    try {
      await authStore.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getTotalUnreadCount = () => {
    return roomsStore.getTotalUnreadCount();
  };

  const getTotalHighlightCount = () => {
    return roomsStore.getTotalHighlightCount();
  };

  return React.createElement('div', {
    className: 'w-80 bg-[var(--bg-secondary)] border-r border-[var(--border-primary)] flex flex-col h-full'
  }, [
    // User header
    React.createElement(UserHeader, {
      key: 'user-header',
      user: authState.user,
      onSettingsClick: handleSettingsClick,
      onLogoutClick: handleLogoutClick
    }),

    // Quick actions
    React.createElement(SidebarActions, {
      key: 'actions'
    }),

    // Unread summary (if there are unread messages)
    (getTotalUnreadCount() > 0 || getTotalHighlightCount() > 0) && React.createElement('div', {
      key: 'unread-summary',
      className: 'px-3 py-2 bg-[var(--bg-tertiary)] border-b border-[var(--border-primary)]'
    }, [
      React.createElement('div', {
        key: 'summary',
        className: 'flex items-center justify-between text-xs'
      }, [
        React.createElement('span', {
          key: 'text',
          className: 'text-[var(--text-secondary)]'
        }, 'Unread messages'),

        React.createElement('div', {
          key: 'badges',
          className: 'flex items-center space-x-2'
        }, [
          getTotalHighlightCount() > 0 && React.createElement('span', {
            key: 'highlights',
            className: 'px-2 py-1 rounded-full bg-[var(--status-error)] text-[var(--text-inverse)] font-medium'
          }, getTotalHighlightCount()),

          getTotalUnreadCount() > 0 && React.createElement('span', {
            key: 'unread',
            className: 'px-2 py-1 rounded-full bg-[var(--interactive-primary)] text-[var(--text-inverse)] font-medium'
          }, getTotalUnreadCount())
        ])
      ])
    ]),

    // Room list
    React.createElement('div', {
      key: 'room-list',
      className: 'flex-1 overflow-hidden'
    }, [
      React.createElement(RoomList, {
        key: 'rooms'
      })
    ])
  ]);
}

export default Sidebar;